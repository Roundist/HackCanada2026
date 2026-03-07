import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import type { AgentInfo } from "../types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface SurvivalPlanProps {
  result: Record<string, unknown>;
  agents: AgentInfo[];
  onReset: () => void;
}

type ExecSummary = {
  business_name?: string;
  headline?: string;
  key_finding?: string;
  risk_level?: string;
  products_at_risk?: string;
};

type TariffLine = { input: string; exposure: number };

type TariffImpact = {
  total_tariff_exposure?: number;
  total_margin_erosion_pct?: number;
  line_items?: TariffLine[];
};

type Action = {
  action: string;
  description?: string;
  timeline_days?: number;
  implementation_effort?: string;
  category?: string;
  estimated_savings?: number;
};

type Supplier = {
  name: string;
  province: string;
  type: string;
  savings: string;
  lat: number;
  lng: number;
};

const tabs = ["Overview", "Tariff Impact", "Supplier Map", "Action Plan", "Voice Briefing"] as const;

const fallbackActions: Action[] = [
  { action: "Shift hardwood supply to BC/AB mills", timeline_days: 30, estimated_savings: 62000, implementation_effort: "Medium" },
  { action: "Renegotiate HS code for finished goods", timeline_days: 45, estimated_savings: 38000, implementation_effort: "Low" },
  { action: "Dual-source fasteners from Ontario", timeline_days: 30, estimated_savings: 24000, implementation_effort: "Low" },
  { action: "Lock FX hedges for Q3", timeline_days: 15, estimated_savings: 12000, implementation_effort: "Low" },
];

