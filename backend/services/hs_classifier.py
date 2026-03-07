from __future__ import annotations

import asyncio
import json
import os
from typing import Any

from services.gemini_client import generate_json
from services.hs_vector_store import search
from services.tariff_lookup import get_rate


async def classify(product_description: str) -> dict:
    """Classify a product description to an HS code using RAG.

    1. Semantic search ChromaDB for top-5 HS code candidates
    2. Ask Gemini to pick the best match
    3. Look up the tariff rate from the database
    """
    candidates = await search(product_description, top_k=5)

    candidates_text = "\n".join(
        f"{i+1}. {c['hs_code']} - {c['description']} (score: {c['score']:.2f})"
        for i, c in enumerate(candidates)
    )

    prompt = (
        f'Given this product description: "{product_description}"\n\n'
        f"These are the top HS code candidates from our tariff database (ranked by relevance):\n"
        f"{candidates_text}\n\n"
        'Select the single best HS code match. Return JSON: {"hs_code": "...", "confidence": 0.0-1.0, "reasoning": "..."}'
    )

    result = await generate_json(
        system_prompt="You are an HS code classification expert. Pick the best match from the candidates provided.",
        user_message=prompt,
    )

    hs_code = result.get("hs_code", "")
    rate = get_rate(hs_code)

    return {
        "hs_code": hs_code,
        "confidence": result.get("confidence", 0.0),
        "reasoning": result.get("reasoning", ""),
        "tariff_rate": rate,
        "candidates": candidates,
    }


CLASSIFY_TIMEOUT_SEC = 30  # per input; avoids pipeline hanging on quota/API issues
try:
    _CLASSIFY_CONCURRENCY_RAW = int(os.getenv("HS_CLASSIFY_MAX_CONCURRENCY", "3"))
except ValueError:
    _CLASSIFY_CONCURRENCY_RAW = 3
CLASSIFY_MAX_CONCURRENCY = max(1, _CLASSIFY_CONCURRENCY_RAW)


async def classify_inputs(inputs: list[dict]) -> dict[str, dict]:
    """Classify multiple inputs in parallel, returning a map of input_name -> classification result.
    Uses description or name for each input. If one input fails or times out, others still get classified.
    """
    us_inputs = [inp for inp in inputs if inp.get("is_us_sourced")]
    if not us_inputs:
        return {}
    semaphore = asyncio.Semaphore(CLASSIFY_MAX_CONCURRENCY)

    async def classify_one(inp: dict) -> tuple[str, dict]:
        name = inp.get("name", "unknown")
        desc = inp.get("description") or inp.get("name") or "general product"
        try:
            async with semaphore:
                cls = await asyncio.wait_for(classify(desc), timeout=CLASSIFY_TIMEOUT_SEC)
            return (name, cls)
        except asyncio.TimeoutError:
            return (name, {
                "hs_code": "999999",
                "confidence": 0.0,
                "reasoning": "Classification timed out (API quota or latency); using placeholder.",
                "tariff_rate": get_rate("999999"),
                "candidates": [],
            })
        except Exception:
            return (name, {
                "hs_code": "999999",
                "confidence": 0.0,
                "reasoning": "Classification failed; using placeholder.",
                "tariff_rate": get_rate("999999"),
                "candidates": [],
            })

    results = await asyncio.gather(*(classify_one(inp) for inp in us_inputs))
    return dict(results)
