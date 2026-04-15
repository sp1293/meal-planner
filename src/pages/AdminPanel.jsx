import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

const API = process.env.REACT_APP_API_URL?.replace("/api/meal-plan", "")
  || "https://meal-planner-backend-0ul2.onrender.com";

function sanitize(str) {
  return String(str).replace(/[<>"'`]/g, "").trim();
}

const SPECIALITIES = [
  "Hatha Yoga","Vinyasa Yoga","Prenatal Yoga","Therapeutic Yoga",
  "Power Yoga","HIIT","Weight Training","Cardio","CrossFit",
  "Zumba","Pilates","Nutrition Coaching","Personal Training",
];

const TYPE_ICONS = {
  "Yoga Instructor":"🧘","Gym Trainer":"🏋️",
  "Nutritionist":"🥗","Physiotherapist":"🩺",
};

export default function AdminPanel({ navigate }) {
  const { profile } = useAuth();
  const [activeTab,     setActiveTab]     = useState("trainers");
  const [trainers,      setTrainers]      = useState([]);
  const [bookings,      setBookings]      = useState([]);
  const [users,         setUsers]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [revenueLoading,setRevenueLoading]= useState(false);
  const [creating,      setCreating]      = useState(false);
  const [showForm,      setShowForm]      = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [form, setForm] = useState({
    name:"",email:"",password:"",type:"Yoga Instructor",
    speciality:"Hatha Yoga",location:"Bengaluru",
    experience:"",pricePerHour:"",gender:"Female",
    bio:"",languages:"English, Kannada",
    availableDays:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  });

  const DAY_OPTIONS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  useEffect(() => {
    if (profile?.role === "admin") {
      loadTrainers();
      loadRevenueData();
    }
  }, [profile?.role]); // eslint-disable-line

  if (profile?.role !== "admin") {
    return (
      <div className="page text-center" style={{ paddingTop:80 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        <h2 style={{ fontFamily:"var(--font-display)", fontSize:24, color:"var(--primary-dark)", marginBottom:10 }}>Access Denied</h2>
        <p style={{ color:"var(--text-3)", marginBottom:24 }}>You don't have admin access.</p>
        <button className="btn btn-primary" onClick={() => navigate("dashboard")}>Go to Dashboard</button>
      </div>
    );
  }

  async function loadTrainers() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db,"trainers"));
      setTrainers(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    } catch { setError("Failed to load trainers."); }
    finally { setLoading(false); }
  }

  async function loadRevenueData() {
    setRevenueLoading(true);
    try {
      const [bookSnap, userSnap] = await Promise.all([
        getDocs(collection(db,"bookings")),
        getDocs(collection(db,"users")),
      ]);
      setBookings(bookSnap.docs.map(d => ({ id:d.id, ...d.data() })));
      setUsers(userSnap.docs.map(d => ({ id:d.id, ...d.data() })));
    } catch { console.error("Failed to load revenue data"); }
    finally { setRevenueLoading(false); }
  }

  function setField(key, val) { setForm(f => ({ ...f, [key]:val })); }

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
    if (!form.name||!form.email||!form.password) { setError("Name, email and password are required."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (!form.experience||isNaN(form.experience)) { setError("Please enter valid years of experience."); return; }
    if (!form.pricePerHour||isNaN(form.pricePerHour)) { setError("Please enter valid price per hour."); return; }
    if (form.availableDays.length === 0) { setError("Please select at least one available day."); return; }
    setCreating(true);
    try {
      const res = await fetch(`${API}/api/create-trainer`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          adminUid: profile.uid,
          trainerData: {
            name:         sanitize(form.name),
            email:        sanitize(form.email).toLowerCase(),
            password:     form.password,
            type:         form.type,
            typeIcon:     TYPE_ICONS[form.type]||"💪",
            speciality:   form.speciality,
            location:     sanitize(form.location),
            experience:   parseInt(form.experience),
            pricePerHour: parseInt(form.pricePerHour),
            gender:       form.gender,
            bio:          sanitize(form.bio),
            languages:    form.languages.split(",").map(l=>sanitize(l.trim())).filter(Boolean),
            availableDays:form.availableDays,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok||!data.success) { setError(data.error||"Failed to create trainer."); return; }
      setTrainers(prev => [...prev, data.trainer]);
      setSuccess(`✅ Trainer "${form.name}" created! Invite email sent to ${form.email}.`);
      setShowForm(false);
      setForm({ name:"",email:"",password:"",type:"Yoga Instructor",speciality:"Hatha Yoga",location:"Bengaluru",experience:"",pricePerHour:"",gender:"Female",bio:"",languages:"English, Kannada",availableDays:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] });
    } catch { setError("Failed to create trainer. Please try again."); }
    finally { setCreating(false); }
  }

  async function deleteTrainer(id, name) {
    try {
      await deleteDoc(doc(db,"trainers",id));
      setTrainers(prev => prev.filter(t => t.id !== id));
      setDeleteConfirm(null);
      setSuccess(`Trainer "${name}" removed.`);
    } catch { setError("Failed to remove trainer."); }
  }

  async function toggleStatus(trainer) {
    const newStatus = trainer.status==="active" ? "suspended" : "active";
    try {
      await setDoc(doc(db,"trainers",trainer.id),{ status:newStatus },{ merge:true });
      setTrainers(prev => prev.map(t => t.id===trainer.id ? { ...t, status:newStatus } : t));
    } catch { setError("Failed to update trainer status."); }
  }

  // ── Revenue calculations ───────────────────────────────────────────────────
  const confirmedBookings  = bookings.filter(b => b.status==="Confirmed"||b.status==="Rescheduled");
  const completedBookings  = bookings.filter(b => b.status==="Completed");
  const cancelledBookings  = bookings.filter(b => b.status==="Cancelled");
  const totalRevenue       = completedBookings.reduce((s,b) => s+(b.price||0), 0);
  const platformRevenue    = Math.round(totalRevenue * 0.20);
  const trainerPayouts     = totalRevenue - platformRevenue;
  const paidUsers          = users.filter(u => u.tier && u.tier !== "free");
  const subRevenue         = paidUsers.reduce((s,u) => {
    const prices = { starter:299, pro:599, family:999 };
    return s + (prices[u.tier] || 0);
  }, 0);

  // Top trainers by sessions
  const trainerStats = trainers.map(t => ({
    ...t,
    sessionCount: completedBookings.filter(b => b.trainerId===t.id).length,
    revenue:      completedBookings.filter(b => b.trainerId===t.id).reduce((s,b)=>s+(b.price||0),0),
  })).sort((a,b) => b.sessionCount - a.sessionCount).slice(0,5);

  const tabs = [
    { id:"trainers", label:"👥 Trainers" },
    { id:"revenue",  label:"💰 Revenue" },
    { id:"users",    label:"👤 Users" },
  ];

  return (
    <div className="page">
      <div className="page-title anim-fade-up">
        <h1>⚙️ Admin Panel</h1>
        <p>Manage trainers, monitor revenue, and control platform access</p>
      </div>

      {error   && <div className="banner banner-error mb-16">{error}<button onClick={()=>setError("")} style={{background:"none",border:"none",cursor:"pointer",fontWeight:700,marginLeft:8}}>✕</button></div>}
      {success && <div className="banner banner-success mb-16">{success}<button onClick={()=>setSuccess("")} style={{background:"none",border:"none",cursor:"pointer",fontWeight:700,marginLeft:8}}>✕</button></div>}

      {/* Top stats */}
      <div className="grid-4 anim-fade-up-2" style={{ marginBottom:24 }}>
        <div className="stat-card">
          <div className="label">Total Trainers</div>
          <div className="value">{trainers.length}</div>
          <div className="sub">{trainers.filter(t=>t.status==="active").length} active</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Bookings</div>
          <div className="value">{bookings.length}</div>
          <div className="sub">{completedBookings.length} completed</div>
        </div>
        <div className="stat-card" style={{ background:"#f0fdf4" }}>
          <div className="label">Platform Revenue</div>
          <div className="value" style={{ color:"var(--primary-dark)" }}>₹{platformRevenue.toLocaleString("en-IN")}</div>
          <div className="sub">from sessions (20% cut)</div>
        </div>
        <div className="stat-card" style={{ background:"#eff6ff" }}>
          <div className="label">Paid Subscribers</div>
          <div className="value" style={{ color:"#1d4ed8" }}>{paidUsers.length}</div>
          <div className="sub">₹{subRevenue.toLocaleString("en-IN")}/mo est.</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding:"9px 20px", borderRadius:"var(--radius-full)", border:`1.5px solid ${activeTab===tab.id?"var(--primary)":"var(--border)"}`, background:activeTab===tab.id?"var(--primary)":"#fff", color:activeTab===tab.id?"#fff":"var(--text-3)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"var(--font-body)", transition:"var(--transition)" }}>
            {tab.label}
          </button>
        ))}
        {activeTab==="trainers" && (
          <button className="btn btn-primary btn-sm" style={{ marginLeft:"auto" }} onClick={()=>{ setShowForm(true); setError(""); }}>
            + Add New Trainer
          </button>
        )}
      </div>

      {/* ── TRAINERS TAB ──────────────────────────────────────────────────── */}
      {activeTab==="trainers" && (
        <>
          {showForm && (
            <div className="card anim-scale-in" style={{ marginBottom:24 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h3 style={{ fontFamily:"var(--font-display)", fontSize:20, color:"var(--primary-dark)" }}>Create New Trainer Account</h3>
                <button onClick={()=>setShowForm(false)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"var(--text-3)" }}>✕</button>
              </div>
              <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:"var(--radius-sm)", padding:14, marginBottom:20, fontSize:13, color:"#14532d" }}>
                📧 <strong>Automatic invite:</strong> Trainer will receive a welcome email with login credentials automatically.
              </div>
              <form onSubmit={createTrainer}>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input className="form-control" type="text" placeholder="Trainer full name" value={form.name} onChange={e=>setField("name",e.target.value)} required maxLength={60} />
                  </div>
                  <div className="form-group">
                    <label>Email Address * <span style={{fontSize:11,color:"var(--text-4)"}}>(invite sent here)</span></label>
                    <input className="form-control" type="email" placeholder="trainer@email.com" value={form.email} onChange={e=>setField("email",e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Temporary Password * <span style={{fontSize:11,color:"var(--text-4)"}}>(min 6 chars)</span></label>
                    <input className="form-control" type="text" placeholder="Create a temporary password" value={form.password} onChange={e=>setField("password",e.target.value)} required minLength={6} />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select className="form-control" value={form.gender} onChange={e=>setField("gender",e.target.value)}>
                      <option>Female</option><option>Male</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Trainer Type</label>
                    <select className="form-control" value={form.type} onChange={e=>setField("type",e.target.value)}>
                      <option>Yoga Instructor</option><option>Gym Trainer</option>
                      <option>Nutritionist</option><option>Physiotherapist</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Speciality</label>
                    <select className="form-control" value={form.speciality} onChange={e=>setField("speciality",e.target.value)}>
                      {SPECIALITIES.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input className="form-control" type="text" placeholder="City" value={form.location} onChange={e=>setField("location",e.target.value)} maxLength={40} />
                  </div>
                  <div className="form-group">
                    <label>Years of Experience</label>
                    <input className="form-control" type="number" placeholder="e.g. 5" min="0" max="50" value={form.experience} onChange={e=>setField("experience",e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Price per Hour (₹)</label>
                    <input className="form-control" type="number" placeholder="e.g. 500" min="100" max="10000" value={form.pricePerHour} onChange={e=>setField("pricePerHour",e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Languages (comma separated)</label>
                    <input className="form-control" type="text" placeholder="English, Hindi, Kannada" value={form.languages} onChange={e=>setField("languages",e.target.value)} maxLength={100} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea className="form-control" rows={3} placeholder="Brief description..." value={form.bio} onChange={e=>setField("bio",e.target.value)} maxLength={400} />
                </div>
                <div className="form-group">
                  <label>Available Days</label>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {DAY_OPTIONS.map(day=>(
                      <button key={day} type="button" onClick={()=>toggleDay(day)}
                        style={{ padding:"8px 14px", borderRadius:"var(--radius-full)", border:`1.5px solid ${form.availableDays.includes(day)?"var(--primary)":"var(--border)"}`, background:form.availableDays.includes(day)?"var(--primary)":"#fff", color:form.availableDays.includes(day)?"#fff":"var(--text-3)", fontSize:13, cursor:"pointer", fontFamily:"var(--font-body)" }}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button type="submit" className="btn btn-primary" disabled={creating}>
                    {creating?<><span className="spin">⟳</span> Creating...</>:"✅ Create & Send Invite"}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {deleteConfirm && (
            <div onClick={()=>setDeleteConfirm(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
              <div onClick={e=>e.stopPropagation()} style={{ background:"var(--bg-card)", borderRadius:"var(--radius-lg)", padding:28, maxWidth:400, width:"100%" }}>
                <div style={{ fontSize:36, textAlign:"center", marginBottom:16 }}>⚠️</div>
                <h3 style={{ fontFamily:"var(--font-display)", fontSize:20, color:"var(--primary-dark)", textAlign:"center", marginBottom:10 }}>Remove Trainer?</h3>
                <p style={{ fontSize:14, color:"var(--text-3)", textAlign:"center", marginBottom:24 }}>Remove <strong>{deleteConfirm.name}</strong>? This cannot be undone.</p>
                <div style={{ display:"flex", gap:10 }}>
                  <button className="btn btn-danger" style={{ flex:1 }} onClick={()=>deleteTrainer(deleteConfirm.id,deleteConfirm.name)}>Remove</button>
                  <button className="btn btn-ghost" style={{ flex:1 }} onClick={()=>setDeleteConfirm(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign:"center", padding:48 }}><span className="spin" style={{ fontSize:32 }}>⟳</span><p style={{ marginTop:12, color:"var(--text-3)" }}>Loading trainers...</p></div>
          ) : trainers.length===0 ? (
            <div className="card text-center" style={{ padding:48 }}><div style={{ fontSize:48, marginBottom:16 }}>👤</div><p style={{ color:"var(--text-3)" }}>No trainers yet. Click "+ Add New Trainer" to get started.</p></div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {trainers.map(trainer=>(
                <div key={trainer.id} className="card" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:14 }}>
                  <div style={{ display:"flex", gap:14, alignItems:"center" }}>
                    <div style={{ width:52, height:52, borderRadius:"50%", background:trainer.gender==="Female"?"#fce4ec":"#e8f5e9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>
                      {trainer.typeIcon||TYPE_ICONS[trainer.type]||"👤"}
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:15, color:"var(--text)", marginBottom:2 }}>{trainer.name}</div>
                      <div style={{ fontSize:13, color:"var(--primary)", marginBottom:2 }}>{trainer.type} · {trainer.speciality}</div>
                      <div style={{ fontSize:12, color:"var(--text-3)" }}>📧 {trainer.email} · 📍 {trainer.location} · ₹{trainer.pricePerHour}/hr · {trainer.experience} yrs</div>
                      <div style={{ marginTop:4 }}>
                        {trainer.passwordHash
                          ? <span style={{ fontSize:10, background:"#dcfce7", color:"#14532d", padding:"2px 8px", borderRadius:"var(--radius-full)", fontWeight:600 }}>🔒 Secure</span>
                          : <span style={{ fontSize:10, background:"#fee2e2", color:"#991b1b", padding:"2px 8px", borderRadius:"var(--radius-full)", fontWeight:600 }}>⚠️ Legacy</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                    <span style={{ fontSize:11, background:trainer.status==="active"?"#dcfce7":"#fee2e2", color:trainer.status==="active"?"#14532d":"#991b1b", padding:"4px 12px", borderRadius:"var(--radius-full)", fontWeight:700 }}>
                      {trainer.status==="active"?"✅ Active":"⛔ Suspended"}
                    </span>
                    <span style={{ fontSize:12, color:"var(--text-3)" }}>Sessions: {trainer.totalSessions||0}</span>
                    <button className="btn btn-ghost btn-sm" onClick={()=>toggleStatus(trainer)} style={{ fontSize:12 }}>
                      {trainer.status==="active"?"Suspend":"Reactivate"}
                    </button>
                    <button onClick={()=>setDeleteConfirm(trainer)}
                      style={{ fontSize:12, background:"#fff5f5", color:"var(--red-500)", border:"1px solid #fecaca", borderRadius:"var(--radius-xs)", padding:"6px 12px", cursor:"pointer", fontFamily:"var(--font-body)" }}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── REVENUE TAB ───────────────────────────────────────────────────── */}
      {activeTab==="revenue" && (
        revenueLoading ? (
          <div style={{ textAlign:"center", padding:48 }}><span className="spin" style={{ fontSize:32 }}>⟳</span><p style={{ marginTop:12, color:"var(--text-3)" }}>Loading revenue data...</p></div>
        ) : (
          <>
            {/* Revenue stats */}
            <div className="grid-4" style={{ marginBottom:24 }}>
              <div className="stat-card" style={{ background:"#f0fdf4" }}>
                <div className="label">Total Session Revenue</div>
                <div className="value" style={{ color:"var(--primary-dark)" }}>₹{totalRevenue.toLocaleString("en-IN")}</div>
                <div className="sub">{completedBookings.length} completed sessions</div>
              </div>
              <div className="stat-card" style={{ background:"#f0fdf4" }}>
                <div className="label">Platform Cut (20%)</div>
                <div className="value" style={{ color:"var(--primary-dark)" }}>₹{platformRevenue.toLocaleString("en-IN")}</div>
                <div className="sub">your earnings</div>
              </div>
              <div className="stat-card" style={{ background:"#eff6ff" }}>
                <div className="label">Subscription Revenue</div>
                <div className="value" style={{ color:"#1d4ed8" }}>₹{subRevenue.toLocaleString("en-IN")}</div>
                <div className="sub">{paidUsers.length} paid users/mo</div>
              </div>
              <div className="stat-card" style={{ background:"#fdf4ff" }}>
                <div className="label">Total Platform Revenue</div>
                <div className="value" style={{ color:"#7c3aed" }}>₹{(platformRevenue+subRevenue).toLocaleString("en-IN")}</div>
                <div className="sub">sessions + subscriptions</div>
              </div>
            </div>

            {/* Booking breakdown */}
            <div className="grid-2" style={{ marginBottom:24 }}>
              <div className="card">
                <h3 style={{ fontFamily:"var(--font-display)", fontSize:18, color:"var(--primary-dark)", marginBottom:16 }}>📊 Booking Status</h3>
                {[
                  ["✅ Confirmed",  confirmedBookings.length,  "#dcfce7","#14532d"],
                  ["🏁 Completed",  completedBookings.length,  "#dbeafe","#1d4ed8"],
                  ["❌ Cancelled",  cancelledBookings.length,  "#fee2e2","#991b1b"],
                  ["📋 Total",      bookings.length,           "#f3f4f6","#374151"],
                ].map(([label,count,bg,color])=>(
                  <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                    <span style={{ fontSize:14, color:"var(--text-2)" }}>{label}</span>
                    <span style={{ background:bg, color, padding:"3px 12px", borderRadius:"var(--radius-full)", fontSize:13, fontWeight:700 }}>{count}</span>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3 style={{ fontFamily:"var(--font-display)", fontSize:18, color:"var(--primary-dark)", marginBottom:16 }}>👥 Subscriber Breakdown</h3>
                {[
                  ["🆓 Free",    users.filter(u=>!u.tier||u.tier==="free").length,   "#f3f4f6","#374151"],
                  ["⭐ Starter", users.filter(u=>u.tier==="starter").length,          "#fef3c7","#92400e"],
                  ["🚀 Pro",     users.filter(u=>u.tier==="pro").length,              "#dbeafe","#1d4ed8"],
                  ["👨‍👩‍👧 Family", users.filter(u=>u.tier==="family").length,           "#f0fdf4","#14532d"],
                  ["📋 Total",   users.length,                                        "#f3f4f6","#374151"],
                ].map(([label,count,bg,color])=>(
                  <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                    <span style={{ fontSize:14, color:"var(--text-2)" }}>{label}</span>
                    <span style={{ background:bg, color, padding:"3px 12px", borderRadius:"var(--radius-full)", fontSize:13, fontWeight:700 }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top trainers */}
            {trainerStats.length > 0 && (
              <div className="card">
                <h3 style={{ fontFamily:"var(--font-display)", fontSize:18, color:"var(--primary-dark)", marginBottom:16 }}>🏆 Top Trainers by Sessions</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Trainer</th>
                      <th>Type</th>
                      <th>Sessions</th>
                      <th>Revenue Generated</th>
                      <th>Their Payout (80%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainerStats.map((t,i)=>(
                      <tr key={t.id}>
                        <td>
                          <div style={{ fontWeight:600 }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":"  "} {t.name}</div>
                          <div style={{ fontSize:12, color:"var(--text-3)" }}>{t.email}</div>
                        </td>
                        <td>{t.type}</td>
                        <td><span style={{ fontWeight:700, color:"var(--primary-dark)" }}>{t.sessionCount}</span></td>
                        <td>₹{t.revenue.toLocaleString("en-IN")}</td>
                        <td style={{ color:"var(--primary-dark)", fontWeight:600 }}>₹{Math.round(t.revenue*0.8).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Recent bookings */}
            {bookings.length > 0 && (
              <div className="card mt-24">
                <h3 style={{ fontFamily:"var(--font-display)", fontSize:18, color:"var(--primary-dark)", marginBottom:16 }}>🕐 Recent Bookings</h3>
                <table className="data-table">
                  <thead>
                    <tr><th>Student</th><th>Trainer</th><th>Date</th><th>Amount</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {bookings.slice(0,10).map(b=>(
                      <tr key={b.id}>
                        <td>{b.studentName||"—"}</td>
                        <td>{b.trainerName||"—"}</td>
                        <td style={{ fontSize:12 }}>{b.dateLabel||"—"}</td>
                        <td>₹{b.price||0}</td>
                        <td>
                          <span style={{ fontSize:11, background:b.status==="Completed"?"#dcfce7":b.status==="Cancelled"?"#fee2e2":"#dbeafe", color:b.status==="Completed"?"#14532d":b.status==="Cancelled"?"#991b1b":"#1d4ed8", padding:"3px 10px", borderRadius:"var(--radius-full)", fontWeight:700 }}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )
      )}

      {/* ── USERS TAB ─────────────────────────────────────────────────────── */}
      {activeTab==="users" && (
        revenueLoading ? (
          <div style={{ textAlign:"center", padding:48 }}><span className="spin" style={{ fontSize:32 }}>⟳</span></div>
        ) : (
          <div className="card">
            <h3 style={{ fontFamily:"var(--font-display)", fontSize:18, color:"var(--primary-dark)", marginBottom:16 }}>
              👤 All Users ({users.length})
            </h3>
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Plan</th><th>Plans Used</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {users.slice(0,50).map(u=>(
                  <tr key={u.id}>
                    <td style={{ fontWeight:500 }}>{u.displayName||u.name||"—"}</td>
                    <td style={{ fontSize:12, color:"var(--text-3)" }}>{u.email||"—"}</td>
                    <td>
                      <span style={{ fontSize:11, background:u.tier==="pro"?"#dbeafe":u.tier==="family"?"#f0fdf4":u.tier==="starter"?"#fef3c7":"#f3f4f6", color:u.tier==="pro"?"#1d4ed8":u.tier==="family"?"#14532d":u.tier==="starter"?"#92400e":"#374151", padding:"2px 10px", borderRadius:"var(--radius-full)", fontWeight:700, textTransform:"uppercase" }}>
                        {u.tier||"free"}
                      </span>
                    </td>
                    <td>{u.plansUsed||0}</td>
                    <td style={{ fontSize:12, color:"var(--text-3)" }}>
                      {u.createdAt?.seconds ? new Date(u.createdAt.seconds*1000).toLocaleDateString("en-IN") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length > 50 && <p style={{ fontSize:12, color:"var(--text-3)", marginTop:12 }}>Showing first 50 users of {users.length} total.</p>}
          </div>
        )
      )}

      <div className="card mt-24" style={{ background:"var(--primary-pale)", border:"1px solid var(--primary-soft)" }}>
        <h3 style={{ fontFamily:"var(--font-display)", fontSize:16, color:"var(--primary-dark)", marginBottom:10 }}>🛡️ Admin Security Reminders</h3>
        {["Never share admin credentials with anyone.","Always verify trainer certifications before creating accounts.","Suspended trainers cannot accept new bookings.","Trainer passwords are hashed with bcrypt — never stored in plain text."].map((r,i)=>(
          <div key={i} style={{ display:"flex", gap:8, fontSize:13, color:"var(--primary-dark)", marginBottom:6 }}><span>🔒</span>{r}</div>
        ))}
      </div>
    </div>
  );
}