from __future__ import annotations

import json
from typing import Any

from agents.base_agent import BaseAgent
from services.news_fetcher import fetch_trade_news


class GeopoliticalAgent(BaseAgent):
    name = "Geopolitical Analyst"
    accent_color = "#F59E0B"
    dependencies = ["supply_chain_map"]
    output_key = "geopolitical_context"

    def system_prompt(self) -> str:
        return (
            "You are a geopolitical intelligence analyst monitoring the US-Canada trade war in real-time.\n"
            "You have been given:\n"
            "1. The business's supply chain map (industries, materials, HS codes)\n"
            "2. Live news articles from the last 24 hours about US-Canada trade, tariffs, and trade policy\n\n"
            "Your job is to:\n"
            "1. Identify news that DIRECTLY affects this specific business's inputs or industry\n"
            "2. Assess whether tariff rates are likely to increase, decrease, or remain stable in the next 30/60/90 days\n"
            "3. Flag any urgent action items (e.g., 'lock in contracts before April 1 tariff increase')\n"
            "4. Adjust risk levels per industry/material based on the latest geopolitical signals\n"
            "5. Identify any new trade agreements, exemptions, or government programs announced\n\n"
            "IMPORTANT:\n"
            "- Only include news from credible sources (Reuters, Bloomberg, Globe and Mail, CBC, government announcements)\n"
            "- Be specific about HOW each article affects THIS business, not generic commentary\n"
            "- If no relevant news exists for a material, say so — don't invent threats\n"
            "- Distinguish between confirmed policy changes and speculation/proposals\n"
            "- Include the actual article title, source, and publication date for credibility\n\n"
            "Output STRICT JSON. Do not include any text outside the JSON object.\n"
            "The JSON must match this structure:\n"
            "- analysis_timestamp (string ISO 8601)\n"
            "- news_window (string)\n"
            "- overall_escalation_risk (string: stable/elevated/high/critical)\n"
            "- risk_trend (string: improving/stable/worsening)\n"
            "- headline_summary (string — 1-2 sentence summary)\n"
            "- relevant_articles (array of objects with: title, source, published, url, relevance_to_business, "
            "affected_inputs, affected_hs_codes, sentiment, tariff_change_signal)\n"
            "- industry_risk_adjustments (array of objects with: industry, base_risk, adjusted_risk, reason)\n"
            "- actionable_alerts (array of objects with: urgency, alert, source_article, deadline)\n"
            "- trade_agreement_updates (array of strings)\n"
            "- government_program_updates (array of strings)"
        )

    async def build_user_message(self) -> str:
        supply_chain = self.shared_memory.get("supply_chain_map") or {}
        if not isinstance(supply_chain, dict):
            supply_chain = {}

        industry = supply_chain.get("industry") or ""
        industries = [industry] if industry else []
        inputs_list = supply_chain.get("inputs") or []
        materials = [
            i.get("name") or ""
            for i in inputs_list
            if isinstance(i, dict) and i.get("is_us_sourced")
        ]
        materials = [m for m in materials if m]

        await self.emit("Fetching live trade news from the last 24 hours...")
        try:
            articles = await fetch_trade_news(industries, materials)
        except Exception:
            articles = []
        await self.emit(f"Found {len(articles)} relevant news articles")

        if not articles:
            news_section = (
                "No live news articles could be fetched (RSS/API may be temporarily unavailable). "
                "Based your analysis only on the business supply chain below. "
                "State that no recent news was available and focus on structural tariff risk and industry context."
            )
        else:
            news_section = f"Live News Articles (last 24 hours):\n{json.dumps(articles, indent=2)}"

        return (
            f"Business Supply Chain:\n{json.dumps(supply_chain, indent=2)}\n\n"
            f"{news_section}"
        )

    def fallback_output(self) -> dict[str, Any]:
        return {
            "overall_escalation_risk": "unknown",
            "risk_trend": "unknown",
            "headline_summary": "Geopolitical analysis unavailable.",
            "relevant_articles": [],
            "actionable_alerts": [],
            "industry_risk_adjustments": [],
            "trade_agreement_updates": [],
            "government_program_updates": [],
        }

    async def process_result(self, result: dict[str, Any]) -> dict[str, Any]:
        risk = result.get("overall_escalation_risk", "unknown")
        trend = result.get("risk_trend", "unknown")
        alerts = result.get("actionable_alerts", [])
        await self.emit(f"Escalation risk: {risk} (trend: {trend}) — {len(alerts)} urgent alerts")
        return result
