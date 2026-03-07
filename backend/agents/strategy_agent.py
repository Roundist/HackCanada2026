from __future__ import annotations

import json
from typing import Any

from agents.base_agent import BaseAgent


class StrategyArchitectAgent(BaseAgent):
    name = "Strategy Architect"
    accent_color = "#8B5CF6"
    dependencies = ["supply_chain_map", "tariff_impact", "alternative_suppliers", "geopolitical_context"]
    output_key = "survival_plan"

    def system_prompt(self) -> str:
        return (
            "You are a strategic business consultant creating a Trade War Survival Plan for a "
            "Canadian business affected by US tariffs. You have access to:\n"
            "1. The business's supply chain map\n"
            "2. The tariff impact analysis\n"
            "3. Alternative supplier options\n"
            "4. Live geopolitical intelligence (last 24h trade news, escalation risk assessment, actionable alerts)\n\n"
            "Create a comprehensive, actionable survival plan with specific recommendations. "
            "Be direct, practical, and prioritize by impact and feasibility. This plan should "
            "feel like advice from an expensive consultant, not a generic report.\n\n"
            "IMPORTANT: Incorporate the geopolitical context into your recommendations. "
            "If the Geopolitical Analyst has flagged urgent alerts (e.g., imminent tariff increases), "
            "these should be reflected as TOP priority actions with specific deadlines. "
            "Adjust risk assessments based on the escalation trend. Reference specific news "
            "articles when justifying urgency.\n\n"
            "Output STRICT JSON. Do not include any text outside the JSON object.\n"
            "The JSON must match this structure:\n"
            "- executive_summary (object with: business_name, total_tariff_exposure, risk_level, headline, key_finding)\n"
            "- priority_actions (array ranked by estimated_savings, each with: rank, action, description, "
            "estimated_savings, implementation_effort, timeline_days, category)\n"
            "- pricing_strategy (object with: recommendation, explanation, suggested_price_increases array)\n"
            "- market_diversification (object with: current_us_export_pct, recommendations, government_programs)\n"
            "- timeline (object with: days_30, days_60, days_90 — each an array of strings)\n"
            "- risks (array of objects with: risk, probability, mitigation)"
        )

    def fallback_output(self) -> dict[str, Any]:
        return {
            "executive_summary": {"business_name": "Unknown", "total_tariff_exposure": 0, "risk_level": "unknown", "headline": "Analysis incomplete.", "key_finding": "One or more agents failed; partial results only."},
            "priority_actions": [],
            "pricing_strategy": {"recommendation": "", "explanation": "", "suggested_price_increases": []},
            "market_diversification": {"current_us_export_pct": 0, "recommendations": [], "government_programs": []},
            "timeline": {"days_30": [], "days_60": [], "days_90": []},
            "risks": [],
        }

    async def build_user_message(self) -> str:
        supply = self.shared_memory.get("supply_chain_map") or {}
        tariff = self.shared_memory.get("tariff_impact") or {}
        suppliers = self.shared_memory.get("alternative_suppliers") or {}
        geo = self.shared_memory.get("geopolitical_context") or {}
        return (
            f"Supply Chain Map:\n{json.dumps(supply, indent=2)}\n\n"
            f"Tariff Impact:\n{json.dumps(tariff, indent=2)}\n\n"
            f"Alternative Suppliers:\n{json.dumps(suppliers, indent=2)}\n\n"
            f"Geopolitical Context:\n{json.dumps(geo, indent=2)}"
        )

    async def process_result(self, result: dict[str, Any]) -> dict[str, Any]:
        summary = result.get("executive_summary", {})
        actions = result.get("priority_actions", [])
        await self.emit(
            f"Survival plan ready — {len(actions)} priority actions identified. "
            f"Headline: {summary.get('headline', 'N/A')}"
        )
        return result
