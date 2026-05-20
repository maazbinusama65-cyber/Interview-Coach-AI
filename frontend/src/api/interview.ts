import { apiFetch } from "./client";

export interface ConversationTurn {
  ai_message: string;
  action: "question" | "follow_up" | "transition" | "wrap_up";
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

export interface TopicEvaluation {
  topic: string;
  score: number;
  strengths: string[];
  gaps: string[];
}

export interface InterviewEvaluation {
  overall_score: number;
  communication_clarity: number;
  structure_organization: number;
  technical_depth: number;
  use_of_examples: number;
  confidence: number;
  topic_scores: TopicEvaluation[];
  top_strengths: string[];
  areas_to_improve: string[];
  summary: string;
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

export interface EvaluateResponse {
  evaluation: InterviewEvaluation;
  session_id: string | null;
}

export function evaluateInterview(
  topics: string[],
  level: string,
  interview_type: string,
  history: HistoryEntry[],
): Promise<EvaluateResponse> {
  return apiFetch("/api/interview/evaluate", {
    method: "POST",
    body: JSON.stringify({ topics, level, interview_type, history }),
  });
}
