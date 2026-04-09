import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

function sanitize(str) {
  return String(str).replace(/[<>"'`]/g, "").trim();
}

const SPECIALITIES = [
  "Hatha Yoga", "Vinyasa Yoga", "Prenatal Yoga", "Therapeutic Yoga",
  "Power Yoga", "HIIT", "Weight Training", "Cardio", "CrossFit",
  "Zumba", "Pilates", "Nutrition Coaching", "Personal Training",
];

export default function AdminPanel({ navigate }) {
  const { profile } = useAuth();
  const [trainers,      setTrainers]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [creating,      setCreating]      = useState(false);
  const [showForm,      setShowForm]      = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({
    name: "", email: "", password: "", type: "Yoga Instructor",
    speciality: "Hatha Yoga", location: "Bengaluru",
    experience: "", pricePerHour: "", gender: "Female",
    bio: "", languages: "English, Kannada",
    availableDays: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  });

  const DAY_OPTIONS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  // ── useEffect MUST be before any early return ──────────────────────────────
  useEffect(() => {
    if (profile?.role === "admin") loadTrainers();
  }, [profile?.role]);

  // ── Only admin can access ──────────────────────────────────────────────────
  if (profile?.role !== "admin") {
    return (
      <div className="page text-center" style={{ paddingTop: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--primary-dark)", marginBottom: 10 }}>Access Denied</h2>
        <p style={{ color: "var(--text-3)", marginBottom: 24 }}>You don't have admin access.</p>
        <button className="btn btn-primary" onClick={() => navigate("dashboard")}>Go to Dashboard</button>
      </div>
    );
  }

  async function loadTrainers() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "trainers"));
      setTrainers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      setError("Failed to load trainers.");
    } finally {
      setLoading(false);
    }
  }

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function toggleDay(day) {
    setForm(f => ({
      ...f,
      availableDays: f.availableDays.includes(day)
        ? f.availableDays.filter(d => d !== day)
        : [...f.availableDays, day],
    }));
  }

  async function createTrainer(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.name || !form.email || !form.password) { setError("Name, email and password are required."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (!form.experience || isNaN(form.experience)) { setError("Please enter valid years of experience."); return; }
    if (!form.pricePerHour || isNaN(form.pricePerHour)) { setError("Please enter valid price per hour."); return; }
    if (form.availableDays.length === 0) { setError("Please select at least one available day."); return; }

    setCreating(true);
    try {
      const trainerId = `trainer_${Date.now()}`;
      const trainerData = {
        id:            trainerId,
        name:          sanitize(form.name),
        email:         sanitize(form.email).toLowerCase(),
        password:      form.password,
        type:          form.type,
        typeIcon:      form.type === "Yoga Instructor" ? "🧘" : "🏋️",
        speciality:    form.speciality,
        location:      sanitize(form.location),
        experience:    parseInt(form.experience),
        pricePerHour:  parseInt(form.pricePerHour),
        gender:        form.gender,
        bio:           sanitize(form.bio),
        languages:     form.languages.split(",").map(l => sanitize(l)),
        availableDays: form.availableDays,
        sessionTypes:  ["Video call","In-person"],
        rating:        0,
        totalSessions: 0,
        totalEarnings: 0,
        highlights:    [],
        role:          "trainer",
        status:        "active",
        createdAt:     serverTimestamp(),
        createdBy:     profile.uid,
      };
      await setDoc(doc(db, "trainers", trainerId), trainerData);
      setTrainers(prev => [...prev, trainerData]);
      setSuccess(`✅ Trainer "${form.name}" created! Share their email and password with them to login.`);
      setShowForm(false);
      setForm({
        name: "", email: "", password: "", type: "Yoga Instructor",
        speciality: "Hatha Yoga", location: "Bengaluru",
        experience: "", pricePerHour: "", gender: "Female",
        bio: "", languages: "English, Kannada",
        availableDays: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
      });
    } catch (e) {
      setError("Failed to create trainer: " + e.message);
    } finally {
      setCreating(false);
    }
  }

  async function deleteTrainer(id, name) {
    try {
      await deleteDoc(doc(db, "trainers", id));
      setTrainers(prev => prev.filter(t => t.id !== id));
      setDeleteConfirm(null);
      setSuccess(`Trainer "${name}" removed.`);
    } catch {
      setError("Failed to remove trainer.");
    }
  }

  async function toggleStatus(trainer) {
    const newStatus = trainer.status === "active" ? "suspended" : "active";
    try {
      await setDoc(doc(db, "trainers", trainer.id), { status: newStatus }, { merge: true });
      setTrainers(prev => prev.map(t => t.id === trainer.id ? { ...t, status: newStatus } : t));
    } catch {
      setError("Failed to update trainer status.");
    }
  }

  return (
    <div className="page">
      <div className="page-title anim-fade-up">
        <h1>⚙️ Admin Panel</h1>
        <p>Manage trainers, view platform activity, and control access</p>
      </div>

      {error   && <div className="banner banner-error mb-16">{error} <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, marginLeft: 8 }}>✕</button></div>}
      {success && <div className="banner banner-success mb-16">{success} <button onClick={() => setSuccess("")} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, marginLeft: 8 }}>✕</button></div>}

      {/* Stats */}
      <div className="grid-4 anim-fade-up-2" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="label">Total Trainers</div>
          <div className="value">{trainers.length}</div>
          <div className="sub">{trainers.filter(t => t.status === "active").length} active</div>
        </div>
        <div className="stat-card">
          <div className="label">Yoga Instructors</div>
          <div className="value">{trainers.filter(t => t.type === "Yoga Instructor").length}</div>
          <div className="sub">on platform</div>
        </div>
        <div className="stat-card">
          <div className="label">Gym Trainers</div>
          <div className="value">{trainers.filter(t => t.type === "Gym Trainer").length}</div>
          <div className="sub">on platform</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Sessions</div>
          <div className="value">{trainers.reduce((s, t) => s + (t.totalSessions || 0), 0)}</div>
          <div className="sub">completed</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary-dark)" }}>Trainers</h2>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setError(""); }}>+ Add New Trainer</button>
      </div>

      {/* Add Trainer Form */}
      {showForm && (
        <div className="card anim-scale-in" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)" }}>Create New Trainer Account</h3>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--text-3)" }}>✕</button>
          </div>
          <form onSubmit={createTrainer}>
            <div className="grid-2">
              <div className="form-group">
                <label>Full Name *</label>
                <input className="form-control" type="text" placeholder="Trainer full name" value={form.name} onChange={e => setField("name", e.target.value)} required maxLength={60} />
              </div>
              <div className="form-group">
                <label>Email Address * <span style={{ fontSize: 11, color: "var(--text-4)" }}>(used to login)</span></label>
                <input className="form-control" type="email" placeholder="trainer@email.com" value={form.email} onChange={e => setField("email", e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Password * <span style={{ fontSize: 11, color: "var(--text-4)" }}>(min 6 characters)</span></label>
                <input className="form-control" type="password" placeholder="Create a password for them" value={form.password} onChange={e => setField("password", e.target.value)} required minLength={6} />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select className="form-control" value={form.gender} onChange={e => setField("gender", e.target.value)}>
                  <option>Female</option>
                  <option>Male</option>
                </select>
              </div>
              <div className="form-group">
                <label>Trainer Type</label>
                <select className="form-control" value={form.type} onChange={e => setField("type", e.target.value)}>
                  <option>Yoga Instructor</option>
                  <option>Gym Trainer</option>
                </select>
              </div>
              <div className="form-group">
                <label>Speciality</label>
                <select className="form-control" value={form.speciality} onChange={e => setField("speciality", e.target.value)}>
                  {SPECIALITIES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Location</label>
                <input className="form-control" type="text" placeholder="City" value={form.location} onChange={e => setField("location", e.target.value)} maxLength={40} />
              </div>
              <div className="form-group">
                <label>Years of Experience</label>
                <input className="form-control" type="number" placeholder="e.g. 5" min="0" max="50" value={form.experience} onChange={e => setField("experience", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Price per Hour (₹)</label>
                <input className="form-control" type="number" placeholder="e.g. 500" min="100" max="10000" value={form.pricePerHour} onChange={e => setField("pricePerHour", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Languages (comma separated)</label>
                <input className="form-control" type="text" placeholder="English, Hindi, Kannada" value={form.languages} onChange={e => setField("languages", e.target.value)} maxLength={100} />
              </div>
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea className="form-control" rows={3} placeholder="Brief description about the trainer..." value={form.bio} onChange={e => setField("bio", e.target.value)} maxLength={400} />
            </div>
            <div className="form-group">
              <label>Available Days</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {DAY_OPTIONS.map(day => (
                  <button key={day} type="button" onClick={() => toggleDay(day)}
                    style={{ padding: "8px 14px", borderRadius: "var(--radius-full)", border: `1.5px solid ${form.availableDays.includes(day) ? "var(--primary)" : "var(--border)"}`, background: form.availableDays.includes(day) ? "var(--primary)" : "#fff", color: form.availableDays.includes(day) ? "#fff" : "var(--text-3)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)", transition: "var(--transition)" }}>
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ background: "#fff8e1", border: "1px solid #fde68a", borderRadius: "var(--radius-sm)", padding: 12, marginBottom: 16, fontSize: 13, color: "#92400e" }}>
              📋 After creating, share the <strong>email and password</strong> with the trainer. They login at the main login page and get redirected to their trainer portal.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? <><span className="spin">⟳</span> Creating...</> : "Create Trainer Account"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div onClick={() => setDeleteConfirm(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 28, maxWidth: 400, width: "100%" }}>
            <div style={{ fontSize: 36, textAlign: "center", marginBottom: 16 }}>⚠️</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)", textAlign: "center", marginBottom: 10 }}>Remove Trainer?</h3>
            <p style={{ fontSize: 14, color: "var(--text-3)", textAlign: "center", marginBottom: 24 }}>
              Are you sure you want to remove <strong>{deleteConfirm.name}</strong>? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => deleteTrainer(deleteConfirm.id, deleteConfirm.name)}>Remove</button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Trainer cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-3)" }}>
          <span className="spin" style={{ fontSize: 32 }}>⟳</span>
          <p style={{ marginTop: 12 }}>Loading trainers...</p>
        </div>
      ) : trainers.length === 0 ? (
        <div className="card text-center" style={{ padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
          <p style={{ color: "var(--text-3)", marginBottom: 20 }}>No trainers added yet. Click "Add New Trainer" to get started.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {trainers.map(trainer => (
            <div key={trainer.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: trainer.gender === "Female" ? "#fce4ec" : "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                  {trainer.typeIcon || "👤"}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text)", marginBottom: 2 }}>{trainer.name}</div>
                  <div style={{ fontSize: 13, color: "var(--primary)", marginBottom: 2 }}>{trainer.type} · {trainer.speciality}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                    📧 {trainer.email} · 📍 {trainer.location} · ₹{trainer.pricePerHour}/hr · {trainer.experience} yrs
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, background: trainer.status === "active" ? "#dcfce7" : "#fee2e2", color: trainer.status === "active" ? "#14532d" : "#991b1b", padding: "4px 12px", borderRadius: "var(--radius-full)", fontWeight: 700 }}>
                  {trainer.status === "active" ? "✅ Active" : "⛔ Suspended"}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>Sessions: {trainer.totalSessions || 0}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(trainer)} style={{ fontSize: 12 }}>
                  {trainer.status === "active" ? "Suspend" : "Reactivate"}
                </button>
                <button className="btn btn-sm" onClick={() => setDeleteConfirm(trainer)}
                  style={{ fontSize: 12, background: "#fff5f5", color: "var(--red-500)", border: "1px solid #fecaca", borderRadius: "var(--radius-xs)", padding: "6px 12px", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card mt-24" style={{ background: "var(--primary-pale)", border: "1px solid var(--primary-soft)" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--primary-dark)", marginBottom: 10 }}>🛡️ Admin Security Reminders</h3>
        {[
          "Never share admin credentials with anyone.",
          "Always verify trainer certifications before creating accounts.",
          "Suspended trainers cannot accept new bookings.",
          "Review platform guidelines regularly to ensure compliance.",
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--primary-dark)", marginBottom: 6 }}>
            <span>🔒</span> {r}
          </div>
        ))}
      </div>
    </div>
  );
}