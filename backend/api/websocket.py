from __future__ import annotations

import asyncio
import json

from fastapi import WebSocket, WebSocketDisconnect

# session_id -> list of connected WebSocket clients
_sessions: dict[str, list[WebSocket]] = {}


async def connect(session_id: str, ws: WebSocket):
    await ws.accept()
    _sessions.setdefault(session_id, []).append(ws)


def disconnect(session_id: str, ws: WebSocket):
    if session_id in _sessions:
        _sessions[session_id] = [w for w in _sessions[session_id] if w is not ws]
        if not _sessions[session_id]:
            del _sessions[session_id]


async def broadcast(session_id: str, data: dict):
    """Send a message to all WebSocket clients in a session."""
    if session_id not in _sessions:
        return
    dead: list[WebSocket] = []
    for ws in _sessions[session_id]:
        try:
            await ws.send_json(data)
        except Exception:
            dead.append(ws)
    for ws in dead:
        disconnect(session_id, ws)


def make_ws_callback(session_id: str):
    """Create a callback for agents to send WebSocket updates."""
    async def callback(agent_name: str, event_type: str, data: dict):
        await broadcast(session_id, data)
    return callback
