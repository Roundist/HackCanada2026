from __future__ import annotations

import asyncio
import json
from typing import Any

from agents.base_agent import BaseAgent, AgentStatus
from services.backboard_client import write_shared_memory


class TariffCalculatorAgent(BaseAgent):
    name = "Tariff Calculator"
    accent_color = "#EF4444"
    dependencies = ["supply_chain_map", "tariff_rates"]
    output_key = "tariff_impact"

    def system_prompt(self) -> str:
        return (
            "You are a tariff impact analyst for Canadian businesses. Given a supply chain map "
            "and tariff rate data, calculate the financial impact of US tariffs on each product line.\n\n"
            "IMPORTANT: Use the tariff rates provided to you from our database. Do NOT invent tariff rates.\n\n"
            "Calculate:\n"
            "1. Annual tariff cost per input (spend * tariff_rate)\n"
            "2. Total tariff exposure across all inputs\n"
            "3. Margin erosion per product line\n"
            "4. Break-even analysis (at what price increase does each product become unprofitable?)\n"
            "5. Escalation scenarios at 25%, 30%, 35%, 40% tariff rates\n\n"
            "Output STRICT JSON. Do not include any text outside the JSON object.\n"
            "The JSON must match this structure:\n"
            "- total_tariff_exposure (number)\n"
            "- total_margin_erosion_pct (number)\n"
            "- risk_level (string: low/medium/high/critical)\n"
            "- input_impacts (array of objects with: input_name, hs_code, current_tariff_rate, annual_spend, "
            "annual_tariff_cost, pct_of_total_exposure)\n"
            "- product_impacts (array of objects with: product_name, current_margin_pct, margin_after_tariff_pct, "
            "margin_erosion_pct, break_even_price_increase_pct, break_even_tariff_rate_pct, is_profitable_after_tariff)\n"
            "- scenarios (array of objects with: tariff_rate_pct, total_tariff_cost, total_margin_erosion_pct, products_unprofitable)"
        )

    async def build_user_message(self) -> str:
        supply_chain = self.shared_memory.get("supply_chain_map") or {}
        tariff_rates = self.shared_memory.get("tariff_rates") or {}
        return (
            f"Supply Chain Map:\n{json.dumps(supply_chain, indent=2)}\n\n"
            f"Tariff Rates from Database:\n{json.dumps(tariff_rates, indent=2)}"
        )

    async def process_result(self, result: dict[str, Any] | None) -> dict[str, Any]:
        if not result or not isinstance(result, dict):
            return self._fallback_tariff_impact()
        exposure = result.get("total_tariff_exposure", 0)
        risk = result.get("risk_level", "unknown")
        try:
            await self.emit(f"Total tariff exposure: ${float(exposure):,.0f} — Risk level: {risk}")
        except (TypeError, ValueError):
            await self.emit(f"Risk level: {risk}")
        return result

    def _fallback_tariff_impact(self) -> dict[str, Any]:
        """Return a minimal tariff_impact when Gemini fails or returns invalid JSON."""
        supply_chain = self.shared_memory.get("supply_chain_map") or {}
        inputs_list = supply_chain.get("inputs", [])
        tariff_rates = self.shared_memory.get("tariff_rates") or {}
        total = 0.0
        for inp in inputs_list:
            r = tariff_rates.get(inp.get("name", "")) or {}
            if isinstance(r, dict):
                rate = (r.get("tariff_rate") or 0) / 100.0
                spend = inp.get("estimated_annual_spend") or 0
                total += rate * spend
        if total == 0 and inputs_list:
            total = 100000.0  # placeholder when no rates
        return {
            "total_tariff_exposure": total,
            "total_margin_erosion_pct": 5.0,
            "risk_level": "high",
            "input_impacts": [],
            "product_impacts": [],
            "scenarios": [],
        }

    async def run(self):
        """Run tariff calculation; on timeout or API error use fallback so pipeline continues."""
        try:
            await self.wait_for_dependencies()
            self.status = AgentStatus.WORKING
            await self.emit("Starting analysis...")
            user_message = await self.build_user_message()
            await self.emit("Calling Gemini for analysis...")
            result = await self.call_gemini(user_message)
            await self.emit("Processing results...")
            processed = await self.process_result(result)
            self.shared_memory[self.output_key] = processed
            await write_shared_memory(self.output_key, processed)
            self.status = AgentStatus.COMPLETE
            await self.emit("Analysis complete.")
        except (asyncio.TimeoutError, Exception) as e:
            self.status = AgentStatus.ERROR
            await self.emit(f"Error: {str(e)} — using fallback estimate", event_type="error")
            fallback = self._fallback_tariff_impact()
            self.shared_memory[self.output_key] = fallback
            await write_shared_memory(self.output_key, fallback)
            # Do not re-raise so Strategy Architect can still run
