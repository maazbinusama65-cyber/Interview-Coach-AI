import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate("/setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "relative",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1.25rem",
      overflow: "hidden",
    }}>
      {/* Background glows */}
      <div style={{
        position: "absolute", width: 700, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.28) 0%, rgba(139,92,246,0.08) 45%, transparent 70%)",
        filter: "blur(80px)", pointerEvents: "none", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        animation: "pulse-glow 8s ease-in-out infinite",
      }} />
      <div className="grid-pattern" />

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        {/* Back link */}
        <Link to="/" style={{
          display: "inline-flex", alignItems: "center", gap: "0.4rem",
          color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "2rem",
          transition: "color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          ← Back home
        </Link>

        {/* Card */}
        <div
          className="card anim-slideUp card-glow-top"
          style={{ padding: "2.5rem", border: "1px solid var(--border-strong)" }}
        >
          {/* Brand mark */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "2rem" }}>
            <span className="nav-brand-mark" style={{ width: 38, height: 38, borderRadius: 11 }} />
            <span style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.025em" }}>Interview Coach</span>
          </div>

          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "0.4rem" }}>
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p style={{ color: "var(--text-dim)", fontSize: "0.92rem", marginBottom: "2rem" }}>
            {mode === "signin"
              ? "Sign in to track your progress across sessions."
              : "Save sessions and build your weakness profile."}
          </p>

          {/* Mode toggle */}
          <div style={{
            display: "flex", gap: "0.25rem", padding: "0.3rem",
            background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
            borderRadius: 14, marginBottom: "1.75rem",
          }}>
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                style={{
                  flex: 1, padding: "0.65rem", borderRadius: 10,
                  background: mode === m
                    ? "linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.16))"
                    : "transparent",
                  color: mode === m ? "#fff" : "var(--text-muted)",
                  fontSize: "0.88rem", fontWeight: 600,
                  border: mode === m ? "1px solid rgba(129,140,248,0.4)" : "1px solid transparent",
                  transition: "all 0.2s",
                }}
              >
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {error && (
            <div className="error-banner anim-slideDown" style={{ marginBottom: "1.25rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={6}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: "0.5rem", padding: "0.9rem", fontSize: "0.95rem", borderRadius: 12 }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}>
                  <span style={{
                    width: 15, height: 15,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    animation: "spin-slow 0.8s linear infinite",
                    display: "inline-block",
                  }} />
                  Please wait…
                </span>
              ) : mode === "signin" ? "Sign in →" : "Create account →"}
            </button>
          </form>

          <div style={{
            marginTop: "1.75rem", paddingTop: "1.5rem",
            borderTop: "1px solid var(--border)",
            textAlign: "center", fontSize: "0.88rem", color: "var(--text-muted)",
          }}>
            Or{" "}
            <Link to="/setup" style={{ color: "var(--indigo-light)", fontWeight: 600 }}>
              continue as guest
            </Link>
            {" "}
            <span style={{ opacity: 0.6 }}>(progress won't be saved)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
