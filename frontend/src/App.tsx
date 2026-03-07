import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BusinessInput from "./components/BusinessInput";
import ExecutionSteps from "./components/ExecutionSteps";
import SurvivalPlan from "./components/SurvivalPlan";
import AgentTerminalLog from "./components/AgentTerminalLog";
import IntelligencePreview from "./components/IntelligencePreview";
import RagClassificationLive from "./components/RagClassificationLive";
import ProductSearch from "./components/ProductSearch";
import AgentIntelligencePanel from "./components/AgentIntelligencePanel";
import SupplyChainFlowTable from "./components/SupplyChainFlowTable";
import RoutesMap from "./components/RoutesMap";
import { ReactFlowProvider } from "@xyflow/react";
import NeuralGraph from "./components/NeuralGraph";
import { useAgentState } from "./hooks/useAgentState";
import { useWebSocket } from "./hooks/useWebSocket";
import { startAnalysis } from "./api/client";
import { runDemoSimulation } from "./api/demo";
import type { BusinessProfile } from "./data/businessProfiles";

type View = "input" | "analyzing" | "results";

export default function App() {
  const [view, setView] = useState<View>("input");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<BusinessProfile | null>(null);
  const [tariffRatesLoaded, setTariffRatesLoaded] = useState(false);
  const [tariffRatePct, setTariffRatePct] = useState(25);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
    setIsDemoMode(false);
    setSubmitError(null);

    try {
      const { session_id } = await startAnalysis(description);
      setSessionId(session_id);
      connect(session_id);
    } catch {
      if (profile == null) {
        setSubmitError("Backend is required for custom business. Start the server (see README) or use a demo profile.");
        setView("input");
        return;
      }
      console.log("Backend unavailable, running demo simulation for selected profile");
      setIsDemoMode(true);
      demoAbort.current = runDemoSimulation(
        handleWSMessage,
        () => setTimeout(() => setView("results"), 1500),
        { revenue: profile.revenue, profile }
      );
    }
  };

  const handleReset = () => {
    demoAbort.current?.();
    demoAbort.current = null;
    setIsDemoMode(false);
    setSessionId(null);
    setSubmitError(null);
    resetAgents();
    setView("input");
  };

  const completedAgents = agents.filter((a) => a.status === "done");

  const headerStatus = useMemo(() => {
    if (view === "results") return "Done";
    if (view === "analyzing") {
      return pipelineDone
        ? "Building report…"
        : `Step ${completedAgents.length + 1} of ${agents.length}`;
    }
    return "Ready";
  }, [view, pipelineDone, completedAgents.length, agents.length]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
      <header className="shrink-0 h-11 px-4 flex items-center justify-between bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 flex items-center justify-center rounded bg-red-600">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">TariffTriage</span>
          <span className="text-[9px] text-gray-400 font-normal">v2.0</span>
          {isDemoMode && (
            <span className="px-1.5 py-0.5 rounded text-[9px] uppercase bg-amber-50 text-amber-700 border border-amber-200" title="Pre-recorded demo — start the backend for real agent analysis">
              Demo
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          {view !== "input" && (
            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600">{headerStatus}</span>
          )}
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {/* INPUT VIEW — single centered column */}
          {view === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex"
            >
              {/* LEFT — Distinct panel: solid background so it reads on small screens */}
              <div className="w-[280px] shrink-0 border-r-2 border-gray-200 flex flex-col min-h-full bg-gray-50 px-3 py-4 overflow-y-auto">
                <AgentIntelligencePanel selectedProfile={selectedProfile} />
                <div className="mt-3 flex-shrink-0 overflow-hidden min-h-0">
                  <RoutesMap size="compact" variant="light" className="w-full" />
                </div>
                <SupplyChainFlowTable profile={selectedProfile} />
              </div>

              {/* CENTER — Middle band + white card so three panels are obvious */}
              <div className="flex-1 overflow-y-auto min-w-0 bg-gray-200">
                <div className="min-h-full flex justify-center py-6 px-6">
                <div className="w-full max-w-xl bg-white rounded-xl border border-gray-200 shadow-md p-6 space-y-5">
                  {submitError && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-800">
                      {submitError}
                    </div>
                  )}
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">
                      Trade Impact Assessment
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Select a demo profile or enter your business. The panels left and right update to show supply chain and impact preview.
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
              </div>

              {/* RIGHT — Distinct panel: solid background + border */}
              <div className="w-[260px] shrink-0 border-l-2 border-gray-200 flex flex-col min-h-full bg-gray-50">
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
              className="absolute inset-0 flex bg-gray-50"
            >
              {/* LEFT — Neural Graph + Execution Steps */}
              <div className="flex-1 relative flex flex-col bg-white border-r border-gray-200 min-w-0">
                <div className="flex-1 relative min-h-0">
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

              {/* RIGHT — Chain of Thought (top) + RAG Pipeline (bottom) */}
              <div className="w-[420px] shrink-0 border-l border-gray-200 flex flex-col overflow-hidden bg-white">
                {/* Chain of thought: fixed height */}
                <div className="shrink-0" style={{ height: 220 }}>
                  <AgentTerminalLog
                    log={chainOfThoughtLog}
                    isRunning={agents.some((a) => a.status === "running")}
                    isComplete={pipelineDone}
                  />
                </div>
                {/* RAG Pipeline — fills the rest, scrolls internally */}
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
              className="absolute inset-0 bg-gray-50"
              style={{ overflow: "auto" }}
            >
              <SurvivalPlan result={finalResult} onReset={handleReset} sessionId={sessionId} hsClassifications={hsClassifications} reasoningSteps={reasoningSteps} variant="light" onTariffImpactUpdate={updateTariffImpact} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
