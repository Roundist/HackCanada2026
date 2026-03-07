from __future__ import annotations

import math

from fastapi import APIRouter, HTTPException, Query

from services.tariff_lookup import lookup, get_rate, get_all_rates, lookup_prefix

router = APIRouter()


@router.get("/api/tariff/{hs_code}")
async def get_tariff(hs_code: str):
    result = lookup(hs_code)
    if result is None:
        raise HTTPException(status_code=404, detail=f"HS code {hs_code} not found")
    return result


# Official source for tariff data (used by frontend for attribution)
TARIFF_SOURCE = {
    "source": "CBSA",
    "source_name": "Canada Border Services Agency",
    "source_description": "CBSA Customs Tariff",
    "source_url": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2025",
    "effective_date": "2025-01-01",
}


@router.get("/api/tariffs")
async def list_tariffs():
    """Return all tariff rates (hs_code, effective_rate, description, etc.) for frontend lookup.
    Data is loaded from tariff_data.csv, populated by the CBSA scraper (refresh_tariff_data.py).
    """
    rows = get_all_rates()
    out = []
    for r in rows:
        row = {}
        for k, v in r.items():
            if isinstance(v, float) and math.isnan(v):
                row[k] = "" if k == "notes" else 0.0
            else:
                row[k] = v
        out.append(row)
    return {"tariffs": out, **TARIFF_SOURCE}


def _clean_row(r: dict) -> dict:
    """Replace NaN values in a tariff row."""
    return {
        k: ("" if k == "notes" else 0.0) if isinstance(v, float) and math.isnan(v) else v
        for k, v in r.items()
    }


@router.get("/api/search")
async def search_products(q: str = Query(..., min_length=2, description="Product name or description")):
    """Semantic search for products/HS codes using the vector store.

    Returns top-5 matching HS codes with tariff rates — no Gemini call, instant results.
    """
    from services.hs_vector_store import _collection

    if _collection is None:
        raise HTTPException(status_code=503, detail="Vector store not initialized yet")

    from services.hs_vector_store import search
    candidates = await search(q, top_k=5)

    results = []
    for c in candidates:
        row = lookup(c["hs_code"])
        results.append({
            "hs_code": c["hs_code"],
            "description": c["description"],
            "category": c["category"],
            "similarity": round(c["score"], 3),
            "mfn_rate": row.get("mfn_rate", 0.0) if row else 0.0,
            "us_retaliatory_rate": row.get("us_retaliatory_rate", 0.0) if row else 0.0,
            "effective_rate": row.get("effective_rate", 0.0) if row else 0.0,
            "effective_date": row.get("effective_date", "") if row else "",
        })

    return {"query": q, "results": results, **TARIFF_SOURCE}
