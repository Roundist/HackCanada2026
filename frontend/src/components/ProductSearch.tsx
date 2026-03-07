import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { searchProducts, type SearchResult } from "../api/client";

export default function ProductSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await searchProducts(q.trim());
      setResults(res);
      setSearched(true);
    } catch {
      setResults([]);
      setSearched(true);
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

  return (
    <div className="border border-white/[0.08] rounded-lg overflow-hidden" style={{ background: "rgba(15,17,23,0.7)" }}>
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="text-[9px] font-mono uppercase tracking-widest text-white/25 mb-2">
          Quick Tariff Lookup
        </div>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Search any product... lumber, steel, electronics"
            className="w-full px-3 py-2 pl-8 border border-white/[0.08] rounded text-[12px] text-white/70 placeholder-white/20 focus:outline-none focus:border-white/[0.2] transition-colors font-mono"
            style={{ background: "rgba(8,10,14,0.8)" }}
          />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {loading && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border border-white/20 border-t-white/60 rounded-full animate-spin" />
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {searched && results.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="divide-y divide-white/[0.04]"
          >
            {results.map((r, i) => (
              <motion.div
                key={r.hs_code}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-white/40 shrink-0">HS {r.hs_code}</span>
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
                    <div className="text-[11px] text-white/60 leading-relaxed line-clamp-2">
                      {r.description}
                    </div>
                    <div className="text-[9px] font-mono text-white/20 mt-1">
                      {r.category} · {(r.similarity * 100).toFixed(0)}% match
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold tabular-nums" style={{ color: rateColor(r.effective_rate) }}>
                      {r.effective_rate}%
                    </div>
                    <div className="text-[8px] font-mono text-white/20 mt-0.5">
                      effective
                    </div>
                    {r.us_retaliatory_rate > 0 && (
                      <div className="text-[9px] font-mono text-red-400/50 mt-1">
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
            <div className="text-[11px] text-white/30">No matching products found</div>
            <div className="text-[9px] font-mono text-white/15 mt-1">Try a different search term</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
