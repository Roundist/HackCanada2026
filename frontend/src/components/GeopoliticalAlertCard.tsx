/**
 * Geopolitical Alert Card (PRD): breaking news from Geopolitical Analyst.
 * Shows urgency badge, headline, source, relevance, risk adjustment, actionable alert.
 */
import { motion } from "framer-motion";
import type { GeopoliticalAlert } from "../types";

interface GeopoliticalAlertCardProps {
  alert: GeopoliticalAlert;
  index: number;
}

const URGENCY_STYLES: Record<string, { bg: string; border: string; label: string }> = {
  high: { bg: "bg-red-500/15", border: "border-red-500/40", label: "HIGH" },
  medium: { bg: "bg-amber-500/12", border: "border-amber-500/35", label: "MEDIUM" },
  low: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", label: "LOW" },
};

export default function GeopoliticalAlertCard({ alert, index }: GeopoliticalAlertCardProps) {
  const style = URGENCY_STYLES[alert.urgency] ?? URGENCY_STYLES.medium;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`border rounded-lg p-3 ${style.bg} ${style.border}`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${style.border} ${style.bg}`}>
          {style.label}
        </span>
        <span className="text-[9px] font-mono text-white/40">{alert.source}</span>
      </div>
      <div className="text-[11px] font-semibold text-white/85 mb-1">{alert.headline}</div>
      <p className="text-[10px] text-white/50 leading-relaxed mb-2">{alert.relevance}</p>
      {alert.risk_adjustment && (
        <div className="text-[9px] font-mono text-amber-400/80 mb-2">
          Risk: {alert.risk_adjustment.from} → {alert.risk_adjustment.to}
        </div>
      )}
      <div className="border border-amber-500/25 rounded px-2 py-1.5 bg-amber-500/5">
        <div className="text-[9px] font-mono uppercase tracking-wider text-amber-400/70 mb-0.5">Action</div>
        <div className="text-[10px] text-white/70">{alert.actionable_alert}</div>
      </div>
    </motion.div>
  );
}
