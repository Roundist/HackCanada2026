import { motion } from "framer-motion";

/**
 * Premium geopolitical tariff intelligence map — North America focus.
 * Live trade operations style: routes, agent nodes, tariff indicators, particle flow.
 */
const W = 360;
const H = 200;

// Stylized country paths (simplified outlines, dark-mode)
const CANADA_PATH = "M 120 28 L 200 22 L 260 38 L 268 72 L 248 98 L 200 108 L 132 100 L 92 72 Z";
const USA_PATH = "M 100 108 L 208 102 L 258 118 L 252 158 L 198 172 L 112 162 L 78 132 Z";
const MEXICO_PATH = "M 118 168 L 195 164 L 235 178 L 228 198 L 182 206 L 122 198 Z";
const CHINA_PATH = "M 288 72 L 332 68 L 348 92 L 342 118 L 308 122 L 282 108 Z";

// Trade route paths (into Canada): from source to Canadian border
const ROUTE_US = "M 180 95 L 165 72 L 155 52 L 145 42";
const ROUTE_MEXICO = "M 165 155 L 172 132 L 178 95";
const ROUTE_CHINA = "M 305 95 L 268 72 L 228 55 L 185 45";

// Central intelligence point (Ottawa area)
const CENTER_X = 165;
const CENTER_Y = 58;

// Agent node positions (region-based)
const NODES = [
  { id: "supply", label: "Supply Chain", x: 155, y: 72, region: "Ontario" },
  { id: "tariff", label: "Tariff", x: 128, y: 88, region: "US Border" },
  { id: "scout", label: "Supplier Scout", x: 235, y: 62, region: "West Coast" },
  { id: "geo", label: "Geopolitical", x: 178, y: 48, region: "Ottawa" },
] as const;

// Floating intel labels
const INTEL_LABELS = [
  { text: "Softwood Lumber: 25% Surtax Active", x: 95, y: 82 },
  { text: "HS 8542 Semiconductors: 25% Duty", x: 248, y: 85 },
  { text: "CPTPP/CETA Alt Routes Available", x: 165, y: 128 },
];

