import { useAuth } from "../context/AuthContext";
import { TIERS, AGE_GROUPS } from "../config";

/* ─── Footer ─────────────────────────────────────────────────────────────────── */
export function Footer({ navigate }) {
  return (
    <footer style={{ background: "var(--primary-dark)", color: "#fff", padding: "48px 24px 24px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 32, marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, marginBottom: 10 }}>🥗 NourishAI</div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>AI-powered meal planning for every age group and dietary need.</p>
          </div>
          {[
            { title: "Product", links: [["Meal Planner","planner"],["My Plans","my-plans"],["Pricing","subscription"]] },
            { title: "Account", links: [["Sign Up","signup"],["Sign In","login"],["Account Settings","account"]] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".8px", color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>{col.title}</div>
              {col.links.map(([label, id]) => (
                <button key={id} onClick={() => navigate && navigate(id)}
                  style={{ display: "block", background: "none", border: "none", color: "rgba(255,255,255,0.75)", fontSize: 14, marginBottom: 10, cursor: "pointer", padding: 0, textAlign: "left" }}>
                  {label}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>© {new Date().getFullYear()} NourishAI. All rights reserved.</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Powered by Claude Opus · Built with ❤️</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Protected Route ─────────────────────────────────────────────────────────── */
export function ProtectedRoute({ children, navigate }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullPage />;
  if (!user) {
    setTimeout(() => navigate("login"), 0);
    return <LoadingSpinner fullPage />;
  }
  return children;
}

/* ─── Loading Spinner ─────────────────────────────────────────────────────────── */
export function LoadingSpinner({ fullPage, size = 40, message = "" }) {
  const wrap = fullPage ? {
    position: "fixed", inset: 0, background: "rgba(255,255,255,0.9)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, zIndex: 999,
  } : { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 40 };

  return (
    <div style={wrap}>
      <div style={{ width: size, height: size, border: `3px solid var(--border)`, borderTop: `3px solid var(--primary)`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      {message && <p style={{ fontSize: 14, color: "var(--text-3)" }}>{message}</p>}
    </div>
  );
}

/* ─── Age Group Selector ──────────────────────────────────────────────────────── */
export function AgeGroupSelector({ selected, onChange, allowedGroups = Object.keys(AGE_GROUPS) }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 10 }}>Age Group</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
        {Object.values(AGE_GROUPS).map(g => {
          const allowed = allowedGroups.includes(g.id);
          const isSelected = selected === g.id;
          return (
            <button key={g.id}
              onClick={() => allowed && onChange(g.id)}
              disabled={!allowed}
              style={{
                padding: "12px 10px", borderRadius: "var(--radius-sm)",
                border: `2px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                background: isSelected ? "var(--primary-pale)" : (allowed ? "#fff" : "var(--bg-muted)"),
                color: isSelected ? "var(--primary-dark)" : (allowed ? "var(--text-2)" : "var(--text-4)"),
                cursor: allowed ? "pointer" : "not-allowed",
                transition: "var(--transition)", textAlign: "center",
                opacity: allowed ? 1 : 0.5,
              }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{g.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{g.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{g.range}</div>
              {!allowed && <div style={{ fontSize: 10, color: "var(--amber-500)", marginTop: 4, fontWeight: 600 }}>🔒 Upgrade</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Meal Card ───────────────────────────────────────────────────────────────── */
export function MealCard({ type, meal }) {
  const colors = {
    breakfast: { bg: "#fffbeb", border: "#fde68a", tag: "#d97706" },
    lunch:     { bg: "#f0fdf4", border: "#bbf7d0", tag: "#15803d" },
    dinner:    { bg: "#eff6ff", border: "#bfdbfe", tag: "#1d4ed8" },
    snack:     { bg: "#fdf4ff", border: "#e9d5ff", tag: "#7c3aed" },
  };
  const c = colors[type] || colors.snack;

  return (
    <div style={{
      background: c.bg, border: `1.5px solid ${c.border}`,
      borderRadius: "var(--radius-md)", padding: 20,
      transition: "var(--transition)",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: c.tag, marginBottom: 8 }}>{type}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "var(--text)", marginBottom: 6, lineHeight: 1.3 }}>{meal.name}</div>
      <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6, marginBottom: 12 }}>{meal.description}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.07)", padding: "3px 10px", borderRadius: "var(--radius-full)", fontSize: 12, color: "var(--text-2)" }}>🔥 {meal.calories} kcal</span>
        <span style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.07)", padding: "3px 10px", borderRadius: "var(--radius-full)", fontSize: 12, color: "var(--text-2)" }}>⏱ {meal.time}</span>
        {meal.difficulty && <span style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.07)", padding: "3px 10px", borderRadius: "var(--radius-full)", fontSize: 12, color: "var(--text-2)" }}>👨‍🍳 {meal.difficulty}</span>}
      </div>
    </div>
  );
}

/* ─── Pricing Card ────────────────────────────────────────────────────────────── */
export function PricingCard({ tierKey, currentTier, onSelect }) {
  const plan = TIERS[tierKey];
  const isCurrent = currentTier === tierKey;
  const isPopular = plan.popular;

  return (
    <div style={{
      background: "#fff",
      border: `2px solid ${isCurrent ? plan.color : isPopular ? plan.color : "var(--border)"}`,
      borderRadius: "var(--radius-lg)", padding: "28px 24px",
      position: "relative", overflow: "hidden",
      boxShadow: isPopular ? "var(--shadow-lg)" : "var(--shadow-xs)",
      transform: isPopular ? "scale(1.03)" : "scale(1)",
      transition: "var(--transition)",
    }}>
      {isPopular && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: plan.color }} />
      )}
      {isPopular && (
        <div style={{ position: "absolute", top: 12, right: 12, background: plan.color, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: "var(--radius-full)", textTransform: "uppercase", letterSpacing: ".5px" }}>
          Most Popular
        </div>
      )}
      <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".8px", color: plan.color, marginBottom: 10 }}>{plan.name}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 700, color: "var(--text)" }}>{plan.priceLabel}</span>
        {plan.period && <span style={{ fontSize: 14, color: "var(--text-3)" }}>{plan.period}</span>}
      </div>
      <ul style={{ listStyle: "none", marginBottom: 24 }}>
        {plan.perks.map(perk => (
          <li key={perk} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: "var(--text-2)", marginBottom: 8 }}>
            <span style={{ color: plan.color, flexShrink: 0, marginTop: 1 }}>✓</span> {perk}
          </li>
        ))}
      </ul>
      <button
        onClick={() => onSelect && onSelect(tierKey)}
        style={{
          width: "100%", padding: "12px", borderRadius: "var(--radius-sm)",
          border: isCurrent ? `1.5px solid ${plan.color}` : "none",
          background: isCurrent ? "transparent" : plan.color,
          color: isCurrent ? plan.color : "#fff",
          fontSize: 14, fontWeight: 700, cursor: isCurrent ? "default" : "pointer",
          transition: "var(--transition)", fontFamily: "var(--font-body)",
        }}>
        {isCurrent ? "Current Plan ✓" : `Upgrade to ${plan.name}`}
      </button>
    </div>
  );
}
