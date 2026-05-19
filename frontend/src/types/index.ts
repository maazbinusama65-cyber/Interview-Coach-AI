export type Level = "junior" | "mid" | "senior";
export type InterviewType = "technical" | "behavioral" | "mixed";
export type QuestionDifficulty = "easy" | "medium" | "hard";
export type SessionStatus = "active" | "completed";

// ── Topic catalog ────────────────────────────────────────────────────────

export interface TopicCategory {
  category: string;
  topics: string[];
}

export interface TopicSelection {
  topic_name: string;
  question_count: number;
}

// ── Session ──────────────────────────────────────────────────────────────

/** V1 session config (single role) */
export interface SessionConfig {
  role: string;
  level: Level;
  interview_type: InterviewType;
  question_count: number;
}

/** V2 session config (multi-topic) */
export interface SessionConfigV2 {
  level: Level;
  interview_type: InterviewType;
  topics: TopicSelection[];
}

export interface InterviewSection {
  id: string;
  topic_category: string;
  topic_name: string;
  question_count: number;
  position: number;
}

export interface Question {
  id: string;
  position: number;
  text: string;
  type: string;
  topic: string;
  difficulty: QuestionDifficulty;
  expected_topics?: string[];
  section_id?: string | null;
}

export interface SessionOut {
  session_id: string;
  role: string;
  level: string;
  interview_type: string;
  questions: Question[];
  sections?: InterviewSection[] | null;
  topics?: string[] | null;
}

export interface SessionListItem {
  id: string;
  role: string;
  level: Level;
  interview_type: InterviewType;
  status: SessionStatus;
  total_score: number | null;
  created_at: string;
  topics?: string[] | null;
}

// ── Behavioral feedback ──────────────────────────────────────────────────

export interface BehavioralFeedback {
  communication_clarity: number;
  structure_organization: number;
  technical_depth: number;
  use_of_examples: number;
  confidence: number;
  overall_impression: string;
}

// ── Answer / Evaluation ──────────────────────────────────────────────────

export interface EvaluationOut {
  score: number;
  strengths: string[];
  gaps: string[];
  model_answer: string;
  tips: string;
  behavioral_feedback?: BehavioralFeedback | null;
}

export interface AnswerOut {
  id: string;
  user_text: string;
  score: number | null;
  strengths: string[] | null;
  gaps: string[] | null;
  model_answer: string | null;
  tips: string | null;
  behavioral_feedback?: BehavioralFeedback | null;
  submitted_at: string;
}

export interface QuestionWithAnswer extends Question {
  answer: AnswerOut | null;
}

export interface SessionSummary extends SessionListItem {
  questions: QuestionWithAnswer[];
  sections?: InterviewSection[] | null;
}

// ── Progress ─────────────────────────────────────────────────────────────

export interface TopicScore {
  topic: string;
  avg_score: number;
  attempt_count: number;
}

export interface ProgressOut {
  weaknesses: TopicScore[];
  strengths: TopicScore[];
  total_sessions: number;
  overall_avg_score: number;
}
