from __future__ import annotations

import json
from typing import Any

from agents.base_agent import BaseAgent


class SupplierScoutAgent(BaseAgent):
    name = "Supplier Scout"
    accent_color = "#10B981"
    dependencies = ["supply_chain_map", "tariff_impact"]
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

    async def build_user_message(self) -> str:
        supply_chain = self.shared_memory["supply_chain_map"]
        tariff_impact = self.shared_memory["tariff_impact"]
        return (
            f"Supply Chain Map:\n{json.dumps(supply_chain, indent=2)}\n\n"
            f"Tariff Impact Analysis:\n{json.dumps(tariff_impact, indent=2)}"
        )

    async def process_result(self, result: dict[str, Any]) -> dict[str, Any]:
        alts = result.get("alternatives", [])
        savings = result.get("total_potential_savings", 0)
        await self.emit(f"Found alternatives for {len(alts)} inputs — potential savings: ${savings:,.0f}")
        return result
