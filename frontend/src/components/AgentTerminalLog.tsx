import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChainOfThoughtEntry } from "../types";
import WorldMapIdle from "./WorldMapIdle";

interface AgentTerminalLogProps {
  log: ChainOfThoughtEntry[];
  isRunning: boolean;
  isComplete: boolean;
}

const AGENT_COLORS: Record<string, string> = {
  "Supply Chain Analyst": "#3B82F6",
  "Tariff Calculator": "#EF4444",
  "Geopolitical Analyst": "#F59E0B",
  "Supplier Scout": "#10B981",
  "Strategy Architect": "#8B5CF6",
  System: "#ffb800",
};

export default function AgentTerminalLog({ log, isRunning, isComplete }: AgentTerminalLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [log.length]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2">
        <span className="text-[9px] font-mono uppercase tracking-widest text-white/25">
          Chain of Thought
        </span>
        {isRunning && (
          <span className="text-[8px] font-mono text-amber-400/80 animate-pulse">LIVE</span>
        )}
        {isComplete && (
          <span className="text-[8px] font-mono text-emerald-400/80">COMPLETE</span>
        )}
      </div>
      <div
        ref={scrollRef}
        className={`flex-1 min-h-0 overflow-y-auto font-mono text-[10px] leading-relaxed ${log.length > 0 ? "p-3 space-y-0.5" : ""}`}
        style={{
          background: log.length === 0 && !isRunning ? "transparent" : "rgba(0,0,0,0.35)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {log.length === 0 && !isRunning && <WorldMapIdle />}
        <AnimatePresence initial={false}>
          {log.map((entry, i) => (
            <motion.div
              key={`${entry.timestamp}-${i}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-x-2 gap-y-0.5 items-baseline"
            >
              <span
                className="shrink-0 font-semibold uppercase tracking-wider"
                style={{ color: AGENT_COLORS[entry.agent] ?? "#94a3b8", minWidth: "8rem" }}
              >
                [{entry.agent}]
              </span>
              <span className="text-white/70 break-words">{entry.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {isRunning && log.length > 0 && (
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="inline-block w-2 h-3 mt-0.5 bg-amber-400/80"
          />
        )}
      </div>
    </div>
  );
}
