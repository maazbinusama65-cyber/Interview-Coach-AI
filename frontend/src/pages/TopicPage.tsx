import { useNavigate, useParams } from "react-router-dom";
import { createSession } from "../api/sessions";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import { Link } from "react-router-dom";

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
    <div className="page">
      <Link to="/dashboard" style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>← Dashboard</Link>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "1.25rem 0 0.5rem" }}>
        Topic: <span style={{ color: "var(--color-accent)" }}>{decodedTopic}</span>
      </h1>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem" }}>
        Drill into this topic with a fresh 5-question session.
      </p>

      {error && <div className="error-banner" style={{ marginBottom: "1rem" }}>{error}</div>}

      {!authSession && (
        <div className="card" style={{ marginBottom: "1.5rem", color: "var(--color-text-muted)" }}>
          <Link to="/login" style={{ color: "var(--color-accent)" }}>Sign in</Link> to track retry progress.
        </div>
      )}

      <button className="btn-primary" onClick={handleRetry} disabled={loading}>
        {loading ? "Creating session…" : `Retry "${decodedTopic}" →`}
      </button>
    </div>
  );
}
