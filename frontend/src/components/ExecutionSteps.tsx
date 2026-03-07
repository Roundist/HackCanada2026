import type { AgentInfo } from "../types";

interface ExecutionStepsProps {
  agents: AgentInfo[];
}

const STEPS = [
  { key: "supply_chain", label: "Parsing business profile", agentId: "supply_chain" },
  { key: "tariff_match", label: "Matching HS tariff codes", agentId: "tariff_calculator" },
  { key: "policy", label: "Checking trade policy changes", agentId: "geopolitical" },
  { key: "suppliers", label: "Searching supplier alternatives", agentId: "supplier_scout" },
  { key: "strategy", label: "Generating survival strategy", agentId: "strategy" },
];

export default function ExecutionSteps({ agents }: ExecutionStepsProps) {
  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

  return (
    <div className="px-4 py-3 flex items-center gap-1">
      <div className="text-[9px] font-mono uppercase tracking-widest text-white/20 mr-3 shrink-0">
        Pipeline
      </div>
      {STEPS.map((step, i) => {
        const agent = agentMap[step.agentId];
        const isRunning = agent?.status === "running";
        const isDone = agent?.status === "done";
        const isActive = isRunning || isDone;

        return (
          <div key={step.key} className="flex items-center gap-1">
            <div className="flex items-center gap-1.5 px-2 py-1 border" style={{
              borderColor: isActive ? `${agent.color}33` : "rgba(255,255,255,0.04)",
              background: isRunning ? `${agent.color}08` : "transparent",
            }}>
              <div
                className={`w-1.5 h-1.5 rounded-full ${isRunning ? "status-blink" : ""}`}
                style={{
                  background: isDone ? "#16a34a" : isRunning ? agent.color : "rgba(255,255,255,0.1)",
                }}
              />
              <span className="text-[9px] font-mono whitespace-nowrap" style={{
                color: isRunning ? agent.color : isDone ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)",
              }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-4 h-px" style={{ background: isDone ? `${agent.color}33` : "rgba(255,255,255,0.04)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
