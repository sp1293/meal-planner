import { useState, useEffect } from "react";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useSub } from "../context/SubContext";
import { TIERS } from "../config";

export default function Dashboard({ navigate }) {
  const { profile } = useAuth();
  const { plan } = useSub();
  const [featuredTrainers, setFeaturedTrainers] = useState([]);

  const name         = profile?.displayName?.split(" ")[0] || "there";
  const plansUsed    = profile?.plansUsed || 0;
  const plansLeft    = plan.plansPerMonth >= 999 ? "∞" : Math.max(0, plan.plansPerMonth - plansUsed);
  const usagePercent = plan.plansPerMonth >= 999 ? 0 : Math.min(100, (plansUsed / plan.plansPerMonth) * 100);
  const tierInfo     = TIERS[plan.id];

  const STORAGE_KEY = `mitabhukta_bookings_${profile?.uid || "guest"}`;
  let upcomingBookings = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    upcomingBookings = saved ? JSON.parse(saved).slice(0, 3) : [];
  } catch {}

  useEffect(() => {
    async function loadFeaturedTrainers() {
      try {
        const snap = await getDocs(
          query(collection(db, "trainers"), where("status", "!=", "suspended"), limit(4))
        );
        setFeaturedTrainers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch {
        setFeaturedTrainers([]);
      }
    }
    loadFeaturedTrainers();
  }, []);

  function getTypeIcon(type) {
    const icons = { "Yoga Instructor": "🧘", "Gym Trainer": "🏋️", "Nutritionist": "🥗", "Physiotherapist": "🩺" };
    return icons[type] || "💪";
  }

  const quickActions = [
    { icon: "🍛", label: "Meal Planner",    id: "planner",      color: "#f0fdf4", border: "#bbf7d0" },
    { icon: "📋", label: "My Plans",        id: "my-plans",     color: "#eff6ff", border: "#bfdbfe" },
    { icon: "💳", label: "Subscription",    id: "subscription", color: "#fdf4ff", border: "#e9d5ff" },
    { icon: "👤", label: "Account",         id: "account",      color: "#fffbeb", border: "#fde68a" },
    { icon: "🔥", label: "Calorie Tracker", id: "calories",     color: "#fff1f2", border: "#fecdd3" },
    { icon: "🎯", label: "Goal Tracker",    id: "goals",        color: "#f0fdfa", border: "#99f6e4" },
  ];

  return (
    <div className="page" style={{ paddingTop: 24, paddingBottom: 24 }}>

      {/* Header — compact */}
      <div style={{ marginBottom: 20 }} className="anim-fade-up">
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px, 3vw, 28px)", color: "var(--primary-dark)", marginBottom: 2 }}>
          Good {getTimeOfDay()}, {name}! 👋
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-3)" }}>Here's your Mitabhukta overview.</p>
      </div>

      {/* Stats — compact row */}
      <div className="grid-4 anim-fade-up-2" style={{ marginBottom: 16 }}>
        {[
          { label: "Current Plan",     value: plan.name,   sub: `${plan.priceLabel}${plan.period}`, subColor: tierInfo.color },
          { label: "Plans Used",       value: plansUsed,   sub: plan.plansPerMonth >= 999 ? "Unlimited" : `of ${plan.plansPerMonth}/mo` },
          { label: "Plans Remaining",  value: plansLeft,   sub: plan.plansPerMonth >= 999 ? "No limit" : "this month" },
          { label: "Sessions Booked",  value: upcomingBookings.length, sub: "trainer sessions" },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: "14px 16px" }}>
            <div className="label" style={{ fontSize: 11 }}>{s.label}</div>
            <div className="value" style={{ fontSize: 22 }}>{s.value}</div>
            <div className="sub" style={{ fontSize: 11, color: s.subColor || undefined, fontWeight: s.subColor ? 600 : undefined }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Usage bar — compact */}
      {plan.plansPerMonth < 999 && (
        <div className="card anim-fade-up-2" style={{ marginBottom: 16, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
            <span style={{ fontWeight: 600, color: "var(--text-3)" }}>Monthly Usage</span>
            <span style={{ color: "var(--text-3)" }}>{plansUsed} / {plan.plansPerMonth} plans</span>
          </div>
          <div style={{ height: 6, background: "var(--border)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${usagePercent}%`, background: usagePercent > 80 ? "var(--red-500)" : "var(--primary)", borderRadius: "var(--radius-full)", transition: "width 0.6s ease" }} />
          </div>
          {usagePercent > 80 && (
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--red-500)", fontWeight: 500 }}>
              ⚠️ Running low!{" "}
              <button onClick={() => navigate("subscription")} style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                Upgrade →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upcoming sessions — compact */}
      {upcomingBookings.length > 0 && (
        <div style={{ marginBottom: 16 }} className="anim-fade-up-2">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--primary-dark)", margin: 0 }}>📅 Upcoming Sessions</h2>
            <button onClick={() => navigate("my-bookings")} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View all →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcomingBookings.map(b => (
              <div key={b.id}
                style={{ background: "#fff", border: "1.5px solid var(--primary-soft)", borderRadius: "var(--radius-md)", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, cursor: "pointer" }}
                onClick={() => navigate("my-bookings")}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow-md)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: b.trainerGender === "Female" ? "#fce4ec" : "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {b.trainerIcon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{b.trainerName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>📅 {b.dateLabel} · ⏰ {b.time}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 11, background: "#dcfce7", color: "#14532d", padding: "3px 10px", borderRadius: "var(--radius-full)", fontWeight: 700 }}>✅ {b.status}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary-dark)" }}>₹{b.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions — compact 6-grid */}
      <div style={{ marginBottom: 16 }} className="anim-fade-up-3">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--primary-dark)", marginBottom: 10 }}>Quick Actions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          {quickActions.map(a => (
            <div key={a.id} onClick={() => navigate(a.id)}
              style={{ background: a.color, border: `1.5px solid ${a.border}`, borderRadius: "var(--radius-md)", padding: "14px 10px", cursor: "pointer", transition: "var(--transition)", textAlign: "center" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{a.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text)", lineHeight: 1.3 }}>{a.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Trainers — compact horizontal scroll */}
      {featuredTrainers.length > 0 && (
        <div style={{ marginBottom: 16 }} className="anim-fade-up-4">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--primary-dark)", margin: 0 }}>💪 Featured Trainers</h2>
            <button onClick={() => navigate("trainers")} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View all →</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {featuredTrainers.map(trainer => (
              <div key={trainer.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: trainer.gender === "Female" ? "#fce4ec" : "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {trainer.typeIcon || getTypeIcon(trainer.type)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{trainer.name}</div>
                    <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 600 }}>{trainer.speciality}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 2 }}>⭐ {trainer.rating || "New"} · {trainer.experience} yrs · ₹{trainer.pricePerHour}/hr</div>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <button style={{ flex: 1, padding: "6px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-xs)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}
                    onClick={() => navigate("trainers")}>Profile</button>
                  <button style={{ flex: 1, padding: "6px", background: "#fff", color: "var(--primary)", border: "1.5px solid var(--primary)", borderRadius: "var(--radius-xs)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}
                    onClick={() => navigate("my-bookings")}>Book</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan features — compact */}
      <div className="card anim-fade-up-4" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "var(--primary-dark)", margin: 0 }}>Your {plan.name} Plan</h3>
          {plan.id !== "family" && (
            <button className="btn btn-secondary btn-sm" style={{ fontSize: 12, padding: "5px 12px" }} onClick={() => navigate("subscription")}>Upgrade</button>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          {[
            { label: "Plan Duration",      value: `${plan.planDays} days` },
            { label: "Plans Per Month",    value: plan.plansPerMonth >= 999 ? "Unlimited" : plan.plansPerMonth },
            { label: "Shopping List",      value: plan.shoppingList ? "✅" : "🔒 Upgrade" },
            { label: "Nutrition Analysis", value: plan.nutritionAnalysis ? "✅" : "🔒 Upgrade" },
            { label: "Family Profiles",    value: plan.familyProfiles === 1 ? "1 profile" : `Up to ${plan.familyProfiles}` },
            { label: "Age Groups",         value: plan.ageGroups.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(", ") },
          ].map(f => (
            <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
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