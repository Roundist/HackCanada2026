import { useState } from "react";
import { motion } from "framer-motion";

interface BusinessInputProps {
  onSubmit: (description: string) => void;
  isRunning: boolean;
}

const DEMO_PROFILES = [
  {
    name: "Maple Furniture Co.",
    industry: "Manufacturing",
    description:
      "We are a mid-sized Canadian furniture manufacturer based in Ontario with $8M annual revenue. We import hardwood lumber (oak, maple, walnut) from mills in Michigan and Wisconsin, upholstery fabrics from North Carolina, steel hardware and hinges from Ohio, and finishing chemicals (stains, lacquers) from Pennsylvania. About 65% of our raw materials come from the US. We sell primarily in the Canadian market through retail partners, with 20% of sales exported back to the US. Our margins are typically 18-22% depending on the product line. We employ 45 people and operate one production facility.",
  },
  {
    name: "Northern Tech Solutions",
    industry: "Technology",
    description:
      "We are a Canadian electronics company in Vancouver with $12M annual revenue. We import printed circuit boards and semiconductor components from suppliers in California and Texas, plastic housings from injection molding companies in Michigan, lithium batteries from US distributors (originally manufactured in China), and specialized testing equipment from Oregon. About 55% of our component costs are US-sourced. We assemble IoT devices for agricultural monitoring and sell 40% to US customers and 35% to Canadian customers. Margins run 25-30% but are under pressure from rising component costs. We have 60 employees.",
  },
  {
    name: "Prairie Harvest Foods",
    industry: "Food & Beverage",
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
    <div className="space-y-6">
      {/* Demo profiles */}
      {showDemos && !isRunning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <p className="text-xs font-mono uppercase tracking-wider text-white/30">
            Quick Start — Demo Profiles
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {DEMO_PROFILES.map((profile) => (
              <motion.button
                key={profile.name}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDemo(profile.description)}
                className="text-left p-4 rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-all"
                style={{
                  background: "linear-gradient(135deg, rgba(30,30,45,0.8), rgba(20,20,35,0.8))",
                }}
              >
                <div className="text-sm font-semibold text-white/80 mb-1">{profile.name}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 mb-2">
                  {profile.industry}
                </div>
                <div className="text-xs text-white/30 line-clamp-3 leading-relaxed">
                  {profile.description.slice(0, 120)}...
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Text input */}
      {!isRunning && (
        <div className="space-y-3">
          {showDemos && (
            <p className="text-xs font-mono uppercase tracking-wider text-white/30">
              Or Describe Your Business
            </p>
          )}
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your Canadian business... Include details about your supply chain, what you import from the US, your industry, revenue, and margins. (Min 50 characters)"
              className="w-full h-32 p-4 rounded-xl bg-dark-800 border border-white/[0.06] text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] font-mono text-white/20">
                {description.length} / 50 min
              </span>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={description.trim().length < 50}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: description.trim().length >= 50
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "rgba(255,255,255,0.05)",
                  boxShadow: description.trim().length >= 50
                    ? "0 0 20px rgba(99,102,241,0.3)"
                    : "none",
                }}
              >
                Analyze Tariff Impact
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
