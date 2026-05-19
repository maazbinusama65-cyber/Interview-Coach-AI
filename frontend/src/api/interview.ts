import { apiFetch } from "./client";

export interface ConversationTurn {
  ai_message: string;
  action: "question" | "follow_up" | "transition" | "feedback" | "wrap_up";
  score: number | null;
  strengths: string[];
  gaps: string[];
  communication_clarity: number | null;
  structure_organization: number | null;
  technical_depth: number | null;
  use_of_examples: number | null;
  confidence: number | null;
}

export interface SpeechAnalysis {
  filler_count: number;
  filler_words: string[];
  word_count: number;
  estimated_wpm: number;
  long_pauses: number;
  clarity_score: number;
}

export interface ConverseResponse {
  turn: ConversationTurn;
  speech_analysis: SpeechAnalysis | null;
}

export interface HistoryEntry {
  role: "assistant" | "user";
  content: string;
}

export function converse(
  topics: string[],
  level: string,
  interview_type: string,
  history: HistoryEntry[],
  user_transcript?: string | null,
): Promise<ConverseResponse> {
  return apiFetch("/api/interview/converse", {
    method: "POST",
    body: JSON.stringify({
      topics,
      level,
      interview_type,
      history,
      user_transcript: user_transcript ?? null,
    }),
  });
}
