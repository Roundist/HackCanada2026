import { useCallback, useState } from "react";
import { AgentInfo, AgentStatus, WSMessage } from "../types";

const INITIAL_AGENTS: AgentInfo[] = [
  {
    id: "supply_chain",
    name: "Supply Chain Analyst",
    color: "#3B82F6",
    icon: "🔗",
    description: "Maps your supply chain inputs and identifies US-sourced dependencies",
    status: "idle",
    messages: [],
    result: null,
  },
  {
    id: "tariff_calculator",
    name: "Tariff Calculator",
    color: "#EF4444",
    icon: "📊",
    description: "Calculates financial impact and margin erosion from tariffs",
    status: "idle",
    messages: [],
    result: null,
  },
  {
    id: "geopolitical",
    name: "Geopolitical Analyst",
    color: "#F59E0B",
    icon: "🌐",
    description: "Monitors live trade news and assesses escalation risk",
    status: "idle",
    messages: [],
    result: null,
  },
  {
    id: "supplier_scout",
    name: "Supplier Scout",
    color: "#10B981",
    icon: "🔍",
    description: "Finds alternative Canadian and international suppliers",
    status: "idle",
    messages: [],
    result: null,
  },
  {
    id: "strategy",
    name: "Strategy Architect",
    color: "#8B5CF6",
    icon: "🧠",
    description: "Synthesizes all intelligence into your survival plan",
    status: "idle",
    messages: [],
    result: null,
  },
];

// Map backend agent names to our frontend IDs
const AGENT_NAME_MAP: Record<string, string> = {
  "Supply Chain Analyst": "supply_chain",
  "Tariff Calculator": "tariff_calculator",
  "Geopolitical Analyst": "geopolitical",
  "Supplier Scout": "supplier_scout",
  "Strategy Architect": "strategy",
};

export function useAgentState() {
  const [agents, setAgents] = useState<AgentInfo[]>(INITIAL_AGENTS);
  const [pipelineDone, setPipelineDone] = useState(false);
  const [finalResult, setFinalResult] = useState<Record<string, unknown> | null>(null);

  const resetAgents = useCallback(() => {
    setAgents(INITIAL_AGENTS);
    setPipelineDone(false);
    setFinalResult(null);
  }, []);

  const updateAgent = useCallback(
    (agentId: string, updates: Partial<AgentInfo>) => {
      setAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, ...updates } : a))
      );
    },
    []
  );

  const handleWSMessage = useCallback(
    (msg: WSMessage) => {
      const agentId = msg.agent ? AGENT_NAME_MAP[msg.agent] || msg.agent : undefined;

      switch (msg.type) {
        case "agent_start":
          if (agentId) {
            updateAgent(agentId, { status: "running", messages: [] });
          }
          break;
        case "agent_log":
          if (agentId && msg.message) {
            setAgents((prev) =>
              prev.map((a) =>
                a.id === agentId
                  ? { ...a, messages: [...a.messages, msg.message!] }
                  : a
              )
            );
          }
          break;
        case "agent_done":
          if (agentId) {
            updateAgent(agentId, {
              status: "done",
              result: msg.data || null,
            });
          }
          break;
        case "agent_error":
          if (agentId) {
            updateAgent(agentId, { status: "error" });
          }
          break;
        case "pipeline_done":
          setPipelineDone(true);
          if (msg.data) setFinalResult(msg.data);
          break;
      }
    },
    [updateAgent]
  );

  return { agents, pipelineDone, finalResult, handleWSMessage, resetAgents };
}
