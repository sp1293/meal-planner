import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function AuthLayout({ children, title, subtitle, footer }) {
  return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: 440 }} className="anim-scale-in">
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🥗</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--primary-dark)", marginBottom: 8 }}>{title}</h1>
          <p style={{ fontSize: 15, color: "var(--text-3)" }}>{subtitle}</p>
        </div>
        <div className="card" style={{ padding: 32 }}>
          {children}
        </div>
        {footer && <div style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-3)" }}>{footer}</div>}
      </div>
    </div>
  );
}

export function LoginPage({ navigate }) {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [gLoading, setGLoading] = useState(false);

  async function handleEmail(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await loginWithEmail(email, password);
      navigate("dashboard");
    } catch (err) {
      setError(friendlyError(err.code));
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setGLoading(true); setError("");
    try {
      await loginWithGoogle();
      navigate("dashboard");
    } catch (err) {
      setError(friendlyError(err.code));
    } finally { setGLoading(false); }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your NourishAI account"
      footer={<>Don't have an account? <button onClick={() => navigate("signup")} style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Sign up free</button></>}>
      {error && <div className="banner banner-error mb-16">{error}</div>}
      <button onClick={handleGoogle} disabled={gLoading}
        style={{ width: "100%", padding: "11px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", background: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20, transition: "var(--transition)" }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-muted)"}
        onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
        {gLoading ? <span className="spin">⟳</span> : <GoogleIcon />}
        Continue with Google
      </button>
      <div className="divider-text">or sign in with email</div>
      <form onSubmit={handleEmail}>
        <div className="form-group">
          <label>Email</label>
          <input className="form-control" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input className="form-control" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ padding: 13, fontSize: 15 }}>
          {loading ? <><span className="spin">⟳</span> Signing in...</> : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}

export function SignupPage({ navigate }) {
  const { signupWithEmail, loginWithGoogle } = useAuth();
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [gLoading, setGLoading] = useState(false);

  async function handleEmail(e) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    try {
      await signupWithEmail(email, password, name);
      navigate("dashboard");
    } catch (err) {
      setError(friendlyError(err.code));
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setGLoading(true); setError("");
    try {
      await loginWithGoogle();
      navigate("dashboard");
    } catch (err) {
      setError(friendlyError(err.code));
    } finally { setGLoading(false); }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start planning better meals today — free forever"
      footer={<>Already have an account? <button onClick={() => navigate("login")} style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Sign in</button></>}>
      {error && <div className="banner banner-error mb-16">{error}</div>}
      <button onClick={handleGoogle} disabled={gLoading}
        style={{ width: "100%", padding: "11px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", background: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20, transition: "var(--transition)" }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-muted)"}
        onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
        {gLoading ? <span className="spin">⟳</span> : <GoogleIcon />}
        Sign up with Google
      </button>
      <div className="divider-text">or sign up with email</div>
      <form onSubmit={handleEmail}>
        <div className="form-group">
          <label>Full Name</label>
          <input className="form-control" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input className="form-control" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input className="form-control" type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
        </div>
        <div className="form-group">
          <label>Confirm Password</label>
          <input className="form-control" type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password" />
        </div>
        <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ padding: 13, fontSize: 15 }}>
          {loading ? <><span className="spin">⟳</span> Creating account...</> : "Create free account"}
        </button>
        <p style={{ fontSize: 12, color: "var(--text-4)", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </AuthLayout>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
    </svg>
  );
}

function friendlyError(code) {
  const map = {
    "auth/user-not-found":       "No account found with this email.",
    "auth/wrong-password":       "Incorrect password. Please try again.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password":        "Password should be at least 6 characters.",
    "auth/invalid-email":        "Please enter a valid email address.",
    "auth/too-many-requests":    "Too many attempts. Please try again later.",
    "auth/popup-closed-by-user": "Sign-in popup was closed. Please try again.",
  };
  return map[code] || "Something went wrong. Please try again.";
}
