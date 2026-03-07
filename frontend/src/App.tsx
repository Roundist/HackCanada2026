import { useCallback, useRef, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import NeuralGraph from "./components/NeuralGraph";
import BusinessInput from "./components/BusinessInput";
import FindingsPanel from "./components/FindingsPanel";
import ExecutionSteps from "./components/ExecutionSteps";
import SurvivalPlan from "./components/SurvivalPlan";
import SupplyChainFlow from "./components/SupplyChainFlow";
import RagTracePanel from "./components/RagTracePanel";
import { useAgentState } from "./hooks/useAgentState";
import { useWebSocket } from "./hooks/useWebSocket";
import { startAnalysis } from "./api/client";
import { runDemoSimulation } from "./api/demo";

type View = "input" | "analyzing" | "results";

export default function App() {
  const [view, setView] = useState<View>("input");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
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

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden grid-bg" style={{ background: "#06070a" }}>
      {/* Top Bar */}
      <header className="shrink-0 h-11 px-4 flex items-center justify-between border-b border-white/[0.06]" style={{ background: "rgba(10,11,16,0.95)" }}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border border-accent-red flex items-center justify-center">
              <div className="w-2 h-2 bg-accent-red" />
            </div>
            <span className="text-xs font-semibold tracking-wider uppercase text-white/80">TariffTriage</span>
            <span className="text-[9px] font-mono text-white/20 ml-1">v2.0</span>
          </div>
          <div className="h-4 w-px bg-white/[0.06]" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/25">
            AI Trade Intelligence Platform
          </span>
        </div>

        <div className="flex items-center gap-4">
          {view === "analyzing" && (
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${pipelineDone ? "bg-accent-green" : "bg-accent-red status-blink"}`} />
              <span className="text-[10px] font-mono text-white/30">
                {pipelineDone ? "ANALYSIS COMPLETE" : `${completedAgents.length}/${agents.length} AGENTS`}
              </span>
            </div>
          )}
          <span className="text-[10px] font-mono text-white/15">
            {new Date().toISOString().slice(0, 10)}
          </span>
        </div>
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
              className="h-full flex"
            >
              {/* LEFT panel — Agent Engine + Supply Chain Flow */}
              <div className="w-[340px] shrink-0 border-r border-white/[0.06] flex flex-col" style={{ background: "rgba(8,9,13,0.6)" }}>
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/25">Agent Intelligence Engine</div>
                </div>
                <div className="flex-1 p-3 space-y-1 overflow-y-auto">
                  {agents.map((agent) => (
                    <div key={agent.id} className="flex items-center gap-3 px-3 py-2.5 border border-white/[0.04]" style={{ background: "rgba(15,17,23,0.5)" }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: agent.color, opacity: 0.4 }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium text-white/50">{agent.name}</div>
                        <div className="text-[9px] font-mono text-white/20 mt-0.5 truncate">{agent.description}</div>
                      </div>
                      <div className="text-[8px] font-mono text-white/15 uppercase shrink-0">Standby</div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/[0.06] p-4">
                  <SupplyChainFlow />
                </div>
              </div>

              {/* CENTER — Business Input */}
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-2xl space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-white/80 tracking-tight">
                      Trade Impact Assessment
                    </h2>
                    <p className="text-xs text-white/30 leading-relaxed max-w-md">
                      Describe your Canadian business, supply chain dependencies, and import sources.
                      Our AI agents will analyze tariff exposure, geopolitical risk, and survival strategy.
                    </p>
                  </div>
                  <BusinessInput onSubmit={handleSubmit} isRunning={false} />
                </div>
              </div>

              {/* RIGHT — Intel Preview */}
              <div className="w-[280px] shrink-0 border-l border-white/[0.06] flex flex-col" style={{ background: "rgba(8,9,13,0.6)" }}>
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/25">Intelligence Preview</div>
                </div>
                <div className="flex-1 p-4 space-y-3">
                  {[
                    { label: "Current Tariff Rate", value: "25%", sub: "US imports to Canada", color: "#dc2626" },
                    { label: "Affected Sectors", value: "12", sub: "Manufacturing, Food, Tech", color: "#d97706" },
                    { label: "Avg Margin Erosion", value: "8.4%", sub: "Cross-sector average", color: "#dc2626" },
                    { label: "Alt Suppliers Available", value: "--", sub: "Awaiting analysis", color: "#16a34a" },
                    { label: "Confidence Score", value: "--", sub: "Awaiting analysis", color: "#2563eb" },
                  ].map((item) => (
                    <div key={item.label} className="border border-white/[0.04] p-3" style={{ background: "rgba(15,17,23,0.5)" }}>
                      <div className="text-[9px] font-mono uppercase tracking-wider text-white/20">{item.label}</div>
                      <div className="text-lg font-semibold mt-1" style={{ color: item.value === "--" ? "rgba(255,255,255,0.12)" : item.color }}>{item.value}</div>
                      <div className="text-[9px] font-mono text-white/15 mt-0.5">{item.sub}</div>
                    </div>
                  ))}
                </div>
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

              {/* RIGHT — Live Findings */}
              <div className="w-[360px] shrink-0 border-l border-white/[0.06] flex flex-col" style={{ background: "rgba(8,9,13,0.6)" }}>
                <div className="flex-1 min-h-0">
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
              <SurvivalPlan result={finalResult} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
