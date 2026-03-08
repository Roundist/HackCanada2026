import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, TrendingDown, ShieldAlert, Target, Coins, SlidersHorizontal, Clock3, CalendarRange, Flag, Boxes, ShieldCheck, AlertTriangle, Factory, Truck, FileCheck, BadgeDollarSign, Cpu, Battery, FlaskConical, Globe2 } from "lucide-react";
import { downloadSurvivalPlanPdf } from "../utils/exportPdf";
import TariffChart from "./TariffChart";
import HsCorrection from "./HsCorrection";
import RoutesMap from "./RoutesMap";
import type { HsClassification, ReasoningStep } from "../types";

interface SurvivalPlanProps {
  result: Record<string, unknown>;
  onReset: () => void;
  /** When set, export uses backend PDF; otherwise client-generated PDF. */
  sessionId?: string | null;
  hsClassifications?: HsClassification[];
  reasoningSteps?: ReasoningStep[];
  variant?: "dark" | "light";
  onTariffImpactUpdate?: (updated: Record<string, unknown>) => void;
}

const BASE_TARIFF_RATE = 25;
const TIMELINE_PREVIEW_ITEMS = 2;
const RISK_PREVIEW_CHARS = 160;

type TariffChartInput = { name: string; tariff_cost: number };
type ActionVisual = {
  icon: React.ElementType;
  accent: string;
  softBg: string;
};

const ACTION_VISUAL_FALLBACKS: ActionVisual[] = [
  { icon: Factory, accent: "#0891b2", softBg: "#ecfeff" },
  { icon: BadgeDollarSign, accent: "#16a34a", softBg: "#ecfdf5" },
  { icon: FileCheck, accent: "#7c3aed", softBg: "#f5f3ff" },
  { icon: AlertTriangle, accent: "#ea580c", softBg: "#fff7ed" },
];

function getActionVisual(actionText: string, category: string, index: number): ActionVisual {
  const text = `${actionText} ${category}`.toLowerCase();

  if (text.includes("pcb") || text.includes("semiconductor") || text.includes("component") || text.includes("electronics")) {
    return { icon: Cpu, accent: "#2563eb", softBg: "#eff6ff" };
  }
  if (text.includes("battery") || text.includes("energy")) {
    return { icon: Battery, accent: "#10b981", softBg: "#ecfdf5" };
  }
  if (text.includes("plastic") || text.includes("housing") || text.includes("packaging")) {
    return { icon: Boxes, accent: "#7c3aed", softBg: "#f5f3ff" };
  }
  if (text.includes("chemical") || text.includes("finish") || text.includes("coating")) {
    return { icon: FlaskConical, accent: "#0d9488", softBg: "#f0fdfa" };
  }
  if (text.includes("monitor") || text.includes("cusma") || text.includes("regulat") || text.includes("government")) {
    return { icon: FileCheck, accent: "#f59e0b", softBg: "#fffbeb" };
  }
  if (text.includes("global") || text.includes("import") || text.includes("export") || text.includes("market")) {
    return { icon: Globe2, accent: "#06b6d4", softBg: "#ecfeff" };
  }
  if (text.includes("cost") || text.includes("price") || text.includes("saving") || text.includes("margin")) {
    return { icon: BadgeDollarSign, accent: "#16a34a", softBg: "#ecfdf5" };
  }
  if (text.includes("supplier") || text.includes("source") || text.includes("local")) {
    return { icon: Factory, accent: "#0284c7", softBg: "#f0f9ff" };
  }
  if (text.includes("shipping") || text.includes("transit") || text.includes("logistics")) {
    return { icon: Truck, accent: "#dc2626", softBg: "#fef2f2" };
  }
  return ACTION_VISUAL_FALLBACKS[index % ACTION_VISUAL_FALLBACKS.length];
}

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

