import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createSession } from "../api/sessions";
import { useAuth } from "../hooks/useAuth";

function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function TopicPage() {
  const { topic } = useParams<{ topic: string }>();
  const { session: authSession } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decodedTopic = topic ? decodeURIComponent(topic) : "";

  async function handleRetry() {
    setError(null);
    setLoading(true);
    try {
      const newSession = await createSession({
        role: "General",
        level: "mid",
        interview_type: "mixed",
        question_count: 5,
      });
      navigate(`/interview/${newSession.session_id}`, { state: { session: newSession } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div className="hero-glow" style={{ opacity: 0.5 }} />

      <div className="page" style={{ position: "relative", zIndex: 1 }}>
        <Link to="/dashboard" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          ← Dashboard
        </Link>

        <div className="anim-slideUp" style={{ marginTop: "1.5rem", marginBottom: "2rem" }}>
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "var(--accent-light)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "0.5rem",
            }}
          >
            Topic Drill
          </div>
          <h1
            style={{
              fontSize: "2.2rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              marginBottom: "0.6rem",
              fontFamily: "var(--font-display)",
            }}
          >
            <span className="gradient-text">{decodedTopic}</span>
          </h1>
          <p style={{ color: "var(--text-dim)" }}>
            Drill into this topic with a fresh 5-question session.
          </p>
        </div>

        {error && (
          <div className="error-banner anim-slideDown" style={{ marginBottom: "1.25rem" }}>
            {error}
          </div>
        )}

        {!authSession && (
          <div
            className="card anim-slideUp"
            style={{
              marginBottom: "1.5rem",
              color: "var(--text-dim)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <span style={{ color: "var(--text-dim)" }}><IconLock /></span>
            <span>
              <Link to="/login" style={{ color: "var(--accent-light)", fontWeight: 600 }}>
                Sign in
              </Link>{" "}
              to track retry progress.
            </span>
          </div>
        )}

        <div className="card anim-slideUp" style={{ padding: "1.75rem", animationDelay: "0.05s" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            How it works
          </h2>
          <p
            style={{
              color: "var(--text-dim)",
              fontSize: "0.9rem",
              lineHeight: 1.65,
              marginBottom: "1.5rem",
            }}
          >
            We'll generate 5 focused questions to retest your skills here. Your scores will
            update your topic average so you can see real progress over time.
          </p>

          <button
            className="btn-primary"
            onClick={handleRetry}
            disabled={loading}
            style={{ padding: "0.85rem 1.5rem", fontSize: "0.95rem" }}
          >
            {loading ? "Creating session…" : `Retry "${decodedTopic}"`}{" "}
            {!loading && <span style={{ marginLeft: 6 }}>→</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
