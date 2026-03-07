import { useMemo } from "react";
import { motion } from "framer-motion";
import type { AgentInfo, SystemEvent } from "../types";

interface RagTracePanelProps {
  agents: AgentInfo[];
  systemEvents: SystemEvent[];
}

interface Stage {
  id: string;
  label: string;
  source: string;
  done: boolean;
  active: boolean;
}

export default function RagTracePanel({ agents, systemEvents }: RagTracePanelProps) {
  const byId = Object.fromEntries(agents.map((a) => [a.id, a]));

  const stages: Stage[] = useMemo(() => {
    const supply = byId["supply_chain"];
    const tariff = byId["tariff_calculator"];
    const geo = byId["geopolitical"];
    const supplier = byId["supplier_scout"];
    const strategy = byId["strategy"];

    const hasRagStart = systemEvents.some((e) =>
      e.message.toLowerCase().includes("running rag pipeline")
    );
    const hasRagDone = systemEvents.some((e) =>
      e.message.toLowerCase().includes("classified")
    );
    const geoFoundNews = geo?.messages.some((m) =>
      m.toLowerCase().includes("relevant news")
    );
    const supplierFound = supplier?.messages.some((m) =>
      m.toLowerCase().includes("found alternatives")
    );

    return [
      {
        id: "extract",
        label: "Extract Supply Inputs",
        source: "BUSINESS PROFILE",
        done: supply?.status === "done",
        active: supply?.status === "running",
      },
      {
        id: "vector",
        label: "Vector Search + HS Match",
        source: "HS VECTOR DB",
        done: hasRagDone,
        active: hasRagStart && !hasRagDone,
      },
      {
        id: "news",
        label: "Trade News Retrieval",
        source: "NEWS SOURCES",
        done: !!geoFoundNews || geo?.status === "done",
        active: geo?.status === "running",
      },
      {
        id: "suppliers",
        label: "Alt Supplier Retrieval",
        source: "SUPPLIER INDEX",
        done: !!supplierFound || supplier?.status === "done",
        active: supplier?.status === "running",
      },
      {
        id: "synthesis",
        label: "Strategy Synthesis",
        source: "MULTI-AGENT MEMORY",
        done: strategy?.status === "done",
        active: strategy?.status === "running" || tariff?.status === "running",
      },
    ];
  }, [agents, byId, systemEvents]);

  const evidenceFeed = useMemo(() => {
    const lines: { source: string; text: string; color: string }[] = [];

    for (const e of systemEvents.slice(-5)) {
      lines.push({
        source: "RAG CORE",
        text: e.message,
        color: e.status === "complete" ? "#16a34a" : "#3b82f6",
      });
    }

    for (const agent of agents) {
      for (const msg of agent.messages.slice(-2)) {
        if (
          /found|classified|search|news|tariff|scenario|synthesizing|alternatives/i.test(
            msg
          )
        ) {
          lines.push({ source: agent.name.toUpperCase(), text: msg, color: agent.color });
        }
      }
    }

    return lines.slice(-10);
  }, [agents, systemEvents]);

  return (
    <div className="border-t border-white/[0.06] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-white/25">
          RAG Trace
        </h3>
        <span className="text-[9px] font-mono text-white/20">
          {stages.filter((s) => s.done).length}/{stages.length} Stages
        </span>
      </div>

      <div className="space-y-2">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="relative border px-2.5 py-2 overflow-hidden"
            style={{
              borderColor: stage.done
                ? "rgba(34,197,94,0.35)"
                : stage.active
                  ? "rgba(59,130,246,0.35)"
                  : "rgba(255,255,255,0.06)",
              background: stage.done
                ? "rgba(22,163,74,0.07)"
                : "rgba(15,17,23,0.6)",
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
              <span
                className="text-[8px] font-mono uppercase tracking-wider"
                style={{
                  color: stage.done
                    ? "#22c55e"
                    : stage.active
                      ? "#60a5fa"
                      : "rgba(255,255,255,0.25)",
                }}
              >
                {stage.done ? "Complete" : stage.active ? "Retrieving" : "Queued"}
              </span>
            </div>
            <div className="relative text-[8px] font-mono text-white/25 mt-1">{stage.source}</div>
          </div>
        ))}
      </div>

      <div className="border border-white/[0.06] p-2.5 space-y-1.5 max-h-40 overflow-y-auto bg-white/[0.01]">
        <div className="text-[9px] font-mono uppercase tracking-widest text-white/20">
          Evidence Stream
        </div>
        {evidenceFeed.length === 0 ? (
          <div className="text-[9px] text-white/20 font-mono">Waiting for retrieval activity...</div>
        ) : (
          evidenceFeed.map((row, i) => (
            <div key={`${row.source}-${i}`} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: row.color }} />
              <span className="text-[8px] font-mono text-white/25 shrink-0">{row.source}</span>
              <span className="text-[9px] text-white/45 leading-tight">{row.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
