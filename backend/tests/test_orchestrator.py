from __future__ import annotations

from agents.orchestrator import Orchestrator


def test_orchestrator_initializes_backboard_context() -> None:
    orch = Orchestrator("Canadian electronics distributor " * 3, session_id="sess-123")
    assert orch.shared_memory["_session_id"] == "sess-123"
    assert "_backboard_thread_id" in orch.shared_memory
