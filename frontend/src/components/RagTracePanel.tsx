import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AgentInfo, HsClassification, ReasoningStep, SystemEvent } from "../types";

interface RagTracePanelProps {
  agents: AgentInfo[];
  systemEvents: SystemEvent[];
  hsClassifications: HsClassification[];
  reasoningSteps: ReasoningStep[];
}

export default function RagTracePanel({ agents, systemEvents, hsClassifications, reasoningSteps }: RagTracePanelProps) {
  const [expandedHs, setExpandedHs] = useState<string | null>(null);
  const [tab, setTab] = useState<"rag" | "reasoning">("rag");

  const byId = Object.fromEntries(agents.map((a) => [a.id, a]));

  const stages = useMemo(() => {
    const supply = byId["supply_chain"];
    const geo = byId["geopolitical"];
    const supplier = byId["supplier_scout"];
    const strategy = byId["strategy"];

    const hasRagStart = systemEvents.some((e) => e.message.toLowerCase().includes("running rag pipeline"));
    const hasRagDone = systemEvents.some((e) => e.message.toLowerCase().includes("classified"));

    return [
      { id: "extract", label: "Extract Supply Inputs", source: "BUSINESS PROFILE", done: supply?.status === "done", active: supply?.status === "running" },
      { id: "vector", label: "Vector Search + HS Match", source: "HS VECTOR DB (4,589 codes)", done: hasRagDone, active: hasRagStart && !hasRagDone },
      { id: "news", label: "Trade News Retrieval", source: "CBSA / USTR FILINGS", done: geo?.status === "done", active: geo?.status === "running" },
      { id: "suppliers", label: "Alt Supplier Retrieval", source: "SUPPLIER INDEX", done: supplier?.status === "done", active: supplier?.status === "running" },
      { id: "synthesis", label: "Strategy Synthesis", source: "MULTI-AGENT MEMORY", done: strategy?.status === "done", active: strategy?.status === "running" },
    ];
  }, [agents, byId, systemEvents]);

  return (
    <div className="border-t border-white/[0.06] flex flex-col" style={{ maxHeight: 420 }}>
      {/* Tab header */}
      <div className="flex items-center gap-0 border-b border-white/[0.06] shrink-0">
        <button
          onClick={() => setTab("rag")}
          className={`flex-1 px-4 py-2.5 text-[9px] font-mono uppercase tracking-widest transition-colors ${tab === "rag" ? "text-white/60 bg-white/[0.03]" : "text-white/25 hover:text-white/40"}`}
        >
          RAG Evidence ({hsClassifications.length})
        </button>
        <button
          onClick={() => setTab("reasoning")}
          className={`flex-1 px-4 py-2.5 text-[9px] font-mono uppercase tracking-widest transition-colors ${tab === "reasoning" ? "text-white/60 bg-white/[0.03]" : "text-white/25 hover:text-white/40"}`}
        >
          Reasoning Chain ({reasoningSteps.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tab === "rag" && (
          <>
            {/* Pipeline stages */}
            <div className="space-y-1.5">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="relative border px-2.5 py-1.5 overflow-hidden"
                  style={{
                    borderColor: stage.done ? "rgba(34,197,94,0.35)" : stage.active ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.06)",
                    background: stage.done ? "rgba(22,163,74,0.07)" : "rgba(15,17,23,0.6)",
                  }}
                >
                  {stage.active && (
                    <motion.div
                      className="absolute inset-y-0 w-14 bg-gradient-to-r from-transparent via-blue-300/20 to-transparent"
                      animate={{ x: [-80, 280] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  <div className="relative flex items-center justify-between gap-2">
                    <span className="text-[10px] text-white/60">{stage.label}</span>
                    <span className="text-[8px] font-mono uppercase tracking-wider" style={{
                      color: stage.done ? "#22c55e" : stage.active ? "#60a5fa" : "rgba(255,255,255,0.25)",
                    }}>
                      {stage.done ? "Done" : stage.active ? "Active" : "Queued"}
                    </span>
                  </div>
                  <div className="relative text-[8px] font-mono text-white/20 mt-0.5">{stage.source}</div>
                </div>
              ))}
            </div>

            {/* HS Classification Evidence */}
            {hsClassifications.length > 0 && (
              <div className="space-y-1.5 mt-3">
                <div className="text-[9px] font-mono uppercase tracking-widest text-white/25">
                  HS Code Classification Evidence
                </div>
                <AnimatePresence>
                  {hsClassifications.map((cls, i) => {
                    const isExpanded = expandedHs === cls.input;
                    return (
                      <motion.div
                        key={cls.input}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="border border-white/[0.06] overflow-hidden"
                        style={{ background: "rgba(15,17,23,0.7)" }}
                      >
                        <button
                          onClick={() => setExpandedHs(isExpanded ? null : cls.input)}
                          className="w-full text-left px-2.5 py-2 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] text-white/60 truncate">{cls.input}</span>
                            <span className="text-[9px] font-mono text-cyan-400/70 shrink-0">→ {cls.selectedCode}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-[8px] font-mono text-green-400/60">
                              {(cls.candidates[0]?.similarity * 100).toFixed(0)}% match
                            </span>
                            <span className="text-[10px] text-white/20">{isExpanded ? "▲" : "▼"}</span>
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-2.5 pb-2.5 space-y-1.5">
                                {/* Candidate list with similarity bars */}
                                <div className="text-[8px] font-mono text-white/20 uppercase tracking-wider">
                                  Top-5 Vector Search Results
                                </div>
                                {cls.candidates.map((c, j) => {
                                  const isSelected = c.hsCode === cls.selectedCode;
                                  return (
                                    <div key={c.hsCode} className="flex items-center gap-2">
                                      <span className={`text-[9px] font-mono shrink-0 w-14 ${isSelected ? "text-cyan-400/80" : "text-white/30"}`}>
                                        {c.hsCode}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <div className="h-1.5 bg-white/[0.04] overflow-hidden">
                                          <div
                                            className="h-full transition-all"
                                            style={{
                                              width: `${c.similarity * 100}%`,
                                              background: isSelected ? "rgba(34,211,238,0.5)" : j === 0 && !isSelected ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.1)",
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <span className={`text-[8px] font-mono shrink-0 w-10 text-right ${isSelected ? "text-cyan-400/70" : "text-white/25"}`}>
                                        {(c.similarity * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                  );
                                })}
                                {/* Tariff source citation */}
                                <div className="mt-1.5 pt-1.5 border-t border-white/[0.04] flex items-start gap-2">
                                  <span className="text-[8px] font-mono text-white/15 shrink-0">SRC</span>
                                  <span className="text-[8px] font-mono text-white/30">{cls.source}</span>
                                </div>
                                <div className="flex gap-4 text-[8px] font-mono">
                                  <span className="text-white/25">MFN: {cls.mfnRate}%</span>
                                  <span className="text-red-400/60">Surtax: +{cls.surtaxRate}%</span>
                                  <span className="text-red-400/80">Effective: {cls.effectiveRate}%</span>
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
          </>
        )}

        {tab === "reasoning" && (
          <div className="space-y-2">
            {reasoningSteps.length === 0 ? (
              <div className="text-[9px] text-white/20 font-mono py-4 text-center">
                Waiting for tariff calculations...
              </div>
            ) : (
              <AnimatePresence>
                {reasoningSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="border border-white/[0.06] p-2.5"
                    style={{ background: "rgba(15,17,23,0.7)" }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[8px] font-mono uppercase tracking-wider text-white/20">Step {i + 1}</span>
                      <span className="text-[8px] font-mono text-rose-400/50">{step.agent}</span>
                    </div>
                    <div className="space-y-1 text-[9px] font-mono">
                      <div className="flex items-start gap-2">
                        <span className="text-white/20 shrink-0">IN</span>
                        <span className="text-white/50">{step.input}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-cyan-400/40 shrink-0">OP</span>
                        <span className="text-cyan-400/60">{step.operation}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-400/40 shrink-0">OUT</span>
                        <span className="text-green-400/60">{step.result}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
