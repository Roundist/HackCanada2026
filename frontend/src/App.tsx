import { useCallback, useRef, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import NeuralGraph from "./components/NeuralGraph";
import BusinessInput from "./components/BusinessInput";
import AgentFeed from "./components/AgentFeed";
import SurvivalPlan from "./components/SurvivalPlan";
import { useAgentState } from "./hooks/useAgentState";
import { useWebSocket } from "./hooks/useWebSocket";
import { startAnalysis } from "./api/client";
import { runDemoSimulation } from "./api/demo";

type View = "input" | "analyzing" | "results";

export default function App() {
  const [view, setView] = useState<View>("input");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const demoAbort = useRef<(() => void) | null>(null);
  const { agents, pipelineDone, finalResult, handleWSMessage, resetAgents } =
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
    setSelectedAgent(null);

    try {
      const { session_id } = await startAnalysis(description);
      connect(session_id);
    } catch {
      // Backend not available — run demo simulation
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

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: "#0a0a0f" }}>
      {/* Header */}
      <header className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-indigo-500/20">
            T
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white/90">
              Tariff Triage
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-wider text-white/25">
              Trade War Survival Platform
            </p>
          </div>
        </div>

        {view === "analyzing" && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-mono text-white/30">
              {pipelineDone ? "Analysis Complete" : "Agents Working"}
            </span>
          </div>
        )}
      </header>

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
              className="h-full flex items-center justify-center p-8"
            >
              <div className="w-full max-w-4xl space-y-8">
                {/* Hero */}
                <div className="text-center space-y-4">
                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-4xl font-extrabold bg-gradient-to-r from-white via-white/80 to-indigo-300 bg-clip-text text-transparent"
                  >
                    Survive the Tariff Storm
                  </motion.h2>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-sm text-white/30 max-w-lg mx-auto"
                  >
                    Our AI agents analyze your supply chain, calculate tariff exposure,
                    scout alternative suppliers, and build your personalized survival plan.
                  </motion.p>

                  {/* Agent preview */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-center gap-3 mt-6"
                  >
                    {agents.map((agent, i) => (
                      <div key={agent.id} className="flex items-center gap-3">
                        <div
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                          style={{
                            background: `${agent.color}10`,
                            border: `1px solid ${agent.color}25`,
                          }}
                        >
                          <span className="text-sm">{agent.icon}</span>
                          <span className="text-[10px] font-mono text-white/40">
                            {agent.name}
                          </span>
                        </div>
                        {i < agents.length - 1 && (
                          <span className="text-white/10 text-xs">{">"}</span>
                        )}
                      </div>
                    ))}
                  </motion.div>
                </div>

                {/* Input Form */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <BusinessInput onSubmit={handleSubmit} isRunning={false} />
                </motion.div>
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
              className="h-full flex"
            >
              {/* Neural Graph - main area */}
              <div className="flex-1 relative">
                <ReactFlowProvider>
                  <NeuralGraph
                    agents={agents}
                    onSelectAgent={setSelectedAgent}
                    selectedAgent={selectedAgent}
                  />
                </ReactFlowProvider>
              </div>

              {/* Live Feed - right sidebar */}
              <div
                className="w-72 shrink-0 border-l border-white/[0.04]"
                style={{ background: "rgba(12,12,18,0.8)" }}
              >
                <AgentFeed agents={agents} />
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
              <div className="max-w-4xl mx-auto py-8">
                <SurvivalPlan result={finalResult} onReset={handleReset} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
