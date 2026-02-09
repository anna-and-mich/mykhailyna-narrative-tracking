import { useState, useEffect, useMemo, useCallback } from "react";
import { loadPayload, buildGroupsById, getDefaultGroup, computeVisibleUids, uidsToPoints } from "@/lib/dataHelpers";
import type { Payload, Group, ConfigFilters, DataPoint } from "@/lib/types";
import { GroupSelector } from "@/components/GroupSelector";
import { GroupDetails } from "@/components/GroupDetails";
import { ScatterPlot } from "@/components/ScatterPlot";
import { AdvancedFilters } from "@/components/AdvancedFilters";
import { PlotLegend } from "@/components/PlotLegend";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";

const ZOOM_LABEL_THRESHOLD_DEFAULT = 0.1;

const Index = () => {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [eventFilters, setEventFilters] = useState<ConfigFilters>({});
  const [opinionFilters, setOpinionFilters] = useState<ConfigFilters>({});
  const [zoomThreshold, setZoomThreshold] = useState(ZOOM_LABEL_THRESHOLD_DEFAULT);
  const [showOnlyEventGroup, setShowOnlyEventGroup] = useState(false);
  const [showOnlyOpinionGroup, setShowOnlyOpinionGroup] = useState(false);

  useEffect(() => {
    loadPayload(`${import.meta.env.BASE_URL}data/payload_20.json.gz`)
      .then(p => {
        setPayload(p);
        const def = getDefaultGroup(p.selected_groups);
        if (def) setSelectedGroupId(def.group_id);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const groupsById = useMemo(
    () => (payload ? buildGroupsById(payload.selected_groups) : new Map<number, Group>()),
    [payload]
  );

  const selectedGroup = selectedGroupId !== null ? groupsById.get(selectedGroupId) ?? null : null;

  const visibleEventUids = useMemo(
    () => (payload ? computeVisibleUids(payload.event_config_uids as any, eventFilters) : []),
    [payload, eventFilters]
  );

  const visibleOpinionUids = useMemo(
    () => (payload ? computeVisibleUids(payload.opinion_config_uids as any, opinionFilters) : []),
    [payload, opinionFilters]
  );

  const eventPoints = useMemo(() => {
    if (!payload) return [];
    let uids = visibleEventUids;
    if (showOnlyEventGroup && selectedGroup) {
      const groupSet = new Set(selectedGroup.event_uids);
      uids = uids.filter(u => groupSet.has(u));
    }
    return uidsToPoints(uids, payload.event_index);
  }, [payload, visibleEventUids, showOnlyEventGroup, selectedGroup]);

  const opinionPoints = useMemo(() => {
    if (!payload) return [];
    let uids = visibleOpinionUids;
    if (showOnlyOpinionGroup && selectedGroup) {
      const groupSet = new Set(selectedGroup.opinion_uids);
      uids = uids.filter(u => groupSet.has(u));
    }
    return uidsToPoints(uids, payload.opinion_index);
  }, [payload, visibleOpinionUids, showOnlyOpinionGroup, selectedGroup]);

  const highlightEventUids = useMemo(
    () => (selectedGroup ? new Set(selectedGroup.event_uids) : undefined),
    [selectedGroup]
  );

  const highlightOpinionUids = useMemo(
    () => (selectedGroup ? new Set(selectedGroup.opinion_uids) : undefined),
    [selectedGroup]
  );

  const handleGroupSelect = useCallback((id: number) => {
    setSelectedGroupId(id);
    setShowOnlyEventGroup(false);
    setShowOnlyOpinionGroup(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading & decompressing dataset...</p>
        </div>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center text-destructive">
          <p className="text-lg font-semibold">Failed to load data</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-80 shrink-0 border-r border-border flex flex-col bg-card">
        <div className="h-12 border-b border-border flex items-center px-4">
          <h1 className="text-sm font-bold tracking-wider text-primary uppercase font-mono">
            Entity Explorer
          </h1>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="border-b border-border flex flex-col min-h-0" style={{ flex: "0 0 45%" }}>
            <div className="flex-1 min-h-0 overflow-auto">
              <GroupSelector
                groups={payload.selected_groups}
                selectedGroupId={selectedGroupId}
                onSelect={handleGroupSelect}
              />
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            {selectedGroup ? (
              <GroupDetails group={selectedGroup} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Select a group
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-auto">
        <div className="p-4 space-y-4">
          {/* Controls bar */}
          <div className="panel">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <PlotLegend />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground shrink-0">
                  Zoom label threshold:
                </span>
                <Slider
                  value={[zoomThreshold]}
                  onValueChange={v => setZoomThreshold(v[0])}
                  min={0.05}
                  max={1}
                  step={0.05}
                  className="max-w-xs"
                />
                <span className="text-xs font-mono text-foreground w-10">
                  {zoomThreshold.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Events: {eventPoints.length.toLocaleString()} points · 
                Opinions: {opinionPoints.length.toLocaleString()} points
              </div>
            </div>
            <AdvancedFilters
              eventConfigs={payload.event_config_uids}
              opinionConfigs={payload.opinion_config_uids}
              eventFilters={eventFilters}
              opinionFilters={opinionFilters}
              onEventFiltersChange={setEventFilters}
              onOpinionFiltersChange={setOpinionFilters}
            />
          </div>

          {/* Plots */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="min-h-[450px]">
              <ScatterPlot
                title="Events (t-SNE)"
                points={eventPoints}
                highlightUids={highlightEventUids}
                zoomThreshold={zoomThreshold}
                showOnlyGroup={showOnlyEventGroup}
                onToggleShowOnly={setShowOnlyEventGroup}
                hasGroup={!!selectedGroup}
              />
            </div>
            <div className="min-h-[450px]">
              <ScatterPlot
                title="Opinions (t-SNE)"
                points={opinionPoints}
                highlightUids={highlightOpinionUids}
                zoomThreshold={zoomThreshold}
                showOnlyGroup={showOnlyOpinionGroup}
                onToggleShowOnly={setShowOnlyOpinionGroup}
                hasGroup={!!selectedGroup}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
