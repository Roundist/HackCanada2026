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
    <div className="flex flex-col pt-4 border-t border-gray-200 mt-3">
      <h3 className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-2">
        Supply chain flow
      </h3>
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full table-fixed text-left text-[11px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-[47%] py-2 px-2.5 font-semibold text-gray-600 uppercase tracking-wider">Source</th>
              <th className="w-[31%] py-2 px-2.5 font-semibold text-gray-600 uppercase tracking-wider">Transit</th>
              <th className="w-[22%] py-2 px-2.5 font-semibold text-gray-600 uppercase tracking-wider">Business</th>
            </tr>
          </thead>
          <tbody>
            {routes.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 px-3 text-gray-400">Select a profile to see routes.</td>
              </tr>
            ) : (
              routes.map((r) => (
                <tr key={`${r.commodity}-${r.transitPoint}`} className="border-b border-gray-100 last:border-b-0">
                  <td className="py-2.5 px-2.5 align-top">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-2 align-middle" />
                    <span className="text-gray-800 whitespace-normal break-words leading-snug">
                      {r.sourceCountry} - {r.commodity}
                    </span>
                  </td>
                  <td className="py-2.5 px-2.5 text-gray-700 align-top whitespace-normal break-words leading-snug">
                    {r.transitPoint.replace("–", "-")}
                  </td>
                  <td className="py-2.5 px-2.5 text-gray-700 align-top whitespace-normal break-words leading-snug">
                    {profile ? profile.name : ""}
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
