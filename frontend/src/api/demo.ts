import type { WSMessage } from "../types";
import type { BusinessProfile } from "../data/businessProfiles";

export interface DemoRunOptions {
  revenue?: string;
  /** When set, pipeline_done and agent messages use this profile so results match the selected business. */
  profile?: BusinessProfile | null;
}

/** Build pipeline_done payload from the selected profile so data is accurate to the business. */
function buildPipelineDoneData(profile: BusinessProfile | null): Record<string, unknown> {
  if (!profile) {
    return {
      tariff_impact: {
        total_tariff_exposure: 342000,
        total_margin_erosion_pct: 8.4,
        risk_level: "high",
      },
      survival_plan: {
        executive_summary: {
          business_name: "Demo Business",
          total_tariff_exposure: 342000,
          risk_level: "high",
          headline: "Significant tariff exposure requires immediate supplier diversification",
          key_finding:
            "65% of raw materials sourced from the US face 25% tariffs, eroding margins by 8.4 percentage points. Without action, 2 of 4 product lines become unprofitable within 6 months.",
        },
        priority_actions: [
          { rank: 1, action: "Switch hardwood lumber to Canadian suppliers", description: "Ontario and Quebec have established hardwood mills.", estimated_savings: 145000, implementation_effort: "Medium", timeline_days: 45, category: "Supplier Switch" },
          { rank: 2, action: "Apply for CUSMA tariff exemptions", description: "Several inputs may qualify for duty remission.", estimated_savings: 52000, implementation_effort: "Medium", timeline_days: 30, category: "Government Program" },
          { rank: 3, action: "Implement strategic price increases", description: "Raise prices 5-8% on premium lines where brand supports it.", estimated_savings: 48000, implementation_effort: "Low", timeline_days: 7, category: "Pricing Strategy" },
        ],
        timeline: { days_30: ["File CUSMA applications", "Contact alternative suppliers"], days_60: ["Begin supplier transitions"], days_90: ["Full diversification review"] },
        risks: [
          { risk: "Canadian suppliers may have limited capacity", probability: "Medium", mitigation: "Engage multiple suppliers" },
          { risk: "Further tariff escalation", probability: "Medium", mitigation: "Accelerate diversification" },
        ],
      },
    };
  }

  const totalExposure = Math.round(profile.revenueNumeric * 1e6 * 0.065 * (profile.baseMarginErosionPct / 8.4));
  const riskLevel = profile.risk.toLowerCase();
  const priorityActions: Array<{
    rank: number;
    action: string;
    description: string;
    estimated_savings: number;
    implementation_effort: string;
    timeline_days: number;
    category: string;
  }> = profile.altSuppliers.map((s, i) => ({
    rank: i + 1,
    action: `Switch ${s.commodity} to ${s.name}`,
    description: s.note ?? `${s.country} — ${s.commodity}. Estimated margin recovery ${s.deltaMarginSavedPct}%.`,
    estimated_savings: s.deltaAmountSaved,
    implementation_effort: "Medium",
    timeline_days: 45 + i * 15,
    category: "Supplier Switch",
  }));

  if (priorityActions.length < 4) {
    priorityActions.push(
      { rank: priorityActions.length + 1, action: "Apply for CUSMA tariff exemptions", description: "Several inputs may qualify for duty remission under CUSMA rules.", estimated_savings: Math.round(totalExposure * 0.15), implementation_effort: "Medium", timeline_days: 30, category: "Government Program" },
      { rank: priorityActions.length + 2, action: "Implement strategic price increases", description: "Raise prices on premium lines where brand loyalty supports it.", estimated_savings: Math.round(totalExposure * 0.08), implementation_effort: "Low", timeline_days: 7, category: "Pricing Strategy" }
    );
  }
  priorityActions.forEach((a, i) => { a.rank = i + 1; });

  const totalSavings = priorityActions.reduce((sum, a) => sum + (a.estimated_savings as number), 0);
  return {
    tariff_impact: {
      total_tariff_exposure: totalExposure,
      total_margin_erosion_pct: profile.baseMarginErosionPct,
      risk_level: riskLevel,
    },
    survival_plan: {
      executive_summary: {
        business_name: profile.name,
        total_tariff_exposure: totalExposure,
        risk_level: riskLevel,
        headline: `${profile.industry} tariff exposure requires immediate supplier diversification`,
        key_finding: `${profile.imports} of inputs face 25% tariffs, eroding margins by ${profile.baseMarginErosionPct} percentage points. Without action, profitability is at risk. Total exposure: $${(totalExposure / 1000).toFixed(0)}K on ${profile.revenue} revenue.`,
      },
      priority_actions: priorityActions,
      timeline: {
        days_30: priorityActions.slice(0, 2).map((a) => a.action),
        days_60: ["Complete first supplier transitions", "Monitor CUSMA applications"],
        days_90: ["Full supply chain diversification", "Review pricing strategy"],
      },
      risks: [
        { risk: "Alternative suppliers may have limited capacity", probability: "Medium", mitigation: "Engage multiple suppliers and stagger transitions" },
        { risk: "Quality differences with alternative materials", probability: "Low", mitigation: "Run parallel testing before switchover" },
        { risk: "Further tariff escalation to 35%+", probability: "Medium", mitigation: "Accelerate supplier diversification timeline" },
      ],
    },
  };
}

