from __future__ import annotations

import asyncio
import json
import time
from abc import ABC, abstractmethod
from typing import Any

from services.gemini_client import generate_json
from services.backboard_client import write_shared_memory, log_agent_activity


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

    async def wait_for_dependencies(self, timeout: float = 120.0):
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

    async def call_gemini(self, user_message: str) -> dict[str, Any]:
        """Call Gemini with this agent's system prompt."""
        return await generate_json(
            system_prompt=self.system_prompt(),
            user_message=user_message,
        )

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

    async def run(self):
        """Execute the full agent lifecycle."""
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

            self.status = AgentStatus.COMPLETE
            await self.emit("Analysis complete.")

        except Exception as e:
            self.status = AgentStatus.ERROR
            await self.emit(f"Error: {str(e)}", event_type="error")
            raise
