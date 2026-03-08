/**
 * Horizontal bar chart: annual tariff cost by input (PRD TariffChart).
 * Controlled by TariffSimulator via simulatedRate — bars scale when slider moves.
 */
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  CartesianGrid,
} from "recharts";

export interface TariffInput {
  name: string;
  tariff_cost: number;
}

const BAR_COLORS = ["#dc2626", "#ea580c", "#ca8a04", "#65a30d", "#0d9488"];

interface TariffChartProps {
  inputs: TariffInput[];
  /** Current tariff rate (e.g. 25). Bars show cost at this rate. */
  simulatedRate: number;
  /** Base rate used to compute the input costs (e.g. 25). */
  baseRate?: number;
  variant?: "dark" | "light";
}

export default function TariffChart({
  inputs,
  simulatedRate,
  baseRate = 25,
  variant = "dark",
}: TariffChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const scale = baseRate > 0 ? simulatedRate / baseRate : 1;
  const data = [...inputs]
    .sort((a, b) => (b.tariff_cost ?? 0) - (a.tariff_cost ?? 0))
    .map((row) => ({
      name: row.name.length > 22 ? row.name.slice(0, 20) + "…" : row.name,
      fullName: row.name,
      cost: Math.round((row.tariff_cost ?? 0) * scale),
      baseCost: row.tariff_cost ?? 0,
    }));

  if (data.length === 0) return null;

  // Fixed scale: axis max = cost at 50% rate (slider max) so bars grow realistically from 0% to 50%
  const maxBaseCost = Math.max(1, ...data.map((d) => d.baseCost));
  const sliderMaxRate = 50;
  const domainMax = Math.ceil(maxBaseCost * (sliderMaxRate / baseRate) * 1.05);
  const isLight = variant === "light";
  const chartHeight = Math.max(220, data.length * 46);
  const axisColor = isLight ? "#6b7280" : "rgba(255,255,255,0.45)";

  return (
    <div className="w-full">
      <div className={`flex items-center justify-between mb-1 text-[9px] font-mono uppercase tracking-wider ${isLight ? "text-gray-500" : "text-white/35"}`}>
        <span>Input category</span>
        <span>Annual tariff cost (CAD)</span>
      </div>
      <div style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: 16, left: 4, bottom: 16 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke={isLight ? "#e5e7eb" : "rgba(255,255,255,0.08)"}
          />
          <XAxis
            type="number"
            domain={[0, domainMax]}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
            stroke={isLight ? "#d1d5db" : "rgba(255,255,255,0.2)"}
            tick={{ fill: axisColor, fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            stroke={isLight ? "#d1d5db" : "rgba(255,255,255,0.2)"}
            tick={{ fill: axisColor, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: isLight ? "rgba(15, 23, 42, 0.06)" : "rgba(255,255,255,0.05)" }}
            contentStyle={{
              background: isLight ? "#f9fafb" : "rgba(15, 23, 42, 0.96)",
              border: isLight ? "1px solid #e5e7eb" : "1px solid rgba(148,163,184,0.25)",
              borderRadius: 6,
              color: isLight ? "#111827" : "#e2e8f0",
            }}
            labelStyle={{ color: isLight ? "#111827" : "#f8fafc", fontWeight: 600 }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, "Tariff cost"]}
            labelFormatter={(_, payload) => payload[0]?.payload?.fullName ?? ""}
          />
          <Bar
            dataKey="cost"
            radius={[0, 3, 3, 0]}
            maxBarSize={28}
            isAnimationActive={true}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={BAR_COLORS[i % BAR_COLORS.length]}
                fillOpacity={activeIndex === null || activeIndex === i ? 0.9 : 0.35}
                stroke={activeIndex === i ? (isLight ? "#1f2937" : "#f8fafc") : "none"}
                strokeOpacity={0.3}
              />
            ))}
            <LabelList
              dataKey="cost"
              position="right"
              offset={8}
              formatter={(value: number) => `$${Math.round(value / 1000)}K`}
              style={{
                fontSize: 10,
                fill: axisColor,
                fontFamily: "IBM Plex Mono, ui-monospace, monospace",
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
