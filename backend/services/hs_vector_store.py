from __future__ import annotations

import asyncio

import chromadb
import pandas as pd

from services.gemini_client import embed_text, embed_texts

_collection: chromadb.Collection | None = None
_client: chromadb.ClientAPI | None = None


async def build_index(df: pd.DataFrame) -> None:
    """Embed all HS code descriptions and store in ChromaDB (in-memory)."""
    global _collection, _client

    _client = chromadb.Client()
    _collection = _client.create_collection(
        name="hs_codes",
        metadata={"hnsw:space": "cosine"},
    )

    texts = []
    ids = []
    metadatas = []
    for _, row in df.iterrows():
        hs_code = str(row["hs_code"])
        desc = row.get("description", "")
        category = row.get("category", "")
        text = f"{hs_code}: {desc} (Category: {category})"
        texts.append(text)
        ids.append(hs_code)
        metadatas.append({
            "hs_code": hs_code,
            "description": desc,
            "category": category,
            "effective_rate": float(row.get("effective_rate", 0.0)),
        })

    # Embed in batches
    embeddings = await embed_texts(texts, batch_size=100)

    # Add to ChromaDB in batches (ChromaDB has a limit per add call)
    batch_size = 5000
    for i in range(0, len(ids), batch_size):
        end = i + batch_size
        _collection.add(
            ids=ids[i:end],
            embeddings=embeddings[i:end],
            metadatas=metadatas[i:end],
            documents=texts[i:end],
        )


def _text_search_fallback(query: str, top_k: int) -> list[dict]:
    """Fallback when vector store or embeddings are unavailable (e.g. quota)."""
    from services.tariff_lookup import search_by_text
    rows = search_by_text(query, limit=top_k)
    return [
        {
            "hs_code": str(r.get("hs_code", "")),
            "description": r.get("description", ""),
            "category": r.get("category", ""),
            "effective_rate": float(r.get("effective_rate", 0.0)),
            "score": 0.85 - (i * 0.05),  # slight rank order
        }
        for i, r in enumerate(rows)
    ]


async def search(query: str, top_k: int = 5) -> list[dict]:
    """Semantic search for HS codes; falls back to text search if vector store missing or embeddings fail (e.g. quota)."""
    if _collection is None:
        return await asyncio.to_thread(_text_search_fallback, query, top_k)
    try:
        query_embedding = await embed_text(query)
        results = _collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
        )
        candidates = []
        for i in range(len(results["ids"][0])):
            meta = results["metadatas"][0][i]
            distance = results["distances"][0][i] if results.get("distances") else 0.0
            score = 1.0 - distance
            candidates.append({
                "hs_code": meta["hs_code"],
                "description": meta["description"],
                "category": meta["category"],
                "effective_rate": meta["effective_rate"],
                "score": score,
            })
        return candidates
    except Exception:
        return await asyncio.to_thread(_text_search_fallback, query, top_k)


async def get_neighbors(hs_code: str, top_k: int = 10) -> list[dict]:
    """Get nearest neighbor HS codes in embedding space."""
    if _collection is None:
        raise RuntimeError("Vector store not initialized.")

    result = _collection.get(ids=[hs_code], include=["embeddings"])
    if not result["embeddings"]:
        return []

    embedding = result["embeddings"][0]
    results = _collection.query(
        query_embeddings=[embedding],
        n_results=top_k + 1,
    )

    neighbors = []
    for i in range(len(results["ids"][0])):
        code = results["ids"][0][i]
        if code == hs_code:
            continue
        meta = results["metadatas"][0][i]
        distance = results["distances"][0][i] if results.get("distances") else 0.0
        neighbors.append({
            "hs_code": code,
            "description": meta["description"],
            "category": meta["category"],
            "score": 1.0 - distance,
        })

    return neighbors[:top_k]
