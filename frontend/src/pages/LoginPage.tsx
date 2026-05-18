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
    <div className="page" style={{ maxWidth: 400, paddingTop: "4rem" }}>
      <Link to="/" style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>← Back</Link>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "1.25rem 0 0.25rem" }}>
        {mode === "signin" ? "Welcome back" : "Create account"}
      </h1>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: "1.75rem" }}>
        {mode === "signin"
          ? "Sign in to track your progress across sessions."
          : "Register to save your session history and weakness data."}
      </p>

      {error && <div className="error-banner" style={{ marginBottom: "1rem" }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
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
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "0.5rem" }}>
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p style={{ marginTop: "1.25rem", fontSize: "0.88rem", color: "var(--color-text-muted)" }}>
        {mode === "signin" ? "No account? " : "Already registered? "}
        <button
          style={{ background: "none", color: "var(--color-accent)", padding: 0, fontWeight: 600 }}
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
        >
          {mode === "signin" ? "Create one" : "Sign in"}
        </button>
      </p>

      <p style={{ marginTop: "0.75rem", fontSize: "0.88rem", color: "var(--color-text-muted)" }}>
        Or{" "}
        <Link to="/setup" style={{ color: "var(--color-accent)", fontWeight: 600 }}>
          continue as guest
        </Link>{" "}
        (progress won't be saved)
      </p>
    </div>
  );
}
