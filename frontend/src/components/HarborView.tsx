import { useState, useRef, useEffect, useMemo } from "react";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";

/* ───────── Types ───────── */
export interface ShipData {
  id: string;
  label: string;
  riskScore: number; // 0–100
  tariffRate: number;
  altSuppliers: number;
  commodity: string;
  origin: string;
  x: number; // % from left
}

interface SynapseRoute {
  from: { x: number; y: number };
  to: { x: number; y: number };
  volume: number; // 0–1 (high = fast flow)
  tariffLoad: number; // 0–1 (high = clogged)
  label?: string;
}

interface HarborViewProps {
  ships?: ShipData[];
  routes?: SynapseRoute[];
  /** 0–100; above 60 triggers Storm State */
  overallRisk?: number;
  className?: string;
}

/* ───────── Default data ───────── */
const DEFAULT_SHIPS: ShipData[] = [
  { id: "lumber", label: "Hardwood Lumber", riskScore: 82, tariffRate: 25, altSuppliers: 3, commodity: "HS 4407", origin: "Michigan, US", x: 12 },
  { id: "steel", label: "Steel Hardware", riskScore: 71, tariffRate: 25, altSuppliers: 2, commodity: "HS 8302", origin: "Ohio, US", x: 35 },
  { id: "fabric", label: "Upholstery Fabric", riskScore: 45, tariffRate: 25, altSuppliers: 4, commodity: "HS 5907", origin: "N. Carolina, US", x: 55 },
  { id: "chem", label: "Finishing Chemicals", riskScore: 28, tariffRate: 10, altSuppliers: 6, commodity: "HS 3209", origin: "Pennsylvania, US", x: 42 },
];

const LIGHTHOUSE_POS = { x: 82, y: 28 }; // % position in scene

/* ───────── Utility ───────── */
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

/* ═══════════════════════════════════════════════
   CargoShip — buoyancy physics via Framer springs
   ═══════════════════════════════════════════════ */
