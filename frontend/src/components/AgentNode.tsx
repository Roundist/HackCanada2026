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
  const { label, color, status, messages, isSelected, onSelect } = data;

  const isActive = status === "running";
  const isDone = status === "done";
  const isError = status === "error";

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-0 !w-2 !h-2" />
      <Handle type="target" position={Position.Right} className="!bg-transparent !border-0 !w-2 !h-2" />
      <div
        onClick={() => onSelect(id)}
        className="relative cursor-pointer select-none"
      >
        {isActive && (
          <div
            className="absolute -inset-1.5 pulse-ring"
            style={{ border: `1px solid ${color}55` }}
          />
        )}

        <div
          className="relative px-4 py-3 transition-all duration-300"
          style={{
            background: isActive
              ? `${color}08`
              : isDone
              ? `${color}05`
              : "rgba(15,17,23,0.9)",
            border: `1px solid ${
              isSelected
                ? `${color}88`
                : isActive
                ? `${color}44`
                : isDone
                ? `${color}22`
                : isError
                ? "#ef444433"
                : "rgba(255,255,255,0.05)"
            }`,
            minWidth: 180,
          }}
        >
          <div className="flex items-center gap-2.5 mb-1.5">
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "status-blink" : ""}`}
              style={{
                background: isActive ? color : isDone ? "#16a34a" : isError ? "#ef4444" : "rgba(255,255,255,0.12)",
              }}
            />
            <div className="text-[11px] font-semibold text-white/70">{label}</div>
          </div>

          <div className="flex items-center gap-2 ml-[18px]">
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

          <AnimatePresence>
            {isActive && messages.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 pt-2 border-t overflow-hidden ml-[18px]"
                style={{ borderColor: `${color}15` }}
              >
                {messages.slice(-2).map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -6, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="text-[9px] font-mono text-white/30 leading-relaxed flex items-start gap-1 mb-0.5"
                  >
                    <span style={{ color }} className="shrink-0">{">"}</span>
                    <span className="truncate">{m}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {isDone && (
            <div className="absolute top-2 right-2">
              <div className="w-3.5 h-3.5 border flex items-center justify-center" style={{ borderColor: "#16a34a44", background: "#16a34a11" }}>
                <span className="text-[8px] text-green-500">&#10003;</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-2 !h-2" />
      <Handle type="source" position={Position.Left} className="!bg-transparent !border-0 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-0 !w-2 !h-2" />
    </>
  );
}

export default memo(AgentNodeComponent);
