import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProgress } from "../api/progress";
import { listSessions } from "../api/sessions";
import { useAuth } from "../hooks/useAuth";
import type { ProgressOut, SessionListItem } from "../types";

function WeaknessHeatmap({ progress }: { progress: ProgressOut }) {
  const all = [...progress.weaknesses, ...progress.strengths];
  const navigate = useNavigate();

  if (all.length === 0) {
    return <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Complete some sessions to see your topic map.</p>;
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {all.map(({ topic, avg_score }) => {
        const bg = avg_score >= 7 ? "#1a3a2a" : avg_score >= 5 ? "#3a2a10" : "#3a1020";
        const color = avg_score >= 7 ? "var(--color-success)" : avg_score >= 5 ? "var(--color-warning)" : "var(--color-danger)";
        return (
          <button
            key={topic}
            onClick={() => navigate(`/topics/${encodeURIComponent(topic)}`)}
            style={{
              background: bg,
              color,
              border: `1px solid ${color}33`,
              borderRadius: 999,
              padding: "0.3rem 0.75rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {topic} · {avg_score.toFixed(1)}
          </button>
        );
      })}
    </div>
  );
}

function SessionCard({ s }: { s: SessionListItem }) {
  const score = s.total_score;
  const color = score == null ? "var(--color-text-muted)" : score >= 7 ? "var(--color-success)" : score >= 5 ? "var(--color-warning)" : "var(--color-danger)";
  return (
    <Link to={`/interview/${s.id}/done`} style={{ textDecoration: "none" }}>
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.9rem 1.2rem", cursor: "pointer" }}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: "0.2rem" }}>{s.role}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            {s.level} · {s.interview_type} · {new Date(s.created_at).toLocaleDateString()}
          </div>
        </div>
        <div style={{ fontWeight: 800, fontSize: "1.2rem", color }}>
          {score != null ? `${score}/10` : "—"}
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { isGuest } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [progress, setProgress] = useState<ProgressOut | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) return;
    Promise.all([listSessions(), getProgress()])
      .then(([s, p]) => { setSessions(s); setProgress(p); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [isGuest]);

  if (isGuest) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <h2 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Sign in to access your dashboard</h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
          Dashboard and progress tracking require an account.
        </p>
        <Link to="/login"><button className="btn-primary">Sign in / Register</button></Link>
      </div>
    );
  }

  return (
    <div className="page-wide">
      <nav className="nav" style={{ marginBottom: "2rem", padding: "1rem 0" }}>
        <Link to="/" className="nav-brand">AI Interview Coach</Link>
        <div className="nav-actions">
          <button className="btn-primary" onClick={() => navigate("/setup")}>New Interview</button>
        </div>
      </nav>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 72 }} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>

          {/* Left: Progress */}
          <div>
            {progress && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "2rem" }}>
                  <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Sessions</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800 }}>{progress.total_sessions}</div>
                  </div>
                  <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Overall Avg</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-accent)" }}>
                      {progress.overall_avg_score.toFixed(1)}
                    </div>
                  </div>
                </div>

                <div className="card" style={{ marginBottom: "2rem" }}>
                  <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Topic Map</h2>
                  <WeaknessHeatmap progress={progress} />
                </div>

                {progress.weaknesses.length > 0 && (
                  <div className="card">
                    <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                      Focus Areas
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {progress.weaknesses.slice(0, 5).map(({ topic, avg_score }) => (
                        <Link key={topic} to={`/topics/${encodeURIComponent(topic)}`} style={{ textDecoration: "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0.75rem", background: "var(--color-surface-2)", borderRadius: "var(--radius-sm)" }}>
                            <span style={{ fontSize: "0.88rem" }}>{topic}</span>
                            <span style={{ color: "var(--color-danger)", fontWeight: 700, fontSize: "0.88rem" }}>{avg_score.toFixed(1)}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: Session history */}
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Session History</h2>
            {sessions.length === 0 ? (
              <div className="card" style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                No sessions yet. <Link to="/setup">Start one →</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {sessions.map((s) => <SessionCard key={s.id} s={s} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
