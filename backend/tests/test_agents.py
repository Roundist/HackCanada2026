from __future__ import annotations

import json

from services.backboard_client import _safe_backboard_payload


def test_backboard_payload_truncation_stays_valid_json() -> None:
    payload, truncated, original_len = _safe_backboard_payload({"blob": "x" * 12000})
    assert truncated is True
    assert original_len > len(payload)
    assert len(payload) <= 3500
    decoded = json.loads(payload)
    assert decoded.get("_truncated") is True
