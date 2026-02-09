import pako from "pako";
import type { Payload, Group, ConfigUidGroup, ConfigFilters, DataPoint } from "./types";

function looksLikeJson(bytes: Uint8Array) {
  // Skip UTF-8 BOM and whitespace
  let i = 0;
  while (i < bytes.length && (bytes[i] === 0xef || bytes[i] === 0xbb || bytes[i] === 0xbf || bytes[i] <= 0x20)) i++;
  return bytes[i] === 0x7b /* { */ || bytes[i] === 0x5b /* [ */;
}

function isGzip(bytes: Uint8Array) {
  // gzip magic numbers: 1f 8b
  return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

export async function loadPayload(url: string): Promise<Payload> {
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Fetch failed ${response.status} ${response.statusText}. Body: ${text.slice(0, 120)}`);
  }

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  let jsonText: string;

  if (isGzip(bytes)) {
    jsonText = pako.ungzip(bytes, { to: "string" }) as string;
  } else if (looksLikeJson(bytes)) {
    jsonText = new TextDecoder("utf-8").decode(bytes);
  } else {
    const head = new TextDecoder().decode(bytes.slice(0, 200));
    throw new Error(`Unknown payload format. First bytes: ${head}`);
  }

  return JSON.parse(jsonText) as Payload;
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

export function wrapBySqrtWords(text: string): string {
  const words = (text ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  const nLines = Math.max(1, Math.floor(Math.sqrt(words.length)));
  const wordsPerLine = Math.ceil(words.length / nLines);

  const lines: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    lines.push(words.slice(i, i + wordsPerLine).join(" "));
  }
  return lines.join("<br>");
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
  if (platform === "X") return "hsl(0, 0%, 95%)";
  return "hsl(270, 60%, 55%)";
}
