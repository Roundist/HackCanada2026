import type { WSMessage } from "../types";

const DEMO_MESSAGES: { delay: number; msg: WSMessage }[] = [
  // Supply Chain Analyst
  { delay: 300, msg: { type: "agent_start", agent: "Supply Chain Analyst" } },
  { delay: 1200, msg: { type: "agent_log", agent: "Supply Chain Analyst", message: "Parsing business description..." } },
  { delay: 2200, msg: { type: "agent_log", agent: "Supply Chain Analyst", message: "Mapped 7 supply chain inputs" } },
  { delay: 3000, msg: { type: "agent_log", agent: "Supply Chain Analyst", message: "Identified 5 US-sourced inputs exposed to tariffs" } },
  { delay: 3500, msg: { type: "agent_done", agent: "Supply Chain Analyst", data: {} } },

  // Tariff Calculator + Geopolitical (parallel)
  { delay: 4000, msg: { type: "agent_start", agent: "Tariff Calculator" } },
  { delay: 4200, msg: { type: "agent_start", agent: "Geopolitical Analyst" } },
  { delay: 5000, msg: { type: "agent_log", agent: "Tariff Calculator", message: "Calculating tariff exposure per input..." } },
  { delay: 5300, msg: { type: "agent_log", agent: "Geopolitical Analyst", message: "Fetching live trade news from the last 24 hours..." } },
  { delay: 6500, msg: { type: "agent_log", agent: "Geopolitical Analyst", message: "Found 12 relevant news articles" } },
  { delay: 7000, msg: { type: "agent_log", agent: "Tariff Calculator", message: "Running margin erosion scenarios at 25%, 30%, 35%, 40%" } },
  { delay: 8000, msg: { type: "agent_log", agent: "Tariff Calculator", message: "Total tariff exposure: $342,000 — Risk level: high" } },
  { delay: 8500, msg: { type: "agent_done", agent: "Tariff Calculator", data: {} } },
  { delay: 9500, msg: { type: "agent_log", agent: "Geopolitical Analyst", message: "Escalation risk: elevated (trend: worsening) — 3 urgent alerts" } },
  { delay: 10000, msg: { type: "agent_done", agent: "Geopolitical Analyst", data: {} } },

  // Supplier Scout
  { delay: 10500, msg: { type: "agent_start", agent: "Supplier Scout" } },
  { delay: 11500, msg: { type: "agent_log", agent: "Supplier Scout", message: "Searching for Canadian alternatives for 5 US-sourced inputs..." } },
  { delay: 13000, msg: { type: "agent_log", agent: "Supplier Scout", message: "Found alternatives for 5 inputs — potential savings: $127,000" } },
  { delay: 13500, msg: { type: "agent_done", agent: "Supplier Scout", data: {} } },

  // Strategy Architect
  { delay: 14000, msg: { type: "agent_start", agent: "Strategy Architect" } },
  { delay: 15000, msg: { type: "agent_log", agent: "Strategy Architect", message: "Synthesizing supply chain, tariff, geopolitical, and supplier data..." } },
  { delay: 17000, msg: { type: "agent_log", agent: "Strategy Architect", message: "Generating priority actions ranked by impact..." } },
  { delay: 19000, msg: { type: "agent_log", agent: "Strategy Architect", message: "Survival plan ready — 6 priority actions identified." } },
  { delay: 19500, msg: { type: "agent_done", agent: "Strategy Architect", data: {} } },

  // Pipeline done
  {
    delay: 20000,
    msg: {
      type: "pipeline_done",
      data: {
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
            {
              rank: 1,
              action: "Switch hardwood lumber to Canadian suppliers",
              description:
                "Ontario and Quebec have established hardwood mills that can supply oak and maple at competitive prices, eliminating $145,000 in annual tariff costs.",
              estimated_savings: 145000,
              implementation_effort: "Medium",
              timeline_days: 45,
              category: "Supplier Switch",
            },
            {
              rank: 2,
              action: "Renegotiate steel hardware contracts",
              description:
                "Lock in 12-month contracts with current suppliers at pre-tariff pricing, or source from Canadian steel distributors in Hamilton.",
              estimated_savings: 67000,
              implementation_effort: "Low",
              timeline_days: 14,
              category: "Contract Renegotiation",
            },
            {
              rank: 3,
              action: "Apply for CUSMA tariff exemptions",
              description:
                "Several inputs may qualify for duty remission under CUSMA rules of origin. File applications immediately.",
              estimated_savings: 52000,
              implementation_effort: "Medium",
              timeline_days: 30,
              category: "Government Program",
            },
            {
              rank: 4,
              action: "Implement strategic price increases",
              description:
                "Raise prices 5-8% on premium product lines where brand loyalty supports higher pricing. Absorb costs on competitive commodity lines.",
              estimated_savings: 48000,
              implementation_effort: "Low",
              timeline_days: 7,
              category: "Pricing Strategy",
            },
            {
              rank: 5,
              action: "Diversify into European finishing chemicals",
              description:
                "German and Italian suppliers offer comparable quality stains and lacquers, with EU-Canada trade agreement (CETA) providing 0% duty.",
              estimated_savings: 28000,
              implementation_effort: "High",
              timeline_days: 90,
              category: "Supplier Switch",
            },
            {
              rank: 6,
              action: "Explore domestic upholstery textile sourcing",
              description:
                "Quebec textile manufacturers can supply basic upholstery fabrics. Premium specialty fabrics may require continued US sourcing.",
              estimated_savings: 15000,
              implementation_effort: "Medium",
              timeline_days: 60,
              category: "Supplier Switch",
            },
          ],
          timeline: {
            days_30: [
              "Renegotiate steel hardware contracts",
              "File CUSMA exemption applications",
              "Implement initial price increases on premium lines",
              "Contact Canadian hardwood suppliers for quotes",
            ],
            days_60: [
              "Complete transition to Canadian lumber suppliers",
              "Begin qualifying Quebec textile suppliers",
              "Monitor CUSMA application status",
              "Assess price increase impact on sales volume",
            ],
            days_90: [
              "Establish European finishing chemical supply chain",
              "Complete full supplier diversification",
              "Review and adjust pricing strategy",
              "Build 60-day safety stock for remaining US inputs",
            ],
          },
          risks: [
            {
              risk: "Canadian suppliers may have limited capacity",
              probability: "Medium",
              mitigation: "Engage multiple suppliers and stagger transitions",
            },
            {
              risk: "Quality differences with alternative materials",
              probability: "Low",
              mitigation: "Run parallel testing before full switchover",
            },
            {
              risk: "Further tariff escalation to 35%+",
              probability: "Medium",
              mitigation: "Accelerate supplier diversification timeline",
            },
            {
              risk: "Retaliatory tariffs on exports to US",
              probability: "High",
              mitigation: "Diversify export markets to EU and Asia-Pacific",
            },
          ],
        },
      },
    },
  },
];

export function runDemoSimulation(
  onMessage: (msg: WSMessage) => void,
  onComplete: () => void
): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];

  for (const { delay, msg } of DEMO_MESSAGES) {
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
