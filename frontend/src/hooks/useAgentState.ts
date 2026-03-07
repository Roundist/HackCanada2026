import { useCallback, useState } from "react";
import { AgentInfo, AgentStatus, ChainOfThoughtEntry, GeopoliticalAlert, HsClassification, ReasoningStep, SystemEvent, WSMessage } from "../types";

/** Short “what this agent is doing” when idle (before run) */
export const AGENT_IDLE_ACTIVITY: Record<string, string> = {
  supply_chain: "Will parse your description & map US-sourced inputs",
  tariff_calculator: "Will fetch tariff rates & run margin scenarios",
  geopolitical: "Will fetch live trade news & assess escalation risk",
  supplier_scout: "Will search for Canadian & int’l alternatives",
  strategy: "Will synthesize findings into your survival plan",
};

const INITIAL_AGENTS: AgentInfo[] = [
  {
    id: "supply_chain",
    name: "Supply Chain Analyst",
    color: "#0EA5E9",
    icon: "◉",
    description: "Maps your supply chain inputs and identifies US-sourced dependencies",
    status: "idle",
    messages: [],
    result: null,
  },
  {
    id: "tariff_calculator",
    name: "Tariff Calculator",
    color: "#F43F5E",
    icon: "◆",
    description: "Calculates financial impact and margin erosion from tariffs",
    status: "idle",
    messages: [],
    result: null,
  },
  {
    id: "geopolitical",
    name: "Geopolitical Analyst",
    color: "#F59E0B",
    icon: "◇",
    description: "Monitors live trade news and assesses escalation risk",
    status: "idle",
    messages: [],
    result: null,
  },
  {
    id: "supplier_scout",
    name: "Supplier Scout",
    color: "#10B981",
    icon: "◈",
    description: "Finds alternative Canadian and international suppliers",
    status: "idle",
    messages: [],
    result: null,
  },
  {
    id: "strategy",
    name: "Strategy Architect",
    color: "#A855F7",
    icon: "◎",
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

/** Activity line to show for an agent (what it's doing or last message). */
export function getAgentActivity(agent: AgentInfo): string {
  if (agent.status === "running" || agent.status === "done") {
    const last = agent.messages[agent.messages.length - 1];
    if (last) return last;
  }
  return AGENT_IDLE_ACTIVITY[agent.id] ?? agent.description;
}

export function useAgentState() {
  const [agents, setAgents] = useState<AgentInfo[]>(INITIAL_AGENTS);
  const [pipelineDone, setPipelineDone] = useState(false);
  const [finalResult, setFinalResult] = useState<Record<string, unknown> | null>(null);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);
  const [chainOfThoughtLog, setChainOfThoughtLog] = useState<ChainOfThoughtEntry[]>([]);
  const [geopoliticalAlerts, setGeopoliticalAlerts] = useState<GeopoliticalAlert[]>([]);
  const [hsClassifications, setHsClassifications] = useState<HsClassification[]>([]);
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([]);

  const resetAgents = useCallback(() => {
    setAgents(INITIAL_AGENTS);
    setPipelineDone(false);
    setFinalResult(null);
    setSystemEvents([]);
    setChainOfThoughtLog([]);
    setGeopoliticalAlerts([]);
    setHsClassifications([]);
    setReasoningSteps([]);
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
      // Normalize: backend uses event_type/status, demo uses type
      const msgType = msg.type || (() => {
        if (msg.event_type === "pipeline_complete") return "pipeline_done" as const;
        if (msg.event_type === "pipeline_error") return "agent_error" as const;
        if (msg.event_type === "error") return "agent_error" as const;
        if (msg.status === "working") return "agent_log" as const;
        if (msg.status === "complete") return "agent_done" as const;
        return "agent_log" as const;
      })();

      const agentId = msg.agent ? AGENT_NAME_MAP[msg.agent] || msg.agent : undefined;

      // Backend sends "working" as first message for an agent — treat as start if idle
      if (msg.status === "working" && agentId) {
        setAgents((prev) => {
          const agent = prev.find((a) => a.id === agentId);
          if (agent && agent.status === "idle") {
            return prev.map((a) =>
              a.id === agentId ? { ...a, status: "running" as AgentStatus, messages: [] } : a
            );
          }
          return prev;
        });
      }

      const systemMessage = msg.message;
      if (msg.agent === "System" && systemMessage) {
        setSystemEvents((prev) => [
          ...prev,
          {
            message: systemMessage,
            status:
              msg.status === "working" || msg.status === "complete"
                ? msg.status
                : "info",
            timestamp: Date.now(),
          },
        ]);
      }

      // Geopolitical alert (PRD: breaking news card)
      if (msg.type === "geopolitical_alert" || msg.event_type === "geopolitical_alert") {
        const alert: GeopoliticalAlert = {
          urgency: (msg.urgency as GeopoliticalAlert["urgency"]) ?? "medium",
          headline: msg.headline ?? "Trade development",
          source: msg.source ?? "News",
          published: msg.published,
          relevance: msg.relevance ?? "Relevant to your supply chain.",
          affected_inputs: msg.affected_inputs,
          risk_adjustment: msg.risk_adjustment,
          actionable_alert: msg.actionable_alert ?? "Monitor for updates.",
        };
        setGeopoliticalAlerts((prev) => [...prev, alert]);
      }

      // HS classification evidence
      if (msg.type === "hs_classification" && msg.classification) {
        setHsClassifications((prev) => [...prev, msg.classification!]);
      }

      // Reasoning step
      if (msg.type === "reasoning_step" && msg.reasoning) {
        setReasoningSteps((prev) => [...prev, msg.reasoning!]);
      }

      switch (msgType) {
        case "agent_start":
          if (agentId) {
            updateAgent(agentId, { status: "running", messages: [] });
          }
          break;
        case "agent_log":
          if (agentId && msg.message) {
            const agentName = msg.agent ?? agentId;
            setChainOfThoughtLog((prev) => [
              ...prev,
              { agent: agentName, message: msg.message!, timestamp: Date.now() },
            ]);
            setAgents((prev) =>
              prev.map((a) =>
                a.id === agentId
                  ? { ...a, messages: [...a.messages, msg.message!] }
                  : a
              )
            );
          }
          if (msg.agent === "System" && msg.message) {
            setChainOfThoughtLog((prev) => [
              ...prev,
              { agent: "System", message: msg.message!, timestamp: Date.now() },
            ]);
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

  return {
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
  };
}
