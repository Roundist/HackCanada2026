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
<<<<<<< HEAD
    <div className="space-y-5 text-white">
      {showDemos && !isRunning && (
        <div className="space-y-2">
          <div className="text-[9px] font-mono uppercase tracking-[0.28em] text-white/35">
            Demo Profiles
=======
    <div className="space-y-5">
      {/* Floating CTA when ready — visible without scrolling to bottom */}
      {!isRunning && canRun && (
        <div className="flex items-center justify-between py-2.5 px-4 rounded-lg border border-red-500/25" style={{ background: "rgba(30,12,12,0.6)" }}>
          <span className="text-[10px] font-mono text-white/50">Profile ready</span>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider border border-red-500/40 rounded"
            style={{ background: "rgba(220,38,38,0.12)", color: "#dc2626" }}
          >
            Run Analysis
          </button>
        </div>
      )}
      {showDemos && !isRunning && (
        <div className="space-y-2">
          <div className="text-[9px] font-mono uppercase tracking-widest text-white/20">
            Demo Profiles — select to preview, then Run Analysis
>>>>>>> ec147a2ee4dbe0c062915b60d5ae25d3c521076f
          </div>
          <div className="space-y-2">
            {businessProfiles.map((profile) => (
              <button
<<<<<<< HEAD
                key={profile.name}
                onClick={() => handleDemo(profile.description)}
                className="w-full text-left border border-white/10 bg-white/5 hover:border-white/25 transition-colors px-3 py-3"
=======
                type="button"
                key={profile.id}
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectProfile(profile);
                }}
                className={`w-full text-left border transition-colors p-3 ${selectedProfile?.id === profile.id ? "border-red-500/40 bg-red-500/5" : "border-white/[0.05] hover:border-white/[0.12]"}`}
                style={{ background: "rgba(15,17,23,0.6)" }}
>>>>>>> ec147a2ee4dbe0c062915b60d5ae25d3c521076f
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-white">{profile.name}</span>
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/45">{profile.industry}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[10px] font-mono text-white/55">
                    <span>{profile.revenue}</span>
                    <span>{profile.imports}</span>
                    <span
                      className={`px-2 py-0.5 border tracking-[0.2em] ${
                        profile.risk === "HIGH"
                          ? "text-red-400/80 border-red-400/30 bg-red-500/10"
                          : "text-amber-400/80 border-amber-400/30 bg-amber-500/10"
                      }`}
                    >
                      {profile.risk}
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-white/50 leading-relaxed line-clamp-3">
                  {profile.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isRunning && (
<<<<<<< HEAD
        <div className="space-y-2">
          {showDemos && (
            <div className="text-[9px] font-mono uppercase tracking-[0.28em] text-white/35">
              Or Custom Brief
            </div>
          )}
          <div className="border border-white/12 bg-black/40">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: Ontario furniture maker with 65% US hardwood dependence, steel hinges from Ohio, margins 18-22%, 45 staff, seeking Canadian alternatives for lumber and hardware."
              className="w-full h-36 p-4 text-[12px] text-white/75 placeholder-white/25 resize-none focus:outline-none bg-transparent font-mono"
            />
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              <span className="text-[9px] font-mono text-white/40">{description.length} chars / 50 min</span>
=======
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
              className="w-full h-28 p-3 border border-white/[0.08] rounded text-[12px] text-white/70 placeholder-white/20 resize-none focus:outline-none focus:border-white/[0.2] transition-colors font-mono"
              style={{ background: "rgba(8,10,14,0.8)" }}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-[9px] font-mono text-white/20">
                {description.length} chars / 50 min
              </span>
>>>>>>> ec147a2ee4dbe0c062915b60d5ae25d3c521076f
              <button
                type="button"
                onClick={handleSubmit}
                disabled={description.trim().length < 50}
<<<<<<< HEAD
                className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] border border-cyan-400/60 text-cyan-300 hover:bg-cyan-400/10 disabled:opacity-20 disabled:cursor-not-allowed"
=======
                className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider border transition-all disabled:opacity-20 disabled:cursor-not-allowed rounded"
                style={{
                  borderColor: description.trim().length >= 50 ? "rgba(220,38,38,0.5)" : "rgba(255,255,255,0.05)",
                  background: description.trim().length >= 50 ? "rgba(220,38,38,0.08)" : "transparent",
                  color: description.trim().length >= 50 ? "#dc2626" : "rgba(255,255,255,0.2)",
                }}
>>>>>>> ec147a2ee4dbe0c062915b60d5ae25d3c521076f
              >
                Run Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {isRunning && (
        <div className="text-[10px] font-mono text-white/45 uppercase tracking-[0.28em]">
          Panel minimized while neural graph runs.
        </div>
      )}
    </div>
  );
}
