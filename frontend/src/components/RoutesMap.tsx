/**
 * Trade routes map — real map via Leaflet + OpenStreetMap.
 * Internal (Canada) = blue, US tariffed = red, Foreign (non-US) = green.
 */
import { useMemo, useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import { getRouteSegments, type RouteSegment, type RouteType } from "../utils/geoRoutes";
import type { BusinessProfile } from "../data/businessProfiles";
import "leaflet/dist/leaflet.css";

interface RoutesMapProps {
  size?: "compact" | "default" | "large";
  variant?: "dark" | "light";
  className?: string;
  /** When set, draws routes from this profile's supply chain. */
  profile?: BusinessProfile | null;
}

const sizeClasses = {
  compact: "max-w-[260px]",
  default: "w-full flex-1",
  large: "w-full flex-1",
};

const heightBySizePx = {
  compact: 250,
  default: 320,
  large: 400,
};

const ROUTE_COLORS: Record<RouteType, string> = {
  internal: "#3b82f6",
  us_tariffed: "#ef4444",
  foreign: "#22c55e",
};

function FitBounds({ segments }: { segments: RouteSegment[] }) {
  const map = useMap();
  const bounds = useMemo(() => {
    if (segments.length === 0) return null;
    const all: LatLngTuple[] = segments.flatMap((s) => [s.from, s.to]);
    const lats = all.map((p) => p[0]);
    const lngs = all.map((p) => p[1]);
    const pad = 2;
    return [
      [Math.min(...lats) - pad, Math.min(...lngs) - pad],
      [Math.max(...lats) + pad, Math.max(...lngs) + pad],
    ] as [LatLngTuple, LatLngTuple];
  }, [segments]);
  useEffect(() => {
    if (!bounds) return;
    const t = setTimeout(() => {
      try {
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 5 });
        map.invalidateSize();
      } catch {
        // ignore if map not ready
      }
    }, 100);
    return () => clearTimeout(t);
  }, [map, bounds]);
  return null;
}

export default function RoutesMap({
  size = "default",
  variant = "light",
  className = "",
  profile = null,
}: RoutesMapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = variant === "light";
  const legendText = isLight ? "text-gray-600" : "text-gray-400";
  const borderClass = isLight ? "border-gray-200" : "border-white/10";
  const bgClass = isLight ? "bg-white" : "bg-gray-900/40";

  const segments = useMemo(
    () => getRouteSegments(profile?.routes ?? [], profile?.id),
    [profile?.routes, profile?.id]
  );

  const center: LatLngTuple = [50, -100];
  const zoom = 4;
  const mapHeightPx = heightBySizePx[size];

  return (
    <div
      className={`rounded-lg border overflow-hidden flex flex-col ${borderClass} ${bgClass} ${sizeClasses[size]} ${className}`}
    >
      <div className="px-2.5 py-1.5 border-b border-inherit shrink-0">
        <span className={`text-[10px] font-medium uppercase tracking-wider ${legendText}`}>
          {profile ? "Trade routes" : "Possible trade routes"}
        </span>
      </div>
      <div
        className="relative w-full flex-shrink-0"
        style={{ height: mapHeightPx }}
      >
        {mounted ? (
          <MapContainer
            center={center}
            zoom={zoom}
            zoomControl={true}
            scrollWheelZoom={true}
            style={{
              height: "100%",
              width: "100%",
              background: isLight ? "#f1f5f9" : "#1e293b",
            }}
            className="rounded-b-lg"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {segments.length > 0 && <FitBounds segments={segments} />}
            {segments.map((seg, i) => (
              <Polyline
                key={`${i}-${seg.label}`}
                positions={[seg.from, seg.to]}
                pathOptions={{
                  color: ROUTE_COLORS[seg.type],
                  weight: 2.5,
                  opacity: 0.9,
                }}
                eventHandlers={{
                  mouseover: (e) => {
                    e.target.setStyle({ weight: 4 });
                    e.target.bringToFront();
                  },
                  mouseout: (e) => {
                    e.target.setStyle({ weight: 2.5 });
                  },
                }}
              />
            ))}
          </MapContainer>
        ) : (
          <div
            className="h-full w-full rounded-b-lg animate-pulse"
            style={{ background: isLight ? "#e2e8f0" : "#334155" }}
          />
        )}
      </div>
      <div
        className={`flex items-center justify-center gap-4 px-2 py-2 border-t border-inherit shrink-0 flex-wrap ${isLight ? "bg-gray-50/80" : "bg-black/20"}`}
      >
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-0.5 rounded-full bg-blue-500 shrink-0" aria-hidden />
          <span className={`text-[9px] font-medium uppercase tracking-wider ${legendText}`}>
            Internal
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-0.5 rounded-full bg-red-500 shrink-0" aria-hidden />
          <span className={`text-[9px] font-medium uppercase tracking-wider ${legendText}`}>
            US tariffed
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-0.5 rounded-full bg-green-500 shrink-0" aria-hidden />
          <span className={`text-[9px] font-medium uppercase tracking-wider ${legendText}`}>
            Foreign
          </span>
        </span>
      </div>
    </div>
  );
}
