import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { searchProducts, type SearchResult } from "../api/client";

const CBSA_ATTRIBUTION = "Canada Border Services Agency (CBSA) Customs Tariff 2025";

interface ProductSearchProps {
  /** Light theme for use on light backgrounds (e.g. input view). */
  variant?: "dark" | "light";
}

export default function ProductSearch({ variant = "dark" }: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      setSearchError(null);
      return;
    }
    setLoading(true);
    setSearchError(null);
    try {
      const res = await searchProducts(q.trim());
      setResults(res);
      setSearched(true);
      setSearchError(null);
    } catch (e) {
      setResults([]);
      setSearched(true);
      setSearchError(
        e instanceof Error && e.message === "CBSA_LOADING"
          ? "CBSA tariff database is still loading. Try again in a moment."
          : "CBSA tariff database unavailable. Start the backend for live data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(() => doSearch(val), 350);
    } else {
      setResults([]);
      setSearched(false);
    }
  };

  const rateColor = (rate: number) => {
    if (rate >= 25) return "#ef4444";
    if (rate >= 10) return "#f59e0b";
    if (rate > 0) return "#eab308";
    return "#22c55e";
  };

  const rateLabel = (rate: number) => {
    if (rate >= 25) return "HIGH";
    if (rate >= 10) return "MEDIUM";
    if (rate > 0) return "LOW";
    return "FREE";
  };

  const isLight = variant === "light";
  const containerClass = isLight
    ? "border border-gray-200 rounded-lg overflow-hidden shadow-sm"
    : "border border-white/[0.08] rounded-lg overflow-hidden";
  const containerStyle = isLight
    ? { background: "#f5f5f5" }
    : { background: "rgba(15,17,23,0.7)" };
  const headerBorder = isLight ? "border-b border-gray-200" : "border-b border-white/[0.06]";
  const titleClass = isLight ? "text-[9px] font-mono uppercase tracking-widest text-gray-500 mb-1" : "text-[9px] font-mono uppercase tracking-widest text-white/25 mb-1";
  const subTitleClass = isLight ? "text-[8px] font-mono text-gray-400 mb-2" : "text-[8px] font-mono text-white/20 mb-2";
  const inputClass = isLight
    ? "w-full px-3 py-2 pl-8 border border-gray-200 rounded-md text-[12px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 font-mono bg-white"
    : "w-full px-3 py-2 pl-8 border border-white/[0.08] rounded text-[12px] text-white/70 placeholder-white/20 focus:outline-none focus:border-white/[0.2] transition-colors font-mono";
  const inputStyle = isLight ? undefined : { background: "rgba(8,10,14,0.8)" };
  const iconClass = isLight ? "absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" : "absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20";
  const spinnerClass = isLight ? "absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" : "absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border border-white/20 border-t-white/60 rounded-full animate-spin";

  return (
    <div className={containerClass} style={containerStyle}>
      <div className={`px-4 py-3 ${headerBorder}`}>
        <div className={titleClass}>Quick Tariff Lookup</div>
        <div className={subTitleClass} title={CBSA_ATTRIBUTION}>
          Data: CBSA Customs Tariff 2025
        </div>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Search any product... lumber, steel, electronics"
            className={inputClass}
            style={inputStyle}
          />
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {loading && <div className={spinnerClass} />}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {searched && results.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={isLight ? "divide-y divide-gray-100" : "divide-y divide-white/[0.04]"}
          >
            <div className={`px-4 py-2 border-b ${isLight ? "border-gray-200 text-[8px] font-mono text-gray-500" : "border-white/[0.04] text-[8px] font-mono text-white/25"}`}>
              Rates from {CBSA_ATTRIBUTION}
            </div>
            {results.map((r, i) => (
              <motion.div
                key={r.hs_code}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`px-4 py-3 transition-colors ${isLight ? "hover:bg-gray-50" : "hover:bg-white/[0.02]"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-mono shrink-0 ${isLight ? "text-gray-600" : "text-white/40"}`}>HS {r.hs_code}</span>
                      <span className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm border shrink-0"
                        style={{
                          color: rateColor(r.effective_rate),
                          borderColor: `${rateColor(r.effective_rate)}33`,
                          background: `${rateColor(r.effective_rate)}0d`,
                        }}
                      >
                        {rateLabel(r.effective_rate)}
                      </span>
                    </div>
                    <div className={`text-[11px] leading-relaxed line-clamp-2 ${isLight ? "text-gray-700" : "text-white/60"}`}>
                      {r.description}
                    </div>
                    <div className={`text-[9px] font-mono mt-1 ${isLight ? "text-gray-500" : "text-white/20"}`}>
                      {r.category} · {(r.similarity * 100).toFixed(0)}% match
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold tabular-nums" style={{ color: rateColor(r.effective_rate) }}>
                      {r.effective_rate}%
                    </div>
                    <div className={`text-[8px] font-mono mt-0.5 ${isLight ? "text-gray-500" : "text-white/20"}`}>
                      effective
                    </div>
                    {r.us_retaliatory_rate > 0 && (
                      <div className="text-[9px] font-mono text-red-500 mt-1">
                        +{r.us_retaliatory_rate}% retaliatory
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {searched && results.length === 0 && !loading && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-6 text-center"
          >
            {searchError ? (
              <>
                <div className={`text-[11px] ${isLight ? "text-amber-600" : "text-amber-400/80"}`}>{searchError}</div>
                <div className={`text-[9px] font-mono mt-1 ${isLight ? "text-gray-500" : "text-white/20"}`}>Rates are from CBSA when backend is running</div>
              </>
            ) : (
              <>
                <div className={`text-[11px] ${isLight ? "text-gray-600" : "text-white/30"}`}>No matching products found in CBSA tariff database</div>
                <div className={`text-[9px] font-mono mt-1 ${isLight ? "text-gray-500" : "text-white/15"}`}>Try a different search term</div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
