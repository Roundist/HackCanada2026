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
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  highlighted: boolean;
}) {
  const midX = (fromX + toX) / 2;
  const path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
  return (
    <motion.path
      d={path}
      fill="none"
      stroke={highlighted ? "rgba(255,77,77,0.7)" : "rgba(255,255,255,0.08)"}
      strokeWidth={highlighted ? 2 : 1}
      strokeDasharray={highlighted ? "0" : "3 2"}
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5 }}
    />
  );
}

export default function SupplyChainMap({ profile, highlightedCommodity = null, tariffRatePct, getRate }: SupplyChainMapProps) {
  const routes = profile?.routes ?? [];
  const hasHighlight = highlightedCommodity != null;
  const displayRate =
    getRate && profile?.routes?.length
      ? Math.max(...profile.routes.map((r) => getRate(r.hsCode ?? "")))
      : tariffRatePct;

  const n = Math.max(routes.length, 1);
  const w = 320;
  const h = 224;
  const col1 = 56;
  const col2 = w / 2;
  const col3 = w - 56;
  const headerH = 30;
  const bottomPad = 34;
  const rowH = (h - headerH - bottomPad) / n;
  const startY = headerH + rowH / 2;
  const boxH = Math.min(26, rowH - 6);
  const businessCenterY = headerH + (n * rowH) / 2;
  const businessBoxW = 108;
  const businessBoxH = 28;

  return (
    <div className="supply-chain-map">
      <div className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
        Supply Chain Flow
      </div>
      <div className="border border-white/[0.06] rounded-lg overflow-hidden px-3 pt-3 pb-4" style={{ background: "rgba(10,10,10,0.6)" }}>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ minHeight: 200 }}>
          {/* Column headers */}
          <text x={col1} y={18} fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace" textAnchor="middle">
            SOURCE
          </text>
          <text x={col2} y={18} fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace" textAnchor="middle">
            TRANSIT
          </text>
          <text x={col3} y={18} fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace" textAnchor="middle">
            BUSINESS
          </text>

          {/* Paths first (under boxes) */}
          {routes.map((r, i) => {
            const y = startY + i * rowH;
            const highlighted = hasHighlight ? highlightedCommodity === r.commodity : i === 0;
            return (
              <g key={`path-${r.commodity}`}>
                <RoutePath fromX={col1 + 42} fromY={y} toX={col2 - 50} toY={y} highlighted={highlighted} />
                <RoutePath fromX={col2 + 50} fromY={y} toX={col3 - businessBoxW / 2} toY={businessCenterY} highlighted={highlighted} />
              </g>
            );
          })}

          {/* Column 1: Source */}
          {routes.map((r, i) => (
            <g key={r.commodity + r.sourceCountry}>
              <rect
                x={col1 - 42}
                y={startY + i * rowH - boxH / 2}
                width={84}
                height={boxH}
                rx={3}
                fill={highlightedCommodity === r.commodity ? "rgba(255,77,77,0.12)" : "rgba(255,255,255,0.03)"}
                stroke={highlightedCommodity === r.commodity ? "rgba(255,77,77,0.5)" : "rgba(255,255,255,0.06)"}
                strokeWidth={1}
              />
              <text x={col1} y={startY + i * rowH - 5} fill="rgba(255,255,255,0.75)" fontSize="8" fontFamily="monospace" textAnchor="middle">
                {r.sourceCountry}
              </text>
              <text x={col1} y={startY + i * rowH + 6} fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="monospace" textAnchor="middle">
                {r.commodity}
              </text>
            </g>
          ))}

          {/* Column 2: Transit */}
          {routes.map((r, i) => (
            <g key={r.commodity + "transit"}>
              <rect
                x={col2 - 50}
                y={startY + i * rowH - boxH / 2}
                width={100}
                height={boxH}
                rx={3}
                fill="rgba(255,184,0,0.05)"
                stroke="rgba(255,184,0,0.2)"
                strokeWidth={1}
              />
              <text x={col2} y={startY + i * rowH + 2} fill="rgba(255,255,255,0.6)" fontSize="7" fontFamily="monospace" textAnchor="middle">
                {r.transitPoint}
              </text>
            </g>
          ))}
          {routes.length > 0 && (
            <text x={col2} y={h - 18} fill="rgba(255,77,77,0.7)" fontSize="7" fontFamily="monospace" textAnchor="middle">
              Tariff {displayRate}%
            </text>
          )}

          {/* Column 3: Canadian Business (single cell) — wider box so long names don't clip */}
          {routes.length > 0 && profile && (
            <g>
              <rect
                x={col3 - businessBoxW / 2}
                y={businessCenterY - businessBoxH / 2}
                width={businessBoxW}
                height={businessBoxH}
                rx={3}
                fill="rgba(22,163,74,0.08)"
                stroke="rgba(22,163,74,0.3)"
                strokeWidth={1}
              />
              <text x={col3} y={businessCenterY - 5} fill="rgba(255,255,255,0.9)" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="600">
                {profile.name.length > 18 ? profile.name.slice(0, 16) + "…" : profile.name}
              </text>
              <text x={col3} y={businessCenterY + 8} fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="monospace" textAnchor="middle">
                {profile.industry}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
