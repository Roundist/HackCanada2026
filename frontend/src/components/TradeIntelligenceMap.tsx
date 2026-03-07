/**
 * Dark, ultra-clean Canada–US trade intelligence map.
 * Bloomberg / Palantir / NATO intel style — no gradients, no glass, analyst-grade.
 */
import { useState } from "react";

const W = 380;
const H = 280;

// Stylized North America — Canada (top) + US (bottom), thin outlines only
const CANADA_PATH =
  "M 52 42 L 120 38 L 200 45 L 280 52 L 320 65 L 338 95 L 328 130 L 280 145 L 200 138 L 100 132 L 55 100 Z";
const USA_PATH =
  "M 55 100 L 100 132 L 195 138 L 270 148 L 310 155 L 335 175 L 340 210 L 300 245 L 200 252 L 80 240 L 40 200 L 38 160 L 52 120 Z";

// Canadian regions for hover pulse (Ontario, BC, Quebec — simplified)
const ONTARIO_PATH = "M 175 95 L 245 92 L 260 118 L 240 135 L 185 128 Z";
const BC_PATH = "M 52 55 L 95 48 L 110 75 L 95 95 L 58 85 Z";
const QUEBEC_PATH = "M 245 75 L 295 82 L 305 115 L 275 125 L 242 108 Z";

// Port coordinates [x, y]
const PORTS: Record<string, [number, number]> = {
  Vancouver: [68, 72],
  Toronto: [212, 108],
  Montreal: [258, 95],
  "New York": [278, 142],
  Chicago: [188, 132],
  "Los Angeles": [58, 198],
};

// Trade routes: [from, to, type: 'import' | 'export', risk?: 'tariff']
const ROUTES: { from: string; to: string; type: "import" | "export"; risk?: boolean }[] = [
  { from: "Los Angeles", to: "Vancouver", type: "import", risk: true },
  { from: "Chicago", to: "Toronto", type: "import", risk: true },
  { from: "New York", to: "Montreal", type: "import", risk: false },
  { from: "Toronto", to: "New York", type: "export", risk: false },
];

// Boat travels Chicago (188,132) → Toronto (212,108)

// Intelligence nodes: [x, y, label, risk]
const NODES: { x: number; y: number; label: string; risk: boolean }[] = [
  { x: 128, y: 88, label: "Steel HS7208 +25%", risk: true },
  { x: 228, y: 118, label: "Auto Parts HS8708 +25%", risk: true },
  { x: 248, y: 78, label: "Windsor–Detroit Congestion", risk: true },
  { x: 95, y: 155, label: "CPTPP Pacific Route Open", risk: false },
];

