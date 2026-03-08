from __future__ import annotations

import asyncio
import uuid

from agents.orchestrator import Orchestrator


def test_orchestrator_initializes_backboard_context() -> None:
    orch = Orchestrator("Canadian electronics distributor " * 3, session_id="sess-123")
    assert orch.shared_memory["_session_id"] == "sess-123"
    assert "_backboard_thread_id" in orch.shared_memory


def test_orchestrator_handles_uuid_backboard_thread_id(monkeypatch) -> None:
    async def fake_create_session_thread():
        return uuid.uuid4()

    class _SupplyChainAgent:
        def __init__(self, shared_memory, ws_callback, business_description):
            self.shared_memory = shared_memory

        async def run(self):
            self.shared_memory["supply_chain_map"] = {"inputs": []}

    class _TariffAgent:
        def __init__(self, shared_memory, ws_callback):
            self.shared_memory = shared_memory

        async def run(self):
            self.shared_memory["tariff_impact"] = {"total_annual_tariff_cost": 0}

    class _SupplierAgent:
        def __init__(self, shared_memory, ws_callback):
            self.shared_memory = shared_memory

        async def run(self):
            self.shared_memory["alternative_suppliers"] = {"recommendations": []}

    class _GeopoliticalAgent:
        def __init__(self, shared_memory, ws_callback):
            self.shared_memory = shared_memory

        async def run(self):
            self.shared_memory["geopolitical_context"] = {"risk_level": "medium"}

    class _StrategyAgent:
        def __init__(self, shared_memory, ws_callback):
            self.shared_memory = shared_memory

        async def run(self):
            self.shared_memory["survival_plan"] = {"headline": "ok"}

    async def _noop_phase_delay(self, label: str, seconds: float):
        return None

    async def _noop_rag(self):
        self.shared_memory["tariff_rates"] = {}
        self.shared_memory["hs_classifications"] = {}

    async def _noop_prefetch(self):
        return None

    monkeypatch.setattr("agents.orchestrator.create_session_thread", fake_create_session_thread)
    monkeypatch.setattr("agents.orchestrator.SupplyChainAgent", _SupplyChainAgent)
    monkeypatch.setattr("agents.orchestrator.TariffCalculatorAgent", _TariffAgent)
    monkeypatch.setattr("agents.orchestrator.SupplierScoutAgent", _SupplierAgent)
    monkeypatch.setattr("agents.orchestrator.GeopoliticalAgent", _GeopoliticalAgent)
    monkeypatch.setattr("agents.orchestrator.StrategyArchitectAgent", _StrategyAgent)
    monkeypatch.setattr(Orchestrator, "_phase_delay", _noop_phase_delay)
    monkeypatch.setattr(Orchestrator, "_run_rag_classification", _noop_rag)
    monkeypatch.setattr(Orchestrator, "_prefetch_news", _noop_prefetch)

    orch = Orchestrator("Canadian electronics distributor " * 3, session_id="sess-uuid")
    result = asyncio.run(orch.run())

    assert isinstance(result["_backboard_thread_id"], str)
    assert result["_backboard_thread_id"]
