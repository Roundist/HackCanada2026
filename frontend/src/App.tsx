<<<<<<< HEAD
import { useCallback, useMemo, useRef, useState } from "react";
=======
import { useCallback, useEffect, useRef, useState } from "react";
>>>>>>> ec147a2ee4dbe0c062915b60d5ae25d3c521076f
import { ReactFlowProvider } from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import NeuralGraph from "./components/NeuralGraph";
import BusinessInput from "./components/BusinessInput";
import SupplyChainMap from "./components/SupplyChainMap";
import FindingsPanel from "./components/FindingsPanel";
import ExecutionSteps from "./components/ExecutionSteps";
import SurvivalPlan from "./components/SurvivalPlan";
<<<<<<< HEAD
=======
import AgentPipelineStatus from "./components/AgentPipelineStatus";
import AgentTerminalLog from "./components/AgentTerminalLog";
import IntelligencePreview from "./components/IntelligencePreview";
import RagTracePanel from "./components/RagTracePanel";
>>>>>>> ec147a2ee4dbe0c062915b60d5ae25d3c521076f
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
<<<<<<< HEAD
  const [activeLabel, setActiveLabel] = useState<string>("Ready for intake");
=======
  const [selectedProfile, setSelectedProfile] = useState<BusinessProfile | null>(() => businessProfiles[0] ?? null);
  const [tariffRatePct, setTariffRatePct] = useState(25);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
