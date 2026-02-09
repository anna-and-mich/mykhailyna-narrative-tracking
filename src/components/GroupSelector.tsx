import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Group } from "@/lib/types";
import { Search } from "lucide-react";

interface GroupSelectorProps {
  groups: Group[];
  selectedGroupId: number | null;
  onSelect: (groupId: number) => void;
}

export function GroupSelector({ groups, selectedGroupId, onSelect }: GroupSelectorProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return groups
      .filter(g => g.group_name.toLowerCase().includes(q) || String(g.group_id).includes(q))
      .sort((a, b) => b.total_mentions - a.total_mentions);
  }, [groups, search]);

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <span className="panel-title">Entity Groups</span>
        <span className="text-xs text-muted-foreground font-mono">{groups.length}</span>
      </div>
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-secondary border-border"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-1 pb-1">
          {filtered.map(g => (
            <button
              key={g.group_id}
              onClick={() => onSelect(g.group_id)}
              className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${
                selectedGroupId === g.group_id
                  ? "bg-primary/15 glow-border"
                  : "hover:bg-secondary"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground truncate flex-1 mr-2">
                  {g.group_name}
                </span>
                <span className="font-mono text-muted-foreground shrink-0">
                  {g.total_mentions.toLocaleString()}
                </span>
              </div>
              <div className="text-muted-foreground mt-0.5 font-mono">
                ID: {g.group_id} · Rank #{g.group_rank}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
