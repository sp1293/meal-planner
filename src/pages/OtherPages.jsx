import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { db, auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useSub } from "../context/SubContext";
import { TIERS, AGE_GROUPS } from "../config";
import { PricingCard } from "../components";

/* ─── My Plans Page ──────────────────────────────────────────────────────────── */
export function MyPlansPage({ navigate }) {
  const { profile } = useAuth();
  const [viewPlan, setViewPlan] = useState(null);
  const [activeDay, setActiveDay] = useState("");

  const plans = profile?.savedPlans || [];

  if (viewPlan) {
    const currentDay = viewPlan.plan.days?.find(d => d.day === activeDay) || viewPlan.plan.days?.[0];
    return (
      <div className="page">
        <button className="btn btn-ghost btn-sm mb-24" onClick={() => setViewPlan(null)}>← Back to My Plans</button>
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary-dark)", marginBottom: 6 }}>{viewPlan.name}</h2>
          <p style={{ fontSize: 14, color: "var(--text-3)" }}>{viewPlan.summary}</p>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {viewPlan.plan.days?.map(d => (
            <button key={d.day} onClick={() => setActiveDay(d.day)}
              style={{ padding: "8px 16px", borderRadius: "var(--radius-full)", border: "1.5px solid", borderColor: (activeDay || viewPlan.plan.days[0]?.day) === d.day ? "var(--primary)" : "var(--border)", background: (activeDay || viewPlan.plan.days[0]?.day) === d.day ? "var(--primary)" : "#fff", color: (activeDay || viewPlan.plan.days[0]?.day) === d.day ? "#fff" : "var(--text-3)", fontSize: 14, cursor: "pointer" }}>
              {d.day.slice(0,3)}
            </button>
          ))}
        </div>
        {currentDay && (
          <div className="grid-auto">
            {Object.entries(currentDay.meals).map(([type, meal]) => (
              <div key={type} style={{ background: "#f9f9f9", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--primary)", marginBottom: 6 }}>{type}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{meal.name}</div>
                <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 10 }}>{meal.description}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 12, background: "#fff", border: "1px solid var(--border)", padding: "3px 10px", borderRadius: "var(--radius-full)" }}>🔥 {meal.calories} kcal</span>
                  <span style={{ fontSize: 12, background: "#fff", border: "1px solid var(--border)", padding: "3px 10px", borderRadius: "var(--radius-full)" }}>⏱ {meal.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-title anim-fade-up">
        <h1>📋 My Saved Plans</h1>
        <p>All your generated meal plans saved in one place</p>
      </div>
      {plans.length === 0 ? (
        <div className="card text-center" style={{ padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary-dark)", marginBottom: 10 }}>No saved plans yet</h3>
          <p style={{ color: "var(--text-3)", marginBottom: 24 }}>Generate your first meal plan and save it to see it here.</p>
          <button className="btn btn-primary" onClick={() => navigate("planner")}>Generate a Meal Plan →</button>
        </div>
      ) : (
        <div className="grid-3 anim-fade-up">
          {[...plans].reverse().map(p => (
            <div key={p.id} className="card card-hover" style={{ cursor: "pointer" }} onClick={() => { setViewPlan(p); setActiveDay(p.plan.days?.[0]?.day || ""); }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--primary)" }}>
                  {AGE_GROUPS[p.ageGroup]?.icon} {AGE_GROUPS[p.ageGroup]?.label || p.ageGroup}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-4)" }}>{new Date(p.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, color: "var(--text)", marginBottom: 8, lineHeight: 1.3 }}>{p.name}</h3>
              <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6, marginBottom: 14 }}>{p.summary}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <span className="badge badge-green">{p.days} days</span>
                <span className="badge badge-gray">View plan →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Account Page ───────────────────────────────────────────────────────────── */
export function AccountPage() {
  const { user, profile, updateUserProfile } = useAuth();
  const [name, setName]       = useState(profile?.displayName || "");
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");
  const [pwSection, setPwSection] = useState(false);
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw]     = useState("");
  const [pwMsg, setPwMsg]     = useState("");

  async function saveName(e) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      await updateUserProfile({ displayName: name });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch { setError("Failed to update name."); }
    finally { setSaving(false); }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (newPw.length < 6) { setPwMsg("Password must be at least 6 characters."); return; }
    try {
      const cred = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPw);
      setPwMsg("✅ Password updated successfully!");
      setCurrent(""); setNewPw("");
    } catch (err) {
      setPwMsg(err.code === "auth/wrong-password" ? "❌ Current password is incorrect." : "❌ Failed to update password.");
    }
  }

  return (
    <div className="page-md" style={{ margin: "0 auto", padding: "48px 24px" }}>
      <div className="page-title anim-fade-up">
        <h1>👤 Account Settings</h1>
        <p>Manage your profile and security settings</p>
      </div>

      {/* Profile */}
      <div className="card anim-fade-up-2" style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)", marginBottom: 20 }}>Profile Information</h2>
        {error && <div className="banner banner-error mb-16">{error}</div>}
        {saved && <div className="banner banner-success mb-16">✅ Profile updated successfully!</div>}
        <form onSubmit={saveName}>
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-control" type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input className="form-control" type="email" value={user?.email || ""} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
            <p className="form-hint">Email cannot be changed.</p>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="spin">⟳</span> Saving...</> : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="card anim-fade-up-3" style={{ marginBottom: 20 }}>
        <div className="flex-between" style={{ marginBottom: pwSection ? 20 : 0 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)" }}>Security</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => setPwSection(s => !s)}>
            {pwSection ? "Cancel" : "Change Password"}
          </button>
        </div>
        {pwSection && (
          <form onSubmit={changePassword}>
            {pwMsg && <div className={`banner ${pwMsg.startsWith("✅") ? "banner-success" : "banner-error"} mb-16`}>{pwMsg}</div>}
            <div className="form-group">
              <label>Current Password</label>
              <input className="form-control" type="password" value={current} onChange={e => setCurrent(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input className="form-control" type="password" placeholder="Min. 6 characters" value={newPw} onChange={e => setNewPw(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary">Update Password</button>
          </form>
        )}
      </div>

      {/* Account info */}
      <div className="card anim-fade-up-4">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)", marginBottom: 16 }}>Account Details</h2>
        {[
          { label: "User ID",        value: user?.uid?.slice(0, 16) + "..." },
          { label: "Auth Provider",  value: user?.providerData?.[0]?.providerId === "google.com" ? "Google" : "Email & Password" },
          { label: "Account Created",value: user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "—" },
          { label: "Plans Generated",value: profile?.plansUsed || 0 },
        ].map(r => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}>
            <span style={{ color: "var(--text-3)" }}>{r.label}</span>
            <span style={{ fontWeight: 600 }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Subscription Page ──────────────────────────────────────────────────────── */
export function SubscriptionPage({ navigate }) {
  const { profile, updateUserProfile } = useAuth();
  const { tier, plan } = useSub();
  const [upgrading, setUpgrading] = useState(false);
  const [msg, setMsg] = useState("");

  async function selectPlan(tierKey) {
    if (tierKey === tier) return;
    setUpgrading(true); setMsg("");
    try {
      // In production: integrate Stripe here before updating tier
      await updateUserProfile({ tier: tierKey, plansUsed: 0 });
      setMsg(`✅ Plan updated to ${TIERS[tierKey].name}! (Stripe integration required for live payments)`);
    } catch { setMsg("❌ Failed to update plan."); }
    finally { setUpgrading(false); }
  }

  return (
    <div className="page">
      <div className="page-title anim-fade-up">
        <h1>💳 Manage Subscription</h1>
        <p>Choose the plan that works best for you and your family</p>
      </div>

      {msg && <div className={`banner ${msg.startsWith("✅") ? "banner-success" : "banner-error"} mb-24`}>{msg}</div>}

      {/* Current plan summary */}
      <div className="card anim-fade-up-2" style={{ marginBottom: 36, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--text-3)", marginBottom: 4 }}>Current Plan</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: plan.color }}>{plan.name}</span>
            <span style={{ fontSize: 16, color: "var(--text-3)" }}>{plan.priceLabel}{plan.period}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 20, color: "var(--primary-dark)" }}>{profile?.plansUsed || 0}</div>
            <div style={{ color: "var(--text-3)", fontSize: 12 }}>Plans used</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 20, color: "var(--primary-dark)" }}>{plan.planDays}</div>
            <div style={{ color: "var(--text-3)", fontSize: 12 }}>Days/plan</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 20, color: "var(--primary-dark)" }}>{plan.plansPerMonth >= 999 ? "∞" : plan.plansPerMonth}</div>
            <div style={{ color: "var(--text-3)", fontSize: 12 }}>Plans/month</div>
          </div>
        </div>
      </div>

      {/* Pricing grid */}
      <div className="grid-4 anim-fade-up-3" style={{ alignItems: "start", marginBottom: 32 }}>
        {Object.keys(TIERS).map(key => (
          <div key={key} style={{ opacity: upgrading ? 0.6 : 1 }}>
            <PricingCard tierKey={key} currentTier={tier} onSelect={selectPlan} />
          </div>
        ))}
      </div>

      {/* Compare features */}
      <div className="card anim-fade-up-4">
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)", marginBottom: 20 }}>Compare All Features</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ minWidth: 600 }}>
            <thead>
              <tr>
                <th style={{ width: "35%" }}>Feature</th>
                {Object.values(TIERS).map(t => <th key={t.id} style={{ color: t.color }}>{t.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ["Plan Length",         t => `${t.planDays} days`],
                ["Plans / Month",       t => t.plansPerMonth >= 999 ? "Unlimited" : t.plansPerMonth],
                ["Shopping List",       t => t.shoppingList ? "✅" : "—"],
                ["Nutrition Analysis",  t => t.nutritionAnalysis ? "✅" : "—"],
                ["Family Profiles",     t => t.familyProfiles === 1 ? "1" : `Up to ${t.familyProfiles}`],
                ["Kids Age Group",      t => t.ageGroups.includes("kids") ? "✅" : "—"],
                ["Seniors Age Group",   t => t.ageGroups.includes("seniors") ? "✅" : "—"],
                ["Price",               t => `${t.priceLabel}${t.period}`],
              ].map(([label, fn]) => (
                <tr key={label}>
                  <td style={{ fontWeight: 500 }}>{label}</td>
                  {Object.values(TIERS).map(t => <td key={t.id}>{fn(t)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="disclaimer">
          💡 Payment processing requires Stripe integration. This prototype shows plan selection UI — connect Stripe to collect real payments. All plan changes are instant once payment is confirmed.
        </div>
      </div>
    </div>
  );
}
