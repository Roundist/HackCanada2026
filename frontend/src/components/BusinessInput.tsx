import { useState } from "react";
import { businessProfiles } from "../data/businessProfiles";
import type { BusinessProfile } from "../data/businessProfiles";

interface BusinessInputProps {
  onSubmit: (description: string, profile?: BusinessProfile | null) => void;
  onSelectProfile?: (profile: BusinessProfile | null) => void;
  isRunning: boolean;
}

export default function BusinessInput({ onSubmit, onSelectProfile, isRunning }: BusinessInputProps) {
  const [description, setDescription] = useState("");
  const [showDemos, setShowDemos] = useState(true);

  const handleSubmit = () => {
    if (description.trim().length >= 50) {
      onSubmit(description.trim());
    }
  };

  const handleDemo = (profile: BusinessProfile) => {
    setDescription(profile.description);
    setShowDemos(false);
    onSelectProfile?.(profile);
    onSubmit(profile.description, profile);
  };

  return (
    <div className="space-y-5">
      {showDemos && !isRunning && (
        <div className="space-y-2">
          <div className="text-[9px] font-mono uppercase tracking-widest text-white/20">
            Demo Profiles -- Select to Analyze
          </div>
          <div className="space-y-2">
            {businessProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleDemo(profile)}
                className="w-full text-left border border-white/[0.05] hover:border-white/[0.12] transition-colors p-3"
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
                <div className="text-[10px] text-white/25 leading-relaxed line-clamp-2">
                  {profile.description.slice(0, 140)}...
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isRunning && (
        <div className="space-y-2">
          {showDemos && (
            <div className="text-[9px] font-mono uppercase tracking-widest text-white/20">
              Or Enter Business Profile
            </div>
          )}
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your Canadian business... Include supply chain details, import sources, industry, revenue, margins. (Min 50 characters)"
              className="w-full h-28 p-3 border border-white/[0.06] text-[12px] text-white/70 placeholder-white/15 resize-none focus:outline-none focus:border-white/[0.15] transition-colors font-mono"
              style={{ background: "rgba(15,17,23,0.6)" }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[9px] font-mono text-white/15">
                {description.length} chars / 50 min
              </span>
              <button
                onClick={handleSubmit}
                disabled={description.trim().length < 50}
                className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider border transition-all disabled:opacity-20 disabled:cursor-not-allowed"
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
