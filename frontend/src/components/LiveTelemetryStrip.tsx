import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type {
  AgentInfo,
  ArchitectureEvent,
  HsClassification,
  SystemEvent,
} from "../types";

interface LiveTelemetryStripProps {
  agents: AgentInfo[];
  architectureEvents: ArchitectureEvent[];
  systemEvents: SystemEvent[];
  hsClassifications: HsClassification[];
  pipelineDone: boolean;
}

function formatElapsed(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function LiveTelemetryStrip({
  agents,
  architectureEvents,
  systemEvents,
  hsClassifications,
  pipelineDone,
}: LiveTelemetryStripProps) {
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const runningCount = agents.filter((a) => a.status === "running").length;
  const doneCount = agents.filter((a) => a.status === "done").length;
  const errorCount = agents.filter((a) => a.status === "error").length;
  const ragCount = architectureEvents.filter((e) => e.component === "rag").length;
  const backboardCount = architectureEvents.filter(
    (e) => e.component === "backboard"
  ).length;
  const stageCount = architectureEvents.filter(
    (e) => e.component === "orchestration"
  ).length;

  const latestOrchestration = useMemo(() => {
    const orchestrationEvents = architectureEvents.filter(
      (e) => e.component === "orchestration"
    );
    return orchestrationEvents[orchestrationEvents.length - 1];
  }, [architectureEvents]);

  const currentPhase = useMemo(() => {
    if (pipelineDone) return "Final report compiled";
    if (latestOrchestration?.detail) return latestOrchestration.detail;
    const runningAgents = agents.filter((a) => a.status === "running");
    if (runningAgents.length > 0) {
      return `Running: ${runningAgents.map((a) => a.name).join(", ")}`;
    }
    return "Awaiting telemetry";
  }, [agents, latestOrchestration, pipelineDone]);

  const latestSignal = useMemo(() => {
    const latestArchitecture = architectureEvents[architectureEvents.length - 1];
    if (latestArchitecture) return latestArchitecture.detail;
    const latestSystem = systemEvents[systemEvents.length - 1];
    return latestSystem?.message || "Telemetry stream standing by...";
  }, [architectureEvents, systemEvents]);

  const firstSignalTs =
    architectureEvents[0]?.timestamp || systemEvents[0]?.timestamp || nowMs;
  const elapsedSecs = Math.max(0, Math.floor((nowMs - firstSignalTs) / 1000));

  return (
    <div className="shrink-0 border-b border-gray-200 bg-[linear-gradient(90deg,rgba(240,249,255,0.75),rgba(255,255,255,0.95),rgba(250,245,255,0.8))]">
      <div className="h-12 px-3 flex items-center gap-2 overflow-hidden">
        <span className="text-[9px] font-mono uppercase tracking-widest text-gray-600 shrink-0">
          Live Telemetry
        </span>
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
          animate={{ opacity: pipelineDone ? 0.8 : [0.35, 1, 0.35] }}
          transition={{ duration: 1.4, repeat: pipelineDone ? 0 : Infinity }}
        />

        <Metric label="Agents" value={`${doneCount}/${agents.length}`} color="#0f766e" />
        <Metric label="Active" value={`${runningCount}`} color="#2563eb" />
        <Metric label="Errors" value={`${errorCount}`} color={errorCount > 0 ? "#dc2626" : "#6b7280"} />
        <Metric label="RAG" value={`${ragCount}`} color="#0891b2" />
        <Metric label="Backboard" value={`${backboardCount}`} color="#7c3aed" />
        <Metric label="Stages" value={`${stageCount}`} color="#f59e0b" />
        <Metric label="HS" value={`${hsClassifications.length}`} color="#0ea5e9" />
        <Metric label="Elapsed" value={formatElapsed(elapsedSecs)} color="#374151" />

        <div className="min-w-0 flex-1 h-7 border border-gray-200 rounded bg-white/80 px-2 flex items-center overflow-hidden">
          <span className="text-[9px] font-mono uppercase tracking-wider text-gray-400 mr-2 shrink-0">
            Phase
          </span>
          <span className="text-[10px] text-gray-700 truncate">{currentPhase}</span>
        </div>
        <div className="min-w-0 flex-1 h-7 border border-gray-200 rounded bg-white/80 px-2 flex items-center overflow-hidden">
          <span className="text-[9px] font-mono uppercase tracking-wider text-gray-400 mr-2 shrink-0">
            Signal
          </span>
          <span className="text-[10px] text-gray-700 truncate">{latestSignal}</span>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="h-7 px-2 rounded border border-gray-200 bg-white/85 flex items-center gap-1.5 shrink-0">
      <span className="text-[8px] font-mono uppercase tracking-wider text-gray-500">
        {label}
      </span>
      <span className="text-[11px] font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
