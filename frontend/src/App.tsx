import { useCallback, useMemo, useRef, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import NeuralGraph from "./components/NeuralGraph";
import BusinessInput from "./components/BusinessInput";
import FindingsPanel from "./components/FindingsPanel";
import ExecutionSteps from "./components/ExecutionSteps";
import SurvivalPlan from "./components/SurvivalPlan";
import { useAgentState } from "./hooks/useAgentState";
import { useWebSocket } from "./hooks/useWebSocket";
import { startAnalysis } from "./api/client";
import { runDemoSimulation } from "./api/demo";

type View = "input" | "analyzing" | "results";

export default function App() {
  const [view, setView] = useState<View>("input");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [activeLabel, setActiveLabel] = useState<string>("Ready for intake");
  const demoAbort = useRef<(() => void) | null>(null);
  const {
    agents,
    pipelineDone,
    finalResult,
    systemEvents,
    handleWSMessage,
    resetAgents,
  } =
    useAgentState();

  const onWSMessage = useCallback(
    (msg: Parameters<typeof handleWSMessage>[0]) => {
      handleWSMessage(msg);
      if (msg.type === "pipeline_done") {
        setTimeout(() => setView("results"), 1500);
      }
    },
    [handleWSMessage]
  );

  const { connect } = useWebSocket(onWSMessage);

  const handleSubmit = async (description: string) => {
    resetAgents();
    setView("analyzing");
    setActiveLabel(description.slice(0, 48).trim() || "Custom brief");
    setSelectedAgent(null);

    try {
      const { session_id } = await startAnalysis(description);
      connect(session_id);
    } catch {
      console.log("Backend unavailable, running demo simulation");
      demoAbort.current = runDemoSimulation(handleWSMessage, () =>
        setTimeout(() => setView("results"), 1500)
      );
    }
  };

  const handleReset = () => {
    demoAbort.current?.();
    demoAbort.current = null;
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
          </div>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/40">Bloomberg-grade neural ops</span>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono text-white/60">
          <span className="px-2 py-1 border border-white/10 rounded-sm tracking-widest">{headerStatus}</span>
          <span className="text-white/25">{new Date().toISOString().slice(0, 10)}</span>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex">
        <motion.aside
          initial={false}
          animate={{ width: showCollapsedLeft ? 86 : 320 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
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
                  <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/40">{agent.name.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          )}
        </motion.aside>

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
      </main>
    </div>
  );
}
