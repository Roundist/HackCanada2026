/**
 * Trade routes map — polished route overlay on regmap with clear visual language:
 * Internal (Canada) = solid blue, US tariffed = segmented red, Foreign = dotted green.
 */
const regmapImg = new URL("../../regmap.png", import.meta.url).href;

interface RoutesMapProps {
  size?: "compact" | "default" | "large";
  variant?: "dark" | "light";
  className?: string;
}

type RouteType = "internal" | "us_tariffed" | "foreign";

interface RouteDef {
  id: string;
  type: RouteType;
  path: string;
}

const ROUTES: RouteDef[] = [
  { id: "int-1", type: "internal", path: "M24 60 C35 53, 45 49, 56 52" },
  { id: "int-2", type: "internal", path: "M33 70 C45 62, 56 59, 69 63" },
  { id: "int-3", type: "internal", path: "M45 56 C53 47, 61 41, 70 42" },
  { id: "us-1", type: "us_tariffed", path: "M20 84 C31 75, 43 69, 55 62" },
  { id: "us-2", type: "us_tariffed", path: "M37 88 C49 78, 61 71, 74 63" },
  { id: "us-3", type: "us_tariffed", path: "M56 85 C64 76, 74 69, 84 62" },
  { id: "for-1", type: "foreign", path: "M2 44 C14 42, 27 44, 39 49" },
  { id: "for-2", type: "foreign", path: "M96 38 C84 40, 73 45, 62 51" },
  { id: "for-3", type: "foreign", path: "M89 16 C80 24, 71 35, 62 48" },
];

const HUBS = [
  { x: 56, y: 52, type: "internal" as const },
  { x: 69, y: 63, type: "internal" as const },
  { x: 70, y: 42, type: "internal" as const },
  { x: 55, y: 62, type: "us_tariffed" as const },
  { x: 74, y: 63, type: "us_tariffed" as const },
  { x: 84, y: 62, type: "us_tariffed" as const },
  { x: 39, y: 49, type: "foreign" as const },
  { x: 62, y: 51, type: "foreign" as const },
];

const sizeClasses = {
  compact: "max-w-[260px]",
  default: "w-full flex-1",
  large: "w-full flex-1",
};

const mapHeights: Record<NonNullable<RoutesMapProps["size"]>, string> = {
  compact: "h-[210px]",
  default: "h-[255px]",
  large: "h-[320px]",
};

function routeStroke(type: RouteType): string {
  if (type === "internal") return "#0ea5e9";
  if (type === "us_tariffed") return "#ef4444";
  return "#22c55e";
}

function routeDash(type: RouteType): string | undefined {
  if (type === "us_tariffed") return "10 6";
  if (type === "foreign") return "2.5 7";
  return undefined;
}

function routeWidth(type: RouteType): number {
  if (type === "us_tariffed") return 2.4;
  if (type === "foreign") return 2;
  return 2.2;
}

function LegendLine({ type }: { type: RouteType }) {
  const stroke = routeStroke(type);
  const dash = routeDash(type);
  return (
    <svg width="30" height="8" viewBox="0 0 30 8" aria-hidden>
      <line
        x1="1"
        y1="4"
        x2="29"
        y2="4"
        stroke={stroke}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeDasharray={dash}
      />
    </svg>
  );
}

