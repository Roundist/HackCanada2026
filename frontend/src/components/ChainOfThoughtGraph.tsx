/**
 * Chain of Thought — dark terminal-style node graph for AI trade intelligence.
 * Pure SVG + CSS: hexagon nodes, directed animated edges, risk-colored strokes, no third-party graph libs.
 */
import { useMemo } from "react";

const W = 300;
const H = 420;

// Flat-top hexagon path: radius r, center (cx, cy). sqrt(3)/2 ≈ 0.866
function hexPath(cx: number, cy: number, r: number): string {
  const w = r * 0.866;
  return `M ${cx} ${cy - r} L ${cx + w} ${cy - r / 2} L ${cx + w} ${cy + r / 2} L ${cx} ${cy + r} L ${cx - w} ${cy + r / 2} L ${cx - w} ${cy - r / 2} Z`;
}

type EdgeRisk = "high" | "warning" | "neutral";

const NODES = [
  { id: "tariff", label: "TARIFF RISK", badge: "+12% TARIFF", r: 26, cx: W / 2, cy: 55, active: true },
  { id: "geo", label: "GEOPOLITICAL", badge: "RISK ELEVATED", r: 20, cx: W / 2, cy: 130 },
  { id: "supply", label: "SUPPLY CHAIN", badge: "4 ROUTES", r: 20, cx: W / 2, cy: 205 },
  { id: "scout", label: "SUPPLIER SCOUT", badge: "3 ALTS", r: 20, cx: W / 2, cy: 280 },
  { id: "shift", label: "SUPPLIER SHIFT", badge: "RECOMMENDED", r: 22, cx: W / 2, cy: 355, pulse: true },
] as const;

const EDGES: { from: number; to: number; risk: EdgeRisk }[] = [
  { from: 0, to: 1, risk: "high" },
  { from: 1, to: 2, risk: "warning" },
  { from: 2, to: 3, risk: "neutral" },
  { from: 3, to: 4, risk: "warning" },
];

const EDGE_COLORS: Record<EdgeRisk, string> = {
  high: "rgba(255,51,51,0.9)",
  warning: "rgba(245,158,11,0.85)",
  neutral: "rgba(255,255,255,0.5)",
};

export default function ChainOfThoughtGraph() {
  const edgePaths = useMemo(() => {
    return EDGES.map((e) => {
      const a = NODES[e.from];
      const b = NODES[e.to];
      const y1 = a.cy + a.r;
      const y2 = b.cy - b.r;
      return `M ${a.cx} ${y1} L ${b.cx} ${y2}`;
    });
  }, []);

  return (
    <div
      className="relative w-full rounded overflow-visible"
      style={{ background: "#0a0a0a", minHeight: 380 }}
    >
      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "10px 10px",
        }}
      />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="relative w-full block"
        style={{ minHeight: 360, fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
      >
        <defs>
          <filter id="nodeGlowRed" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="edgeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="pulseAmber" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="b" />
            <feColorMatrix in="b" type="matrix" values="1 0.5 0 0 0  0.6 0.4 0 0 0  0 0 0 0 0  0 0 0 0.7 0" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 Z" fill="rgba(255,51,51,0.9)" />
          </marker>
          <marker id="arrowAmber" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 Z" fill="rgba(245,158,11,0.9)" />
          </marker>
          <marker id="arrowWhite" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0 0 L5 2.5 L0 5 Z" fill="rgba(255,255,255,0.6)" />
          </marker>
        </defs>

        {/* Directed edges with animated dashes */}
        {edgePaths.map((d, i) => {
          const risk = EDGES[i].risk;
          const marker = risk === "high" ? "url(#arrowRed)" : risk === "warning" ? "url(#arrowAmber)" : "url(#arrowWhite)";
          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={EDGE_COLORS[risk]}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="8 10"
              markerEnd={marker}
              style={{
                filter: "url(#edgeGlow)",
                animation: "chainEdgeDash 1.2s linear infinite",
              }}
            />
          );
        })}

        {/* Nodes: hexagons */}
        {NODES.map((node) => {
          const isActive = "active" in node && node.active === true;
          const isPulse = "pulse" in node && node.pulse === true;
          const path = hexPath(node.cx, node.cy, node.r);
          const stroke = isActive ? "rgba(255,51,51,0.9)" : isPulse ? "rgba(245,158,11,0.8)" : "rgba(255,255,255,0.6)";
          const fill = isActive ? "#ff3333" : isPulse ? "rgba(245,158,11,0.15)" : "transparent";
          return (
            <g key={node.id}>
              <path
                d={path}
                fill={fill}
                stroke={stroke}
                strokeWidth={1.5}
                style={{
                  filter: isActive ? "url(#nodeGlowRed)" : isPulse ? "url(#pulseAmber)" : undefined,
                  animation: isPulse ? "chainNodePulse 2.5s ease-in-out infinite" : undefined,
                }}
              />
              {/* Label below node */}
              <text
                x={node.cx}
                y={node.cy + node.r + 14}
                fill="rgba(255,255,255,0.75)"
                fontSize="10"
                fontFamily="inherit"
                fontWeight={isActive ? "700" : "500"}
                textAnchor="middle"
                style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                {node.label}
              </text>
              {/* Data badge (pill) */}
              <rect
                x={node.cx - 42}
                y={node.cy + node.r + 20}
                width={84}
                height={14}
                rx={7}
                fill="rgba(0,0,0,0.6)"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={0.5}
              />
              <text
                x={node.cx}
                y={node.cy + node.r + 29}
                fill="rgba(255,255,255,0.7)"
                fontSize="9"
                fontFamily="inherit"
                textAnchor="middle"
                style={{ textTransform: "uppercase", letterSpacing: "0.03em" }}
              >
                {node.badge}
              </text>
            </g>
          );
        })}
      </svg>

      {/* CSS for edge dash animation and pulse */}
      <style>{`
        @keyframes chainEdgeDash {
          to { stroke-dashoffset: -18; }
        }
        @keyframes chainNodePulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>

      <p className="absolute bottom-0 left-0 right-0 px-3 py-2 text-[9px] font-mono text-white/25 text-center">
        Select a profile and click Run Analysis to start.
      </p>
    </div>
  );
}
