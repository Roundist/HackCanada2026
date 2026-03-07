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

/** HS code classification result from RAG vector search. */
export interface HsClassification {
  input: string;
  candidates: { hsCode: string; description: string; similarity: number }[];
  selectedCode: string;
  mfnRate: number;
  surtaxRate: number;
  effectiveRate: number;
  source: string;
}

/** Chain-of-thought reasoning step — shows how a number was derived. */
export interface ReasoningStep {
  agent: string;
  input: string;
  operation: string;
  result: string;
  timestamp: number;
}

export interface ArchitectureEvent {
  component: "rag" | "backboard" | "orchestration";
  step: string;
  detail: string;
  status: "working" | "complete" | "info";
  sponsor?: string;
  timestamp: number;
}

export interface WSMessage {
  // Demo simulation format
  type?:
    | "agent_start"
    | "agent_log"
    | "agent_done"
    | "agent_error"
    | "pipeline_done"
    | "geopolitical_alert"
    | "hs_classification"
    | "reasoning_step"
    | "architecture_event";
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
  // HS classification payload
  classification?: HsClassification;
  // Reasoning step payload
  reasoning?: ReasoningStep;
  // Architecture telemetry payload
  arch_component?: "rag" | "backboard" | "orchestration";
  arch_step?: string;
  arch_detail?: string;
  sponsor?: string;
}

export interface DemoProfile {
  id: string;
  name: string;
  industry: string;
  description: string;
}
