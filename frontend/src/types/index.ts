export type Level = "junior" | "mid" | "senior";
export type InterviewType = "technical" | "behavioral" | "mixed";
export type QuestionDifficulty = "easy" | "medium" | "hard";
export type SessionStatus = "active" | "completed";

export interface Question {
  id: string;
  position: number;
  text: string;
  type: string;
  topic: string;
  difficulty: QuestionDifficulty;
  expected_topics?: string[];
}

export interface SessionOut {
  session_id: string;
  questions: Question[];
}

export interface SessionListItem {
  id: string;
  role: string;
  level: Level;
  interview_type: InterviewType;
  status: SessionStatus;
  total_score: number | null;
  created_at: string;
}

export interface EvaluationOut {
  score: number;
  strengths: string[];
  gaps: string[];
  model_answer: string;
  tips: string;
}

export interface AnswerOut {
  id: string;
  user_text: string;
  score: number | null;
  strengths: string[] | null;
  gaps: string[] | null;
  model_answer: string | null;
  tips: string | null;
  submitted_at: string;
}

export interface QuestionWithAnswer extends Question {
  answer: AnswerOut | null;
}

export interface SessionSummary extends SessionListItem {
  questions: QuestionWithAnswer[];
}

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

export interface SessionConfig {
  role: string;
  level: Level;
  interview_type: InterviewType;
  question_count: number;
}
