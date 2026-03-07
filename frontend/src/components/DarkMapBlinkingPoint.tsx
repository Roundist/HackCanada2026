/**
 * Dark map section with a single blinking point — minimal, terminal-style.
 */
import { motion } from "framer-motion";

const W = 320;
const H = 360;

// Minimal landmass hint (North America silhouette, very faint)
const LAND_PATH =
  "M 80 80 L 200 60 L 260 100 L 250 180 L 200 200 L 120 180 L 60 140 Z M 100 160 L 180 150 L 220 200 L 180 240 L 100 220 Z";

export default function DarkMapBlinkingPoint() {
  return (
    <div
      className="relative w-full rounded overflow-hidden flex flex-col items-center justify-center"
      style={{
        background: "#0a0a0a",
        minHeight: 320,
      }}
    >
      {/* Subtle dot grid — map feel */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />
      {/* Very faint land outline */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 w-full h-full opacity-[0.06]"
        aria-hidden
      >
        <path
          d={LAND_PATH}
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={0.8}
        />
      </svg>

      {/* Blinking point — center */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="w-3 h-3 rounded-full"
          style={{
            background: "#ff4444",
            boxShadow: "0 0 14px rgba(255,68,68,0.55), 0 0 28px rgba(255,68,68,0.2)",
          }}
          animate={{
            opacity: [0.4, 1, 0.4],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <span
          className="mt-2 text-[9px] font-mono uppercase tracking-widest text-white/30"
        >
          Intelligence active
        </span>
      </motion.div>

      <p className="absolute bottom-0 left-0 right-0 px-3 py-2 text-[9px] font-mono text-white/20 text-center">
        Select a profile and click Run Analysis to start.
      </p>
    </div>
  );
}
