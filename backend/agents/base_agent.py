from __future__ import annotations

import asyncio
import json
import os
import time
from abc import ABC, abstractmethod
from typing import Any

from services.gemini_client import generate_json
from services.backboard_client import write_shared_memory, log_agent_activity

# ---------------------------------------------------------------------------
# No padding: agents run as fast as the API allows. Demos need to finish in
# ~30–45s, not 2 minutes, so we don't add artificial delay.
# ---------------------------------------------------------------------------
AGENT_MIN_DURATION_SECS: float = 0.0


class AgentStatus:
    IDLE = "idle"
    WAITING = "waiting"
    WORKING = "working"
    COMPLETE = "complete"
    ERROR = "error"


class BaseAgent(ABC):
    """Base class for all TariffTriage agents.

    Handles shared memory read/write, status updates via WebSocket callback,
    dependency waiting, and Gemini API calls with retry.
    """

    name: str
    accent_color: str
    dependencies: list[str]  # shared memory keys this agent needs before starting
    output_key: str  # shared memory key this agent writes to

    def __init__(self, shared_memory: dict[str, Any], ws_callback):
        self.shared_memory = shared_memory
        self.ws_callback = ws_callback  # async callable(agent_name, event_type, data)
        self.status = AgentStatus.IDLE
        self.messages: list[dict] = []

    async def emit(self, message: str, event_type: str = "status"):
        """Send a status update to the frontend via WebSocket."""
        entry = {
            "agent": self.name,
            "color": self.accent_color,
            "message": message,
            "event_type": event_type,
            "status": self.status,
            "timestamp": time.time(),
        }
        self.messages.append(entry)
        if self.ws_callback:
            await self.ws_callback(self.name, event_type, entry)
        # Log to Backboard for audit trail
        await log_agent_activity(self.name, message)

    async def wait_for_dependencies(self, timeout: float = 15.0):
        """Block until all dependency keys are present in shared memory."""
        if not self.dependencies:
            return
        self.status = AgentStatus.WAITING
        await self.emit(f"Waiting for: {', '.join(self.dependencies)}")
        start = time.time()
        while True:
            if all(key in self.shared_memory for key in self.dependencies):
                return
            if time.time() - start > timeout:
                raise TimeoutError(
                    f"{self.name}: timed out waiting for {self.dependencies}"
                )
            await asyncio.sleep(0.3)

    async def call_gemini(self, user_message: str, timeout_seconds: float = 60.0) -> dict[str, Any]:
        """Call Gemini with this agent's system prompt. Fails with TimeoutError if Gemini takes too long."""
        timeout_seconds = float(os.getenv("GEMINI_TIMEOUT_SECONDS", timeout_seconds))
        return await asyncio.wait_for(
            generate_json(
                system_prompt=self.system_prompt(),
                user_message=user_message,
            ),
            timeout=timeout_seconds,
        )

    async def _pad_to_min_duration(self, start_time: float):
        """Sleep the remaining time so the agent takes at least AGENT_MIN_DURATION_SECS."""
        elapsed = time.time() - start_time
        remaining = AGENT_MIN_DURATION_SECS - elapsed
        if remaining > 0:
            await asyncio.sleep(remaining)

    @abstractmethod
    def system_prompt(self) -> str:
        """Return the system prompt for this agent."""
        ...

    @abstractmethod
    async def build_user_message(self) -> str:
        """Build the user message from shared memory data."""
        ...

    @abstractmethod
    async def process_result(self, result: dict[str, Any]) -> dict[str, Any]:
        """Post-process the Gemini result before writing to shared memory.

        Can be used for enrichment (e.g., RAG lookup, tariff DB queries).
        Return the final object to store.
        """
        ...

    def fallback_output(self) -> dict[str, Any]:
        """Return a minimal valid output when this agent fails. Pipeline continues with this so downstream agents can run."""
        return {}

    async def run(self):
        """Execute the full agent lifecycle.

        Guaranteed to take at least AGENT_MIN_DURATION_SECS wall-clock seconds
        so the frontend neural-graph animation is consistent across demo runs.
        """
        t0 = time.time()
        try:
            await self.wait_for_dependencies()

            self.status = AgentStatus.WORKING
            await self.emit("Starting analysis...")

            user_message = await self.build_user_message()
            await self.emit("Calling Gemini for analysis...")

            result = await self.call_gemini(user_message)
            await self.emit("Processing results...")

            processed = await self.process_result(result)
            self.shared_memory[self.output_key] = processed

            # Persist to Backboard.io shared memory
            await write_shared_memory(self.output_key, processed)

            # Pad so this agent always takes a consistent amount of time
            await self._pad_to_min_duration(t0)
            self.status = AgentStatus.COMPLETE
            await self.emit("Analysis complete.")

        except Exception as e:
            self.status = AgentStatus.ERROR
            err_msg = str(e).strip()
            err_lower = err_msg.lower()
            if "timeout" in err_lower or isinstance(e, TimeoutError):
                await self.emit(
                    "Gemini request timed out. This is usually transient load/latency; retry the analysis.",
                    event_type="error",
                )
            elif "resourceexhausted" in err_lower or "quota" in err_lower or "too many requests" in err_lower:
                await self.emit(
                    "Gemini quota/rate limit reached. Wait briefly or use a higher-quota API key/project.",
                    event_type="error",
                )
            elif "gemini_api_key" in err_lower or "api key" in err_lower or "api_key" in err_lower or "environment" in err_lower:
                await self.emit(
                    "Gemini API key missing or invalid. Set GEMINI_API_KEY in backend/.env (see .env.example).",
                    event_type="error",
                )
            else:
                await self.emit(f"Error: {err_msg}", event_type="error")
            # Write fallback so downstream agents can still run; do not re-raise
            fallback = self.fallback_output()
            self.shared_memory[self.output_key] = fallback
            try:
                await write_shared_memory(self.output_key, fallback)
            except Exception:
                pass