>>>>>>> ec147a2ee4dbe0c062915b60d5ae25d3c521076f
  const demoAbort = useRef<(() => void) | null>(null);
  const {
    agents,
    pipelineDone,
    finalResult,
    systemEvents,
    chainOfThoughtLog,
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
    setActiveLabel(description.slice(0, 48).trim() || "Custom brief");
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

  const showCollapsedLeft = view !== "input";

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
<<<<<<< HEAD
    <div className="h-screen w-screen flex flex-col overflow-hidden app-skin grid-bg">
      <header className="shrink-0 h-12 px-5 flex items-center justify-between border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border border-white/15 rounded-sm flex items-center justify-center text-[10px] font-mono text-white/70">
              ◉
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold tracking-[0.2em] uppercase">TariffTriage</span>
              <span className="text-[9px] text-white/30">AI Trade Intelligence</span>
            </div>
=======
    <div className="h-screen w-screen flex flex-col overflow-hidden grid-bg" style={{ background: "#0a0a0a" }}>
      {/* Top Bar — Cyberpunk theme */}
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
>>>>>>> ec147a2ee4dbe0c062915b60d5ae25d3c521076f
          </div>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/40">Bloomberg-grade neural ops</span>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono text-white/60">
          <span className="px-2 py-1 border border-white/10 rounded-sm tracking-widest">{headerStatus}</span>
          <span className="text-white/25">{new Date().toISOString().slice(0, 10)}</span>
        </div>
      </header>

<<<<<<< HEAD
      <main className="flex-1 overflow-hidden flex">
        <motion.aside
          initial={false}
          animate={{ width: showCollapsedLeft ? 90 : 240 }}
          transition={{ type: "spring", stiffness: 240, damping: 32 }}
          className="h-full border-r border-white/10 bg-black/30 backdrop-blur flex flex-col"
        >
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[0.26em] text-white/35">Business Input</div>
              {!showCollapsedLeft && (
                <div className="text-[11px] text-white/55 mt-0.5">Left rail is command console</div>
              )}
            </div>
            {showCollapsedLeft && (
              <span className="text-[9px] font-mono text-white/40 px-2 py-1 border border-white/10 rounded-sm truncate max-w-[120px]">
                {activeLabel}
              </span>
            )}
          </div>
=======
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* INPUT VIEW */}
          {view === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex"
            >
              {/* LEFT panel — Chain of Thought terminal + Supply Chain Map */}
              <div className="w-[400px] shrink-0 border-r border-white/[0.06] flex flex-col" style={{ background: "rgba(10,10,10,0.8)" }}>
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/25">Agent Intelligence Engine</div>
                </div>
                <div className="flex-1 min-h-0 flex flex-col" style={{ minHeight: 180 }}>
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
>>>>>>> ec147a2ee4dbe0c062915b60d5ae25d3c521076f

          {!showCollapsedLeft ? (
            <div className="flex-1 overflow-y-auto p-4">
              <BusinessInput onSubmit={handleSubmit} isRunning={view !== "input"} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-start py-6 gap-6 text-white/50">
              {agents.map((agent) => (
                <div key={agent.id} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-mono ${agent.status === "running" ? "status-blink" : ""}`}
                    style={{
                      borderColor: agent.color,
                      color: agent.color,
                      boxShadow: agent.status === "running" ? `0 0 0 6px ${agent.color}12` : undefined,
                    }}
                  >
                    {agent.icon}
                  </div>
<<<<<<< HEAD
                  <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/40">{agent.name.split(" ")[0]}</span>
=======
                  <BusinessInput
                    onSubmit={handleSubmit}
                    onSelectProfile={setSelectedProfile}
                    selectedProfile={selectedProfile}
                    isRunning={false}
                  />
>>>>>>> ec147a2ee4dbe0c062915b60d5ae25d3c521076f
                </div>
              ))}
            </div>
          )}
        </motion.aside>

<<<<<<< HEAD
        <div className="flex-1 flex min-w-0">
          <div className="flex-1 relative min-w-0">
            <AnimatePresence mode="wait">
              {view === "input" && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full flex items-center justify-center p-10"
                >
                  <div className="w-full max-w-5xl grid grid-cols-5 gap-6">
                    <div className="col-span-3 space-y-4">
                      <div className="border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                        <p className="text-[10px] font-mono uppercase tracking-[0.32em] text-white/45 mb-2">Intake Stage</p>
                        <h2 className="text-2xl font-semibold text-white">Trade Impact Assessment</h2>
                        <p className="text-sm text-white/55 mt-2 leading-relaxed max-w-xl">
                          Feed the system with your supply inputs, dependency map, and exposure. The five-agent neural network will light up and stream back tariff exposure, risk scenarios, and a survival blueprint.
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-[11px] font-mono">
                        {["HS CLASSIFIER", "RISK ENGINE", "SUPPLIER RADAR"].map((chip) => (
                          <div key={chip} className="border border-white/10 bg-black/30 px-3 py-2 uppercase tracking-[0.18em] text-white/60">{chip}</div>
                        ))}
                      </div>
                      <ExecutionSteps agents={agents} />
                    </div>
                    <div className="col-span-2 border border-white/10 bg-black/30 p-5">
                      <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/35 mb-3">Agent Roster</div>
                      <div className="space-y-2">
                        {agents.map((agent) => (
                          <div key={agent.id} className="flex items-center gap-3 border border-white/10 px-3 py-2 bg-white/5">
                            <div className="w-2 h-2 rounded-full" style={{ background: agent.color, opacity: 0.6 }} />
                            <div className="flex-1">
                              <div className="text-[12px] text-white/80">{agent.name}</div>
                              <div className="text-[10px] text-white/40 leading-tight line-clamp-1">{agent.description}</div>
                            </div>
                            <span className="text-[9px] font-mono text-white/25">IDLE</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
=======
              {/* RIGHT — Intelligence Preview (slider + alt suppliers + reactive metrics) */}
              <div className="w-[300px] shrink-0 border-l border-white/[0.06] flex flex-col" style={{ background: "rgba(10,10,10,0.8)" }}>
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
>>>>>>> ec147a2ee4dbe0c062915b60d5ae25d3c521076f

              {view === "analyzing" && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col"
                >
                  <div className="flex-1 relative">
                    <ReactFlowProvider>
                      <NeuralGraph
                        agents={agents}
                        onSelectAgent={setSelectedAgent}
                        selectedAgent={selectedAgent}
                      />
                    </ReactFlowProvider>
                    <div className="absolute top-4 left-4 px-3 py-2 border border-white/10 bg-black/50 text-[10px] font-mono tracking-[0.24em] uppercase text-white/60">
                      Neural Network Agent Graph
                    </div>
                  </div>
                  <div className="shrink-0 border-t border-white/10 bg-black/40 backdrop-blur px-4">
                    <ExecutionSteps agents={agents} />
                  </div>
                </motion.div>
              )}

<<<<<<< HEAD
              {view === "results" && finalResult && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full overflow-y-auto"
                >
                  <SurvivalPlan result={finalResult} onReset={handleReset} agents={agents} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <aside className="w-[280px] shrink-0 border-l border-white/10 bg-black/30 backdrop-blur min-h-0">
            <FindingsPanel agents={agents} pipelineDone={pipelineDone} systemEvents={systemEvents} />
          </aside>
        </div>
=======
              {/* RIGHT — Chain of Thought log + Live Findings */}
              <div className="w-[380px] shrink-0 border-l border-white/[0.06] flex flex-col" style={{ background: "rgba(10,10,10,0.8)" }}>
                <div className="shrink-0" style={{ minHeight: 200, maxHeight: 220 }}>
                  <AgentTerminalLog
                    log={chainOfThoughtLog}
                    isRunning={agents.some((a) => a.status === "running")}
                    isComplete={pipelineDone}
                  />
                </div>
                <div className="flex-1 min-h-0 overflow-hidden flex flex-col border-t border-white/[0.06]">
                  <FindingsPanel agents={agents} pipelineDone={pipelineDone} />
                </div>
                <RagTracePanel agents={agents} systemEvents={systemEvents} />
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
              className="h-full overflow-y-auto"
            >
              <SurvivalPlan result={finalResult} onReset={handleReset} sessionId={sessionId} />
            </motion.div>
          )}
        </AnimatePresence>
>>>>>>> ec147a2ee4dbe0c062915b60d5ae25d3c521076f
      </main>
    </div>
  );
}
