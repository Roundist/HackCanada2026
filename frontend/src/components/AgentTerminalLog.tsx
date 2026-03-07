import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChainOfThoughtEntry } from "../types";
import TradeIntelligenceMap from "./TradeIntelligenceMap";

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

  const showGraph = log.length === 0 && !isRunning;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 py-2 border-b border-gray-200 flex items-center gap-2 shrink-0 bg-white">
        <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500">
          Chain of Thought
        </span>
        {isRunning && (
          <span className="text-[8px] font-mono text-amber-600 animate-pulse">LIVE</span>
        )}
        {isComplete && (
          <span className="text-[8px] font-mono text-emerald-600">COMPLETE</span>
        )}
      </div>
      <div
        ref={scrollRef}
        className={`flex-1 min-h-[300px] overflow-y-auto overflow-x-hidden font-mono text-[10px] leading-relaxed ${log.length > 0 ? "p-3 space-y-0.5" : ""}`}
        className={`flex-1 min-h-[300px] overflow-y-auto overflow-x-hidden font-mono text-[10px] leading-relaxed bg-gray-50 border-b border-gray-200 ${log.length > 0 ? "p-3 space-y-0.5" : ""}`}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {showGraph && <TradeIntelligenceMap />}
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
                style={{ color: AGENT_COLORS[entry.agent] ?? "#64748b", minWidth: "8rem" }}
              >
                [{entry.agent}]
              </span>
              <span className="text-gray-700 break-words">{entry.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {isRunning && log.length > 0 && (
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="inline-block w-2 h-3 mt-0.5 bg-amber-500"
          />
        )}
      </div>
    </div>
  );
}
