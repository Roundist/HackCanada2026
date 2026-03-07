import { motion } from "framer-motion";

const INTELLIGENCE_PREVIEW_DATA = [
  { label: "Current Tariff Rate", value: "25%", sub: "US imports to Canada", color: "#dc2626", bar: 100 },
  { label: "Affected Sectors", value: "12", sub: "Manufacturing, Food, Tech", color: "#d97706", bar: 65 },
  { label: "Avg Margin Erosion", value: "8.4%", sub: "Cross-sector average", color: "#dc2626", bar: 34 },
  { label: "Alt Suppliers", value: "--", sub: "Awaiting analysis", color: "#16a34a", bar: 0 },
  { label: "Confidence Score", value: "--", sub: "Awaiting analysis", color: "#2563eb", bar: 0 },
];

export default function HarborBay() {
  return (
    <div className="harbor-bay">
      <div className="harbor-bay-title">Harbor & Horizon</div>
      <div className="harbor-bay-scene">
        {/* Water */}
        <div className="harbor-water" />
        {/* Data particles */}
        <div className="harbor-particles" aria-hidden>
          {[...Array(18)].map((_, i) => (
            <div
              key={i}
              className="harbor-particle"
              style={{
                left: `${4 + (i * 5.2) % 92}%`,
                top: `${15 + (i * 4) % 75}%`,
                animationDelay: `${i * 0.28}s`,
                opacity: 0.2 + (i % 3) * 0.12,
              }}
            />
          ))}
        </div>

        {/* Rocky headland */}
        <div className="harbor-headland">
          <div className="harbor-headland-rock" />
          <div className="harbor-headland-rock accent" />
        </div>

        {/* Lighthouse — AI INTELLIGENCE ENGINE */}
        <div className="harbor-lighthouse">
          <div className="harbor-lighthouse-base" />
          <div className="harbor-lighthouse-tower" />
          <div className="harbor-lighthouse-beacon">
            <div className="harbor-lighthouse-glow" />
            <div className="harbor-lighthouse-beam" />
          </div>
          <div className="harbor-lighthouse-label">AI INTELLIGENCE ENGINE</div>
        </div>

        {/* Ships */}
        <div className="harbor-ship harbor-ship-small ship-drift-1">
          <div className="ship-hull" />
          <div className="ship-deck" />
        </div>
        <div className="harbor-ship harbor-ship-bulk ship-drift-2">
          <div className="ship-hull bulk" />
          <div className="ship-deck bulk" />
        </div>
        <div className="harbor-ship harbor-ship-weighted ship-drift-slow">
          <div className="ship-hull weighted" />
          <div className="ship-deck weighted">
            <div className="ship-containers" />
          </div>
          <motion.div
            className="harbor-tariff-badge"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          >
            25%
          </motion.div>
        </div>

        {/* Glass-morphic Intelligence Preview */}
        <motion.div
          className="harbor-intel-window"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="harbor-intel-window-inner">
            <div className="harbor-intel-window-header">INTELLIGENCE PREVIEW</div>
            <div className="harbor-intel-window-body">
              {INTELLIGENCE_PREVIEW_DATA.map((item) => (
                <div key={item.label} className="harbor-intel-row">
                  <span className="harbor-intel-label">{item.label}</span>
                  <span
                    className="harbor-intel-value"
                    style={{
                      color: item.value === "--" ? "rgba(255,255,255,0.4)" : item.color,
                    }}
                  >
                    {item.value}
                  </span>
                  {item.bar > 0 && (
                    <div className="harbor-intel-bar-wrap">
                      <div
                        className="harbor-intel-bar"
                        style={{
                          width: `${item.bar}%`,
                          background: item.color,
                        }}
                      />
                    </div>
                  )}
                  <span className="harbor-intel-sub">{item.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
