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
    { icon: "🍛", label: "Generate Meal Plan",   desc: "Create a new AI-powered plan",     id: "planner",      color: "#f0fdf4", border: "#bbf7d0" },
    { icon: "📋", label: "My Saved Plans",        desc: "View your meal plan history",       id: "my-plans",     color: "#eff6ff", border: "#bfdbfe" },
    { icon: "💳", label: "Manage Subscription",   desc: "Upgrade or change your plan",       id: "subscription", color: "#fdf4ff", border: "#e9d5ff" },
    { icon: "👤", label: "Account Settings",       desc: "Update your profile and preferences", id: "account",   color: "#fffbeb", border: "#fde68a" },
  ];

  const tierInfo = TIERS[plan.id];

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
            { label: "Plan Duration",     value: `${plan.planDays} days` },
            { label: "Plans Per Month",   value: plan.plansPerMonth >= 999 ? "Unlimited" : plan.plansPerMonth },
            { label: "Shopping List",     value: plan.shoppingList ? "✅ Included" : "🔒 Upgrade" },
            { label: "Nutrition Analysis",value: plan.nutritionAnalysis ? "✅ Included" : "🔒 Upgrade" },
            { label: "Family Profiles",   value: plan.familyProfiles === 1 ? "1 profile" : `Up to ${plan.familyProfiles}` },
            { label: "Age Groups",        value: plan.ageGroups.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(", ") },
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
