import { useState } from "react";
import { businessProfiles } from "../data/businessProfiles";
import type { BusinessProfile } from "../data/businessProfiles";

interface BusinessInputProps {
  onSubmit: (description: string, profile?: BusinessProfile | null) => void;
  onSelectProfile?: (profile: BusinessProfile | null) => void;
  selectedProfile: BusinessProfile | null;
  isRunning: boolean;
  /** Light theme: white/gray background, dark text (replicated UI). */
  variant?: "dark" | "light";
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
  labelClass = "text-[10px] font-mono uppercase tracking-widest text-white/40",
  hintClass = "text-[9px] font-mono text-white/20",
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  labelClass?: string;
  hintClass?: string;
}) {
  return (
    <div className="space-y-1">
      <label className={labelClass}>{label}</label>
      {children}
      {hint && <p className={hintClass}>{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full p-2 border border-white/[0.08] rounded text-[12px] text-white/70 placeholder-white/20 focus:outline-none focus:border-white/[0.2] transition-colors font-mono";
const inputStyle = { background: "rgba(8,10,14,0.8)" };

const light = { label: "text-gray-500", border: "border-gray-200", input: "bg-white border-gray-200 text-gray-900 placeholder-gray-400", card: "bg-gray-50 border-gray-200", cardSelected: "bg-gray-100 border-gray-300", tabActive: "text-gray-900 border-gray-900", tabInactive: "text-gray-500 border-transparent hover:text-gray-700", risk: "text-amber-700 border-amber-200 bg-amber-50", runBtn: "bg-gray-800 text-white border-gray-800 hover:bg-gray-700" };
const dark = { label: "text-white/40", border: "border-white/[0.06]", input: "bg-[rgba(8,10,14,0.8)] border-white/[0.08] text-white/70 placeholder-white/20", card: "rgba(15,17,23,0.6)", cardSelected: "border-red-500/40 bg-red-500/5", tabActive: "text-white/70 border-red-500/60", tabInactive: "text-white/25 border-transparent hover:text-white/40", risk: "text-amber-400/70 border-amber-500/20 bg-amber-500/5", runBtn: "border-red-500/50 bg-red-500/10 text-red-600 hover:bg-red-500/20" };

export default function BusinessInput({
  onSubmit,
  onSelectProfile,
  selectedProfile,
  isRunning,
  variant = "dark",
}: BusinessInputProps) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [mode, setMode] = useState<"form" | "demos">("form");
  const theme = variant === "light" ? light : dark;

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
          {/* Tabs: Form first (default), Demo choices second */}
          <div className={`flex gap-4 border-b pb-2 ${theme.border}`}>
            <button
              type="button"
              onClick={() => setMode("form")}
              className={`text-[10px] font-mono uppercase tracking-widest pb-1 transition-colors border-b-2 ${
                mode === "form" ? theme.tabActive : theme.tabInactive
              }`}
            >
              Custom Business
            </button>
            <button
              type="button"
              onClick={() => setMode("demos")}
              className={`text-[10px] font-mono uppercase tracking-widest pb-1 transition-colors border-b-2 ${
                mode === "demos" ? theme.tabActive : theme.tabInactive
              }`}
            >
              Demo Profiles
            </button>
          </div>

          {/* Custom Business form (default view) — different shades to differentiate container vs inputs */}
          {mode === "form" && (
            <div
              className={`rounded-xl p-5 space-y-4 border ${
                variant === "light"
                  ? "bg-[#e8e8e8] border-gray-300"
                  : "border-white/[0.1]"
              }`}
              style={variant === "dark" ? { background: "rgba(44,44,44,0.98)" } : undefined}
            >
              {/* Row 1: Company name + Industry */}
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Company Name"
                  hint="Optional"
                  labelClass={`text-[10px] font-mono uppercase tracking-widest ${variant === "light" ? "text-gray-600" : "text-gray-400"}`}
                  hintClass="text-[9px] text-gray-500"
                >
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                    placeholder="e.g. Maple Furniture Co."
                    className={`w-full p-2.5 border rounded-md text-[12px] focus:outline-none focus:border-gray-500 transition-colors ${
                      variant === "light"
                        ? "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                        : "border-gray-600 text-gray-100 placeholder-gray-500 bg-[#3c3c3c]"
                    }`}
                  />
                </Field>
                <Field
                  label="Industry *"
                  labelClass={`text-[10px] font-mono uppercase tracking-widest ${variant === "light" ? "text-gray-600" : "text-gray-400"}`}
                >
                  <select
                    value={form.industry}
                    onChange={(e) => update("industry", e.target.value)}
                    className={`w-full p-2.5 border rounded-md text-[12px] focus:outline-none focus:border-gray-500 transition-colors appearance-none cursor-pointer ${
                      variant === "light"
                        ? "bg-white border-gray-300 text-gray-900"
                        : "border-gray-600 text-gray-100 bg-[#3c3c3c]"
                    }`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.5rem center",
                      backgroundSize: "1rem",
                      paddingRight: "2rem",
                    }}
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
                <Field label="Location (Province/City)" labelClass={`text-[10px] font-mono uppercase tracking-widest ${variant === "light" ? "text-gray-600" : "text-gray-400"}`}>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                    placeholder="e.g. Ontario, Vancouver"
                    className={`w-full p-2.5 border rounded-md text-[12px] focus:outline-none focus:border-gray-500 transition-colors ${
                      variant === "light" ? "bg-white border-gray-300 text-gray-900 placeholder-gray-400" : "border-gray-600 text-gray-100 placeholder-gray-500 bg-[#3c3c3c]"
                    }`}
                  />
                </Field>
                <Field label="Annual Revenue" labelClass={`text-[10px] font-mono uppercase tracking-widest ${variant === "light" ? "text-gray-600" : "text-gray-400"}`}>
                  <input
                    type="text"
                    value={form.revenue}
                    onChange={(e) => update("revenue", e.target.value)}
                    placeholder="e.g. $8M, $500K"
                    className={`w-full p-2.5 border rounded-md text-[12px] focus:outline-none focus:border-gray-500 transition-colors ${
                      variant === "light" ? "bg-white border-gray-300 text-gray-900 placeholder-gray-400" : "border-gray-600 text-gray-100 placeholder-gray-500 bg-[#3c3c3c]"
                    }`}
                  />
                </Field>
              </div>

              {/* Row 3: Margins + Employees */}
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Profit Margins (%)"
                  hint="Approximate range"
                  labelClass={`text-[10px] font-mono uppercase tracking-widest ${variant === "light" ? "text-gray-600" : "text-gray-400"}`}
                  hintClass="text-[9px] text-gray-500"
                >
                  <input
                    type="text"
                    value={form.margins}
                    onChange={(e) => update("margins", e.target.value)}
                    placeholder="e.g. 18-22"
                    className={`w-full p-2.5 border rounded-md text-[12px] focus:outline-none focus:border-gray-500 transition-colors ${
                      variant === "light" ? "bg-white border-gray-300 text-gray-900 placeholder-gray-400" : "border-gray-600 text-gray-100 placeholder-gray-500 bg-[#3c3c3c]"
                    }`}
                  />
                </Field>
                <Field label="Employees" labelClass={`text-[10px] font-mono uppercase tracking-widest ${variant === "light" ? "text-gray-600" : "text-gray-400"}`}>
                  <input
                    type="text"
                    value={form.employees}
                    onChange={(e) => update("employees", e.target.value)}
                    placeholder="e.g. 45"
                    className={`w-full p-2.5 border rounded-md text-[12px] focus:outline-none focus:border-gray-500 transition-colors ${
                      variant === "light" ? "bg-white border-gray-300 text-gray-900 placeholder-gray-400" : "border-gray-600 text-gray-100 placeholder-gray-500 bg-[#3c3c3c]"
                    }`}
                  />
                </Field>
              </div>

              {/* Full width: Import sources */}
              <Field
                label="Import Sources & Materials *"
                hint="What you import and from where"
                labelClass={`text-[10px] font-mono uppercase tracking-widest ${variant === "light" ? "text-gray-600" : "text-gray-400"}`}
                hintClass="text-[9px] text-gray-500"
              >
                <textarea
                  value={form.importSources}
                  onChange={(e) => update("importSources", e.target.value)}
                  placeholder="e.g. hardwood lumber from Michigan, steel hardware from Ohio, upholstery fabrics from North Carolina"
                  className={`w-full p-2.5 border rounded-md text-[12px] focus:outline-none focus:border-gray-500 transition-colors resize-y min-h-[72px] ${
                    variant === "light" ? "bg-white border-gray-300 text-gray-900 placeholder-gray-400" : "border-gray-600 text-gray-100 placeholder-gray-500 bg-[#3c3c3c]"
                  }`}
                  rows={3}
                />
              </Field>

              {/* Full width: % of Inputs from US */}
              <Field
                label="% of Inputs from US"
                hint="Approximate percentage"
                labelClass={`text-[10px] font-mono uppercase tracking-widest ${variant === "light" ? "text-gray-600" : "text-gray-400"}`}
                hintClass="text-[9px] text-gray-500"
              >
                <input
                  type="text"
                  value={form.usImportPct}
                  onChange={(e) => update("usImportPct", e.target.value)}
                  placeholder="e.g. 65"
                  className={`w-full p-2.5 border rounded-md text-[12px] focus:outline-none focus:border-gray-500 transition-colors ${
                    variant === "light" ? "bg-white border-gray-300 text-gray-900 placeholder-gray-400" : "border-gray-600 text-gray-100 placeholder-gray-500 bg-[#3c3c3c]"
                  }`}
                />
              </Field>

              {/* Optional: Key products, Export markets, Additional context */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Key Products / Services" labelClass={`text-[10px] font-mono uppercase tracking-widest ${variant === "light" ? "text-gray-600" : "text-gray-400"}`}>
                  <input
                    type="text"
                    value={form.keyProducts}
                    onChange={(e) => update("keyProducts", e.target.value)}
                    placeholder="e.g. custom furniture, IoT devices"
                    className={`w-full p-2.5 border rounded-md text-[12px] focus:outline-none focus:border-gray-500 transition-colors ${
                      variant === "light" ? "bg-white border-gray-300 text-gray-900 placeholder-gray-400" : "border-gray-600 text-gray-100 placeholder-gray-500 bg-[#3c3c3c]"
                    }`}
                  />
                </Field>
                <Field label="Sales / Export Markets" labelClass={`text-[10px] font-mono uppercase tracking-widest ${variant === "light" ? "text-gray-600" : "text-gray-400"}`}>
                  <input
                    type="text"
                    value={form.exportMarkets}
                    onChange={(e) => update("exportMarkets", e.target.value)}
                    placeholder="e.g. 70% Canada, 25% US"
                    className={`w-full p-2.5 border rounded-md text-[12px] focus:outline-none focus:border-gray-500 transition-colors ${
                      variant === "light" ? "bg-white border-gray-300 text-gray-900 placeholder-gray-400" : "border-gray-600 text-gray-100 placeholder-gray-500 bg-[#3c3c3c]"
                    }`}
                  />
                </Field>
              </div>
              <Field
                label="Additional Context"
                hint="Optional — anything else relevant"
                labelClass={`text-[10px] font-mono uppercase tracking-widest ${variant === "light" ? "text-gray-600" : "text-gray-400"}`}
                hintClass="text-[9px] text-gray-500"
              >
                <textarea
                  value={form.additionalContext}
                  onChange={(e) => update("additionalContext", e.target.value)}
                  placeholder="Any other details about your supply chain, risks, or concerns..."
                  className={`w-full p-2.5 border rounded-md text-[12px] focus:outline-none focus:border-gray-500 transition-colors resize-y min-h-[56px] ${
                    variant === "light" ? "bg-white border-gray-300 text-gray-900 placeholder-gray-400" : "border-gray-600 text-gray-100 placeholder-gray-500 bg-[#3c3c3c]"
                  }`}
                  rows={2}
                />
              </Field>

              {/* Submit */}
              <div className={`flex items-center justify-between pt-3 border-t ${variant === "light" ? "border-gray-300" : "border-gray-600"}`}>
                <span className="text-[9px] font-mono text-gray-500">
                  {composed.length} chars generated
                </span>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canRun}
                  className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider border transition-all disabled:opacity-20 disabled:cursor-not-allowed rounded-md bg-red-600/90 border-red-500/50 text-white hover:bg-red-600 disabled:hover:bg-red-600/90"
                >
                  Run Analysis
                </button>
              </div>
            </div>
          )}

          {/* Demo profiles (second tab) */}
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
                  className={`w-full text-left border transition-colors p-3 rounded-lg ${
                    selectedProfile?.id === profile.id
                      ? variant === "light"
                        ? "border-gray-300 bg-gray-100"
                        : "border-red-500/40 bg-red-500/5"
                      : variant === "light"
                        ? "border-gray-200 bg-white hover:border-gray-300"
                        : "border-white/[0.05] hover:border-white/[0.12]"
                  }`}
                  style={variant === "dark" && selectedProfile?.id !== profile.id ? { background: "rgba(15,17,23,0.6)" } : undefined}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3">
                      <span className={`text-[12px] font-semibold ${variant === "light" ? "text-gray-900" : "text-white/70"}`}>
                        {profile.name}
                      </span>
                      <span className={`text-[9px] font-mono uppercase tracking-wider ${variant === "light" ? "text-gray-500" : "text-white/25"}`}>
                        {profile.industry}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-mono ${variant === "light" ? "text-gray-600" : "text-white/20"}`}>
                        {profile.revenue}
                      </span>
                      <span className={`text-[9px] font-mono ${variant === "light" ? "text-gray-600" : "text-white/20"}`}>
                        {profile.imports}
                      </span>
                      <span className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 border rounded ${theme.risk}`}>
                        {profile.risk}
                      </span>
                    </div>
                  </div>
                  <div className={`text-[10px] leading-relaxed line-clamp-3 ${variant === "light" ? "text-gray-600" : "text-white/30"}`}>
                    {profile.description}
                  </div>
                </button>
              ))}

              {/* Run selected demo */}
              {selectedProfile && (
                <div className="flex flex-col gap-1 pt-2">
                  <p className={`text-[10px] ${variant === "light" ? "text-gray-500" : "text-white/25"}`}>
                    {selectedProfile.name} selected
                  </p>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        onSubmit(selectedProfile.description, selectedProfile)
                      }
                      className={variant === "light" ? "px-5 py-2 text-[11px] font-semibold uppercase tracking-wider rounded transition-all bg-gray-800 text-white border border-gray-800 hover:bg-gray-700" : "px-5 py-2 text-[11px] font-semibold uppercase tracking-wider border rounded transition-all"}
                      style={variant === "dark" ? { borderColor: "rgba(220,38,38,0.5)", background: "rgba(220,38,38,0.08)", color: "#dc2626" } : undefined}
                    >
                      Run Analysis
                    </button>
                  </div>
                </div>
              )}
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
