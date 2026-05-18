import { apiFetch } from "./client";
import type { ProgressOut } from "../types";

export const getProgress = (): Promise<ProgressOut> =>
  apiFetch("/api/progress");

export const getTopics = (): Promise<string[]> =>
  apiFetch("/api/topics");
