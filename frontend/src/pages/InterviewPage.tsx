import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { submitAnswer } from "../api/answers";
import { completeSession, getSession } from "../api/sessions";
import type { BehavioralFeedback, EvaluationOut, InterviewSection, Question, SessionOut } from "../types";

function scoreColor(score: number): string {
  if (score >= 7) return "var(--success)";
  if (score >= 5) return "var(--warning)";
  return "var(--danger)";
}

function ScoreBar({ score, label }: { score: number; label?: string }) {
  const pct = (score / 10) * 100;
  const color = scoreColor(score);
  return (
    <div>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>{label}</span>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color }}>{score}/10</span>
        </div>
      )}
      <div className="score-bar-track" style={{ height: label ? 6 : 8 }}>
        <div
          className="score-bar-fill"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}, ${color})`,
            boxShadow: `0 0 12px ${color}`,
          }}
        />
      </div>
    </div>
  );
}

function BehavioralPanel({ feedback }: { feedback: BehavioralFeedback }) {
  const dimensions = [
    { key: "communication_clarity", label: "Communication" },
    { key: "structure_organization", label: "Structure" },
    { key: "technical_depth", label: "Technical depth" },
    { key: "use_of_examples", label: "Examples" },
    { key: "confidence", label: "Confidence" },
  ] as const;

  return (
    <div style={{ marginTop: "1.25rem" }}>
      <div style={{
        fontSize: "0.7rem", color: "var(--accent-light)", fontWeight: 700,
        letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem",
      }}>
        Behavioural Analysis
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {dimensions.map(({ key, label }) => (
          <ScoreBar key={key} score={feedback[key]} label={label} />
        ))}
      </div>
      {feedback.overall_impression && (
        <div style={{
          marginTop: "1rem", padding: "0.85rem 1rem",
          background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 12, fontSize: "0.88rem", lineHeight: 1.6, color: "var(--text)",
        }}>
          <span style={{ fontWeight: 600 }}>Overall: </span>{feedback.overall_impression}
        </div>
      )}
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
    <div className="card anim-slideUp" style={{ marginTop: "1.25rem", padding: "1.75rem" }}>
      <div style={{
        fontSize: "0.7rem", color: "var(--accent-light)", fontWeight: 700,
        letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.85rem",
      }}>
        Evaluation
      </div>

      {/* Main score */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div className="score-bar-track" style={{ flex: 1 }}>
            <div
              className="score-bar-fill"
              style={{
                width: `${(evaluation.score / 10) * 100}%`,
                background: `linear-gradient(90deg, ${scoreColor(evaluation.score)}, ${scoreColor(evaluation.score)})`,
                boxShadow: `0 0 12px ${scoreColor(evaluation.score)}`,
              }}
            />
          </div>
          <span style={{
            fontWeight: 800, fontSize: "1.5rem", color: scoreColor(evaluation.score),
            lineHeight: 1, minWidth: 70, textAlign: "right",
          }}>
            {evaluation.score}<span style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 600 }}>/10</span>
          </span>
        </div>
      </div>

      {/* Strengths / gaps */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {evaluation.strengths.length > 0 && (
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.6rem" }}>
              Strengths
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {evaluation.strengths.map((s) => (
                <div key={s} style={{ display: "flex", gap: "0.55rem", fontSize: "0.9rem", lineHeight: 1.55 }}>
                  <span style={{ color: "var(--success)", marginTop: 1 }}>✓</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {evaluation.gaps.length > 0 && (
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--danger)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.6rem" }}>
              Gaps
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {evaluation.gaps.map((g) => (
                <div key={g} style={{ display: "flex", gap: "0.55rem", fontSize: "0.9rem", lineHeight: 1.55 }}>
                  <span style={{ color: "var(--danger)", marginTop: 1 }}>✗</span>
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Behavioral feedback */}
      {evaluation.behavioral_feedback && (
        <BehavioralPanel feedback={evaluation.behavioral_feedback} />
      )}

      {/* Model answer */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.25rem", marginTop: "1.25rem", marginBottom: "1.25rem" }}>
        <button
          className="btn-secondary"
          style={{ fontSize: "0.85rem", marginBottom: showModel ? "0.85rem" : 0 }}
          onClick={() => setShowModel((v) => !v)}
        >
          {showModel ? "▼ Hide" : "▶ Show"} Model Answer
        </button>
        <div style={{
          overflow: "hidden",
          maxHeight: showModel ? 1000 : 0,
          opacity: showModel ? 1 : 0,
          transition: "max-height 0.4s ease, opacity 0.3s ease",
        }}>
          <div style={{
            background: "rgba(255,255,255,0.025)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "1.1rem", fontSize: "0.92rem",
            lineHeight: 1.7, color: "var(--text)", whiteSpace: "pre-wrap",
          }}>
            {evaluation.model_answer}
          </div>
        </div>
      </div>

      <div className="callout-tip" style={{ marginBottom: "1.5rem" }}>
        <span style={{ fontSize: "1.05rem" }}>💡</span>
        <span style={{ color: "var(--text)" }}>{evaluation.tips}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn-primary" onClick={onNext} style={{ padding: "0.75rem 1.5rem" }}>
          {isLast ? "Finish Interview" : "Next Question"} <span style={{ marginLeft: 6 }}>→</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Section transition banner ──────────────────────────────────────────── */

function SectionBanner({ section, sectionIndex, totalSections }: {
  section: InterviewSection;
  sectionIndex: number;
  totalSections: number;
}) {
  return (
    <div
      className="anim-slideUp"
      style={{
        padding: "1rem 1.25rem",
        marginBottom: "1.5rem",
        background: "rgba(99,102,241,0.08)",
        border: "1px solid rgba(99,102,241,0.25)",
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        gap: "0.85rem",
      }}
    >
      <span style={{
        width: 32, height: 32, borderRadius: 9, fontSize: "0.78rem",
        fontWeight: 700, display: "inline-flex", alignItems: "center",
        justifyContent: "center", background: "rgba(99,102,241,0.2)",
        border: "1px solid rgba(99,102,241,0.4)", color: "var(--indigo-light)",
      }}>
        {sectionIndex + 1}
      </span>
      <div>
        <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
          Section {sectionIndex + 1} of {totalSections}: {section.topic_name}
        </div>
        <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
          {section.topic_category} · {section.question_count} question{section.question_count !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

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
        <div className="skeleton" style={{ height: 4, marginBottom: "1.5rem" }} />
        <div className="skeleton" style={{ height: 28, width: 220, marginBottom: "1.25rem" }} />
        <div className="skeleton" style={{ height: 180, marginBottom: "1rem" }} />
        <div className="skeleton" style={{ height: 140 }} />
      </div>
    );
  }

  const questions = session.questions;
  const currentQuestion: Question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const progressPct = ((currentIndex + (evaluation ? 1 : 0)) / questions.length) * 100;

  // Section awareness
  const sections = session.sections ?? [];
  const currentSection = sections.find(s => s.id === currentQuestion.section_id);
  const currentSectionIndex = currentSection ? sections.findIndex(s => s.id === currentSection.id) : -1;
  const isFirstQuestionInSection = currentIndex === 0 || (
    currentQuestion.section_id !== questions[currentIndex - 1]?.section_id
  );

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
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div className="hero-glow" style={{ top: -500, opacity: 0.4 }} />

      {/* Sticky progress header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(5,7,15,0.85)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 1.5rem",
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0.6rem 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {currentSection ? `${currentSection.topic_name} · Section ${currentSectionIndex + 1}/${sections.length}` : session.role}
            </span>
            <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
              {currentIndex + (evaluation ? 1 : 0)} / {questions.length}
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <div className="page" style={{ position: "relative", zIndex: 1 }}>
        {/* Section banner */}
        {sections.length > 0 && isFirstQuestionInSection && currentSection && (
          <SectionBanner
            section={currentSection}
            sectionIndex={currentSectionIndex}
            totalSections={sections.length}
          />
        )}

        {/* Question header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: "1.25rem", gap: "1rem", flexWrap: "wrap",
        }}>
          <div style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            Question {currentIndex + 1}{" "}
            <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>of {questions.length}</span>
          </div>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <span className={`chip chip-${currentQuestion.difficulty}`}>
              {currentQuestion.difficulty}
            </span>
            <span className="chip chip-topic">{currentQuestion.topic}</span>
          </div>
        </div>

        {/* Question card */}
        <div className="card anim-fadeIn" style={{ padding: "2rem", marginBottom: "1.5rem", position: "relative" }}>
          <div style={{
            position: "absolute", top: -14, left: 20,
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            color: "#fff", fontSize: "0.78rem", fontWeight: 700,
            padding: "0.3rem 0.7rem", borderRadius: 8,
            letterSpacing: "0.04em", boxShadow: "0 4px 14px var(--accent-glow)",
          }}>
            Q{currentIndex + 1}
          </div>
          <p style={{ fontSize: "1.15rem", lineHeight: 1.65, fontWeight: 500, color: "var(--text)" }}>
            {currentQuestion.text}
          </p>
        </div>

        {/* Answer area */}
        {!evaluation && (
          <div className="anim-fadeIn">
            <label htmlFor="answer-input">Your Answer</label>
            <textarea
              id="answer-input"
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here…"
              rows={6}
              style={{ marginBottom: "0.85rem" }}
            />
            {error && <div className="error-banner" style={{ marginBottom: "0.85rem" }}>{error}</div>}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {answer.trim().length} characters
              </span>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={submitting || !answer.trim()}
                style={{ padding: "0.75rem 1.5rem" }}
              >
                {submitting ? (
                  <>
                    <span style={{
                      display: "inline-block", width: 14, height: 14,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff", borderRadius: "50%",
                      animation: "spin-slow 0.8s linear infinite",
                      verticalAlign: "middle", marginRight: 8,
                    }} />
                    Evaluating…
                  </>
                ) : (
                  <>Submit Answer <span style={{ marginLeft: 6 }}>→</span></>
                )}
              </button>
            </div>
          </div>
        )}

        {evaluation && (
          <EvaluationPanel evaluation={evaluation} onNext={handleNext} isLast={isLast} />
        )}
      </div>
    </div>
  );
}
