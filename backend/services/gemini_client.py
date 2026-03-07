"""Gemini API client with retry logic, JSON generation, and embedding support."""

import asyncio
import json
import logging
import os
import re
from typing import Any

import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted, ServiceUnavailable
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
    before_sleep_log,
)

logger = logging.getLogger(__name__)

_GENERATION_MODEL = "gemini-2.5-flash"
_EMBEDDING_MODEL = "models/gemini-embedding-001"

_retry_decorator = retry(
    retry=retry_if_exception_type((ResourceExhausted, ServiceUnavailable)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)


class GeminiClient:
    """Wrapper around the Google Generative AI SDK for TariffTriage.

    Provides structured JSON generation and text embedding with automatic
    retry on transient API errors.
    """

    def __init__(self, api_key: str) -> None:
        """Configure the Gemini SDK with the provided API key.

        Args:
            api_key: A valid Gemini API key.
        """
        genai.configure(api_key=api_key)
        self._model = genai.GenerativeModel(_GENERATION_MODEL)
        logger.info("GeminiClient initialised (model=%s)", _GENERATION_MODEL)

    @_retry_decorator
    def generate_json(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.2,
    ) -> dict[str, Any]:
        """Call Gemini and return a parsed JSON dict.

        The model is instructed to respond with ``application/json``.
        Markdown fences (```json ... ```) are stripped as a safety fallback
        before parsing so that stale SDK versions that ignore the MIME hint
        still work correctly.

        Args:
            system_prompt: High-level instructions that define the agent role.
            user_message: The actual user / task input for this call.
            temperature: Sampling temperature (default 0.2 for deterministic output).

        Returns:
            Parsed JSON response as a Python dict.

        Raises:
            RuntimeError: If the response cannot be decoded as JSON.
            ResourceExhausted: Re-raised after all retry attempts are exhausted.
            ServiceUnavailable: Re-raised after all retry attempts are exhausted.
        """
        combined_prompt = f"SYSTEM:\n{system_prompt}\n\nUSER INPUT:\n{user_message}"

        response = self._model.generate_content(
            combined_prompt,
            generation_config=genai.GenerationConfig(
                temperature=temperature,
                response_mime_type="application/json",
            ),
        )

        text = response.text.strip()

        # Strip markdown code fences if present (```json\n...\n``` or ```\n...\n```)
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                f"Gemini returned non-JSON output. Raw text: {text!r}"
            ) from exc

    @_retry_decorator
    def embed(self, text: str) -> list[float]:
        """Embed a single text string using ``text-embedding-004``.

        Args:
            text: The text to embed.

        Returns:
            A list of floats representing the embedding vector.
        """
        result = genai.embed_content(
            model=_EMBEDDING_MODEL,
            content=text,
        )
        return result["embedding"]

    def embed_batch(
        self,
        texts: list[str],
        batch_size: int = 100,
    ) -> list[list[float]]:
        """Embed multiple texts in batches, logging progress.

        The Gemini embedding API accepts a list of strings in one call, so
        each batch is a single API request rather than one-per-text.

        Args:
            texts: List of strings to embed.
            batch_size: Maximum number of texts per API call (default 100).

        Returns:
            List of embedding vectors in the same order as *texts*.
        """
        all_embeddings: list[list[float]] = []
        total = len(texts)
        num_batches = (total + batch_size - 1) // batch_size

        for batch_idx, start in enumerate(range(0, total, batch_size), start=1):
            batch = texts[start : start + batch_size]
            logger.info(
                "Embedding batch %d/%d (%d texts, indices %d-%d)",
                batch_idx,
                num_batches,
                len(batch),
                start,
                start + len(batch) - 1,
            )
            embeddings = self._embed_batch_with_retry(batch)
            all_embeddings.extend(embeddings)

        logger.info("Embedding complete: %d vectors produced", len(all_embeddings))
        return all_embeddings

    @_retry_decorator
    def _embed_batch_with_retry(self, batch: list[str]) -> list[list[float]]:
        """Embed a single batch with retry logic.

        Args:
            batch: A list of strings (length <= batch_size).

        Returns:
            List of embedding vectors for each string in *batch*.
        """
        result = genai.embed_content(
            model=_EMBEDDING_MODEL,
            content=batch,
        )
        embeddings = result["embedding"]
        # When content is a list, the SDK returns a list of vectors.
        # When content is a single string it returns one vector; normalise.
        if isinstance(embeddings[0], float):
            return [embeddings]
        return embeddings


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

_client: GeminiClient | None = None


def get_gemini_client() -> GeminiClient:
    """Return the module-level GeminiClient singleton.

    Reads ``GEMINI_API_KEY`` from the environment on first call and raises a
    clear ``EnvironmentError`` if the variable is absent or empty.

    Returns:
        The shared :class:`GeminiClient` instance.

    Raises:
        EnvironmentError: If ``GEMINI_API_KEY`` is not set.
    """
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if not api_key:
            raise EnvironmentError(
                "GEMINI_API_KEY environment variable is not set. "
                "Export it before starting the application:\n"
                "  export GEMINI_API_KEY=your_key_here"
            )
        _client = GeminiClient(api_key=api_key)
    return _client


# ---------------------------------------------------------------------------
# Module-level async convenience functions (used by agents and services)
# ---------------------------------------------------------------------------


async def generate_json(
    system_prompt: str,
    user_message: str,
    temperature: float = 0.2,
) -> dict[str, Any]:
    client = get_gemini_client()
    return await asyncio.to_thread(
        client.generate_json, system_prompt, user_message, temperature
    )


async def embed_text(text: str) -> list[float]:
    client = get_gemini_client()
    return await asyncio.to_thread(client.embed, text)


async def embed_texts(
    texts: list[str], batch_size: int = 100
) -> list[list[float]]:
    client = get_gemini_client()
    return await asyncio.to_thread(client.embed_batch, texts, batch_size)
