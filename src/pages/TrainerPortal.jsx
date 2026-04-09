import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from "firebase/firestore";
import { db } from "../firebase";

export default function TrainerPortal({ navigate }) {
  const { profile, logout } = useAuth();
  const [sessions,  setSessions]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [error,     setError]     = useState("");

  // ── Only trainers can access ───────────────────────────────────────────────
  if (profile?.role !== "trainer") {
    return (
      <div className="page text-center" style={{ paddingTop: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--primary-dark)", marginBottom: 10 }}>Access Denied</h2>
        <p style={{ color: "var(--text-3)", marginBottom: 24 }}>This portal is for trainers only.</p>
        <button className="btn btn-primary" onClick={() => navigate("dashboard")}>Go to Dashboard</button>
      </div>
    );
  }

  useEffect(() => { loadSessions(); }, []);

  async function loadSessions() {
    setLoading(true);
    try {
      // Load all bookings where trainerId matches this trainer
      const snap = await getDocs(
        query(collection(db, "bookings"), where("trainerId", "==", profile.uid))
      );
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      // If no bookings collection yet, show empty state
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  async function markComplete(sessionId) {
    try {
      await updateDoc(doc(db, "bookings", sessionId), {
        status: "Completed",
        completedAt: new Date().toISOString(),
      });
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: "Completed" } : s));
    } catch {
      setError("Failed to update session status.");
    }
  }

  async function handleLogout() {
    await logout();
    navigate("landing");
  }

  const upcoming  = sessions.filter(s => s.status === "Confirmed" || s.status === "Rescheduled");
  const completed = sessions.filter(s => s.status === "Completed");
  const cancelled = sessions.filter(s => s.status === "Cancelled");

  const totalEarnings  = completed.reduce((sum, s) => sum + (s.price || 0), 0);
  const platformCut    = Math.round(totalEarnings * 0.20);
  const trainerPayout  = totalEarnings - platformCut;

  const tabs = [
    { id: "upcoming",  label: "Upcoming",  count: upcoming.length },
    { id: "completed", label: "Completed", count: completed.length },
    { id: "cancelled", label: "Cancelled", count: cancelled.length },
  ];

  const displaySessions = activeTab === "upcoming" ? upcoming : activeTab === "completed" ? completed : cancelled;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Trainer Navbar */}
      <nav style={{ background: "#fff", borderBottom: "1px solid var(--border)", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🥗</div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--primary-dark)" }}>NourishAI</div>
            <div style={{ fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: ".5px" }}>Trainer Portal</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{profile?.displayName || profile?.name}</div>
            <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 600 }}>{profile?.type} · {profile?.speciality}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign out</button>
        </div>
      </nav>

      <div className="page">
        <div className="page-title anim-fade-up">
          <h1>👋 Welcome, {(profile?.displayName || profile?.name || "Trainer").split(" ")[0]}!</h1>
          <p>Here's your training dashboard and upcoming schedule</p>
        </div>

        {error && <div className="banner banner-error mb-16">{error}</div>}

        {/* Trainer profile card */}
        <div className="card anim-fade-up-2" style={{ marginBottom: 24, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: profile?.gender === "Female" ? "#fce4ec" : "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, flexShrink: 0 }}>
            {profile?.type === "Yoga Instructor" ? "🧘" : "🏋️"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{profile?.displayName || profile?.name}</div>
            <div style={{ fontSize: 14, color: "var(--primary)", marginBottom: 6 }}>{profile?.type} · {profile?.speciality}</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "var(--text-3)" }}>
              <span>📍 {profile?.location}</span>
              <span>⭐ {profile?.rating || "New"}</span>
              <span>🎯 {profile?.experience} yrs exp</span>
              <span>₹{profile?.pricePerHour}/hr</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(profile?.availableDays || []).map(d => (
              <span key={d} style={{ fontSize: 11, background: "var(--primary-pale)", color: "var(--primary)", padding: "3px 10px", borderRadius: "var(--radius-full)", fontWeight: 600 }}>{d}</span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4 anim-fade-up-2" style={{ marginBottom: 28 }}>
          <div className="stat-card">
            <div className="label">Upcoming Sessions</div>
            <div className="value">{upcoming.length}</div>
            <div className="sub">to be completed</div>
          </div>
          <div className="stat-card">
            <div className="label">Completed Sessions</div>
            <div className="value">{completed.length}</div>
            <div className="sub">all time</div>
          </div>
          <div className="stat-card" style={{ background: "#f0fdf4" }}>
            <div className="label">Your Earnings</div>
            <div className="value" style={{ color: "var(--primary-dark)" }}>₹{trainerPayout.toLocaleString("en-IN")}</div>
            <div className="sub">after platform fee</div>
          </div>
          <div className="stat-card">
            <div className="label">Rating</div>
            <div className="value">{profile?.rating || "—"}</div>
            <div className="sub">{completed.length} reviews</div>
          </div>
        </div>

        {/* Earnings breakdown */}
        {completed.length > 0 && (
          <div className="card anim-fade-up-2" style={{ marginBottom: 24 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--primary-dark)", marginBottom: 16 }}>💰 Earnings Breakdown</h3>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
              <span style={{ color: "var(--text-3)" }}>Total session fees collected</span>
              <span style={{ fontWeight: 600 }}>₹{totalEarnings.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
              <span style={{ color: "var(--text-3)" }}>Platform fee (20%)</span>
              <span style={{ fontWeight: 600, color: "var(--red-500)" }}>−₹{platformCut.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 6 }}>
              <span style={{ fontWeight: 700 }}>Your payout</span>
              <span style={{ fontWeight: 700, color: "var(--primary-dark)" }}>₹{trainerPayout.toLocaleString("en-IN")}</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 8 }}>Payouts are processed within 3-5 business days after session completion.</p>
          </div>
        )}

        {/* Sessions tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: "9px 18px", borderRadius: "var(--radius-full)", border: `1.5px solid ${activeTab === tab.id ? "var(--primary)" : "var(--border)"}`, background: activeTab === tab.id ? "var(--primary)" : "#fff", color: activeTab === tab.id ? "#fff" : "var(--text-3)", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-body)", transition: "var(--transition)" }}>
              {tab.label} {tab.count > 0 && <span style={{ background: activeTab === tab.id ? "rgba(255,255,255,0.3)" : "var(--primary-pale)", color: activeTab === tab.id ? "#fff" : "var(--primary)", borderRadius: "var(--radius-full)", padding: "1px 7px", fontSize: 11, marginLeft: 4 }}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <span className="spin" style={{ fontSize: 32 }}>⟳</span>
            <p style={{ marginTop: 12, color: "var(--text-3)" }}>Loading sessions...</p>
          </div>
        ) : displaySessions.length === 0 ? (
          <div className="card text-center" style={{ padding: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>📅</div>
            <p style={{ color: "var(--text-3)", fontSize: 15 }}>No {activeTab} sessions yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {displaySessions.map(session => (
              <div key={session.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 600, fontSize: 16, color: "var(--text)" }}>👤 {session.studentName || "Student"}</div>
                      <span style={{ fontSize: 11, background: session.status === "Completed" ? "#dcfce7" : session.status === "Cancelled" ? "#fee2e2" : "#dbeafe", color: session.status === "Completed" ? "#14532d" : session.status === "Cancelled" ? "#991b1b" : "#1d4ed8", padding: "3px 10px", borderRadius: "var(--radius-full)", fontWeight: 700 }}>
                        {session.status}
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginBottom: 10 }}>
                      {[["📅 Date", session.dateLabel],["⏰ Time", session.time],["📹 Type", session.sessionType],["₹ Fee", `₹${session.price}`]].map(([label, value]) => (
                        <div key={label} style={{ fontSize: 13 }}>
                          <span style={{ color: "var(--text-3)" }}>{label}: </span>
                          <span style={{ fontWeight: 600, color: "var(--text)" }}>{value}</span>
                        </div>
                      ))}
                    </div>
                    {session.notes && (
                      <div style={{ background: "var(--bg-muted)", borderRadius: "var(--radius-sm)", padding: "10px 14px", fontSize: 13, color: "var(--text-2)", marginBottom: 8 }}>
                        <strong>📝 Student notes:</strong> {session.notes}
                      </div>
                    )}
                    {session.healthConditions && (
                      <div style={{ background: "#fff8e1", border: "1px solid #fde68a", borderRadius: "var(--radius-sm)", padding: "10px 14px", fontSize: 13, color: "#92400e" }}>
                        <strong>⚠️ Health conditions:</strong> {session.healthConditions}
                      </div>
                    )}
                  </div>
                  {session.status !== "Cancelled" && session.status !== "Completed" && (
                    <button className="btn btn-primary btn-sm" onClick={() => markComplete(session.id)}>
                      ✅ Mark Complete
                    </button>
                  )}
                  {session.status === "Completed" && session.review && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16 }}>{"⭐".repeat(session.review.rating)}</div>
                      <div style={{ fontSize: 12, color: "var(--text-3)", maxWidth: 200 }}>{session.review.comment}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Platform guidelines reminder */}
        <div className="card mt-24" style={{ background: "#fff8e1", border: "1px solid #fde68a" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "#92400e", marginBottom: 10 }}>🔒 Trainer Reminders</h3>
          {["Never request payment or contact outside NourishAI.","Mark sessions complete promptly after each session.","Maintain professional conduct at all times.","Contact support@nourishai.com for any issues."].map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#92400e", marginBottom: 6 }}><span>⚠️</span> {r}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
