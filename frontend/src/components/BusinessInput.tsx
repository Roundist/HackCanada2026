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
    <div className="space-y-5 text-white">
      {showDemos && !isRunning && (
        <div className="space-y-2">
          <div className="text-[9px] font-mono uppercase tracking-[0.28em] text-white/35">
            Demo Profiles
          </div>
          <div className="space-y-2">
            {DEMO_PROFILES.map((profile) => (
              <button
                key={profile.name}
                onClick={() => handleDemo(profile.description)}
                className="w-full text-left border border-white/10 bg-white/5 hover:border-white/25 transition-colors px-3 py-3"
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
              <button
                onClick={handleSubmit}
                disabled={description.trim().length < 50}
                className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] border border-cyan-400/60 text-cyan-300 hover:bg-cyan-400/10 disabled:opacity-20 disabled:cursor-not-allowed"
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
