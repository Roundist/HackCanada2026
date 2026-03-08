import type { ReactNode } from "react";

interface SharedMemorySnapshotProps {
  data: Record<string, unknown>;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatMoney(value: unknown): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

export default function SharedMemorySnapshot({ data }: SharedMemorySnapshotProps) {
  const supplyChain = asObject(data.supply_chain_map);
  const tariffImpact = asObject(data.tariff_impact);
  const suppliers = asObject(data.alternative_suppliers);
  const geopolitical = asObject(data.geopolitical_context);
  const survivalPlan = asObject(data.survival_plan);

  const supplyInputs = asArray(supplyChain?.inputs);
  const usInputs = supplyInputs.filter((i) => asObject(i)?.is_us_sourced === true).length;
  const products = asArray(supplyChain?.products).length;
  const industry =
    typeof supplyChain?.industry === "string" ? supplyChain.industry : "Unknown";

  const exposure = formatMoney(tariffImpact?.total_tariff_exposure);
  const marginErosion = toNumber(tariffImpact?.total_margin_erosion_pct).toFixed(1);
  const risk =
    typeof tariffImpact?.risk_level === "string"
      ? tariffImpact.risk_level.toUpperCase()
      : "N/A";

  const alternatives = asArray(suppliers?.alternatives).length;
  const supplierSavings = formatMoney(suppliers?.total_potential_savings);

  const articles = asArray(geopolitical?.relevant_articles).length;
  const alerts = asArray(geopolitical?.actionable_alerts).length;
  const escalation =
    typeof geopolitical?.overall_escalation_risk === "string"
      ? geopolitical.overall_escalation_risk.toUpperCase()
      : "N/A";

  const actions = asArray(survivalPlan?.priority_actions).length;
  const risks = asArray(survivalPlan?.risks).length;
  const timeline = asObject(survivalPlan?.timeline);
  const timelineItems =
    asArray(timeline?.days_30).length +
    asArray(timeline?.days_60).length +
    asArray(timeline?.days_90).length;

  const keysPresent = [
    "supply_chain_map",
    "tariff_impact",
    "alternative_suppliers",
    "geopolitical_context",
    "survival_plan",
  ].filter((k) => data[k] !== undefined);

  return (
    <div className="border border-violet-200 bg-violet-50 rounded-lg p-4 mb-4">
      <div className="mb-3">
        <div className="relative flex items-center justify-center">
          <div className="text-[17px] font-mono uppercase tracking-widest text-violet-700 text-center">
            Backboard Shared Memory Snapshot
          </div>
          <div className="absolute right-0 text-[9px] font-mono text-violet-700 border border-violet-200 bg-white px-2 py-1 rounded">
            {keysPresent.length}/5 keys
          </div>
        </div>
        <div className="text-[13px] text-violet-900/80 mt-0.5 text-center">
          Captured at pipeline completion before final report rendering.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        <MemoryCard
          keyName="supply_chain_map"
          summary={`${supplyInputs.length} inputs (${usInputs} US) · ${products} products`}
          detail={`Industry: ${industry}`}
        />
        <MemoryCard
          keyName="tariff_impact"
          summary={`${exposure} exposure · ${marginErosion}% erosion`}
          detail={`Risk: ${risk}`}
        />
        <MemoryCard
          keyName="alternative_suppliers"
          summary={`${alternatives} alternatives`}
          detail={`Potential savings: ${supplierSavings}`}
        />
        <div className="lg:col-span-3 flex flex-col lg:flex-row lg:justify-center gap-2.5">
          <MemoryCard
            keyName="geopolitical_context"
            summary={`${articles} articles · ${alerts} alerts`}
            detail={`Escalation: ${escalation}`}
            className="lg:w-[32%]"
          />
          <MemoryCard
            keyName="survival_plan"
            summary={`${actions} priority actions · ${risks} risks`}
            detail={`Timeline items: ${timelineItems}`}
            className="lg:w-[32%]"
          />
        </div>
      </div>
    </div>
  );
}

function MemoryCard({
  keyName,
  summary,
  detail,
  className = "",
}: {
  keyName: string;
  summary: ReactNode;
  detail: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-violet-200 bg-white rounded p-2.5 ${className}`}>
      <div className="text-[8px] font-mono uppercase tracking-wider text-violet-700">
        {keyName}
      </div>
      <div className="text-[11px] text-gray-800 mt-1">{summary}</div>
      <div className="text-[10px] text-gray-500 mt-0.5">{detail}</div>
    </div>
  );
}
