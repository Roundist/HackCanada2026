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
            className="relative w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(12,16,26,0.95)",
              border: `1px solid ${isSelected ? `${color}90` : `${color}35`}`,
              boxShadow: isActive
                ? `0 10px 40px ${color}25`
                : isDone
                  ? `0 0 0 1px ${ringColor}55`
                  : undefined,
            }}
          >
            <div
              className="absolute inset-1 rounded-full"
              style={{
                border: isDone
                  ? `2px solid ${ringColor}90`
                  : isActive
                    ? `2px dashed ${color}`
                    : `1px dashed rgba(255,255,255,0.08)`,
                opacity: isActive ? 0.9 : 0.5,
              }}
            />
            <span className="text-[18px] font-mono" style={{ color }}>
              {icon}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono uppercase tracking-widest" style={{
                color: isActive ? color : isDone ? "#16a34a" : "rgba(255,255,255,0.2)",
              }}>
                {STATUS_LABEL[status]}
              </span>
              {isDone && messages.length > 0 && (
                <span className="text-[8px] font-mono text-white/15">
                  {messages.length} outputs
                </span>
              )}
            </div>
            {activity && (isActive || isDone) && (
              <span className="text-[8px] font-mono text-white/25 truncate max-w-[160px]" title={activity}>
                {activity}
              </span>
            )}
          </div>
          <div className="text-center">
            <div className="text-[11px] font-semibold text-white/80 tracking-tight">{label}</div>
            <div
              className="text-[9px] font-mono uppercase tracking-[0.22em]"
              style={{ color: isActive ? color : isDone ? "#10b981" : "rgba(255,255,255,0.35)" }}
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
              className="mt-3 border border-white/12 bg-black/60 backdrop-blur-sm px-3 py-2 w-56"
            >
              {latest.map((m, i) => (
                <div key={i} className="flex items-start gap-2 text-[9px] font-mono text-white/65 leading-relaxed">
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
