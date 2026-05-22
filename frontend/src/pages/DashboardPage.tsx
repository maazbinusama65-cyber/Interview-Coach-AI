import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProgress } from "../api/progress";
import { listSessions } from "../api/sessions";
import { useAuth } from "../hooks/useAuth";
import type { ProgressOut, SessionListItem } from "../types";

function scoreColor(score: number | null): string {
  if (score === null) return "var(--text-muted)";
  if (score >= 7) return "var(--success)";
  if (score >= 5) return "var(--warning)";
  return "var(--danger)";
}

function WeaknessHeatmap({ progress }: { progress: ProgressOut }) {
  const all = [...progress.weaknesses, ...progress.strengths];
  const navigate = useNavigate();

  if (all.length === 0) {
    return (
      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
        Complete some sessions to see your topic map.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.55rem" }}>
      {all.map(({ topic, avg_score }) => {
        const color = scoreColor(avg_score);
        const bg =
          avg_score >= 7
            ? "rgba(16, 185, 129, 0.08)"
            : avg_score >= 5
              ? "rgba(245, 158, 11, 0.08)"
              : "rgba(239, 68, 68, 0.08)";
        const border =
          avg_score >= 7
            ? "rgba(16, 185, 129, 0.3)"
            : avg_score >= 5
              ? "rgba(245, 158, 11, 0.3)"
              : "rgba(239, 68, 68, 0.3)";
        return (
          <button
            key={topic}
            className="heatmap-chip"
            onClick={() => navigate(`/topics/${encodeURIComponent(topic)}`)}
            style={{
              background: bg,
              color: color,
              border: `1px solid ${border}`,
            }}
          >
            <span className="heatmap-dot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
            <span style={{ color: "var(--text)" }}>{topic}</span>
            <span style={{ color, fontWeight: 700 }}>{avg_score.toFixed(1)}</span>
          </button>
        );
      })}
    </div>
  );
}

function SessionCard({ s }: { s: SessionListItem }) {
  const score = s.total_score;
  const color = scoreColor(score);
  return (
    <Link to={`/interview/${s.id}/done`} style={{ textDecoration: "none" }}>
      <div
        className="card card-hover"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 1.25rem",
          cursor: "pointer",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, marginBottom: "0.25rem", fontSize: "0.98rem" }}>
            {s.role}
          </div>
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <span style={{ textTransform: "capitalize" }}>{s.level}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span style={{ textTransform: "capitalize" }}>{s.interview_type}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>{new Date(s.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div
          style={{
            fontWeight: 800,
            fontSize: "1.15rem",
            color,
            padding: "0.4rem 0.75rem",
            background: `${color}15`,
            border: `1px solid ${color}30`,
            borderRadius: 10,
            flexShrink: 0,
            marginLeft: "0.75rem",
          }}
        >
          {score != null ? (
            <>
              {score}
              <span style={{ fontSize: "0.72rem", opacity: 0.7, fontWeight: 600 }}>/10</span>
            </>
          ) : (
            "—"
          )}
        </div>
      </div>
    </Link>
  );
}

function IconTrendingUp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}

