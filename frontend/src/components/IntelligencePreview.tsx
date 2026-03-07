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
}

export default function IntelligencePreview({
  profile,
  tariffRatePct,
  onTariffRateChange,
  analysisComplete,
  tariffRatesFromCbsa = false,
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

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="text-[10px] font-mono uppercase tracking-widest text-white/25">
          Intelligence Preview
        </div>
      </div>
      <div className="flex-1 min-h-0 p-4 space-y-4 overflow-y-auto overflow-x-hidden">
        {/* Current Tariff Rate — with stress test slider */}
        <div className="border border-white/[0.06] p-3 rounded" style={{ background: "rgba(15,17,23,0.6)" }}>
          <div className="text-[9px] font-mono uppercase tracking-wider text-white/25 mb-1">
            Current Tariff Rate
          </div>
          <div className="flex items-center gap-3 mt-2">
            <input
              type="range"
              min={0}
              max={50}
              step={1}
              value={tariffRatePct}
              onChange={(e) => onTariffRateChange(Number(e.target.value))}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-red"
              style={{
                background: `linear-gradient(to right, #ff4d4d 0%, #ff4d4d ${(tariffRatePct / 50) * 100}%, rgba(255,255,255,0.08) ${(tariffRatePct / 50) * 100}%)`,
              }}
            />
            <span
              className="text-lg font-bold tabular-nums min-w-[3rem] text-right"
              style={{ color: "#ff4d4d" }}
            >
              {tariffRatePct}%
            </span>
          </div>
          <div className="text-[9px] font-mono text-white/15 mt-1.5">
            US imports to Canada · Stress test
            {tariffRatesFromCbsa && (
              <span className="block mt-0.5 text-white/20" title="Canada Border Services Agency Customs Tariff">
                Rates: CBSA Customs Tariff 2025
              </span>
            )}
          </div>
        </div>

        {/* Affected Sectors */}
        <div className="border border-white/[0.06] p-3 rounded" style={{ background: "rgba(15,17,23,0.6)" }}>
          <div className="text-[9px] font-mono uppercase tracking-wider text-white/25">Affected Sectors</div>
          <div className="text-lg font-semibold mt-1" style={{ color: "#ffb800" }}>
            {profile ? affectedSectors : "--"}
          </div>
          <div className="text-[9px] font-mono text-white/15 mt-0.5">
            {profile ? `${profile.industry} · US-sourced inputs` : "Select profile"}
          </div>
        </div>

        {/* Avg Margin Erosion — reactive to slider */}
        <div className="border border-white/[0.06] p-3 rounded" style={{ background: "rgba(15,17,23,0.6)" }}>
          <div className="text-[9px] font-mono uppercase tracking-wider text-white/25">Avg Margin Erosion</div>
          <div className="text-lg font-semibold mt-1" style={{ color: "#ff4d4d" }}>
            {profile ? `${marginErosionPct}%` : "--"}
          </div>
          <div className="text-[9px] font-mono text-white/15 mt-0.5">Cross-sector average (reactive)</div>
        </div>

        {/* Alt Suppliers Available — populated from profile + analysis */}
        <div className="border border-white/[0.06] p-3 rounded" style={{ background: "rgba(15,17,23,0.6)" }}>
          <div className="text-[9px] font-mono uppercase tracking-wider text-white/25">Alt Suppliers Available</div>
          <div className="text-lg font-semibold mt-1" style={{ color: "#16a34a" }}>
            {profile ? altCount : "--"}
          </div>
          <div className="text-[9px] font-mono text-white/15 mt-0.5">
            {profile ? `${altCount} non-tariff options` : "Select a demo profile"}
          </div>
          {profile && altSuppliers.length > 0 && (
            <ul className="mt-3 space-y-2">
              {altSuppliers.map((s) => (
                <motion.li
                  key={s.name}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] border-l-2 pl-3 pr-2 py-2 rounded-r border-emerald-500/30 transition-colors hover:bg-white/[0.04]"
                  style={{ borderColor: "rgba(22,163,74,0.4)" }}
                >
                  <span className="font-medium text-white/70">{s.name}</span>
                  <span className="text-white/40"> · {s.country}</span>
                  <div className="text-[9px] font-mono text-emerald-400/80 mt-1">
                    Δ +{s.deltaMarginSavedPct}% margin · Save ${(s.deltaAmountSaved / 1000).toFixed(0)}K
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>

        {/* Confidence Score — with tooltip so low % doesn't confuse */}
        <div
          className="border border-white/[0.06] p-3 rounded"
          style={{ background: "rgba(15,17,23,0.6)" }}
          title="Model confidence in stress-test projections. Drops as tariff rate increases because higher tariffs add uncertainty to margin and exposure estimates."
        >
          <div className="text-[9px] font-mono uppercase tracking-wider text-white/25 flex items-center gap-1.5 min-h-[14px]">
            <span>Confidence Score</span>
            <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-white/20 text-[10px] text-white/50 cursor-help shrink-0" aria-label="Explain confidence" title="Model confidence in stress-test projections. Drops as tariff rate increases.">ⓘ</span>
          </div>
          <div className="text-lg font-semibold mt-1" style={{ color: "#3b82f6" }}>
            {profile ? `${confidenceScore}%` : "--"}
          </div>
          <div className="text-[9px] font-mono text-white/15 mt-0.5">Uncertainty rises with tariff stress — hover for details</div>
        </div>
      </div>
    </div>
  );
}
