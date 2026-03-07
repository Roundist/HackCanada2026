import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { downloadSurvivalPlanPdf } from "../utils/exportPdf";
import TariffChart from "./TariffChart";
import type { HsClassification, ReasoningStep } from "../types";

interface SurvivalPlanProps {
  result: Record<string, unknown>;
  onReset: () => void;
  /** When set, export uses backend PDF; otherwise client-generated PDF. */
  sessionId?: string | null;
  hsClassifications?: HsClassification[];
  reasoningSteps?: ReasoningStep[];
  variant?: "dark" | "light";
}

const BASE_TARIFF_RATE = 25;

const light = {
  container: "bg-gray-50",
  bar: "bg-white border-gray-200 text-gray-700",
  barMuted: "text-gray-500",
  card: "border border-gray-200 bg-white",
  label: "text-gray-500",
  heading: "text-gray-900",
  body: "text-gray-600",
  muted: "text-gray-400",
  divider: "border-gray-200",
  button: "border-gray-300 text-gray-600 hover:bg-gray-50",
};

const dark = {
  container: "",
  bar: "border-white/10 bg-black/40 text-white/80",
  barMuted: "text-white/60",
  card: "border-white/[0.06]",
  cardBg: "rgba(15,17,23,0.6)",
  label: "text-white/20",
  heading: "text-white/70",
  body: "text-white/35",
  muted: "text-white/30",
  divider: "border-white/[0.04]",
  button: "border-white/[0.06] text-white/30 hover:text-white/60",
};

