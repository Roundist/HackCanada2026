import type { BusinessProfile } from "../data/businessProfiles";

interface AgentIntelligencePanelProps {
  selectedProfile: BusinessProfile | null;
}

/** Left panel: context for the current selection. Supply chain table below shows routes for the profile selected in the center. */
export default function AgentIntelligencePanel({ selectedProfile }: AgentIntelligencePanelProps) {
  return (
    <div className="flex flex-col shrink-0">
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1">
        Context
      </p>
      {selectedProfile ? (
        <>
          <p className="text-sm font-semibold text-gray-900">
            {selectedProfile.name}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {selectedProfile.industry} · {selectedProfile.revenue} · {selectedProfile.imports} US
          </p>
        </>
      ) : (
        <p className="text-sm text-gray-500">
          No profile selected
        </p>
      )}
      <p className="text-[10px] text-gray-400 mt-2">
        Supply chain below updates when you select a profile in the center.
      </p>
    </div>
  );
}
