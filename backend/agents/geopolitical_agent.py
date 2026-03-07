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
        supply_chain = self.shared_memory["supply_chain_map"]

        industries = [supply_chain.get("industry", "")]
        materials = [i["name"] for i in supply_chain.get("inputs", []) if i.get("is_us_sourced")]

        await self.emit("Fetching live trade news from the last 24 hours...")
        articles = await fetch_trade_news(industries, materials)
        await self.emit(f"Found {len(articles)} relevant news articles")

        return (
            f"Business Supply Chain:\n{json.dumps(supply_chain, indent=2)}\n\n"
            f"Live News Articles (last 24 hours):\n{json.dumps(articles, indent=2)}"
        )

    async def process_result(self, result: dict[str, Any]) -> dict[str, Any]:
        risk = result.get("overall_escalation_risk", "unknown")
        trend = result.get("risk_trend", "unknown")
        alerts = result.get("actionable_alerts", [])
        await self.emit(f"Escalation risk: {risk} (trend: {trend}) — {len(alerts)} urgent alerts")
        return result
