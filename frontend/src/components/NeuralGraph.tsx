import { useCallback, useMemo } from "react";
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
import { getAgentActivity } from "../hooks/useAgentState";
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
        position: { x: 360, y: 40 },
        data: {
          ...agentMap["supply_chain"],
          label: agentMap["supply_chain"].name,
          activity: getAgentActivity(agentMap["supply_chain"]),
          isSelected: selectedAgent === "supply_chain",
          onSelect,
        },
        draggable: false,
      },
      {
        id: "tariff_calculator",
        type: "agent",
        position: { x: 120, y: 220 },
        data: {
          ...agentMap["tariff_calculator"],
          label: agentMap["tariff_calculator"].name,
          activity: getAgentActivity(agentMap["tariff_calculator"]),
          isSelected: selectedAgent === "tariff_calculator",
          onSelect,
        },
        draggable: false,
      },
      {
        id: "geopolitical",
        type: "agent",
        position: { x: 600, y: 220 },
        data: {
          ...agentMap["geopolitical"],
          label: agentMap["geopolitical"].name,
          activity: getAgentActivity(agentMap["geopolitical"]),
          isSelected: selectedAgent === "geopolitical",
          onSelect,
        },
        draggable: false,
      },
      {
        id: "supplier_scout",
        type: "agent",
        position: { x: 200, y: 440 },
        data: {
          ...agentMap["supplier_scout"],
          label: agentMap["supplier_scout"].name,
          activity: getAgentActivity(agentMap["supplier_scout"]),
          isSelected: selectedAgent === "supplier_scout",
          onSelect,
        },
        draggable: false,
      },
      {
        id: "strategy",
        type: "agent",
        position: { x: 520, y: 440 },
        data: {
          ...agentMap["strategy"],
          label: agentMap["strategy"].name,
          activity: getAgentActivity(agentMap["strategy"]),
          isSelected: selectedAgent === "strategy",
          onSelect,
        },
        draggable: false,
      },
    ];
  }, [agents, selectedAgent, onSelect]);

  const edges: Edge[] = useMemo(() => {
    const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));
    const ids = ["supply_chain", "tariff_calculator", "geopolitical", "supplier_scout", "strategy"];

    const pairs: [string, string][] = [];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        pairs.push([ids[i], ids[j]]);
      }
    }

    const buildEdge = (source: string, target: string): Edge => {
      const sourceAgent = agentMap[source];
      const targetAgent = agentMap[target];
      const active = sourceAgent?.status === "running" || targetAgent?.status === "running";
      const done = sourceAgent?.status === "done" && targetAgent?.status === "done";
      const color = active
        ? (sourceAgent?.status === "running" ? sourceAgent?.color : targetAgent?.color) || "#38bdf8"
        : done
          ? `${sourceAgent?.color || "#10b981"}55`
          : "rgba(255,255,255,0.18)";

      return {
        id: `${source}-${target}`,
        source,
        target,
        animated: active,
        className: active ? "flowing" : "",
        style: {
          stroke: active || done ? color : "#94a3b8",
          strokeWidth: active ? 2 : 1,
          strokeDasharray: active ? "" : "6 10",
          opacity: done ? 0.8 : 0.7,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color,
          width: 10,
          height: 10,
        },
      };
    };

    return pairs.map(([s, t]) => buildEdge(s, t));
  }, [agents]);

  const selectedAgentInfo = agents.find((a) => a.id === selectedAgent);

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.35 }}
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
        <Background variant={BackgroundVariant.Lines} gap={60} size={0.5} color="rgba(0,0,0,0.06)" />
      </ReactFlow>

      <AnimatePresence>
        {selectedAgentInfo && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-3 right-3 w-72 max-h-[calc(100%-1.5rem)] overflow-hidden border border-gray-200 rounded-lg bg-white shadow-lg"
          >
            <div className="p-3 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: selectedAgentInfo.color }} />
                <div>
                  <h3 className="text-[11px] font-semibold text-gray-900">{selectedAgentInfo.name}</h3>
                  <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: selectedAgentInfo.color }}>
                    {selectedAgentInfo.status}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onSelectAgent(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xs font-mono"
              >
                [x]
              </button>
            </div>

            <div className="p-3 overflow-y-auto max-h-80 bg-gray-50">
              <div className="text-[9px] font-mono uppercase tracking-wider text-gray-500 mb-2">Output Log</div>
              {selectedAgentInfo.messages.length === 0 ? (
                <div className="text-[10px] text-gray-500 font-mono">
                  {selectedAgentInfo.status === "idle" ? "Awaiting activation..." : "Processing..."}
                </div>
              ) : (
                <div className="space-y-1">
                  {selectedAgentInfo.messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] text-gray-700 font-mono leading-relaxed flex items-start gap-1.5"
                    >
                      <span style={{ color: selectedAgentInfo.color }} className="shrink-0">{">"}</span>
                      <span>{msg}</span>
                    </motion.div>
                  ))}
                </div>
              )}
              {selectedAgentInfo.status === "running" && (
                <div className="flex gap-0.5 mt-2 ml-3">
                  <div className="typing-dot w-1 h-1 rounded-full" style={{ background: selectedAgentInfo.color }} />
                  <div className="typing-dot w-1 h-1 rounded-full" style={{ background: selectedAgentInfo.color }} />
                  <div className="typing-dot w-1 h-1 rounded-full" style={{ background: selectedAgentInfo.color }} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
