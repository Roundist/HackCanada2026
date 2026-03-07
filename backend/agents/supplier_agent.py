from __future__ import annotations

import json
from typing import Any

from agents.base_agent import BaseAgent, AgentStatus


class SupplierScoutAgent(BaseAgent):
    name = "Supplier Scout"
    accent_color = "#10B981"
    dependencies = ["supply_chain_map", "tariff_rates"]
    output_key = "alternative_suppliers"

    def system_prompt(self) -> str:
        return (
            "You are a procurement specialist helping Canadian businesses find alternative suppliers "
            "to replace US imports affected by tariffs. Given a list of US-sourced inputs ranked by "
            "tariff impact, identify potential Canadian and non-US suppliers.\n\n"
            "For each high-impact input, research and suggest:\n"
            "1. Canadian domestic suppliers (prioritize these)\n"
            "2. Non-US international alternatives (EU, Asia, Mexico)\n"
            "3. Estimated cost comparison vs current US source (before and after tariff)\n"
            "4. Switching feasibility (lead time, quality considerations)\n\n"
            "IMPORTANT: Be specific with supplier categories but honest about limitations. "
            "Frame suggestions as 'types of suppliers to investigate' with industry associations "
            "and directories to search, rather than claiming specific verified supplier names "
            "unless you are highly confident they exist.\n\n"
            "Output STRICT JSON. Do not include any text outside the JSON object.\n"
            "The JSON must match this structure:\n"
            "- alternatives (array of objects with: for_input, current_us_cost, current_us_cost_with_tariff, "
            "canadian_alternatives (array with: supplier_category, region, estimated_cost, cost_vs_us_pretariff_pct, "
            "cost_vs_us_posttariff_pct, switching_feasibility, lead_time_weeks, notes, directory_to_search), "
            "international_alternatives (array with: country, supplier_category, estimated_cost, notes), recommendation)\n"
            "- total_potential_savings (number)\n"
            "- priority_switches (array of strings)"
        )

    def fallback_output(self) -> dict[str, Any]:
        return self._compute_alternatives()

    def _compute_alternatives(self) -> dict[str, Any]:
        """Build alternative-supplier output from supply chain + tariff data. No Gemini required."""
        supply_chain = self.shared_memory.get("supply_chain_map") or {}
        tariff_impact = self.shared_memory.get("tariff_impact") or {}
        tariff_rates = self.shared_memory.get("tariff_rates") or {}
        if not isinstance(supply_chain, dict):
            supply_chain = {}
        if not isinstance(tariff_impact, dict):
            tariff_impact = {}
        if not isinstance(tariff_rates, dict):
            tariff_rates = {}

        input_impacts = tariff_impact.get("input_impacts") or []
        # If no tariff_impact yet (e.g. Tariff agent failed), derive from supply_chain + tariff_rates
        if not input_impacts:
            inputs_list = supply_chain.get("inputs") or []
            for inp in inputs_list:
                if not inp.get("is_us_sourced"):
                    continue
                name = inp.get("name") or "Unknown input"
                spend = float(inp.get("estimated_annual_spend") or 0)
                if spend <= 0:
                    continue
                rate_info = tariff_rates.get(name) or {}
                rate_pct = float(rate_info.get("tariff_rate", 0) if isinstance(rate_info, dict) else rate_info or 0)
                tariff_cost = spend * (rate_pct / 100.0)
                input_impacts.append({
                    "input_name": name,
                    "annual_spend": spend,
                    "annual_tariff_cost": round(tariff_cost, 2),
                    "current_tariff_rate": rate_pct,
                })

        # Sort by tariff cost descending (highest impact first)
        input_impacts = sorted(
            input_impacts,
            key=lambda x: float(x.get("annual_tariff_cost") or 0),
            reverse=True,
        )

        alternatives: list[dict[str, Any]] = []
        total_savings = 0.0
        industry = (supply_chain.get("industry") or "general").lower()

        for imp in input_impacts:
            input_name = imp.get("input_name") or "Unknown"
            spend = float(imp.get("annual_spend") or 0)
            tariff_cost = float(imp.get("annual_tariff_cost") or 0)
            if spend == 0 and tariff_cost > 0:
                spend = tariff_cost * 5  # rough pre-tariff spend if only cost known
            cost_with_tariff = spend + tariff_cost
            total_savings += tariff_cost

            alternatives.append({
                "for_input": input_name,
                "current_us_cost": round(spend, 2),
                "current_us_cost_with_tariff": round(cost_with_tariff, 2),
                "canadian_alternatives": [
                    {
                        "supplier_category": f"Canadian {industry} suppliers",
                        "region": "Canada",
                        "estimated_cost": "Compare via RFQ",
                        "cost_vs_us_pretariff_pct": None,
                        "cost_vs_us_posttariff_pct": None,
                        "switching_feasibility": "High — no tariff; search Industry Canada, provincial directories",
                        "lead_time_weeks": "4–12",
                        "notes": "Prioritize Canadian sources to eliminate US tariff exposure.",
                        "directory_to_search": "Industry Canada, provincial trade directories, Canadian Trade Index",
                    },
                ],
                "international_alternatives": [
                    {"country": "Mexico", "supplier_category": "USMCA partners", "estimated_cost": "Varies", "notes": "USMCA may reduce or eliminate tariffs; verify rules of origin."},
                    {"country": "EU", "supplier_category": "CETA partners", "estimated_cost": "Varies", "notes": "CETA preferential rates; consider EU suppliers for qualifying goods."},
                ],
                "recommendation": f"High tariff exposure on {input_name}. Prioritize Canadian or FTA sources; request quotes and compare total landed cost.",
            })

        priority_switches = [a["for_input"] for a in alternatives]

        return {
            "alternatives": alternatives,
            "total_potential_savings": round(total_savings, 2),
            "priority_switches": priority_switches,
        }

    async def build_user_message(self) -> str:
        supply_chain = self.shared_memory.get("supply_chain_map") or {}
        tariff_rates = self.shared_memory.get("tariff_rates") or {}
        if not isinstance(supply_chain, dict):
            supply_chain = {}
        if not isinstance(tariff_rates, dict):
            tariff_rates = {}
        tariff_impact = self.shared_memory.get("tariff_impact")
        parts = [
            f"Supply Chain Map:\n{json.dumps(supply_chain, indent=2)}",
            f"Tariff Rates (from CBSA database):\n{json.dumps(tariff_rates, indent=2)}",
        ]
        if tariff_impact:
            parts.append(f"Tariff Impact Analysis:\n{json.dumps(tariff_impact, indent=2)}")
        return "\n\n".join(parts)

    async def process_result(self, result: dict[str, Any]) -> dict[str, Any]:
        alts = result.get("alternatives", [])
        savings = result.get("total_potential_savings", 0)
        await self.emit(f"Found alternatives for {len(alts)} inputs — potential savings: ${savings:,.0f}")
        return result

    async def run(self):
        """Run Supplier Scout: try Gemini for richer suggestions; on failure use computed alternatives so we never error."""
        import time
        t0 = time.time()
        await self.wait_for_dependencies()

        self.status = AgentStatus.WORKING
        await self.emit("Computing alternatives from tariff impact data...")

        computed = self._compute_alternatives()
        n_inputs = len(computed["alternatives"])
        total_savings = computed["total_potential_savings"]

        try:
            await self.emit("Calling Gemini for detailed supplier suggestions...")
            user_message = await self.build_user_message()
            result = await self.call_gemini(user_message)
            processed = await self.process_result(result)
            # Use Gemini output if it has at least the same structure
            if processed.get("alternatives") is not None or processed.get("total_potential_savings") is not None:
                output = processed
            else:
                output = computed
                await self.emit("Using rule-based alternatives (Gemini output incomplete).")
        except Exception:
            output = computed
            await self.emit(
                f"Using rule-based alternatives for {n_inputs} inputs — potential savings: ${total_savings:,.0f} (Gemini unavailable).",
                event_type="status",
            )

        self.shared_memory[self.output_key] = output
        await self._write_backboard_memory(self.output_key, output)
        await self._pad_to_min_duration(t0)
        self.status = AgentStatus.COMPLETE
        await self.emit("Analysis complete.")
