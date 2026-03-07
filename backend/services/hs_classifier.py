from __future__ import annotations

import json
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


async def classify_inputs(inputs: list[dict]) -> dict[str, dict]:
    """Classify multiple inputs, returning a map of input_name -> classification result."""
    results = {}
    for inp in inputs:
        if inp.get("is_us_sourced"):
            classification = await classify(inp["description"])
            results[inp["name"]] = classification
    return results
