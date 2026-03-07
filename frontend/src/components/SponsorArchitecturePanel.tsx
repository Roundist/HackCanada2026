import { motion } from "framer-motion";
import type { ArchitectureEvent } from "../types";

interface SponsorArchitecturePanelProps {
  events: ArchitectureEvent[];
  pipelineDone: boolean;
}

const COMPONENT_COLORS: Record<ArchitectureEvent["component"], string> = {
  rag: "#0891b2",
  backboard: "#7c3aed",
  orchestration: "#f59e0b",
};

const COMPONENT_LABELS: Record<ArchitectureEvent["component"], string> = {
  rag: "RAG",
  backboard: "Backboard",
  orchestration: "Orchestrator",
};

export default function SponsorArchitecturePanel({
  events,
  pipelineDone,
}: SponsorArchitecturePanelProps) {
  const ragCount = events.filter((e) => e.component === "rag").length;
  const backboardCount = events.filter((e) => e.component === "backboard").length;
  const orchestrationCount = events.filter((e) => e.component === "orchestration").length;

  const recent = events.slice(-10);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono uppercase tracking-widest text-gray-600">
            Sponsor Architecture
          </span>
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-cyan-200 bg-cyan-50 text-cyan-700">
            RAG
          </span>
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-violet-200 bg-violet-50 text-violet-700">
            Backboard
          </span>
        </div>
        <span className="text-[8px] font-mono text-gray-500">
          {pipelineDone ? "stable" : "live"}
        </span>
      </div>

      <div className="grid grid-cols-3 border-b border-gray-200">
        <Metric label="RAG events" value={ragCount} color="#0891b2" />
        <Metric label="Backboard writes" value={backboardCount} color="#7c3aed" />
        <Metric label="Flow stages" value={orchestrationCount} color="#f59e0b" />
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {recent.length === 0 ? (
          <div className="text-[10px] font-mono text-gray-400 py-3 text-center">
            Waiting for architecture telemetry...
          </div>
        ) : (
          recent.map((evt, i) => (
            <motion.div
              key={`${evt.component}-${evt.step}-${evt.timestamp}-${i}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="border border-gray-200 rounded px-2 py-1.5 bg-gray-50"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="text-[8px] font-mono uppercase tracking-wider px-1 py-0.5 rounded text-white shrink-0"
                    style={{ background: COMPONENT_COLORS[evt.component] }}
                  >
                    {COMPONENT_LABELS[evt.component]}
                  </span>
                  <span className="text-[9px] font-mono text-gray-500 uppercase truncate">
                    {evt.step}
                  </span>
                </div>
                <span
                  className="text-[8px] font-mono uppercase tracking-wider shrink-0"
                  style={{
                    color:
                      evt.status === "complete"
                        ? "#16a34a"
                        : evt.status === "working"
                          ? "#2563eb"
                          : "#6b7280",
                  }}
                >
                  {evt.status}
                </span>
              </div>
              <div className="text-[10px] text-gray-700 mt-1">{evt.detail}</div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="px-2.5 py-2 border-r border-gray-200 last:border-r-0">
      <div className="text-[8px] font-mono uppercase tracking-wider text-gray-500">{label}</div>
      <div className="text-[13px] font-semibold mt-0.5" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
