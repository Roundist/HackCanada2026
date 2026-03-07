from __future__ import annotations

from fastapi import APIRouter, HTTPException

from services.tariff_lookup import lookup, get_rate, get_all_rates

router = APIRouter()


@router.get("/api/tariff/{hs_code}")
async def get_tariff(hs_code: str):
    result = lookup(hs_code)
    if result is None:
        raise HTTPException(status_code=404, detail=f"HS code {hs_code} not found")
    return result


@router.get("/api/tariffs")
async def list_tariffs():
    """Return all tariff rates (hs_code, effective_rate, description, etc.) for frontend lookup."""
    import math
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
    return {"tariffs": out}
