"""2D projection + neighbor lookup for the interactive RAG explainer."""

from __future__ import annotations

from typing import Any

import numpy as np

from services.hs_vector_store import search, get_neighbors
from services.gemini_client import embed_text


async def get_explorer_data(
    input_name: str,
    input_description: str,
    selected_hs_code: str,
    session_data: dict[str, Any],
) -> dict:
    """Return 2D projection data for the embedding space around a classified input.

    Uses PCA for fast dimensionality reduction (no sklearn dependency needed).
    """
    # Get the query embedding
    query_embedding = await embed_text(input_description)

    # Get RAG candidates (same as classification)
    candidates = await search(input_description, top_k=5)

    # Get neighbors of the selected HS code for context
    neighbors = await get_neighbors(selected_hs_code, top_k=10)

    # Collect all HS codes we need embeddings for
    all_codes = [c["hs_code"] for c in candidates] + [n["hs_code"] for n in neighbors]
    unique_codes = list(dict.fromkeys(all_codes))  # dedupe preserving order

    # Get embeddings for all codes from ChromaDB
    from services.hs_vector_store import _collection
    if _collection is None:
        raise RuntimeError("Vector store not initialized")

    result = _collection.get(ids=unique_codes, include=["embeddings"])
    code_embeddings = {}
    for i, code in enumerate(result["ids"]):
        code_embeddings[code] = result["embeddings"][i]

    # Build matrix for PCA: query + all code embeddings
    vectors = [query_embedding]
    labels = ["query"]
    for code in unique_codes:
        if code in code_embeddings:
            vectors.append(code_embeddings[code])
            labels.append(code)

    matrix = np.array(vectors)

    # Simple PCA to 2D
    centered = matrix - matrix.mean(axis=0)
    cov = np.cov(centered, rowvar=False)
    eigenvalues, eigenvectors = np.linalg.eigh(cov)
    # Take top 2 components (eigenvalues sorted ascending, so take last 2)
    top2 = eigenvectors[:, -2:][:, ::-1]
    projected = centered @ top2

    # Build coordinate map
    coords = {}
    for i, label in enumerate(labels):
        coords[label] = {"x": float(projected[i, 0]), "y": float(projected[i, 1])}

    # Build response
    query_point = {"x": coords["query"]["x"], "y": coords["query"]["y"], "label": input_name}

    candidate_points = []
    for c in candidates:
        code = c["hs_code"]
        if code in coords:
            candidate_points.append({
                "hs_code": code,
                "description": c["description"],
                "x": coords[code]["x"],
                "y": coords[code]["y"],
                "score": c["score"],
                "is_selected": code == selected_hs_code,
            })

    neighbor_points = []
    for n in neighbors:
        code = n["hs_code"]
        if code in coords and code not in {c["hs_code"] for c in candidates}:
            neighbor_points.append({
                "hs_code": code,
                "description": n["description"],
                "x": coords[code]["x"],
                "y": coords[code]["y"],
            })

    # Simple category clusters from candidates and neighbors
    category_groups: dict[str, list[tuple[float, float]]] = {}
    for c in candidates + neighbors:
        code = c["hs_code"]
        cat = c.get("category", "Other")
        if code in coords:
            category_groups.setdefault(cat, []).append((coords[code]["x"], coords[code]["y"]))

    category_clusters = []
    for cat, points in category_groups.items():
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        cx = sum(xs) / len(xs)
        cy = sum(ys) / len(ys)
        radius = max(
            max(abs(x - cx) for x in xs),
            max(abs(y - cy) for y in ys),
            0.1,
        )
        category_clusters.append({"category": cat, "center_x": cx, "center_y": cy, "radius": radius})

    return {
        "input_name": input_name,
        "query_point": query_point,
        "candidates": candidate_points,
        "neighbors": neighbor_points,
        "category_clusters": category_clusters,
    }
