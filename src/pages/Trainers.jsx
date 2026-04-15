import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const GENDER_FILTER_OPTIONS = ["No preference","Female trainers only","Male trainers only"];
const TYPE_FILTER_OPTIONS   = ["All types","Yoga Instructor","Gym Trainer","Nutritionist","Physiotherapist"];

export default function Trainers({ navigate }) {
  const { profile } = useAuth();
  const [trainers,   setTrainers]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [genderPref, setGenderPref] = useState("No preference");
  const [typePref,   setTypePref]   = useState("All types");
  const [selected,   setSelected]   = useState(null);

  useEffect(() => {
    loadTrainers();
  }, []);

  async function loadTrainers() {
    setLoading(true);
    try {
      // Load only active trainers from Firestore
      const snap = await getDocs(
        query(collection(db, "trainers"), where("status", "!=", "suspended"))
      );
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTrainers(data);
    } catch (err) {
      console.error("Failed to load trainers:", err);
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  }

  const userGender = profile?.gender;

  const filtered = trainers.filter(t => {
    if (typePref !== "All types" && t.type !== typePref) return false;
    if (genderPref === "Female trainers only" && t.gender !== "Female") return false;
    if (genderPref === "Male trainers only"   && t.gender !== "Male")   return false;
    return true;
  });

  function isRecommended(trainer) {
    if (!userGender || userGender === "Prefer not to say") return false;
    return trainer.gender === userGender;
  }

  function getTypeIcon(type) {
    const icons = {
      "Yoga Instructor": "🧘",
      "Gym Trainer":     "🏋️",
      "Nutritionist":    "🥗",
      "Physiotherapist": "🩺",
    };
    return icons[type] || "💪";
  }

  return (
    <div className="page">
      <div className="page-title anim-fade-up">
        <h1>💪 Wellness Experts</h1>
        <p>Book certified yoga instructors and gym trainers. All sessions managed securely through Mitabhukta.</p>
      </div>

      {/* Trust Banner */}
      <div className="banner banner-info mb-24 anim-fade-up" style={{ alignItems: "flex-start", flexDirection: "column", gap: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>🔒 Safe & Secure Bookings</div>
        <div style={{ fontSize: 13 }}>
          All payments go through Mitabhukta. Sessions are protected by our platform guidelines.{" "}
          <button onClick={() => navigate("guidelines")} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
            Read our guidelines →
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card anim-fade-up-2" style={{ marginBottom: 24, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-3)", whiteSpace: "nowrap" }}>Type:</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {TYPE_FILTER_OPTIONS.map(opt => (
              <button key={opt} onClick={() => setTypePref(opt)}
                style={{ padding: "6px 14px", borderRadius: "var(--radius-full)", border: "1.5px solid", borderColor: typePref === opt ? "var(--primary)" : "var(--border)", background: typePref === opt ? "var(--primary)" : "#fff", color: typePref === opt ? "#fff" : "var(--text-3)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)", transition: "var(--transition)" }}>
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-3)", whiteSpace: "nowrap" }}>Preference:</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {GENDER_FILTER_OPTIONS.map(opt => (
              <button key={opt} onClick={() => setGenderPref(opt)}
                style={{ padding: "6px 14px", borderRadius: "var(--radius-full)", border: "1.5px solid", borderColor: genderPref === opt ? "var(--primary)" : "var(--border)", background: genderPref === opt ? "var(--primary)" : "#fff", color: genderPref === opt ? "#fff" : "var(--text-3)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)", transition: "var(--transition)" }}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: 48 }}>
          <span className="spin" style={{ fontSize: 32 }}>⟳</span>
          <p style={{ marginTop: 12, color: "var(--text-3)" }}>Loading trainers...</p>
        </div>
      )}

      {/* Trainer Cards */}
      {!loading && (
        <div className="grid-2 anim-fade-up-3">
          {filtered.map(trainer => (
            <div key={trainer.id} className="card card-hover" style={{ position: "relative", cursor: "pointer" }} onClick={() => setSelected(trainer)}>
              {isRecommended(trainer) && (
                <div style={{ position: "absolute", top: 14, right: 14, background: "var(--primary)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: "var(--radius-full)", textTransform: "uppercase", letterSpacing: ".5px" }}>
                  ⭐ Recommended
                </div>
              )}
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: trainer.gender === "Female" ? "#fce4ec" : "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, flexShrink: 0 }}>
                  {trainer.typeIcon || getTypeIcon(trainer.type)}
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{trainer.name}</div>
                  <div style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600, marginBottom: 4 }}>{trainer.type} · {trainer.speciality}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>⭐ {trainer.rating || "New"}</span>
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>📍 {trainer.location}</span>
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>🎯 {trainer.experience} yrs exp</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6, marginBottom: 14 }}>{trainer.bio}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {(trainer.sessionTypes || []).map(s => (
                  <span key={s} style={{ fontSize: 11, background: "var(--primary-pale)", color: "var(--primary)", padding: "3px 10px", borderRadius: "var(--radius-full)", fontWeight: 600 }}>{s}</span>
                ))}
                <span style={{ fontSize: 11, background: "#f0fdf4", color: "#15803d", padding: "3px 10px", borderRadius: "var(--radius-full)", fontWeight: 600 }}>{trainer.gender}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--primary-dark)", fontFamily: "var(--font-display)" }}>
                    ₹{trainer.pricePerHour}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-3)" }}>/hr</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-4)" }}>{trainer.totalSessions || 0}+ sessions</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); setSelected(trainer); }}>
                  View & Book
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="card text-center" style={{ padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p style={{ color: "var(--text-3)" }}>
            {trainers.length === 0
              ? "No trainers available yet. Check back soon!"
              : "No trainers match your filter. Try adjusting your preferences."}
          </p>
        </div>
      )}

      {/* Trainer Detail Modal */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 32, maxWidth: 600, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: selected.gender === "Female" ? "#fce4ec" : "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
                  {selected.typeIcon || getTypeIcon(selected.type)}
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--text)" }}>{selected.name}</div>
                  <div style={{ fontSize: 14, color: "var(--primary)", fontWeight: 600 }}>{selected.type} · {selected.speciality}</div>
                  <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 2 }}>📍 {selected.location} · {selected.gender}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--text-3)" }}>✕</button>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {[["⭐ Rating", selected.rating || "New"],[" Experience", `${selected.experience} yrs`],["💰 Price", `₹${selected.pricePerHour}/hr`],["✅ Sessions", `${selected.totalSessions || 0}+`]].map(([k,v]) => (
                <div key={k} style={{ background: "var(--primary-pale)", borderRadius: "var(--radius-sm)", padding: "8px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 600 }}>{k}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--primary-dark)" }}>{v}</div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 16 }}>{selected.bio}</p>

            {(selected.highlights || []).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>✨ Highlights</div>
                {selected.highlights.map((h, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text-2)", marginBottom: 6 }}>
                    <span style={{ color: "var(--primary)" }}>✓</span> {h}
                  </div>
                ))}
              </div>
            )}

            {(selected.availableDays || []).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>📅 Available Days</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {selected.availableDays.map(d => (
                    <span key={d} style={{ fontSize: 12, background: "var(--primary-pale)", color: "var(--primary)", padding: "4px 10px", borderRadius: "var(--radius-full)", fontWeight: 600 }}>{d}</span>
                  ))}
                </div>
              </div>
            )}

            {(selected.languages || []).length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>🌐 Languages</div>
                <div style={{ fontSize: 13, color: "var(--text-3)" }}>{selected.languages.join(", ")}</div>
              </div>
            )}

            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "var(--radius-sm)", padding: 14, marginBottom: 20, fontSize: 13, color: "#92400e" }}>
              🔒 <strong>Platform Protected:</strong> All bookings and payments are managed by Mitabhukta.
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }}
                onClick={() => { setSelected(null); navigate("my-bookings"); }}>
                Book a Session — ₹{selected.pricePerHour}/hr
              </button>
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Partner CTA */}
      <div className="card mt-24" style={{ background: "var(--primary-pale)", border: "1px solid var(--primary-soft)", textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🌟</div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)", marginBottom: 8 }}>Are you a Trainer?</h3>
        <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 20 }}>
          Join Mitabhukta as a certified trainer. Get access to students, manage your schedule, and grow your practice.
        </p>
        <a href="mailto:trainers@mitabhukta.com" className="btn btn-primary">Apply to Join as Trainer →</a>
      </div>
    </div>
  );
}