/**
 * Geo lookup for trade route map: source regions, transit points, and Canadian hubs.
 * [lat, lng] for Leaflet (same as GeoJSON: [lng, lng] is wrong — Leaflet uses [lat, lng]).
 */

export type RouteType = "internal" | "us_tariffed" | "foreign";

/** Approximate [lat, lng] for map display. */
const COORDS: Record<string, [number, number]> = {
  // Canada — business hubs by profile
  "Ontario": [43.65, -79.38],
  "Toronto": [43.65, -79.38],
  "Vancouver": [49.28, -123.12],
  "Manitoba": [49.9, -97.14],
  "Winnipeg": [49.9, -97.14],
  // US source regions
  "Michigan": [42.33, -83.05],
  "Michigan, WI": [42.33, -83.05],
  "Wisconsin": [43.08, -89.38],
  "North Carolina": [35.23, -79.84],
  "Ohio": [41.5, -81.69],
  "Pennsylvania": [40.44, -79.99],
  "California": [37.77, -122.42],
  "California, TX": [32.78, -96.8],
  "Texas": [29.76, -95.37],
  "New Jersey": [40.71, -74.01],
  "Illinois": [41.88, -87.63],
  "North Dakota": [46.88, -96.79],
  "Oregon": [45.52, -122.68],
  "US Distributors": [37.77, -122.42],
  // Border crossings (transit points)
  "Detroit–Windsor": [42.31, -83.04],
  "Buffalo–Fort Erie": [42.91, -78.9],
  "Pacific Gateway": [49.0, -122.75],
  "Emerson–Pembina": [49.0, -97.24],
  // Fallbacks for country-level
  "USA": [39.83, -98.58],
  "Canada": [56.13, -106.35],
  "Brazil": [-14.24, -51.93],
  "Vietnam": [14.06, 108.28],
  "Mexico": [23.63, -102.55],
  "Taiwan": [23.7, 121.0],
  "Germany": [51.17, 10.45],
};

/** Canadian hub by profile id for "destination" of imports. */
const PROFILE_HUB: Record<string, [number, number]> = {
  maple_furniture: [43.65, -79.38],
  northern_tech: [49.28, -123.12],
  prairie_harvest: [49.9, -97.14],
};

export interface RouteSegment {
  from: [number, number];
  to: [number, number];
  type: RouteType;
  label: string;
}

function getCoords(key: string): [number, number] | null {
  if (!key || typeof key !== "string") return null;
  const k = key.trim();
  return COORDS[k] ?? COORDS[k.split(",")[0]?.trim() ?? ""] ?? null;
}

/**
 * Resolve origin coords from route: prefer sourceRegion, then sourceCountry.
 */
function getOriginCoords(sourceRegion?: string, sourceCountry?: string): [number, number] | null {
  if (sourceRegion) {
    const r = getCoords(sourceRegion);
    if (r) return r;
  }
  if (sourceCountry) {
    const c = getCoords(sourceCountry);
    if (c) return c;
  }
  return null;
}

/**
 * Resolve destination (Canadian side): transit point or profile hub.
 */
function getDestCoords(transitPoint: string, profileId?: string): [number, number] | null {
  const t = getCoords(transitPoint);
  if (t) return t;
  if (profileId && PROFILE_HUB[profileId]) return PROFILE_HUB[profileId];
  return [56.13, -106.35]; // Canada fallback
}

export interface SupplyChainRouteInput {
  commodity: string;
  sourceCountry: string;
  sourceRegion?: string;
  transitPoint: string;
  hsCode?: string;
  tariffRatePct?: number;
}

/**
 * Build route segments for the map from a list of supply chain routes.
 * internal = Canada → Canada, us_tariffed = USA → Canada, foreign = other → Canada.
 */
export function getRouteSegments(
  routes: SupplyChainRouteInput[],
  profileId?: string
): RouteSegment[] {
  const segments: RouteSegment[] = [];
  for (const r of routes) {
    const from = getOriginCoords(r.sourceRegion, r.sourceCountry);
    const to = getDestCoords(r.transitPoint, profileId);
    if (!from || !to) continue;
    const type: RouteType =
      r.sourceCountry === "Canada"
        ? "internal"
        : r.sourceCountry === "USA"
          ? "us_tariffed"
          : "foreign";
    segments.push({
      from,
      to,
      type,
      label: `${r.commodity} (${r.transitPoint})`,
    });
  }
  return segments;
}
