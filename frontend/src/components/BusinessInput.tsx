import { useState } from "react";
import { businessProfiles } from "../data/businessProfiles";
import type { BusinessProfile } from "../data/businessProfiles";

interface BusinessInputProps {
  onSubmit: (description: string, profile?: BusinessProfile | null) => void;
  onSelectProfile?: (profile: BusinessProfile | null) => void;
  selectedProfile: BusinessProfile | null;
  isRunning: boolean;
}

interface FormData {
  companyName: string;
  industry: string;
  location: string;
  revenue: string;
  margins: string;
  employees: string;
  importSources: string;
  usImportPct: string;
  keyProducts: string;
  exportMarkets: string;
  additionalContext: string;
}

const EMPTY_FORM: FormData = {
  companyName: "",
  industry: "",
  location: "",
  revenue: "",
  margins: "",
  employees: "",
  importSources: "",
  usImportPct: "",
  keyProducts: "",
  exportMarkets: "",
  additionalContext: "",
};

const INDUSTRIES = [
  "Manufacturing",
  "Technology",
  "Food & Beverage",
  "Agriculture",
  "Automotive",
  "Retail",
  "Construction",
  "Energy",
  "Healthcare",
  "Textiles & Apparel",
  "Other",
];

function composeDescription(form: FormData): string {
  const parts: string[] = [];
  parts.push(
    `We are ${form.companyName ? form.companyName + ", a" : "a"} Canadian ${form.industry.toLowerCase() || "business"} company${form.location ? ` based in ${form.location}` : ""}${form.revenue ? ` with ${form.revenue} annual revenue` : ""}.`
  );
  if (form.importSources) {
    parts.push(
      `We import ${form.importSources}${form.usImportPct ? `. About ${form.usImportPct}% of our input costs are US-sourced` : ""}.`
    );
  }
  if (form.keyProducts) {
    parts.push(`Our key products/services: ${form.keyProducts}.`);
  }
  if (form.exportMarkets) {
    parts.push(`We sell to: ${form.exportMarkets}.`);
  }
  if (form.margins) {
    parts.push(`Our margins are approximately ${form.margins}%.`);
  }
  if (form.employees) {
    parts.push(`We employ ${form.employees} people.`);
  }
  if (form.additionalContext) {
    parts.push(form.additionalContext);
  }
  return parts.join(" ");
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[9px] font-mono text-white/20">{hint}</p>
      )}
    </div>
  );
}

const inputClass =
  "w-full p-2 border border-white/[0.08] rounded text-[12px] text-white/70 placeholder-white/20 focus:outline-none focus:border-white/[0.2] transition-colors font-mono";
const inputStyle = { background: "rgba(8,10,14,0.8)" };

