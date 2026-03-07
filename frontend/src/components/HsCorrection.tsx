import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { HsClassification } from "../types";

interface HsCorrectionProps {
  sessionId: string;
  hsClassifications: HsClassification[];
  /** Called with the updated tariff_impact when recalculation completes. */
  onRecalculated: (updatedTariffImpact: Record<string, unknown>) => void;
}

interface ReclassifyResult {
  input_name: string;
  old_hs_code: string;
  new_hs_code: string;
  old_tariff_rate: number;
  new_tariff_rate: number;
  old_annual_tariff_cost: number;
  new_annual_tariff_cost: number;
  savings_from_correction: number;
}

type CorrectionState =
  | { status: "idle" }
  | { status: "open"; input: string }
  | { status: "loading"; input: string }
  | { status: "success"; input: string; result: ReclassifyResult }
  | { status: "error"; input: string; message: string };

export default function HsCorrection({ sessionId, hsClassifications, onRecalculated }: HsCorrectionProps) {
  const [state, setState] = useState<CorrectionState>({ status: "idle" });
  const [recalculating, setRecalculating] = useState(false);

  const openCorrection = (inputName: string) => {
    setState({ status: "open", input: inputName });
  };

  const close = () => setState({ status: "idle" });

  const selectCandidate = useCallback(async (inputName: string, hsCode: string) => {
    setState({ status: "loading", input: inputName });
    try {
      const res = await fetch(`/api/session/${sessionId}/reclassify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_name: inputName, selected_hs_code: hsCode }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        setState({ status: "error", input: inputName, message: err.detail ?? "Reclassification failed" });
        return;
      }

      const result: ReclassifyResult = await res.json();
      setState({ status: "success", input: inputName, result });

      // Poll for recalculated tariff_impact (backend re-runs Agent 2 async)
      setRecalculating(true);
      await pollForUpdate(sessionId, onRecalculated);
      setRecalculating(false);
    } catch (e) {
      setState({ status: "error", input: inputName, message: String(e) });
    }
  }, [sessionId, onRecalculated]);

  if (hsClassifications.length === 0) return null;

  const activeInput = "input" in state ? state.input : null;
  const activeCls = hsClassifications.find(c => c.input === activeInput);

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono uppercase tracking-widest text-gray-600">
            HS Code Classifications
          </span>
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
            RAG · CBSA 2025
          </span>
        </div>
        <span className="text-[8px] font-mono text-gray-400">Click any input to correct classification</span>
      </div>

      {/* Classification rows */}
      <div className="divide-y divide-gray-100">
        {hsClassifications.map((cls) => {
          const isActive = activeInput === cls.input;
          const successResult = state.status === "success" && state.input === cls.input ? state.result : null;
          const isError = state.status === "error" && state.input === cls.input;
          const isLoading = state.status === "loading" && state.input === cls.input;
          const topSimilarity = cls.candidates[0]?.similarity ?? 0;

          return (
            <div key={cls.input}>
              {/* Row */}
              <div className="px-4 py-2.5 flex items-center gap-3">
                {/* Similarity indicator */}
                <div className="w-1 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                  <div
                    className="w-full rounded-full bg-cyan-500 transition-all"
                    style={{ height: `${topSimilarity * 100}%`, marginTop: `${(1 - topSimilarity) * 100}%` }}
                  />
                </div>

                {/* Input name + HS code */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-gray-800 truncate">{cls.input}</span>
                    {successResult && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200"
                      >
                        Corrected
                      </motion.span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-mono text-cyan-700">
                      {successResult ? successResult.new_hs_code : cls.selectedCode}
                    </span>
                    <span className="text-[8px] text-gray-400">·</span>
                    <span className="text-[8px] font-mono text-gray-500">
                      {((topSimilarity) * 100).toFixed(0)}% match
                    </span>
                    <span className="text-[8px] text-gray-400">·</span>
                    <span className="text-[8px] font-mono text-red-600">{cls.effectiveRate}% effective</span>
                    <span className="text-[8px] text-gray-400">{cls.source}</span>
                  </div>
                </div>

                {/* Correction delta */}
                {successResult && (
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-right shrink-0"
                  >
                    <div className={`text-[11px] font-semibold ${successResult.savings_from_correction >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {successResult.savings_from_correction >= 0 ? "−" : "+"}
                      ${Math.abs(successResult.savings_from_correction).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-[8px] font-mono text-gray-400">exposure delta</div>
                  </motion.div>
                )}

                {/* Correct button */}
                <button
                  onClick={() => isActive ? close() : openCorrection(cls.input)}
                  disabled={isLoading || recalculating}
                  className={`shrink-0 px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider border rounded transition-all disabled:opacity-40 ${
                    isActive
                      ? "border-gray-400 text-gray-600 bg-gray-100"
                      : "border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                  }`}
                >
                  {isLoading ? "..." : isActive ? "Cancel" : "Correct"}
                </button>
              </div>

              {/* Candidate picker (open state) */}
              <AnimatePresence>
                {isActive && activeCls && state.status === "open" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-gray-100 bg-gray-50"
                  >
                    <div className="px-4 py-3 space-y-2">
                      <div className="text-[8px] font-mono uppercase tracking-widest text-gray-500">
                        Select the correct HS code — recalculation runs instantly
                      </div>
                      {activeCls.candidates.map((c) => {
                        const isCurrentlySelected = c.hsCode === activeCls.selectedCode;
                        return (
                          <button
                            key={c.hsCode}
                            onClick={() => selectCandidate(cls.input, c.hsCode)}
                            disabled={isCurrentlySelected}
                            className={`w-full text-left px-3 py-2 rounded-md border transition-all flex items-center gap-3 ${
                              isCurrentlySelected
                                ? "border-cyan-300 bg-cyan-50 cursor-default"
                                : "border-gray-200 bg-white hover:border-cyan-300 hover:bg-cyan-50"
                            }`}
                          >
                            {/* Similarity bar */}
                            <div className="w-16 h-1.5 bg-gray-200 rounded overflow-hidden shrink-0">
                              <div
                                className="h-full rounded bg-cyan-500"
                                style={{ width: `${c.similarity * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-cyan-700 shrink-0 w-16">{c.hsCode}</span>
                            <span className="text-[10px] text-gray-700 flex-1 truncate">{c.description}</span>
                            <span className="text-[9px] font-mono text-gray-500 shrink-0">
                              {(c.similarity * 100).toFixed(0)}%
                            </span>
                            {isCurrentlySelected && (
                              <span className="text-[8px] font-mono text-cyan-600 shrink-0">current</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Loading state */}
                {isActive && isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-t border-gray-100 bg-blue-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-2 text-[10px] font-mono text-blue-700">
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      >
                        Reclassifying HS code...
                      </motion.span>
                    </div>
                  </motion.div>
                )}

                {/* Success: waiting for recalculation */}
                {isActive && state.status === "success" && recalculating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-t border-gray-100 bg-green-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-2 text-[10px] font-mono text-green-700">
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      >
                        Agent 2 recalculating tariff exposure...
                      </motion.span>
                    </div>
                  </motion.div>
                )}

                {/* Error */}
                {isActive && isError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-t border-red-100 bg-red-50 px-4 py-2.5"
                  >
                    <span className="text-[10px] font-mono text-red-700">
                      {state.status === "error" ? state.message : ""}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer: recalculating banner */}
      <AnimatePresence>
        {recalculating && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="border-t border-blue-200 bg-blue-50 px-4 py-2 flex items-center gap-2"
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-blue-500"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <span className="text-[9px] font-mono text-blue-700">
              Tariff Calculator re-running with corrected HS code...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Poll /api/session/{id}/plan until tariff_impact is updated, then call onRecalculated. */
async function pollForUpdate(
  sessionId: string,
  onRecalculated: (impact: Record<string, unknown>) => void,
  maxAttempts = 15,
  intervalMs = 1500
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, intervalMs));
    try {
      const res = await fetch(`/api/session/${sessionId}/plan`);
      if (res.status === 202) continue; // still in progress
      if (!res.ok) return;
      const data = await res.json();
      if (data.tariff_impact) {
        onRecalculated(data.tariff_impact);
        return;
      }
    } catch {
      // network error — keep trying
    }
  }
}
