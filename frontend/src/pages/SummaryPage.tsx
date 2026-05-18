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
import type { SessionSummary } from "../types";

function ScoreLabel({ score }: { score: number | null }) {
  if (score === null) return <span style={{ color: "var(--color-text-muted)" }}>—</span>;
  const color = score >= 7 ? "var(--color-success)" : score >= 5 ? "var(--color-warning)" : "var(--color-danger)";
  return <span style={{ color, fontWeight: 700 }}>{score}/10</span>;
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

  if (error) return <div className="page"><div className="error-banner">{error}</div></div>;

  if (!summary) {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 24, width: 200, marginBottom: "1rem" }} />
        <div className="skeleton" style={{ height: 300 }} />
      </div>
    );
  }

  const radarData = buildRadarData(summary);

  return (
    <div className="page">
      <Link to="/dashboard" style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>← Dashboard</Link>

      <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "1.25rem 0 0.25rem" }}>Session Complete</h1>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem" }}>
        {summary.role} · {summary.level} · {summary.interview_type}
      </p>

      {/* Overall score */}
      <div className="card" style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "0.4rem" }}>Overall Score</div>
        <div style={{ fontSize: "3rem", fontWeight: 900, color: "var(--color-accent)" }}>
          {summary.total_score != null ? `${summary.total_score}/10` : "—"}
        </div>
      </div>

      {/* Radar chart */}
      {radarData.length > 2 && (
        <div className="card" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Score by Topic</h2>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis dataKey="topic" tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} />
              <Radar
                name="Score"
                dataKey="score"
                stroke="var(--color-accent)"
                fill="var(--color-accent)"
                fillOpacity={0.25}
              />
              <Tooltip
                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 6 }}
                labelStyle={{ color: "var(--color-text)" }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Question-by-question breakdown */}
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Question Breakdown</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
        {summary.questions.map((q) => (
          <div key={q.id} className="card" style={{ padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.3rem" }}>
                  Q{q.position} · <span className={`chip chip-${q.difficulty}`}>{q.difficulty}</span>{" "}
                  <span className="chip chip-topic">{q.topic}</span>
                </div>
                <p style={{ fontSize: "0.9rem" }}>{q.text}</p>
              </div>
              <ScoreLabel score={q.answer?.score ?? null} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button className="btn-primary" onClick={() => navigate("/setup")}>
          New Interview →
        </button>
        <Link to="/dashboard">
          <button className="btn-secondary">Dashboard</button>
        </Link>
      </div>
    </div>
  );
}
