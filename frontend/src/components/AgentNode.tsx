import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import type { AgentStatus } from "../types";

interface AgentNodeData {
  label: string;
  icon: string;
  color: string;
  status: AgentStatus;
  description: string;
  messages: string[];
  /** Current activity line (e.g. "Parsing business description...") */
  activity?: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  [key: string]: unknown;
}

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: "Standby",
  waiting: "Queued",
  running: "Active",
  done: "Complete",
  error: "Error",
};

function AgentNodeComponent({ id, data }: NodeProps & { data: AgentNodeData }) {
  const { label, color, status, messages, activity, isSelected, onSelect, icon } = data;

  const isActive = status === "running";
  const isDone = status === "done";
  const isError = status === "error";
  const latest = messages.slice(-2);

  const ringColor = isDone ? "#10b981" : color;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-0 !w-2 !h-2" />
      <Handle type="target" position={Position.Right} className="!bg-transparent !border-0 !w-2 !h-2" />
      <div onClick={() => onSelect(id)} className="relative cursor-pointer select-none">
        {isActive && (
          <div
            className="absolute -inset-3 rounded-full pulse-ring"
            style={{ border: `1px solid ${color}40`, boxShadow: `0 0 0 12px ${color}06` }}
          />
        )}

        <div className="relative flex flex-col items-center gap-2">
          <div
            className="relative w-24 h-24 rounded-full flex items-center justify-center bg-white border-2 shadow-md"
            style={{
              borderColor: isSelected ? color : isDone ? ringColor : "#e5e7eb",
              boxShadow: isActive ? `0 4px 20px ${color}40` : "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <div
              className="absolute inset-1 rounded-full border"
              style={{
                borderColor: isDone ? `${ringColor}99` : isActive ? `${color}99` : "#f3f4f6",
              }}
            />
            <span className="text-[18px] font-mono" style={{ color }}>
              {icon}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono uppercase tracking-widest" style={{
                color: isActive ? color : isDone ? "#059669" : "#9ca3af",
              }}>
                {STATUS_LABEL[status]}
              </span>
              {isDone && messages.length > 0 && (
                <span className="text-[8px] font-mono text-gray-500">
                  {messages.length} outputs
                </span>
              )}
            </div>
            {activity && (isActive || isDone) && (
              <span className="text-[8px] font-mono text-gray-600 truncate max-w-[160px]" title={activity}>
                {activity}
              </span>
            )}
          </div>
          <div className="text-center">
            <div className="text-[11px] font-semibold text-gray-900 tracking-tight">{label}</div>
            <div
              className="text-[9px] font-mono uppercase tracking-[0.22em] text-gray-500"
              style={isActive ? { color } : isDone ? { color: "#059669" } : undefined}
            >
              {STATUS_LABEL[status]}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {(isActive || isSelected) && latest.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-3 border border-gray-200 bg-white shadow-lg px-3 py-2 w-56 rounded-lg"
            >
              {latest.map((m, i) => (
                <div key={i} className="flex items-start gap-2 text-[9px] font-mono text-gray-700 leading-relaxed">
                  <span style={{ color }} className="mt-0.5">◆</span>
                  <span className="truncate">{m}</span>
                </div>
              ))}
              {isActive && (
                <div className="flex gap-1 mt-2">
                  <div className="typing-dot w-1 h-1 rounded-full" style={{ background: color }} />
                  <div className="typing-dot w-1 h-1 rounded-full" style={{ background: color }} />
                  <div className="typing-dot w-1 h-1 rounded-full" style={{ background: color }} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-2 !h-2" />
      <Handle type="source" position={Position.Left} className="!bg-transparent !border-0 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-0 !w-2 !h-2" />
    </>
  );
}

export default memo(AgentNodeComponent);
