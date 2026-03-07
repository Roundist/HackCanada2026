import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import NeuralGraph from "./components/NeuralGraph";
import BusinessInput from "./components/BusinessInput";
import SupplyChainMap from "./components/SupplyChainMap";
import FindingsPanel from "./components/FindingsPanel";
import ExecutionSteps from "./components/ExecutionSteps";
import SurvivalPlan from "./components/SurvivalPlan";
import AgentPipelineStatus from "./components/AgentPipelineStatus";
import AgentTerminalLog from "./components/AgentTerminalLog";
import IntelligencePreview from "./components/IntelligencePreview";
import RagTracePanel from "./components/RagTracePanel";
import { useAgentState } from "./hooks/useAgentState";
import { useWebSocket } from "./hooks/useWebSocket";
import { useTariffRates } from "./hooks/useTariffRates";
import { startAnalysis } from "./api/client";
import { runDemoSimulation } from "./api/demo";
import { businessProfiles } from "./data/businessProfiles";
import type { BusinessProfile } from "./data/businessProfiles";

type View = "input" | "analyzing" | "results";

export default function App() {
  const [view, setView] = useState<View>("input");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<BusinessProfile | null>(() => businessProfiles[0] ?? null);
  const [tariffRatePct, setTariffRatePct] = useState(25);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const demoAbort = useRef<(() => void) | null>(null);
  const {
    agents,
    pipelineDone,
    finalResult,
    systemEvents,
    chainOfThoughtLog,
    geopoliticalAlerts,
    hsClassifications,
    reasoningSteps,
    handleWSMessage,
    resetAgents,
  } = useAgentState();
  const { getRate: getTariffRate, loaded: tariffRatesLoaded } = useTariffRates();

  const onWSMessage = useCallback(
    (msg: Parameters<typeof handleWSMessage>[0]) => {
      handleWSMessage(msg);
      const isPipelineComplete =
        msg.type === "pipeline_done" || (msg as { event_type?: string }).event_type === "pipeline_complete";
      if (isPipelineComplete) {
        setTimeout(() => setView("results"), 1500);
      }
    },
    [handleWSMessage]
  );

  // Fallback: whenever pipeline is done and we have result, ensure we transition to results
  useEffect(() => {
    if (view !== "analyzing" || !pipelineDone || !finalResult) return;
    const t = setTimeout(() => setView("results"), 1200);
    return () => clearTimeout(t);
  }, [view, pipelineDone, finalResult]);

  const { connect } = useWebSocket(onWSMessage);

  const handleSubmit = async (description: string, profile?: BusinessProfile | null) => {
    if (profile) setSelectedProfile(profile);
    resetAgents();
    setView("analyzing");
    setSelectedAgent(null);
    setIsDemoMode(false);

    try {
      const { session_id } = await startAnalysis(description);
      setSessionId(session_id);
      connect(session_id);
    } catch {
      console.log("Backend unavailable, running demo simulation");
      setIsDemoMode(true);
      const activeProfile = profile ?? selectedProfile;
      demoAbort.current = runDemoSimulation(
        handleWSMessage,
        () => setTimeout(() => setView("results"), 1500),
        { revenue: activeProfile?.revenue, profile: activeProfile ?? undefined }
      );
    }
  };

  const handleReset = () => {
    demoAbort.current?.();
    demoAbort.current = null;
    setIsDemoMode(false);
    setSessionId(null);
    resetAgents();
    setView("input");
    setSelectedAgent(null);
  };

  const completedAgents = agents.filter((a) => a.status === "done");

  const headerStatus = useMemo(() => {
    if (view === "results") return "INTEL COMPLETE";
    if (view === "analyzing") {
      return pipelineDone
        ? "PIPELINE STABILIZED"
        : `${completedAgents.length}/${agents.length} AGENTS ACTIVE`;
    }
    return "STAGING";
  }, [view, pipelineDone, completedAgents.length, agents.length]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden grid-bg" style={{ background: "#0a0a0a" }}>
      <header className="shrink-0 h-11 px-4 flex items-center justify-between border-b border-white/[0.06]" style={{ background: "rgba(10,10,10,0.95)" }}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border flex items-center justify-center" style={{ borderColor: "#ff4d4d" }}>
              <div className="w-2 h-2" style={{ background: "#ff4d4d" }} />
            </div>
            <span className="text-xs font-semibold tracking-wider uppercase text-white/80">TariffTriage</span>
            <span className="text-[9px] font-mono text-white/20 ml-1">v2.0</span>
            {isDemoMode && (
              <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40" title="Pre-recorded demo — start the backend for real agent analysis">
                Demo
              </span>
            )}
          </div>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/40">Bloomberg-grade neural ops</span>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono text-white/60">
          <span className="px-2 py-1 border border-white/10 rounded-sm tracking-widest">{headerStatus}</span>
          <span className="text-white/25">{new Date().toISOString().slice(0, 10)}</span>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          {/* INPUT VIEW */}
          {view === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-full flex"
            >
              {/* LEFT panel — Chain of Thought terminal + Supply Chain Map */}
              <div className="w-[400px] shrink-0 border-r border-white/[0.06] flex flex-col min-h-full" style={{ background: "rgba(10,10,10,0.8)" }}>
                <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/25">Agent Intelligence Engine</div>
                </div>
                <div className="flex-1 flex flex-col min-h-[340px]" style={{ minHeight: 340 }}>
                  <AgentTerminalLog
                    log={chainOfThoughtLog}
                    isRunning={false}
                    isComplete={false}
                  />
                </div>
                <div className="border-t border-white/[0.06] p-4 flex-shrink-0 flex flex-col">
                  <SupplyChainMap
                    profile={selectedProfile}
                    highlightedCommodity={selectedProfile?.routes?.[0]?.commodity}
                    tariffRatePct={tariffRatePct}
                    getRate={tariffRatesLoaded ? getTariffRate : undefined}
                  />
                  <AgentPipelineStatus />
                </div>
              </div>

              {/* CENTER — Business Input */}
              <div className="flex-1 flex items-start justify-center p-8 min-w-0">
                <div className="w-full max-w-2xl space-y-6 py-4">
                  <div className="space-y-2 text-center">
                    <h2 className="text-xl font-semibold text-white/80 tracking-tight">
                      Trade Impact Assessment
                    </h2>
                    <p className="text-xs text-white/30 leading-relaxed max-w-md mx-auto">
                      Describe your Canadian business, supply chain dependencies, and import sources.
                      Our AI agents will analyze tariff exposure, geopolitical risk, and survival strategy.
                    </p>
                  </div>
                  <BusinessInput
                    onSubmit={handleSubmit}
                    onSelectProfile={setSelectedProfile}
                    selectedProfile={selectedProfile}
                    isRunning={false}
                  />
                </div>
              </div>

              {/* RIGHT — Intelligence Preview */}
              <div className="w-[300px] shrink-0 border-l border-white/[0.06] flex flex-col min-h-full" style={{ background: "rgba(10,10,10,0.8)" }}>
                <IntelligencePreview
                  profile={selectedProfile}
                  tariffRatePct={tariffRatePct}
                  onTariffRateChange={setTariffRatePct}
                  analysisComplete={false}
                  tariffRatesFromCbsa={tariffRatesLoaded}
                />
              </div>
            </motion.div>
          )}

          {/* ANALYZING VIEW */}
          {view === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-full flex"
            >
              {/* LEFT — Neural Graph + Execution Steps */}
              <div className="flex-1 relative flex flex-col">
                <div className="flex-1 relative">
                  <ReactFlowProvider>
                    <NeuralGraph
                      agents={agents}
                      onSelectAgent={setSelectedAgent}
                      selectedAgent={selectedAgent}
                    />
                  </ReactFlowProvider>
                </div>
                <div className="shrink-0 border-t border-white/[0.06]" style={{ background: "rgba(8,9,13,0.8)" }}>
                  <ExecutionSteps agents={agents} />
                </div>
              </div>

              {/* RIGHT — Chain of Thought log + Live Findings */}
              <div className="w-[380px] shrink-0 border-l border-white/[0.06] flex flex-col min-h-0 overflow-y-auto" style={{ background: "rgba(10,10,10,0.8)" }}>
                <div className="shrink-0 min-h-[200px]" style={{ maxHeight: 280 }}>
                  <AgentTerminalLog
                    log={chainOfThoughtLog}
                    isRunning={agents.some((a) => a.status === "running")}
                    isComplete={pipelineDone}
                  />
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto flex flex-col border-t border-white/[0.06]">
                  <FindingsPanel agents={agents} pipelineDone={pipelineDone} geopoliticalAlerts={geopoliticalAlerts} systemEvents={systemEvents} />
                </div>
                <RagTracePanel agents={agents} systemEvents={systemEvents} hsClassifications={hsClassifications} reasoningSteps={reasoningSteps} />
              </div>
            </motion.div>
          )}

          {/* RESULTS VIEW */}
          {view === "results" && finalResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-full overflow-y-auto overflow-x-hidden"
            >
              <SurvivalPlan result={finalResult} onReset={handleReset} sessionId={sessionId} hsClassifications={hsClassifications} reasoningSteps={reasoningSteps} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
