import { apiFetch } from "./client";
import type { ProgressOut } from "../types";

export const getProgress = (): Promise<ProgressOut> =>
  apiFetch("/api/progress");

export const getPracticedTopics = (): Promise<string[]> =>
  apiFetch("/api/topics/practiced");
