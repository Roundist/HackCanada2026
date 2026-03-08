interface PipelineStage {
  label: string;
  status: "done" | "active" | "queued";
}

interface Props {
  stages: PipelineStage[];
}

const PipelineBar = ({ stages: PIPELINE_STAGES }: Props) => {
  const doneCount = PIPELINE_STAGES.filter((s) => s.status === "done").length;
  const hasActive = PIPELINE_STAGES.some((s) => s.status === "active");
  const progress = ((doneCount + (hasActive ? 0.5 : 0)) / PIPELINE_STAGES.length) * 100;

  return (
    <div className="absolute bottom-0 left-0 right-0 px-6 pb-4 pt-3 bg-card/80 backdrop-blur-sm border-t border-border">
      <div className="flex items-center gap-4 mb-3">
        <span className="text-[10px] font-display tracking-[0.25em] uppercase text-muted-foreground">
          Pipeline
        </span>
        <div className="flex gap-2 flex-1 overflow-x-auto">
          {PIPELINE_STAGES.map((stage, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-body whitespace-nowrap shrink-0"
              style={{
                background:
                  stage.status === "done"
                    ? "rgba(22, 163, 74, 0.1)"
                    : stage.status === "active"
                    ? "hsla(var(--neural-blue) / 0.1)"
                    : "transparent",
                border:
                  stage.status === "done"
                    ? "1px solid rgba(22, 163, 74, 0.28)"
                    : stage.status === "active"
                    ? "1px solid hsla(var(--neural-blue) / 0.3)"
                    : "1px solid hsl(var(--border))",
                color:
                  stage.status === "done"
                    ? "#15803d"
                    : stage.status === "active"
                    ? "hsl(var(--neural-blue))"
                    : "hsl(var(--muted-foreground))",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background:
                    stage.status === "done"
                      ? "#16a34a"
                      : stage.status === "active"
                      ? "hsl(var(--neural-blue))"
                      : "hsl(var(--muted-foreground))",
                  opacity: stage.status === "queued" ? 0.4 : 1,
                }}
              />
              {stage.label}
            </div>
          ))}
        </div>
      </div>
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, hsl(var(--neural-blue)), hsl(var(--neural-blue-glow)))`,
          }}
        />
      </div>
    </div>
  );
};

export default PipelineBar;