function StatCard({ icon, label, value, accent }: StatCardProps) {
  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
        <div className="stat-icon" aria-hidden="true" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
        <div>
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: "1.85rem",
              fontWeight: 800,
              lineHeight: 1.1,
              marginTop: 2,
              color: accent ? "var(--accent-light)" : "var(--text)",
              letterSpacing: "-0.02em",
            }}
          >
            {value}
          </div>
        </div>
      </div>
    </div>
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
      .then(([s, p]) => {
        setSessions(s);
        setProgress(p);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [isGuest]);

  if (isGuest) {
    return (
      <div style={{ position: "relative", minHeight: "100vh" }}>
        <div className="hero-glow" />
        <div className="page" style={{ textAlign: "center", paddingTop: "5rem", position: "relative", zIndex: 1 }}>
          <h2 style={{ fontWeight: 800, marginBottom: "0.75rem", fontSize: "1.6rem", fontFamily: "var(--font-display)" }}>
            Sign in to access your <span className="gradient-text">dashboard</span>
          </h2>
          <p style={{ color: "var(--text-dim)", marginBottom: "1.75rem" }}>
            Dashboard and progress tracking require an account.
          </p>
          <Link to="/login">
            <button className="btn-primary" style={{ padding: "0.85rem 1.75rem" }}>
              Sign in / Register
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div className="hero-glow" style={{ opacity: 0.5 }} />

      <nav className="nav">
        <Link to="/" className="nav-brand">
          <span className="nav-brand-mark" />
          Interview Coach
        </Link>
        <div className="nav-actions">
          <button
            className="btn-primary"
            onClick={() => navigate("/setup")}
            style={{ padding: "0.6rem 1.1rem" }}
          >
            New Interview <span style={{ marginLeft: 4 }}>→</span>
          </button>
        </div>
      </nav>

      <div className="page-wide" style={{ position: "relative", zIndex: 1 }}>
        <div className="anim-slideUp" style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.35rem", fontFamily: "var(--font-display)" }}>
            Welcome back
          </h1>
          <p style={{ color: "var(--text-dim)" }}>Your performance, sessions, and growth at a glance.</p>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="skeleton" style={{ height: 88 }} />
              <div className="skeleton" style={{ height: 88 }} />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 76 }} />
            ))}
          </div>
        ) : (
          <div
            className="page-wide-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}
          >
            {/* Left: Progress */}
            <div>
              {progress && (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                      marginBottom: "1.5rem",
                    }}
                    className="anim-slideUp"
                  >
                    <StatCard
                      icon={<IconTrendingUp />}
                      label="Sessions"
                      value={String(progress.total_sessions)}
                    />
                    <StatCard
                      icon={<IconStar />}
                      label="Overall Avg"
                      value={progress.overall_avg_score.toFixed(1)}
                      accent
                    />
                  </div>

                  <div className="card anim-slideUp" style={{ marginBottom: "1.5rem", animationDelay: "0.05s" }}>
                    <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
                      Topic map
                    </h2>
                    <WeaknessHeatmap progress={progress} />
                  </div>

                  {progress.weaknesses.length > 0 && (
                    <div className="card anim-slideUp" style={{ animationDelay: "0.1s" }}>
                      <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.9rem" }}>
                        Focus areas
                      </h2>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {progress.weaknesses.slice(0, 5).map(({ topic, avg_score }) => (
                          <Link
                            key={topic}
                            to={`/topics/${encodeURIComponent(topic)}`}
                            style={{ textDecoration: "none" }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "0.7rem 0.9rem",
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid var(--border)",
                                borderRadius: 10,
                                transition: "background 0.2s ease, border-color 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                                e.currentTarget.style.borderColor = "var(--border-strong)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                                e.currentTarget.style.borderColor = "var(--border)";
                              }}
                            >
                              <span style={{ fontSize: "0.9rem", color: "var(--text)" }}>{topic}</span>
                              <span
                                style={{
                                  color: "var(--danger)",
                                  fontWeight: 700,
                                  fontSize: "0.88rem",
                                }}
                              >
                                {avg_score.toFixed(1)}
                              </span>
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: "1rem",
                }}
              >
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Session history</h2>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {sessions.length} total
                </span>
              </div>
              {sessions.length === 0 ? (
                <div
                  className="card"
                  style={{
                    textAlign: "center",
                    color: "var(--text-dim)",
                    padding: "2.5rem 1.5rem",
                  }}
                >
                  <div style={{ marginBottom: "0.5rem", color: "var(--text-dim)" }}><IconClipboard /></div>
                  <div style={{ marginBottom: "0.5rem", fontWeight: 600, color: "var(--text)" }}>
                    No sessions yet
                  </div>
                  <div style={{ fontSize: "0.88rem", marginBottom: "1rem" }}>
                    Run your first interview to start building history.
                  </div>
                  <Link to="/setup">
                    <button className="btn-primary">Start one →</button>
                  </Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  {sessions.map((s, i) => (
                    <div
                      key={s.id}
                      className="anim-slideUp"
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <SessionCard s={s} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
