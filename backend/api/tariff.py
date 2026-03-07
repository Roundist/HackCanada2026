from __future__ import annotations

from fastapi import APIRouter, HTTPException

from services.tariff_lookup import lookup, get_rate

router = APIRouter()


@router.get("/api/tariff/{hs_code}")
async def get_tariff(hs_code: str):
    result = lookup(hs_code)
    if result is None:
        raise HTTPException(status_code=404, detail=f"HS code {hs_code} not found")
    return result
