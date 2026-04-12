import { useState, useEffect } from "react";
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "../firebase";

// ── This page handles Firebase email action links ──────────────────────────
// URL format: mitabhukta.com?mode=verifyEmail&oobCode=XXX
//             mitabhukta.com?mode=resetPassword&oobCode=XXX

export default function AuthAction({ navigate }) {
  const [mode,     setMode]     = useState("");
  const [status,   setStatus]   = useState("loading"); // loading | success | error
  const [error,    setError]    = useState("");

  // Password reset fields
  const [newPw,    setNewPw]    = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [oobCode,  setOobCode]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [showPw,   setShowPw]   = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const actionMode = params.get("mode");
    const code       = params.get("oobCode");

    setMode(actionMode || "");
    setOobCode(code || "");

    if (!actionMode || !code) {
      setStatus("error");
      setError("Invalid or missing action link. Please request a new one.");
      return;
    }

    if (actionMode === "verifyEmail") {
      handleVerifyEmail(code);
    } else if (actionMode === "resetPassword") {
      // Just validate the code — show password form
      verifyPasswordResetCode(auth, code)
        .then(() => setStatus("ready"))
        .catch(() => {
          setStatus("error");
          setError("This reset link has expired or already been used. Please request a new one.");
        });
    } else {
      setStatus("error");
      setError("Unknown action. Please try again.");
    }
  }, []);

  async function handleVerifyEmail(code) {
    try {
      await applyActionCode(auth, code);
      setStatus("success");
    } catch (err) {
      console.error("Verify email error:", err.code);
      if (err.code === "auth/invalid-action-code") {
        // Code already used — email might already be verified
        setStatus("already-verified");
      } else {
        setStatus("error");
        setError("This verification link has expired or already been used. Please request a new one.");
      }
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (newPw !== confirm) { setError("Passwords do not match."); return; }
    if (newPw.length < 6)  { setError("Password must be at least 6 characters."); return; }
    setSaving(true); setError("");
    try {
      await confirmPasswordReset(auth, oobCode, newPw);
      setStatus("password-reset-success");
    } catch (err) {
      console.error("Reset password error:", err.code);
      setError("Failed to reset password. The link may have expired. Please request a new one.");
    } finally { setSaving(false); }
  }

  // ── Shared layout ──────────────────────────────────────────────────────────
  function Layout({ children }) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg)" }}>
        <div style={{ maxWidth: 460, width: "100%", textAlign: "center" }} className="anim-scale-in">
          <img src="/logo192.png" alt="Mitabhukta"
            style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 24, objectFit: "cover" }} />
          {children}
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <Layout>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--primary-dark)", marginBottom: 8 }}>
          Verifying...
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-3)" }}>Please wait a moment.</p>
      </Layout>
    );
  }

  // ── Email verified successfully ────────────────────────────────────────────
  if (status === "success" && mode === "verifyEmail") {
    return (
      <Layout>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--primary-dark)", marginBottom: 12 }}>
          Email Verified!
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 28 }}>
          Your Mitabhukta account is now active. You can sign in and start planning healthier meals!
        </p>
        <div style={{ background: "var(--primary-pale)", border: "1px solid var(--primary-soft)", borderRadius: "var(--radius-md)", padding: 20, marginBottom: 28, textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary-dark)", marginBottom: 10 }}>🎉 Your free account includes:</div>
          {["2 AI meal plans per month","Access to certified trainers","Indian grocery links","Leftover Chef recipes"].map(f => (
            <div key={f} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--primary-dark)", marginBottom: 6 }}>
              <span style={{ color: "var(--primary)" }}>✓</span> {f}
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-lg btn-full" onClick={() => navigate("login")}
          style={{ marginBottom: 12 }}>
          Sign In Now →
        </button>
        <button className="btn btn-ghost btn-full btn-sm" onClick={() => navigate("landing")}>
          Go to Home
        </button>
      </Layout>
    );
  }

  // ── Already verified ───────────────────────────────────────────────────────
  if (status === "already-verified") {
    return (
      <Layout>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--primary-dark)", marginBottom: 12 }}>
          Already Verified!
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 28 }}>
          Your email is already verified. Just sign in to access your account.
        </p>
        <button className="btn btn-primary btn-lg btn-full" onClick={() => navigate("login")}>
          Sign In →
        </button>
      </Layout>
    );
  }

  // ── Password reset form ────────────────────────────────────────────────────
  if (status === "ready" && mode === "resetPassword") {
    return (
      <Layout>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--primary-dark)", marginBottom: 8 }}>
          Set New Password
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 28 }}>
          Choose a strong password for your Mitabhukta account.
        </p>
        <div className="card" style={{ padding: 28, textAlign: "left" }}>
          {error && <div className="banner banner-error mb-16">{error}</div>}
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label htmlFor="new-password" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>New Password</span>
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ background: "none", border: "none", color: "var(--primary)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                  {showPw ? "Hide" : "Show"}
                </button>
              </label>
              <input
                id="new-password"
                name="new-password"
                className="form-control"
                type={showPw ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                required
                autoFocus
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <input
                id="confirm-password"
                name="confirm-password"
                className="form-control"
                type={showPw ? "text" : "password"}
                placeholder="Repeat new password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
              {confirm && newPw !== confirm && <p className="form-error">Passwords do not match</p>}
              {confirm && newPw === confirm && <p style={{ fontSize: 12, color: "var(--primary)", marginTop: 5 }}>✓ Passwords match</p>}
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={saving || newPw.length < 6}
              style={{ padding: 13, fontSize: 15 }}>
              {saving ? <><span className="spin">⟳</span> Saving...</> : "Set New Password"}
            </button>
          </form>
        </div>
      </Layout>
    );
  }

  // ── Password reset success ─────────────────────────────────────────────────
  if (status === "password-reset-success") {
    return (
      <Layout>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔑</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--primary-dark)", marginBottom: 12 }}>
          Password Updated!
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 28 }}>
          Your password has been successfully reset. You can now sign in with your new password.
        </p>
        <button className="btn btn-primary btn-lg btn-full" onClick={() => navigate("login")}>
          Sign In Now →
        </button>
      </Layout>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--primary-dark)", marginBottom: 12 }}>
        Link Expired
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 24 }}>
        {error || "This link has expired or already been used."}
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={() => navigate("login")}>
          Sign In
        </button>
        <button className="btn btn-ghost" onClick={() => navigate("signup")}>
          Sign Up
        </button>
      </div>
    </Layout>
  );
}
