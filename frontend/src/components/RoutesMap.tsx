/**
 * Trade routes map — regmap.png with legend:
 * Internal (Canada) = blue, American tariffed = red, Foreign (non-US) = green.
 * Fits site vibe; full size, no scroll.
 */
const regmapImg = new URL("../../regmap.png", import.meta.url).href;

interface RoutesMapProps {
  size?: "compact" | "default" | "large";
  variant?: "dark" | "light";
  className?: string;
}

const sizeClasses = {
  compact: "max-w-[260px]",
  default: "w-full flex-1",
  large: "w-full flex-1",
};

export default function RoutesMap({ size = "default", variant = "light", className = "" }: RoutesMapProps) {
  const isLight = variant === "light";
  const legendText = isLight ? "text-gray-600" : "text-gray-400";
  const borderClass = isLight ? "border-gray-200" : "border-white/10";
  const bgClass = isLight ? "bg-white" : "bg-gray-900/40";

  return (
    <div
      className={`rounded-lg border overflow-hidden flex flex-col ${borderClass} ${bgClass} ${sizeClasses[size]} ${className}`}
    >
      <div className="px-2.5 py-1.5 border-b border-inherit shrink-0">
        <span className={`text-[10px] font-medium uppercase tracking-wider ${legendText}`}>
          Possible trade routes
        </span>
      </div>
      <div className="flex items-center justify-center p-1 bg-gray-50/50">
        <img
          src={regmapImg}
          alt="Trade routes: internal (blue), US tariffed (red), foreign (green)"
          className="w-full h-[250px] object-cover object-center"
        />
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
