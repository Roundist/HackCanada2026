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
    """Search products/HS codes: text match on description/category plus semantic vector search.
    Text matches (e.g. 'wood', 'lumber') are included first so obvious terms always return results.
    """
    seen: set[str] = set()
    results: list[dict] = []
    q_lower = q.strip().lower()

    # 1) Text search: scan all tariff rows for query in description or category (reliable, no extra deps)
    all_rows = get_all_rates()
    for row in all_rows:
        if len(results) >= 15:
            break
        desc = (row.get("description") or "").lower() if isinstance(row.get("description"), str) else ""
        cat = (row.get("category") or "").lower() if isinstance(row.get("category"), str) else ""
        if q_lower not in desc and q_lower not in cat:
            continue
        hs = str(row.get("hs_code", ""))
        if not hs or hs in seen:
            continue
        seen.add(hs)
        r = _clean_row(row)
        results.append({
            "hs_code": hs,
            "description": r.get("description", ""),
            "category": r.get("category", ""),
            "similarity": 1.0,
            "mfn_rate": r.get("mfn_rate", 0.0),
            "us_retaliatory_rate": r.get("us_retaliatory_rate", 0.0),
            "effective_rate": r.get("effective_rate", 0.0),
            "effective_date": str(r.get("effective_date", "")),
        })

    # 2) Vector search (if available) to add semantic matches, dedupe by hs_code
    try:
        from services.hs_vector_store import _collection, search
        if _collection is not None:
            candidates = await search(q, top_k=10)
            for c in candidates:
                if c["hs_code"] not in seen:
                    seen.add(c["hs_code"])
                    row = lookup(c["hs_code"])
                    if row:
                        results.append({
                            "hs_code": c["hs_code"],
                            "description": c["description"],
                            "category": c["category"],
                            "similarity": round(c["score"], 3),
                            "mfn_rate": row.get("mfn_rate", 0.0),
                            "us_retaliatory_rate": row.get("us_retaliatory_rate", 0.0),
                            "effective_rate": row.get("effective_rate", 0.0),
                            "effective_date": row.get("effective_date", ""),
                        })
    except Exception:
        pass  # vector store not ready: text results only

    # Cap at 15 so response stays small
    results = results[:15]
    return {"query": q, "results": results, **TARIFF_SOURCE}
