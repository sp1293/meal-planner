import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { trackSignup } from "../utils/analytics";

// ── Shared layout wrapper ─────────────────────────────────────────────────────
function AuthLayout({ children, title, subtitle, footer }) {
  return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: 460 }} className="anim-scale-in">
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/logo192.png" alt="Mitabhukta" style={{ width: 56, height: 56, borderRadius: 14, marginBottom: 12, objectFit: "cover" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--primary-dark)", marginBottom: 8 }}>{title}</h1>
          <p style={{ fontSize: 15, color: "var(--text-3)" }}>{subtitle}</p>
        </div>
        <div className="card" style={{ padding: 32 }}>{children}</div>
        {footer && <div style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-3)" }}>{footer}</div>}
      </div>
    </div>
  );
}

// ── Email Verification Screen ─────────────────────────────────────────────────
function VerifyEmailScreen({ email, password, onBackToLogin }) {
  const { resendVerificationEmail, clearJustSignedUp } = useAuth();
  const [resent,  setResent]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleResend() {
    setLoading(true); setError("");
    try {
      await resendVerificationEmail(email, password);
      setResent(true);
      setTimeout(() => setResent(false), 6000);
    } catch (err) {
      console.error("Resend verification error:", err.code, err.message);
      setError("Could not resend. Please try signing in again.");
    } finally { setLoading(false); }
  }

  function handleBack() {
    clearJustSignedUp(); // ← clear flag so App.jsx redirects normally
    onBackToLogin();
  }

  return (
    <AuthLayout title="Check your email" subtitle="One last step before you get started">
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
        <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 20 }}>
          We sent a verification link to <strong>{email}</strong>.<br/>
          Click the link in that email to activate your account.
        </p>
        <div style={{ background: "var(--primary-pale)", borderRadius: "var(--radius-sm)", padding: 14, marginBottom: 20, fontSize: 13, color: "var(--primary-dark)", textAlign: "left" }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>📌 Can't find the email?</div>
          <div style={{ marginBottom: 3 }}>• Check your <strong>spam/junk</strong> folder</div>
          <div style={{ marginBottom: 3 }}>• Search for "noreply@mitabhukta.com</div>
          <div style={{ marginBottom: 3 }}>• Make sure you used the correct email</div>
          <div>• Wait up to 2 minutes for delivery</div>
        </div>
        {error  && <div className="banner banner-error mb-16">{error}</div>}
        {resent && <div className="banner banner-success mb-16">✅ Verification email resent! Check your inbox.</div>}
        <button className="btn btn-primary btn-full" onClick={handleResend} disabled={loading} style={{ marginBottom: 10 }}>
          {loading ? <><span className="spin">⟳</span> Sending...</> : "📨 Resend Verification Email"}
        </button>
        <button className="btn btn-ghost btn-full btn-sm" onClick={handleBack}>
          ← Back to Sign In
        </button>
        <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 16, lineHeight: 1.6 }}>
          After clicking the link in your email, come back and sign in normally.
        </p>
      </div>
    </AuthLayout>
  );
}

// ── Forgot Password Screen ────────────────────────────────────────────────────
function ForgotPasswordScreen({ onBack }) {
  const { resetPassword } = useAuth();
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      console.error("Password reset error:", err.code, err.message);
      setError(friendlyError(err.code));
    } finally { setLoading(false); }
  }

  if (sent) {
    return (
      <AuthLayout title="Reset email sent!" subtitle="Check your inbox">
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔑</div>
          <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 20 }}>
            We sent a password reset link to <strong>{email}</strong>.<br/>
            Click the link to set a new password.
          </p>
          <div style={{ background: "var(--primary-pale)", borderRadius: "var(--radius-sm)", padding: 12, marginBottom: 20, fontSize: 13, color: "var(--primary-dark)", textAlign: "left" }}>
            <div style={{ marginBottom: 3 }}>• Check your <strong>spam folder</strong> if you don't see it</div>
            <div style={{ marginBottom: 3 }}>• Search for "noreply@nourishai-27d26"</div>
            <div style={{ marginBottom: 3 }}>• Link expires in 1 hour</div>
            <div>• After resetting, come back and sign in</div>
          </div>
          <button className="btn btn-primary btn-full" onClick={onBack}>← Back to Sign In</button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password?" subtitle="We'll send you a reset link"
      footer={<>Remember it? <button onClick={onBack} style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Sign in</button></>}>
      {error && <div className="banner banner-error mb-16">{error}</div>}
      <form onSubmit={handleReset}>
        <div className="form-group">
          <label htmlFor="reset-email">Email address</label>
          <input id="reset-email" name="email" className="form-control" type="email"
            placeholder="you@example.com" value={email}
            onChange={e => setEmail(e.target.value)} required autoFocus />
        </div>
        <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ padding: 13, fontSize: 15 }}>
          {loading ? <><span className="spin">⟳</span> Sending...</> : "Send Reset Link"}
        </button>
      </form>
    </AuthLayout>
  );
}

