import pako from "pako";
import type { Payload, Group, ConfigUidGroup, ConfigFilters, DataPoint } from "./types";

export async function loadPayload(url: string): Promise<Payload> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const decompressed = pako.ungzip(new Uint8Array(buffer), { to: "string" });
  return JSON.parse(decompressed) as Payload;
}

export function buildGroupsById(groups: Group[]): Map<number, Group> {
  const map = new Map<number, Group>();
  for (const g of groups) map.set(g.group_id, g);
  return map;
}

export function getDefaultGroup(groups: Group[]): Group | undefined {
  if (!groups.length) return undefined;
  return groups.reduce((best, g) => (g.total_mentions > best.total_mentions ? g : best), groups[0]);
}

export function configMatches(filters: ConfigFilters, config: Record<string, string>): boolean {
  for (const [key, value] of Object.entries(filters)) {
    if (value && config[key] !== value) return false;
  }
  return true;
}

export function computeVisibleUids<T extends Record<string, string>>(
  configGroups: ConfigUidGroup<T>[],
  filters: ConfigFilters
): string[] {
  const uids: string[] = [];
  for (const cg of configGroups) {
    if (configMatches(filters, cg.configuration as unknown as Record<string, string>)) {
      uids.push(...cg.uids);
    }
  }
  return uids;
}

export function uidsToPoints(uids: string[], index: Record<string, DataPoint>): DataPoint[] {
  const points: DataPoint[] = [];
  for (const uid of uids) {
    const p = index[uid];
    if (p) points.push(p);
  }
  return points;
}

export function getConfigOptions<T>(
  configGroups: ConfigUidGroup<T>[],
  key: string
): string[] {
  const set = new Set<string>();
  for (const cg of configGroups) {
    const val = (cg.configuration as any)[key];
    if (val !== undefined) set.add(String(val));
  }
  return Array.from(set).sort();
}

export function getPlatformColor(platform: string): string {
  if (platform === "Telegram") return "hsl(210, 90%, 55%)";
  if (platform === "X") return "hsl(220, 10%, 20%)";
  return "hsl(270, 60%, 55%)";
}