function LegendItem({
  type,
  title,
  subtitle,
  isLight,
  compact = false,
}: {
  type: RouteType;
  title: string;
  subtitle: string;
  isLight: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border ${
        compact ? "w-full justify-start px-2.5 py-2" : "px-2.5 py-1.5"
      } ${isLight ? "border-gray-200 bg-white" : "border-white/10 bg-white/[0.02]"}`}
    >
      <LegendLine type={type} />
      <span className="leading-tight">
        <span className={`block text-[9px] font-semibold uppercase tracking-wider ${isLight ? "text-gray-700" : "text-gray-200"}`}>
          {title}
        </span>
        <span className={`block text-[8px] font-mono ${isLight ? "text-gray-400" : "text-gray-400"}`}>
          {subtitle}
        </span>
      </span>
    </span>
  );
}

export default function RoutesMap({
  size = "default",
  variant = "light",
  className = "",
}: RoutesMapProps) {
  const isLight = variant === "light";
  const isCompact = size === "compact";
  const textPrimary = isLight ? "text-gray-700" : "text-gray-200";
  const textMuted = isLight ? "text-gray-500" : "text-gray-400";
  const borderClass = isLight ? "border-gray-200" : "border-white/10";
  const bgClass = isLight ? "bg-white" : "bg-gray-900/40";

  return (
    <div
      className={`rounded-lg border overflow-hidden flex flex-col ${borderClass} ${bgClass} ${sizeClasses[size]} ${className}`}
    >
      <div className="px-3 py-2 border-b border-inherit shrink-0">
        <div className={`text-[10px] font-medium uppercase tracking-wider ${textPrimary}`}>
          Trade route intelligence
        </div>
        <div className={`text-[8px] font-mono mt-0.5 ${textMuted}`}>
          Internal corridors, US tariff pressure lanes, and foreign alternatives
        </div>
      </div>

      <div
        className={`relative ${mapHeights[size]} ${
          isLight ? "bg-[radial-gradient(circle_at_40%_20%,#f8fafc,transparent_65%)]" : "bg-black/25"
        }`}
      >
        <img
          src={regmapImg}
          alt="Trade route map with internal, US tariffed, and foreign lanes"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/10 pointer-events-none" />

        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="presentation"
        >
          <defs>
            <filter id="routeGlowBlue" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="routeGlowRed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="routeGlowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {ROUTES.map((route) => {
            const stroke = routeStroke(route.type);
            const dash = routeDash(route.type);
            const width = routeWidth(route.type);
            const glow =
              route.type === "internal"
                ? "url(#routeGlowBlue)"
                : route.type === "us_tariffed"
                ? "url(#routeGlowRed)"
                : "url(#routeGlowGreen)";
            const opacity = route.type === "us_tariffed" ? 0.92 : 0.82;

            return (
              <g key={route.id}>
                <path
                  d={route.path}
                  stroke={stroke}
                  strokeOpacity={0.22}
                  strokeWidth={width + 2.1}
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d={route.path}
                  stroke={stroke}
                  strokeWidth={width}
                  strokeDasharray={dash}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity={opacity}
                  fill="none"
                  style={{ filter: glow }}
                />
              </g>
            );
          })}

          {HUBS.map((hub, idx) => {
            const fill = routeStroke(hub.type);
            return (
              <g key={`hub-${idx}`}>
                <circle cx={hub.x} cy={hub.y} r="2.1" fill={fill} fillOpacity="0.15" />
                <circle cx={hub.x} cy={hub.y} r="0.7" fill={fill} />
              </g>
            );
          })}
        </svg>

        {!isCompact && (
          <div
            className={`absolute top-2 right-2 px-2 py-1 rounded border text-[8px] font-mono uppercase tracking-wider ${
              isLight
                ? "border-gray-200 bg-white/85 text-gray-500"
                : "border-white/10 bg-black/45 text-white/55"
            }`}
          >
            Route intensity by tariff exposure
          </div>
        )}
      </div>

      <div
        className={`px-2 py-2.5 border-t border-inherit shrink-0 ${
          isCompact ? "flex flex-col items-stretch gap-1.5" : "flex items-center justify-center gap-2 flex-wrap"
        } ${
          isLight ? "bg-gray-50/80" : "bg-black/20"
        }`}
      >
        {isCompact && (
          <div className={`text-[8px] font-mono uppercase tracking-wider ${textMuted}`}>
            Route intensity by tariff exposure
          </div>
        )}
        <LegendItem
          type="internal"
          title="Internal"
          subtitle="Domestic corridors"
          isLight={isLight}
          compact={isCompact}
        />
        <LegendItem
          type="us_tariffed"
          title="US Tariffed"
          subtitle="Retaliatory-risk lanes"
          isLight={isLight}
          compact={isCompact}
        />
        <LegendItem
          type="foreign"
          title="Foreign"
          subtitle="Diversification routes"
          isLight={isLight}
          compact={isCompact}
        />
      </div>
    </div>
  );
}
