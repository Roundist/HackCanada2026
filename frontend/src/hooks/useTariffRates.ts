import { useEffect, useState, useMemo } from "react";
import { fetchTariffs } from "../api/client";

/** Map of 6-digit HS code -> effective tariff rate (%). */
let cachedRates: Record<string, number> = {};
let cachedPromise: Promise<Record<string, number>> | null = null;

function buildRatesMap(tariffs: Array<{ hs_code: string; effective_rate?: number }>): Record<string, number> {
  const map: Record<string, number> = {};
  for (const row of tariffs) {
    const code = String(row.hs_code ?? "").trim();
    const rate = typeof row.effective_rate === "number" ? row.effective_rate : 0;
    if (code) map[code] = rate;
  }
  return map;
}

/**
 * Resolve HS code (4- or 6-digit) to effective tariff rate.
 * Uses exact match first, then first 6-digit code that starts with the prefix.
 */
export function getRateForHsCode(ratesMap: Record<string, number>, hsCode: string): number {
  if (!hsCode) return 25;
  const key = String(hsCode).trim();
  if (ratesMap[key] !== undefined) return ratesMap[key];
  // Prefix match: e.g. "4407" -> first 4407xx
  const prefix = key.length <= 6 ? key : key.slice(0, 6);
  const match = Object.keys(ratesMap).find((k) => k.startsWith(prefix) || prefix.startsWith(k));
  return match !== undefined ? ratesMap[match] : 25;
}

export function useTariffRates(): {
  ratesMap: Record<string, number>;
  getRate: (hsCode: string) => number;
  loaded: boolean;
} {
  const [ratesMap, setRatesMap] = useState<Record<string, number>>(cachedRates);
  const loaded = Object.keys(ratesMap).length > 0;

  useEffect(() => {
    if (Object.keys(cachedRates).length > 0) {
      setRatesMap(cachedRates);
      return;
    }
    if (!cachedPromise) {
      cachedPromise = fetchTariffs().then((tariffs) => {
        cachedRates = buildRatesMap(tariffs);
        return cachedRates;
      });
    }
    cachedPromise.then((map) => {
      cachedRates = map;
      setRatesMap(map);
    });
  }, []);

  const getRate = useMemo(
    () => (hsCode: string) => getRateForHsCode(ratesMap, hsCode),
    [ratesMap]
  );

  return { ratesMap, getRate, loaded };
}
