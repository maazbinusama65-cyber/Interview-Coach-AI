import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createSessionV2, getTopics } from "../api/sessions";
import type {
  InterviewType,
  Level,
  TopicCategory,
  TopicSelection,
} from "../types";

/* ─── Constants ──────────────────────────────────────────────────────────── */

const LEVELS: { value: Level; label: string; sub: string }[] = [
  { value: "junior", label: "Junior", sub: "0 – 2 years" },
  { value: "mid",    label: "Mid",    sub: "2 – 5 years" },
  { value: "senior", label: "Senior", sub: "5+ years" },
];

const TYPES: { value: InterviewType; label: string; desc: string; icon: string }[] = [
  { value: "technical",  label: "Technical only",      icon: "💻", desc: "Algorithms, system design, coding" },
  { value: "behavioral", label: "Behavioural only",    icon: "🤝", desc: "Leadership, teamwork, situational" },
  { value: "mixed",      label: "Mixed (recommended)", icon: "⚡", desc: "60 % technical — 40 % behavioural" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Roles:              "rgba(99,102,241,0.15)",
  Languages:          "rgba(245,158,11,0.12)",
  Frontend:           "rgba(16,185,129,0.12)",
  Backend:            "rgba(139,92,246,0.12)",
  "Data & Storage":   "rgba(34,211,238,0.12)",
  Infrastructure:     "rgba(248,113,113,0.1)",
  "CS Fundamentals":  "rgba(251,191,36,0.1)",
  "Soft Skills":      "rgba(236,72,153,0.12)",
};

const CATEGORY_BORDER: Record<string, string> = {
  Roles:              "rgba(99,102,241,0.35)",
  Languages:          "rgba(245,158,11,0.3)",
  Frontend:           "rgba(16,185,129,0.3)",
  Backend:            "rgba(139,92,246,0.3)",
  "Data & Storage":   "rgba(34,211,238,0.3)",
  Infrastructure:     "rgba(248,113,113,0.25)",
  "CS Fundamentals":  "rgba(251,191,36,0.25)",
  "Soft Skills":      "rgba(236,72,153,0.3)",
};

/* ─── Step label ──────────────────────────────────────────────────────────── */

function StepLabel({ step, title, hint }: { step: number; title: string; hint?: string }) {
  return (
    <div className="section-label">
      <span className="section-label-num">STEP {step}</span>
      <span style={{ fontWeight: 700, fontSize: "1rem" }}>{title}</span>
      {hint && <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{hint}</span>}
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function SetupPage() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<TopicCategory[]>([]);
  const [selected, setSelected] = useState<Map<string, number>>(new Map()); // topic_name → question_count
  const [level, setLevel] = useState<Level>("mid");
  const [interviewType, setInterviewType] = useState<InterviewType>("mixed");
  const [mode, setMode] = useState<"text" | "live">("live"); // default to live
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: topics, 2: config, 3: preview

  useEffect(() => {
    getTopics()
      .then(setCatalog)
      .catch(() => setError("Failed to load topics"))
      .finally(() => setCatalogLoading(false));
  }, []);

  function toggleTopic(name: string) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(name)) {
        next.delete(name);
      } else if (next.size < 8) {
        next.set(name, 3); // default 3 questions per topic
      }
      return next;
    });
  }

  function setTopicCount(name: string, count: number) {
    setSelected((prev) => {
      const next = new Map(prev);
      next.set(name, Math.max(1, Math.min(10, count)));
      return next;
    });
  }

  const totalQuestions = Array.from(selected.values()).reduce((a, b) => a + b, 0);
  const estimatedMinutes = totalQuestions * 2;

  async function handleStart() {
    setError(null);
    setLoading(true);
    const topicNames = Array.from(selected.keys());

    if (mode === "live") {
      // Live video interview — no pre-generated questions needed
      setLoading(false);
      navigate("/live-interview", {
        state: { topics: topicNames, level, interview_type: interviewType },
      });
      return;
    }

    // Text-based interview — generate questions via V2
    const topics: TopicSelection[] = Array.from(selected.entries()).map(
      ([topic_name, question_count]) => ({ topic_name, question_count }),
    );
    try {
      const session = await createSessionV2({ level, interview_type: interviewType, topics });
      localStorage.setItem(`session_${session.session_id}`, JSON.stringify(session));
      navigate(`/interview/${session.session_id}`, { state: { session } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div className="hero-glow" style={{ top: -350, opacity: 0.6 }} />
      <div className="grid-pattern" />

      <nav className="nav">
        <Link to="/" className="nav-brand">
          <span className="nav-brand-mark" />
          Interview Coach
        </Link>
      </nav>

      <div className="page-wide" style={{ position: "relative", zIndex: 1, paddingTop: "2rem", maxWidth: 860, margin: "0 auto" }}>
        <Link to="/" style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "1.25rem", display: "inline-block" }}>
          ← Back
        </Link>

        {/* Header */}
        <div className="anim-slideUp" style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: "0.35rem" }}>
            Build your <span className="gradient-text">interview</span>
          </h1>
          <p style={{ color: "var(--text-dim)", fontSize: "0.95rem" }}>
            Pick topics, set difficulty, preview the structure — then start.
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.75rem" }}>
          {["Topics", "Settings", "Preview"].map((label, i) => (
            <button
              key={label}
              className="btn-ghost"
              onClick={() => i + 1 < step ? setStep(i + 1) : undefined}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: 999,
                fontSize: "0.78rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                background: step === i + 1 ? "rgba(99,102,241,0.15)" : "transparent",
                color: step === i + 1 ? "var(--indigo-light)" : step > i + 1 ? "var(--text-dim)" : "var(--text-muted)",
                border: step === i + 1 ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                cursor: i + 1 < step ? "pointer" : "default",
              }}
            >
              {i + 1}. {label}
            </button>
          ))}
        </div>

        {error && <div className="error-banner anim-slideDown" style={{ marginBottom: "1.25rem" }}>{error}</div>}

        {/* ── Step 1: Topics ── */}
        {step === 1 && (
          <div className="anim-slideUp">
            <StepLabel step={1} title="Choose your topics" hint={`${selected.size}/8 selected · ${totalQuestions} questions`} />

            {catalogLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                {catalog.map((cat) => (
                  <div key={cat.category}>
                    <div style={{
                      fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em",
                      textTransform: "uppercase", color: "var(--text-dim)", marginBottom: "0.65rem",
                    }}>
                      {cat.category}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                      {cat.topics.map((topic) => {
                        const isSelected = selected.has(topic);
                        return (
                          <div key={topic} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                            <button
                              onClick={() => toggleTopic(topic)}
                              style={{
                                padding: "0.45rem 0.85rem",
                                borderRadius: isSelected ? "999px 0 0 999px" : 999,
                                fontSize: "0.82rem",
                                fontWeight: isSelected ? 600 : 500,
                                background: isSelected
                                  ? CATEGORY_COLORS[cat.category] ?? "rgba(99,102,241,0.15)"
                                  : "rgba(255,255,255,0.03)",
                                border: `1px solid ${isSelected ? CATEGORY_BORDER[cat.category] ?? "var(--border-strong)" : "var(--border)"}`,
                                color: isSelected ? "#fff" : "var(--text-dim)",
                                transition: "all 0.15s",
                                cursor: !isSelected && selected.size >= 8 ? "not-allowed" : "pointer",
                                opacity: !isSelected && selected.size >= 8 ? 0.4 : 1,
                              }}
                            >
                              {isSelected && "✓ "}{topic}
                            </button>
                            {isSelected && (
                              <div style={{
                                display: "flex", alignItems: "center",
                                background: CATEGORY_COLORS[cat.category] ?? "rgba(99,102,241,0.1)",
                                border: `1px solid ${CATEGORY_BORDER[cat.category] ?? "var(--border-strong)"}`,
                                borderLeft: "none",
                                borderRadius: "0 999px 999px 0",
                                padding: "0 0.35rem",
                                height: "100%",
                              }}>
                                <button
                                  style={{ padding: "0.2rem 0.3rem", fontSize: "0.75rem", color: "var(--text-dim)", borderRadius: 4, minWidth: 0 }}
                                  onClick={() => setTopicCount(topic, (selected.get(topic) ?? 3) - 1)}
                                >−</button>
                                <span style={{ fontSize: "0.78rem", fontWeight: 700, padding: "0 0.25rem", color: "#fff", minWidth: 16, textAlign: "center" }}>
                                  {selected.get(topic)}
                                </span>
                                <button
                                  style={{ padding: "0.2rem 0.3rem", fontSize: "0.75rem", color: "var(--text-dim)", borderRadius: 4, minWidth: 0 }}
                                  onClick={() => setTopicCount(topic, (selected.get(topic) ?? 3) + 1)}
                                >+</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              className="btn-primary btn-primary-lg"
              style={{ marginTop: "2rem", width: "100%" }}
              disabled={selected.size === 0}
              onClick={() => setStep(2)}
            >
              Continue with {selected.size} topic{selected.size !== 1 ? "s" : ""} →
            </button>
          </div>
        )}

        {/* ── Step 2: Level + Type ── */}
        {step === 2 && (
          <div className="anim-slideUp">
            <div className="card card-glow-top" style={{ padding: "2rem", border: "1px solid var(--border-strong)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {/* Interview mode */}
                <section>
                  <StepLabel step={2} title="Interview mode" />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.6rem" }}>
                    {([
                      { value: "live" as const, label: "🎥 Live Video", sub: "AI conversation with webcam & voice" },
                      { value: "text" as const, label: "📝 Text-Based", sub: "Type answers at your own pace" },
                    ]).map(({ value, label, sub }) => {
                      const active = mode === value;
                      return (
                        <button
                          key={value}
                          onClick={() => setMode(value)}
                          style={{
                            padding: "1rem", borderRadius: 14, textAlign: "center",
                            background: active
                              ? value === "live"
                                ? "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(34,211,238,0.14))"
                                : "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.14))"
                              : "rgba(255,255,255,0.025)",
                            border: `1px solid ${active ? (value === "live" ? "rgba(16,185,129,0.5)" : "rgba(129,140,248,0.5)") : "var(--border)"}`,
                            color: "var(--text)",
                            boxShadow: active ? `0 4px 20px ${value === "live" ? "rgba(16,185,129,0.15)" : "var(--accent-glow)"}` : "none",
                            transition: "all 0.2s",
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{label}</div>
                          <div style={{ fontSize: "0.75rem", color: active ? (value === "live" ? "#6EE7B7" : "var(--indigo-light)") : "var(--text-muted)", marginTop: 3 }}>{sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <StepLabel step={3} title="Experience level" />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem" }}>
                    {LEVELS.map(({ value, label, sub }) => {
                      const active = level === value;
                      return (
                        <button
                          key={value}
                          onClick={() => setLevel(value)}
                          style={{
                            padding: "1rem", borderRadius: 14, textAlign: "center",
                            background: active ? "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.14))" : "rgba(255,255,255,0.025)",
                            border: `1px solid ${active ? "rgba(129,140,248,0.5)" : "var(--border)"}`,
                            color: "var(--text)",
                            boxShadow: active ? "0 4px 20px var(--accent-glow)" : "none",
                            transition: "all 0.2s",
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{label}</div>
                          <div style={{ fontSize: "0.75rem", color: active ? "var(--indigo-light)" : "var(--text-muted)", marginTop: 3 }}>{sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <StepLabel step={4} title="Interview format" />
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                    {TYPES.map(({ value, label, desc, icon }) => {
                      const active = interviewType === value;
                      return (
                        <button
                          key={value}
                          onClick={() => setInterviewType(value)}
                          style={{
                            textAlign: "left", padding: "1rem 1.1rem", borderRadius: 14,
                            background: active ? "linear-gradient(135deg, rgba(99,102,241,0.16), rgba(139,92,246,0.1))" : "rgba(255,255,255,0.02)",
                            border: `1px solid ${active ? "rgba(129,140,248,0.5)" : "var(--border)"}`,
                            color: "var(--text)",
                            boxShadow: active ? "0 4px 20px var(--accent-glow)" : "none",
                            display: "flex", alignItems: "center", gap: "0.9rem",
                            transition: "all 0.2s",
                          }}
                        >
                          <span style={{
                            width: 36, height: 36, borderRadius: 10, fontSize: "1rem",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            background: active ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${active ? "rgba(99,102,241,0.3)" : "var(--border)"}`,
                          }}>{icon}</span>
                          <span style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: "0.93rem" }}>{label}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: 2 }}>{desc}</div>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem" }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>
                ← Back
              </button>
              <button className="btn-primary btn-primary-lg" style={{ flex: 2 }} onClick={() => setStep(3)}>
                Preview interview →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Preview ── */}
        {step === 3 && (
          <div className="anim-slideUp">
            <StepLabel step={5} title="Review your interview" />

            <div className="card card-glow-top" style={{ padding: "2rem", border: "1px solid var(--border-strong)", marginBottom: "1.5rem" }}>
              {/* Summary bar */}
              <div style={{
                display: "flex", flexWrap: "wrap", gap: "1.5rem", marginBottom: "2rem",
                padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: 12,
                border: "1px solid var(--border)",
              }}>
                {[
                  { label: "Mode", value: mode === "live" ? "🎥 Live Video" : "📝 Text" },
                  { label: "Level", value: LEVELS.find(l => l.value === level)?.label ?? level },
                  { label: "Format", value: TYPES.find(t => t.value === interviewType)?.label.replace(" (recommended)", "") ?? interviewType },
                  { label: "Topics", value: `${selected.size}` },
                  ...(mode === "text" ? [{ label: "Questions", value: `${totalQuestions}` }] : []),
                  { label: "Est. time", value: mode === "live" ? "~15–30 min" : `~${estimatedMinutes} min` },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                      {s.label}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Section timeline */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {Array.from(selected.entries()).map(([topic, count], i) => (
                  <div
                    key={topic}
                    style={{
                      display: "flex", alignItems: "center", gap: "1rem",
                      padding: "0.85rem 1rem", borderRadius: 12,
                      background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
                    }}
                  >
                    <span style={{
                      width: 28, height: 28, borderRadius: 8, fontSize: "0.75rem",
                      fontWeight: 700, display: "inline-flex", alignItems: "center",
                      justifyContent: "center", background: "rgba(99,102,241,0.15)",
                      border: "1px solid rgba(99,102,241,0.3)", color: "var(--indigo-light)",
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: "0.92rem" }}>{topic}</span>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>
                      {mode === "live" ? "adaptive" : `${count} question${count !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                ))}
              </div>
              {mode === "live" && (
                <div style={{
                  marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: 10,
                  background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                  fontSize: "0.82rem", color: "#6EE7B7",
                }}>
                  🎥 Live mode: The AI interviewer will ask questions conversationally, follow up on your answers, and adapt in real time. Your webcam and microphone will be used.
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(2)}>
                ← Back
              </button>
              <button
                className="btn-primary btn-primary-lg"
                style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}
                onClick={handleStart}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff", borderRadius: "50%",
                      animation: "spin-slow 0.8s linear infinite", display: "inline-block",
                    }} />
                    {mode === "live" ? "Preparing…" : `Generating ${totalQuestions} questions…`}
                  </>
                ) : (
                  <>{mode === "live" ? "Start Live Interview 🎥" : "Start Interview →"}</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
