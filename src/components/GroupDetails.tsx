import type { Group } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Calendar, MessageSquare } from "lucide-react";

interface GroupDetailsProps {
  group: Group;
}

export function GroupDetails({ group }: GroupDetailsProps) {
  const sortedMembers = [...group.members].sort((a, b) => b.mention_count - a.mention_count);

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <span className="panel-title">Group Details</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">{group.group_name}</h2>
            <p className="text-xs text-muted-foreground font-mono mt-1">ID: {group.group_id}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="stat-card">
              <div className="stat-label">Rank</div>
              <div className="stat-value">#{group.group_rank}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Mentions</div>
              <div className="stat-value">{group.total_mentions.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label flex items-center gap-1"><Users className="h-3 w-3" /> Members</div>
              <div className="stat-value">{group.n_members}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label flex items-center gap-1"><Calendar className="h-3 w-3" /> Events</div>
              <div className="stat-value">{group.event_uids.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Opinions</div>
              <div className="stat-value">{group.opinion_uids.length}</div>
            </div>
          </div>

          <div>
            <h3 className="panel-title mb-2">Top Members</h3>
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs h-8">Entity</TableHead>
                    <TableHead className="text-xs h-8 text-right">Mentions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMembers.slice(0, 20).map((m, i) => (
                    <TableRow key={i} className="hover:bg-secondary/50">
                      <TableCell className="text-xs py-1.5 font-medium">{m.entity_text}</TableCell>
                      <TableCell className="text-xs py-1.5 text-right font-mono text-muted-foreground">
                        {m.mention_count.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {sortedMembers.length > 20 && (
              <p className="text-xs text-muted-foreground mt-1">
                Showing top 20 of {sortedMembers.length} members
              </p>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
