from __future__ import annotations

import asyncio
import time
from typing import Any, Callable, Coroutine

from agents.supply_chain_agent import SupplyChainAgent
from agents.tariff_agent import TariffCalculatorAgent
from agents.supplier_agent import SupplierScoutAgent
from agents.geopolitical_agent import GeopoliticalAgent
from agents.strategy_agent import StrategyArchitectAgent
from services.hs_classifier import classify_inputs
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
        session_id: str | None = None,
    ):
        self.business_description = business_description
        self.ws_callback = ws_callback
        self.session_id = session_id
        self.shared_memory: dict[str, Any] = {
            "_session_id": session_id,
            "_backboard_thread_id": None,
        }
        self.backboard_thread_id: str | None = None

    async def _ws(self, agent_name: str, event_type: str, data: dict):
        if self.ws_callback:
            await self.ws_callback(agent_name, event_type, data)

    async def _arch(
        self,
        component: str,
        step: str,
        detail: str,
        status: str = "info",
        sponsor: str | None = None,
    ):
        """Emit architecture telemetry for live demo visibility."""
        await self._ws(
            "System",
            "architecture",
            {
                "type": "architecture_event",
                "agent": "System",
                "status": status,
                "arch_component": component,
                "arch_step": step,
                "arch_detail": detail,
                "sponsor": sponsor,
                "timestamp": time.time(),
                "message": detail,
            },
        )

    RAG_MIN_DURATION_SECS: float = 0.0

    async def _run_rag_classification(self):
        """After Agent 1 completes, run RAG to classify HS codes and look up tariff rates. Padded to RAG_MIN_DURATION_SECS for consistent timing."""
        t0 = time.time()
        await self._arch(
            "rag",
            "semantic_retrieval",
            "RAG stage started: embedding input descriptions and retrieving top HS candidates.",
            status="working",
            sponsor="Gemini + ChromaDB",
        )
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
            await self._arch(
                "rag",
                "classification_fallback",
                "RAG classification fallback triggered; downstream tariff calculations will continue.",
                status="info",
                sponsor="Gemini",
            )

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
        await write_shared_memory(
            "tariff_rates",
            tariff_rates,
            thread_id=self.backboard_thread_id,
            session_id=self.session_id,
        )
        await write_shared_memory(
            "hs_classifications",
            classifications,
            thread_id=self.backboard_thread_id,
            session_id=self.session_id,
        )
        await self._arch(
            "backboard",
            "memory_write",
            "Persisted RAG outputs to Backboard shared memory: tariff_rates, hs_classifications.",
            status="complete",
            sponsor="Backboard.io",
        )

        await self._ws("System", "status", {
            "agent": "System",
            "message": f"Classified {len(classifications)} inputs to HS codes with tariff rates",
            "event_type": "status",
            "status": "complete",
        })
        await self._arch(
            "rag",
            "classification_complete",
            f"RAG complete: {len(classifications)} US-sourced inputs mapped to HS codes and tariff rates.",
            status="complete",
            sponsor="Gemini + ChromaDB",
        )

        # Pad so RAG phase has consistent minimum duration (same as agent padding)
        elapsed = time.time() - t0
        remaining = self.RAG_MIN_DURATION_SECS - elapsed
        if remaining > 0:
            await asyncio.sleep(remaining)

    async def _phase_delay(self, label: str, seconds: float):
        """Broadcast a status message and pause between phases for demo pacing."""
        await self._arch(
            "orchestration",
            "phase_transition",
            label,
            status="working",
            sponsor="Backboard.io",
        )
        await self._ws("System", "status", {
            "agent": "System",
            "message": label,
            "event_type": "status",
            "status": "working",
        })
        await asyncio.sleep(seconds)

    async def run(self) -> dict[str, Any]:
        """Execute the full multi-agent pipeline.

        Maximized parallelism:
            Phase 1: Supply Chain (+ news pre-fetch)
            Phase 2: RAG + Geopolitical in parallel (both only need supply_chain_map)
            Phase 3: Tariff + Supplier in parallel (need tariff_rates from RAG)
            Phase 4: Strategy (needs all four outputs)

        Cannot run all 5 at once: Strategy depends on the other four. This flow minimizes total time.
        """

        # Initialize Backboard.io session thread
        self.backboard_thread_id = await create_session_thread()
        self.shared_memory["_backboard_thread_id"] = self.backboard_thread_id
        if self.backboard_thread_id:
            await self._arch(
                "backboard",
                "thread_created",
                f"Backboard session thread created ({self.backboard_thread_id[:8]}...).",
                status="complete",
                sponsor="Backboard.io",
            )
        else:
            await self._arch(
                "backboard",
                "fallback_mode",
                "Backboard thread unavailable; pipeline will continue with in-memory shared state.",
                status="info",
                sponsor="Backboard.io",
            )

        # Phase 1: Supply Chain Analyst + pre-fetch news in parallel
        await self._phase_delay("Initializing Supply Chain Analyst...", 0.2)
        agent1 = SupplyChainAgent(
            self.shared_memory, self._ws, self.business_description
        )
        news_task = asyncio.create_task(self._prefetch_news())
        await agent1.run()

        # Phase 2: RAG and Geopolitical in parallel (both only need supply_chain_map)
        await self._phase_delay("Supply chain mapped. Running RAG + Geopolitical in parallel...", 0.2)
        agent4 = GeopoliticalAgent(self.shared_memory, self._ws)
        await asyncio.gather(self._run_rag_classification(), agent4.run())
        await news_task

        # Phase 3: Tariff + Supplier in parallel (need tariff_rates from RAG)
        await self._phase_delay("HS codes ready. Running Tariff + Supplier Scout...", 0.2)
        agent2 = TariffCalculatorAgent(self.shared_memory, self._ws)
        agent3 = SupplierScoutAgent(self.shared_memory, self._ws)
        await asyncio.gather(agent2.run(), agent3.run())

        # Phase 4: Strategy Architect (needs all four outputs)
        await self._phase_delay("All intelligence gathered. Synthesizing survival strategy...", 0.2)
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
