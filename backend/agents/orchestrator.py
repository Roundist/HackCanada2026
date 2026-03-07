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
        Agent 1 + news pre-fetch -> RAG HS classification (parallel) -> Agents 2+3+4 in parallel -> Agent 5
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

        supply_chain = self.shared_memory.get("supply_chain_map") or {}
        us_inputs = [i for i in supply_chain.get("inputs", []) if i.get("is_us_sourced")]

        try:
            classifications = await classify_inputs(us_inputs)
        except Exception:
            classifications = {}
            await self._ws("System", "status", {
                "agent": "System",
                "message": "RAG classification failed; Tariff Calculator will use fallback.",
                "event_type": "status",
                "status": "complete",
            })

        # Update supply_chain_map with classified HS codes
        tariff_rates = {}
        for inp in supply_chain.get("inputs", []):
            name = inp.get("name")
            if name and name in classifications:
                cls = classifications[name]
                inp["hs_code"] = cls.get("hs_code")
                tariff_rates[name] = {
                    "hs_code": cls.get("hs_code"),
                    "tariff_rate": cls.get("tariff_rate", 0),
                    "confidence": cls.get("confidence", 0),
                    "reasoning": cls.get("reasoning", ""),
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

    async def _phase_delay(self, label: str, seconds: float):
        """Broadcast a status message and pause between phases for demo pacing."""
        await self._ws("System", "status", {
            "agent": "System",
            "message": label,
            "event_type": "status",
            "status": "working",
        })
        await asyncio.sleep(seconds)

    async def run(self) -> dict[str, Any]:
        """Execute the full multi-agent pipeline.

        Optimised flow:
            Phase 1: Agent 1 (Supply Chain) + news pre-fetch in parallel
            Phase 2: RAG HS code classification (parallel per input)
            Phase 3: Agents 2 + 3 + 4 all in parallel
            Phase 4: Agent 5 (Strategy Architect)

        Pacing: each agent is guaranteed >=8s via _pad_to_min_duration,
        plus fixed 3s transitions between phases.  Total: ~40s consistent.
        """

        # Initialize Backboard.io session thread
        self.backboard_thread_id = await create_session_thread()

        # Phase 1: Supply Chain Analyst + pre-fetch news headlines in parallel
        await self._phase_delay("Initializing Supply Chain Analyst...", 1)
        agent1 = SupplyChainAgent(
            self.shared_memory, self._ws, self.business_description
        )
        news_task = asyncio.create_task(self._prefetch_news())
        await agent1.run()

        # Transition: Phase 1 → Phase 2
        await self._phase_delay("Supply chain mapped. Preparing RAG classification...", 1)

        # Phase 2: RAG HS code classification (inputs classified in parallel)
        await self._run_rag_classification()

        # Transition: Phase 2 → Phase 3
        await self._phase_delay("HS codes classified. Dispatching parallel agents...", 1)
        await news_task

        # Phase 3: Tariff Calculator + Supplier Scout + Geopolitical Analyst in parallel
        agent2 = TariffCalculatorAgent(self.shared_memory, self._ws)
        agent3 = SupplierScoutAgent(self.shared_memory, self._ws)
        agent4 = GeopoliticalAgent(self.shared_memory, self._ws)
        await asyncio.gather(agent2.run(), agent3.run(), agent4.run())

        # Transition: Phase 3 → Phase 4
        await self._phase_delay("All intelligence gathered. Synthesizing survival strategy...", 1)

        # Phase 4: Strategy Architect (needs all 4 outputs)
        agent5 = StrategyArchitectAgent(self.shared_memory, self._ws)
        await agent5.run()

        return self.shared_memory

    async def _prefetch_news(self):
        """Pre-fetch news during Agent 1 so Agent 4 gets a cache hit."""
        try:
            from services.news_fetcher import fetch_trade_news
            # Use generic trade queries to warm the cache
            await fetch_trade_news(["manufacturing", "trade"], ["tariff", "imports"])
        except Exception:
            pass  # Non-critical — Agent 4 will fetch itself if cache misses
