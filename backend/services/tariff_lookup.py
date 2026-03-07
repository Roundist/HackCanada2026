from __future__ import annotations

import os
from pathlib import Path

import pandas as pd

_df: pd.DataFrame | None = None


def load(csv_path: str | None = None):
    """Load tariff CSV into memory."""
    global _df
    if csv_path is None:
        csv_path = str(Path(__file__).parent.parent / "database" / "tariff_data.csv")
    _df = pd.read_csv(csv_path, dtype={"hs_code": str})


def _ensure_loaded():
    if _df is None:
        load()


def lookup(hs_code: str) -> dict | None:
    """Exact 6-digit HS code lookup."""
    _ensure_loaded()
    rows = _df[_df["hs_code"] == hs_code]
    if rows.empty:
        return None
    return rows.iloc[0].to_dict()


def lookup_prefix(hs_prefix: str) -> list[dict]:
    """All codes starting with a prefix (e.g., '4407')."""
    _ensure_loaded()
    mask = _df["hs_code"].str.startswith(hs_prefix)
    return _df[mask].to_dict(orient="records")


def lookup_category(category: str) -> list[dict]:
    """All codes in a broad category."""
    _ensure_loaded()
    mask = _df["category"].str.lower() == category.lower()
    return _df[mask].to_dict(orient="records")


def get_rate(hs_code: str) -> float:
    """Return effective tariff rate for an HS code, 0.0 if not found."""
    row = lookup(hs_code)
    if row is None:
        return 0.0
    return float(row.get("effective_rate", 0.0))


def get_dataframe() -> pd.DataFrame:
    """Return the loaded DataFrame (for vector store indexing)."""
    _ensure_loaded()
    return _df


def get_all_rates() -> list[dict]:
    """Return all tariff rows as list of dicts (for bulk API)."""
    _ensure_loaded()
    return _df.to_dict(orient="records")


def search_by_text(query: str, limit: int = 15) -> list[dict]:
    """Text search: rows where query appears in description or category (case-insensitive).
    Ensures common terms like 'wood' or 'lumber' return obvious matches even if vector search ranks them lower.
    """
    _ensure_loaded()
    q = query.strip().lower()
    if len(q) < 2:
        return []
    desc_match = _df["description"].fillna("").str.lower().str.contains(q, regex=False)
    cat_match = _df["category"].fillna("").str.lower().str.contains(q, regex=False)
    mask = desc_match | cat_match
    rows = _df[mask].head(limit).to_dict(orient="records")
    return rows
