import { useMemo } from "react";
import { motion } from "framer-motion";
import type { BusinessProfile } from "../data/businessProfiles";
import {
  getAltSuppliersForProfile,
  computeStressTestMetrics,
} from "../data/businessProfiles";

interface IntelligencePreviewProps {
  profile: BusinessProfile | null;
  tariffRatePct: number;
  onTariffRateChange: (rate: number) => void;
  analysisComplete: boolean;
  /** When true, show that tariff data is from CBSA (scraped official source). */
  tariffRatesFromCbsa?: boolean;
  /** Light theme: white/gray background, dark text. */
  variant?: "dark" | "light";
}

export default function IntelligencePreview({
  profile,
  tariffRatePct,
  onTariffRateChange,
  analysisComplete,
  tariffRatesFromCbsa = false,
  variant = "dark",
}: IntelligencePreviewProps) {
  const altSuppliers = useMemo(
    () => (profile ? getAltSuppliersForProfile(profile.id) : []),
    [profile]
  );

  const { marginErosionPct, confidenceScore } = useMemo(
    () =>
      profile
        ? computeStressTestMetrics(tariffRatePct, profile.baseMarginErosionPct)
        : { marginErosionPct: 0, confidenceScore: 100 },
    [profile, tariffRatePct]
  );

  const affectedSectors = profile?.routes?.length ?? 0;
  const altCount = altSuppliers.length;

  const isLight = variant === "light";
  const cardClass = isLight ? "border border-gray-200 bg-gray-50/80 p-3 rounded-lg" : "border border-white/[0.06] p-3 rounded";
  const cardStyle = isLight ? undefined : { background: "rgba(15,17,23,0.6)" };
  const labelClass = isLight ? "text-[9px] font-mono uppercase tracking-wider text-gray-500" : "text-[9px] font-mono uppercase tracking-wider text-white/25";
  const subClass = isLight ? "text-[9px] font-mono text-gray-400 mt-0.5" : "text-[9px] font-mono text-white/15 mt-0.5";

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className={`px-3 py-2.5 border-b shrink-0 ${isLight ? "border-gray-200" : "border-white/[0.06]"}`}>
        <div className={`text-[10px] font-medium uppercase tracking-wider ${isLight ? "text-gray-500" : "text-white/25"}`}>
          Impact snapshot
        </div>
        <div className={`text-[9px] mt-0.5 ${isLight ? "text-gray-400" : "text-white/20"}`}>
          {profile ? "Based on selected profile" : "Select a profile in the center"}
        </div>
      </div>
      <div className="flex-1 min-h-0 p-3 space-y-3 overflow-y-auto overflow-x-hidden">
        <div className={cardClass} style={cardStyle}>
          <div className={labelClass + " mb-1"}>Stress-test tariff rate</div>
          <div className="flex items-center gap-2 mt-1.5">
            <input
              type="range"
              min={0}
              max={50}
              step={1}
              value={tariffRatePct}
              onChange={(e) => onTariffRateChange(Number(e.target.value))}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-red-600"
              style={{
                background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${(tariffRatePct / 50) * 100}%, ${isLight ? "#e5e7eb" : "rgba(255,255,255,0.08)"} ${(tariffRatePct / 50) * 100}%)`,
              }}
            />
            <span className="text-sm font-semibold tabular-nums min-w-[2.5rem] text-right text-red-600">
              {tariffRatePct}%
            </span>
          </div>
          <div className={subClass}>
            {tariffRatesFromCbsa ? "CBSA 2025 reference" : "Slider for scenario"}
          </div>
        </div>

        <div className={cardClass} style={cardStyle}>
          <div className={labelClass}>US-sourced input categories</div>
          <div className={`text-base font-semibold mt-0.5 ${isLight ? "text-gray-900" : ""}`} style={{ color: isLight ? undefined : "#ffb800" }}>
            {profile ? affectedSectors : "—"}
          </div>
          <div className={subClass}>
            {profile ? "From this profile; run analysis for full breakdown" : "Select profile"}
          </div>
        </div>

        <div className={cardClass} style={cardStyle}>
          <div className={labelClass}>Projected margin erosion</div>
          <div className={`text-base font-semibold mt-0.5 ${isLight ? "text-red-600" : ""}`} style={{ color: isLight ? undefined : "#ff4d4d" }}>
            {profile ? `${marginErosionPct}%` : "—"}
          </div>
          <div className={subClass}>
            At current tariff; run analysis for actions to reduce it
          </div>
        </div>

        <div className={cardClass} style={cardStyle}>
          <div className={labelClass}>Alternative suppliers in DB</div>
          <div className={`text-base font-semibold mt-0.5 ${isLight ? "text-gray-900" : ""}`} style={{ color: isLight ? undefined : "#16a34a" }}>
            {profile ? `${altCount} options` : "—"}
          </div>
          {profile && altSuppliers.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {altSuppliers.slice(0, 3).map((s) => (
                <motion.li
                  key={s.name}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-[10px] border-l-2 pl-2 py-1 rounded-r ${isLight ? "border-emerald-300 text-gray-700" : "border-emerald-500/30 text-white/70"}`}
                  style={!isLight ? { borderColor: "rgba(22,163,74,0.4)" } : undefined}
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="text-gray-500"> · Save ${(s.deltaAmountSaved / 1000).toFixed(0)}K</span>
                </motion.li>
              ))}
              {altSuppliers.length > 3 && (
                <li className="text-[9px] text-gray-400">+{altSuppliers.length - 3} more in report</li>
              )}
            </ul>
          )}
        </div>

        <div className={cardClass} style={cardStyle}>
          <div className={labelClass}>Data coverage (preview)</div>
          <p className={`text-[11px] leading-snug mt-1 ${isLight ? "text-gray-600" : "text-white/50"}`}>
            This is not a grade. It reflects how much of this profile we can match to CBSA tariff codes. Higher = more inputs mapped; run analysis to see the full evidence and exact HS codes.
          </p>
          <div className={`text-base font-semibold mt-2 ${isLight ? "text-gray-900" : ""}`} style={{ color: isLight ? undefined : "#3b82f6" }}>
            {profile ? `${confidenceScore}%` : "—"} coverage
          </div>
        </div>
      </div>
    </div>
  );
}