function CargoShip({
  ship,
  isIlluminated,
  onHover,
  onLeave,
}: {
  ship: ShipData;
  isIlluminated: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const risk01 = clamp(ship.riskScore / 100, 0, 1);

  // Buoyancy: low risk → floats high (y offset -20), high risk → sinks (y offset +12)
  const waterline = lerp(-20, 12, risk01);
  // Spring stiffness: buoyant ships are bouncy, heavy ships are sluggish
  const stiffness = lerp(120, 30, risk01);
  const damping = lerp(8, 20, risk01);

  const springY = useSpring(waterline, { stiffness, damping, mass: 1 });

  // Bobbing amplitude: light ships bob more
  const bobAmplitude = lerp(6, 1.5, risk01);
  const bobDuration = lerp(2.5, 5, risk01);

  // Ship scale based on risk (heavier = larger visual)
  const scale = lerp(0.85, 1.15, risk01);

  // Hull color shifts: low risk = steel blue, high risk = dark rust
  const hullColor = risk01 > 0.6
    ? `rgba(${Math.round(lerp(60, 120, risk01))}, ${Math.round(lerp(50, 35, risk01))}, ${Math.round(lerp(70, 30, risk01))}, 0.95)`
    : `rgba(${Math.round(lerp(50, 70, risk01))}, ${Math.round(lerp(65, 58, risk01))}, ${Math.round(lerp(85, 78, risk01))}, 0.92)`;

  // Convert ship.x (%) to SVG viewBox units (viewBox width = 600)
  const svgX = ship.x * 6;
  const baseY = 380; // baseline Y in SVG viewBox for ships in water zone

  return (
    <motion.g
      style={{ x: svgX, y: useTransform(springY, (v) => baseY + v) }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="cursor-pointer"
    >
      <motion.g
        animate={{ y: [0, -bobAmplitude, 0, bobAmplitude * 0.3, 0] }}
        transition={{ duration: bobDuration, repeat: Infinity, ease: "easeInOut" }}
        style={{ scale }}
      >
        {/* Wake trail */}
        <motion.ellipse
          cx={0} cy={18}
          rx={lerp(28, 42, risk01)} ry={4}
          fill="rgba(100,180,255,0.06)"
          animate={{ rx: [lerp(28, 42, risk01), lerp(34, 48, risk01), lerp(28, 42, risk01)] }}
          transition={{ duration: bobDuration * 1.5, repeat: Infinity }}
        />

        {/* Hull */}
        <path
          d={`M-28,8 L-24,18 L24,18 L28,8 L22,-2 L-22,-2 Z`}
          fill={hullColor}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={0.5}
        />

        {/* Deck structure */}
        <rect x={-16} y={-10} width={32} height={8} rx={1}
          fill={`rgba(${risk01 > 0.5 ? '80,60,50' : '55,65,80'},0.9)`}
          stroke="rgba(255,255,255,0.06)" strokeWidth={0.4}
        />

        {/* Containers (more for high-risk/heavy ships) */}
        {risk01 > 0.3 && (
          <g>
            {Array.from({ length: Math.ceil(risk01 * 5) }).map((_, i) => (
              <rect key={i}
                x={-14 + i * 7} y={-16 - (i % 2) * 4}
                width={6} height={5} rx={0.5}
                fill={i % 3 === 0
                  ? `rgba(220,80,60,${0.4 + risk01 * 0.3})`
                  : `rgba(70,85,110,${0.5 + risk01 * 0.2})`}
                stroke="rgba(255,255,255,0.05)" strokeWidth={0.3}
              />
            ))}
          </g>
        )}

        {/* Risk indicator glow */}
        {risk01 > 0.5 && (
          <motion.circle
            cx={0} cy={-6} r={4}
            fill="none"
            stroke={risk01 > 0.7 ? "rgba(220,38,38,0.6)" : "rgba(217,119,6,0.5)"}
            strokeWidth={1.5}
            animate={{ r: [4, 7, 4], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Tariff badge */}
        <g transform="translate(0, -26)">
          <rect x={-16} y={-8} width={32} height={14} rx={3}
            fill={risk01 > 0.6
              ? "rgba(220,38,38,0.25)"
              : risk01 > 0.35
                ? "rgba(217,119,6,0.2)"
                : "rgba(22,163,74,0.15)"}
            stroke={risk01 > 0.6
              ? "rgba(220,38,38,0.5)"
              : risk01 > 0.35
                ? "rgba(217,119,6,0.4)"
                : "rgba(22,163,74,0.35)"}
            strokeWidth={0.8}
          />
          <text
            x={0} y={2}
            textAnchor="middle"
            fontSize={9}
            fontWeight={700}
            fontFamily="'JetBrains Mono', monospace"
            fill={risk01 > 0.6 ? "#fecaca" : risk01 > 0.35 ? "#fde68a" : "#bbf7d0"}
          >
            {ship.tariffRate}%
          </text>
        </g>

        {/* Ship label */}
        <text x={0} y={28} textAnchor="middle" fontSize={7}
          fontFamily="'JetBrains Mono', monospace"
          fill="rgba(160,200,240,0.5)" letterSpacing={0.5}
        >
          {ship.label.toUpperCase()}
        </text>
      </motion.g>

      {/* Illumination highlight when lighthouse beam hits */}
      <AnimatePresence>
        {isIlluminated && (
          <motion.ellipse
            cx={0} cy={4} rx={36} ry={20}
            fill="rgba(100,180,255,0.08)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </motion.g>
  );
}

/* ═══════════════════════════════════════
   Synapse — animated SVG data-flow paths
   ═══════════════════════════════════════ */
function Synapse({ route, index }: { route: SynapseRoute; index: number }) {
  const { from, to, volume, tariffLoad } = route;

  // Control point for curve
  const mx = (from.x + to.x) / 2;
  const my = Math.min(from.y, to.y) - 30 - volume * 20;
  const d = `M${from.x},${from.y} Q${mx},${my} ${to.x},${to.y}`;

  // High volume = fast, tight dashes; high tariff = slow, stuttered
  const dashArray = tariffLoad > 0.6
    ? "3 12 1 8"  // stuttered/clogged
    : `${4 + volume * 4} ${6 + (1 - volume) * 6}`;

  const animDuration = tariffLoad > 0.6
    ? lerp(4, 8, tariffLoad)  // slow for clogged
    : lerp(2.5, 0.8, volume); // fast for high volume

  const strokeColor = tariffLoad > 0.6
    ? `rgba(220,80,60,${0.2 + tariffLoad * 0.3})`
    : `rgba(100,180,255,${0.15 + volume * 0.25})`;

  const glowColor = tariffLoad > 0.6
    ? "rgba(220,80,60,0.15)"
    : "rgba(100,180,255,0.1)";

  return (
    <g>
      {/* Glow under-path */}
      <path d={d} fill="none" stroke={glowColor} strokeWidth={4} strokeLinecap="round" />
      {/* Main animated path */}
      <motion.path
        d={d}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray={dashArray}
        initial={{ strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: [0, -40] }}
        transition={{ duration: animDuration, repeat: Infinity, ease: "linear" }}
      />
      {/* Data packet dot traveling the path */}
      <circle r={2} fill={tariffLoad > 0.6 ? "rgba(220,80,60,0.7)" : "rgba(100,180,255,0.6)"}>
        <animateMotion dur={`${animDuration * 1.5}s`} repeatCount="indefinite" begin={`${index * 0.4}s`}>
          <mpath href={`#synapse-path-${index}`} />
        </animateMotion>
      </circle>
      <path id={`synapse-path-${index}`} d={d} fill="none" stroke="none" />
    </g>
  );
}


/* ═══════════════════════════════════════
   Glass-morphic Tooltip for illuminated ship
   ═══════════════════════════════════════ */
function ShipTooltip({ ship }: { ship: ShipData }) {
  const risk01 = ship.riskScore / 100;
  const riskLabel = risk01 > 0.6 ? "HIGH" : risk01 > 0.35 ? "MEDIUM" : "LOW";
  const riskColor = risk01 > 0.6 ? "#ef4444" : risk01 > 0.35 ? "#f59e0b" : "#22c55e";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.97 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="absolute z-50 pointer-events-none"
      style={{
        left: `${ship.x}%`,
        top: "28%",
        transform: "translate(-50%, -100%)",
      }}
    >
      <div style={{
        background: "rgba(10,14,24,0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 10,
        padding: "12px 16px",
        minWidth: 200,
        boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(100,180,255,0.08), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 8, paddingBottom: 6,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <span style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.9)",
          }}>
            {ship.label}
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, fontWeight: 600, letterSpacing: 1,
            color: riskColor, padding: "2px 6px",
            background: `${riskColor}15`, border: `1px solid ${riskColor}40`,
            borderRadius: 4,
          }}>
            {riskLabel}
          </span>
        </div>

        {/* Data rows */}
        {[
          { label: "Tariff Rate", value: `${ship.tariffRate}%`, color: "#ef4444" },
          { label: "HS Code", value: ship.commodity, color: "rgba(255,255,255,0.7)" },
          { label: "Origin", value: ship.origin, color: "rgba(160,200,240,0.8)" },
          { label: "Alt Suppliers", value: `${ship.altSuppliers} available`, color: "#22c55e" },
          { label: "Risk Score", value: `${ship.riskScore}/100`, color: riskColor },
        ].map((row) => (
          <div key={row.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
            padding: "3px 0",
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8.5, textTransform: "uppercase", letterSpacing: 0.8,
              color: "rgba(255,255,255,0.35)",
            }}>
              {row.label}
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, fontWeight: 600, color: row.color,
            }}>
              {row.value}
            </span>
          </div>
        ))}

        {/* Risk bar */}
        <div style={{
          marginTop: 8, height: 3, background: "rgba(255,255,255,0.06)",
          borderRadius: 2, overflow: "hidden",
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${ship.riskScore}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              height: "100%", borderRadius: 2,
              background: `linear-gradient(90deg, ${riskColor}80, ${riskColor})`,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   Main HarborView Component
   ═══════════════════════════════════════ */
export default function HarborView({
  ships: shipsProp,
  routes: routesProp,
  overallRisk = 50,
  className = "",
}: HarborViewProps) {
  const ships = shipsProp ?? DEFAULT_SHIPS;
  const containerRef = useRef<HTMLDivElement>(null);
  const [illuminatedShip, setIlluminated] = useState<string | null>(null);
  const [hoveredShip, setHoveredShip] = useState<string | null>(null);
  const [beamAngle, setBeamAngle] = useState(200);

  // Rotate beam + detect ship intersection
  useEffect(() => {
    let raf: number;
    let angle = 200;
    const speed = 0.3; // degrees per frame
    let prevIlluminated: string | null = null;
    const tick = () => {
      angle = (angle + speed) % 360;
      setBeamAngle(angle);

      // Detect which ship the beam points at
      let hit: string | null = null;
      for (const ship of ships) {
        const dx = ship.x - LIGHTHOUSE_POS.x;
        const dy = 65 - LIGHTHOUSE_POS.y;
        const shipAngle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
        const diff = Math.abs(((angle - shipAngle + 180) % 360) - 180);
        if (diff < 18) { hit = ship.id; break; }
      }
      if (hit !== prevIlluminated) {
        prevIlluminated = hit;
        setIlluminated(hit);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ships]);

  const activeTooltipShip = hoveredShip ?? illuminatedShip;
  const tooltipShip = ships.find((s) => s.id === activeTooltipShip);

  const isStorm = overallRisk > 60;

  // Generate synapse routes connecting ships to lighthouse
  const synapseRoutes: SynapseRoute[] = useMemo(() => {
    if (routesProp) return routesProp;
    return ships.map((ship) => ({
      from: { x: ship.x * 6, y: 380 },  // ship positions scaled to SVG viewBox
      to: { x: LIGHTHOUSE_POS.x * 6, y: LIGHTHOUSE_POS.y * 5.5 },
      volume: 1 - ship.riskScore / 100,
      tariffLoad: ship.riskScore / 100,
      label: ship.label,
    }));
  }, [ships, routesProp]);

  // Inter-ship routes (supply chain connections)
  const interShipRoutes: SynapseRoute[] = useMemo(() => {
    const routes: SynapseRoute[] = [];
    for (let i = 0; i < ships.length - 1; i++) {
      routes.push({
        from: { x: ships[i].x * 6, y: 370 },
        to: { x: ships[i + 1].x * 6, y: 370 },
        volume: 0.4 + Math.random() * 0.3,
        tariffLoad: (ships[i].riskScore + ships[i + 1].riskScore) / 200,
      });
    }
    return routes;
  }, [ships]);

  return (
    <div
      ref={containerRef}
      className={`harbor-view-root ${isStorm ? "harbor-storm" : ""} ${className}`}
      style={{
        "--harbor-risk": overallRisk / 100,
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 340,
        borderRadius: 10,
        overflow: "hidden",
        fontFamily: "'JetBrains Mono', monospace",
      } as React.CSSProperties}
    >
      {/* Background — transitions to storm */}
      <div className="harbor-view-bg" />

      {/* Noise texture overlay for storm */}
      {isStorm && <div className="harbor-storm-noise" />}

      {/* Water surface */}
      <div className="harbor-view-water" />

      {/* Wave lines */}
      <svg className="harbor-wave-lines" viewBox="0 0 600 100" preserveAspectRatio="none">
        {[0, 1, 2].map((i) => (
          <motion.path
            key={i}
            d={`M0,${30 + i * 25} Q150,${20 + i * 25} 300,${35 + i * 25} T600,${28 + i * 25}`}
            fill="none"
            stroke={isStorm ? `rgba(100,140,180,${0.06 + i * 0.02})` : `rgba(100,180,255,${0.05 + i * 0.015})`}
            strokeWidth={1}
            animate={{
              d: [
                `M0,${30 + i * 25} Q150,${20 + i * 25} 300,${35 + i * 25} T600,${28 + i * 25}`,
                `M0,${35 + i * 25} Q150,${28 + i * 25} 300,${22 + i * 25} T600,${32 + i * 25}`,
                `M0,${30 + i * 25} Q150,${20 + i * 25} 300,${35 + i * 25} T600,${28 + i * 25}`,
              ],
            }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </svg>

      {/* Particles */}
      <div className="harbor-view-particles" aria-hidden>
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="harbor-view-particle"
            style={{
              left: `${5 + (i * 7.1) % 88}%`,
              top: `${50 + (i * 5.3) % 42}%`,
              animationDelay: `${i * 0.35}s`,
              animationDuration: `${5 + (i % 4) * 1.5}s`,
              opacity: 0.15 + (i % 3) * 0.08,
              width: 3 + (i % 3),
              height: 3 + (i % 3),
            }}
          />
        ))}
      </div>

      {/* SVG Layer — Synapses + Ships + Lighthouse */}
      <svg
        className="harbor-view-svg"
        viewBox="0 0 600 550"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Lighthouse tower gradient */}
          <linearGradient id="lighthouseTowerGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(48,56,76,0.95)" />
            <stop offset="50%" stopColor="rgba(72,84,110,0.9)" />
            <stop offset="100%" stopColor="rgba(48,56,76,0.95)" />
          </linearGradient>

          {/* Beacon glow filter */}
          <filter id="beaconGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
          </filter>

          {/* Beam cone gradient */}
          <linearGradient id="beamGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(100,200,255,0.7)" />
            <stop offset="40%" stopColor="rgba(100,200,255,0.25)" />
            <stop offset="75%" stopColor="rgba(100,200,255,0.06)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Synapse neural connections */}
        <g className="synapses">
          {synapseRoutes.map((route, i) => (
            <Synapse key={`main-${i}`} route={route} index={i} />
          ))}
          {interShipRoutes.map((route, i) => (
            <Synapse key={`inter-${i}`} route={route} index={i + synapseRoutes.length} />
          ))}
        </g>

        {/* Headland / rocky outcrop */}
        <path
          d="M420,350 L480,260 L540,220 L600,200 L600,550 L380,550 L400,380 Z"
          fill="rgba(30,35,48,0.9)"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={0.5}
        />
        <path
          d="M450,370 L500,280 L560,240 L600,225 L600,550 L420,550 Z"
          fill="rgba(38,44,60,0.7)"
        />

        {/* Lighthouse */}
        <g transform={`translate(${LIGHTHOUSE_POS.x * 6}, ${LIGHTHOUSE_POS.y * 5.5})`}>
          {/* Base */}
          <path d="M-10,52 L-14,58 L14,58 L10,52 Z"
            fill="rgba(60,68,88,0.95)" stroke="rgba(255,255,255,0.1)" strokeWidth={0.5} />
          {/* Tower */}
          <path d="M-6,0 L-10,52 L10,52 L6,0 Z"
            fill="url(#lighthouseTowerGrad)" stroke="rgba(255,255,255,0.1)" strokeWidth={0.5} />
          {/* Red stripes */}
          {[14, 28, 42].map((y) => (
            <rect key={y} x={lerp(-6, -10, y / 52)} y={y}
              width={lerp(12, 20, y / 52)} height={3}
              fill="rgba(180,60,60,0.35)" rx={0.5} />
          ))}
          {/* Lantern room */}
          <rect x={-8} y={-10} width={16} height={10} rx={2}
            fill="rgba(35,45,60,0.95)" stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
          {/* Beacon */}
          <motion.circle
            cx={0} cy={-5} r={4}
            fill="rgba(100,200,255,0.9)"
            animate={{ r: [3.5, 5.5, 3.5], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            filter="url(#beaconGlow)"
          />

          {/* Rotating beam (conical) — driven by rAF beamAngle state */}
          <g
            style={{ transformOrigin: "0px -5px" }}
            transform={`rotate(${beamAngle}, 0, -5)`}
          >
            <path
              d="M0,-5 L220,-25 L220,15 Z"
              fill="url(#beamGrad)"
              opacity={0.6}
              style={{ filter: "blur(2px)" }}
            />
            {/* Thin bright core */}
            <line x1={0} y1={-5} x2={180} y2={-5}
              stroke="rgba(100,200,255,0.5)" strokeWidth={1.5}
              style={{ filter: "blur(1px)" }}
            />
          </g>

          {/* Label */}
          <text x={0} y={68} textAnchor="middle" fontSize={6}
            fontFamily="'JetBrains Mono', monospace" fontWeight={600}
            letterSpacing={1.2} fill="rgba(160,210,255,0.5)">
            AI INTELLIGENCE ENGINE
          </text>
        </g>

        {/* Ships — positioned in SVG space */}
        {ships.map((ship) => (
          <CargoShip
            key={ship.id}
            ship={ship}
            isIlluminated={illuminatedShip === ship.id}
            onHover={() => setHoveredShip(ship.id)}
            onLeave={() => setHoveredShip(null)}
          />
        ))}
      </svg>

      {/* Glass tooltip (HTML overlay for better text rendering) */}
      <AnimatePresence>
        {tooltipShip && (
          <ShipTooltip key={tooltipShip.id} ship={tooltipShip} />
        )}
      </AnimatePresence>

      {/* Title */}
      <div className="harbor-view-title">
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14, color: "rgba(255,255,255,0.7)", letterSpacing: 1 }}>
          Harbor & Horizon
        </span>
        <span style={{ fontSize: 8, color: "rgba(160,210,255,0.4)", marginLeft: 8, letterSpacing: 1.5, textTransform: "uppercase" }}>
          Supply Chain Intelligence
        </span>
      </div>

      {/* Risk indicator */}
      <div className="harbor-view-risk-badge" style={{
        borderColor: isStorm ? "rgba(220,38,38,0.4)" : "rgba(100,180,255,0.2)",
        background: isStorm ? "rgba(220,38,38,0.1)" : "rgba(10,14,24,0.6)",
      }}>
        <span style={{ fontSize: 7, textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.35)" }}>
          Risk Level
        </span>
        <span style={{
          fontSize: 16, fontWeight: 700,
          color: isStorm ? "#fecaca" : overallRisk > 40 ? "#fde68a" : "#bbf7d0",
          textShadow: isStorm ? "0 0 12px rgba(220,38,38,0.6)" : "none",
        }}>
          {overallRisk}
        </span>
      </div>
    </div>
  );
}
