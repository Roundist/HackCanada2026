export type AgentStatus = "idle" | "waiting" | "running" | "done" | "error";

export interface AgentInfo {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
  status: AgentStatus;
  messages: string[];
  result: Record<string, unknown> | null;
}

export interface WSMessage {
  type: "agent_start" | "agent_log" | "agent_done" | "agent_error" | "pipeline_done";
  agent?: string;
  message?: string;
  data?: Record<string, unknown>;
}

export interface DemoProfile {
  id: string;
  name: string;
  industry: string;
  description: string;
}
