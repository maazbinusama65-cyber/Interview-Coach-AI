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

const LEVELS: { value: Level; label: string }[] = [
  { value: "junior", label: "Junior (0–2 yr)" },
  { value: "mid", label: "Mid (2–5 yr)" },
  { value: "senior", label: "Senior (5+ yr)" },
];

const TYPES: { value: InterviewType; label: string; desc: string }[] = [
  { value: "technical", label: "Technical only", desc: "Algorithms, system design, coding concepts" },
  { value: "behavioral", label: "Behavioral only", desc: "Leadership, teamwork, situational questions" },
  { value: "mixed", label: "Mixed (recommended)", desc: "60% technical, 40% behavioral" },
];

const QUESTION_COUNTS = [5, 10, 15];

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
    <div className="page">
      <Link to="/" style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>← Back</Link>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "1.25rem 0 0.25rem" }}>Configure your interview</h1>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem" }}>Tailor the session to your target role and experience.</p>

      {error && <div className="error-banner" style={{ marginBottom: "1rem" }}>{error}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
        {/* Role */}
        <div>
          <label>Role</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
            {ROLES.map((r) => (
              <button
                key={r}
                className={config.role === r ? "btn-primary" : "btn-secondary"}
                onClick={() => setConfig((c) => ({ ...c, role: r }))}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Level */}
        <div>
          <label>Experience Level</label>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            {LEVELS.map(({ value, label }) => (
              <button
                key={value}
                className={config.level === value ? "btn-primary" : "btn-secondary"}
                onClick={() => setConfig((c) => ({ ...c, level: value }))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Interview type */}
        <div>
          <label>Interview Type</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
            {TYPES.map(({ value, label, desc }) => (
              <button
                key={value}
                className={config.interview_type === value ? "btn-primary" : "btn-secondary"}
                style={{ textAlign: "left", padding: "0.7rem 1rem" }}
                onClick={() => setConfig((c) => ({ ...c, interview_type: value }))}
              >
                <div style={{ fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: "0.8rem", opacity: 0.75, fontWeight: 400 }}>{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Question count */}
        <div>
          <label>Number of Questions</label>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            {QUESTION_COUNTS.map((n) => (
              <button
                key={n}
                className={config.question_count === n ? "btn-primary" : "btn-secondary"}
                onClick={() => setConfig((c) => ({ ...c, question_count: n }))}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn-primary"
          style={{ fontSize: "1rem", padding: "0.8rem 2rem", alignSelf: "flex-start" }}
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? "Generating questions…" : "Start Interview →"}
        </button>
      </div>
    </div>
  );
}
