import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function AuthLayout({ children, title, subtitle, footer }) {
  return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: 460 }} className="anim-scale-in">
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🥗</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--primary-dark)", marginBottom: 8 }}>{title}</h1>
          <p style={{ fontSize: 15, color: "var(--text-3)" }}>{subtitle}</p>
        </div>
        <div className="card" style={{ padding: 32 }}>{children}</div>
        {footer && <div style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-3)" }}>{footer}</div>}
      </div>
    </div>
  );
}

// ─── Google Preferences Screen ─────────────────────────────────────────────────
// Shown after Google login if gender not set yet
function GooglePreferences({ navigate }) {
  const { profile, updateUserProfile } = useAuth();
  const [gender,  setGender]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const name = profile?.displayName?.split(" ")[0] || "there";

  async function handleSave(e) {
    e.preventDefault();
    if (!gender) { setError("Please select your gender to continue."); return; }
    setLoading(true);
    try {
      await updateUserProfile({ gender });
      navigate("dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <AuthLayout title={`Welcome, ${name}! 👋`} subtitle="Just one quick thing before we get started">
      {error && <div className="banner banner-error mb-16">{error}</div>}
      <form onSubmit={handleSave}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6 }}>
            This helps us match you with the right trainers and personalize your experience.
          </div>
        </div>
        <div className="form-group">
          <label>Gender</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {[
              { value: "Female",            icon: "👩", label: "Female" },
              { value: "Male",              icon: "👨", label: "Male" },
              { value: "Prefer not to say", icon: "🙂", label: "Prefer not to say" },
            ].map(g => (
              <button type="button" key={g.value} onClick={() => setGender(g.value)}
                style={{ padding: "12px 8px", border: `1.5px solid ${gender === g.value ? "var(--primary)" : "var(--border)"}`, background: gender === g.value ? "var(--primary-pale)" : "#fff", borderRadius: "var(--radius-sm)", cursor: "pointer", textAlign: "center", transition: "var(--transition)", fontFamily: "var(--font-body)" }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{g.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: gender === g.value ? "var(--primary-dark)" : "var(--text-3)" }}>{g.label}</div>
              </button>
            ))}
          </div>
          <p className="form-hint">Used only for trainer matching. You can change this anytime in Account Settings.</p>
        </div>

        <div style={{ background: "var(--primary-pale)", borderRadius: "var(--radius-sm)", padding: 14, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--primary-dark)", marginBottom: 8 }}>🎉 Your free account includes:</div>
          {["2 AI meal plans per month","Access to certified trainers","Indian grocery links","Recipe instructions & tips"].map(f => (
            <div key={f} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--primary-dark)", marginBottom: 4 }}>
              <span>✓</span> {f}
            </div>
          ))}
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={loading || !gender} style={{ padding: 13, fontSize: 15 }}>
          {loading ? <><span className="spin">⟳</span> Saving...</> : "Get Started →"}
        </button>
      </form>
    </AuthLayout>
  );
}

