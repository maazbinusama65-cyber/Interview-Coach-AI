import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/* ─── Mock UI preview card ──────────────────────────────────────────────── */
function AppMockup() {
  return (
    <div className="mockup-card" style={{ marginLeft: "auto", marginRight: "auto" }}>
      {/* Traffic-light bar */}
      <div className="mockup-topbar">
        <div className="mockup-dot" style={{ background: "#FF5F57" }} />
        <div className="mockup-dot" style={{ background: "#FFBD2E" }} />
        <div className="mockup-dot" style={{ background: "#28C840" }} />
        <span style={{ marginLeft: "0.5rem", fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.03em" }}>
          interview-coach.app
        </span>
      </div>

      <div style={{ padding: "1.25rem" }}>
        {/* Progress */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            ML Engineer · Mid · Q3 of 10
          </span>
          <span style={{
            fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.6rem",
            borderRadius: 999, background: "rgba(16,185,129,0.12)", color: "#34D399",
            border: "1px solid rgba(16,185,129,0.3)",
          }}>
            ● Live
          </span>
        </div>
        <div className="progress-track" style={{ marginBottom: "1.25rem" }}>
          <div className="progress-fill" style={{ width: "30%" }} />
        </div>

        {/* Question badge + text */}
        <div style={{
          background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 14, padding: "1rem", marginBottom: "1rem", position: "relative",
        }}>
          <span style={{
            position: "absolute", top: -10, left: 14,
            background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
            fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: 6, color: "#fff",
            boxShadow: "0 2px 10px rgba(99,102,241,0.4)",
          }}>
            Q3 · Hard
          </span>
          <p style={{ fontSize: "0.88rem", lineHeight: 1.6, color: "var(--text)", marginTop: "0.2rem" }}>
            Explain the bias-variance tradeoff and how dropout regularisation addresses it in deep networks.
          </p>
        </div>

        {/* Answer box */}
        <div style={{
          background: "rgba(255,255,255,0.025)", border: "1px solid rgba(99,102,241,0.35)",
          borderRadius: 12, padding: "0.85rem", marginBottom: "1rem",
          boxShadow: "0 0 0 3px rgba(99,102,241,0.12)",
          fontSize: "0.82rem", color: "var(--text-dim)", lineHeight: 1.6,
        }}>
          Bias refers to error from overly simple assumptions — high bias = underfitting.
          Variance refers to sensitivity to training data fluctuations…
          <span style={{ color: "var(--indigo-light)", fontWeight: 600 }}>▌</span>
        </div>

        {/* Score preview */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.75rem 1rem",
          background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)",
          borderRadius: 12,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: "0.7rem", color: "#34D399", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Score
            </span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Evaluating your answer…</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
            <span style={{
              fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.04em", color: "#34D399",
              animation: "glow-pulse 2s ease-in-out infinite",
            }}>
              8
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>/10</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Bento features ────────────────────────────────────────────────────── */
const BENTO = [
  {
    icon: "🎯",
    title: "Role-specific questions",
    desc: "Questions generated for your exact role, seniority level, and interview type — not generic filler from a question bank.",
    wide: true,
    accent: "rgba(99,102,241,0.12)",
    accentBorder: "rgba(99,102,241,0.25)",
  },
  {
    icon: "⚡",
    title: "Instant AI scoring",
    desc: "Score out of 10, identified strengths and gaps, and a model answer after every submission.",
    wide: false,
    accent: "rgba(139,92,246,0.1)",
    accentBorder: "rgba(139,92,246,0.2)",
  },
  {
    icon: "📊",
    title: "Weakness tracker",
    desc: "Running averages per topic surface exactly where you keep losing points.",
    wide: false,
    accent: "rgba(34,211,238,0.08)",
    accentBorder: "rgba(34,211,238,0.18)",
  },
  {
    icon: "🧠",
    title: "Mixed format sessions",
    desc: "Choose technical, behavioural, or the recommended 60/40 mixed mode.",
    wide: false,
    accent: "rgba(16,185,129,0.08)",
    accentBorder: "rgba(16,185,129,0.18)",
  },
  {
    icon: "🆓",
    title: "Free, no limits",
    desc: "No subscription, no paywalls, no daily caps. Practice as much as you need.",
    wide: false,
    accent: "rgba(251,191,36,0.07)",
    accentBorder: "rgba(251,191,36,0.18)",
  },
];

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { session, signOut } = useAuth();

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      {/* Ambient glows */}
      <div className="hero-glow" />
      <div className="hero-glow-2" />
      <div className="grid-pattern" />

      {/* ── Nav ── */}
      <nav className="nav">
        <Link to="/" className="nav-brand">
          <span className="nav-brand-mark" />
          Interview Coach
        </Link>
        <div className="nav-actions">
          {session ? (
            <>
              <Link to="/dashboard">
                <button className="btn-secondary">Dashboard</button>
              </Link>
              <button className="btn-secondary" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <Link to="/login">
              <button className="btn-secondary">Sign in</button>
            </Link>
          )}
        </div>
      </nav>

      {/* ── Hero split ── */}
      <div className="hero-split">
        {/* Left: copy */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {/* Badge */}
          <div className="anim-slideUp" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", width: "fit-content" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.35rem 0.85rem", borderRadius: 999,
              background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)",
              backdropFilter: "blur(12px)", fontSize: "0.78rem", color: "var(--indigo-light)",
              fontWeight: 600,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "#34D399", boxShadow: "0 0 8px #34D399", display: "inline-block" }} />
              AI-powered · Free forever
            </span>
          </div>

          {/* Headline */}
          <h1
            className="anim-slideUp"
            style={{
              fontSize: "clamp(2.8rem, 5.5vw, 5rem)",
              fontWeight: 900,
              lineHeight: 1.03,
              letterSpacing: "-0.04em",
              animationDelay: "0.06s",
            }}
          >
            Land your next{" "}
            <span className="gradient-text">tech role</span>
            <br />
            with confidence.
          </h1>

          {/* Sub */}
          <p
            className="anim-slideUp"
            style={{
              color: "var(--text-dim)",
              fontSize: "1.08rem",
              lineHeight: 1.7,
              maxWidth: 480,
              animationDelay: "0.12s",
            }}
          >
            Role-specific mock interviews powered by Groq LLaMA. Get scored on every answer,
            see a model response, and track the exact topics tripping you up.
          </p>

          {/* CTA row */}
          <div
            className="anim-slideUp"
            style={{ display: "flex", gap: "0.85rem", flexWrap: "wrap", animationDelay: "0.18s" }}
          >
            <Link to="/setup">
              <button className="btn-primary btn-primary-lg anim-pulse">
                Start practising free →
              </button>
            </Link>
            {!session && (
              <Link to="/login">
                <button className="btn-secondary" style={{ fontSize: "1rem", padding: "0.9rem 1.5rem", borderRadius: 14 }}>
                  Sign in
                </button>
              </Link>
            )}
          </div>

          {/* Social proof */}
          <div
            className="anim-slideUp"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
              animationDelay: "0.24s",
            }}
          >
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
              {["🧑‍💻","👩‍💻","🧑‍🔬","👨‍💼","🧑‍🎓"].map((e, i) => (
                <span key={i} style={{
                  width: 28, height: 28, borderRadius: "50%", display: "inline-flex",
                  alignItems: "center", justifyContent: "center", fontSize: "0.85rem",
                  background: "var(--surface-solid-2)", border: "2px solid var(--bg)",
                  marginLeft: i > 0 ? -8 : 0, zIndex: 5 - i, position: "relative",
                }}>
                  {e}
                </span>
              ))}
            </div>
            <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>
              Join engineers practising for FAANG, startups and everything in between
            </span>
          </div>
        </div>

        {/* Right: app mockup */}
        <div
          className="hero-mockup-col anim-slideUp"
          style={{ display: "flex", justifyContent: "center", animationDelay: "0.1s" }}
        >
          <div style={{ position: "relative", width: "100%", maxWidth: 440 }}>
            {/* Glow behind mockup */}
            <div style={{
              position: "absolute",
              inset: "-20%",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 65%)",
              filter: "blur(50px)",
              pointerEvents: "none",
              zIndex: 0,
              animation: "pulse-glow 6s ease-in-out infinite",
            }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <AppMockup />
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="stats-row" style={{ justifyContent: "center", gap: "4rem" }}>
        {[
          { num: "7", label: "Supported roles" },
          { num: "3", label: "Experience levels" },
          { num: "10", label: "Max questions / session" },
          { num: "∞", label: "Free sessions" },
        ].map((s) => (
          <div className="stat-item" key={s.label} style={{ alignItems: "center" }}>
            <span className="stat-num">{s.num}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Section header ── */}
      <div style={{
        textAlign: "center",
        padding: "4.5rem 1.5rem 2.5rem",
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "var(--indigo-light)",
          marginBottom: "1rem",
        }}>
          <span style={{ width: 18, height: 1, background: "var(--indigo-light)", display: "inline-block" }} />
          Everything you need
          <span style={{ width: 18, height: 1, background: "var(--indigo-light)", display: "inline-block" }} />
        </div>
        <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, letterSpacing: "-0.035em" }}>
          Built for real interviews
        </h2>
        <p style={{ color: "var(--text-dim)", maxWidth: 500, margin: "0.75rem auto 0", lineHeight: 1.65 }}>
          Every feature is designed around the one outcome that matters — walking into the interview room prepared.
        </p>
      </div>

      {/* ── Bento grid ── */}
      <div className="bento-grid">
        {BENTO.map((item, i) => (
          <div
            key={item.title}
            className={`bento-card anim-slideUp ${item.wide ? "bento-wide" : ""}`}
            style={{
              background: item.accent,
              border: `1px solid ${item.accentBorder}`,
              animationDelay: `${0.05 + i * 0.07}s`,
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 13,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.2rem", marginBottom: "1rem",
            }}>
              {item.icon}
            </div>
            <h3 style={{ fontWeight: 700, fontSize: "1.02rem", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
              {item.title}
            </h3>
            <p style={{ color: "var(--text-dim)", fontSize: "0.88rem", lineHeight: 1.6 }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div style={{
        borderTop: "1px solid var(--border)",
        padding: "1.75rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
        position: "relative",
        zIndex: 1,
      }}>
        <div className="nav-brand" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          <span className="nav-brand-mark" style={{ width: 20, height: 20, borderRadius: 6 }} />
          Interview Coach
        </div>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Built for engineers · Free forever · Powered by Groq LLaMA
        </span>
      </div>
    </div>
  );
}