/** Scale factor for demo delays: 1 = original (~20s), 0.25 = ~5s. */
const DEMO_SPEED = 0.25;

function buildDemoMessages(opts: DemoRunOptions = {}): { delay: number; msg: WSMessage }[] {
  const revenue = opts.revenue ?? "$8M";
  const pipelineData = buildPipelineDoneData(opts.profile ?? null);
  const tariffImpact = pipelineData.tariff_impact as Record<string, unknown> | undefined;
  const totalExposure = (typeof tariffImpact?.total_tariff_exposure === "number" ? tariffImpact.total_tariff_exposure : 342000);
  const riskLevel = (typeof tariffImpact?.risk_level === "string" ? tariffImpact.risk_level : "high");
  const survivalPlan = pipelineData.survival_plan as Record<string, unknown> | undefined;
  const actions = (survivalPlan?.priority_actions as Record<string, unknown>[] | undefined) ?? [];
  const totalSavings = actions.reduce((sum, a) => sum + (typeof a.estimated_savings === "number" ? a.estimated_savings : 0), 0);

  const t = (ms: number) => Math.round(ms * DEMO_SPEED);

  return [
  // Supply Chain Analyst — chain-of-thought style
  { delay: t(300), msg: { type: "agent_start", agent: "Supply Chain Analyst" } },
  { delay: t(600), msg: { type: "agent_log", agent: "Supply Chain Analyst", message: "GET /v1/trade-data/HS-code-4407 — Fetching tariff schedule" } },
  { delay: t(1200), msg: { type: "agent_log", agent: "Supply Chain Analyst", message: "GET /v1/trade-data/HS-code-8471 — Classifying inputs" } },
  { delay: t(1800), msg: { type: "agent_log", agent: "Supply Chain Analyst", message: "Parsing business description... Mapped 7 supply chain inputs" } },
  { delay: t(2500), msg: { type: "agent_log", agent: "Supply Chain Analyst", message: "Identified 5 US-sourced inputs exposed to tariffs" } },
  { delay: t(3500), msg: { type: "agent_done", agent: "Supply Chain Analyst", data: {} } },

  // System RAG
  { delay: t(3800), msg: { type: "agent_log", agent: "System", status: "working", message: "Running RAG pipeline: classifying HS codes via semantic search..." } },
  { delay: t(3950), msg: { type: "agent_log", agent: "System", status: "working", message: "Retrieved top-5 HS candidates per US-sourced input from vector index" } },
  { delay: t(4150), msg: { type: "agent_log", agent: "System", status: "complete", message: "Classified 5 inputs to HS codes with tariff rates" } },

  // Tariff Calculator + Geopolitical — CoT style (numbers match selected profile)
  { delay: t(4000), msg: { type: "agent_start", agent: "Tariff Calculator" } },
  { delay: t(4200), msg: { type: "agent_start", agent: "Geopolitical Analyst" } },
  { delay: t(4800), msg: { type: "agent_log", agent: "Tariff Calculator", message: `Calculating margin impact on ${revenue} revenue...` } },
  { delay: t(5300), msg: { type: "agent_log", agent: "Geopolitical Analyst", message: "Analyzing US-Canada 2026 Tariff Amendments" } },
  { delay: t(6000), msg: { type: "agent_log", agent: "Geopolitical Analyst", message: "GET /v1/news/trade — Fetching live trade news (24h)" } },
  { delay: t(6500), msg: { type: "agent_log", agent: "Geopolitical Analyst", message: "Found 12 relevant news articles" } },
  { delay: t(7000), msg: { type: "agent_log", agent: "Tariff Calculator", message: "Running margin erosion scenarios at 25%, 30%, 35%, 40%" } },
  { delay: t(8000), msg: { type: "agent_log", agent: "Tariff Calculator", message: `Total tariff exposure: $${totalExposure.toLocaleString()} — Risk level: ${riskLevel}` } },
  { delay: t(8500), msg: { type: "agent_done", agent: "Tariff Calculator", data: {} } },
  { delay: t(9500), msg: { type: "agent_log", agent: "Geopolitical Analyst", message: "Escalation risk: elevated (trend: worsening) — 3 urgent alerts" } },
  { delay: t(10000), msg: { type: "agent_done", agent: "Geopolitical Analyst", data: {} } },

  // Supplier Scout
  { delay: t(10500), msg: { type: "agent_start", agent: "Supplier Scout" } },
  { delay: t(11500), msg: { type: "agent_log", agent: "Supplier Scout", message: "Searching for Canadian alternatives for 5 US-sourced inputs..." } },
  { delay: t(13000), msg: { type: "agent_log", agent: "Supplier Scout", message: `Found alternatives for ${actions.length || 5} inputs — potential savings: $${totalSavings > 0 ? totalSavings.toLocaleString() : "127,000"}` } },
  { delay: t(13500), msg: { type: "agent_done", agent: "Supplier Scout", data: {} } },

  // Strategy Architect
  { delay: t(14000), msg: { type: "agent_start", agent: "Strategy Architect" } },
  { delay: t(15000), msg: { type: "agent_log", agent: "Strategy Architect", message: "Synthesizing supply chain, tariff, geopolitical, and supplier data..." } },
  { delay: t(17000), msg: { type: "agent_log", agent: "Strategy Architect", message: "Generating priority actions ranked by impact..." } },
  { delay: t(19000), msg: { type: "agent_log", agent: "Strategy Architect", message: "Survival plan ready — 6 priority actions identified." } },
  { delay: t(19500), msg: { type: "agent_done", agent: "Strategy Architect", data: {} } },

  // Pipeline done — data is built from selected profile so results match the business
  {
    delay: t(20000),
    msg: {
      type: "pipeline_done",
      data: pipelineData,
    },
  },
  ];
}

export function runDemoSimulation(
  onMessage: (msg: WSMessage) => void,
  onComplete: () => void,
  options?: DemoRunOptions
): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];
  const messages = buildDemoMessages(options);

  for (const { delay, msg } of messages) {
    const timer = setTimeout(() => {
      onMessage(msg);
      if (msg.type === "pipeline_done") {
        onComplete();
      }
    }, delay);
    timers.push(timer);
  }

  // Return abort function
  return () => {
    for (const t of timers) clearTimeout(t);
  };
}