// ─── Login Page ────────────────────────────────────────────────────────────────
export function LoginPage({ navigate }) {
  const { loginWithEmail, loginWithGoogle, profile } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error,    setError]    = useState("");
  const [showPrefs, setShowPrefs] = useState(false);

  // If profile loaded and gender missing, show prefs
  if (showPrefs || (profile && !profile.gender)) {
    return <GooglePreferences navigate={navigate} />;
  }

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
      const user = await loginWithGoogle();
      // Check if new Google user — no gender set yet
      if (!profile?.gender) {
        setShowPrefs(true);
      } else {
        navigate("dashboard");
      }
    } catch (err) {
      setError(friendlyError(err.code));
    } finally { setGLoading(false); }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your NourishAI account"
      footer={<>Don't have an account? <button onClick={() => navigate("signup")} style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Sign up free</button></>}>
      {error && <div className="banner banner-error mb-16">{error}</div>}
      <button onClick={handleGoogle} disabled={gLoading}
        style={{ width: "100%", padding: "11px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", background: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20, transition: "var(--transition)", fontFamily: "var(--font-body)", color: "var(--text)" }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-muted)"}
        onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
        {gLoading ? <span className="spin">⟳</span> : <GoogleIcon />}
        Continue with Google
      </button>
      <div className="divider-text">or sign in with email</div>
      <form onSubmit={handleEmail}>
        <div className="form-group">
          <label>Email address</label>
          <input className="form-control" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="form-group">
          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Password</span>
            <button type="button" onClick={() => setShowPw(p => !p)} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)" }}>{showPw ? "Hide" : "Show"}</button>
          </label>
          <input className="form-control" type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ padding: 13, fontSize: 15, marginTop: 4 }}>
          {loading ? <><span className="spin">⟳</span> Signing in...</> : "Sign in"}
        </button>
      </form>
      <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 12, color: "var(--text-4)", textAlign: "center", marginBottom: 10 }}>Your account includes</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          {["🍛 Meal Plans","💪 Trainers","🛒 Grocery Links","📖 Recipes"].map(b => (
            <span key={b} style={{ fontSize: 12, color: "var(--text-3)" }}>{b}</span>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}

// ─── Signup Page ───────────────────────────────────────────────────────────────
export function SignupPage({ navigate }) {
  const { signupWithEmail, loginWithGoogle, profile } = useAuth();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [gender,   setGender]   = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error,    setError]    = useState("");
  const [step,     setStep]     = useState(1);
  const [showPrefs, setShowPrefs] = useState(false);

  // If Google user with no gender → show prefs
  if (showPrefs || (profile && !profile.gender)) {
    return <GooglePreferences navigate={navigate} />;
  }

  function getStrength(pw) {
    if (!pw) return { score: 0, label: "", color: "var(--border)" };
    let score = 0;
    if (pw.length >= 6)         score++;
    if (pw.length >= 10)        score++;
    if (/[A-Z]/.test(pw))       score++;
    if (/[0-9]/.test(pw))       score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { score, label: "Weak",   color: "var(--red-500)" };
    if (score <= 3) return { score, label: "Medium",  color: "var(--amber-500)" };
    return                { score, label: "Strong",  color: "var(--primary)" };
  }
  const strength = getStrength(password);

  async function handleStep1(e) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }
    setError(""); setStep(2);
  }

  async function handleSignup(e) {
    e.preventDefault();
    if (!gender) { setError("Please select your gender to continue."); return; }
    setLoading(true); setError("");
    try {
      await signupWithEmail(email, password, name, { gender });
      navigate("dashboard");
    } catch (err) {
      setError(friendlyError(err.code));
      setStep(1);
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setGLoading(true); setError("");
    try {
      await loginWithGoogle();
      // New Google users won't have gender — show prefs screen
      setShowPrefs(true);
    } catch (err) {
      setError(friendlyError(err.code));
    } finally { setGLoading(false); }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start planning better meals today — free forever"
      footer={<>Already have an account? <button onClick={() => navigate("login")} style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Sign in</button></>}>
      {error && <div className="banner banner-error mb-16">{error}</div>}

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, alignItems: "center" }}>
        {[1,2].map(s => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: step >= s ? "var(--primary)" : "var(--border)", color: step >= s ? "#fff" : "var(--text-4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0, transition: "var(--transition)" }}>
              {step > s ? "✓" : s}
            </div>
            <span style={{ fontSize: 12, color: step >= s ? "var(--primary)" : "var(--text-4)", fontWeight: step >= s ? 600 : 400 }}>
              {s === 1 ? "Account Details" : "Your Preferences"}
            </span>
            {s < 2 && <div style={{ flex: 1, height: 1, background: step > s ? "var(--primary)" : "var(--border)" }} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <>
          <button onClick={handleGoogle} disabled={gLoading}
            style={{ width: "100%", padding: "11px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", background: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20, transition: "var(--transition)", fontFamily: "var(--font-body)", color: "var(--text)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-muted)"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
            {gLoading ? <span className="spin">⟳</span> : <GoogleIcon />}
            Sign up with Google
          </button>
          <div className="divider-text">or sign up with email</div>
          <form onSubmit={handleStep1}>
            <div className="form-group">
              <label>Full Name</label>
              <input className="form-control" type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email address</label>
              <input className="form-control" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Password</span>
                {password && <span style={{ fontSize: 12, fontWeight: 600, color: strength.color }}>{strength.label}</span>}
              </label>
              <div style={{ position: "relative" }}>
                <input className="form-control" type={showPw ? "text" : "password"} placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" style={{ paddingRight: 48 }} />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 12 }}>{showPw ? "Hide" : "Show"}</button>
              </div>
              {password && (
                <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                  {[1,2,3,4,5].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength.score ? strength.color : "var(--border)", transition: "var(--transition)" }} />)}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input className="form-control" type={showPw ? "text" : "password"} placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password" />
              {confirm && password !== confirm && <p className="form-error">Passwords do not match</p>}
              {confirm && password === confirm && <p style={{ fontSize: 12, color: "var(--primary)", marginTop: 5 }}>✓ Passwords match</p>}
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ padding: 13, fontSize: 15 }}>Continue →</button>
          </form>
        </>
      )}

      {step === 2 && (
        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>Hi {name.split(" ")[0]}! Just a couple more things 👋</div>
            <div style={{ fontSize: 13, color: "var(--text-3)" }}>This helps us personalize your experience and match you with the right trainers.</div>
          </div>
          <div className="form-group">
            <label>Gender</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[{ value: "Female", icon: "👩", label: "Female" },{ value: "Male", icon: "👨", label: "Male" },{ value: "Prefer not to say", icon: "🙂", label: "Prefer not to say" }].map(g => (
                <button type="button" key={g.value} onClick={() => setGender(g.value)}
                  style={{ padding: "12px 8px", border: `1.5px solid ${gender === g.value ? "var(--primary)" : "var(--border)"}`, background: gender === g.value ? "var(--primary-pale)" : "#fff", borderRadius: "var(--radius-sm)", cursor: "pointer", textAlign: "center", transition: "var(--transition)", fontFamily: "var(--font-body)" }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{g.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: gender === g.value ? "var(--primary-dark)" : "var(--text-3)" }}>{g.label}</div>
                </button>
              ))}
            </div>
            <p className="form-hint">Used only for trainer matching. You can change this anytime in Account Settings.</p>
          </div>
          <div style={{ background: "var(--primary-pale)", borderRadius: "var(--radius-sm)", padding: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--primary-dark)", marginBottom: 8 }}>🎉 Your free account includes:</div>
            {["2 AI meal plans per month","Access to certified trainers","Indian grocery links","Recipe instructions & tips"].map(f => (
              <div key={f} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--primary-dark)", marginBottom: 4 }}><span>✓</span> {f}</div>
            ))}
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading || !gender} style={{ padding: 13, fontSize: 15, marginBottom: 10 }}>
            {loading ? <><span className="spin">⟳</span> Creating account...</> : "Create My Account 🚀"}
          </button>
          <button type="button" className="btn btn-ghost btn-full btn-sm" onClick={() => { setStep(1); setError(""); }}>← Back</button>
          <p style={{ fontSize: 11, color: "var(--text-4)", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
            By creating an account, you agree to our <button onClick={() => {}} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 11 }}>Terms of Service</button> and <button onClick={() => {}} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 11 }}>Privacy Policy</button>.
          </p>
        </form>
      )}
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
    "auth/user-not-found":         "No account found with this email.",
    "auth/wrong-password":         "Incorrect password. Please try again.",
    "auth/email-already-in-use":   "An account with this email already exists.",
    "auth/weak-password":          "Password should be at least 6 characters.",
    "auth/invalid-email":          "Please enter a valid email address.",
    "auth/too-many-requests":      "Too many attempts. Please wait a moment and try again.",
    "auth/popup-closed-by-user":   "Sign-in popup was closed. Please try again.",
    "auth/network-request-failed": "Network error. Please check your connection.",
    "auth/invalid-credential":     "Invalid email or password. Please try again.",
  };
  return map[code] || "Something went wrong. Please try again.";
}