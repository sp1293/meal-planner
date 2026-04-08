import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSub } from "../context/SubContext";
import { TIERS } from "../config";

export default function Navbar({ page, navigate }) {
  const { user, profile, logout } = useAuth();
  const { tier } = useSub();
  const [menuOpen, setMenuOpen] = useState(false);
  const plan = TIERS[tier] || TIERS.free;

  const navLinks = user
    ? [
        { id: "dashboard",   label: "Dashboard" },
        { id: "planner",     label: "Meal Planner" },
        { id: "my-plans",    label: "My Plans" },
      ]
    : [];

  async function handleLogout() {
    await logout();
    navigate("landing");
  }

  const s = {
    nav: {
      position: "sticky", top: 0, zIndex: 200,
      background: "rgba(255,255,255,0.95)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border)",
      boxShadow: "var(--shadow-xs)",
    },
    inner: {
      maxWidth: 1120, margin: "0 auto", padding: "0 24px",
      height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
    },
    brand: {
      display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
    },
    brandLogo: {
      width: 36, height: 36, borderRadius: 10,
      background: "var(--primary)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 18,
    },
    brandName: {
      fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700,
      color: "var(--primary-dark)",
    },
    links: { display: "flex", alignItems: "center", gap: 4 },
    link: {
      padding: "7px 14px", borderRadius: "var(--radius-sm)",
      fontSize: 14, fontWeight: 500, color: "var(--text-3)",
      border: "none", background: "none", transition: "var(--transition)",
    },
    linkActive: { color: "var(--primary)", background: "var(--primary-pale)", fontWeight: 600 },
    right: { display: "flex", alignItems: "center", gap: 10 },
    tierBadge: {
      padding: "4px 12px", borderRadius: "var(--radius-full)",
      fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px",
      background: plan.colorLight || "var(--green-100)",
      color: plan.color || "var(--green-800)",
    },
    avatar: {
      width: 36, height: 36, borderRadius: "50%",
      background: "var(--primary)", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, fontWeight: 700, cursor: "pointer",
      border: "2px solid var(--primary-soft)",
    },
    dropdown: {
      position: "absolute", top: 56, right: 24,
      background: "#fff", border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)", padding: "8px",
      boxShadow: "var(--shadow-lg)", minWidth: 200,
      animation: "slideDown 0.2s ease forwards",
    },
    dropItem: {
      width: "100%", padding: "10px 14px", borderRadius: "var(--radius-xs)",
      fontSize: 14, color: "var(--text-2)", background: "none", border: "none",
      textAlign: "left", transition: "var(--transition)", display: "block",
    },
  };

  const initials = (profile?.displayName || user?.email || "U")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <nav style={s.nav}>
      <div style={s.inner}>
        {/* Brand */}
        <div style={s.brand} onClick={() => navigate(user ? "dashboard" : "landing")}>
          <div style={s.brandLogo}>🥗</div>
          <span style={s.brandName}>NourishAI</span>
        </div>

        {/* Links */}
        <div style={s.links} className="hide-mobile">
          {navLinks.map(l => (
            <button key={l.id} style={{ ...s.link, ...(page === l.id ? s.linkActive : {}) }}
              onClick={() => navigate(l.id)}>
              {l.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div style={s.right}>
          {user ? (
            <>
              <span style={s.tierBadge}>{plan.name}</span>
              <div style={{ position: "relative" }}>
                <div style={s.avatar} onClick={() => setMenuOpen(o => !o)}>
                  {profile?.photoURL
                    ? <img src={profile.photoURL} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                    : initials}
                </div>
                {menuOpen && (
                  <div style={s.dropdown} onClick={() => setMenuOpen(false)}>
                    <div style={{ padding: "10px 14px 12px", borderBottom: "1px solid var(--border)", marginBottom: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{profile?.displayName || "User"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-3)" }}>{user.email}</div>
                    </div>
                    {[
                      { label: "Dashboard",     id: "dashboard" },
                      { label: "Meal Planner",  id: "planner" },
                      { label: "My Plans",      id: "my-plans" },
                      { label: "Account",       id: "account" },
                      { label: "Subscription",  id: "subscription" },
                    ].map(item => (
                      <button key={item.id} style={s.dropItem}
                        onClick={() => navigate(item.id)}
                        onMouseEnter={e => e.target.style.background = "var(--bg-muted)"}
                        onMouseLeave={e => e.target.style.background = "none"}>
                        {item.label}
                      </button>
                    ))}
                    <div style={{ borderTop: "1px solid var(--border)", marginTop: 6, paddingTop: 6 }}>
                      <button style={{ ...s.dropItem, color: "var(--red-500)" }} onClick={handleLogout}
                        onMouseEnter={e => e.target.style.background = "var(--red-50)"}
                        onMouseLeave={e => e.target.style.background = "none"}>
                        Sign out
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
