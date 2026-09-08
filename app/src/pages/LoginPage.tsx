import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, type SignInPersistence } from "../context/AuthContext";
import { AppAtmosphere } from "../layout/AppAtmosphere";

export function LoginPage() {
  const { user, ready, signInEmail, signInGoogle, signInApple } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const persistence: SignInPersistence = staySignedIn ? "local" : "session";

  if (!ready) {
    return (
      <div className="login-page">
        <AppAtmosphere />
        <div className="login-card card">
          <p className="muted">Loading…</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signInEmail(email.trim(), password, persistence);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInGoogle(persistence);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function onApple() {
    setError(null);
    setBusy(true);
    try {
      await signInApple(persistence);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Apple sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <AppAtmosphere />
      <div className="login-card card">
        <p className="eyebrow">Oria AI</p>
        <h1>Sign in</h1>
        <p className="page-lede muted">Continue with the same account you use in the app.</p>
        <div className="login-oauth-row login-oauth-first">
          <button type="button" className="btn secondary" disabled={busy} onClick={() => void onGoogle()}>
            Continue with Google
          </button>
          <button type="button" className="btn secondary" disabled={busy} onClick={() => void onApple()}>
            Continue with Apple
          </button>
        </div>
        <div className="divider">or</div>
        <form className="stack login-email-form" onSubmit={(e) => void onSubmit(e)}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <label className="login-stay-row">
          <input
            type="checkbox"
            checked={staySignedIn}
            onChange={(e) => setStaySignedIn(e.target.checked)}
            disabled={busy}
          />
          <span>Remember me on this device</span>
        </label>
      </div>
    </div>
  );
}
