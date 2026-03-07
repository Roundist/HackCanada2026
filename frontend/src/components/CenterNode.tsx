import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface CenterNodeData {
  label: string;
  isActive: boolean;
  isDone: boolean;
  [key: string]: unknown;
}

function CenterNodeComponent({ data }: NodeProps & { data: CenterNodeData }) {
  const { label, isActive, isDone } = data;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-2 !h-2" />
      <div className="relative">
        {isActive && (
          <div
            className="absolute -inset-2 pulse-ring"
            style={{
              border: "1px solid rgba(220,38,38,0.3)",
            }}
          />
        )}
        <div
          className="px-5 py-3.5 border text-center"
          style={{
            borderColor: isDone ? "rgba(22,163,74,0.4)" : isActive ? "rgba(220,38,38,0.4)" : "rgba(255,255,255,0.08)",
            background: isDone ? "rgba(22,163,74,0.06)" : isActive ? "rgba(220,38,38,0.06)" : "rgba(15,17,23,0.9)",
            minWidth: 160,
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <div
              className={`w-2 h-2 rounded-full ${isActive ? "status-blink" : ""}`}
              style={{
                background: isDone ? "#16a34a" : isActive ? "#dc2626" : "rgba(255,255,255,0.15)",
              }}
            />
            <span className="text-[11px] font-semibold text-white/70">{label}</span>
          </div>
          <div className="text-[8px] font-mono uppercase tracking-widest text-white/20">
            {isDone ? "Analysis Complete" : isActive ? "Processing" : "Awaiting Input"}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-2 !h-2" />
      <Handle type="source" position={Position.Left} className="!bg-transparent !border-0 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-0 !w-2 !h-2" />
    </>
  );
}

export default memo(CenterNodeComponent);
