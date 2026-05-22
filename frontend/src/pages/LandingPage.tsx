import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/* ─── SVG Icons (no emojis per ui-ux-pro-max rule) ───────────────────── */

function IconTarget() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function IconZap() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function IconBarChart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function IconBrain() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2a3.5 3.5 0 0 0-3.24 4.8A3.5 3.5 0 0 0 5 13.5a3.5 3.5 0 0 0 2.68 3.4A3.5 3.5 0 0 0 12 19.5V2" />
      <path d="M14.5 2a3.5 3.5 0 0 1 3.24 4.8A3.5 3.5 0 0 1 19 13.5a3.5 3.5 0 0 1-2.68 3.4A3.5 3.5 0 0 1 12 19.5" />
    </svg>
  );
}
function IconGift() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}
function IconMic() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
function IconVideo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}
function IconMessageSquare() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

/* ─── Mock UI preview card ──────────────────────────────────────────────── */
function AppMockup() {
  return (
    <div className="mockup-card" style={{ marginLeft: "auto", marginRight: "auto" }}>
      <div className="mockup-topbar">
        <div className="mockup-dot" style={{ background: "#FF5F57" }} />
        <div className="mockup-dot" style={{ background: "#FFBD2E" }} />
        <div className="mockup-dot" style={{ background: "#28C840" }} />
        <span style={{ marginLeft: "0.5rem", fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.03em" }}>
          interview-coach.app
        </span>
      </div>

      <div style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            ML Engineer · Mid · Q3 of 10
          </span>
          <span className="badge" style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem" }}>
            <span className="badge-dot" />
            Live
          </span>
        </div>
        <div className="progress-track" style={{ marginBottom: "1.25rem" }}>
          <div className="progress-fill" style={{ width: "30%" }} />
        </div>

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

        <div style={{
          background: "rgba(255,255,255,0.025)", border: "1px solid rgba(99,102,241,0.35)",
          borderRadius: 12, padding: "0.85rem", marginBottom: "1rem",
          boxShadow: "0 0 0 3px rgba(99,102,241,0.12)",
          fontSize: "0.82rem", color: "var(--text-dim)", lineHeight: 1.6,
        }}>
          Bias refers to error from overly simple assumptions — high bias = underfitting.
          Variance refers to sensitivity to training data fluctuations…
          <span style={{ color: "var(--indigo-light)", fontWeight: 600 }}>|</span>
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.75rem 1rem",
          background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)",
          borderRadius: 12,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span className="overline" style={{ color: "#34D399", fontSize: "0.65rem" }}>Score</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Evaluating your answer…</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
            <span style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.04em", color: "#34D399", fontFamily: "var(--font-display)" }}>
              8
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>/10</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Feature data ─────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: <IconTarget />,
    title: "Role-specific questions",
    desc: "Questions generated for your exact role, seniority, and interview type — not generic filler.",
    color: "99,102,241",
    wide: true,
  },
  {
    icon: <IconZap />,
    title: "Instant AI scoring",
    desc: "Detailed evaluation with strengths, gaps, and actionable feedback after every session.",
    color: "139,92,246",
    wide: false,
  },
  {
    icon: <IconBarChart />,
    title: "Weakness tracker",
    desc: "Running averages per topic surface exactly where you keep losing points.",
    color: "34,211,238",
    wide: false,
  },
  {
    icon: <IconBrain />,
    title: "Mixed format sessions",
    desc: "Choose technical, behavioural, or the recommended 60/40 mixed mode.",
    color: "16,185,129",
    wide: false,
  },
  {
    icon: <IconGift />,
    title: "Free, no limits",
    desc: "No subscription, no paywalls, no daily caps. Practice as much as you need.",
    color: "251,191,36",
    wide: false,
  },
];

const HOW_IT_WORKS = [
  { icon: <IconMic />, title: "Speak naturally", desc: "Answer questions out loud — just like a real interview. Or type for code questions." },
  { icon: <IconVideo />, title: "Record yourself", desc: "Webcam captures your session so you can review body language and delivery." },
  { icon: <IconMessageSquare />, title: "Get your report", desc: "Full evaluation dashboard with per-topic scores, speech analytics, and improvement areas." },
];

/* ─── Avatars (SVG instead of emojis) ──────────────────────────────────── */
function AvatarStack() {
  const colors = ["#6366F1", "#8B5CF6", "#22D3EE", "#10B981", "#F59E0B"];
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {colors.map((c, i) => (
        <div key={i} style={{
          width: 30, height: 30, borderRadius: "50%",
          background: `linear-gradient(135deg, ${c}44, ${c}88)`,
          border: "2px solid var(--bg)",
          marginLeft: i > 0 ? -8 : 0,
          position: "relative", zIndex: 5 - i,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      ))}
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { session, signOut } = useAuth();

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
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
              <Link to="/dashboard"><button className="btn-secondary">Dashboard</button></Link>
              <button className="btn-secondary" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <Link to="/login"><button className="btn-secondary">Sign in</button></Link>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="hero-split">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {/* Badge */}
          <div className="anim-slideUp">
            <span className="badge">
              <span className="badge-dot" />
              AI-powered · Free forever
            </span>
          </div>

          {/* Headline */}
          <h1 className="display-xl anim-slideUp" style={{ animationDelay: "0.06s" }}>
            Ace your next{" "}
            <span className="gradient-text">tech interview</span>
          </h1>

          {/* Sub */}
          <p className="subtitle anim-slideUp" style={{ animationDelay: "0.12s" }}>
            Live voice interviews powered by AI. Get scored on every answer, track your weak spots,
            and walk in prepared.
          </p>

          {/* CTA */}
          <div className="anim-slideUp" style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", animationDelay: "0.18s" }}>
            <Link to="/setup">
              <button className="btn-primary btn-primary-lg" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Start practising free <IconArrowRight />
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
          <div className="anim-slideUp" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap", animationDelay: "0.24s" }}>
            <AvatarStack />
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-dim)" }}>
              Join engineers practising for FAANG, startups, and everything in between
            </span>
          </div>
        </div>

        {/* Mockup */}
        <div className="hero-mockup-col anim-slideUp" style={{ display: "flex", justifyContent: "center", animationDelay: "0.1s" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 440 }}>
            <div style={{
              position: "absolute", inset: "-20%", borderRadius: "50%",
              background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 65%)",
              filter: "blur(50px)", pointerEvents: "none", zIndex: 0,
            }} />
            <div style={{ position: "relative", zIndex: 1 }}><AppMockup /></div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stats-row" style={{ justifyContent: "center", gap: "4rem" }}>
        {[
          { num: "80+", label: "Interview topics" },
          { num: "3", label: "Difficulty levels" },
          { num: "5", label: "Score dimensions" },
          { num: "∞", label: "Free sessions" },
        ].map((s) => (
          <div className="stat-item" key={s.label} style={{ alignItems: "center" }}>
            <span className="stat-num">{s.num}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── How it works ── */}
      <section style={{ position: "relative", zIndex: 1, padding: "var(--space-24) var(--space-6) var(--space-16)", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
          <span className="overline" style={{ color: "var(--indigo-light)", marginBottom: "var(--space-3)", display: "block" }}>
            How it works
          </span>
          <h2 className="display-lg">Three steps to interview-ready</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-6)" }}>
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.title} className="anim-slideUp" style={{
              display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
              gap: "var(--space-4)", animationDelay: `${0.1 + i * 0.1}s`,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))",
                border: "1px solid rgba(99,102,241,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--indigo-light)",
              }}>
                {step.icon}
              </div>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "var(--surface-solid-2)", border: "1px solid var(--border-strong)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-display)", fontSize: "var(--text-sm)", fontWeight: 700,
                color: "var(--indigo-light)",
              }}>
                {i + 1}
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 700 }}>
                {step.title}
              </h3>
              <p style={{ color: "var(--text-dim)", fontSize: "var(--text-sm)", lineHeight: 1.65, maxWidth: 280 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* ── Features heading ── */}
      <div style={{ textAlign: "center", padding: "var(--space-16) var(--space-6) var(--space-8)", position: "relative", zIndex: 1 }}>
        <span className="overline" style={{ color: "var(--indigo-light)", marginBottom: "var(--space-3)", display: "block" }}>
          Features
        </span>
        <h2 className="display-lg">Everything you need to prepare</h2>
        <p className="subtitle" style={{ margin: "var(--space-3) auto 0" }}>
          Every feature is designed around one outcome — walking into the interview room prepared.
        </p>
      </div>

      {/* ── Bento grid ── */}
      <div className="bento-grid">
        {FEATURES.map((item, i) => (
          <div
            key={item.title}
            className={`bento-card anim-slideUp ${item.wide ? "bento-wide" : ""}`}
            style={{
              background: `rgba(${item.color}, 0.06)`,
              border: `1px solid rgba(${item.color}, 0.18)`,
              animationDelay: `${0.05 + i * 0.07}s`,
            }}
          >
            <div className="feature-icon" style={{
              background: `rgba(${item.color}, 0.12)`,
              border: `1px solid rgba(${item.color}, 0.25)`,
              color: `rgba(${item.color}, 1)`,
              marginBottom: "var(--space-4)",
            }}>
              {item.icon}
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", marginBottom: "var(--space-2)", letterSpacing: "-0.02em" }}>
              {item.title}
            </h3>
            <p style={{ color: "var(--text-dim)", fontSize: "var(--text-sm)", lineHeight: 1.65 }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* ── CTA banner ── */}
      <section style={{
        position: "relative", zIndex: 1,
        maxWidth: 800, margin: "0 auto var(--space-24)",
        padding: "var(--space-12) var(--space-8)",
        textAlign: "center",
        background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))",
        border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: "var(--radius-lg)",
      }}>
        <h2 className="display-lg" style={{ marginBottom: "var(--space-3)" }}>
          Ready to practice?
        </h2>
        <p className="subtitle" style={{ margin: "0 auto var(--space-6)" }}>
          No sign-up required. Pick your topics and start a live interview in under 30 seconds.
        </p>
        <Link to="/setup">
          <button className="btn-primary btn-primary-lg" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            Start your first interview <IconArrowRight />
          </button>
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "var(--space-6) var(--space-8)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: "var(--space-4)",
        position: "relative", zIndex: 1,
      }}>
        <div className="nav-brand" style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
          <span className="nav-brand-mark" style={{ width: 20, height: 20, borderRadius: 6 }} />
          Interview Coach
        </div>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
          Built for engineers · Free forever · Powered by Groq LLaMA
        </span>
      </footer>
    </div>
  );
}
