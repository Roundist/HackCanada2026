"""Generate branded PDF survival plan reports using WeasyPrint + Jinja2."""

from __future__ import annotations

import asyncio
from datetime import date
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader

_TEMPLATE_DIR = Path(__file__).parent.parent / "templates"
_env = Environment(loader=FileSystemLoader(str(_TEMPLATE_DIR)), autoescape=True)


async def generate_pdf(session_data: dict[str, Any]) -> bytes:
    """Render the survival plan as a PDF and return raw bytes."""
    plan = session_data.get("survival_plan", {})
    tariff_impact = session_data.get("tariff_impact", {})

    template = _env.get_template("report.html")
    html_str = template.render(
        plan=plan,
        tariff_impact=tariff_impact,
        generated_date=date.today().strftime("%B %d, %Y"),
    )

    # Lazy import — WeasyPrint requires system pango library
    from weasyprint import HTML

    pdf_bytes: bytes = await asyncio.to_thread(
        lambda: HTML(string=html_str).write_pdf()
    )
    return pdf_bytes
