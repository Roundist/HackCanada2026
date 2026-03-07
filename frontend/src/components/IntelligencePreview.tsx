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
      <div className={`px-4 py-3 border-b shrink-0 ${isLight ? "border-gray-200" : "border-white/[0.06]"}`}>
        <div className={`text-[10px] font-mono uppercase tracking-widest ${isLight ? "text-gray-600" : "text-white/25"}`}>
          Intelligence Preview
        </div>
      </div>
      <div className="flex-1 min-h-0 p-4 space-y-4 overflow-y-auto overflow-x-hidden">
        <div className={cardClass} style={cardStyle}>
          <div className={labelClass + " mb-1"}>Current Tariff Rate</div>
          <div className="flex items-center gap-3 mt-2">
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
            <span className="text-lg font-bold tabular-nums min-w-[3rem] text-right text-red-600">
              {tariffRatePct}%
            </span>
          </div>
          <div className={subClass}>
            US imports to Canada {tariffRatesFromCbsa ? "• CBSA 2025 rates" : "• Stress test"}
            {tariffRatesFromCbsa && isLight && (
              <span className="block mt-0.5 text-gray-400" title="Canada Border Services Agency Customs Tariff">
                Rates: CBSA Customs Tariff 2025
              </span>
            )}
          </div>
        </div>

        <div className={cardClass} style={cardStyle}>
          <div className={labelClass}>Affected Sectors</div>
          <div className={`text-lg font-semibold mt-1 ${isLight ? "text-gray-900" : ""}`} style={{ color: isLight ? undefined : "#ffb800" }}>
            {profile ? affectedSectors : "--"}
          </div>
          <div className={subClass}>
            {profile ? `${profile.industry} • US-sourced inputs` : "Select profile"}
          </div>
        </div>

        <div className={cardClass} style={cardStyle}>
          <div className={labelClass}>Avg Margin Erosion</div>
          <div className={`text-lg font-semibold mt-1 ${isLight ? "text-red-600" : ""}`} style={{ color: isLight ? undefined : "#ff4d4d" }}>
            {profile ? `${marginErosionPct}%` : "--"}
          </div>
          <div className={subClass}>Cross-sector average (projected)</div>
        </div>

        <div className={cardClass} style={cardStyle}>
          <div className={labelClass}>Alt Suppliers</div>
          <div className={`text-lg font-semibold mt-1 ${isLight ? "text-gray-900" : ""}`} style={{ color: isLight ? undefined : "#16a34a" }}>
            {profile ? `${altCount} available` : "--"}
          </div>
          {profile && altSuppliers.length > 0 && (
            <ul className="mt-3 space-y-2">
              {altSuppliers.map((s) => (
                <motion.li
                  key={s.name}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-[10px] border-l-2 pl-3 pr-2 py-2 rounded-r border-emerald-500/30 transition-colors ${isLight ? "hover:bg-gray-100/80" : "hover:bg-white/[0.04]"}`}
                  style={{ borderColor: "rgba(22,163,74,0.4)" }}
                >
                  <span className={`font-medium ${isLight ? "text-gray-800" : "text-white/70"}`}>{s.name}</span>
                  <span className={isLight ? "text-gray-500" : "text-white/40"}> {s.country}</span>
                  <div className="text-[9px] font-mono text-emerald-600 mt-1">
                    +{s.deltaMarginSavedPct}% margin • Save ${(s.deltaAmountSaved / 1000).toFixed(0)}K
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>

        <div className={cardClass} style={cardStyle} title="Model confidence in stress-test projections.">
          <div className={`${labelClass} flex items-center gap-1.5 min-h-[14px]`}>
            <span>Confidence Score</span>
            <span className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border text-[10px] cursor-help shrink-0 ${isLight ? "border-gray-300 text-gray-400" : "border-white/20 text-white/50"}`} aria-label="Explain confidence">ⓘ</span>
          </div>
          <div className={`text-lg font-semibold mt-1 ${isLight ? "text-gray-900" : ""}`} style={{ color: isLight ? undefined : "#3b82f6" }}>
            {profile ? `${confidenceScore}%` : "--"}
          </div>
          <div className={subClass}>Uncertainty rises with tariff stress</div>
        </div>
      </div>
    </div>
  );
}
