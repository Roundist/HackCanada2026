interface PipelineStage {
  label: string;
  active: boolean;
}

interface Props {
  stages: PipelineStage[];
}

const PipelineBar = ({ stages: PIPELINE_STAGES }: Props) => {
  let activeIndex = -1;
  PIPELINE_STAGES.forEach((s, i) => { if (s.active) activeIndex = i; });
  const progress = ((activeIndex + 1) / PIPELINE_STAGES.length) * 100;

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
                background: stage.active
                  ? 'hsla(var(--neural-blue) / 0.1)'
                  : 'transparent',
                border: `1px solid ${stage.active ? 'hsla(var(--neural-blue) / 0.3)' : 'hsl(var(--border))'}`,
                color: stage.active ? 'hsl(var(--neural-blue))' : 'hsl(var(--muted-foreground))',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: stage.active ? 'hsl(var(--neural-blue))' : 'hsl(var(--muted-foreground))',
                  opacity: stage.active ? 1 : 0.4,
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
