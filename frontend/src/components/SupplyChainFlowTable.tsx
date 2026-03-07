import type { BusinessProfile } from "../data/businessProfiles";

interface SupplyChainFlowTableProps {
  profile: BusinessProfile | null;
}

/** Light-theme table: Source | Transit | Business (red bullets for USA sources). */
export default function SupplyChainFlowTable({ profile }: SupplyChainFlowTableProps) {
  const routes = profile?.routes ?? [];
  const borderCount = routes.length;
  const crossingSet = new Set(routes.map((r) => r.transitPoint));
  const crossingCount = crossingSet.size;

  return (
    <div className="flex flex-col">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 pt-4 border-t border-gray-200">
        Supply Chain Flow
      </h3>
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-2 px-3 font-semibold text-gray-600 uppercase tracking-wider">Source</th>
              <th className="py-2 px-3 font-semibold text-gray-600 uppercase tracking-wider">Transit</th>
              <th className="py-2 px-3 font-semibold text-gray-600 uppercase tracking-wider">Business</th>
            </tr>
          </thead>
          <tbody>
            {routes.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 px-3 text-gray-400">Select a profile to see routes.</td>
              </tr>
            ) : (
              routes.map((r, i) => (
                <tr key={`${r.commodity}-${r.transitPoint}`} className="border-b border-gray-100 last:border-b-0">
                  <td className="py-2.5 px-3">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-2 align-middle" />
                    <span className="text-gray-800">{r.sourceCountry} - {r.commodity}</span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-700">{r.transitPoint.replace("–", "-")}</td>
                  <td className="py-2.5 px-3 text-gray-700">
                    {i === Math.min(1, routes.length - 1) && profile ? profile.name : ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {routes.length > 0 && (
        <p className="text-[10px] text-gray-500 mt-2">
          {borderCount} import route{routes.length !== 1 ? "s" : ""} tracked • {crossingCount} border crossing{crossingCount !== 1 ? "s" : ""} active
        </p>
      )}
    </div>
  );
}
