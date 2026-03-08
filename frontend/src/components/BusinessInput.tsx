import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  DatabaseZap,
  Radar,
  ScanSearch,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { businessProfiles } from "../data/businessProfiles";
import type { BusinessProfile } from "../data/businessProfiles";

interface BusinessInputProps {
  onSubmit: (description: string, profile?: BusinessProfile | null) => void;
  onSelectProfile?: (profile: BusinessProfile | null) => void;
  selectedProfile: BusinessProfile | null;
  isRunning: boolean;
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

const REQUIRED_FIELDS: Array<keyof FormData> = [
  "industry",
  "importSources",
  "usImportPct",
  "keyProducts",
];

const MISSION_SIGNALS = [
  {
    icon: Radar,
    title: "Supply Chain Mapping",
    detail: "Extract key inputs, origins, and bottlenecks",
  },
  {
    icon: ScanSearch,
    title: "HS + Tariff Classification",
    detail: "Match to CBSA code candidates with confidence",
  },
  {
    icon: DatabaseZap,
    title: "Exposure Simulation",
    detail: "Quantify tariff cost and margin impact",
  },
  {
    icon: ShieldAlert,
    title: "Strategy Output",
    detail: "Generate actions, timeline, and risk mitigation",
  },
];

const CONTEXT_PROMPTS = [
  "Most exposed input has no Canadian substitute today.",
  "Customer contracts limit our ability to pass on costs quickly.",
  "Our inventory runway is under 90 days for key US components.",
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

function FormField({
  label,
  required = false,
  hint,
  children,
  variant,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  variant: "dark" | "light";
}) {
  return (
    <div className="space-y-1">
      <label
        className={`text-[10px] font-mono uppercase tracking-widest ${
          variant === "light" ? "text-gray-600" : "text-white/50"
        }`}
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {hint && (
        <p
          className={`text-[9px] font-mono ${
            variant === "light" ? "text-gray-400" : "text-white/30"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
  variant,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  variant: "dark" | "light";
}) {
  return (
    <div className="flex items-start gap-2">
      <div
        className={`mt-0.5 h-5 w-5 rounded flex items-center justify-center ${
          variant === "light"
            ? "bg-cyan-50 text-cyan-600 border border-cyan-200"
            : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
        }`}
      >
        <Icon size={11} strokeWidth={2} />
      </div>
      <div>
        <div
          className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${
            variant === "light" ? "text-gray-800" : "text-white/75"
          }`}
        >
          {title}
        </div>
        <div
          className={`text-[10px] ${
            variant === "light" ? "text-gray-500" : "text-white/35"
          }`}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}

export default function BusinessInput({
  onSubmit,
  onSelectProfile,
  selectedProfile,
  isRunning,
  variant = "dark",
}: BusinessInputProps) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [mode, setMode] = useState<"form" | "demos">("form");
  const isLight = variant === "light";

  const update = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const composed = composeDescription(form);
  const requiredFilled = useMemo(
    () => REQUIRED_FIELDS.filter((field) => form[field].trim().length > 0).length,
    [form]
  );
  const readinessPct = Math.round((requiredFilled / REQUIRED_FIELDS.length) * 100);
  const canRun = composed.length >= 50 && form.industry !== "";

  const handleSubmit = () => {
    if (canRun) onSubmit(composed, null);
  };

  const handleSelectProfile = (profile: BusinessProfile) => {
    onSelectProfile?.(profile);
    setMode("demos");
  };

  const appendContextPrompt = (prompt: string) =>
    update(
      "additionalContext",
      form.additionalContext.trim().length > 0
        ? `${form.additionalContext.trim()} ${prompt}`
        : prompt
    );

  const inputClass = `w-full p-2.5 border rounded-md text-[12px] transition-colors focus:outline-none focus:border-cyan-500 ${
    isLight
      ? "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
      : "bg-[#141922] border-white/10 text-white/80 placeholder-white/25"
  }`;

  return (
    <div className="space-y-4">
      {!isRunning && (
        <>
          <div
            className={`rounded-xl border overflow-hidden ${
              isLight ? "border-gray-200 bg-white" : "border-white/10 bg-black/30"
            }`}
          >
            <div
              className={`px-3 py-2 border-b ${
                isLight
                  ? "border-gray-200 bg-[linear-gradient(110deg,#ecfeff,#f8fafc_48%,#fff7ed)]"
                  : "border-white/10 bg-[linear-gradient(110deg,rgba(6,28,36,0.9),rgba(15,23,42,0.8),rgba(42,18,10,0.75))]"
              }`}
            >
              <div
                className={`text-[9px] font-mono uppercase tracking-widest ${
                  isLight ? "text-cyan-700" : "text-cyan-300/80"
                }`}
              >
                Mission Intake
              </div>
              <div
                className={`text-sm font-semibold mt-0.5 ${
                  isLight ? "text-gray-900" : "text-white/85"
                }`}
              >
                Brief the War Room before launch
              </div>
              <div
                className={`text-[11px] mt-1 ${
                  isLight ? "text-gray-600" : "text-white/50"
                }`}
              >
                Stronger context in this form means sharper tariff classification, cleaner risk scoring, and higher-quality strategy output.
              </div>
            </div>

            <div className="p-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MISSION_SIGNALS.map((signal) => (
                  <div
                    key={signal.title}
                    className={`rounded-lg border px-2.5 py-2 ${
                      isLight ? "border-gray-200 bg-gray-50/85" : "border-white/10 bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <signal.icon
                        size={12}
                        className={isLight ? "text-cyan-600" : "text-cyan-300"}
                      />
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider ${
                          isLight ? "text-gray-800" : "text-white/75"
                        }`}
                      >
                        {signal.title}
                      </span>
                    </div>
                    <p
                      className={`text-[10px] mt-1 leading-snug ${
                        isLight ? "text-gray-500" : "text-white/40"
                      }`}
                    >
                      {signal.detail}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-dashed border-cyan-300/60 bg-cyan-50/60 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-800">
                    Brief readiness
                  </div>
                  <div className="text-[11px] font-semibold text-cyan-900">{readinessPct}%</div>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-cyan-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                    style={{ width: `${Math.max(8, readinessPct)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`flex gap-2 border-b pb-2 ${isLight ? "border-gray-200" : "border-white/10"}`}>
            <button
              type="button"
              onClick={() => setMode("form")}
              className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded ${
                mode === "form"
                  ? isLight
                    ? "bg-gray-900 text-white"
                    : "bg-white/10 text-white"
                  : isLight
                  ? "text-gray-500 hover:text-gray-700"
                  : "text-white/40 hover:text-white/65"
              }`}
            >
              Custom Brief
            </button>
            <button
              type="button"
              onClick={() => setMode("demos")}
              className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded ${
                mode === "demos"
                  ? isLight
                    ? "bg-gray-900 text-white"
                    : "bg-white/10 text-white"
                  : isLight
                  ? "text-gray-500 hover:text-gray-700"
                  : "text-white/40 hover:text-white/65"
              }`}
            >
              Demo Scenarios
            </button>
          </div>

          {mode === "form" && (
            <div
              className={`rounded-xl border p-4 space-y-4 ${
                isLight
                  ? "border-gray-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] shadow-sm"
                  : "border-white/10 bg-[linear-gradient(180deg,rgba(15,17,23,0.88),rgba(8,12,18,0.9))]"
              }`}
            >
              <SectionTitle
                icon={Sparkles}
                title="Company Snapshot"
                subtitle="Who you are and baseline operating profile"
                variant={variant}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Company Name" hint="Optional" variant={variant}>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                    placeholder="e.g. Maple Furniture Co."
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Industry" required variant={variant}>
                  <select
                    value={form.industry}
                    onChange={(e) => update("industry", e.target.value)}
                    className={`${inputClass} appearance-none cursor-pointer`}
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
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
                </FormField>
                <FormField label="Location (Province/City)" variant={variant}>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                    placeholder="e.g. Ontario, Vancouver"
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Annual Revenue" variant={variant}>
                  <input
                    type="text"
                    value={form.revenue}
                    onChange={(e) => update("revenue", e.target.value)}
                    placeholder="e.g. $8M, $500K"
                    className={inputClass}
                  />
                </FormField>
              </div>

              <SectionTitle
                icon={Radar}
                title="Trade Exposure"
                subtitle="Inputs, sourcing concentration, and tariff sensitivity"
                variant={variant}
              />
              <FormField
                label="Import Sources & Materials"
                required
                hint="Mention inputs + source locations"
                variant={variant}
              >
                <textarea
                  value={form.importSources}
                  onChange={(e) => update("importSources", e.target.value)}
                  placeholder="e.g. hardwood lumber from Michigan, steel hardware from Ohio, upholstery fabrics from North Carolina"
                  className={`${inputClass} resize-y min-h-[84px]`}
                  rows={3}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  label="% of Inputs from US"
                  required
                  hint="Approximate percentage"
                  variant={variant}
                >
                  <input
                    type="text"
                    value={form.usImportPct}
                    onChange={(e) => update("usImportPct", e.target.value)}
                    placeholder="e.g. 65"
                    className={inputClass}
                  />
                </FormField>
                <FormField
                  label="Key Products / Services"
                  required
                  hint="What drives most of your revenue"
                  variant={variant}
                >
                  <input
                    type="text"
                    value={form.keyProducts}
                    onChange={(e) => update("keyProducts", e.target.value)}
                    placeholder="e.g. custom furniture, IoT devices"
                    className={inputClass}
                  />
                </FormField>
              </div>

              <SectionTitle
                icon={ShieldAlert}
                title="Commercial Context"
                subtitle="Margin guardrails and go-to-market constraints"
                variant={variant}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Profit Margins (%)" hint="Approximate range" variant={variant}>
                  <input
                    type="text"
                    value={form.margins}
                    onChange={(e) => update("margins", e.target.value)}
                    placeholder="e.g. 18-22"
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Employees" variant={variant}>
                  <input
                    type="text"
                    value={form.employees}
                    onChange={(e) => update("employees", e.target.value)}
                    placeholder="e.g. 45"
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Sales / Export Markets" variant={variant}>
                  <input
                    type="text"
                    value={form.exportMarkets}
                    onChange={(e) => update("exportMarkets", e.target.value)}
                    placeholder="e.g. 70% Canada, 25% US"
                    className={inputClass}
                  />
                </FormField>
                <div className="space-y-1">
                  <div
                    className={`text-[10px] font-mono uppercase tracking-widest ${
                      isLight ? "text-gray-600" : "text-white/50"
                    }`}
                  >
                    Quick context prompts
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CONTEXT_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => appendContextPrompt(prompt)}
                        className={`text-[9px] px-2 py-1 rounded-full border ${
                          isLight
                            ? "border-gray-300 bg-white text-gray-600 hover:border-cyan-300 hover:text-cyan-700"
                            : "border-white/15 bg-white/[0.03] text-white/55 hover:text-cyan-200 hover:border-cyan-300/30"
                        }`}
                      >
                        + {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <FormField
                label="Additional Context"
                hint="Optional: constraints, customer pressure, supplier risks"
                variant={variant}
              >
                <textarea
                  value={form.additionalContext}
                  onChange={(e) => update("additionalContext", e.target.value)}
                  placeholder="Anything else the agents should consider..."
                  className={`${inputClass} resize-y min-h-[68px]`}
                  rows={3}
                />
              </FormField>

              <div className={`pt-3 border-t ${isLight ? "border-gray-200" : "border-white/10"} space-y-2`}>
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <div className={isLight ? "text-gray-600" : "text-white/45"}>
                    {canRun
                      ? "Brief ready. Agents can now execute with full context."
                      : "Add industry plus core trade exposure details to unlock launch."}
                  </div>
                  <div
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-mono ${
                      canRun
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : isLight
                        ? "border-gray-200 bg-gray-50 text-gray-500"
                        : "border-white/15 bg-white/[0.02] text-white/40"
                    }`}
                  >
                    <CheckCircle2 size={11} />
                    {Math.max(0, composed.length)} chars
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canRun}
                  className="w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  Launch War-Room Analysis
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {mode === "demos" && (
            <div className="space-y-3">
              <p className={`text-[11px] ${isLight ? "text-gray-500" : "text-white/40"}`}>
                Pick a pre-modeled scenario to demo fast. We’ll preload a rich business brief and launch immediately.
              </p>
              <div className="space-y-2">
                {businessProfiles.map((profile) => (
                  <button
                    type="button"
                    key={profile.id}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelectProfile(profile);
                    }}
                    className={`w-full text-left border rounded-lg px-3 py-3 transition-colors ${
                      selectedProfile?.id === profile.id
                        ? "border-red-500/50 bg-red-50/80 ring-1 ring-red-500/20"
                        : isLight
                        ? "border-gray-200 bg-gray-50/70 hover:border-gray-300"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-gray-900 truncate">
                          {profile.name}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {profile.industry} · {profile.imports} · {profile.revenue}
                        </div>
                      </div>
                      <span
                        className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                          profile.risk.toLowerCase() === "high"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {profile.risk}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedProfile ? (
                <div className="pt-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => onSubmit(selectedProfile.description, selectedProfile)}
                    className="w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    Launch Demo War Room
                    <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 pt-1">
                  Select a profile above to launch.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {isRunning && (
        <div className="text-[10px] font-mono text-white/45 uppercase tracking-[0.28em]">
          Intake collapsed while agents execute.
        </div>
      )}
    </div>
  );
}
