import { motion, AnimatePresence } from "framer-motion";
import type { AgentInfo } from "../types";

interface FindingsPanelProps {
  agents: AgentInfo[];
  pipelineDone: boolean;
}

export default function FindingsPanel({ agents, pipelineDone }: FindingsPanelProps) {
  const allMessages: { agent: AgentInfo; message: string; index: number }[] = [];
  let globalIndex = 0;

  for (const agent of agents) {
    if (agent.status !== "idle") {
      if (agent.status === "running" || agent.status === "done") {
        allMessages.push({
          agent,
          message: `${agent.name} activated`,
          index: globalIndex++,
        });
      }
      for (const msg of agent.messages) {
        allMessages.push({ agent, message: msg, index: globalIndex++ });
      }
      if (agent.status === "done") {
        allMessages.push({
          agent,
          message: `${agent.name} -- complete`,
          index: globalIndex++,
        });
      }
    }
  }

  const runningAgents = agents.filter((a) => a.status === "running");
  const tariffAgent = agents.find((a) => a.id === "tariff_calculator");
  const supplierAgent = agents.find((a) => a.id === "supplier_scout");
  const geoAgent = agents.find((a) => a.id === "geopolitical");

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <div className="text-[10px] font-mono uppercase tracking-widest text-white/25">Live Findings</div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${pipelineDone ? "bg-accent-green" : "bg-accent-red status-blink"}`} />
          <span className="text-[9px] font-mono text-white/20">{pipelineDone ? "DONE" : "LIVE"}</span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="px-4 py-3 border-b border-white/[0.06] space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Tariff Exposure"
            value={tariffAgent?.status === "done" ? "$342K" : "--"}
            active={tariffAgent?.status === "done"}
            color="#dc2626"
          />
          <MetricCard
            label="Margin Impact"
            value={tariffAgent?.status === "done" ? "-8.4%" : "--"}
            active={tariffAgent?.status === "done"}
            color="#d97706"
          />
          <MetricCard
            label="Alt Suppliers"
            value={supplierAgent?.status === "done" ? "5 found" : "--"}
            active={supplierAgent?.status === "done"}
            color="#16a34a"
          />
          <MetricCard
            label="Risk Level"
            value={geoAgent?.status === "done" ? "HIGH" : "--"}
            active={geoAgent?.status === "done"}
            color="#dc2626"
          />
        </div>
      </div>

      {/* Live Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        <AnimatePresence>
          {allMessages.slice(-40).map((item) => (
            <motion.div
              key={item.index}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-2 py-0.5"
            >
              <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: item.agent.color }} />
              <span className="text-[10px] font-mono text-white/35 leading-relaxed">{item.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {runningAgents.map((agent) => (
          <div key={agent.id} className="flex items-center gap-2 mt-1.5">
            <div className="w-1 h-1 rounded-full" style={{ background: agent.color }} />
            <div className="flex gap-0.5">
              <div className="typing-dot w-1 h-1 rounded-full" style={{ background: agent.color }} />
              <div className="typing-dot w-1 h-1 rounded-full" style={{ background: agent.color }} />
              <div className="typing-dot w-1 h-1 rounded-full" style={{ background: agent.color }} />
            </div>
            <span className="text-[9px] font-mono text-white/15">{agent.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value, active, color }: { label: string; value: string; active?: boolean; color: string }) {
  return (
    <div className="border border-white/[0.04] p-2.5" style={{ background: active ? `${color}06` : "rgba(15,17,23,0.5)" }}>
      <div className="text-[8px] font-mono uppercase tracking-wider text-white/20">{label}</div>
      <div className="text-sm font-semibold mt-1" style={{ color: active ? color : "rgba(255,255,255,0.1)" }}>
        {value}
      </div>
    </div>
  );
}
