import { apiFetch } from "./client";
import type {
  SessionConfig,
  SessionConfigV2,
  SessionListItem,
  SessionOut,
  SessionSummary,
  TopicCategory,
} from "../types";

/** V1: single-role session */
export const createSession = (config: SessionConfig): Promise<SessionOut> =>
  apiFetch("/api/sessions", {
    method: "POST",
    body: JSON.stringify(config),
  });

/** V2: multi-topic session */
export const createSessionV2 = (config: SessionConfigV2): Promise<SessionOut> =>
  apiFetch("/api/sessions/v2", {
    method: "POST",
    body: JSON.stringify(config),
  });

export const listSessions = (): Promise<SessionListItem[]> =>
  apiFetch("/api/sessions");

export const getSession = (id: string): Promise<SessionOut> =>
  apiFetch(`/api/sessions/${id}`);

export const completeSession = (id: string): Promise<SessionListItem> =>
  apiFetch(`/api/sessions/${id}/complete`, { method: "POST" });

export const getSessionSummary = (id: string): Promise<SessionSummary> =>
  apiFetch(`/api/sessions/${id}/summary`);

/** Fetch topic catalog */
export const getTopics = (): Promise<TopicCategory[]> =>
  apiFetch("/api/topics");
