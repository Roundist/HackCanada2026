#!/usr/bin/env python3
"""
Refresh tariff_data.csv from official sources.

1. CBSA (Canada Border Services Agency): scrapes the Customs Tariff HTML
   chapters to get MFN rates. Effective rate = MFN + US retaliatory (25%).
2. Optional: WTO API (set WTO_API_KEY in .env) for additional data.

Run from backend dir: python scripts/refresh_tariff_data.py
"""

from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

# Add backend to path
_backend = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend))

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Install: pip install requests beautifulsoup4")
    sys.exit(1)

# Canada tariff base URL (current year)
CBSA_BASE = "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2025"
# Chapters we care about (HS 2-digit); map to our category names
CHAPTER_CATEGORY = {
    1: "Live Animals",
    2: "Meat",
    3: "Fish",
    4: "Dairy",
    7: "Vegetables",
    8: "Fruits",
    10: "Cereals",
    11: "Cereals",
    12: "Oilseeds",
    15: "Oils & Fats",
    17: "Sugar",
    19: "Prepared Foods",
    20: "Prepared Foods",
    21: "Prepared Foods",
    22: "Beverages",
    25: "Minerals",
    27: "Energy",
    28: "Chemicals",
    29: "Chemicals",
    32: "Chemicals",
    33: "Chemicals",
    34: "Chemicals",
    35: "Chemicals",
    38: "Chemicals",
    39: "Plastics",
    40: "Rubber",
    44: "Wood",
    47: "Paper",
    48: "Paper",
    52: "Textiles",
    54: "Textiles",
    55: "Textiles",
    56: "Textiles",
    58: "Textiles",
    59: "Textiles",
    63: "Textiles",
    72: "Steel",
    73: "Steel",
    74: "Metals",
    76: "Metals",
    83: "Metal Products",
    84: "Machinery",
    85: "Electronics",
    87: "Vehicles",
    90: "Instruments",
    94: "Furniture",
}

US_RETALIATORY_RATE = 25.0
EFFECTIVE_DATE = "2025-01-01"


def _parse_mfn(mfn_text: str) -> float:
    """Parse MFN column: 'Free' -> 0, '6.5%' -> 6.5."""
    if not mfn_text:
        return 0.0
    s = mfn_text.strip()
    if s.lower() == "free":
        return 0.0
    match = re.search(r"([\d.]+)\s*%", s)
    if match:
        return float(match.group(1))
    return 0.0


def _tariff_item_to_hs6(item: str) -> str | None:
    """Convert CBSA tariff item (e.g. 4401.11.00 or 440111.00.00) to 6-digit HS."""
    digits = re.sub(r"\D", "", item)
    if len(digits) >= 6:
        return digits[:6]
    return None


def _fetch_cbsa_chapter(chapter: int) -> list[dict]:
    """Fetch one CBSA chapter HTML and parse tariff table."""
    url = f"{CBSA_BASE}/html/00/ch{chapter:02d}-eng.html"
    out: list[dict] = []
    try:
        r = requests.get(url, timeout=30, headers={"User-Agent": "TariffTriage/1.0"})
        r.raise_for_status()
    except Exception as e:
        print(f"  Skip ch{chapter:02d}: {e}")
        return out

    soup = BeautifulSoup(r.text, "html.parser")
    tables = soup.find_all("table")
    category = CHAPTER_CATEGORY.get(chapter, "Other")

    for table in tables:
        rows = table.find_all("tr")
        for tr in rows:
            cells = tr.find_all(["td", "th"])
            if len(cells) < 5:
                continue
            # Column 0 = Tariff Item (e.g. 4401.11.00), 2 = Description, 4 = MFN Tariff
            first = "".join(cells[0].get_text().split())
            if not re.match(r"^\d{4}\.\d{2}\.\d{2}", first) and not re.match(
                r"^\d{6}\.\d{2}\.\d{2}", first
            ):
                continue
            hs6 = _tariff_item_to_hs6(first)
            if not hs6:
                continue
            mfn_text = cells[4].get_text().strip()
            mfn = _parse_mfn(mfn_text)
            description = cells[2].get_text().strip()[:200].replace(",", " ")
            if not description:
                description = f"HS {hs6}"
            effective = mfn + US_RETALIATORY_RATE
            out.append({
                "hs_code": hs6,
                "description": description,
                "mfn_rate": mfn,
                "us_retaliatory_rate": US_RETALIATORY_RATE,
                "effective_rate": effective,
                "category": category,
                "effective_date": EFFECTIVE_DATE,
                "notes": "",
            })
    return out


def _fetch_cbsa_toc_chapters() -> list[int]:
    """Fetch TOC and return list of chapter numbers that have tariff tables."""
    url = f"{CBSA_BASE}/html/tblmod-eng.html"
    try:
        r = requests.get(url, timeout=30, headers={"User-Agent": "TariffTriage/1.0"})
        r.raise_for_status()
    except Exception as e:
        print(f"Could not fetch TOC: {e}")
        return list(CHAPTER_CATEGORY.keys())
    soup = BeautifulSoup(r.text, "html.parser")
    chapters = []
    for a in soup.find_all("a", href=True):
        m = re.search(r"ch(\d{2})-eng\.html", a["href"])
        if m:
            ch = int(m.group(1))
            if 1 <= ch <= 99:
                chapters.append(ch)
    return sorted(set(chapters)) if chapters else list(CHAPTER_CATEGORY.keys())


def load_existing_csv(path: Path) -> dict[str, dict]:
    """Load existing tariff_data.csv into hs_code -> row."""
    existing = {}
    if not path.exists():
        return existing
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            existing[row["hs_code"]] = row
    return existing


def main():
    db_dir = _backend / "database"
    csv_path = db_dir / "tariff_data.csv"
    existing = load_existing_csv(csv_path)

    print("Fetching CBSA Customs Tariff chapters...")
    chapters = _fetch_cbsa_toc_chapters()
    # Prefer chapters we have category for
    to_fetch = [c for c in chapters if c in CHAPTER_CATEGORY]
    if not to_fetch:
        to_fetch = chapters[:30]

    seen_hs6 = set()
    rows_by_hs: dict[str, dict] = {}

    for ch in to_fetch:
        print(f"  Ch {ch:02d}...", end=" ", flush=True)
        scraped = _fetch_cbsa_chapter(ch)
        added = 0
        for row in scraped:
            hs = row["hs_code"]
            if hs in seen_hs6:
                continue
            seen_hs6.add(hs)
            # Prefer existing description/notes if we have this code
            if hs in existing:
                old = existing[hs]
                row["description"] = old.get("description", row["description"])
                row["notes"] = old.get("notes", "")
            rows_by_hs[hs] = row
            added += 1
        print(f"{added} rates")

    # Merge: keep existing rows that we didn't scrape (e.g. different chapter structure)
    for hs, row in existing.items():
        if hs not in rows_by_hs:
            rows_by_hs[hs] = row

    # Sort by hs_code
    sorted_rows = sorted(rows_by_hs.values(), key=lambda r: r["hs_code"])
    fieldnames = [
        "hs_code", "description", "mfn_rate", "us_retaliatory_rate",
        "effective_rate", "category", "effective_date", "notes",
    ]

    db_dir.mkdir(parents=True, exist_ok=True)
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(sorted_rows)

    print(f"Wrote {len(sorted_rows)} rows to {csv_path}")


if __name__ == "__main__":
    main()
