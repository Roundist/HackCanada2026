import type { AgentInfo } from "../types";

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
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="w-5 h-px bg-white/10" />}
          </div>
        );
      })}
    </div>
  );
}
