import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { getSessionSummary } from "../api/sessions";
import type { BehavioralFeedback, SessionSummary } from "../types";

function scoreColor(score: number | null): string {
  if (score === null) return "var(--text-muted)";
  if (score >= 7) return "var(--success)";
  if (score >= 5) return "var(--warning)";
  return "var(--danger)";
}

function ScorePill({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: "0.9rem" }}>—</span>
    );
  }
  const color = scoreColor(score);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: "0.2rem",
        padding: "0.35rem 0.7rem",
        borderRadius: 10,
        background: `${color}1f`,
        border: `1px solid ${color}40`,
        color,
        fontWeight: 700,
        fontSize: "0.9rem",
      }}
    >
      {score}
      <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>/10</span>
    </span>
  );
}

function buildRadarData(summary: SessionSummary) {
  const topicMap: Record<string, { scores: number[] }> = {};
  for (const q of summary.questions) {
    if (!topicMap[q.topic]) topicMap[q.topic] = { scores: [] };
    if (q.answer?.score != null) topicMap[q.topic].scores.push(q.answer.score);
  }
  return Object.entries(topicMap).map(([topic, { scores }]) => ({
    topic: topic.length > 16 ? topic.slice(0, 14) + "…" : topic,
    score: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0,
    fullMark: 10,
  }));
}

export default function SummaryPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    getSessionSummary(sessionId)
      .then(setSummary)
      .catch(() => setError("Could not load summary."));
  }, [sessionId]);

  if (error) {
    return (
      <div className="page">
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 28, width: 220, marginBottom: "1.25rem" }} />
        <div className="skeleton" style={{ height: 220, marginBottom: "1.25rem" }} />
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }

  const radarData = buildRadarData(summary);
  const overall = summary.total_score;
  const overallColor = scoreColor(overall);
  const overallPct = overall != null ? (overall / 10) * 100 : 0;

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div className="hero-glow" style={{ top: -400, opacity: 0.6 }} />

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
            Session Complete
          </div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.5rem", fontFamily: "var(--font-display)" }}>
            Your <span className="gradient-text">results</span>
          </h1>
          <p style={{ color: "var(--text-dim)" }}>
            {summary.role} · {summary.level} · {summary.interview_type}
          </p>
        </div>

        {/* Big score circle */}
        <div
          className="card anim-slideUp"
          style={{ textAlign: "center", marginBottom: "2rem", padding: "2.5rem 1.5rem" }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 700,
              marginBottom: "1.5rem",
            }}
          >
            Overall Score
          </div>
          <div
            className="score-circle"
            style={
              {
                "--score-color": overallColor,
                "--score-pct": `${overallPct}%`,
              } as React.CSSProperties
            }
          >
            <div style={{ fontSize: "3.5rem", fontWeight: 900, color: overallColor, lineHeight: 1, letterSpacing: "-0.04em" }}>
              {overall != null ? overall : "—"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4, fontWeight: 600 }}>
              out of 10
            </div>
          </div>
          <div style={{ marginTop: "1.5rem", fontSize: "0.9rem", color: "var(--text-dim)" }}>
            Across {summary.questions.length} questions
          </div>
        </div>

        {/* Radar chart */}
        {radarData.length > 2 && (
          <div className="card anim-slideUp" style={{ marginBottom: "2rem", animationDelay: "0.05s" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "1.25rem" }}>
              Score by topic
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="topic" tick={{ fill: "var(--text-dim)", fontSize: 12 }} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#818CF8"
                  fill="#6366F1"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(17, 20, 31, 0.95)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    backdropFilter: "blur(8px)",
                  }}
                  labelStyle={{ color: "var(--text)" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Behavioral profile aggregate */}
        {(() => {
          const feedbacks = summary.questions
            .map(q => q.answer?.behavioral_feedback)
            .filter((f): f is BehavioralFeedback => f != null);
          if (feedbacks.length === 0) return null;
          const avg = (key: keyof Omit<BehavioralFeedback, "overall_impression">) =>
            Math.round((feedbacks.reduce((s, f) => s + f[key], 0) / feedbacks.length) * 10) / 10;
          const dims = [
            { key: "communication_clarity" as const, label: "Communication" },
            { key: "structure_organization" as const, label: "Structure" },
            { key: "technical_depth" as const, label: "Technical depth" },
            { key: "use_of_examples" as const, label: "Use of examples" },
            { key: "confidence" as const, label: "Confidence" },
          ];
          return (
            <div className="card anim-slideUp" style={{ marginBottom: "2rem", animationDelay: "0.1s" }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "1.25rem" }}>
                Behavioural profile
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {dims.map(({ key, label }) => {
                  const val = avg(key);
                  const color = val >= 7 ? "var(--success)" : val >= 5 ? "var(--warning)" : "var(--danger)";
                  return (
                    <div key={key}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>{label}</span>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color }}>{val}/10</span>
                      </div>
                      <div className="score-bar-track" style={{ height: 6 }}>
                        <div
                          className="score-bar-fill"
                          style={{ width: `${(val / 10) * 100}%`, background: color, boxShadow: `0 0 8px ${color}` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Question breakdown */}
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
          Question breakdown
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "2rem" }}>
          {summary.questions.map((q, i) => (
            <div
              key={q.id}
              className="card anim-slideUp"
              style={{ padding: "1rem 1.25rem", animationDelay: `${i * 0.03}s` }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "1rem",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.4rem",
                      alignItems: "center",
                      flexWrap: "wrap",
                      marginBottom: "0.4rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                      }}
                    >
                      Q{q.position}
                    </span>
                    <span className={`chip chip-${q.difficulty}`}>{q.difficulty}</span>
                    <span className="chip chip-topic">{q.topic}</span>
                  </div>
                  <p style={{ fontSize: "0.92rem", lineHeight: 1.55, color: "var(--text)" }}>{q.text}</p>
                </div>
                <ScorePill score={q.answer?.score ?? null} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            className="btn-primary"
            onClick={() => navigate("/setup")}
            style={{ padding: "0.85rem 1.5rem", flex: 1, minWidth: 180 }}
          >
            New Interview <span style={{ marginLeft: 6 }}>→</span>
          </button>
          <Link to="/dashboard" style={{ flex: 1, minWidth: 180 }}>
            <button className="btn-secondary" style={{ width: "100%", padding: "0.85rem 1.5rem" }}>
              View Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
