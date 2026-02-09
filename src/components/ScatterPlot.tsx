import { useMemo, useCallback, useState, useRef, useEffect } from "react";
import Plot from "@/components/PlotlyWrapper";
import type { DataPoint } from "@/lib/types";
import { getPlatformColor, wrapBySqrtWords } from "@/lib/dataHelpers";
import type { Layout } from "plotly.js";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RotateCcw } from "lucide-react";

const MAX_LABELS = 250;

interface ScatterPlotProps {
  title: string;
  points: DataPoint[];
  highlightUids?: Set<string>;
  zoomThreshold: number;
  showOnlyGroup: boolean;
  onToggleShowOnly: (val: boolean) => void;
  hasGroup: boolean;
}

export function ScatterPlot({
  title,
  points,
  highlightUids,
  zoomThreshold,
  showOnlyGroup,
  onToggleShowOnly,
  hasGroup,
}: ScatterPlotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [plotSize, setPlotSize] = useState<{ w: number; h: number } | null>(null);
  const [view, setView] = useState<{ x?: [number, number]; y?: [number, number] }>({});
  const [revision, setRevision] = useState(0);
  const [annotations, setAnnotations] = useState<Partial<Layout["annotations"]>>([]);
  const initialRangeRef = useRef<{ xSpan: number; ySpan: number } | null>(null);
  const plotRef = useRef<any>(null);

  const { traces, xRange, yRange } = useMemo(() => {
    if (!points.length) return { traces: [], xRange: [0, 1] as [number, number], yRange: [0, 1] as [number, number] };

    const xs = points.map(p => p.tsne[0]);
    const ys = points.map(p => p.tsne[1]);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const pad = 0.05;
    const xPad = (xMax - xMin) * pad, yPad = (yMax - yMin) * pad;
    const xR: [number, number] = [xMin - xPad, xMax + xPad];
    const yR: [number, number] = [yMin - yPad, yMax + yPad];

    // Split by highlight status and platform
    const highlighted: DataPoint[] = [];
    const normal: DataPoint[] = [];

    for (const p of points) {
      if (highlightUids && highlightUids.has(p.uid)) highlighted.push(p);
      else normal.push(p);
    }

    const makeTrace = (pts: DataPoint[], isHighlight: boolean): Plotly.Data => ({
      x: pts.map(p => p.tsne[0]),
      y: pts.map(p => p.tsne[1]),
      mode: "markers" as const,
      type: "scattergl" as const,
      marker: {
        color: pts.map(p => getPlatformColor(p.db_platform)),
        size: 4,
        opacity: isHighlight ? 1 : highlightUids ? 0.15 : 0.6,
      },
      text: pts.map(p => `${wrapBySqrtWords(p.description_text)}<br>Source: ${p.db_platform}`),
      hoverinfo: "text" as const,
      name: isHighlight ? "Group points" : "Other points",
      showlegend: false,
    });

    const t: Plotly.Data[] = [];
    if (normal.length) t.push(makeTrace(normal, false));
    if (highlighted.length) t.push(makeTrace(highlighted, true));

    return { traces: t, xRange: xR, yRange: yR };
  }, [points, highlightUids]);

  useEffect(() => {
    if (xRange && yRange) {
      initialRangeRef.current = {
        xSpan: xRange[1] - xRange[0],
        ySpan: yRange[1] - yRange[0],
      };
    }
  }, [xRange, yRange]);

  const handleRelayout = useCallback(
    (e: Partial<Plotly.Layout>) => {
      if ((e as any).autosize && Object.keys(e).length === 1) return;
      const init = initialRangeRef.current;
      if (!init) return;

      let curXSpan = init.xSpan;
      let curYSpan = init.ySpan;

      if (e["xaxis.range[0]"] !== undefined && e["xaxis.range[1]"] !== undefined) {
        curXSpan = (e["xaxis.range[1]"] as number) - (e["xaxis.range[0]"] as number);
      }
      if (e["yaxis.range[0]"] !== undefined && e["yaxis.range[1]"] !== undefined) {
        curYSpan = (e["yaxis.range[1]"] as number) - (e["yaxis.range[0]"] as number);
      }

      const showLabels =
        curXSpan <= zoomThreshold * init.xSpan && curYSpan <= zoomThreshold * init.ySpan;

      if (showLabels) {
        const xLo = e["xaxis.range[0]"] as number ?? xRange[0];
        const xHi = e["xaxis.range[1]"] as number ?? xRange[1];
        const yLo = e["yaxis.range[0]"] as number ?? yRange[0];
        const yHi = e["yaxis.range[1]"] as number ?? yRange[1];

        const visible = points.filter(
          p => p.tsne[0] >= xLo && p.tsne[0] <= xHi && p.tsne[1] >= yLo && p.tsne[1] <= yHi
        );

        const labelled = visible.length > MAX_LABELS
          ? visible.filter((_, i) => i % Math.ceil(visible.length / MAX_LABELS) === 0)
          : visible;

        setAnnotations(
          labelled.map(p => {
            return {
              x: p.tsne[0],
              y: p.tsne[1],
              text: wrapBySqrtWords(p.description_text),
              showarrow: false,
              bgcolor: "rgba(0,0,0,0.65)",           // background
              bordercolor: "rgba(255,255,255,0.25)", // border
              borderwidth: 1,
              borderpad: 4,
              font: { size: 10, color: "rgba(255,255,255,0.9)" },
              // font: { size: 8, color: "hsl(210,20%,70%)" },
              // yshift: 10,
            };
          })
        );
      } else {
        setAnnotations([]);
      }
    },
    [points, zoomThreshold, xRange, yRange]
  );

  const handleReset = useCallback(() => {
    setAnnotations([]);
    setView({ x: [...xRange], y: [...yRange] });
    setRevision(r => r + 1);
  }, [xRange, yRange]);

  useEffect(() => {
    setView({ x: [...xRange], y: [...yRange] });
    setAnnotations([]);
  }, [xRange[0], xRange[1], yRange[0], yRange[1]]);

  const layout: Partial<Plotly.Layout> = useMemo(
    () => ({
      xaxis: {
        ...(view.x ? { range: view.x } : {}),
        showgrid: true,
        gridcolor: "hsl(220,15%,14%)",
        zeroline: false,
        color: "hsl(215,15%,55%)",
        tickfont: { size: 9 },
      },
      yaxis: {
        ...(view.y ? { range: view.y } : {}),
        showgrid: true,
        gridcolor: "hsl(220,15%,14%)",
        zeroline: false,
        color: "hsl(215,15%,55%)",
        tickfont: { size: 9 },
      },
      uirevision: `${title}-keep`,
      paper_bgcolor: "transparent",
      plot_bgcolor: "hsl(220,18%,10%)",
      margin: { l: 40, r: 10, t: 10, b: 30 },
      dragmode: "pan" as const,
      hovermode: "closest" as const,
      annotations,
      autosize: false,
      width: plotSize?.w,
      height: plotSize?.h,
    }),
    [view, annotations, revision, title]
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect;
      setPlotSize({ w: Math.floor(cr.width), h: Math.floor(cr.height) });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="panel flex flex-col">
      <div className="panel-header">
        <span className="panel-title">{title}</span>
        <div className="flex items-center gap-3">
          {hasGroup && (
            <div className="flex items-center gap-1.5">
              <Switch
                id={`show-only-${title}`}
                checked={showOnlyGroup}
                onCheckedChange={onToggleShowOnly}
              />
              <Label htmlFor={`show-only-${title}`} className="text-xs text-muted-foreground cursor-pointer">
                Group only
              </Label>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-6 px-2 text-xs">
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 min-h-[300px]">
        {points.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No points to display
          </div>
        ) : (
          <Plot
            data={traces}
            layout={layout}
            config={{
              scrollZoom: true,
              displayModeBar: false,
              responsive: true,
            }}
            revision={revision}
            onRelayout={handleRelayout}
            useResizeHandler
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </div>
    </div>
  );
}
