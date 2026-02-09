export function PlotLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "hsl(210, 90%, 55%)" }} />
        <span>Telegram</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "hsl(220, 10%, 20%)" }} />
        <span>X</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "hsl(270, 60%, 55%)" }} />
        <span>Other</span>
      </div>
      <div className="flex items-center gap-1.5 ml-2 border-l border-border pl-4">
        <span className="h-2.5 w-2.5 rounded-full bg-primary opacity-100" />
        <span>Group highlight (full opacity)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground opacity-30" />
        <span>Other (dim)</span>
      </div>
    </div>
  );
}
