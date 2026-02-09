import { useMemo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getConfigOptions } from "@/lib/dataHelpers";
import type { ConfigUidGroup, EventConfig, OpinionConfig, ConfigFilters } from "@/lib/types";
import { X } from "lucide-react";

const EVENT_FILTER_KEYS = [
  "ent_group_embedding_model",
  "judge_model",
  "judge_prompt_hash",
  "min_confidence",
  "entity_model",
  "event_model",
];

const OPINION_FILTER_KEYS = [
  ...EVENT_FILTER_KEYS,
  "opinion_model",
];

interface AdvancedFiltersProps {
  eventConfigs: ConfigUidGroup<EventConfig>[];
  opinionConfigs: ConfigUidGroup<OpinionConfig>[];
  eventFilters: ConfigFilters;
  opinionFilters: ConfigFilters;
  onEventFiltersChange: (f: ConfigFilters) => void;
  onOpinionFiltersChange: (f: ConfigFilters) => void;
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  if (options.length <= 1) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-36 shrink-0 truncate font-mono">{label}</span>
      <Select value={value || "__all__"} onValueChange={v => onChange(v === "__all__" ? "" : v)}>
        <SelectTrigger className="h-7 text-xs flex-1 bg-secondary border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All</SelectItem>
          {options.map(o => (
            <SelectItem key={o} value={o} className="text-xs font-mono">{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function AdvancedFilters({
  eventConfigs,
  opinionConfigs,
  eventFilters,
  opinionFilters,
  onEventFiltersChange,
  onOpinionFiltersChange,
}: AdvancedFiltersProps) {
  const eventOptions = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const k of EVENT_FILTER_KEYS) m[k] = getConfigOptions(eventConfigs as any, k);
    return m;
  }, [eventConfigs]);

  const opinionOptions = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const k of OPINION_FILTER_KEYS) m[k] = getConfigOptions(opinionConfigs as any, k);
    return m;
  }, [opinionConfigs]);

  const hasAnyFilter = Object.values(eventFilters).some(Boolean) || Object.values(opinionFilters).some(Boolean);

  const clearAll = () => {
    onEventFiltersChange({});
    onOpinionFiltersChange({});
  };

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="advanced" className="border-border">
        <AccordionTrigger className="text-xs text-muted-foreground hover:no-underline py-2 px-4">
          <span className="flex items-center gap-2">
            Advanced Configuration Filters
            {hasAnyFilter && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-3">
          <div className="space-y-4">
            {hasAnyFilter && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 text-xs text-muted-foreground">
                <X className="h-3 w-3 mr-1" /> Clear all filters
              </Button>
            )}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Event Filters</h4>
              <div className="space-y-1.5">
                {EVENT_FILTER_KEYS.map(k => (
                  <FilterRow
                    key={k}
                    label={k}
                    options={eventOptions[k]}
                    value={eventFilters[k] || ""}
                    onChange={v => onEventFiltersChange({ ...eventFilters, [k]: v })}
                  />
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Opinion Filters</h4>
              <div className="space-y-1.5">
                {OPINION_FILTER_KEYS.map(k => (
                  <FilterRow
                    key={k}
                    label={k}
                    options={opinionOptions[k]}
                    value={opinionFilters[k] || ""}
                    onChange={v => onOpinionFiltersChange({ ...opinionFilters, [k]: v })}
                  />
                ))}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
