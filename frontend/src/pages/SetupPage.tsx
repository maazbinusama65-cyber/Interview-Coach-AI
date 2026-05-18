import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createSession } from "../api/sessions";
import type { InterviewType, Level, SessionConfig } from "../types";

const ROLES = [
  "ML Engineer",
  "Backend Developer",
  "Frontend Developer",
  "Data Scientist",
  "Full-Stack Developer",
  "DevOps Engineer",
  "Product Manager",
];

const LEVELS: { value: Level; label: string; sub: string }[] = [
  { value: "junior", label: "Junior",  sub: "0 – 2 years" },
  { value: "mid",    label: "Mid",     sub: "2 – 5 years" },
  { value: "senior", label: "Senior",  sub: "5+ years"    },
];

const TYPES: { value: InterviewType; label: string; desc: string; icon: string }[] = [
  { value: "technical",  label: "Technical only",       icon: "💻", desc: "Algorithms, system design, coding concepts" },
  { value: "behavioral", label: "Behavioural only",     icon: "🤝", desc: "Leadership, teamwork, situational questions" },
  { value: "mixed",      label: "Mixed (recommended)",  icon: "⚡", desc: "60 % technical — 40 % behavioural" },
];

const QUESTION_COUNTS = [5, 10, 15];

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

export default function SetupPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<SessionConfig>({
    role: "ML Engineer",
    level: "mid",
    interview_type: "mixed",
    question_count: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setError(null);
    setLoading(true);
    try {
      const session = await createSession(config);
      localStorage.setItem(`session_${session.session_id}`, JSON.stringify(session));
      navigate(`/interview/${session.session_id}`, { state: { session } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div className="hero-glow" style={{ top: -350, opacity: 0.7 }} />
      <div className="grid-pattern" />

      {/* ── Nav ── */}
      <nav className="nav">
        <Link to="/" className="nav-brand">
          <span className="nav-brand-mark" />
          Interview Coach
        </Link>
      </nav>

      <div className="page" style={{ position: "relative", zIndex: 1, paddingTop: "2.5rem" }}>
        {/* Header */}
        <div className="anim-slideUp" style={{ marginBottom: "2.5rem" }}>
          <Link to="/" style={{ color: "var(--text-muted)", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", marginBottom: "1.25rem" }}>
            ← Back
          </Link>
          <h1 style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: "0.4rem" }}>
            Configure your <span className="gradient-text">session</span>
          </h1>
          <p style={{ color: "var(--text-dim)", fontSize: "0.98rem" }}>
            Four quick choices and you're in. Takes under 30 seconds.
          </p>
        </div>

        {error && (
          <div className="error-banner anim-slideDown" style={{ marginBottom: "1.5rem" }}>
            {error}
          </div>
        )}

        {/* Config card */}
        <div
          className="card card-glow-top anim-slideUp"
          style={{
            padding: "2rem 2rem 2.25rem",
            border: "1px solid var(--border-strong)",
            animationDelay: "0.06s",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "2.25rem" }}>

            {/* ── Step 1: Role ── */}
            <section>
              <StepLabel step={1} title="Your target role" hint="What position are you interviewing for?" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {ROLES.map((r) => (
                  <button
                    key={r}
                    className={`pill ${config.role === r ? "pill-active" : ""}`}
                    onClick={() => setConfig((c) => ({ ...c, role: r }))}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </section>

            {/* ── Step 2: Level ── */}
            <section>
              <StepLabel step={2} title="Experience level" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem" }}>
                {LEVELS.map(({ value, label, sub }) => {
                  const active = config.level === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setConfig((c) => ({ ...c, level: value }))}
                      style={{
                        padding: "1rem",
                        borderRadius: 14,
                        textAlign: "center",
                        background: active
                          ? "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.14))"
                          : "rgba(255,255,255,0.025)",
                        border: `1px solid ${active ? "rgba(129,140,248,0.5)" : "var(--border)"}`,
                        color: "var(--text)",
                        boxShadow: active ? "0 4px 20px var(--accent-glow)" : "none",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{label}</div>
                      <div style={{ fontSize: "0.75rem", color: active ? "var(--indigo-light)" : "var(--text-muted)", marginTop: 3 }}>
                        {sub}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── Step 3: Type ── */}
            <section>
              <StepLabel step={3} title="Interview format" />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {TYPES.map(({ value, label, desc, icon }) => {
                  const active = config.interview_type === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setConfig((c) => ({ ...c, interview_type: value }))}
                      style={{
                        textAlign: "left",
                        padding: "1rem 1.1rem",
                        borderRadius: 14,
                        background: active
                          ? "linear-gradient(135deg, rgba(99,102,241,0.16), rgba(139,92,246,0.1))"
                          : "rgba(255,255,255,0.02)",
                        border: `1px solid ${active ? "rgba(129,140,248,0.5)" : "var(--border)"}`,
                        color: "var(--text)",
                        boxShadow: active ? "0 4px 20px var(--accent-glow)" : "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.9rem",
                        transition: "all 0.2s",
                      }}
                    >
                      <span style={{
                        width: 36, height: 36, borderRadius: 10, fontSize: "1rem",
                        display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        background: active ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${active ? "rgba(99,102,241,0.3)" : "var(--border)"}`,
                      }}>
                        {icon}
                      </span>
                      <span style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.93rem" }}>{label}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: 2 }}>{desc}</div>
                      </span>
                      {/* Radio dot */}
                      <span style={{
                        width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${active ? "var(--indigo-light)" : "var(--border-strong)"}`,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {active && (
                          <span style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: "var(--indigo-light)", boxShadow: "0 0 8px var(--indigo-light)",
                          }} />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── Step 4: Count ── */}
            <section>
              <StepLabel step={4} title="Number of questions" hint="~2 min each" />
              <div style={{ display: "flex", gap: "0.6rem" }}>
                {QUESTION_COUNTS.map((n) => (
                  <button
                    key={n}
                    className={`pill ${config.question_count === n ? "pill-active" : ""}`}
                    style={{ minWidth: 80, justifyContent: "center", fontSize: "0.95rem", fontWeight: 700 }}
                    onClick={() => setConfig((c) => ({ ...c, question_count: n }))}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* ── Summary + CTA ── */}
        <div
          className="anim-slideUp"
          style={{
            marginTop: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            animationDelay: "0.12s",
          }}
        >
          {/* Config preview */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "0.5rem",
            padding: "0.9rem 1.1rem",
            background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
            borderRadius: 12, fontSize: "0.82rem", color: "var(--text-dim)",
          }}>
            {[
              config.role,
              LEVELS.find(l => l.value === config.level)?.label ?? config.level,
              TYPES.find(t => t.value === config.interview_type)?.label.replace(" (recommended)", "") ?? config.interview_type,
              `${config.question_count} questions`,
            ].map((tag, i, arr) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: "var(--text)" }}>{tag}</span>
                {i < arr.length - 1 && <span style={{ opacity: 0.3 }}>·</span>}
              </span>
            ))}
          </div>

          <button
            className="btn-primary btn-primary-lg"
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? (
              <>
                <span style={{
                  width: 16, height: 16,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff", borderRadius: "50%",
                  animation: "spin-slow 0.8s linear infinite",
                  display: "inline-block",
                }} />
                Generating {config.question_count} questions…
              </>
            ) : (
              <>Start Interview <span style={{ fontSize: "1.1rem" }}>→</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