export default function SurvivalPlan({ result, onReset, sessionId, hsClassifications = [], reasoningSteps = [], variant = "dark", onTariffImpactUpdate }: SurvivalPlanProps) {
  const t = variant === "light" ? light : dark;
  const [exporting, setExporting] = useState(false);
  const [simulatedRate, setSimulatedRate] = useState(BASE_TARIFF_RATE);
  const [expandedTimeline, setExpandedTimeline] = useState<Record<string, boolean>>({});
  const [expandedRisks, setExpandedRisks] = useState<Record<number, boolean>>({});
  const plan = (result.survival_plan || result) as Record<string, unknown>;
  const summary = plan.executive_summary as Record<string, unknown> | undefined;
  const actions = (plan.priority_actions || []) as Record<string, unknown>[];
  const timeline = plan.timeline as Record<string, string[]> | undefined;
  const risks = (plan.risks || []) as Record<string, unknown>[];
  const tariffImpact = result.tariff_impact as Record<string, unknown> | undefined;
  const chartInputs = useMemo<TariffChartInput[]>(() => {
    if (!tariffImpact) return [];

    const directInputs = Array.isArray(tariffImpact.inputs)
      ? (tariffImpact.inputs as Array<{ name?: unknown; tariff_cost?: unknown }>)
      : [];
    const normalizedDirect = directInputs
      .map((item) => ({
        name: typeof item.name === "string" ? item.name : "",
        tariff_cost: typeof item.tariff_cost === "number" ? item.tariff_cost : 0,
      }))
      .filter((item) => item.name.length > 0);
    if (normalizedDirect.length > 0) return normalizedDirect;

    const inputImpacts = Array.isArray(tariffImpact.input_impacts)
      ? (tariffImpact.input_impacts as Array<{ input_name?: unknown; annual_tariff_cost?: unknown; tariff_cost?: unknown }>)
      : [];
    return inputImpacts
      .map((item) => ({
        name: typeof item.input_name === "string" ? item.input_name : "",
        tariff_cost:
          typeof item.annual_tariff_cost === "number"
            ? item.annual_tariff_cost
            : typeof item.tariff_cost === "number"
            ? item.tariff_cost
            : 0,
      }))
      .filter((item) => item.name.length > 0);
  }, [tariffImpact]);
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
            {exporting ? "Exporting…" : "Download PDF"}
          </button>
          <button
            onClick={onReset}
            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border transition-all ${t.button}`}
          >
            New analysis
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Above the fold: Executive Summary wide row, then KPI cards row */}
        <div className="space-y-4">
          {/* Executive Summary — full-width centered dominant card */}
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border p-4 text-center ${t.card}`}
              style={variant === "dark" ? { background: "rgba(15,17,23,0.6)" } : undefined}
            >
              <div className={`flex items-center justify-center gap-2 text-[11px] font-mono uppercase tracking-widest mb-2 ${t.label}`}>
                <FileText size={19} strokeWidth={1.75} className="text-gray-500 shrink-0" />
                Executive Summary
              </div>
              <h3 className={`text-sm font-semibold mb-2 ${t.heading}`}>
                {summary.headline as string}
              </h3>
              <p className={`text-[11px] leading-relaxed ${t.body}`}>{summary.key_finding as string}</p>
            </motion.div>
          )}
          {/* KPI cards — four equal cards in one row */}
          {(tariffImpact || summary) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {tariffImpact && (
                <>
                  <StatCard
                    variant={variant}
                    label="Total Exposure"
                    value={`$${((tariffImpact.total_tariff_exposure as number) || 0).toLocaleString()}`}
                    color="#dc2626"
                    delay={0.1}
                    icon={Coins}
                  />
                  <StatCard
                    variant={variant}
                    label="Margin Erosion"
                    value={`${((tariffImpact.total_margin_erosion_pct as number) || 0).toFixed(1)}%`}
                    color="#d97706"
                    delay={0.15}
                    icon={TrendingDown}
                  />
                </>
              )}
              {summary && (() => {
                const riskLevel = (summary.risk_level as string) ?? "N/A";
                const dataScore = Math.min(40,
                  (actions.length > 0 ? 15 : 0) + (timeline ? 10 : 0) + (risks.length > 0 ? 10 : 0) + (tariffImpact ? 5 : 0)
                );
                const confidence = Math.min(92, 60 + dataScore);
                return (
                  <>
                    <StatCard
                      variant={variant}
                      label="Risk Level"
                      value={riskLevel || "N/A"}
                      color="#dc2626"
                      delay={0.2}
                      icon={ShieldAlert}
                    />
                    <StatCard
                      variant={variant}
                      label="Est. Confidence"
                      value={`${confidence}%`}
                      color="#2563eb"
                      delay={0.25}
                      icon={Target}
                    />
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Trade routes map — internal (blue), US tariffed (red), foreign (green); additive, no analysis removed */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="w-full"
        >
          <h3 className={`text-[12px] font-bold font-mono uppercase tracking-[0.18em] mb-3 ${t.label}`}>
            Trade Routes
          </h3>
          <RoutesMap size="large" variant={variant} />
        </motion.div>

        {/* Tariff Simulator + Chart (PRD: What If Tariffs Go Higher?) */}
        {tariffImpact && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`border p-4 rounded-lg ${t.card}`}
            style={variant === "dark" ? { background: "rgba(15,17,23,0.6)" } : undefined}
          >
            <div className={`flex items-center gap-2 text-[12px] font-bold font-mono uppercase tracking-[0.18em] mb-1 ${t.label}`}>
              <SlidersHorizontal size={14} strokeWidth={1.75} className={`shrink-0 ${variant === "light" ? "text-gray-400" : "text-white/25"}`} />
              What If Tariffs Go Higher?
            </div>
            <div className={`text-[11px] font-mono mb-3 ${t.muted}`} title="Canada Border Services Agency">
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
                  background: variant === "light"
                    ? `linear-gradient(to right, #dc2626 0%, #dc2626 ${(simulatedRate / 50) * 100}%, #e5e7eb ${(simulatedRate / 50) * 100}%)`
                    : `linear-gradient(to right, #dc2626 0%, #dc2626 ${(simulatedRate / 50) * 100}%, rgba(255,255,255,0.08) ${(simulatedRate / 50) * 100}%)`,
                }}
              />
              <span className={`text-sm font-semibold tabular-nums min-w-[3rem] ${variant === "light" ? "text-red-600" : "text-red-400"}`}>
                {simulatedRate}%
              </span>
            </div>
            <div className={`text-sm font-semibold tabular-nums mb-3 ${variant === "light" ? "text-gray-900" : "text-white"}`}>
              Simulated exposure at {simulatedRate}%: ${simulatedExposure.toLocaleString()}
            </div>
            {chartInputs.length > 0 ? (
              <TariffChart
                inputs={chartInputs}
                simulatedRate={simulatedRate}
                baseRate={BASE_TARIFF_RATE}
                variant={variant}
              />
            ) : (
              <div className={`text-[11px] font-mono ${t.muted}`}>
                Per-input tariff breakdown is unavailable for this run.
              </div>
            )}
            <button
              type="button"
              onClick={() => setSimulatedRate(BASE_TARIFF_RATE)}
              className={`mt-2 text-[11px] font-mono uppercase tracking-wider transition-colors ${t.muted} ${variant === "light" ? "hover:text-gray-700" : "hover:text-white/60"}`}
            >
              Reset to current rate ({BASE_TARIFF_RATE}%)
            </button>
          </motion.div>
        )}

        {/* HS Code Correction — human-in-the-loop reclassification */}
        {sessionId && hsClassifications.length > 0 && onTariffImpactUpdate && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h3 className={`text-[10px] font-mono uppercase tracking-widest mb-3 ${t.label}`}>
              HS Classification Review
              <span className={`ml-2 normal-case text-[9px] font-normal ${t.muted}`}>
                — correct misclassified inputs to update tariff exposure in real time
              </span>
            </h3>
            <HsCorrection
              sessionId={sessionId}
              hsClassifications={hsClassifications}
              onRecalculated={onTariffImpactUpdate}
            />
          </motion.div>
        )}

        {/* Priority Actions */}
        {actions.length > 0 && (
          <div>
            <h3 className={`text-[12px] font-bold font-mono uppercase tracking-[0.18em] mb-4 ${t.label}`}>
              Priority Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  const impactLabel =
                    estimatedSavings != null
                      ? estimatedSavings >= 50000
                        ? "HIGH"
                        : estimatedSavings >= 10000
                          ? "MEDIUM"
                          : "LOW"
                      : null;

                  const actionLabel = String(action.action || "");
                  const { icon: ActionIcon, accent, softBg } = getActionVisual(actionLabel, category, i);

                  const isLastOdd = actions.length % 2 !== 0 && i === actions.length - 1;

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className={`relative overflow-hidden border p-4 rounded-xl flex items-start justify-between gap-4 ${t.card} ${isLastOdd ? "sm:col-span-2" : ""}`}
                      style={variant === "dark" ? { background: "rgba(15,17,23,0.5)" } : undefined}
                    >
                      <div
                        className="absolute inset-x-0 top-0 h-1"
                        style={{ background: `linear-gradient(90deg, ${accent}30, ${accent}, ${accent}30)` }}
                      />
                      <div className="flex items-start gap-4 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                            variant === "light"
                              ? "bg-gray-100 text-gray-700 border border-gray-200"
                              : "border border-white/[0.08] text-white/50"
                          }`}
                        >
                          {(action.rank as number) || i + 1}
                        </div>
                        <div className="min-w-0">
                          <div className={`flex items-center gap-1.5 text-[13px] font-semibold ${t.heading}`}>
                            <span
                              className="h-5 w-5 rounded-md flex items-center justify-center border shrink-0"
                              style={{
                                borderColor: `${accent}55`,
                                background: softBg,
                                color: accent,
                              }}
                            >
                              <ActionIcon size={12} strokeWidth={1.9} />
                            </span>
                            {actionLabel}
                          </div>
                          <p className={`text-[11px] mt-1.5 leading-relaxed max-w-xl ${t.body}`}>
                            {action.description as string}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {timelineDays !== null && (
                              <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                                variant === "light" ? "border-gray-200 bg-gray-50 text-gray-600" : "border-white/10 bg-white/[0.02] text-white/45"
                              }`}>
                                {timelineDays}d
                              </span>
                            )}
                            {effort && (
                              <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                                variant === "light" ? "border-gray-200 bg-gray-50 text-gray-600" : "border-white/10 bg-white/[0.02] text-white/45"
                              }`}>
                                Effort {effort}
                              </span>
                            )}
                            {category && (
                              <span
                                className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border max-w-full truncate ${
                                  variant === "light" ? "border-gray-200 bg-gray-50 text-gray-600" : "border-white/10 bg-white/[0.02] text-white/45"
                                }`}
                                title={category}
                              >
                                {category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {estimatedSavings !== null && (
                          <div className={`text-right rounded-lg px-2 py-1 border ${
                            variant === "light" ? "border-emerald-200 bg-emerald-50/80" : "border-emerald-400/20 bg-emerald-400/5"
                          }`}>
                            <div className={`text-sm font-semibold ${variant === "light" ? "text-green-700" : "text-green-500/80"}`}>
                              ${estimatedSavings.toLocaleString()}
                            </div>
                            <div className={`text-[8px] font-mono uppercase ${t.muted}`}>Savings</div>
                          </div>
                        )}
                        {impactLabel && (
                          <span
                            className={`text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${
                              impactLabel === "HIGH"
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : impactLabel === "MEDIUM"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-gray-100 text-gray-600 border border-gray-200"
                            }`}
                          >
                            {impactLabel}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })()
              ))}
            </div>
          </div>
        )}

        {/* Timeline + Risks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {timeline && (
            <div>
              <h3 className={`text-[12px] font-bold font-mono uppercase tracking-[0.18em] mb-3 ${t.label}`}>
                Implementation Timeline
              </h3>
              <div className="space-y-3">
                {(["days_30", "days_60", "days_90"] as const).map((period) => {
                  const label = period.replace("days_", "") + "D";
                  const items = timeline[period] || [];
                  const isExpanded = expandedTimeline[period] === true;
                  const visibleItems = isExpanded ? items : items.slice(0, TIMELINE_PREVIEW_ITEMS);
                  const PeriodIcon = period === "days_30" ? Clock3 : period === "days_60" ? CalendarRange : Flag;
                  return (
                    <div
                      key={period}
                      className={`border p-3 rounded-lg ${t.card}`}
                      style={variant === "dark" ? { background: "rgba(15,17,23,0.5)" } : undefined}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className={`flex items-center gap-1.5 text-[12px] font-bold font-mono uppercase tracking-wider ${variant === "light" ? "text-cyan-600" : "text-cyan-500"}`}>
                          <PeriodIcon size={13} strokeWidth={1.75} className="shrink-0 opacity-70" />
                          {label}
                        </div>
                        <span className={`text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                          variant === "light"
                            ? "text-gray-600 border-gray-200 bg-gray-50"
                            : "text-white/45 border-white/10 bg-white/[0.02]"
                        }`}>
                          {items.length} items
                        </span>
                      </div>
                      <ul className="space-y-1.5">
                        {visibleItems.map((item, i) => (
                          <li key={i} className={`text-[11px] flex items-start gap-2 ${t.body}`}>
                            <span className="shrink-0 mt-0.5 w-1 h-1 rounded-full bg-current opacity-60" aria-hidden />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      {items.length > TIMELINE_PREVIEW_ITEMS && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedTimeline((prev) => ({
                              ...prev,
                              [period]: !isExpanded,
                            }))
                          }
                          className={`mt-2 text-[10px] font-mono uppercase tracking-wider ${
                            variant === "light"
                              ? "text-cyan-700 hover:text-cyan-800"
                              : "text-cyan-400/70 hover:text-cyan-300"
                          }`}
                        >
                          {isExpanded ? "Show less" : `Show ${items.length - TIMELINE_PREVIEW_ITEMS} more`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {risks.length > 0 && (
            <div className="flex flex-col justify-center h-full">
              <h3 className={`text-[12px] font-bold font-mono uppercase tracking-[0.18em] mb-3 ${t.label}`}>
                Risk Assessment
              </h3>
              <div className="space-y-3">
                {risks.map((risk, i) => {
                  const prob = (risk.probability as string) || "";
                  const isHigh = prob.toLowerCase() === "high";
                  const isMedium = prob.toLowerCase() === "medium";
                  const riskText = (risk.risk as string || "").toLowerCase();
                  const RiskIcon =
                    riskText.includes("supplier") || riskText.includes("capacity") ? Boxes
                    : riskText.includes("quality") ? ShieldCheck
                    : AlertTriangle;
                  return (
                    <div
                      key={i}
                      className={`border p-3 rounded-lg ${t.card}`}
                      style={variant === "dark" ? { background: "rgba(15,17,23,0.5)" } : undefined}
                    >
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <div className={`flex items-center gap-1.5 text-[12px] font-medium min-w-0 ${t.heading}`}>
                          <RiskIcon size={13} strokeWidth={1.75} className={`shrink-0 ${variant === "light" ? "text-gray-400" : "text-white/20"}`} />
                          {risk.risk as string}
                        </div>
                        <span
                          className={`text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${
                            isHigh
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : isMedium
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-green-50 text-green-700 border border-green-200"
                          }`}
                        >
                          {prob || "LOW"}
                        </span>
                      </div>
                      {(() => {
                        const mitigation = String(risk.mitigation || "");
                        const isExpanded = expandedRisks[i] === true;
                        const isLong = mitigation.length > RISK_PREVIEW_CHARS;
                        const visibleText = isExpanded || !isLong
                          ? mitigation
                          : `${mitigation.slice(0, RISK_PREVIEW_CHARS).trimEnd()}…`;
                        return (
                          <>
                            <div className={`text-[10px] leading-relaxed ${t.body}`}>
                              <span className={t.muted}>Mitigation: </span>
                              {visibleText}
                            </div>
                            {isLong && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedRisks((prev) => ({
                                    ...prev,
                                    [i]: !isExpanded,
                                  }))
                                }
                                className={`mt-1.5 text-[10px] font-mono uppercase tracking-wider ${
                                  variant === "light"
                                    ? "text-gray-500 hover:text-gray-700"
                                    : "text-white/40 hover:text-white/70"
                                }`}
                              >
                                {isExpanded ? "Show less" : "Show details"}
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  );
                })}
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
            <h3 className={`text-[12px] font-bold font-mono uppercase tracking-[0.18em] mb-3 ${t.label}`}>
              Methodology & Evidence
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* HS Classification Evidence */}
              {hsClassifications.length > 0 && (
                <div className={`border p-4 rounded-lg ${t.card}`} style={variant === "dark" ? { background: "rgba(15,17,23,0.5)" } : undefined}>
                  <div className={`text-[9px] font-mono uppercase tracking-widest mb-3 ${variant === "light" ? "text-cyan-600" : "text-cyan-500/70"}`}>
                    HS Code Classification (RAG Vector Search)
                  </div>
                  <div className="space-y-3">
                    {hsClassifications.map((cls) => (
                      <div key={cls.input} className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[11px] truncate ${t.body}`}>{cls.input}</span>
                          <span className={`text-[10px] font-mono shrink-0 ${variant === "light" ? "text-cyan-600" : "text-cyan-400/70"}`}>{cls.selectedCode}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`flex-1 h-1.5 rounded overflow-hidden ${variant === "light" ? "bg-gray-200" : "bg-white/[0.04]"}`}>
                            <div
                              className="h-full rounded bg-cyan-500/60"
                              style={{ width: `${(cls.candidates[0]?.similarity ?? 0) * 100}%` }}
                            />
                          </div>
                          <span className={`text-[8px] font-mono ${variant === "light" ? "text-cyan-600" : "text-cyan-400/50"}`}>{((cls.candidates[0]?.similarity ?? 0) * 100).toFixed(0)}%</span>
                        </div>
                        <div className={`flex gap-2 text-[8px] font-mono flex-wrap ${t.muted}`}>
                          {cls.candidates.slice(0, 3).map((c) => (
                            <span key={c.hsCode} className={c.hsCode === cls.selectedCode ? (variant === "light" ? "text-cyan-600" : "text-cyan-400/50") : ""}>
                              {c.hsCode} ({(c.similarity * 100).toFixed(0)}%)
                            </span>
                          ))}
                        </div>
                        <div className={`text-[8px] font-mono ${t.muted}`}>
                          {cls.source} | MFN {cls.mfnRate}% + Surtax {cls.surtaxRate}% = {cls.effectiveRate}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reasoning Chain */}
              {reasoningSteps.length > 0 && (
                <div className={`border p-4 rounded-lg ${t.card}`} style={variant === "dark" ? { background: "rgba(15,17,23,0.5)" } : undefined}>
                  <div className={`text-[9px] font-mono uppercase tracking-widest mb-3 ${variant === "light" ? "text-rose-600" : "text-rose-400/50"}`}>
                    Calculation Trace
                  </div>
                  <div className="space-y-3">
                    {reasoningSteps.map((step, i) => (
                      <div key={i} className="space-y-1">
                        <div className={`text-[8px] font-mono uppercase tracking-wider ${t.muted}`}>
                          Step {i + 1}
                        </div>
                        <div className="text-[9px] font-mono space-y-0.5">
                          <div className={t.body}>{step.input}</div>
                          <div className={variant === "light" ? "text-cyan-600" : "text-cyan-400/50"}>{step.operation}</div>
                          <div className={variant === "light" ? "text-green-600" : "text-green-400/60"}>{step.result}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`mt-3 pt-2 border-t ${t.divider} text-[8px] font-mono ${t.muted}`}>
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

function StatCard({ label, value, color, delay, variant = "dark", icon: Icon }: { label: string; value: string; color: string; delay: number; variant?: "dark" | "light"; icon?: React.ElementType }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`border p-4 ${variant === "light" ? "border-gray-200 bg-gray-50" : "border-white/[0.04]"}`}
      style={variant === "dark" ? { background: `${color}04` } : undefined}
    >
      <div className={`flex items-center justify-center gap-2 text-[11px] font-mono uppercase tracking-wider ${variant === "light" ? "text-gray-500" : "text-white/20"}`}>
        {Icon && <Icon size={18} strokeWidth={1.75} className="text-gray-500 shrink-0" />}
        {label}
      </div>
      <div className="text-xl font-semibold mt-1.5 text-center" style={{ color }}>{value}</div>
    </motion.div>
  );
}
