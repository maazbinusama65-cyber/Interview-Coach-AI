import { apiFetch } from "./client";
import type { EvaluationOut } from "../types";

export const submitAnswer = (
  questionId: string,
  userText: string,
): Promise<EvaluationOut> =>
  apiFetch("/api/answers", {
    method: "POST",
    body: JSON.stringify({ question_id: questionId, user_text: userText }),
  });
