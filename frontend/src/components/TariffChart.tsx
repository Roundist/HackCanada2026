/**
 * Horizontal bar chart: annual tariff cost by input (PRD TariffChart).
 * Controlled by TariffSimulator via simulatedRate — bars scale when slider moves.
 */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
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

  return (
    <div className="w-full" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: 8, left: 4, bottom: 4 }}
        >
          <XAxis
            type="number"
            domain={[0, domainMax]}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
            stroke={isLight ? "#d1d5db" : "rgba(255,255,255,0.2)"}
            tick={{ fill: isLight ? "#374151" : "rgba(255,255,255,0.4)", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            stroke={isLight ? "#d1d5db" : "rgba(255,255,255,0.2)"}
            tick={{ fill: isLight ? "#374151" : "rgba(255,255,255,0.5)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: isLight ? "#f9fafb" : "rgba(248,250,252,0.98)",
              border: isLight ? "1px solid #e5e7eb" : "1px solid #e2e8f0",
              borderRadius: 6,
              color: "#111827",
            }}
            labelStyle={{ color: "#111827", fontWeight: 600 }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, "Tariff cost"]}
            labelFormatter={(_, payload) => payload[0]?.payload?.fullName ?? ""}
          />
          <Bar dataKey="cost" radius={[0, 3, 3, 0]} maxBarSize={28} isAnimationActive={true}>
            {data.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
