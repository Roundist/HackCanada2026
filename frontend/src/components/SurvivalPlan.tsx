import { motion } from "framer-motion";

interface SurvivalPlanProps {
  result: Record<string, unknown>;
  onReset: () => void;
}

export default function SurvivalPlan({ result, onReset }: SurvivalPlanProps) {
  const plan = (result.survival_plan || result) as Record<string, unknown>;
  const summary = plan.executive_summary as Record<string, unknown> | undefined;
  const actions = (plan.priority_actions || []) as Record<string, unknown>[];
  const timeline = plan.timeline as Record<string, string[]> | undefined;
  const risks = (plan.risks || []) as Record<string, unknown>[];
  const tariffImpact = result.tariff_impact as Record<string, unknown> | undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white/90">
            Trade War Survival Plan
          </h2>
          {summary && (
            <p className="text-sm text-white/40 mt-1">
              {summary.business_name as string}
            </p>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onReset}
          className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
        >
          New Analysis
        </motion.button>
      </div>

      {/* Executive Summary */}
      {summary && (
        <div
          className="rounded-xl p-6"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))",
            border: "1px solid rgba(99,102,241,0.15)",
          }}
        >
          <h3 className="text-lg font-bold text-white/80 mb-2">
            {summary.headline as string}
          </h3>
          <p className="text-sm text-white/50">{summary.key_finding as string}</p>
          <div className="flex gap-6 mt-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/30">
                Tariff Exposure
              </div>
              <div className="text-xl font-bold text-red-400">
                ${((summary.total_tariff_exposure as number) || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/30">
                Risk Level
              </div>
              <div className="text-xl font-bold text-amber-400 uppercase">
                {summary.risk_level as string}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tariff Impact Stats */}
      {tariffImpact && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Total Exposure",
              value: `$${((tariffImpact.total_tariff_exposure as number) || 0).toLocaleString()}`,
              color: "#EF4444",
            },
            {
              label: "Margin Erosion",
              value: `${((tariffImpact.total_margin_erosion_pct as number) || 0).toFixed(1)}%`,
              color: "#F59E0B",
            },
            {
              label: "Risk Level",
              value: (tariffImpact.risk_level as string) || "N/A",
              color: "#8B5CF6",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-4"
              style={{
                background: `linear-gradient(135deg, ${stat.color}10, transparent)`,
                border: `1px solid ${stat.color}22`,
              }}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/30">
                {stat.label}
              </div>
              <div className="text-lg font-bold mt-1" style={{ color: stat.color }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Priority Actions */}
      {actions.length > 0 && (
        <div>
          <h3 className="text-sm font-mono uppercase tracking-wider text-white/30 mb-4">
            Priority Actions
          </h3>
          <div className="space-y-3">
            {actions.map((action, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl p-4 border border-white/[0.04]"
                style={{ background: "rgba(20,20,35,0.6)" }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0 mt-0.5">
                      {(action.rank as number) || i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/80">
                        {action.action as string}
                      </div>
                      <p className="text-xs text-white/40 mt-1 leading-relaxed">
                        {action.description as string}
                      </p>
                    </div>
                  </div>
                  {action.estimated_savings && (
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-sm font-bold text-green-400">
                        ${((action.estimated_savings as number) || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-white/20">est. savings</div>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 mt-3 ml-10">
                  {action.timeline_days && (
                    <span className="text-[10px] font-mono text-white/25">
                      {action.timeline_days as number} days
                    </span>
                  )}
                  {action.implementation_effort && (
                    <span className="text-[10px] font-mono text-white/25">
                      Effort: {action.implementation_effort as string}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {timeline && (
        <div>
          <h3 className="text-sm font-mono uppercase tracking-wider text-white/30 mb-4">
            Implementation Timeline
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {(["days_30", "days_60", "days_90"] as const).map((period) => {
              const label = period.replace("days_", "") + " Days";
              const items = timeline[period] || [];
              return (
                <div
                  key={period}
                  className="rounded-xl p-4 border border-white/[0.04]"
                  style={{ background: "rgba(20,20,35,0.6)" }}
                >
                  <div className="text-xs font-mono uppercase tracking-wider text-indigo-400 mb-3">
                    {label}
                  </div>
                  <ul className="space-y-2">
                    {items.map((item, i) => (
                      <li key={i} className="text-xs text-white/40 flex items-start gap-2">
                        <span className="text-indigo-400/50 mt-0.5">-</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Risks */}
      {risks.length > 0 && (
        <div>
          <h3 className="text-sm font-mono uppercase tracking-wider text-white/30 mb-4">
            Risk Assessment
          </h3>
          <div className="space-y-2">
            {risks.map((risk, i) => (
              <div
                key={i}
                className="rounded-xl p-4 border border-white/[0.04] flex items-start justify-between"
                style={{ background: "rgba(20,20,35,0.6)" }}
              >
                <div>
                  <div className="text-sm text-white/70">{risk.risk as string}</div>
                  <div className="text-xs text-white/30 mt-1">
                    Mitigation: {risk.mitigation as string}
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 shrink-0 ml-4">
                  {risk.probability as string}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
