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
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="w-5 h-px bg-white/10" />}
          </div>
        );
      })}
    </div>
  );
}
