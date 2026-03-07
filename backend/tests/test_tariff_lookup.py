from __future__ import annotations

from services.tariff_lookup import get_dataframe, get_rate


def test_get_rate_for_known_hs_code() -> None:
    df = get_dataframe()
    hs_code = str(df.iloc[0]["hs_code"])
    rate = get_rate(hs_code)
    assert isinstance(rate, float)
    assert rate >= 0.0
