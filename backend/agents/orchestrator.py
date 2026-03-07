from __future__ import annotations

import asyncio
from typing import Any, Callable, Coroutine

from agents.supply_chain_agent import SupplyChainAgent
from agents.tariff_agent import TariffCalculatorAgent
from agents.supplier_agent import SupplierScoutAgent
from agents.geopolitical_agent import GeopoliticalAgent
from agents.strategy_agent import StrategyArchitectAgent
from services.hs_classifier import classify_inputs
from services.tariff_lookup import get_rate
from services.backboard_client import create_session_thread, write_shared_memory


class Orchestrator:
    """Coordinates the 5-agent pipeline with dependency management.

    Execution flow:
        Agent 1 (Supply Chain) -> RAG HS classification -> Agent 2 + Agent 4 in parallel -> Agent 3 -> Agent 5
    """

    def __init__(
        self,
        business_description: str,
        ws_callback: Callable[[str, str, dict], Coroutine] | None = None,
    ):
        self.business_description = business_description
        self.ws_callback = ws_callback
        self.shared_memory: dict[str, Any] = {}
        self.backboard_thread_id: str | None = None

    async def _ws(self, agent_name: str, event_type: str, data: dict):
        if self.ws_callback:
            await self.ws_callback(agent_name, event_type, data)

    async def _run_rag_classification(self):
        """After Agent 1 completes, run RAG to classify HS codes and look up tariff rates."""
        await self._ws("System", "status", {
            "agent": "System",
            "message": "Running RAG pipeline: classifying HS codes via semantic search...",
            "event_type": "status",
            "status": "working",
        })

        supply_chain = self.shared_memory["supply_chain_map"]
        us_inputs = [i for i in supply_chain.get("inputs", []) if i.get("is_us_sourced")]

        classifications = await classify_inputs(us_inputs)

        # Update supply_chain_map with classified HS codes
        tariff_rates = {}
        for inp in supply_chain.get("inputs", []):
            if inp["name"] in classifications:
                cls = classifications[inp["name"]]
                inp["hs_code"] = cls["hs_code"]
                tariff_rates[inp["name"]] = {
                    "hs_code": cls["hs_code"],
                    "tariff_rate": cls["tariff_rate"],
                    "confidence": cls["confidence"],
                    "reasoning": cls["reasoning"],
                }

        self.shared_memory["supply_chain_map"] = supply_chain
        self.shared_memory["tariff_rates"] = tariff_rates
        self.shared_memory["hs_classifications"] = classifications

        # Persist RAG results to Backboard.io
        await write_shared_memory("tariff_rates", tariff_rates)
        await write_shared_memory("hs_classifications", classifications)

        await self._ws("System", "status", {
            "agent": "System",
            "message": f"Classified {len(classifications)} inputs to HS codes with tariff rates",
            "event_type": "status",
            "status": "complete",
        })

    async def run(self) -> dict[str, Any]:
        """Execute the full multi-agent pipeline."""

        # Initialize Backboard.io session thread
        self.backboard_thread_id = await create_session_thread()

        # Phase 1: Supply Chain Analyst (no dependencies)
        agent1 = SupplyChainAgent(
            self.shared_memory, self._ws, self.business_description
        )
        await agent1.run()

        # Phase 2: RAG HS code classification
        await self._run_rag_classification()

        # Phase 3: Tariff Calculator + Geopolitical Analyst in parallel
        agent2 = TariffCalculatorAgent(self.shared_memory, self._ws)
        agent4 = GeopoliticalAgent(self.shared_memory, self._ws)
        await asyncio.gather(agent2.run(), agent4.run())

        # Phase 4: Supplier Scout (needs supply_chain_map + tariff_impact)
        agent3 = SupplierScoutAgent(self.shared_memory, self._ws)
        await agent3.run()

        # Phase 5: Strategy Architect (needs all 4 outputs)
        agent5 = StrategyArchitectAgent(self.shared_memory, self._ws)
        await agent5.run()

        return self.shared_memory
