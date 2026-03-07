from __future__ import annotations

import json
from typing import Any

from agents.base_agent import BaseAgent


class SupplyChainAgent(BaseAgent):
    name = "Supply Chain Analyst"
    accent_color = "#3B82F6"
    dependencies: list[str] = []
    output_key = "supply_chain_map"

    def __init__(self, shared_memory: dict[str, Any], ws_callback, business_description: str):
        super().__init__(shared_memory, ws_callback)
        self.business_description = business_description

    def system_prompt(self) -> str:
        return (
            "You are a supply chain analyst specializing in Canadian businesses affected by US tariffs.\n"
            "Given a business description, extract and structure the following:\n\n"
            "1. All raw materials, components, and inputs the business uses\n"
            "2. The country of origin for each input (infer from context or industry norms)\n"
            "3. For US-sourced inputs, provide a clear product description for each input "
            "(used by the RAG pipeline to classify HS codes via semantic search against the CBSA tariff database)\n"
            "4. Estimate annual spend per input based on the business size and industry benchmarks\n\n"
            "Output STRICT JSON. Do not include any text outside the JSON object.\n"
            "The JSON must match this structure:\n"
            "- business_name (string)\n"
            "- industry (string)\n"
            "- annual_revenue_estimate (number)\n"
            "- inputs (array of objects with: name, description, country_of_origin, hs_code (always null — will be filled by RAG), "
            "estimated_annual_spend, is_us_sourced, criticality)\n"
            "- products (array of objects with: name, inputs_used, estimated_annual_revenue, primary_market)"
        )

    async def build_user_message(self) -> str:
        return self.business_description

    async def process_result(self, result: dict[str, Any]) -> dict[str, Any]:
        await self.emit(f"Mapped {len(result.get('inputs', []))} supply chain inputs")
        us_inputs = [i for i in result.get("inputs", []) if i.get("is_us_sourced")]
        await self.emit(f"Identified {len(us_inputs)} US-sourced inputs exposed to tariffs")
        return result
