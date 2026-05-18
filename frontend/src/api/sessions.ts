import { apiFetch } from "./client";
import type {
  SessionConfig,
  SessionListItem,
  SessionOut,
  SessionSummary,
} from "../types";

export const createSession = (config: SessionConfig): Promise<SessionOut> =>
  apiFetch("/api/sessions", {
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
