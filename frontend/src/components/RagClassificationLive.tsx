import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AgentInfo, HsClassification, SystemEvent } from "../types";

interface RagClassificationLiveProps {
  agents: AgentInfo[];
  systemEvents: SystemEvent[];
  hsClassifications: HsClassification[];
}

const PIPELINE_STAGES = [
  { id: "supply_chain", label: "Extract supply chain inputs", source: "Business description → structured inputs" },
  { id: "vector_search", label: "Semantic search over 4,589 HS codes", source: "ChromaDB · Gemini embeddings" },
  { id: "hs_rank", label: "LLM ranks top-5 candidates", source: "Gemini 2.5 Flash · confidence scoring" },
  { id: "tariff_lookup", label: "Look up CBSA tariff rates", source: "CBSA Customs Tariff 2025 · SOR/2025-28" },
  { id: "tariff_calc", label: "Compute tariff exposure", source: "spend × rate per HS code → total" },
];

export default function RagClassificationLive({ agents, systemEvents, hsClassifications }: RagClassificationLiveProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const supplyDone = agents.find(a => a.id === "supply_chain")?.status === "done";
  const supplyRunning = agents.find(a => a.id === "supply_chain")?.status === "running";
  const tariffDone = agents.find(a => a.id === "tariff_calculator")?.status === "done";
  const tariffRunning = agents.find(a => a.id === "tariff_calculator")?.status === "running";

  const ragStarted = systemEvents.some(e => e.message.toLowerCase().includes("rag pipeline") || e.message.toLowerCase().includes("classifying hs"));
  const ragDone = systemEvents.some(e => e.message.toLowerCase().includes("classified") && e.message.toLowerCase().includes("input"));

  const stageStatus = (id: string): "done" | "active" | "queued" => {
    switch (id) {
      case "supply_chain": return supplyDone ? "done" : supplyRunning ? "active" : "queued";
      case "vector_search": return ragDone ? "done" : ragStarted ? "active" : supplyDone ? "active" : "queued";
      case "hs_rank": return ragDone ? "done" : ragStarted ? "active" : "queued";
      case "tariff_lookup": return ragDone ? "done" : "queued";
      case "tariff_calc": return tariffDone ? "done" : tariffRunning ? "active" : ragDone ? "active" : "queued";
      default: return "queued";
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono uppercase tracking-widest text-gray-600">RAG Pipeline</span>
          {hsClassifications.length > 0 && (
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
              {hsClassifications.length} classified
            </span>
          )}
        </div>
        <span className="text-[8px] font-mono text-gray-400">4,589 HS codes indexed</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Pipeline stages */}
        <div className="space-y-1.5">
          <div className="text-[8px] font-mono uppercase tracking-widest text-gray-400 mb-2">Pipeline Stages</div>
          {PIPELINE_STAGES.map((stage, i) => {
            const status = stageStatus(stage.id);
            return (
              <div
                key={stage.id}
                className="relative border rounded-md px-2.5 py-1.5 overflow-hidden"
                style={{
                  borderColor: status === "done" ? "#86efac" : status === "active" ? "#93c5fd" : "#e5e7eb",
                  background: status === "done" ? "#f0fdf4" : status === "active" ? "#eff6ff" : "#fafafa",
                }}
              >
                {status === "active" && (
                  <motion.div
                    className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-blue-200/50 to-transparent"
                    animate={{ x: [-80, 320] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                  />
                )}
                <div className="relative flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-[9px] font-mono shrink-0 w-4"
                      style={{ color: status === "done" ? "#16a34a" : status === "active" ? "#2563eb" : "#9ca3af" }}
                    >
                      {status === "done" ? "✓" : status === "active" ? `${i + 1}` : `${i + 1}`}
                    </span>
                    <span className="text-[10px] text-gray-700 truncate">{stage.label}</span>
                  </div>
                  <span
                    className="text-[8px] font-mono uppercase tracking-wider shrink-0"
                    style={{ color: status === "done" ? "#16a34a" : status === "active" ? "#2563eb" : "#9ca3af" }}
                  >
                    {status === "done" ? "Done" : status === "active" ? "Running" : "Queued"}
                  </span>
                </div>
                <div className="relative text-[8px] font-mono text-gray-400 mt-0.5">{stage.source}</div>
              </div>
            );
          })}
        </div>

        {/* Live HS Classification Evidence */}
        {hsClassifications.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[8px] font-mono uppercase tracking-widest text-gray-400 mt-1">
              HS Classification Evidence
            </div>
            <AnimatePresence>
              {hsClassifications.map((cls, i) => {
                const isOpen = expanded === cls.input;
                const topCandidate = cls.candidates[0];
                const selected = cls.candidates.find(c => c.hsCode === cls.selectedCode) ?? cls.candidates[0];

                return (
                  <motion.div
                    key={cls.input}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="border border-gray-200 rounded-md overflow-hidden bg-white"
                  >
                    {/* Collapsed row */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : cls.input)}
                      className="w-full text-left px-2.5 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                      {/* Similarity bar */}
                      <div className="w-12 h-1.5 bg-gray-200 rounded overflow-hidden shrink-0">
                        <div
                          className="h-full rounded bg-cyan-500"
                          style={{ width: `${(topCandidate?.similarity ?? 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-700 flex-1 truncate">{cls.input}</span>
                      <span className="text-[9px] font-mono text-cyan-600 shrink-0">→ {cls.selectedCode}</span>
                      <span className="text-[8px] font-mono text-red-600 shrink-0">{cls.effectiveRate}%</span>
                      <span className="text-[9px] text-gray-400">{isOpen ? "▲" : "▼"}</span>
                    </button>

                    {/* Expanded: full candidate list */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-gray-100"
                        >
                          <div className="px-2.5 py-2.5 space-y-2 bg-gray-50">
                            <div className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">
                              Top-5 Vector Search Candidates
                            </div>
                            {cls.candidates.map((c) => {
                              const isSelected = c.hsCode === cls.selectedCode;
                              return (
                                <div key={c.hsCode} className="flex items-center gap-2">
                                  <span
                                    className="text-[9px] font-mono shrink-0 w-14"
                                    style={{ color: isSelected ? "#0891b2" : "#6b7280" }}
                                  >
                                    {c.hsCode}
                                    {isSelected && " ✓"}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                                      <motion.div
                                        className="h-full rounded"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${c.similarity * 100}%` }}
                                        transition={{ duration: 0.5, delay: 0.1 }}
                                        style={{ background: isSelected ? "#0891b2" : "#d1d5db" }}
                                      />
                                    </div>
                                    <div className="text-[8px] text-gray-500 truncate mt-0.5">{c.description}</div>
                                  </div>
                                  <span className="text-[8px] font-mono shrink-0 w-8 text-right text-gray-500">
                                    {(c.similarity * 100).toFixed(0)}%
                                  </span>
                                </div>
                              );
                            })}
                            {/* Citation */}
                            <div className="pt-1.5 border-t border-gray-200 space-y-0.5">
                              <div className="text-[8px] font-mono text-gray-400">{cls.source}</div>
                              <div className="flex gap-3 text-[8px] font-mono">
                                <span className="text-gray-500">MFN {cls.mfnRate}%</span>
                                <span className="text-red-600">+ Surtax {cls.surtaxRate}%</span>
                                <span className="font-semibold text-red-700">= {cls.effectiveRate}% effective</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {hsClassifications.length === 0 && !ragStarted && (
          <div className="text-[9px] font-mono text-gray-400 text-center py-6">
            Waiting for Supply Chain Analyst to complete...
          </div>
        )}
        {ragStarted && hsClassifications.length === 0 && (
          <div className="flex items-center gap-2 text-[9px] font-mono text-blue-600 py-4 justify-center">
            <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }}>
              Searching 4,589 HS codes...
            </motion.span>
          </div>
        )}
      </div>
    </div>
  );
}
