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

export interface SystemEvent {
  message: string;
  status: "working" | "complete" | "info";
  timestamp: number;
}

export interface ChainOfThoughtEntry {
  agent: string;
  message: string;
  timestamp: number;
}

/** Geopolitical Alert (PRD: breaking news card from Geopolitical Analyst). */
export interface GeopoliticalAlert {
  urgency: "high" | "medium" | "low";
  headline: string;
  source: string;
  published?: string;
  relevance: string;
  affected_inputs?: string[];
  risk_adjustment?: { from: string; to: string };
  actionable_alert: string;
}

export interface WSMessage {
  // Demo simulation format
  type?: "agent_start" | "agent_log" | "agent_done" | "agent_error" | "pipeline_done" | "geopolitical_alert";
  // Backend format
  event_type?: string;
  status?: string;
  // Common
  agent?: string;
  message?: string;
  data?: Record<string, unknown>;
  // Geopolitical alert payload
  urgency?: string;
  headline?: string;
  source?: string;
  published?: string;
  relevance?: string;
  affected_inputs?: string[];
  risk_adjustment?: { from: string; to: string };
  actionable_alert?: string;
}

export interface DemoProfile {
  id: string;
  name: string;
  industry: string;
  description: string;
}
