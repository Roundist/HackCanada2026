"""Backboard.io integration for persistent shared memory across agents."""

from __future__ import annotations

import json
import logging
import os
from typing import Any

logger = logging.getLogger(__name__)

_backboard_client = None
_assistant_id: str | None = None
_MAX_BACKBOARD_CONTENT = 3500


def _serialize_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, default=str)


def _safe_backboard_payload(value: Any) -> tuple[str, bool, int]:
    """Return (json_payload, truncated, original_len) bounded to Backboard size."""
    serialized = _serialize_json(value)
    original_len = len(serialized)
    if original_len <= _MAX_BACKBOARD_CONTENT:
        return serialized, False, original_len

    if isinstance(value, dict):
        keys = list(value.keys())
        sample_keys = keys[:5]
        reduced: Any = {
            "_truncated": True,
            "_summary_type": "dict",
            "_total_keys": len(keys),
            "_sample_keys": sample_keys,
            "_sample": {k: value[k] for k in sample_keys},
        }
    elif isinstance(value, list):
        reduced = {
            "_truncated": True,
            "_summary_type": "list",
            "_total_items": len(value),
            "_sample_items": value[:3],
        }
    else:
        reduced = {
            "_truncated": True,
            "_summary_type": type(value).__name__,
            "_preview": str(value)[:400],
        }

    reduced_serialized = _serialize_json(reduced)
    if len(reduced_serialized) <= _MAX_BACKBOARD_CONTENT:
        return reduced_serialized, True, original_len

    preview_budget = max(64, _MAX_BACKBOARD_CONTENT - 140)
    preview = serialized[:preview_budget]
    compact = {
        "_truncated": True,
        "_summary_type": "raw_json_preview",
        "_original_chars": original_len,
        "_preview": preview,
    }
    compact_serialized = _serialize_json(compact)
    if len(compact_serialized) > _MAX_BACKBOARD_CONTENT:
        overflow = len(compact_serialized) - _MAX_BACKBOARD_CONTENT
        preview = preview[: max(0, len(preview) - overflow - 8)]
        compact["_preview"] = preview
        compact_serialized = _serialize_json(compact)

    if len(compact_serialized) > _MAX_BACKBOARD_CONTENT:
        compact_serialized = _serialize_json(
            {"_truncated": True, "_original_chars": original_len}
        )

    return compact_serialized, True, original_len


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


async def write_shared_memory(
    key: str,
    value: Any,
    thread_id: str | None = None,
    session_id: str | None = None,
) -> None:
    """Persist an agent's output to Backboard shared memory.

    Backboard has a 4 KiB limit per attribute value, so we truncate large
    payloads to a summary to stay within bounds.  The full data lives in the
    in-memory shared_memory dict and is not affected.
    """
    if not is_connected():
        return
    try:
        serialized, truncated, original_len = _safe_backboard_payload(value)
        content = f"[{key}] {serialized}"
        metadata = {"key": key, "type": "agent_output"}
        if thread_id:
            metadata["thread_id"] = thread_id
        if session_id:
            metadata["session_id"] = session_id
        if truncated:
            metadata["truncated"] = True
            metadata["original_chars"] = original_len
        await _backboard_client.add_memory(
            assistant_id=_assistant_id,
            content=content,
            metadata=metadata,
        )
        logger.info("Backboard: wrote shared memory key '%s'", key)
    except Exception as e:
        logger.warning("Backboard: failed to write key '%s': %s", key, e)


async def read_shared_memory(
    thread_id: str | None = None,
    session_id: str | None = None,
) -> dict[str, Any]:
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
                if thread_id and meta.get("thread_id") != thread_id:
                    continue
                if session_id and meta.get("session_id") != session_id:
                    continue
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


async def log_agent_activity(
    agent_name: str,
    message: str,
    thread_id: str | None = None,
    session_id: str | None = None,
) -> None:
    """Log an agent status message to Backboard for audit trail."""
    if not is_connected():
        return
    try:
        metadata = {"key": "agent_log", "type": "activity", "agent": agent_name}
        if thread_id:
            metadata["thread_id"] = thread_id
        if session_id:
            metadata["session_id"] = session_id
        await _backboard_client.add_memory(
            assistant_id=_assistant_id,
            content=f"[{agent_name}] {message}",
            metadata=metadata,
        )
    except Exception:
        pass  # Non-critical, don't break the pipeline
