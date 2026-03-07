from __future__ import annotations

import json
from typing import Any

from agents.base_agent import BaseAgent


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
        supply_chain = self.shared_memory["supply_chain_map"]
        tariff_rates = self.shared_memory["tariff_rates"]
        return (
            f"Supply Chain Map:\n{json.dumps(supply_chain, indent=2)}\n\n"
            f"Tariff Rates from Database:\n{json.dumps(tariff_rates, indent=2)}"
        )

    async def process_result(self, result: dict[str, Any]) -> dict[str, Any]:
        exposure = result.get("total_tariff_exposure", 0)
        risk = result.get("risk_level", "unknown")
        await self.emit(f"Total tariff exposure: ${exposure:,.0f} — Risk level: {risk}")
        return result
