import type { WSMessage, HsClassification, ReasoningStep } from "../types";
import type { BusinessProfile } from "../data/businessProfiles";

export interface DemoRunOptions {
  revenue?: string;
  /** When set, pipeline_done and agent messages use this profile so results match the selected business. */
  profile?: BusinessProfile | null;
}

/** Build pipeline_done payload from the selected profile so data is accurate to the business. */
function buildPipelineDoneData(profile: BusinessProfile | null): Record<string, unknown> {
  if (!profile) {
    // Fallback based on Maple Furniture profile ($8M revenue, 65% US imports, 25% surtax)
    // $8M × 0.65 US-sourced × ~6.6% effective tariff burden = ~$342K exposure
    return {
      tariff_impact: {
        total_tariff_exposure: 342000,
        total_margin_erosion_pct: 8.4,
        risk_level: "high",
        inputs: [
          { name: "Hardwood Lumber (HS 4407)", tariff_cost: 120000 },
          { name: "Upholstery Fabrics (HS 5907)", tariff_cost: 85000 },
          { name: "Steel Hardware (HS 8302)", tariff_cost: 72000 },
          { name: "Finishing Chemicals (HS 3209)", tariff_cost: 65000 },
        ],
        source: "CBSA",
        source_description: "CBSA Customs Tariff 2025 (demo structure)",
      },
      survival_plan: {
        executive_summary: {
          business_name: "Maple Furniture Co.",
          total_tariff_exposure: 342000,
          risk_level: "high",
          headline: "25% retaliatory surtax creates critical exposure for US-dependent supply chain",
          key_finding:
            "65% of raw materials sourced from the US now face Canada's 25% retaliatory surtax (Customs Tariff Act, effective March 4, 2025). At current import volumes, this erodes margins by 8.4 percentage points — making 2 of 4 product lines unprofitable within 6 months without intervention.",
        },
        priority_actions: [
          { rank: 1, action: "Source hardwood lumber from Ontario/Quebec mills", description: "Domestic suppliers (e.g., Ontario Hardwood Mills) eliminate the 25% surtax entirely. Canada produces 30% of global softwood lumber.", estimated_savings: 145000, implementation_effort: "Medium", timeline_days: 45, category: "Supplier Switch" },
          { rank: 2, action: "Apply for CUSMA duty remission program", description: "Inputs with Rules of Origin compliance may qualify for surtax exemption under CUSMA Chapter 4.", estimated_savings: 52000, implementation_effort: "Medium", timeline_days: 30, category: "Government Program" },
          { rank: 3, action: "Implement strategic price increases on premium lines", description: "Canadian furniture market tolerates 5–8% increases on premium SKUs (StatCan CPI furniture +3.2% YoY).", estimated_savings: 48000, implementation_effort: "Low", timeline_days: 7, category: "Pricing Strategy" },
        ],
        timeline: { days_30: ["File CUSMA duty remission applications", "Contact Ontario/Quebec lumber mills and CPTPP fabric suppliers"], days_60: ["Begin supplier transitions for top-2 cost inputs", "Monitor CBSA surtax amendment notices"], days_90: ["Complete supply chain diversification audit", "Review pricing strategy effectiveness"] },
        risks: [
          { risk: "Domestic lumber capacity constraints during trade diversion", probability: "Medium", mitigation: "Engage multiple mills across Ontario, Quebec, and BC; stagger order transitions" },
          { risk: "Further surtax escalation beyond 25%", probability: "Low", mitigation: "Accelerate CPTPP/CETA sourcing to reduce US dependency below 30%" },
        ],
      },
    };
  }

  const totalExposure = Math.round(profile.revenueNumeric * 1e6 * 0.065 * (profile.baseMarginErosionPct / 8.4));
  const riskLevel = profile.risk.toLowerCase();
  // Per-input tariff cost for chart (split by route count)
  const nRoutes = Math.max(profile.routes.length, 1);
  const costPerRoute = Math.round(totalExposure / nRoutes);
  const inputs = profile.routes.map((r, i) => ({
    name: r.commodity,
    tariff_cost: i < nRoutes - 1 ? costPerRoute : totalExposure - costPerRoute * (nRoutes - 1),
  }));
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
      inputs,
      /** Attribution: demo uses same structure as CBSA Customs Tariff 2025. */
      source: "CBSA",
      source_description: "CBSA Customs Tariff 2025 (demo structure)",
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

// HS code candidate data for realistic vector search results
const HS_CANDIDATE_DB: Record<string, { hsCode: string; description: string; similarity: number }[]> = {
  "Hardwood Lumber": [
    { hsCode: "4407.11", description: "Wood sawn lengthwise — coniferous (pine, fir, spruce)", similarity: 0.82 },
    { hsCode: "4407.29", description: "Wood sawn lengthwise — tropical hardwoods, other", similarity: 0.87 },
    { hsCode: "4407.99", description: "Wood sawn lengthwise — other non-coniferous (oak, maple, walnut)", similarity: 0.94 },
    { hsCode: "4403.99", description: "Wood in rough — other non-coniferous", similarity: 0.76 },
    { hsCode: "4412.10", description: "Plywood — bamboo or with bamboo face", similarity: 0.61 },
  ],
  "Upholstery Fabrics": [
    { hsCode: "5907.00", description: "Textile fabrics coated/impregnated — upholstery and furnishing", similarity: 0.93 },
    { hsCode: "5903.20", description: "Textile fabrics impregnated with polyurethane", similarity: 0.85 },
    { hsCode: "5811.00", description: "Quilted textile products — for furnishing", similarity: 0.78 },
    { hsCode: "5407.52", description: "Woven fabrics of polyester — dyed", similarity: 0.71 },
    { hsCode: "5112.19", description: "Woven fabrics of combed wool — mixed", similarity: 0.63 },
  ],
  "Steel Hardware": [
    { hsCode: "8302.10", description: "Base metal hinges for furniture, doors", similarity: 0.96 },
    { hsCode: "8302.42", description: "Base metal mountings and fittings — for furniture", similarity: 0.91 },
    { hsCode: "8301.40", description: "Locks — padlocks, clasp locks", similarity: 0.74 },
    { hsCode: "7318.15", description: "Threaded screws and bolts — other", similarity: 0.68 },
    { hsCode: "7326.90", description: "Other articles of iron or steel, n.e.s.", similarity: 0.59 },
  ],
  "Finishing Chemicals": [
    { hsCode: "3209.10", description: "Paints/varnishes — acrylic polymer base, aqueous", similarity: 0.92 },
    { hsCode: "3208.90", description: "Paints/varnishes — non-aqueous, other synthetic polymer", similarity: 0.88 },
    { hsCode: "3210.00", description: "Other paints/varnishes; prepared water pigments", similarity: 0.79 },
    { hsCode: "3212.90", description: "Pigments/dyes in forms for retail sale — other", similarity: 0.65 },
    { hsCode: "3214.10", description: "Glaziers' putty and mastics", similarity: 0.52 },
  ],
  "PCB & Semiconductors": [
    { hsCode: "8542.31", description: "Electronic integrated circuits — processors and controllers", similarity: 0.95 },
    { hsCode: "8542.32", description: "Electronic integrated circuits — memories", similarity: 0.89 },
    { hsCode: "8534.00", description: "Printed circuits (PCBs)", similarity: 0.91 },
    { hsCode: "8541.40", description: "Photosensitive semiconductor devices", similarity: 0.72 },
    { hsCode: "8543.70", description: "Other electrical machines — n.e.s.", similarity: 0.58 },
  ],
  "Plastic Housings": [
    { hsCode: "3926.90", description: "Other articles of plastics — n.e.s.", similarity: 0.93 },
    { hsCode: "3926.30", description: "Fittings for furniture, coachwork — plastics", similarity: 0.87 },
    { hsCode: "8473.30", description: "Parts and accessories for data processing machines", similarity: 0.76 },
    { hsCode: "3920.99", description: "Other plates/sheets of plastics — non-cellular", similarity: 0.69 },
    { hsCode: "3923.10", description: "Boxes, cases, crates — plastics", similarity: 0.62 },
  ],
  "Lithium Batteries": [
    { hsCode: "8507.60", description: "Lithium-ion accumulators (rechargeable batteries)", similarity: 0.97 },
    { hsCode: "8507.80", description: "Other electric accumulators", similarity: 0.82 },
    { hsCode: "8506.50", description: "Primary lithium cells and batteries", similarity: 0.78 },
    { hsCode: "8507.10", description: "Lead-acid accumulators", similarity: 0.51 },
    { hsCode: "8504.40", description: "Static converters (power supplies)", similarity: 0.45 },
  ],
  "Packaging Materials": [
    { hsCode: "3923.29", description: "Sacks and bags of plastics — other", similarity: 0.91 },
    { hsCode: "3923.10", description: "Boxes, cases, crates of plastics", similarity: 0.89 },
    { hsCode: "4819.10", description: "Cartons/boxes of corrugated paper or board", similarity: 0.84 },
    { hsCode: "3920.10", description: "Plates/sheets of ethylene polymers", similarity: 0.72 },
    { hsCode: "7612.90", description: "Aluminium containers — other", similarity: 0.55 },
  ],
  "Flavoring Extracts": [
    { hsCode: "2106.90", description: "Food preparations not elsewhere specified — flavorings", similarity: 0.94 },
    { hsCode: "3302.10", description: "Mixtures of odoriferous substances — food/beverage industry", similarity: 0.88 },
    { hsCode: "1302.19", description: "Vegetable saps and extracts — other", similarity: 0.75 },
    { hsCode: "2103.90", description: "Sauces and preparations — other", similarity: 0.68 },
    { hsCode: "2101.12", description: "Extracts of tea or maté", similarity: 0.52 },
  ],
  "Specialty Grains": [
    { hsCode: "1001.99", description: "Wheat and meslin — other (specialty grain)", similarity: 0.93 },
    { hsCode: "1008.90", description: "Other cereals — quinoa, spelt, other specialty", similarity: 0.88 },
    { hsCode: "1104.29", description: "Cereals otherwise worked — hulled, pearled", similarity: 0.79 },
    { hsCode: "1001.19", description: "Durum wheat — other", similarity: 0.74 },
    { hsCode: "1005.90", description: "Maize (corn) — other", similarity: 0.61 },
  ],
};

/** Build HS classification messages from profile routes. */
function buildHsClassifications(
  profile: BusinessProfile | null,
  t: (ms: number) => number
): { delay: number; msg: WSMessage }[] {
  const routes = profile?.routes ?? [
    { commodity: "Hardwood Lumber", hsCode: "4407" },
    { commodity: "Upholstery Fabrics", hsCode: "5907" },
    { commodity: "Steel Hardware", hsCode: "8302" },
    { commodity: "Finishing Chemicals", hsCode: "3209" },
  ];

  return routes.map((route, i) => {
    const candidates = HS_CANDIDATE_DB[route.commodity] ?? [
      { hsCode: route.hsCode ?? "0000", description: route.commodity, similarity: 0.95 },
    ];
    const selected = candidates[0]?.hsCode.split(".")[0] === route.hsCode
      ? candidates[0]
      : candidates.find((c) => c.hsCode.startsWith(route.hsCode ?? "")) ?? candidates[0];

    const classification: HsClassification = {
      input: route.commodity,
      candidates: candidates.slice(0, 5),
      selectedCode: selected?.hsCode ?? route.hsCode ?? "0000",
      mfnRate: [6.5, 8.0, 5.0, 6.5, 0, 6.5, 0, 8.0, 6.5, 0][i] ?? 6.5,
      surtaxRate: 25,
      effectiveRate: 25,
      source: `CBSA Customs Tariff, Chapter ${(route.hsCode ?? "44").slice(0, 2)}, SOR/2025-28`,
    };

    return {
      delay: t(3960 + i * 40),
      msg: { type: "hs_classification" as const, classification },
    };
  });
}

/** Build reasoning step messages showing how tariff exposure was calculated. */
function buildReasoningSteps(
  profile: BusinessProfile | null,
  totalExposure: number,
  t: (ms: number) => number
): { delay: number; msg: WSMessage }[] {
  const revM = profile?.revenueNumeric ?? 8;
  const importPct = profile ? parseInt(profile.imports.replace(/[^0-9]/g, "")) : 65;
  const erosion = profile?.baseMarginErosionPct ?? 8.4;
  const nRoutes = profile?.routes.length ?? 4;
  const usImportValue = Math.round(revM * 1_000_000 * (importPct / 100));
  const perRoute = Math.round(totalExposure / nRoutes);

  const steps: ReasoningStep[] = [
    {
      agent: "Tariff Calculator",
      input: `Revenue: $${revM}M, US imports: ${importPct}%`,
      operation: `$${revM}M × ${importPct}% = $${(usImportValue / 1000).toFixed(0)}K US-sourced input value`,
      result: `$${usImportValue.toLocaleString()} exposed to 25% surtax`,
      timestamp: Date.now(),
    },
    {
      agent: "Tariff Calculator",
      input: `${nRoutes} classified inputs at 25% effective rate`,
      operation: `Weighted tariff burden across HS codes: avg ${erosion.toFixed(1)}pp margin erosion`,
      result: `Total exposure: $${totalExposure.toLocaleString()} (~$${perRoute.toLocaleString()}/input)`,
      timestamp: Date.now(),
    },
    {
      agent: "Tariff Calculator",
      input: `Baseline margin: ${profile ? "18–22%" : "18–22%"}, erosion: ${erosion}pp`,
      operation: `Effective margin: ${(20 - erosion).toFixed(1)}% → ${erosion > 15 ? "UNPROFITABLE" : erosion > 10 ? "CRITICAL" : "PRESSURED"}`,
      result: erosion > 12 ? "Immediate action required" : `${Math.round(12 / erosion * 6)} months before critical threshold`,
      timestamp: Date.now(),
    },
  ];

  return steps.map((reasoning, i) => ({
    delay: t(7200 + i * 200),
    msg: { type: "reasoning_step" as const, reasoning },
  }));
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
  { delay: t(600), msg: { type: "agent_log", agent: "Supply Chain Analyst", message: "GET /v1/cbsa/tariff-schedule/HS-4407 — Querying Canadian Customs Tariff" } },
  { delay: t(1200), msg: { type: "agent_log", agent: "Supply Chain Analyst", message: "GET /v1/cbsa/tariff-schedule/HS-8302 — Classifying US-sourced inputs" } },
  { delay: t(1800), msg: { type: "agent_log", agent: "Supply Chain Analyst", message: "Parsing business description... Mapped 7 supply chain inputs" } },
  { delay: t(2500), msg: { type: "agent_log", agent: "Supply Chain Analyst", message: "Identified 5 US-sourced inputs exposed to tariffs" } },
  { delay: t(3500), msg: { type: "agent_done", agent: "Supply Chain Analyst", data: {} } },

  // System RAG
  { delay: t(3800), msg: { type: "agent_log", agent: "System", status: "working", message: "Running RAG pipeline: classifying HS codes via semantic search..." } },
  { delay: t(3950), msg: { type: "agent_log", agent: "System", status: "working", message: "Retrieved top-5 HS candidates per US-sourced input from vector index" } },

  // HS Classification Evidence — shows vector search results with similarity scores
  ...buildHsClassifications(opts.profile ?? null, t),

  { delay: t(4150), msg: { type: "agent_log", agent: "System", status: "complete", message: `Classified ${(opts.profile?.routes.length ?? 4)} inputs to HS codes with tariff rates` } },

  // Tariff Calculator + Geopolitical — CoT style (numbers match selected profile)
  { delay: t(4000), msg: { type: "agent_start", agent: "Tariff Calculator" } },
  { delay: t(4200), msg: { type: "agent_start", agent: "Geopolitical Analyst" } },
  { delay: t(4800), msg: { type: "agent_log", agent: "Tariff Calculator", message: `Calculating margin impact on ${revenue} revenue...` } },
  { delay: t(5300), msg: { type: "agent_log", agent: "Geopolitical Analyst", message: "Analyzing Customs Tariff Act amendments — SOR/2025-28 retaliatory surtax schedule" } },
  { delay: t(6000), msg: { type: "agent_log", agent: "Geopolitical Analyst", message: "GET /v1/cbsa/surtax-notices — Fetching CBSA customs notices (D-series)" } },
  { delay: t(6500), msg: { type: "agent_log", agent: "Geopolitical Analyst", message: "Indexed CBSA surtax notices, USTR retaliatory filings, CUSMA dispute records" } },
  { delay: t(7000), msg: { type: "agent_log", agent: "Tariff Calculator", message: "Running margin erosion scenarios at 25%, 30%, 35%, 40%" } },

  // Reasoning steps — show exactly how exposure was calculated
  ...buildReasoningSteps(opts.profile ?? null, totalExposure, t),

  { delay: t(8000), msg: { type: "agent_log", agent: "Tariff Calculator", message: `Total tariff exposure: $${totalExposure.toLocaleString()} — Risk level: ${riskLevel}` } },
  { delay: t(8500), msg: { type: "agent_done", agent: "Tariff Calculator", data: {} } },
  { delay: t(9000), msg: { type: "geopolitical_alert", urgency: "high", headline: "Canada Expands 25% Surtax to All US-Origin Goods Under Customs Tariff Act", source: "Government of Canada — CBSA", relevance: "Effective March 4, 2025: 25% retaliatory surtax on all US-origin imports. Applies to HS chapters 1–97.", affected_inputs: ["All US-sourced inputs"], risk_adjustment: { from: "high", to: "critical" }, actionable_alert: "Accelerate CPTPP/CETA supplier sourcing — 25% surtax now applies across all commodity chapters." } },
  { delay: t(9500), msg: { type: "agent_log", agent: "Geopolitical Analyst", message: "Escalation risk: elevated — CA–US trade corridor under active retaliatory measures since Mar 2025" } },
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
  { delay: t(19000), msg: { type: "agent_log", agent: "Strategy Architect", message: `Survival plan ready — ${actions.length || 5} priority actions identified.` } },
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
