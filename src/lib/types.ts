export interface GroupMember {
  entity_text: string;
  mention_count: number;
}

export interface Group {
  group_id: number;
  group_rank: number;
  total_mentions: number;
  n_members: number;
  group_name: string;
  embedding_model: string;
  judge_model: string;
  judge_prompt_hash: string;
  min_confidence: string;
  members: GroupMember[];
  event_uids: string[];
  opinion_uids: string[];
}

export interface EventConfig {
  ent_group_embedding_model: string;
  judge_model: string;
  judge_prompt_hash: string;
  min_confidence: string;
  entity_model: string;
  event_model: string;
}

export interface OpinionConfig extends EventConfig {
  opinion_model: string;
}

export interface ConfigUidGroup<T> {
  configuration: T;
  uids: string[];
}

export interface DataPoint {
  uid: string;
  description_text: string;
  db_alias: string;
  db_platform: string;
  text_hash: string;
  tsne: [number, number];
  event_id?: string;
  opinion_id?: string;
}

export interface Payload {
  schema_version: number;
  generated_at: string;
  db_path: string;
  embed_model: string;
  filters: Record<string, string | null>;
  groups_min_mentions_exclusive?: number;
  selected_groups: Group[];
  event_config_uids: ConfigUidGroup<EventConfig>[];
  opinion_config_uids: ConfigUidGroup<OpinionConfig>[];
  event_index: Record<string, DataPoint>;
  opinion_index: Record<string, DataPoint>;
}

export type ConfigFilters = Record<string, string>;
