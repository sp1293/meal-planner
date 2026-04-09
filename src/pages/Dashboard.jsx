import { useAuth } from "../context/AuthContext";
import { useSub } from "../context/SubContext";
import { TIERS } from "../config";

export default function Dashboard({ navigate }) {
  const { profile } = useAuth();
  const { plan } = useSub();

  const name = profile?.displayName?.split(" ")[0] || "there";
  const plansUsed = profile?.plansUsed || 0;
  const plansLeft = plan.plansPerMonth >= 999 ? "∞" : Math.max(0, plan.plansPerMonth - plansUsed);
  const usagePercent = plan.plansPerMonth >= 999 ? 0 : Math.min(100, (plansUsed / plan.plansPerMonth) * 100);

  const quickActions = [
    { icon: "🍛", label: "Generate Meal Plan",   desc: "Create a new AI-powered plan",        id: "planner",      color: "#f0fdf4", border: "#bbf7d0" },
    { icon: "📋", label: "My Saved Plans",        desc: "View your meal plan history",          id: "my-plans",     color: "#eff6ff", border: "#bfdbfe" },
    { icon: "💳", label: "Manage Subscription",   desc: "Upgrade or change your plan",          id: "subscription", color: "#fdf4ff", border: "#e9d5ff" },
    { icon: "👤", label: "Account Settings",       desc: "Update your profile and preferences",  id: "account",      color: "#fffbeb", border: "#fde68a" },
  ];

  const tierInfo = TIERS[plan.id];

  const trainers = [
    { icon: "🧘", type: "Yoga Instructor", name: "Priya Sharma",  exp: "8 years",  speciality: "Hatha & Pranayama",     location: "Bengaluru", rating: 4.9 },
    { icon: "🏋️", type: "Gym Trainer",     name: "Rahul Verma",   exp: "6 years",  speciality: "Weight Loss & Strength", location: "Mumbai",    rating: 4.8 },
    { icon: "🧘", type: "Yoga Instructor", name: "Anita Nair",    exp: "10 years", speciality: "Therapeutic Yoga",       location: "Chennai",   rating: 4.9 },
    { icon: "🏋️", type: "Gym Trainer",     name: "Vikram Singh",  exp: "5 years",  speciality: "HIIT & Nutrition",       location: "Delhi",     rating: 4.7 },
  ];

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: 36 }} className="anim-fade-up">
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 4vw, 36px)", color: "var(--primary-dark)", marginBottom: 6 }}>
          Good {getTimeOfDay()}, {name}! 👋
        </h1>
        <p style={{ fontSize: 16, color: "var(--text-3)" }}>Here's your NourishAI overview.</p>
      </div>

      {/* Stats */}
      <div className="grid-4 anim-fade-up-2" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="label">Current Plan</div>
          <div className="value">{plan.name}</div>
          <div className="sub" style={{ color: tierInfo.color, fontWeight: 600 }}>{plan.priceLabel}{plan.period}</div>
        </div>
        <div className="stat-card">
          <div className="label">Plans Used</div>
          <div className="value">{plansUsed}</div>
          <div className="sub">{plan.plansPerMonth >= 999 ? "Unlimited" : `of ${plan.plansPerMonth} this month`}</div>
        </div>
        <div className="stat-card">
          <div className="label">Plans Remaining</div>
          <div className="value">{plansLeft}</div>
          <div className="sub">{plan.plansPerMonth >= 999 ? "No limit" : "this month"}</div>
        </div>
        <div className="stat-card">
          <div className="label">Plan Duration</div>
          <div className="value">{plan.planDays}</div>
          <div className="sub">days per plan</div>
        </div>
      </div>

      {/* Usage bar */}
      {plan.plansPerMonth < 999 && (
        <div className="card anim-fade-up-2" style={{ marginBottom: 24 }}>
          <div className="flex-between mb-8">
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-3)" }}>Monthly Usage</span>
            <span style={{ fontSize: 13, color: "var(--text-3)" }}>{plansUsed} / {plan.plansPerMonth} plans</span>
          </div>
          <div style={{ height: 8, background: "var(--border)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${usagePercent}%`, background: usagePercent > 80 ? "var(--red-500)" : "var(--primary)", borderRadius: "var(--radius-full)", transition: "width 0.6s ease" }} />
          </div>
          {usagePercent > 80 && (
            <div style={{ marginTop: 10, fontSize: 13, color: "var(--red-500)", fontWeight: 500 }}>
              ⚠️ Running low! <button onClick={() => navigate("subscription")} style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>Upgrade for unlimited plans →</button>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary-dark)", marginBottom: 16 }} className="anim-fade-up-3">Quick Actions</h2>
      <div className="grid-4 anim-fade-up-3" style={{ marginBottom: 32 }}>
        {quickActions.map(a => (
          <div key={a.id} onClick={() => navigate(a.id)}
            style={{ background: a.color, border: `1.5px solid ${a.border}`, borderRadius: "var(--radius-md)", padding: 20, cursor: "pointer", transition: "var(--transition)" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{a.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>{a.label}</div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>{a.desc}</div>
          </div>
        ))}
      </div>

      {/* ── NEW: Featured Wellness Experts ── */}
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary-dark)", marginBottom: 16 }} className="anim-fade-up-4">
        💪 Featured Wellness Experts
      </h2>
      <div className="card anim-fade-up-4" style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <p style={{ fontSize: 14, color: "var(--text-3)" }}>Connect with certified yoga instructors and gym trainers near you</p>
          <span style={{ fontSize: 11, background: "#fef3c7", color: "#92400e", padding: "4px 12px", borderRadius: "var(--radius-full)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>Coming Soon</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
          {trainers.map((trainer, i) => (
            <div key={i} style={{ background: "var(--bg-muted)", borderRadius: "var(--radius-md)", padding: 16, border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: trainer.type === "Yoga Instructor" ? "#fce4ec" : "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  {trainer.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{trainer.name}</div>
                  <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 600 }}>{trainer.type}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>🎯 {trainer.speciality}</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>📍 {trainer.location}</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 14 }}>⭐ {trainer.rating} · {trainer.exp} exp</div>
              <button style={{ width: "100%", padding: "8px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-xs)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", opacity: 0.7 }}
                onClick={() => alert("Trainer booking coming soon! 🚀")}>
                Contact Trainer
              </button>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 16px", background: "var(--primary-pale)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--primary-dark)" }}>
          🌟 Are you a yoga instructor or gym trainer? <strong>Partner with NourishAI</strong> and reach thousands of health-conscious users.{" "}
          <a href="mailto:contact@nourishai.com" style={{ color: "var(--primary)", fontWeight: 700 }}>Get in touch →</a>
        </div>
      </div>

      {/* Plan features */}
      <div className="card anim-fade-up-4">
        <div className="flex-between mb-16">
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)" }}>Your {plan.name} Plan Features</h3>
          {plan.id !== "family" && (
            <button className="btn btn-secondary btn-sm" onClick={() => navigate("subscription")}>Upgrade</button>
          )}
        </div>
        <div className="grid-2">
          {[
            { label: "Plan Duration",      value: `${plan.planDays} days` },
            { label: "Plans Per Month",    value: plan.plansPerMonth >= 999 ? "Unlimited" : plan.plansPerMonth },
            { label: "Shopping List",      value: plan.shoppingList ? "✅ Included" : "🔒 Upgrade" },
            { label: "Nutrition Analysis", value: plan.nutritionAnalysis ? "✅ Included" : "🔒 Upgrade" },
            { label: "Family Profiles",    value: plan.familyProfiles === 1 ? "1 profile" : `Up to ${plan.familyProfiles}` },
            { label: "Age Groups",         value: plan.ageGroups.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(", ") },
          ].map(f => (
            <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}>
              <span style={{ color: "var(--text-3)" }}>{f.label}</span>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>{f.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}