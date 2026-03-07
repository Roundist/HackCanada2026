"""Backboard.io integration for persistent shared memory across agents."""

from __future__ import annotations

import json
import logging
import os
from typing import Any

logger = logging.getLogger(__name__)

_backboard_client = None
_assistant_id: str | None = None


async def init_backboard() -> bool:
    """Initialize the Backboard client and create the TariffTriage assistant.

    Returns True if connected, False if API key missing (fallback mode).
    """
    global _backboard_client, _assistant_id

    api_key = os.getenv("BACKBOARD_API_KEY", "").strip()
    if not api_key:
        logger.warning("BACKBOARD_API_KEY not set — running in fallback mode (local dict only)")
        return False

    try:
        from backboard import BackboardClient
        _backboard_client = BackboardClient(api_key=api_key)

        # Create or reuse the TariffTriage assistant
        assistants = await _backboard_client.list_assistants()
        existing = next((a for a in assistants if a.name == "TariffTriage Orchestrator"), None)

        if existing:
            _assistant_id = existing.assistant_id
            logger.info("Backboard: reusing assistant %s", _assistant_id)
        else:
            assistant = await _backboard_client.create_assistant(
                name="TariffTriage Orchestrator",
                description="Multi-agent trade war survival platform — shared memory orchestrator",
                system_prompt="You coordinate 5 specialized AI agents analyzing tariff impacts for Canadian businesses.",
            )
            _assistant_id = assistant.assistant_id
            logger.info("Backboard: created assistant %s", _assistant_id)

        return True
    except Exception as e:
        logger.warning("Backboard init failed: %s — running in fallback mode", e)
        _backboard_client = None
        _assistant_id = None
        return False


def is_connected() -> bool:
    return _backboard_client is not None and _assistant_id is not None


async def create_session_thread() -> str | None:
    """Create a new Backboard thread for an analysis session.

    Returns the thread_id, or None if not connected.
    """
    if not is_connected():
        return None
    try:
        thread = await _backboard_client.create_thread(_assistant_id)
        logger.info("Backboard: created thread %s", thread.thread_id)
        return thread.thread_id
    except Exception as e:
        logger.warning("Backboard: failed to create thread: %s", e)
        return None


async def write_shared_memory(key: str, value: Any) -> None:
    """Persist an agent's output to Backboard shared memory.

    Backboard has a 4 KiB limit per attribute value, so we truncate large
    payloads to a summary to stay within bounds.  The full data lives in the
    in-memory shared_memory dict and is not affected.
    """
    if not is_connected():
        return
    try:
        serialized = json.dumps(value)
        # Backboard 4 KiB limit — keep content well under it (3.5 KiB budget
        # after accounting for the "[key] " prefix and metadata overhead).
        MAX_CONTENT = 3500
        if len(serialized) > MAX_CONTENT:
            serialized = serialized[:MAX_CONTENT] + "…[truncated]"
        content = f"[{key}] {serialized}"
        await _backboard_client.add_memory(
            assistant_id=_assistant_id,
            content=content,
            metadata={"key": key, "type": "agent_output"},
        )
        logger.info("Backboard: wrote shared memory key '%s'", key)
    except Exception as e:
        logger.warning("Backboard: failed to write key '%s': %s", key, e)


async def read_shared_memory() -> dict[str, Any]:
    """Read all shared memory entries from Backboard.

    Returns a dict of key -> parsed value.
    """
    if not is_connected():
        return {}
    try:
        memories = await _backboard_client.get_memories(_assistant_id)
        result = {}
        for mem in memories.memories:
            meta = mem.metadata or {}
            if meta.get("type") == "agent_output" and "key" in meta:
                key = meta["key"]
                # Content format: "[key] {json...}"
                content = mem.content
                json_start = content.find("]") + 2
                if json_start > 1:
                    try:
                        result[key] = json.loads(content[json_start:])
                    except json.JSONDecodeError:
                        pass
        return result
    except Exception as e:
        logger.warning("Backboard: failed to read memories: %s", e)
        return {}


async def log_agent_activity(agent_name: str, message: str) -> None:
    """Log an agent status message to Backboard for audit trail."""
    if not is_connected():
        return
    try:
        await _backboard_client.add_memory(
            assistant_id=_assistant_id,
            content=f"[{agent_name}] {message}",
            metadata={"key": "agent_log", "type": "activity", "agent": agent_name},
        )
    except Exception:
        pass  # Non-critical, don't break the pipeline
