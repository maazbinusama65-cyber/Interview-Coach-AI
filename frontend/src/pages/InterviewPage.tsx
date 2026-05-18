import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { submitAnswer } from "../api/answers";
import { completeSession, getSession } from "../api/sessions";
import type { EvaluationOut, Question, SessionOut } from "../types";

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? "var(--color-success)" : score >= 5 ? "var(--color-warning)" : "var(--color-danger)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <div className="score-bar-track" style={{ flex: 1 }}>
        <div className="score-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontWeight: 800, fontSize: "1.1rem", color }}>{score}/10</span>
    </div>
  );
}

function EvaluationPanel({
  evaluation,
  onNext,
  isLast,
}: {
  evaluation: EvaluationOut;
  onNext: () => void;
  isLast: boolean;
}) {
  const [showModel, setShowModel] = useState(false);

  return (
    <div className="card" style={{ marginTop: "1rem", animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: "0.75rem" }}>
        <ScoreBar score={evaluation.score} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "1rem" }}>
        {evaluation.strengths.map((s) => (
          <div key={s} style={{ color: "var(--color-success)", fontSize: "0.9rem" }}>✓ {s}</div>
        ))}
        {evaluation.gaps.map((g) => (
          <div key={g} style={{ color: "var(--color-danger)", fontSize: "0.9rem" }}>✗ {g}</div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem", marginBottom: "0.75rem" }}>
        <button
          className="btn-secondary"
          style={{ fontSize: "0.85rem", marginBottom: showModel ? "0.75rem" : 0 }}
          onClick={() => setShowModel((v) => !v)}
        >
          {showModel ? "Hide" : "Show"} Model Answer
        </button>
        {showModel && (
          <div style={{ background: "var(--color-surface-2)", borderRadius: "var(--radius-sm)", padding: "0.9rem", fontSize: "0.9rem", lineHeight: 1.7 }}>
            {evaluation.model_answer}
          </div>
        )}
      </div>

      <div style={{ background: "var(--color-surface-2)", borderRadius: "var(--radius-sm)", padding: "0.75rem", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
        💡 {evaluation.tips}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn-primary" onClick={onNext}>
          {isLast ? "Finish Interview →" : "Next Question →"}
        </button>
      </div>
    </div>
  );
}

export default function InterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [session, setSession] = useState<SessionOut | null>(
    (location.state as { session?: SessionOut } | null)?.session ?? null,
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationOut | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!session && sessionId) {
      getSession(sessionId).then(setSession).catch(() => navigate("/"));
    }
  }, [session, sessionId, navigate]);

  useEffect(() => {
    setAnswer("");
    setEvaluation(null);
    textareaRef.current?.focus();
  }, [currentIndex]);

  if (!session) {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 24, width: 200, marginBottom: "1rem" }} />
        <div className="skeleton" style={{ height: 120 }} />
      </div>
    );
  }

  const questions = session.questions;
  const currentQuestion: Question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  async function handleSubmit() {
    if (!answer.trim() || !sessionId) return;
    setError(null);
    setSubmitting(true);
    try {
      const eval_ = await submitAnswer(currentQuestion.id, answer);
      setEvaluation(eval_);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext() {
    if (isLast) {
      await completeSession(sessionId!).catch(() => null);
      navigate(`/interview/${sessionId}/done`);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  return (
    <div className="page">
      {/* Progress header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <span style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          Question {currentIndex + 1} of {questions.length}
        </span>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <span className={`chip chip-${currentQuestion.difficulty}`}>{currentQuestion.difficulty}</span>
          <span className="chip chip-topic">{currentQuestion.topic}</span>
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: "0.3rem", marginBottom: "1.5rem" }}>
        {questions.map((_, i) => (
          <div
            key={i}
            style={{
              height: 4,
              flex: 1,
              borderRadius: 999,
              background: i < currentIndex
                ? "var(--color-success)"
                : i === currentIndex
                  ? "var(--color-accent)"
                  : "var(--color-border)",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>

      {/* Question card */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <p style={{ fontSize: "1.05rem", lineHeight: 1.7 }}>{currentQuestion.text}</p>
      </div>

      {/* Answer area */}
      {!evaluation && (
        <>
          <label htmlFor="answer-input">Your Answer</label>
          <textarea
            id="answer-input"
            ref={textareaRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here…"
            rows={5}
            style={{ marginBottom: "0.75rem" }}
          />
          {error && <div className="error-banner" style={{ marginBottom: "0.75rem" }}>{error}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={submitting || !answer.trim()}
            >
              {submitting ? "Evaluating…" : "Submit →"}
            </button>
          </div>
        </>
      )}

      {evaluation && (
        <EvaluationPanel evaluation={evaluation} onNext={handleNext} isLast={isLast} />
      )}
    </div>
  );
}
