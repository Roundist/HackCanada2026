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
import CenterNodeComponent from "./CenterNode";
import { getAgentActivity } from "../hooks/useAgentState";
import type { AgentInfo } from "../types";

interface NeuralGraphProps {
  agents: AgentInfo[];
  onSelectAgent: (id: string | null) => void;
  selectedAgent: string | null;
}

const nodeTypes: NodeTypes = {
  agent: AgentNodeComponent as unknown as NodeTypes["agent"],
  center: CenterNodeComponent as unknown as NodeTypes["center"],
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
    const anyRunning = agents.some((a) => a.status === "running");
    const allDone = agents.every((a) => a.status === "done");

    return [
      {
        id: "business_center",
        type: "center",
        position: { x: 280, y: 220 },
        data: {
          label: "Business Profile",
          isActive: anyRunning,
          isDone: allDone,
        },
        draggable: false,
      },
      {
        id: "supply_chain",
        type: "agent",
        position: { x: 280, y: 0 },
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
        position: { x: 20, y: 140 },
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
        position: { x: 540, y: 140 },
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
        position: { x: 80, y: 400 },
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
        position: { x: 480, y: 400 },
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

    const makeEdge = (source: string, target: string, isFromCenter = false): Edge => {
      let isFlowing = false;
      let isDone = false;
      let edgeColor = "rgba(255,255,255,0.05)";

      if (isFromCenter) {
        const targetAgent = agentMap[target];
        isFlowing = targetAgent?.status === "running";
        isDone = targetAgent?.status === "done";
        edgeColor = isFlowing ? targetAgent.color : isDone ? `${targetAgent.color}55` : "rgba(255,255,255,0.05)";
      } else {
        const sourceAgent = agentMap[source];
        const targetAgent = agentMap[target];
        isFlowing = sourceAgent?.status === "done" && targetAgent?.status === "running";
        isDone = sourceAgent?.status === "done" && targetAgent?.status === "done";
        edgeColor = isFlowing ? sourceAgent.color : isDone ? `${sourceAgent.color}44` : "rgba(255,255,255,0.05)";
      }

      return {
        id: `${source}-${target}`,
        source,
        target,
        animated: isFlowing,
        style: {
          stroke: edgeColor,
          strokeWidth: isFlowing ? 2 : 1,
          transition: "stroke 0.6s, stroke-width 0.6s",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: 12,
          height: 12,
        },
      };
    };

    return [
      makeEdge("business_center", "supply_chain", true),
      makeEdge("business_center", "tariff_calculator", true),
      makeEdge("business_center", "geopolitical", true),
      makeEdge("business_center", "supplier_scout", true),
      makeEdge("business_center", "strategy", true),
      makeEdge("supply_chain", "tariff_calculator"),
      makeEdge("supply_chain", "geopolitical"),
      makeEdge("tariff_calculator", "supplier_scout"),
      makeEdge("tariff_calculator", "strategy"),
      makeEdge("geopolitical", "strategy"),
      makeEdge("supplier_scout", "strategy"),
    ];
  }, [agents]);

  const selectedAgentInfo = agents.find((a) => a.id === selectedAgent);

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
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
        <Background variant={BackgroundVariant.Dots} gap={30} size={0.5} color="rgba(255,255,255,0.03)" />
      </ReactFlow>

      <AnimatePresence>
        {selectedAgentInfo && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-3 right-3 w-72 max-h-[calc(100%-1.5rem)] overflow-hidden border border-white/[0.08]"
            style={{ background: "rgba(10,11,16,0.95)" }}
          >
            <div className="p-3 flex items-center justify-between border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: selectedAgentInfo.color }} />
                <div>
                  <h3 className="text-[11px] font-semibold text-white/70">{selectedAgentInfo.name}</h3>
                  <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: selectedAgentInfo.color }}>
                    {selectedAgentInfo.status}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onSelectAgent(null)}
                className="text-white/20 hover:text-white/50 transition-colors text-xs font-mono"
              >
                [x]
              </button>
            </div>

            <div className="p-3 overflow-y-auto max-h-80">
              <div className="text-[9px] font-mono uppercase tracking-wider text-white/20 mb-2">Output Log</div>
              {selectedAgentInfo.messages.length === 0 ? (
                <div className="text-[10px] text-white/15 font-mono">
                  {selectedAgentInfo.status === "idle" ? "Awaiting activation..." : "Processing..."}
                </div>
              ) : (
                <div className="space-y-1">
                  {selectedAgentInfo.messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] text-white/40 font-mono leading-relaxed flex items-start gap-1.5"
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
