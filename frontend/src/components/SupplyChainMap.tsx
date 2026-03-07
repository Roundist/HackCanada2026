import { motion } from "framer-motion";
import type { BusinessProfile } from "../data/businessProfiles";

interface SupplyChainMapProps {
  profile: BusinessProfile | null;
  highlightedCommodity?: string | null;
  tariffRatePct: number;
  /** When set, use real rates from API for profile routes (e.g. TARIFF WALL = max route rate). */
  getRate?: (hsCode: string) => number;
}

function RoutePath({
  fromX,
  fromY,
  toX,
  toY,
  highlighted,
  label,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  highlighted: boolean;
  label?: string;
}) {
  const midX = (fromX + toX) / 2;
  const path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
  return (
    <g>
      <motion.path
        d={path}
        fill="none"
        stroke={highlighted ? "#ff4d4d" : "rgba(255,255,255,0.12)"}
        strokeWidth={highlighted ? 2.5 : 1}
        strokeDasharray={highlighted ? "0" : "4 2"}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />
      {label && (
        <text
          x={midX}
          y={(fromY + toY) / 2 - 6}
          fill="rgba(255,255,255,0.4)"
          fontSize="8"
          fontFamily="monospace"
          textAnchor="middle"
        >
          {label}
        </text>
      )}
    </g>
  );
}

export default function SupplyChainMap({ profile, highlightedCommodity = null, tariffRatePct, getRate }: SupplyChainMapProps) {
  const routes = profile?.routes ?? [];
  const hasHighlight = highlightedCommodity != null;
  const displayRate =
    getRate && profile?.routes?.length
      ? Math.max(...profile.routes.map((r) => getRate(r.hsCode ?? "")))
      : tariffRatePct;

  // Layout: 3 columns — Source (left), Transit/Border (center), Canadian Business (right)
  const w = 320;
  const h = 220;
  const col1 = 60;
  const col2 = w / 2;
  const col3 = w - 60;
  const rowH = h / (Math.max(routes.length, 1) + 2);
  const startY = rowH;

  return (
    <div className="supply-chain-map">
      <div className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">
        Supply Chain Flow
      </div>
      <div className="border border-white/[0.06] rounded-lg overflow-hidden" style={{ background: "rgba(10,10,10,0.6)" }}>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ minHeight: 200 }}>
          {/* Column 1: Source Country */}
          <g>
            <text x={col1} y={16} fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace" textAnchor="middle">
              SOURCE
            </text>
            {routes.map((r, i) => (
              <g key={r.commodity + r.sourceCountry}>
                <motion.rect
                  x={col1 - 44}
                  y={startY + i * rowH - 10}
                  width={88}
                  height={20}
                  rx={4}
                  fill={highlightedCommodity === r.commodity ? "rgba(255,77,77,0.15)" : "rgba(255,255,255,0.04)"}
                  stroke={highlightedCommodity === r.commodity ? "#ff4d4d" : "rgba(255,255,255,0.08)"}
                  strokeWidth={1}
                />
                <text
                  x={col1}
                  y={startY + i * rowH + 2}
                  fill="rgba(255,255,255,0.7)"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {r.sourceCountry}
                </text>
                <text
                  x={col1}
                  y={startY + i * rowH + 12}
                  fill="rgba(255,255,255,0.35)"
                  fontSize="7"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {r.commodity}
                </text>
              </g>
            ))}
          </g>

          {/* Column 2: Transit / Tariff Wall */}
          <g>
            <text x={col2} y={16} fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace" textAnchor="middle">
              TRANSIT / BORDER
            </text>
            {routes.map((r, i) => (
              <g key={r.commodity + "transit"}>
                <motion.rect
                  x={col2 - 52}
                  y={startY + i * rowH - 10}
                  width={104}
                  height={20}
                  rx={4}
                  fill="rgba(255,184,0,0.06)"
                  stroke="rgba(255,184,0,0.35)"
                  strokeWidth={1}
                />
                <text
                  x={col2}
                  y={startY + i * rowH + 2}
                  fill="rgba(255,184,0,0.9)"
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {r.transitPoint}
                </text>
                <text
                  x={col2}
                  y={startY + i * rowH + 12}
                  fill="rgba(255,77,77,0.9)"
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  TARIFF WALL {displayRate}%
                </text>
              </g>
            ))}
          </g>

          {/* Column 3: Canadian Business */}
          <g>
            <text x={col3} y={16} fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace" textAnchor="middle">
              CANADIAN BUSINESS
            </text>
            {routes.length > 0 && (
              <g>
                <motion.rect
                  x={col3 - 56}
                  y={startY + (routes.length * rowH) / 2 - rowH / 2 - 14}
                  width={112}
                  height={28}
                  rx={4}
                  fill={profile ? "rgba(22,163,74,0.1)" : "rgba(255,255,255,0.04)"}
                  stroke="rgba(22,163,74,0.4)"
                  strokeWidth={1}
                />
                <text
                  x={col3}
                  y={startY + (routes.length * rowH) / 2 - rowH / 2 + 2}
                  fill="rgba(255,255,255,0.9)"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {profile?.name ?? "—"}
                </text>
                <text
                  x={col3}
                  y={startY + (routes.length * rowH) / 2 - rowH / 2 + 14}
                  fill="rgba(255,255,255,0.4)"
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {profile?.industry ?? ""}
                </text>
              </g>
            )}
          </g>

          {/* Paths: Source -> Transit -> Business */}
          {routes.map((r, i) => {
            const y = startY + i * rowH;
            const destY = startY + (routes.length * rowH) / 2 - rowH / 2;
            const highlighted = hasHighlight ? highlightedCommodity === r.commodity : i === 0;
            return (
              <g key={r.commodity + "path"}>
                <RoutePath fromX={col1 + 44} fromY={y} toX={col2 - 52} toY={y} highlighted={highlighted} />
                <RoutePath fromX={col2 + 52} fromY={y} toX={col3 - 56} toY={destY} highlighted={highlighted} label={r.commodity} />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
