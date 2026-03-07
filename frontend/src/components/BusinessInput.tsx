import { useState } from "react";
import { businessProfiles } from "../data/businessProfiles";
import type { BusinessProfile } from "../data/businessProfiles";

interface BusinessInputProps {
  onSubmit: (description: string, profile?: BusinessProfile | null) => void;
  onSelectProfile?: (profile: BusinessProfile | null) => void;
  selectedProfile: BusinessProfile | null;
  isRunning: boolean;
}

export default function BusinessInput({ onSubmit, onSelectProfile, selectedProfile, isRunning }: BusinessInputProps) {
  const [description, setDescription] = useState(() => selectedProfile?.description ?? "");
  const [showDemos, setShowDemos] = useState(true);

  const handleSubmit = () => {
    if (description.trim().length >= 50) {
      onSubmit(description.trim(), selectedProfile ?? undefined);
    }
  };

  /** Clicking a profile only selects it — preview and slider update. Run Analysis starts the pipeline. */
  const handleSelectProfile = (profile: BusinessProfile) => {
    setDescription(profile.description);
    setShowDemos(false);
    onSelectProfile?.(profile);
  };

  const canRun = description.trim().length >= 50;

  return (
    <div className="space-y-5">
      {showDemos && !isRunning && (
        <div className="space-y-2">
          <div className="text-[9px] font-mono uppercase tracking-widest text-white/20">
            Demo Profiles — select to preview, then Run Analysis
          </div>
          <div className="space-y-2">
            {businessProfiles.map((profile) => (
              <button
                type="button"
                key={profile.id}
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectProfile(profile);
                }}
                className={`w-full text-left border transition-colors p-3 ${selectedProfile?.id === profile.id ? "border-red-500/40 bg-red-500/5" : "border-white/[0.05] hover:border-white/[0.12]"}`}
                style={{ background: "rgba(15,17,23,0.6)" }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-semibold text-white/70">{profile.name}</span>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-white/25">{profile.industry}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono text-white/20">{profile.revenue}</span>
                    <span className="text-[9px] font-mono text-white/20">{profile.imports}</span>
                    <span className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 border ${
                      profile.risk === "HIGH"
                        ? "text-red-400/70 border-red-500/20 bg-red-500/5"
                        : "text-amber-400/70 border-amber-500/20 bg-amber-500/5"
                    }`}>
                      {profile.risk}
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-white/30 leading-relaxed line-clamp-3">
                  {profile.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isRunning && (
        <div className="space-y-4">
          {!showDemos && selectedProfile && (
            <button
              type="button"
              onClick={() => setShowDemos(true)}
              className="text-[10px] font-mono text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5"
            >
              ← Change profile
            </button>
          )}
          {/* Clearer hierarchy: custom profile section stands out */}
          <div className="border border-white/[0.1] rounded-lg p-4" style={{ background: "rgba(15,17,23,0.7)" }}>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-2">
              Or enter your own business profile
            </div>
            <p className="text-[11px] text-white/25 mb-3">
              Paste or type your description below (min 50 characters). Include supply chain, imports, and revenue.
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your Canadian business... Include supply chain details, import sources, industry, revenue, margins. (Min 50 characters)"
              className="w-full min-h-[140px] p-3 border border-white/[0.08] rounded text-[12px] leading-relaxed text-white/70 placeholder-white/20 resize-y focus:outline-none focus:border-white/[0.2] transition-colors font-mono"
              style={{ background: "rgba(8,10,14,0.8)", lineHeight: 1.5 }}
              rows={6}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-[9px] font-mono text-white/20">
                {description.length} chars / 50 min
              </span>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={description.trim().length < 50}
                className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider border transition-all disabled:opacity-20 disabled:cursor-not-allowed rounded"
                style={{
                  borderColor: description.trim().length >= 50 ? "rgba(220,38,38,0.5)" : "rgba(255,255,255,0.05)",
                  background: description.trim().length >= 50 ? "rgba(220,38,38,0.08)" : "transparent",
                  color: description.trim().length >= 50 ? "#dc2626" : "rgba(255,255,255,0.2)",
                }}
              >
                Run Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