// ── Google Preferences Screen ─────────────────────────────────────────────────
function GooglePreferences({ navigate }) {
  const { profile, updateUserProfile } = useAuth();
  const [gender,  setGender]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(false);
  const name = profile?.displayName?.split(" ")[0] || "there";

  useEffect(() => {
    if (done) navigate("dashboard");
  }, [done, navigate]);

  async function handleSave(e) {
    e.preventDefault();
    if (!gender) { setError("Please select your gender to continue."); return; }
    setLoading(true);
    try {
      await updateUserProfile({ gender });
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthLayout title={`Welcome, ${name}! 👋`} subtitle="Just one quick thing before we get started">
      {error && <div className="banner banner-error mb-16">{error}</div>}
      <form onSubmit={handleSave}>
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
          <p className="form-hint">Used only for trainer matching. Change anytime in Account Settings.</p>
        </div>
        <div style={{ background: "var(--primary-pale)", borderRadius: "var(--radius-sm)", padding: 14, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--primary-dark)", marginBottom: 8 }}>🎉 Your free account includes:</div>
          {["2 AI meal plans per month","Access to certified trainers","Indian grocery links","Recipe instructions & tips"].map(f => (
            <div key={f} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--primary-dark)", marginBottom: 4 }}>
              <span>✓</span>{f}
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

// ── Login Page ────────────────────────────────────────────────────────────────
export function LoginPage({ navigate }) {
  const { loginWithEmail, loginWithGoogle, clearJustSignedUp } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error,    setError]    = useState("");
  const [screen,   setScreen]   = useState("login");

  if (screen === "forgot") return <ForgotPasswordScreen onBack={() => setScreen("login")} />;
  if (screen === "verify") return (
    <VerifyEmailScreen
      email={email}
      password={password}
      onBackToLogin={() => setScreen("login")}
    />
  );
  if (screen === "prefs") return <GooglePreferences navigate={navigate} />;

  async function handleEmail(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await loginWithEmail(email, password);
      clearJustSignedUp(); // ensure flag is cleared on successful login
      navigate("dashboard");
    } catch (err) {
      console.error("Login error:", err.code, err.message);
      if (err.code === "auth/email-not-verified") {
        setScreen("verify");
      } else {
        setError(friendlyError(err.code));
      }
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setGLoading(true); setError("");
    try {
      const { needsPrefs } = await loginWithGoogle();
      clearJustSignedUp();
      if (needsPrefs) {
        setScreen("prefs");
      } else {
        navigate("dashboard");
      }
    } catch (err) {
      console.error("Google login error:", err.code, err.message);
      setError(friendlyError(err.code));
    } finally { setGLoading(false); }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Mitabhukta account"
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
          <label htmlFor="login-email">Email address</label>
          <input id="login-email" name="email" className="form-control" type="email"
            placeholder="you@example.com" value={email}
            onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="form-group">
          <label htmlFor="login-password" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Password</span>
            <button type="button" onClick={() => setShowPw(p => !p)}
              style={{ background: "none", border: "none", color: "var(--primary)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              {showPw ? "Hide" : "Show"}
            </button>
          </label>
          <input id="login-password" name="password" className="form-control"
            type={showPw ? "text" : "password"} placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)}
            required autoComplete="current-password" />
          <div style={{ textAlign: "right", marginTop: 6 }}>
            <button type="button" onClick={() => setScreen("forgot")}
              style={{ background: "none", border: "none", color: "var(--primary)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              Forgot password?
            </button>
          </div>
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

// ── Signup Page ───────────────────────────────────────────────────────────────
export function SignupPage({ navigate }) {
  const { signupWithEmail, loginWithGoogle, clearJustSignedUp } = useAuth();
  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [gender,     setGender]     = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [gLoading,   setGLoading]   = useState(false);
  const [error,      setError]      = useState("");
  const [step,       setStep]       = useState(1);
  const [screen,     setScreen]     = useState("signup");
  const [savedEmail, setSavedEmail] = useState("");
  const [savedPass,  setSavedPass]  = useState("");

  if (screen === "verify") return (
    <VerifyEmailScreen
      email={savedEmail}
      password={savedPass}
      onBackToLogin={() => {
        clearJustSignedUp(); // clear flag → App.jsx will redirect properly
        navigate("login");
      }}
    />
  );
  if (screen === "prefs") return <GooglePreferences navigate={navigate} />;

  function getStrength(pw) {
    if (!pw) return { score: 0, label: "", color: "var(--border)" };
    let score = 0;
    if (pw.length >= 6)          score++;
    if (pw.length >= 10)         score++;
    if (/[A-Z]/.test(pw))        score++;
    if (/[0-9]/.test(pw))        score++;
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
      trackSignup("email");
      setSavedEmail(email);
      setSavedPass(password);
      setScreen("verify"); // show verify screen — user is still logged in
    } catch (err) {
      console.error("Signup error:", err.code, err.message);
      setError(friendlyError(err.code));
      setStep(1);
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setGLoading(true); setError("");
    try {
      await loginWithGoogle();
      trackSignup("google");
      setScreen("prefs");
    } catch (err) {
      console.error("Google signup error:", err.code, err.message);
      setError(friendlyError(err.code));
    } finally { setGLoading(false); }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Your wellness journey starts here — free forever"
      footer={<>Already have an account? <button onClick={() => navigate("login")} style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Sign in</button></>}>
      {error && <div className="banner banner-error mb-16">{error}</div>}

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
              <label htmlFor="signup-name">Full Name</label>
              <input id="signup-name" name="name" className="form-control" type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="signup-email">Email address</label>
              <input id="signup-email" name="email" className="form-control" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label htmlFor="signup-password" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Password</span>
                {password && <span style={{ fontSize: 12, fontWeight: 600, color: strength.color }}>{strength.label}</span>}
              </label>
              <div style={{ position: "relative" }}>
                <input id="signup-password" name="password" className="form-control" type={showPw ? "text" : "password"} placeholder="Min. 6 characters"
                  value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" style={{ paddingRight: 48 }} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 12 }}>
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
              {password && (
                <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                  {[1,2,3,4,5].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength.score ? strength.color : "var(--border)", transition: "var(--transition)" }} />)}
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="signup-confirm">Confirm Password</label>
              <input id="signup-confirm" name="confirm" className="form-control" type={showPw ? "text" : "password"} placeholder="Repeat password"
                value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password" />
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
            <p className="form-hint">Used only for trainer matching. Change anytime in Account Settings.</p>
          </div>
          <div style={{ background: "var(--primary-pale)", borderRadius: "var(--radius-sm)", padding: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--primary-dark)", marginBottom: 8 }}>🎉 Your free account includes:</div>
            {["2 AI meal plans per month","Access to certified trainers","Indian grocery links","Recipe instructions & tips"].map(f => (
              <div key={f} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--primary-dark)", marginBottom: 4 }}><span>✓</span>{f}</div>
            ))}
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading || !gender} style={{ padding: 13, fontSize: 15, marginBottom: 10 }}>
            {loading ? <><span className="spin">⟳</span> Creating account...</> : "Create My Account 🚀"}
          </button>
          <button type="button" className="btn btn-ghost btn-full btn-sm" onClick={() => { setStep(1); setError(""); }}>← Back</button>
          <p style={{ fontSize: 11, color: "var(--text-4)", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
            By creating an account, you agree to our{" "}
            <button type="button" onClick={() => navigate("terms")} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 11 }}>Terms of Service</button>{" "}and{" "}
            <button type="button" onClick={() => navigate("privacy")} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 11 }}>Privacy Policy</button>.
          </p>
        </form>
      )}
    </AuthLayout>
  );
}

// ── Navbar dropdown ───────────────────────────────────────────────────────────
export function NavbarDropdown({ profile, user, role, navigate, logout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = (profile?.displayName || profile?.name || user?.email || "U")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const items = role === "admin"
    ? [
        { label: "Dashboard",         id: "dashboard" },
        { label: "⚙️ Admin Panel",     id: "admin" },
        { label: "🍳 Leftover Chef",   id: "leftover-chef" },
        { label: "🔥 Calorie Tracker", id: "calories" },
        { label: "🎯 Goal Tracker",    id: "goals" },
        { label: "🚀 Early Access",    id: "early-access" },
        { label: "Account",            id: "account" },
        { label: "Guidelines",         id: "guidelines" },
      ]
    : [
        { label: "Dashboard",          id: "dashboard" },
        { label: "Meal Planner",       id: "planner" },
        { label: "My Plans",           id: "my-plans" },
        { label: "🍳 Leftover Chef",   id: "leftover-chef" },
        { label: "Trainers",           id: "trainers" },
        { label: "My Bookings",        id: "my-bookings" },
        { label: "🔥 Calorie Tracker", id: "calories" },
        { label: "🎯 Goal Tracker",    id: "goals" },
        { label: "🎁 Refer & Earn",    id: "referral" },
        { label: "🚀 Early Access",    id: "early-access" },
        { label: "Account",            id: "account" },
        { label: "Subscription",       id: "subscription" },
        { label: "Guidelines",         id: "guidelines" },
        { label: "🔒 Privacy Policy",  id: "privacy" },
      ];

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <div onClick={() => setMenuOpen(o => !o)}
        style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, cursor: "pointer", border: "2px solid var(--primary-soft)" }}>
        {profile?.photoURL
          ? <img src={profile.photoURL} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          : initials}
      </div>
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)}
          style={{ position: "absolute", top: 46, right: 0, background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "8px", boxShadow: "var(--shadow-lg)", minWidth: 230, zIndex: 300, animation: "slideDown 0.2s ease forwards" }}>
          <div style={{ padding: "10px 14px 12px", borderBottom: "1px solid var(--border)", marginBottom: 6 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{profile?.displayName || profile?.name || "User"}</div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>{user?.email || profile?.email}</div>
            {role === "admin" && <div style={{ fontSize: 11, color: "#991b1b", fontWeight: 700, marginTop: 2 }}>Administrator</div>}
          </div>
          {items.map(item => (
            <button key={item.id}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-xs)", fontSize: 14, color: "var(--text-2)", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontFamily: "var(--font-body)", display: "block" }}
              onClick={() => navigate(item.id)}
              onMouseEnter={e => e.target.style.background = "var(--bg-muted)"}
              onMouseLeave={e => e.target.style.background = "none"}>
              {item.label}
            </button>
          ))}
          <div style={{ borderTop: "1px solid var(--border)", marginTop: 6, paddingTop: 6 }}>
            <button
              style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-xs)", fontSize: 14, color: "var(--red-500)", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontFamily: "var(--font-body)" }}
              onClick={logout}
              onMouseEnter={e => e.target.style.background = "#fff5f5"}
              onMouseLeave={e => e.target.style.background = "none"}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
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
    "auth/user-not-found":          "No account found with this email.",
    "auth/wrong-password":          "Incorrect password. Please try again.",
    "auth/email-already-in-use":    "An account with this email already exists.",
    "auth/weak-password":           "Password should be at least 6 characters.",
    "auth/invalid-email":           "Please enter a valid email address.",
    "auth/too-many-requests":       "Too many attempts. Please wait a moment and try again.",
    "auth/popup-closed-by-user":    "Sign-in popup was closed. Please try again.",
    "auth/cancelled-popup-request": "Sign-in was cancelled. Please try again.",
    "auth/popup-blocked":           "Popup blocked. Please allow popups for mitabhukta.com.",
    "auth/network-request-failed":  "Network error. Please check your connection.",
    "auth/invalid-credential":      "Invalid email or password. Please try again.",
    "auth/email-not-verified":      "Please verify your email before signing in.",
    "auth/unauthorized-continue-uri": "Configuration error. Please try again.",
    "auth/account-exists-with-different-credential": "An account already exists with this email. Try signing in with email and password.",
  };
  return map[code] || "Something went wrong. Please try again.";
}