export default function BusinessInput({
  onSubmit,
  onSelectProfile,
  selectedProfile,
  isRunning,
}: BusinessInputProps) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [mode, setMode] = useState<"form" | "demos">("demos");

  const update = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const composed = composeDescription(form);
  const canRun = composed.length >= 50 && form.industry !== "";

  const handleSubmit = () => {
    if (canRun) {
      onSubmit(composed, null);
    }
  };

  const handleSelectProfile = (profile: BusinessProfile) => {
    onSelectProfile?.(profile);
    setMode("demos");
  };

  return (
    <div className="space-y-5">
      {!isRunning && (
        <>
          {/* Mode toggle */}
          <div className="flex gap-4 border-b border-white/[0.06] pb-2">
            <button
              type="button"
              onClick={() => setMode("demos")}
              className={`text-[10px] font-mono uppercase tracking-widest pb-1 transition-colors border-b-2 ${
                mode === "demos"
                  ? "text-white/70 border-red-500/60"
                  : "text-white/25 border-transparent hover:text-white/40"
              }`}
            >
              Demo Profiles
            </button>
            <button
              type="button"
              onClick={() => setMode("form")}
              className={`text-[10px] font-mono uppercase tracking-widest pb-1 transition-colors border-b-2 ${
                mode === "form"
                  ? "text-white/70 border-red-500/60"
                  : "text-white/25 border-transparent hover:text-white/40"
              }`}
            >
              Custom Business
            </button>
          </div>

          {/* Demo profiles */}
          {mode === "demos" && (
            <div className="space-y-2">
              {businessProfiles.map((profile) => (
                <button
                  type="button"
                  key={profile.id}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelectProfile(profile);
                  }}
                  className={`w-full text-left border transition-colors p-3 ${
                    selectedProfile?.id === profile.id
                      ? "border-red-500/40 bg-red-500/5"
                      : "border-white/[0.05] hover:border-white/[0.12]"
                  }`}
                  style={{ background: "rgba(15,17,23,0.6)" }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] font-semibold text-white/70">
                        {profile.name}
                      </span>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-white/25">
                        {profile.industry}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-white/20">
                        {profile.revenue}
                      </span>
                      <span className="text-[9px] font-mono text-white/20">
                        {profile.imports}
                      </span>
                      <span
                        className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 border ${
                          profile.risk === "HIGH"
                            ? "text-red-400/70 border-red-500/20 bg-red-500/5"
                            : "text-amber-400/70 border-amber-500/20 bg-amber-500/5"
                        }`}
                      >
                        {profile.risk}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-white/30 leading-relaxed line-clamp-3">
                    {profile.description}
                  </div>
                </button>
              ))}

              {/* Run selected demo */}
              {selectedProfile && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      onSubmit(selectedProfile.description, selectedProfile)
                    }
                    className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider border rounded transition-all"
                    style={{
                      borderColor: "rgba(220,38,38,0.5)",
                      background: "rgba(220,38,38,0.08)",
                      color: "#dc2626",
                    }}
                  >
                    Run Analysis
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Structured form */}
          {mode === "form" && (
            <div
              className="border border-white/[0.1] rounded-lg p-5 space-y-4"
              style={{ background: "rgba(15,17,23,0.7)" }}
            >
              {/* Row 1: Company name + Industry */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Company Name" hint="Optional">
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                    placeholder="e.g. Maple Furniture Co."
                    className={inputClass}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Industry *">
                  <select
                    value={form.industry}
                    onChange={(e) => update("industry", e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                  >
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Row 2: Location + Revenue */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Location (Province/City)">
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                    placeholder="e.g. Ontario, Vancouver"
                    className={inputClass}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Annual Revenue">
                  <input
                    type="text"
                    value={form.revenue}
                    onChange={(e) => update("revenue", e.target.value)}
                    placeholder="e.g. $8M, $500K"
                    className={inputClass}
                    style={inputStyle}
                  />
                </Field>
              </div>

              {/* Row 3: Margins + Employees */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Profit Margins (%)" hint="Approximate range">
                  <input
                    type="text"
                    value={form.margins}
                    onChange={(e) => update("margins", e.target.value)}
                    placeholder="e.g. 18-22"
                    className={inputClass}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Employees">
                  <input
                    type="text"
                    value={form.employees}
                    onChange={(e) => update("employees", e.target.value)}
                    placeholder="e.g. 45"
                    className={inputClass}
                    style={inputStyle}
                  />
                </Field>
              </div>

              {/* Import sources */}
              <Field
                label="Import Sources & Materials *"
                hint="What you import and from where"
              >
                <textarea
                  value={form.importSources}
                  onChange={(e) => update("importSources", e.target.value)}
                  placeholder="e.g. hardwood lumber from Michigan, steel hardware from Ohio, upholstery fabrics from North Carolina"
                  className={inputClass}
                  style={{ ...inputStyle, minHeight: 60 }}
                  rows={2}
                />
              </Field>

              {/* US import % */}
              <Field label="% of Inputs from US" hint="Approximate percentage">
                <input
                  type="text"
                  value={form.usImportPct}
                  onChange={(e) => update("usImportPct", e.target.value)}
                  placeholder="e.g. 65"
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>

              {/* Key products */}
              <Field label="Key Products / Services">
                <input
                  type="text"
                  value={form.keyProducts}
                  onChange={(e) => update("keyProducts", e.target.value)}
                  placeholder="e.g. custom furniture, IoT devices, organic snacks"
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>

              {/* Export markets */}
              <Field label="Sales / Export Markets">
                <input
                  type="text"
                  value={form.exportMarkets}
                  onChange={(e) => update("exportMarkets", e.target.value)}
                  placeholder="e.g. 70% Canada, 25% US, 5% EU"
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>

              {/* Additional context */}
              <Field label="Additional Context" hint="Optional — anything else relevant">
                <textarea
                  value={form.additionalContext}
                  onChange={(e) => update("additionalContext", e.target.value)}
                  placeholder="Any other details about your supply chain, risks, or concerns..."
                  className={inputClass}
                  style={{ ...inputStyle, minHeight: 50 }}
                  rows={2}
                />
              </Field>

              {/* Submit */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                <span className="text-[9px] font-mono text-white/20">
                  {composed.length} chars generated
                </span>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canRun}
                  className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider border transition-all disabled:opacity-20 disabled:cursor-not-allowed rounded"
                  style={{
                    borderColor: canRun
                      ? "rgba(220,38,38,0.5)"
                      : "rgba(255,255,255,0.05)",
                    background: canRun
                      ? "rgba(220,38,38,0.08)"
                      : "transparent",
                    color: canRun ? "#dc2626" : "rgba(255,255,255,0.2)",
                  }}
                >
                  Run Analysis
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {isRunning && (
        <div className="text-[10px] font-mono text-white/45 uppercase tracking-[0.28em]">
          Panel minimized while neural graph runs.
        </div>
      )}
    </div>
  );
}
