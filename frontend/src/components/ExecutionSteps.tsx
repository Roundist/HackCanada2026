import type { AgentInfo } from "../types";
import { getAgentActivity } from "../hooks/useAgentState";

interface ExecutionStepsProps {
  agents: AgentInfo[];
}

const STEPS = [
  { key: "supply_chain", label: "Parse business profile", agentId: "supply_chain" },
  { key: "tariff_match", label: "HS code + tariff map", agentId: "tariff_calculator" },
  { key: "policy", label: "Geopolitical scenario", agentId: "geopolitical" },
  { key: "suppliers", label: "Supplier alternatives", agentId: "supplier_scout" },
  { key: "strategy", label: "Strategy synthesis", agentId: "strategy" },
];

export default function ExecutionSteps({ agents }: ExecutionStepsProps) {
  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

  return (
    <div className="py-3 flex items-center gap-2 overflow-x-auto">
      <div className="text-[9px] font-mono uppercase tracking-[0.26em] text-white/40 px-2">Pipeline</div>
      {STEPS.map((step, i) => {
        const agent = agentMap[step.agentId];
        const isRunning = agent?.status === "running";
        const isDone = agent?.status === "done";
<<<<<<< HEAD
        const stateColor = isRunning ? agent.color : isDone ? "#22c55e" : "rgba(255,255,255,0.25)";

        return (
          <div key={step.key} className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-3 py-2 border rounded-sm"
              style={{
                borderColor: `${stateColor}55`,
                background: isRunning ? `${agent.color}12` : "rgba(12,16,24,0.7)",
                boxShadow: isRunning ? `0 6px 24px ${agent.color}16` : undefined,
              }}
            >
              <div
                className={`w-2 h-2 rounded-full ${isRunning ? "status-blink" : ""}`}
                style={{ background: stateColor }}
              />
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] whitespace-nowrap" style={{ color: stateColor }}>
                {step.label}
=======
        const isActive = isRunning || isDone;
        const stepLabel = agent && (agent.messages.length > 0 || agent.status !== "idle") ? getAgentActivity(agent) : step.label;

        return (
          <div key={step.key} className="flex items-center gap-1">
            <div className="flex items-center gap-1.5 px-2 py-1 border max-w-[140px]" style={{
              borderColor: isActive ? `${agent.color}33` : "rgba(255,255,255,0.04)",
              background: isRunning ? `${agent.color}08` : "transparent",
            }}>
              <div
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${isRunning ? "status-blink" : ""}`}
                style={{
                  background: isDone ? "#16a34a" : isRunning ? agent.color : "rgba(255,255,255,0.1)",
                }}
              />
              <span className="text-[9px] font-mono whitespace-nowrap truncate" title={stepLabel} style={{
                color: isRunning ? agent.color : isDone ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)",
              }}>
                {stepLabel}
>>>>>>> ec147a2ee4dbe0c062915b60d5ae25d3c521076f
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="w-5 h-px bg-white/10" />}
          </div>
        );
      })}
    </div>
  );
}
