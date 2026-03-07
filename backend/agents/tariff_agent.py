from __future__ import annotations

import asyncio
import json
import time as _time
from typing import Any

from agents.base_agent import BaseAgent, AgentStatus
from services.tariff_lookup import get_rate


class TariffCalculatorAgent(BaseAgent):
    name = "Tariff Calculator"
    accent_color = "#EF4444"
    dependencies = ["supply_chain_map", "tariff_rates"]
    output_key = "tariff_impact"

    def system_prompt(self) -> str:
        return (
            "You are a tariff impact analyst for Canadian businesses. You will be given:\n"
            "1. A supply chain map with inputs and products\n"
            "2. Pre-calculated tariff costs per input (computed from our CBSA tariff database)\n"
            "3. The total tariff exposure number\n\n"
            "Your job is to provide QUALITATIVE analysis only — the numbers are already calculated.\n"
            "Specifically:\n"
            "- Assign a risk_level (low/medium/high/critical) based on margin erosion\n"
            "- For each product, estimate current_margin_pct, margin_after_tariff_pct, "
            "and whether it remains profitable (is_profitable_after_tariff)\n"
            "- For each product, calculate break_even_price_increase_pct and break_even_tariff_rate_pct\n"
            "- Provide strategic context for the numbers\n\n"
            "IMPORTANT: Do NOT recalculate total_tariff_exposure, annual_tariff_cost, or input_impacts. "
            "These are provided to you from our database and are authoritative. Copy them exactly.\n\n"
            "Output STRICT JSON. Do not include any text outside the JSON object.\n"
            "The JSON must match this structure:\n"
            "- total_tariff_exposure (number — USE THE PROVIDED VALUE)\n"
            "- total_margin_erosion_pct (number)\n"
            "- risk_level (string: low/medium/high/critical)\n"
            "- input_impacts (array — COPY FROM PROVIDED DATA)\n"
            "- product_impacts (array of objects with: product_name, current_margin_pct, margin_after_tariff_pct, "
            "margin_erosion_pct, break_even_price_increase_pct, break_even_tariff_rate_pct, is_profitable_after_tariff)\n"
            "- scenarios (array — USE THE PROVIDED SCENARIO DATA)"
        )

    def _compute_tariff_impacts(self) -> dict[str, Any]:
        """Compute tariff costs using real arithmetic against the CBSA tariff database.

        Returns a dict with input_impacts, total_tariff_exposure, and escalation scenarios,
        all derived from actual tariff rates — not LLM-generated numbers.
        """
        supply_chain = self.shared_memory.get("supply_chain_map") or {}
        tariff_rates = self.shared_memory.get("tariff_rates") or {}
        inputs_list = supply_chain.get("inputs", [])
        revenue = supply_chain.get("annual_revenue_estimate", 0) or 0

        input_impacts: list[dict[str, Any]] = []
        total_exposure = 0.0

        for inp in inputs_list:
            name = inp.get("name", "unknown")
            spend = float(inp.get("estimated_annual_spend") or 0)
            is_us = inp.get("is_us_sourced", False)

            if not is_us or spend == 0:
                continue

            # Look up rate from RAG classification results first, then fall back to DB
            hs_code = inp.get("hs_code") or ""
            rate_info = tariff_rates.get(name) or {}
            if isinstance(rate_info, dict):
                rate_pct = float(rate_info.get("tariff_rate") or 0)
                hs_code = rate_info.get("hs_code") or hs_code
                confidence = float(rate_info.get("confidence") or 0)
            else:
                rate_pct = float(rate_info) if rate_info else 0

            # If RAG didn't classify, try direct DB lookup
            if rate_pct == 0 and hs_code:
                rate_pct = get_rate(hs_code)

            tariff_cost = spend * (rate_pct / 100.0)
            total_exposure += tariff_cost

            input_impacts.append({
                "input_name": name,
                "hs_code": hs_code,
                "current_tariff_rate": rate_pct,
                "annual_spend": spend,
                "annual_tariff_cost": round(tariff_cost, 2),
                "pct_of_total_exposure": 0.0,  # filled below
            })

        # Compute percentage of total exposure per input
        if total_exposure > 0:
            for imp in input_impacts:
                imp["pct_of_total_exposure"] = round(
                    (imp["annual_tariff_cost"] / total_exposure) * 100, 1
                )

        # Compute margin erosion (tariff cost as % of revenue)
        margin_erosion_pct = 0.0
        if revenue > 0:
            margin_erosion_pct = round((total_exposure / revenue) * 100, 2)

        # Build escalation scenarios by scaling from current effective rates
        total_us_spend = sum(imp["annual_spend"] for imp in input_impacts)
        scenarios = []
        for scenario_rate in [25, 30, 35, 40]:
            scenario_cost = total_us_spend * (scenario_rate / 100.0)
            scenario_erosion = round((scenario_cost / revenue) * 100, 2) if revenue > 0 else 0
            scenarios.append({
                "tariff_rate_pct": scenario_rate,
                "total_tariff_cost": round(scenario_cost, 2),
                "total_margin_erosion_pct": scenario_erosion,
                "products_unprofitable": 0,  # Gemini fills this with qualitative judgment
            })

        return {
            "input_impacts": input_impacts,
            "total_tariff_exposure": round(total_exposure, 2),
            "total_margin_erosion_pct": margin_erosion_pct,
            "total_us_spend": round(total_us_spend, 2),
            "revenue": revenue,
            "scenarios": scenarios,
        }

    async def build_user_message(self) -> str:
        supply_chain = self.shared_memory.get("supply_chain_map") or {}
        # Compute real numbers and attach them to the message
        computed = self._compute_tariff_impacts()
        self._computed = computed  # stash for process_result

        await self.emit(
            f"Computed tariff costs for {len(computed['input_impacts'])} inputs: "
            f"${computed['total_tariff_exposure']:,.0f} total exposure"
        )

        return (
            f"Supply Chain Map:\n{json.dumps(supply_chain, indent=2)}\n\n"
            f"PRE-CALCULATED TARIFF DATA (from CBSA database — do NOT change these numbers):\n"
            f"{json.dumps(computed, indent=2)}"
        )

    async def process_result(self, result: dict[str, Any] | None) -> dict[str, Any]:
        """Merge Gemini's qualitative analysis with our computed numbers.

        The authoritative numbers (input_impacts, total_tariff_exposure, scenarios)
        come from _compute_tariff_impacts(). Gemini provides risk_level, product_impacts,
        and products_unprofitable counts.
        """
        computed = getattr(self, "_computed", None) or self._compute_tariff_impacts()

        # Start with computed data as the base
        output: dict[str, Any] = {
            "total_tariff_exposure": computed["total_tariff_exposure"],
            "total_margin_erosion_pct": computed["total_margin_erosion_pct"],
            "input_impacts": computed["input_impacts"],
            "scenarios": computed["scenarios"],
            "risk_level": "high",
            "product_impacts": [],
        }

        # Overlay Gemini's qualitative analysis
        if result and isinstance(result, dict):
            output["risk_level"] = result.get("risk_level", output["risk_level"])
            output["product_impacts"] = result.get("product_impacts", [])

            # Merge products_unprofitable from Gemini into our scenarios
            gemini_scenarios = result.get("scenarios", [])
            for gs in gemini_scenarios:
                rate = gs.get("tariff_rate_pct")
                unprofitable = gs.get("products_unprofitable", 0)
                for s in output["scenarios"]:
                    if s["tariff_rate_pct"] == rate:
                        s["products_unprofitable"] = unprofitable
                        break

            # Use Gemini's margin erosion only if we couldn't compute it (no revenue)
            if computed["revenue"] == 0 and result.get("total_margin_erosion_pct"):
                output["total_margin_erosion_pct"] = result["total_margin_erosion_pct"]

        exposure = output["total_tariff_exposure"]
        risk = output["risk_level"]
        n_inputs = len(output["input_impacts"])
        await self.emit(
            f"Total tariff exposure: ${exposure:,.0f} across {n_inputs} inputs — Risk: {risk}"
        )
        return output

    def fallback_output(self) -> dict[str, Any]:
        """Minimal tariff impact when agent fails before run() completes (e.g. dependency timeout)."""
        try:
            return self._fallback_tariff_impact()
        except Exception:
            return {
                "total_tariff_exposure": 0,
                "total_margin_erosion_pct": 0,
                "risk_level": "unknown",
                "input_impacts": [],
                "product_impacts": [],
                "scenarios": [],
            }

    def _fallback_tariff_impact(self) -> dict[str, Any]:
        """Return computed tariff impact when Gemini fails entirely."""
        computed = self._compute_tariff_impacts()

        # Determine risk level from margin erosion
        erosion = computed["total_margin_erosion_pct"]
        if erosion >= 15:
            risk = "critical"
        elif erosion >= 8:
            risk = "high"
        elif erosion >= 3:
            risk = "medium"
        else:
            risk = "low"

        return {
            "total_tariff_exposure": computed["total_tariff_exposure"],
            "total_margin_erosion_pct": computed["total_margin_erosion_pct"],
            "risk_level": risk,
            "input_impacts": computed["input_impacts"],
            "product_impacts": [],
            "scenarios": computed["scenarios"],
        }

    async def run(self):
        """Run tariff calculation; on timeout or API error use fallback so pipeline continues."""
        t0 = _time.time()
        try:
            await self.wait_for_dependencies()
            self.status = AgentStatus.WORKING
            await self.emit("Starting analysis...")
            user_message = await self.build_user_message()
            await self.emit("Calling Gemini for qualitative analysis...")
            result = await self.call_gemini(user_message)
            await self.emit("Merging computed data with qualitative analysis...")
            processed = await self.process_result(result)
            self.shared_memory[self.output_key] = processed
            await self._write_backboard_memory(self.output_key, processed)
            await self._pad_to_min_duration(t0)
            self.status = AgentStatus.COMPLETE
            await self.emit("Analysis complete.")
        except (asyncio.TimeoutError, Exception) as e:
            self.status = AgentStatus.ERROR
            await self.emit(f"Error: {str(e)} — using computed fallback", event_type="error")
            fallback = self._fallback_tariff_impact()
            self.shared_memory[self.output_key] = fallback
            await self._write_backboard_memory(self.output_key, fallback)
            await self._pad_to_min_duration(t0)
            # Do not re-raise so Strategy Architect can still run