export default function WorldMapIdle() {
  return (
    <div className="relative w-full h-full min-h-[160px] flex flex-col overflow-hidden rounded" style={{ background: "rgba(6,8,12,0.97)" }}>
      {/* Grid with focal vignette — lighter near center */}
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "14px 14px" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 70% at 50% 45%, rgba(255,255,255,0.06) 0%, transparent 55%)" }} />

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full flex-1 min-h-[140px]" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="canadaGlow">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Stronger route glow — pulses with light */}
          <filter id="routeGlowRed">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.2 0" result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="routeGlowAmber">
            <feGaussianBlur stdDeviation="1.8" result="b" />
            <feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0.9 0.6 0 0 0  0 0.3 0 0 0  0 0 0 1.1 0" result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 Z" fill="rgba(239,68,68,0.9)" />
          </marker>
          <marker id="arrowAmber" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 Z" fill="rgba(245,158,11,0.9)" />
          </marker>
          <filter id="nodeGlow">
            <feGaussianBlur stdDeviation="1.2" result="b" />
            <feColorMatrix in="b" type="matrix" values="0.4 0.4 0.6 0 0  0.4 0.4 0.6 0 0  0.6 0.6 1 0 0  0 0 0 0.8 0" result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ----- TRADE ROUTES (thickness = volume, color = tariff severity) ----- */}
        {/* US → Canada: high volume, high tariff = red, thick + glow + arrow */}
        <motion.path
          d={ROUTE_US}
          fill="none"
          stroke="rgba(239,68,68,0.85)"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray="6 4"
          markerEnd="url(#arrowRed)"
          initial={{ pathLength: 0, opacity: 0.8 }}
          animate={{ pathLength: 1, opacity: [0.7, 1, 0.7] }}
          transition={{ pathLength: { duration: 1.2 }, opacity: { duration: 2, repeat: Infinity } }}
          style={{ filter: "url(#routeGlowRed)" }}
        />
        {/* Mexico → Canada: moderate = amber + glow + arrow */}
        <motion.path
          d={ROUTE_MEXICO}
          fill="none"
          stroke="rgba(245,158,11,0.75)"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray="5 5"
          markerEnd="url(#arrowAmber)"
          initial={{ pathLength: 0, opacity: 0.7 }}
          animate={{ pathLength: 1, opacity: [0.6, 0.95, 0.6] }}
          transition={{ pathLength: { duration: 1.5 }, opacity: { duration: 2.2, repeat: Infinity, delay: 0.2 } }}
          style={{ filter: "url(#routeGlowAmber)" }}
        />
        {/* China → Canada: stable = blue/neutral */}
        <motion.path
          d={ROUTE_CHINA}
          fill="none"
          stroke="rgba(100,116,139,0.5)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray="4 6"
          initial={{ pathLength: 0, opacity: 0.6 }}
          animate={{ pathLength: 1, opacity: [0.5, 0.75, 0.5] }}
          transition={{ pathLength: { duration: 1.8 }, opacity: { duration: 2.5, repeat: Infinity, delay: 0.4 } }}
        />

        {/* Moving particles along routes */}
        <ParticleOnPath d={ROUTE_US} color="rgba(239,68,68,0.9)" />
        <ParticleOnPath d={ROUTE_MEXICO} color="rgba(245,158,11,0.8)" delay={0.4} />
        <ParticleOnPath d={ROUTE_CHINA} color="rgba(148,163,184,0.7)" delay={0.8} />

        {/* ----- COUNTRIES (brighter strokes 40–60%, subtle fill) ----- */}
        <path d={CHINA_PATH} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.45)" strokeWidth={1} />
        <path d={USA_PATH} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
        <path d={MEXICO_PATH} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.45)" strokeWidth={1} />
        <path
          d={CANADA_PATH}
          fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1.2}
          style={{ filter: "url(#canadaGlow)" }}
        />

        {/* Canadian hotspots: Ontario, BC, Quebec — larger, brighter */}
        <circle cx={158} cy={72} r={4} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
        <circle cx={238} cy={58} r={3.5} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.35)" strokeWidth={0.9} />
        <circle cx={132} cy={62} r={3.5} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.35)" strokeWidth={0.9} />

        {/* ----- AGENT NODES + lines to center (larger dots, active glow/pulse) ----- */}
        {NODES.map((node, i) => {
          const isActive = node.id === "tariff" || node.id === "scout";
          return (
            <g key={node.id}>
              <line
                x1={node.x}
                y1={node.y}
                x2={CENTER_X}
                y2={CENTER_Y}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={0.6}
                strokeDasharray="2 2"
              />
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={isActive ? 5.5 : 5}
                fill={isActive ? "rgba(251,191,36,0.35)" : "rgba(15,15,22,0.95)"}
                stroke={isActive ? "rgba(251,191,36,0.7)" : "rgba(255,255,255,0.35)"}
                strokeWidth={isActive ? 1.2 : 0.9}
                style={isActive ? { filter: "url(#nodeGlow)" } : undefined}
                animate={isActive ? { opacity: [0.8, 1, 0.8] } : { opacity: [0.9, 1, 0.9] }}
                transition={{
                  duration: isActive ? 1.8 : 2.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
              <text
                x={node.x}
                y={node.y - 10}
                fill={isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.7)"}
                fontSize={isActive ? 7 : 6}
                fontWeight={isActive ? "700" : "500"}
                fontFamily="monospace"
                textAnchor="middle"
              >
                {node.label}
              </text>
            </g>
          );
        })}
        <circle cx={CENTER_X} cy={CENTER_Y} r={4} fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.45)" strokeWidth={0.8} />

        {/* ----- FLOATING INTEL LABELS (dark pill/badge) ----- */}
        {INTEL_LABELS.map((l, i) => (
          <g key={i}>
            <motion.rect
              x={l.x - 52}
              y={l.y - 5}
              width={104}
              height={10}
              rx={5}
              fill="rgba(0,0,0,0.55)"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={0.5}
              animate={{ opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
            />
            <motion.text
              x={l.x}
              y={l.y + 1}
              fill="rgba(255,255,255,0.75)"
              fontSize="5.5"
              fontFamily="monospace"
              textAnchor="middle"
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
            >
              {l.text}
            </motion.text>
          </g>
        ))}
      </svg>

      <p className="relative z-10 px-3 pb-3 text-[10px] font-mono text-white/25 text-center">
        <span className="text-white/40">&gt;</span> System ready. Select a profile and click Run Analysis.
      </p>
    </div>
  );
}

/** Particle moving along a path (trade flow into Canada). */
function ParticleOnPath({ d, color, delay = 0 }: { d: string; color: string; delay?: number }) {
  return (
    <motion.circle r={1.5} fill={color}>
      <animateMotion
        dur="2.5"
        repeatCount="indefinite"
        begin={`${delay}s`}
        path={d}
      />
    </motion.circle>
  );
}
