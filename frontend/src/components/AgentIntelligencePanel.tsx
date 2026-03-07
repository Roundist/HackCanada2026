import { useState } from "react";

/** Light-theme panel: Agent Intelligence Engine with pill toggles and route map (Vancouver, Chicago, Sault Ste. Marie, Windsor-Detroit). */
export default function AgentIntelligencePanel() {
  const [importActive, setImportActive] = useState(true);
  const [exportTracked, setExportTracked] = useState(false);

  // Simplified North America–style outline and route points (viewBox for scaling)
  const vb = "0 0 320 200";
  const vancouver = { x: 80, y: 95 };
  const chicago = { x: 175, y: 105 };
  const windsorDetroit = { x: 205, y: 118 };
  const saultSteMarie = { x: 195, y: 75 };

  return (
    <div className="flex flex-col shrink-0">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">
        Agent Intelligence Engine
      </h3>
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setImportActive(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            importActive
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-gray-50 text-gray-500 border border-gray-200"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${importActive ? "bg-green-500" : "bg-gray-400"}`} />
          Import Flow Active
        </button>
        <button
          type="button"
          onClick={() => setExportTracked(!exportTracked)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            exportTracked
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-gray-50 text-gray-500 border border-gray-200"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${exportTracked ? "bg-green-500" : "bg-gray-400"}`} />
          Export Route Tracked
        </button>
      </div>

      <div className="w-full h-[120px] border border-gray-200 rounded-lg bg-gray-50/80 overflow-hidden shrink-0">
        <svg viewBox={vb} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* Light landmass outline (simplified Great Lakes / Canada–US border region) */}
          <path
            d="M 40 30 L 280 25 L 290 90 L 260 170 L 100 185 L 50 140 Z"
            fill="rgba(243,244,246,0.9)"
            stroke="#e5e7eb"
            strokeWidth="1.5"
          />
          {/* Vancouver – Chicago (dashed black) */}
          <line
            x1={vancouver.x}
            y1={vancouver.y}
            x2={chicago.x}
            y2={chicago.y}
            stroke="#374151"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          {/* Chicago – Windsor-Detroit – Sault Ste. Marie (dashed red) */}
          <line
            x1={chicago.x}
            y1={chicago.y}
            x2={windsorDetroit.x}
            y2={windsorDetroit.y}
            stroke="#dc2626"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <line
            x1={windsorDetroit.x}
            y1={windsorDetroit.y}
            x2={saultSteMarie.x}
            y2={saultSteMarie.y}
            stroke="#dc2626"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          {/* Vancouver (black = active) */}
          <circle cx={vancouver.x} cy={vancouver.y} r="5" fill="#1f2937" />
          <text x={vancouver.x} y={vancouver.y - 10} textAnchor="middle" fontSize="9" fill="#374151" fontWeight="500">Vancouver</text>
          {/* Chicago (black) */}
          <circle cx={chicago.x} cy={chicago.y} r="5" fill="#1f2937" />
          <text x={chicago.x} y={chicago.y - 10} textAnchor="middle" fontSize="9" fill="#374151" fontWeight="500">Chicago</text>
          {/* Sault Ste. Marie (red = risk) */}
          <circle cx={saultSteMarie.x} cy={saultSteMarie.y} r="5" fill="#dc2626" />
          <text x={saultSteMarie.x} y={saultSteMarie.y - 10} textAnchor="middle" fontSize="8" fill="#b91c1c" fontWeight="500">Sault Ste. Marie</text>
          {/* Windsor-Detroit (red) */}
          <circle cx={windsorDetroit.x} cy={windsorDetroit.y} r="5" fill="#dc2626" />
          <text x={windsorDetroit.x} y={windsorDetroit.y + 18} textAnchor="middle" fontSize="8" fill="#b91c1c" fontWeight="500">Windsor-Detroit</text>
        </svg>
      </div>

      <div className="flex gap-4 mt-1.5 text-[10px] text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Risk</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-800" /> Active</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Inactive</span>
      </div>
      <p className="text-xs text-gray-400 mt-1">Select a profile and run analysis to visualize routes.</p>
    </div>
  );
}
