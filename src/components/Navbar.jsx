import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSub } from "../context/SubContext";
import { TIERS } from "../config";

export default function Navbar({ page, navigate }) {
  const { user, profile, logout, role } = useAuth();
  const { tier } = useSub();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const plan = TIERS[tier] || TIERS.free;

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    navigate("landing");
  }

  // All nav items in ONE place — only in dropdown, no duplication
  const dropdownItems = role === "admin"
    ? [
        { label: "🏠 Dashboard",         id: "dashboard" },
        { label: "⚙️ Admin Panel",        id: "admin" },
        { label: "🍛 Meal Planner",       id: "planner" },
        { label: "📋 My Plans",           id: "my-plans" },
        { label: "💪 Trainers",           id: "trainers" },
        { label: "🍳 Leftover Chef",      id: "leftover-chef" },
        { label: "🔥 Calorie Tracker",    id: "calories" },
        { label: "🎯 Goal Tracker",       id: "goals" },
        { label: "🚀 Early Access",       id: "early-access" },
        { label: "👤 Account",            id: "account" },
        { label: "📖 Guidelines",         id: "guidelines" },
        { label: "🔒 Privacy Policy",     id: "privacy" },
      ]
    : [
        { label: "🏠 Dashboard",          id: "dashboard" },
        { label: "🍛 Meal Planner",       id: "planner" },
        { label: "📋 My Plans",           id: "my-plans" },
        { label: "🍳 Leftover Chef",      id: "leftover-chef" },
        { label: "💪 Trainers",           id: "trainers" },
        { label: "📅 My Bookings",        id: "my-bookings" },
        { label: "🔥 Calorie Tracker",    id: "calories" },
        { label: "🎯 Goal Tracker",       id: "goals" },
        { label: "🎁 Refer & Earn",       id: "referral" },
        { label: "💳 Subscription",       id: "subscription" },
        { label: "👤 Account",            id: "account" },
        { label: "📖 Guidelines",         id: "guidelines" },
        { label: "🔒 Privacy Policy",     id: "privacy" },
        { label: "🚀 Early Access",       id: "early-access" },
      ];

  const s = {
    nav:       { position: "sticky", top: 0, zIndex: 200, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)", boxShadow: "var(--shadow-xs)" },
    inner:     { maxWidth: 1120, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
    brand:     { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
    brandName: { fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--primary-dark)" },
    right:     { display: "flex", alignItems: "center", gap: 10 },
    tierBadge: { padding: "4px 12px", borderRadius: "var(--radius-full)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", background: plan.colorLight || "var(--green-100)", color: plan.color || "var(--green-800)" },
    adminBadge:{ padding: "4px 12px", borderRadius: "var(--radius-full)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", background: "#fee2e2", color: "#991b1b" },
    avatar:    { width: 36, height: 36, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, cursor: "pointer", border: "2px solid var(--primary-soft)" },
    dropdown:  { position: "absolute", top: 46, right: 0, background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "8px", boxShadow: "var(--shadow-lg)", minWidth: 230, zIndex: 300, animation: "slideDown 0.2s ease forwards", maxHeight: "80vh", overflowY: "auto" },
    dropItem:  { width: "100%", padding: "9px 14px", borderRadius: "var(--radius-xs)", fontSize: 14, color: "var(--text-2)", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontFamily: "var(--font-body)", display: "block", transition: "background 0.15s" },
  };

  const initials = (profile?.displayName || profile?.name || user?.email || "U")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <nav style={s.nav}>
      <div style={s.inner}>
        {/* Brand */}
        <div style={s.brand} onClick={() => navigate(user ? "dashboard" : "landing")}>
          <img src="/logo192.png" alt="Mitabhukta" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" }} />
          <span style={s.brandName}>Mitabhukta</span>
        </div>

        {/* Right side */}
        <div style={s.right}>
          {user ? (
            <>
              {role === "admin"
                ? <span style={s.adminBadge}>Admin</span>
                : <span style={s.tierBadge}>{plan.name}</span>}

              {/* Avatar + dropdown — ALL navigation is here */}
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <div style={s.avatar} onClick={() => setMenuOpen(o => !o)}>
                  {profile?.photoURL
                    ? <img src={profile.photoURL} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                    : initials}
                </div>

                {menuOpen && (
                  <div style={s.dropdown} onClick={() => setMenuOpen(false)}>
                    {/* User info header */}
                    <div style={{ padding: "10px 14px 12px", borderBottom: "1px solid var(--border)", marginBottom: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{profile?.displayName || profile?.name || "User"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-3)" }}>{user?.email || profile?.email}</div>
                      {role === "admin" && <div style={{ fontSize: 11, color: "#991b1b", fontWeight: 700, marginTop: 2 }}>Administrator</div>}
                    </div>

                    {/* Nav items */}
                    {dropdownItems.map(item => (
                      <button
                        key={item.id}
                        style={{
                          ...s.dropItem,
                          background: page === item.id ? "var(--primary-pale)" : "none",
                          color: page === item.id ? "var(--primary)" : "var(--text-2)",
                          fontWeight: page === item.id ? 600 : 400,
                        }}
                        onClick={() => navigate(item.id)}
                        onMouseEnter={e => { if (page !== item.id) e.target.style.background = "var(--bg-muted)"; }}
                        onMouseLeave={e => { if (page !== item.id) e.target.style.background = "none"; }}>
                        {item.label}
                      </button>
                    ))}

                    {/* Sign out */}
                    <div style={{ borderTop: "1px solid var(--border)", marginTop: 6, paddingTop: 6 }}>
                      <button
                        style={{ ...s.dropItem, color: "var(--red-500)" }}
                        onClick={handleLogout}
                        onMouseEnter={e => e.target.style.background = "#fff5f5"}
                        onMouseLeave={e => e.target.style.background = "none"}>
                        🚪 Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate("login")}>Sign in</button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate("signup")}>Get started</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}