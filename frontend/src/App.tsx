import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import NeuralGraph from "./components/NeuralGraph";
import BusinessInput from "./components/BusinessInput";
import ExecutionSteps from "./components/ExecutionSteps";
import SurvivalPlan from "./components/SurvivalPlan";
import AgentTerminalLog from "./components/AgentTerminalLog";
import IntelligencePreview from "./components/IntelligencePreview";
import RagClassificationLive from "./components/RagClassificationLive";
import ProductSearch from "./components/ProductSearch";
import AgentIntelligencePanel from "./components/AgentIntelligencePanel";
import SupplyChainFlowTable from "./components/SupplyChainFlowTable";
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
    updateTariffImpact,
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
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
      <header className="shrink-0 h-12 px-4 flex items-center justify-between bg-white border-b border-gray-200">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center rounded bg-red-600">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-sm font-bold tracking-wide text-gray-900">TariffTriage</span>
            <span className="text-[10px] font-mono ml-1 text-gray-500">v2.0</span>
            {isDemoMode && (
              <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40" title="Pre-recorded demo — start the backend for real agent analysis">
                Demo
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-gray-600">
          <span className="px-2 py-1 border border-gray-200 rounded-sm tracking-widest text-gray-600">{headerStatus}</span>
          <span className="text-gray-400">{new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }).replace(/\//g, "/")}</span>
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
              className="min-h-full flex bg-gray-50"
            >
              {/* LEFT — Agent Intelligence Engine + Supply Chain Flow (light theme) */}
              <div className="w-[380px] shrink-0 border-r border-gray-200 flex flex-col min-h-full bg-white px-4 py-4 overflow-y-auto">
                <AgentIntelligencePanel />
                <SupplyChainFlowTable profile={selectedProfile} />
              </div>

              {/* CENTER — Trade Impact Assessment (light theme) */}
              <div className="flex-1 flex items-start justify-center p-8 min-w-0 bg-gray-50">
                <div className="w-full max-w-2xl space-y-6 py-4">
                  <div className="space-y-2 text-center">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                      Trade Impact Assessment
                    </h2>
                    <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
                      Analyze tariff exposure, geopolitical risk, and survival strategy for Canadian businesses with US supply chain dependencies.
                    </p>
                  </div>
                  <BusinessInput
                    onSubmit={handleSubmit}
                    onSelectProfile={setSelectedProfile}
                    selectedProfile={selectedProfile}
                    isRunning={false}
                    variant="light"
                  />
                  <ProductSearch variant="light" />
                </div>
              </div>

              {/* RIGHT — Intelligence Preview (light theme) */}
              <div className="w-[300px] shrink-0 border-l border-gray-200 flex flex-col min-h-full bg-white">
                <IntelligencePreview
                  profile={selectedProfile}
                  tariffRatePct={tariffRatePct}
                  onTariffRateChange={setTariffRatePct}
                  analysisComplete={false}
                  tariffRatesFromCbsa={tariffRatesLoaded}
                  variant="light"
                />
              </div>
            </motion.div>
          )}

          {/* ANALYZING VIEW — light theme */}
          {view === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-full flex bg-gray-50"
            >
              {/* LEFT — Neural Graph + Execution Steps */}
              <div className="flex-1 relative flex flex-col bg-white border-r border-gray-200">
                <div className="flex-1 relative">
                  <ReactFlowProvider>
                    <NeuralGraph
                      agents={agents}
                      onSelectAgent={setSelectedAgent}
                      selectedAgent={selectedAgent}
                    />
                  </ReactFlowProvider>
                </div>
                <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-2">
                  <ExecutionSteps agents={agents} />
                </div>
              </div>

              {/* RIGHT — Split: top half Chain of Thought + bottom half RAG Pipeline */}
              <div className="w-[420px] shrink-0 border-l border-gray-200 flex flex-col min-h-0 bg-white">
                {/* Chain of thought: fixed height */}
                <div className="shrink-0" style={{ height: 220 }}>
                  <AgentTerminalLog
                    log={chainOfThoughtLog}
                    isRunning={agents.some((a) => a.status === "running")}
                    isComplete={pipelineDone}
                  />
                </div>
                {/* RAG Pipeline — first-class, fills the rest */}
                <div className="flex-1 min-h-0 overflow-hidden border-t border-gray-200">
                  <RagClassificationLive
                    agents={agents}
                    systemEvents={systemEvents}
                    hsClassifications={hsClassifications}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* RESULTS VIEW — light theme */}
          {view === "results" && finalResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-full overflow-y-auto overflow-x-hidden bg-gray-50"
            >
              <SurvivalPlan result={finalResult} onReset={handleReset} sessionId={sessionId} hsClassifications={hsClassifications} reasoningSteps={reasoningSteps} variant="light" onTariffImpactUpdate={updateTariffImpact} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
