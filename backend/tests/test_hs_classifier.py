from __future__ import annotations

import asyncio

import services.hs_classifier as hs_classifier


def test_classify_inputs_falls_back_on_error(monkeypatch) -> None:
    async def always_fail(_: str) -> dict:
        raise RuntimeError("boom")

    monkeypatch.setattr(hs_classifier, "classify", always_fail)
    inputs = [
        {"name": "US Steel", "description": "rolled steel sheets", "is_us_sourced": True},
    ]
    out = asyncio.run(hs_classifier.classify_inputs(inputs))
    assert out["US Steel"]["hs_code"] == "999999"
    assert out["US Steel"]["confidence"] == 0.0


def test_classify_inputs_respects_concurrency_cap(monkeypatch) -> None:
    monkeypatch.setattr(hs_classifier, "CLASSIFY_MAX_CONCURRENCY", 2)
    active = 0
    peak = 0

    async def fake_classify(_: str) -> dict:
        nonlocal active, peak
        active += 1
        peak = max(peak, active)
        await asyncio.sleep(0.01)
        active -= 1
        return {
            "hs_code": "111111",
            "confidence": 0.9,
            "reasoning": "ok",
            "tariff_rate": 25.0,
            "candidates": [],
        }

    monkeypatch.setattr(hs_classifier, "classify", fake_classify)
    inputs = [
        {"name": f"Input-{i}", "description": "test item", "is_us_sourced": True}
        for i in range(8)
    ]
    out = asyncio.run(hs_classifier.classify_inputs(inputs))
    assert len(out) == 8
    assert peak <= 2
