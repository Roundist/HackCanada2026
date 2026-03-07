import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeTypes,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import AgentNodeComponent from "./AgentNode";
import type { AgentInfo } from "../types";

interface NeuralGraphProps {
  agents: AgentInfo[];
  onSelectAgent: (id: string | null) => void;
  selectedAgent: string | null;
}

const nodeTypes: NodeTypes = {
  agent: AgentNodeComponent as unknown as NodeTypes["agent"],
};

export default function NeuralGraph({ agents, onSelectAgent, selectedAgent }: NeuralGraphProps) {
  const onSelect = useCallback(
    (id: string) => {
      onSelectAgent(selectedAgent === id ? null : id);
    },
    [onSelectAgent, selectedAgent]
  );

  const nodes: Node[] = useMemo(() => {
    const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));
    return [
      {
        id: "supply_chain",
        type: "agent",
        position: { x: 300, y: 0 },
        data: {
          ...agentMap["supply_chain"],
          label: agentMap["supply_chain"].name,
          isSelected: selectedAgent === "supply_chain",
          onSelect,
        },
        draggable: false,
      },
      {
        id: "tariff_calculator",
        type: "agent",
        position: { x: 80, y: 180 },
        data: {
          ...agentMap["tariff_calculator"],
          label: agentMap["tariff_calculator"].name,
          isSelected: selectedAgent === "tariff_calculator",
          onSelect,
        },
        draggable: false,
      },
      {
        id: "geopolitical",
        type: "agent",
        position: { x: 520, y: 180 },
        data: {
          ...agentMap["geopolitical"],
          label: agentMap["geopolitical"].name,
          isSelected: selectedAgent === "geopolitical",
          onSelect,
        },
        draggable: false,
      },
      {
        id: "supplier_scout",
        type: "agent",
        position: { x: 80, y: 370 },
        data: {
          ...agentMap["supplier_scout"],
          label: agentMap["supplier_scout"].name,
          isSelected: selectedAgent === "supplier_scout",
          onSelect,
        },
        draggable: false,
      },
      {
        id: "strategy",
        type: "agent",
        position: { x: 300, y: 530 },
        data: {
          ...agentMap["strategy"],
          label: agentMap["strategy"].name,
          isSelected: selectedAgent === "strategy",
          onSelect,
        },
        draggable: false,
      },
    ];
  }, [agents, selectedAgent, onSelect]);

  const edges: Edge[] = useMemo(() => {
    const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

    const makeEdge = (source: string, target: string): Edge => {
      const sourceAgent = agentMap[source];
      const targetAgent = agentMap[target];
      const isFlowing =
        sourceAgent?.status === "done" &&
        (targetAgent?.status === "running" || targetAgent?.status === "done");
      const isDone = sourceAgent?.status === "done" && targetAgent?.status === "done";

      return {
        id: `${source}-${target}`,
        source,
        target,
        animated: isFlowing && !isDone,
        style: {
          stroke: isFlowing ? sourceAgent.color : "rgba(255,255,255,0.08)",
          strokeWidth: isFlowing ? 2.5 : 1.5,
          transition: "stroke 0.5s, stroke-width 0.5s",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isFlowing ? sourceAgent.color : "rgba(255,255,255,0.15)",
          width: 16,
          height: 16,
        },
      };
    };

    return [
      makeEdge("supply_chain", "tariff_calculator"),
      makeEdge("supply_chain", "geopolitical"),
      makeEdge("tariff_calculator", "supplier_scout"),
      makeEdge("supplier_scout", "strategy"),
      makeEdge("geopolitical", "strategy"),
      makeEdge("tariff_calculator", "strategy"),
    ];
  }, [agents]);

  // Agent detail panel
  const selectedAgentInfo = agents.find((a) => a.id === selectedAgent);

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.03)" />
      </ReactFlow>

      {/* Agent Detail Sidebar */}
      <AnimatePresence>
        {selectedAgentInfo && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-4 right-4 w-80 max-h-[calc(100%-2rem)] rounded-xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(20,20,35,0.95), rgba(15,15,25,0.98))",
              border: `1px solid ${selectedAgentInfo.color}33`,
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Header */}
            <div
              className="p-4 flex items-center justify-between"
              style={{ borderBottom: `1px solid ${selectedAgentInfo.color}22` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{selectedAgentInfo.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold">{selectedAgentInfo.name}</h3>
                  <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: selectedAgentInfo.color }}>
                    {selectedAgentInfo.status}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onSelectAgent(null)}
                className="text-white/30 hover:text-white/60 transition-colors text-lg"
              >
                x
              </button>
            </div>

            {/* Messages log */}
            <div className="p-4 overflow-y-auto max-h-96">
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-3">
                Agent Output
              </div>
              {selectedAgentInfo.messages.length === 0 ? (
                <div className="text-sm text-white/20 italic">
                  {selectedAgentInfo.status === "idle"
                    ? "Waiting to start..."
                    : selectedAgentInfo.status === "running"
                    ? "Processing..."
                    : "No output yet"}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedAgentInfo.messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-white/60 font-mono leading-relaxed flex items-start gap-2"
                    >
                      <span style={{ color: selectedAgentInfo.color }} className="mt-0.5 shrink-0">
                        {">"}
                      </span>
                      <span>{msg}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Typing indicator when running */}
              {selectedAgentInfo.status === "running" && (
                <div className="flex gap-1 mt-3 ml-4">
                  <div className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: selectedAgentInfo.color }} />
                  <div className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: selectedAgentInfo.color }} />
                  <div className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: selectedAgentInfo.color }} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
