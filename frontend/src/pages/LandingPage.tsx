import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LandingPage() {
  const { session, signOut } = useAuth();

  return (
    <div>
      <nav className="nav">
        <Link to="/" className="nav-brand">AI Interview Coach</Link>
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

      <div className="page" style={{ textAlign: "center", paddingTop: "5rem" }}>
        <h1 style={{ fontSize: "2.8rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "1.25rem" }}>
          Ace your next interview.<br />
          <span style={{ color: "var(--color-accent)" }}>Powered by AI.</span>
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "1.05rem", maxWidth: 480, margin: "0 auto 2.5rem" }}>
          Role-specific questions, instant scoring, model answers, and a
          weakness tracker that learns your gaps across sessions.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/setup">
            <button className="btn-primary" style={{ fontSize: "1rem", padding: "0.75rem 2rem" }}>
              Start Interview →
            </button>
          </Link>
          {!session && (
            <Link to="/login">
              <button className="btn-secondary" style={{ fontSize: "1rem", padding: "0.75rem 2rem" }}>
                Sign in / Register
              </button>
            </Link>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginTop: "5rem" }}>
          {[
            { icon: "🎯", title: "Role-specific", desc: "Questions tuned to your exact role and experience level" },
            { icon: "⚡", title: "Instant feedback", desc: "Score, strengths, gaps, and a model answer after every question" },
            { icon: "📊", title: "Weakness tracker", desc: "Running averages surface topics that consistently trip you up" },
            { icon: "🆓", title: "Completely free", desc: "No subscriptions, no paywalls — just practice" },
          ].map((f) => (
            <div key={f.title} className="card" style={{ textAlign: "left" }}>
              <div style={{ fontSize: "1.75rem", marginBottom: "0.6rem" }}>{f.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: "0.35rem" }}>{f.title}</div>
              <div style={{ color: "var(--color-text-muted)", fontSize: "0.88rem" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