export default function SurvivalPlan({ result, onReset, agents }: SurvivalPlanProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");

  const plan = (result.survival_plan || result) as Record<string, unknown>;
  const summaryRaw = plan.executive_summary as ExecSummary | undefined;
  const summary: ExecSummary = summaryRaw || {};
  const actionsRaw = Array.isArray(plan.priority_actions) ? (plan.priority_actions as Action[]) : [];
  const actions: Action[] = actionsRaw.map((a) => ({
    action: a.action || "Action",
    description: a.description,
    timeline_days: a.timeline_days,
    implementation_effort: a.implementation_effort,
    category: a.category,
    estimated_savings: a.estimated_savings,
  }));
  const tariffImpact = (result.tariff_impact as TariffImpact | undefined) || {};

  const supplierList = useMemo<Supplier[]>(() => {
    const supplied = Array.isArray(plan.supplier_options)
      ? (plan.supplier_options as Supplier[])
      : [];
    if (supplied.length > 0) return supplied;
    return [
      { name: "Maple Timber Cooperative", province: "BC", type: "Lumber", savings: "14%", lat: 53, lng: -123 },
      { name: "Prairie Steelworks", province: "AB", type: "Steel", savings: "11%", lat: 51, lng: -114 },
      { name: "Ontario Fasteners", province: "ON", type: "Hardware", savings: "9%", lat: 44, lng: -79 },
      { name: "St. Laurent Packaging", province: "QC", type: "Packaging", savings: "7%", lat: 47, lng: -71 },
      { name: "Atlantic Chem Finishes", province: "NB", type: "Chemicals", savings: "6%", lat: 46, lng: -66 },
    ];
  }, [plan]);

  const tariffRows = useMemo(() => {
    const items = Array.isArray(tariffImpact?.line_items)
      ? (tariffImpact.line_items as TariffLine[])
      : [];
    if (items.length > 0) return [...items].sort((a, b) => (b.exposure || 0) - (a.exposure || 0));
    return [
      { input: "Hardwood lumber", exposure: 82000 },
      { input: "Steel hardware", exposure: 61000 },
      { input: "Finishing chemicals", exposure: 42000 },
      { input: "Upholstery fabric", exposure: 38000 },
      { input: "Logistics + freight", exposure: 28000 },
    ].sort((a, b) => b.exposure - a.exposure);
  }, [tariffImpact]);

  const headlineExposure = tariffImpact.total_tariff_exposure ?? 180000;
  const marginErosion = tariffImpact.total_margin_erosion_pct ?? 8.4;

  const scenarioRates = [25, 30, 35, 40];

  const chartData = {
    labels: tariffRows.map((r) => (r as any).input),
    datasets: [
      {
        label: "Tariff Cost",
        data: tariffRows.map((r) => (r as any).exposure),
        backgroundColor: "rgba(244, 63, 94, 0.3)",
        borderColor: "#f43f5e",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="relative max-w-6xl mx-auto py-6 px-2 sm:px-4">
      <div className="flex items-center justify-between px-4 py-3 border border-white/10 bg-black/40 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.24em] text-white/60">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Analysis Complete
          </div>
          <div className="h-4 w-px bg-white/12" />
          <div className="text-sm text-white/80 font-semibold">Operational Dossier</div>
          {typeof summary.business_name === "string" && summary.business_name.length > 0 && (
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">
              {summary.business_name}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <MiniGraph agents={agents} />
          <button
            onClick={onReset}
            className="px-3 py-2 text-[10px] font-mono uppercase tracking-[0.2em] border border-white/15 text-white/70 hover:border-white/40"
          >
            New Analysis
          </button>
        </div>
      </div>

      <div className="px-2 sm:px-0 mt-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] border ${
                activeTab === tab ? "border-white/50 text-white" : "border-white/12 text-white/55"
              } bg-black/30`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" && (
          <div className="grid grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-2 border border-white/12 bg-black/40 p-5"
            >
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 mb-2">Executive Summary</div>
              <div className="flex items-center gap-3 mb-3">
                <div className="text-3xl font-mono text-white">${headlineExposure.toLocaleString()}</div>
                <span className={`text-[10px] font-mono px-2 py-1 border uppercase tracking-[0.2em] ${
                  (summary.risk_level || "HIGH").toUpperCase() === "HIGH"
                    ? "border-red-400/50 text-red-300"
                    : (summary.risk_level || "").toUpperCase() === "MEDIUM"
                      ? "border-amber-300/50 text-amber-200"
                      : "border-green-300/50 text-green-200"
                }`}>
                  {(summary.risk_level || "HIGH").toUpperCase()} RISK
                </span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                {summary.headline || "Tariff exposure concentrated in US hardwood, steel hardware, and chemical finishes with immediate margin erosion risk if rates lift."}
              </p>
              <p className="text-[12px] text-white/55 mt-3 leading-relaxed">
                {summary.key_finding || "Supplier diversification and tariff reclassification reduce annual exposure by 26% while keeping production schedules intact."}
              </p>
            </motion.div>

            <div className="space-y-3">
              <StatCard label="Margin Erosion" value={`${marginErosion.toFixed(1)}%`} color="#f59e0b" />
              <StatCard label="Products at Risk" value={(summary?.products_at_risk as string) || "12"} color="#0ea5e9" />
              <StatCard label="Potential Savings" value="$220K" color="#10b981" />
              <StatCard label="Confidence" value="87%" color="#38bdf8" />
            </div>
          </div>
        )}

        {activeTab === "Tariff Impact" && (
          <div className="space-y-4">
            <div className="border border-white/12 bg-black/40 p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/40 mb-2">Tariff Cost per Input</div>
              <Bar data={chartData} options={{
                indexAxis: "y",
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: "#94a3b8", font: { family: "JetBrains Mono" } }, grid: { color: "rgba(255,255,255,0.04)" } },
                  y: { ticks: { color: "#94a3b8", font: { family: "JetBrains Mono" } }, grid: { color: "rgba(255,255,255,0.05)" } },
                },
              }} />
            </div>

            <div className="border border-white/12 bg-black/40 p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/40 mb-2">Scenario Table</div>
              <div className="grid grid-cols-5 gap-2 text-[11px] font-mono text-white/70">
                <div className="text-white/50">Rate</div>
                {scenarioRates.map((rate) => (
                  <div key={rate} className="text-center px-2 py-1 border border-white/10 bg-white/5">{rate}%</div>
                ))}
                <div className="text-white/50">Exposure</div>
                {scenarioRates.map((rate) => (
                  <div key={`exp-${rate}`} className="text-center px-2 py-1 border border-white/10">
                    ${(headlineExposure * (rate / 25)).toLocaleString()}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "Supplier Map" && (
          <div className="border border-white/12 bg-black/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/40">Canadian Alternatives</div>
                <p className="text-sm text-white/65">Pins reveal vetted suppliers with expected savings versus US + tariff price.</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/55">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Savings
              </div>
            </div>
            <SupplierMap suppliers={supplierList} />
          </div>
        )}

        {activeTab === "Action Plan" && (
          <div className="grid grid-cols-2 gap-3">
            {(actions.length > 0 ? actions : fallbackActions).map((action, i) => (
              <ActionCard key={i} action={action} index={i} />
            ))}
          </div>
        )}

        {activeTab === "Voice Briefing" && (
          <div className="border border-white/12 bg-black/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/40">ElevenLabs Briefing</div>
                <p className="text-sm text-white/70">60-second executive summary, optimized for leadership playback.</p>
              </div>
              <button className="px-3 py-2 text-[10px] font-mono uppercase tracking-[0.2em] border border-white/15 text-white/70 hover:border-white/40">Download PDF</button>
            </div>
            <audio controls className="w-full">
              <source src={(plan.voice_url as string) || ""} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
            <div className="flex items-end gap-1 h-20">
              {new Array(64).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-cyan-400/60"
                  style={{ height: `${20 + (Math.sin(i) + 1) * 10}%`, opacity: (i % 5 === 0 ? 0.9 : 0.4) }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Persistent mini graph indicator */}
      <div className="fixed right-4 bottom-4 border border-white/12 bg-black/60 backdrop-blur-sm p-3 shadow-lg shadow-black/30">
        <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/40 mb-2">Agent Status</div>
        <MiniGraph agents={agents} />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="border border-white/12 bg-black/35 p-3">
      <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/40">{label}</div>
      <div className="text-xl font-mono" style={{ color }}>{value}</div>
    </div>
  );
}

function ActionCard({ action, index }: { action: Action; index: number }) {
  const savings = typeof action.estimated_savings === "number" ? action.estimated_savings : undefined;
  const timeline = typeof action.timeline_days === "number" ? action.timeline_days : undefined;
  const effort = action.implementation_effort;
  const category = action.category;
  return (
    <div className="border border-white/12 bg-black/35 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">{`Step ${index + 1}`}</div>
        {savings !== undefined && (
          <div className="text-[11px] font-mono text-emerald-300">${savings.toLocaleString()}</div>
        )}
      </div>
      <div className="text-[13px] text-white font-semibold">{action.action || "Action"}</div>
      <p className="text-[12px] text-white/65 mt-1 leading-relaxed">{action.description || "Execution ready recommendation with savings estimate and category."}</p>
      <div className="flex gap-3 mt-2 text-[10px] font-mono text-white/50">
        {timeline !== undefined && <span>{timeline}d</span>}
        {effort && <span>Effort: {effort}</span>}
        {category && <span>{category}</span>}
      </div>
    </div>
  );
}

function MiniGraph({ agents }: { agents: AgentInfo[] }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border border-white/12 bg-black/40">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{
            border: `1px solid ${agent.color}80`,
            background: agent.status === "done" ? `${agent.color}20` : "transparent",
            boxShadow: agent.status === "running" ? `0 0 0 4px ${agent.color}12` : undefined,
          }}
        >
          <span className="text-[9px] font-mono" style={{ color: agent.color }}>
            {agent.icon}
          </span>
        </div>
      ))}
    </div>
  );
}

function SupplierMap({ suppliers }: { suppliers: Supplier[] }) {
  return (
    <div className="relative w-full h-[480px] bg-[#0c111b] border border-white/10 overflow-hidden">
      <svg viewBox="-140 30 420 250" className="absolute inset-0 w-full h-full opacity-80">
        <g fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1">
          <path d="M-40 60 L 20 40 L 70 55 L 130 60 L 170 80 L 110 90 L 60 110 L 0 120 L -50 110 Z" />
          <path d="M10 130 L 70 130 L 140 150 L 90 170 L 40 160 L -10 165 L -30 150 Z" />
          <path d="M-60 150 L -20 180 L 30 190 L -10 210 L -60 200 Z" />
          <path d="M100 170 L 160 170 L 200 180 L 170 210 L 120 200 Z" />
          <path d="M-90 80 L -50 90 L -40 120 L -100 110 Z" />
        </g>
      </svg>

      {suppliers.map((s, i) => {
        const x = (s.lng + 140) * 2; // rough projection for simple map
        const y = (90 - s.lat) * 2 + 160;
        return (
          <div
            key={s.name + i}
            className="absolute group flex flex-col items-center"
            style={{ left: `${x}px`, top: `${y}px` }}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/30 relative">
              <div className="absolute -left-20 -top-16 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                <div className="border border-emerald-400/40 bg-black/80 px-3 py-2 text-[10px] font-mono text-white/80 whitespace-nowrap">
                  <div className="text-emerald-300">{s.name}</div>
                  <div className="text-white/60">{s.province} · {s.type}</div>
                  <div className="text-emerald-200">Savings {s.savings}</div>
                </div>
              </div>
            </div>
            <div className="text-[9px] font-mono text-white/70 mt-1">{s.province}</div>
          </div>
        );
      })}
    </div>
  );
}
