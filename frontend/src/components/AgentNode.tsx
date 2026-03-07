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

const statusLabel: Record<AgentStatus, string> = {
  idle: "Standby",
  waiting: "Queued",
  running: "Processing",
  done: "Complete",
  error: "Error",
};

function AgentNodeComponent({ id, data }: NodeProps & { data: AgentNodeData }) {
  const { label, icon, color, status, description, messages, isSelected, onSelect } = data;

  const isActive = status === "running";
  const isDone = status === "done";
  const isError = status === "error";

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-3 !h-3" />
      <motion.div
        onClick={() => onSelect(id)}
        className="relative cursor-pointer select-none"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Outer glow ring */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              className="absolute -inset-3 rounded-2xl"
              style={{
                background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>

        {/* Pulsing ring for active */}
        {isActive && (
          <motion.div
            className="absolute -inset-1 rounded-2xl"
            style={{ border: `2px solid ${color}` }}
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.03, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Main card */}
        <div
          className="relative rounded-xl px-5 py-4 backdrop-blur-sm transition-all duration-300"
          style={{
            background: isActive
              ? `linear-gradient(135deg, ${color}18, ${color}08)`
              : isDone
              ? `linear-gradient(135deg, ${color}12, transparent)`
              : "linear-gradient(135deg, rgba(30,30,45,0.9), rgba(20,20,35,0.9))",
            border: `1px solid ${
              isActive ? color : isDone ? `${color}66` : isError ? "#ef444466" : "rgba(255,255,255,0.06)"
            }`,
            minWidth: 200,
            boxShadow: isActive
              ? `0 0 30px ${color}22, 0 4px 20px rgba(0,0,0,0.4)`
              : isDone
              ? `0 0 15px ${color}11`
              : "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div
              className="text-xl w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                background: `${color}22`,
                boxShadow: isActive ? `0 0 12px ${color}44` : "none",
              }}
            >
              {icon}
            </div>
            <div>
              <div className="text-sm font-semibold text-white/90">{label}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: isActive ? color : isDone ? "#22c55e" : isError ? "#ef4444" : "#666",
                    boxShadow: isActive ? `0 0 6px ${color}` : "none",
                  }}
                />
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                  {statusLabel[status]}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-[11px] text-white/30 leading-relaxed">{description}</p>

          {/* Live messages */}
          <AnimatePresence>
            {isActive && messages.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 pt-3 border-t border-white/5 overflow-hidden"
              >
                <div className="text-[10px] font-mono text-white/50 max-h-16 overflow-y-auto">
                  {messages.slice(-2).map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="flex items-start gap-1.5 mb-1"
                    >
                      <span style={{ color }}>{">"}</span>
                      <span>{m}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completion checkmark */}
          <AnimatePresence>
            {isDone && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs shadow-lg"
                style={{ boxShadow: "0 0 10px rgba(34,197,94,0.5)" }}
              >
                ✓
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-3 !h-3" />
    </>
  );
}

export default memo(AgentNodeComponent);
