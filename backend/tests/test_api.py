from __future__ import annotations

import asyncio
import uuid

from fastapi import BackgroundTasks

from api.analyze import analyze
from api.tariff import list_tariffs
from schemas.requests import AnalyzeRequest


def test_analyze_returns_session_metadata() -> None:
    request = AnalyzeRequest(business_description="A Canadian manufacturer of steel parts. " * 2)
    background_tasks = BackgroundTasks()
    response = asyncio.run(analyze(request, background_tasks))

    uuid.UUID(response.session_id)
    assert response.status == "started"
    assert response.ws_url.endswith(response.session_id)
    assert len(background_tasks.tasks) == 1


def test_list_tariffs_returns_rows() -> None:
    payload = asyncio.run(list_tariffs())
    assert "tariffs" in payload
    assert isinstance(payload["tariffs"], list)
    assert len(payload["tariffs"]) > 0
