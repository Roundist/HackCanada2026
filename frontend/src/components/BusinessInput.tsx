import { useState } from "react";

interface BusinessInputProps {
  onSubmit: (description: string) => void;
  isRunning: boolean;
}

const DEMO_PROFILES = [
  {
    name: "Maple Furniture Co.",
    industry: "Manufacturing",
    revenue: "$8M",
    imports: "US -- 65%",
    risk: "HIGH",
    description:
      "We are a mid-sized Canadian furniture manufacturer based in Ontario with $8M annual revenue. We import hardwood lumber (oak, maple, walnut) from mills in Michigan and Wisconsin, upholstery fabrics from North Carolina, steel hardware and hinges from Ohio, and finishing chemicals (stains, lacquers) from Pennsylvania. About 65% of our raw materials come from the US. We sell primarily in the Canadian market through retail partners, with 20% of sales exported back to the US. Our margins are typically 18-22% depending on the product line. We employ 45 people and operate one production facility.",
  },
  {
    name: "Northern Tech Solutions",
    industry: "Technology",
    revenue: "$12M",
    imports: "US -- 55%",
    risk: "MEDIUM",
    description:
      "We are a Canadian electronics company in Vancouver with $12M annual revenue. We import printed circuit boards and semiconductor components from suppliers in California and Texas, plastic housings from injection molding companies in Michigan, lithium batteries from US distributors (originally manufactured in China), and specialized testing equipment from Oregon. About 55% of our component costs are US-sourced. We assemble IoT devices for agricultural monitoring and sell 40% to US customers and 35% to Canadian customers. Margins run 25-30% but are under pressure from rising component costs. We have 60 employees.",
  },
  {
    name: "Prairie Harvest Foods",
    industry: "Food & Beverage",
    revenue: "$5M",
    imports: "US -- 40%",
    risk: "MEDIUM",
    description:
      "We are a Canadian food processing company in Manitoba with $5M annual revenue. We import packaging materials (specialized food-grade containers and labels) from Wisconsin, flavoring extracts and food additives from US chemical companies in New Jersey, processing equipment parts from Illinois, and some specialty grains and ingredients from North Dakota. About 40% of our input costs are US-sourced. We produce organic snack foods and sell 70% domestically through major grocery chains, with 25% exported to the US. Margins are thin at 12-15%. We employ 30 people in our processing facility.",
  },
];

export default function BusinessInput({ onSubmit, isRunning }: BusinessInputProps) {
  const [description, setDescription] = useState("");
  const [showDemos, setShowDemos] = useState(true);

  const handleSubmit = () => {
    if (description.trim().length >= 50) {
      onSubmit(description.trim());
    }
  };

  const handleDemo = (desc: string) => {
    setDescription(desc);
    setShowDemos(false);
    onSubmit(desc);
  };

  return (
    <div className="space-y-5">
      {showDemos && !isRunning && (
        <div className="space-y-2">
          <div className="text-[9px] font-mono uppercase tracking-widest text-white/20">
            Demo Profiles -- Select to Analyze
          </div>
          <div className="space-y-2">
            {DEMO_PROFILES.map((profile) => (
              <button
                key={profile.name}
                onClick={() => handleDemo(profile.description)}
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
