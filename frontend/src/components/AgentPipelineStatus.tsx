/**
 * Compact agent pipeline status for the left panel when idle — shows what will run.
 */
const AGENTS = [
  { id: "supply_chain", label: "Supply Chain", step: "Map inputs & US exposure" },
  { id: "tariff", label: "Tariff", step: "Classify HS codes, compute impact" },
  { id: "geopolitical", label: "Geopolitical", step: "Trade news & risk signals" },
  { id: "supplier_scout", label: "Supplier Scout", step: "Find non-tariff alternatives" },
  { id: "strategy", label: "Strategy", step: "Survival plan & priority actions" },
] as const;

export default function AgentPipelineStatus() {
  return (
    <div className="mt-3 pt-3 border-t border-white/[0.06]">
      <div className="text-[8px] font-mono uppercase tracking-widest text-white/20 mb-2">
        Pipeline (on Run)
      </div>
      <ul className="space-y-1.5">
        {AGENTS.map((a, i) => (
          <li
            key={a.id}
            className="flex items-center gap-2 text-[9px] text-white/30"
          >
            <span className="w-3.5 h-3.5 rounded border border-white/[0.1] flex items-center justify-center text-[7px] font-mono text-white/25 shrink-0">
              {i + 1}
            </span>
            <span className="font-mono text-white/40 shrink-0">{a.label}</span>
            <span className="text-white/20 truncate">→ {a.step}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