export default function TradeIntelligenceMap() {
  const [canadaHover, setCanadaHover] = useState(false);
  const [activeRoute, setActiveRoute] = useState<number | null>(null);

  return (
    <div
      className="relative w-full overflow-hidden bg-gray-50 border border-gray-200 rounded-lg"
      style={{ minHeight: 320 }}
    >
      {/* Precision dot grid */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle, #9ca3af 0.8px, transparent 0)",
          backgroundSize: "14px 14px",
        }}
      />

      {/* Status line */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white/80">
        <span className="text-[8px] font-mono font-light uppercase tracking-[0.2em] text-gray-600">
          Import flow active
        </span>
        <span className="text-[8px] font-mono font-light uppercase tracking-[0.2em] text-gray-500">
          Export route tracked
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full block"
        style={{ minHeight: 260 }}
        onMouseLeave={() => setActiveRoute(null)}
      >
        <defs>
          <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="arrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
            <path d="M0 0 L4 2 L0 4 Z" fill="#64748b" />
          </marker>
          <g id="boat">
            <path
              d="M0 0 L4 -1 L8 0 L7 2 L1 2 Z"
              fill="#94a3b8"
              stroke="#64748b"
              strokeWidth="0.4"
            />
            <path
              d="M-2 0.5 Q-1.5 1 0 1 Q1.5 1 2 0.5"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="0.6"
              strokeLinecap="round"
            />
          </g>
        </defs>

        {/* Radar sweep — thin line rotating from center */}
        <g className="radar-sweep">
          <line
            x1={W / 2}
            y1={H / 2}
            x2={W / 2}
            y2={0}
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="0.5"
          />
        </g>

        {/* North America — Canada + US, thin subtle outlines */}
        <g
          onMouseEnter={() => setCanadaHover(true)}
          onMouseLeave={() => setCanadaHover(false)}
          style={{ cursor: "default" }}
        >
          <path
            d={USA_PATH}
            fill="rgba(255,255,255,0.8)"
            stroke="#94a3b8"
            strokeWidth="0.6"
          />
          <path
            d={CANADA_PATH}
            fill={canadaHover ? "#e2e8f0" : "rgba(255,255,255,0.9)"}
            stroke={canadaHover ? "#64748b" : "#94a3b8"}
            strokeWidth="0.7"
            style={{ transition: "fill 0.3s, stroke 0.3s" }}
          />
          <path
            d={ONTARIO_PATH}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="0.5"
            className={canadaHover ? "animate-pulse" : ""}
            style={{ opacity: canadaHover ? 1 : 0.5, transition: "opacity 0.3s" }}
          />
          <path
            d={BC_PATH}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="0.5"
            className={canadaHover ? "animate-pulse" : ""}
            style={{ opacity: canadaHover ? 1 : 0.5, transition: "opacity 0.3s", animationDelay: "0.2s" }}
          />
          <path
            d={QUEBEC_PATH}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="0.5"
            className={canadaHover ? "animate-pulse" : ""}
            style={{ opacity: canadaHover ? 1 : 0.5, transition: "opacity 0.3s", animationDelay: "0.4s" }}
          />
        </g>

        {/* Trade routes — thin dotted lines, flow animation */}
        {ROUTES.map((r, i) => {
          const start = PORTS[r.from];
          const end = PORTS[r.to];
          const isActive = activeRoute === i;
          const isBoatRoute = r.from === "Chicago" && r.to === "Toronto";
          const strokeColor = r.risk
            ? "#dc2626"
            : isActive
              ? "#475569"
              : "#94a3b8";
          const pathD = `M ${start[0]} ${start[1]} L ${end[0]} ${end[1]}`;
          return (
            <g
              key={i}
              onMouseEnter={() => setActiveRoute(i)}
              onMouseLeave={() => setActiveRoute(null)}
              style={{ cursor: "pointer" }}
            >
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isActive ? 1.2 : 0.8}
                strokeDasharray="4 6"
                strokeLinecap="round"
                markerEnd={isActive ? "url(#arrow)" : undefined}
                style={{
                  filter: isActive ? "url(#routeGlow)" : undefined,
                  animation: "routeFlow 2.5s linear infinite",
                  transition: "stroke 0.2s, stroke-width 0.2s",
                }}
              />
            </g>
          );
        })}

        {/* Moving boat on Chicago → Toronto — slow, radar-like */}
        <g style={{ animation: "boatMove 14s linear infinite" }}>
          <use href="#boat" x={0} y={0} transform="scale(2.2) rotate(-28 4 1)" />
        </g>

        {/* Port dots */}
        {Object.entries(PORTS).map(([name, [x, y]]) => (
          <g key={name}>
            <circle
              cx={x}
              cy={y}
              r={2}
              fill="#e2e8f0"
              stroke="#64748b"
              strokeWidth="0.5"
            />
            <text
              x={x}
              y={y + 12}
              fill="#475569"
              fontSize="6"
              fontFamily="ui-monospace, monospace"
              textAnchor="middle"
              style={{ letterSpacing: "0.05em", fontWeight: 300 }}
            >
              {name.toUpperCase()}
            </text>
          </g>
        ))}

        {/* Intelligence nodes */}
        {NODES.map((node, i) => (
          <g key={i}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.risk ? 3.5 : 2.5}
              fill={node.risk ? "#fecaca" : "#e2e8f0"}
              stroke={node.risk ? "#dc2626" : "#94a3b8"}
              strokeWidth="0.5"
              className="animate-pulse"
              style={{
                animationDuration: "2.5s",
                animationDelay: `${i * 0.3}s`,
              }}
            />
            <text
              x={node.x}
              y={node.y - 6}
              fill="#475569"
              fontSize="5.5"
              fontFamily="ui-monospace, monospace"
              textAnchor="middle"
              style={{ letterSpacing: "0.04em", fontWeight: 400 }}
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-6 px-3 py-2 border-t border-gray-200 bg-white/90">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-0.5 rounded-full bg-red-500" />
          <span className="text-[7px] font-mono uppercase tracking-widest text-gray-600">Tariff risk</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-0.5 rounded-full bg-slate-500" />
          <span className="text-[7px] font-mono uppercase tracking-widest text-gray-600">Active route</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-0.5 rounded-full bg-gray-300" />
          <span className="text-[7px] font-mono uppercase tracking-widest text-gray-600">Inactive</span>
        </span>
      </div>

      <p className="absolute bottom-8 left-0 right-0 px-3 text-center text-[8px] font-mono font-light uppercase tracking-widest text-gray-500">
        Select a profile and click Run Analysis to start.
      </p>

      <style>{`
        .radar-sweep {
          transform-origin: 190px 140px;
          animation: radarSweep 10s linear infinite;
        }
        @keyframes routeFlow {
          to { stroke-dashoffset: -20; }
        }
        @keyframes radarSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes boatMove {
          0% { transform: translate(188px, 132px) scale(2.2) rotate(-28deg); opacity: 0.88; }
          100% { transform: translate(212px, 108px) scale(2.2) rotate(-28deg); opacity: 0.88; }
        }
      `}</style>
    </div>
  );
}
