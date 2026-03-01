export type MissionStatus =
  | "initialized"
  | "jarvis_complete"
  | "cypher_complete"
  | "rayblt_complete"
  | "sentinel_complete"
  | "awaiting_approval"
  | "approved"
  | "rejected"
  | "revising"
  | "failed";

export type RequestType =
  | "strategy"
  | "build"
  | "modify"
  | "audit";

export interface MissionState {
  mission_id: string;
  channel_id: string;
  thread_ts: string;
  request_type: RequestType;
  status: MissionStatus;
}