export default function SurvivalPlan({ result, onReset, sessionId, hsClassifications = [], reasoningSteps = [], variant = "dark" }: SurvivalPlanProps) {
  const t = variant === "light" ? light : dark;
  const [exporting, setExporting] = useState(false);
  const [simulatedRate, setSimulatedRate] = useState(BASE_TARIFF_RATE);
  const plan = (result.survival_plan || result) as Record<string, unknown>;
  const summary = plan.executive_summary as Record<string, unknown> | undefined;
  const actions = (plan.priority_actions || []) as Record<string, unknown>[];
  const timeline = plan.timeline as Record<string, string[]> | undefined;
  const risks = (plan.risks || []) as Record<string, unknown>[];
  const tariffImpact = result.tariff_impact as Record<string, unknown> | undefined;
  const inputs = (tariffImpact?.inputs as Array<{ name: string; tariff_cost: number }>) ?? [];
  const totalExposureBase = (tariffImpact?.total_tariff_exposure as number) ?? 0;
  const simulatedExposure = useMemo(
    () => Math.round(totalExposureBase * (simulatedRate / BASE_TARIFF_RATE)),
    [totalExposureBase, simulatedRate]
  );
  const handleExportPdf = async () => {
    setExporting(true);
    try {
      if (sessionId) {
        const res = await fetch(`/api/session/${sessionId}/pdf`);
        if (!res.ok) throw new Error("PDF not ready");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `survival-plan-${sessionId.slice(0, 8)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const name = (summary?.business_name as string)?.replace(/\s+/g, "-") ?? "survival-plan";
        downloadSurvivalPlanPdf(result, `tariff-triage-${name}.pdf`);
      }
    } catch (e) {
      console.error(e);
      downloadSurvivalPlanPdf(result, "tariff-triage-survival-plan.pdf");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={`relative max-w-6xl mx-auto py-6 px-2 sm:px-4 ${t.container}`}>
      <div className={`flex items-center justify-between px-4 py-3 border backdrop-blur sticky top-0 z-10 ${t.bar}`}>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.24em] ${t.barMuted}`}>
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Analysis Complete
          </div>
          <div className={`h-4 w-px ${variant === "light" ? "bg-gray-200" : "bg-white/12"}`} />
          <div className={`text-sm font-semibold ${variant === "light" ? "text-gray-900" : "text-white/80"}`}>Operational Dossier</div>
          {summary && typeof summary.business_name === "string" && summary.business_name.length > 0 && (
            <div className={`text-[10px] font-mono uppercase tracking-[0.2em] ${t.muted}`}>
              {summary.business_name}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border border-green-600/50 text-green-700 bg-green-50 transition-all disabled:opacity-50"
          >
            {exporting ? "Exporting…" : "Export PDF"}
          </button>
          <button
            onClick={onReset}
            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border transition-all ${t.button}`}
          >
            New Analysis
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Executive Summary + Stats */}
        <div className="grid grid-cols-4 gap-3">
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`col-span-2 border p-4 ${t.card}`}
              style={variant === "dark" ? { background: "rgba(15,17,23,0.6)" } : undefined}
            >
              <div className={`text-[9px] font-mono uppercase tracking-widest mb-2 ${t.label}`}>Executive Summary</div>
              <h3 className={`text-sm font-semibold mb-2 ${t.heading}`}>
                {summary.headline as string}
              </h3>
              <p className={`text-[11px] leading-relaxed ${t.body}`}>{summary.key_finding as string}</p>
            </motion.div>
          )}
          {tariffImpact && (
            <>
              <StatCard
                variant={variant}
                label="Total Exposure"
                value={`$${((tariffImpact.total_tariff_exposure as number) || 0).toLocaleString()}`}
                color="#dc2626"
                delay={0.1}
              />
              <StatCard
                variant={variant}
                label="Margin Erosion"
                value={`${((tariffImpact.total_margin_erosion_pct as number) || 0).toFixed(1)}%`}
                color="#d97706"
                delay={0.15}
              />
            </>
          )}
          {summary && (() => {
            const riskLevel = ((summary.risk_level as string) ?? "").toUpperCase();
            // Confidence derived from data completeness: base 60 + up to 40 from having actions, timeline, risk assessment
            const dataScore = Math.min(40,
              (actions.length > 0 ? 15 : 0) +
              (timeline ? 10 : 0) +
              (risks.length > 0 ? 10 : 0) +
              (tariffImpact ? 5 : 0)
            );
            const confidence = 60 + dataScore;
            return (
              <>
<StatCard
                variant={variant}
                label="Risk Level"
                  value={riskLevel || "N/A"}
                  color="#dc2626"
                  delay={0.2}
                />
<StatCard
                variant={variant}
                label="Confidence"
                  value={`${confidence}%`}
                  color="#2563eb"
                  delay={0.25}
                />
              </>
            );
          })()}
        </div>

        {/* Tariff Simulator + Chart (PRD: What If Tariffs Go Higher?) */}
        {inputs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border border-white/[0.06] p-4"
            style={{ background: "rgba(15,17,23,0.6)" }}
          >
            <div className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-1">
              What If Tariffs Go Higher?
            </div>
            <div className="text-[8px] font-mono text-white/25 mb-3" title="Canada Border Services Agency">
              Based on CBSA Customs Tariff 2025
            </div>
            <div className="flex items-center gap-4 mb-3">
              <input
                type="range"
                min={0}
                max={50}
                step={1}
                value={simulatedRate}
                onChange={(e) => setSimulatedRate(Number(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-red-600"
                style={{
                  background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${(simulatedRate / 50) * 100}%, rgba(255,255,255,0.08) ${(simulatedRate / 50) * 100}%)`,
                }}
              />
              <span className="text-sm font-semibold tabular-nums text-red-400 min-w-[3rem]">
                {simulatedRate}%
              </span>
            </div>
            <div className="text-[10px] font-mono text-white/30 mb-3">
              Simulated exposure at {simulatedRate}%: ${simulatedExposure.toLocaleString()}
            </div>
            <TariffChart
              inputs={inputs}
              simulatedRate={simulatedRate}
              baseRate={BASE_TARIFF_RATE}
            />
            <button
              type="button"
              onClick={() => setSimulatedRate(BASE_TARIFF_RATE)}
              className="mt-2 text-[9px] font-mono uppercase tracking-wider text-white/40 hover:text-white/60 transition-colors"
            >
              Reset to current rate ({BASE_TARIFF_RATE}%)
            </button>
          </motion.div>
        )}

        {/* Priority Actions */}
        {actions.length > 0 && (
          <div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-3">
              Priority Actions
            </div>
            <div className="space-y-2">
              {actions.map((action, i) => (
                (() => {
                  const timelineDays =
                    typeof action.timeline_days === "number"
                      ? action.timeline_days
                      : null;
                  const effort =
                    typeof action.implementation_effort === "string"
                      ? action.implementation_effort
                      : "";
                  const category =
                    typeof action.category === "string" ? action.category : "";
                  const estimatedSavings =
                    typeof action.estimated_savings === "number"
                      ? action.estimated_savings
                      : null;

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="border border-white/[0.04] p-4 flex items-start justify-between"
                      style={{ background: "rgba(15,17,23,0.5)" }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 border border-white/[0.08] flex items-center justify-center text-[10px] font-mono text-white/30 shrink-0 mt-0.5">
                          {(action.rank as number) || i + 1}
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold text-white/65">
                            {action.action as string}
                          </div>
                          <p className="text-[10px] text-white/30 mt-1 leading-relaxed max-w-lg">
                            {action.description as string}
                          </p>
                          <div className="flex gap-4 mt-2">
                            {timelineDays !== null && (
                              <span className="text-[9px] font-mono text-white/20">
                                {timelineDays}d
                              </span>
                            )}
                            {effort && (
                              <span className="text-[9px] font-mono text-white/20">
                                Effort: {effort}
                              </span>
                            )}
                            {category && (
                              <span className="text-[9px] font-mono text-white/15">
                                {category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {estimatedSavings !== null && (
                        <div className="text-right shrink-0 ml-4">
                          <div className="text-sm font-semibold text-green-500/80">
                            ${estimatedSavings.toLocaleString()}
                          </div>
                          <div className="text-[8px] font-mono text-white/15 uppercase">Savings</div>
                        </div>
                      )}
                    </motion.div>
                  );
                })()
              ))}
            </div>
          </div>
        )}

        {/* Timeline + Risks */}
        <div className="grid grid-cols-2 gap-4">
          {timeline && (
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-3">
                Implementation Timeline
              </div>
              <div className="space-y-2">
                {(["days_30", "days_60", "days_90"] as const).map((period) => {
                  const label = period.replace("days_", "") + "D";
                  const items = timeline[period] || [];
                  return (
                    <div
                      key={period}
                      className="border border-white/[0.04] p-3"
                      style={{ background: "rgba(15,17,23,0.5)" }}
                    >
                      <div className="text-[9px] font-mono uppercase tracking-wider text-cyan-600 mb-2">
                        {label}
                      </div>
                      <ul className="space-y-1.5">
                        {items.map((item, i) => (
                          <li key={i} className="text-[10px] text-white/30 flex items-start gap-1.5">
                            <span className="text-white/10 mt-0.5 shrink-0">-</span>
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

          {risks.length > 0 && (
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-3">
                Risk Assessment
              </div>
              <div className="space-y-2">
                {risks.map((risk, i) => (
                  <div
                    key={i}
                    className="border border-white/[0.04] p-3"
                    style={{ background: "rgba(15,17,23,0.5)" }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="text-[11px] text-white/50">{risk.risk as string}</div>
                      <span className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 border shrink-0 ml-3 ${
                        (risk.probability as string) === "High"
                          ? "text-red-400/60 border-red-500/15 bg-red-500/5"
                          : (risk.probability as string) === "Medium"
                          ? "text-amber-400/60 border-amber-500/15 bg-amber-500/5"
                          : "text-green-400/60 border-green-500/15 bg-green-500/5"
                      }`}>
                        {risk.probability as string}
                      </span>
                    </div>
                    <div className="text-[9px] font-mono text-white/20">
                      Mitigation: {risk.mitigation as string}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* HS Classification Evidence + Reasoning Chain */}
        {(hsClassifications.length > 0 || reasoningSteps.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-3">
              Methodology & Evidence
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* HS Classification Evidence */}
              {hsClassifications.length > 0 && (
                <div className="border border-white/[0.04] p-4" style={{ background: "rgba(15,17,23,0.5)" }}>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-cyan-500/50 mb-3">
                    HS Code Classification (RAG Vector Search)
                  </div>
                  <div className="space-y-3">
                    {hsClassifications.map((cls) => (
                      <div key={cls.input} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-white/60">{cls.input}</span>
                          <span className="text-[10px] font-mono text-cyan-400/70">{cls.selectedCode}</span>
                        </div>
                        {/* Similarity bar for top candidate */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-white/[0.04] overflow-hidden">
                            <div
                              className="h-full"
                              style={{ width: `${cls.candidates[0]?.similarity * 100}%`, background: "rgba(34,211,238,0.4)" }}
                            />
                          </div>
                          <span className="text-[8px] font-mono text-cyan-400/50">{(cls.candidates[0]?.similarity * 100).toFixed(0)}%</span>
                        </div>
                        {/* Top 3 candidates inline */}
                        <div className="flex gap-2 text-[8px] font-mono text-white/20">
                          {cls.candidates.slice(0, 3).map((c) => (
                            <span key={c.hsCode} className={c.hsCode === cls.selectedCode ? "text-cyan-400/50" : ""}>
                              {c.hsCode} ({(c.similarity * 100).toFixed(0)}%)
                            </span>
                          ))}
                        </div>
                        <div className="text-[8px] font-mono text-white/15">
                          {cls.source} | MFN {cls.mfnRate}% + Surtax {cls.surtaxRate}% = {cls.effectiveRate}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reasoning Chain */}
              {reasoningSteps.length > 0 && (
                <div className="border border-white/[0.04] p-4" style={{ background: "rgba(15,17,23,0.5)" }}>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-rose-400/50 mb-3">
                    Calculation Trace
                  </div>
                  <div className="space-y-3">
                    {reasoningSteps.map((step, i) => (
                      <div key={i} className="space-y-1">
                        <div className="text-[8px] font-mono uppercase tracking-wider text-white/20">
                          Step {i + 1}
                        </div>
                        <div className="text-[9px] font-mono space-y-0.5">
                          <div className="text-white/40">{step.input}</div>
                          <div className="text-cyan-400/50">{step.operation}</div>
                          <div className="text-green-400/60">{step.result}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/[0.04] text-[8px] font-mono text-white/15">
                    All calculations derived from CBSA tariff data + business profile inputs. Not financial advice.
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, delay, variant = "dark" }: { label: string; value: string; color: string; delay: number; variant?: "dark" | "light" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`border p-4 ${variant === "light" ? "border-gray-200 bg-gray-50" : "border-white/[0.04]"}`}
      style={variant === "dark" ? { background: `${color}04` } : undefined}
    >
      <div className={`text-[9px] font-mono uppercase tracking-wider ${variant === "light" ? "text-gray-500" : "text-white/20"}`}>{label}</div>
      <div className="text-xl font-semibold mt-1.5" style={{ color }}>{value}</div>
    </motion.div>
  );
}
