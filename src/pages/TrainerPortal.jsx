import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const API = process.env.REACT_APP_API_URL?.replace("/api/meal-plan","")
  || "https://meal-planner-backend-0ul2.onrender.com";

const SPECIALITIES = [
  "Hatha Yoga","Vinyasa Yoga","Prenatal Yoga","Therapeutic Yoga","Power Yoga",
  "HIIT","Weight Training","Cardio","CrossFit","Zumba","Pilates",
  "Nutrition Coaching","Personal Training",
];
const DAY_OPTIONS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default function TrainerPortal({ navigate }) {
  const { profile, logout } = useAuth();
  const [sessions,  setSessions]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");

  const [profileForm,   setProfileForm]   = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm,    setPwForm]    = useState({ current:"", newPw:"", confirm:"" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError,   setPwError]   = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  useEffect(() => {
    if (profile?.role === "trainer") {
      loadSessions();
      setProfileForm({
        bio:           profile.bio || "",
        pricePerHour:  profile.pricePerHour || "",
        location:      profile.location || "",
        languages:     (profile.languages || []).join(", "),
        availableDays: profile.availableDays || [],
        speciality:    profile.speciality || "",
        sessionTypes:  profile.sessionTypes || ["Video call","In-person"],
      });
    }
  }, [profile?.role]); // eslint-disable-line

  if (profile?.role !== "trainer") {
    return (
      <div className="page text-center" style={{ paddingTop:80 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        <h2 style={{ fontFamily:"var(--font-display)", fontSize:24, color:"var(--primary-dark)", marginBottom:10 }}>Access Denied</h2>
        <p style={{ color:"var(--text-3)", marginBottom:24 }}>This portal is for trainers only.</p>
        <button className="btn btn-primary" onClick={() => navigate("dashboard")}>Go to Dashboard</button>
      </div>
    );
  }

  async function loadSessions() {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db,"bookings"), where("trainerId","==",profile.id||profile.uid||profile.email))
      );
      setSessions(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    } catch { setSessions([]); }
    finally { setLoading(false); }
  }

  async function markComplete(sessionId) {
    try {
      await updateDoc(doc(db,"bookings",sessionId),{ status:"Completed", completedAt:new Date().toISOString() });
      setSessions(prev => prev.map(s => s.id===sessionId ? { ...s, status:"Completed" } : s));
      setSuccess("Session marked as complete!");
      setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Failed to update session status."); }
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true); setError(""); setSuccess("");
    try {
      const snap = await getDocs(query(collection(db,"trainers"), where("email","==",profile.email?.toLowerCase())));
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, {
          bio:          profileForm.bio,
          pricePerHour: parseInt(profileForm.pricePerHour) || profile.pricePerHour,
          location:     profileForm.location,
          languages:    profileForm.languages.split(",").map(l=>l.trim()).filter(Boolean),
          availableDays: profileForm.availableDays,
          speciality:   profileForm.speciality,
          sessionTypes: profileForm.sessionTypes,
        });
        setSuccess("✅ Profile updated successfully!");
        setActiveTab("upcoming");
      }
    } catch { setError("Failed to save profile. Please try again."); }
    finally { setSavingProfile(false); }
  }

  function toggleDay(day) {
    setProfileForm(f => ({
      ...f,
      availableDays: f.availableDays.includes(day)
        ? f.availableDays.filter(d=>d!==day)
        : [...f.availableDays, day],
    }));
  }

  function toggleSessionType(type) {
    setProfileForm(f => ({
      ...f,
      sessionTypes: f.sessionTypes.includes(type)
        ? f.sessionTypes.filter(t=>t!==type)
        : [...f.sessionTypes, type],
    }));
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwError(""); setPwSuccess("");
    if (pwForm.newPw.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError("Passwords do not match."); return; }
    setPwLoading(true);
    try {
      const res = await fetch(`${API}/api/trainer-change-password`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ email:profile.email, currentPassword:pwForm.current, newPassword:pwForm.newPw }),
      });
      const data = await res.json();
      if (data.success) {
        setPwSuccess("✅ Password changed successfully!");
        setPwForm({ current:"", newPw:"", confirm:"" });
      } else {
        setPwError(data.error || "Failed to change password.");
      }
    } catch { setPwError("Something went wrong. Please try again."); }
    finally { setPwLoading(false); }
  }

  async function handleLogout() { await logout(); navigate("landing"); }

  const upcoming  = sessions.filter(s => s.status==="Confirmed"||s.status==="Rescheduled");
  const completed = sessions.filter(s => s.status==="Completed");
  const cancelled = sessions.filter(s => s.status==="Cancelled");

  const totalEarnings = completed.reduce((sum,s) => sum+(s.price||0), 0);
  const platformCut   = Math.round(totalEarnings*0.20);
  const trainerPayout = totalEarnings - platformCut;

  const tabs = [
    { id:"upcoming",  label:"Upcoming",        count:upcoming.length },
    { id:"completed", label:"Completed",       count:completed.length },
    { id:"cancelled", label:"Cancelled",       count:cancelled.length },
    { id:"profile",   label:"✏️ Edit Profile",  count:0 },
    { id:"password",  label:"🔑 Change Password", count:0 },
  ];

  const displaySessions = activeTab==="upcoming" ? upcoming : activeTab==="completed" ? completed : cancelled;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <nav style={{ background:"#fff", borderBottom:"1px solid var(--border)", padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"var(--primary)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🥗</div>
          <div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:18, fontWeight:700, color:"var(--primary-dark)" }}>Mitabhukta</div>
            <div style={{ fontSize:10, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".5px" }}>Trainer Portal</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:14, fontWeight:600, color:"var(--text)" }}>{profile?.displayName||profile?.name}</div>
            <div style={{ fontSize:11, color:"var(--primary)", fontWeight:600 }}>{profile?.type} · {profile?.speciality}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign out</button>
        </div>
      </nav>

      <div className="page">
        <div className="page-title anim-fade-up">
          <h1>👋 Welcome, {(profile?.displayName||profile?.name||"Trainer").split(" ")[0]}!</h1>
          <p>Your training dashboard and schedule</p>
        </div>

        {error   && <div className="banner banner-error mb-16">{error}<button onClick={()=>setError("")} style={{background:"none",border:"none",cursor:"pointer",fontWeight:700,marginLeft:8}}>✕</button></div>}
        {success && <div className="banner banner-success mb-16">{success}<button onClick={()=>setSuccess("")} style={{background:"none",border:"none",cursor:"pointer",fontWeight:700,marginLeft:8}}>✕</button></div>}

        {/* Profile card */}
        <div className="card anim-fade-up-2" style={{ marginBottom:24, display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:profile?.gender==="Female"?"#fce4ec":"#e8f5e9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, flexShrink:0 }}>
            {profile?.type==="Yoga Instructor"?"🧘":"🏋️"}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:600, color:"var(--text)", marginBottom:4 }}>{profile?.displayName||profile?.name}</div>
            <div style={{ fontSize:14, color:"var(--primary)", marginBottom:6 }}>{profile?.type} · {profile?.speciality}</div>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap", fontSize:13, color:"var(--text-3)" }}>
              <span>📍 {profile?.location}</span>
              <span>⭐ {profile?.rating||"New"}</span>
              <span>🎯 {profile?.experience} yrs exp</span>
              <span>₹{profile?.pricePerHour}/hr</span>
            </div>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {(profile?.availableDays||[]).map(d => (
              <span key={d} style={{ fontSize:11, background:"var(--primary-pale)", color:"var(--primary)", padding:"3px 10px", borderRadius:"var(--radius-full)", fontWeight:600 }}>{d}</span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4 anim-fade-up-2" style={{ marginBottom:28 }}>
          <div className="stat-card"><div className="label">Upcoming</div><div className="value">{upcoming.length}</div><div className="sub">sessions</div></div>
          <div className="stat-card"><div className="label">Completed</div><div className="value">{completed.length}</div><div className="sub">all time</div></div>
          <div className="stat-card" style={{ background:"#f0fdf4" }}><div className="label">Your Earnings</div><div className="value" style={{ color:"var(--primary-dark)" }}>₹{trainerPayout.toLocaleString("en-IN")}</div><div className="sub">after platform fee</div></div>
          <div className="stat-card"><div className="label">Rating</div><div className="value">{profile?.rating||"—"}</div><div className="sub">{completed.length} reviews</div></div>
        </div>

        {/* Earnings breakdown */}
        {completed.length > 0 && (
          <div className="card anim-fade-up-2" style={{ marginBottom:24 }}>
            <h3 style={{ fontFamily:"var(--font-display)", fontSize:18, color:"var(--primary-dark)", marginBottom:16 }}>💰 Earnings Breakdown</h3>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:14, marginBottom:8 }}>
              <span style={{ color:"var(--text-3)" }}>Total collected</span><span style={{ fontWeight:600 }}>₹{totalEarnings.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:14, marginBottom:8 }}>
              <span style={{ color:"var(--text-3)" }}>Platform fee (20%)</span><span style={{ fontWeight:600, color:"var(--red-500)" }}>−₹{platformCut.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:16, borderTop:"1px solid var(--border)", paddingTop:12, marginTop:6 }}>
              <span style={{ fontWeight:700 }}>Your payout</span><span style={{ fontWeight:700, color:"var(--primary-dark)" }}>₹{trainerPayout.toLocaleString("en-IN")}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding:"9px 18px", borderRadius:"var(--radius-full)", border:`1.5px solid ${activeTab===tab.id?"var(--primary)":"var(--border)"}`, background:activeTab===tab.id?"var(--primary)":"#fff", color:activeTab===tab.id?"#fff":"var(--text-3)", fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"var(--font-body)", transition:"var(--transition)" }}>
              {tab.label}{tab.count>0&&<span style={{ background:activeTab===tab.id?"rgba(255,255,255,0.3)":"var(--primary-pale)", color:activeTab===tab.id?"#fff":"var(--primary)", borderRadius:"var(--radius-full)", padding:"1px 7px", fontSize:11, marginLeft:4 }}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Sessions */}
        {["upcoming","completed","cancelled"].includes(activeTab) && (
          loading ? (
            <div style={{ textAlign:"center", padding:48 }}><span className="spin" style={{ fontSize:32 }}>⟳</span><p style={{ marginTop:12, color:"var(--text-3)" }}>Loading sessions...</p></div>
          ) : displaySessions.length===0 ? (
            <div className="card text-center" style={{ padding:48 }}><div style={{ fontSize:40, marginBottom:14 }}>📅</div><p style={{ color:"var(--text-3)", fontSize:15 }}>No {activeTab} sessions yet.</p></div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {displaySessions.map(session => (
                <div key={session.id} className="card">
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:14 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:8, flexWrap:"wrap" }}>
                        <div style={{ fontWeight:600, fontSize:16, color:"var(--text)" }}>👤 {session.studentName||"Student"}</div>
                        <span style={{ fontSize:11, background:session.status==="Completed"?"#dcfce7":session.status==="Cancelled"?"#fee2e2":"#dbeafe", color:session.status==="Completed"?"#14532d":session.status==="Cancelled"?"#991b1b":"#1d4ed8", padding:"3px 10px", borderRadius:"var(--radius-full)", fontWeight:700 }}>{session.status}</span>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:8, marginBottom:10 }}>
                        {[["📅 Date",session.dateLabel],["⏰ Time",session.time],["📹 Type",session.sessionType],["₹ Fee",`₹${session.price}`]].map(([label,value]) => (
                          <div key={label} style={{ fontSize:13 }}><span style={{ color:"var(--text-3)" }}>{label}: </span><span style={{ fontWeight:600, color:"var(--text)" }}>{value}</span></div>
                        ))}
                      </div>
                      {session.notes && <div style={{ background:"var(--bg-muted)", borderRadius:"var(--radius-sm)", padding:"10px 14px", fontSize:13, color:"var(--text-2)" }}><strong>📝 Student notes:</strong> {session.notes}</div>}
                    </div>
                    {session.status!=="Cancelled"&&session.status!=="Completed"&&(
                      <button className="btn btn-primary btn-sm" onClick={() => markComplete(session.id)}>✅ Mark Complete</button>
                    )}
                    {session.status==="Completed"&&session.review&&(
                      <div style={{ textAlign:"right" }}><div style={{ fontSize:16 }}>{"⭐".repeat(session.review.rating)}</div><div style={{ fontSize:12, color:"var(--text-3)", maxWidth:200 }}>{session.review.comment}</div></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Edit Profile */}
        {activeTab==="profile" && (
          <div className="card anim-scale-in">
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:20, color:"var(--primary-dark)", marginBottom:20 }}>Edit Your Profile</h2>
            <form onSubmit={saveProfile}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Speciality</label>
                  <select className="form-control" value={profileForm.speciality} onChange={e => setProfileForm(f=>({...f,speciality:e.target.value}))}>
                    {SPECIALITIES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Price per Hour (₹)</label>
                  <input className="form-control" type="number" min="100" max="10000" value={profileForm.pricePerHour} onChange={e => setProfileForm(f=>({...f,pricePerHour:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input className="form-control" type="text" maxLength={60} value={profileForm.location} onChange={e => setProfileForm(f=>({...f,location:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Languages (comma separated)</label>
                  <input className="form-control" type="text" value={profileForm.languages} onChange={e => setProfileForm(f=>({...f,languages:e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea className="form-control" rows={4} maxLength={400} value={profileForm.bio} onChange={e => setProfileForm(f=>({...f,bio:e.target.value}))} />
                <p style={{ fontSize:11, color:"var(--text-4)", marginTop:4 }}>{(profileForm.bio||"").length}/400</p>
              </div>
              <div className="form-group">
                <label>Available Days</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {DAY_OPTIONS.map(day => (
                    <button key={day} type="button" onClick={() => toggleDay(day)}
                      style={{ padding:"8px 14px", borderRadius:"var(--radius-full)", border:`1.5px solid ${profileForm.availableDays.includes(day)?"var(--primary)":"var(--border)"}`, background:profileForm.availableDays.includes(day)?"var(--primary)":"#fff", color:profileForm.availableDays.includes(day)?"#fff":"var(--text-3)", fontSize:13, cursor:"pointer", fontFamily:"var(--font-body)", transition:"var(--transition)" }}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Session Types</label>
                <div style={{ display:"flex", gap:10 }}>
                  {["Video call","In-person"].map(type => (
                    <button key={type} type="button" onClick={() => toggleSessionType(type)}
                      style={{ padding:"10px 20px", borderRadius:"var(--radius-sm)", border:`1.5px solid ${profileForm.sessionTypes.includes(type)?"var(--primary)":"var(--border)"}`, background:profileForm.sessionTypes.includes(type)?"var(--primary-pale)":"#fff", color:profileForm.sessionTypes.includes(type)?"var(--primary-dark)":"var(--text-3)", fontSize:14, cursor:"pointer", fontFamily:"var(--font-body)", fontWeight:profileForm.sessionTypes.includes(type)?600:400 }}>
                      {type==="Video call"?"📹 Video Call":"🏃 In-Person"}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                  {savingProfile?<><span className="spin">⟳</span> Saving...</>:"Save Profile"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setActiveTab("upcoming")}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Change Password */}
        {activeTab==="password" && (
          <div className="card anim-scale-in" style={{ maxWidth:480 }}>
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:20, color:"var(--primary-dark)", marginBottom:8 }}>Change Password</h2>
            <p style={{ fontSize:14, color:"var(--text-3)", marginBottom:20 }}>Enter your current password to confirm your identity.</p>
            {pwError   && <div className="banner banner-error mb-16">{pwError}</div>}
            {pwSuccess && <div className="banner banner-success mb-16">{pwSuccess}</div>}
            <form onSubmit={changePassword}>
              <div className="form-group">
                <label>Current Password</label>
                <input className="form-control" type="password" placeholder="Enter current password" value={pwForm.current} onChange={e => setPwForm(f=>({...f,current:e.target.value}))} required />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input className="form-control" type="password" placeholder="Min. 6 characters" value={pwForm.newPw} onChange={e => setPwForm(f=>({...f,newPw:e.target.value}))} required minLength={6} />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input className="form-control" type="password" placeholder="Repeat new password" value={pwForm.confirm} onChange={e => setPwForm(f=>({...f,confirm:e.target.value}))} required />
                {pwForm.confirm&&pwForm.newPw!==pwForm.confirm&&<p className="form-error">Passwords do not match</p>}
                {pwForm.confirm&&pwForm.newPw===pwForm.confirm&&pwForm.newPw.length>=6&&<p style={{ fontSize:12, color:"var(--primary)", marginTop:5 }}>✓ Passwords match</p>}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button type="submit" className="btn btn-primary" disabled={pwLoading||!pwForm.current||!pwForm.newPw||!pwForm.confirm}>
                  {pwLoading?<><span className="spin">⟳</span> Updating...</>:"Update Password"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setActiveTab("upcoming")}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="card mt-24" style={{ background:"#fff8e1", border:"1px solid #fde68a" }}>
          <h3 style={{ fontFamily:"var(--font-display)", fontSize:15, color:"#92400e", marginBottom:10 }}>🔒 Trainer Reminders</h3>
          {["Never request payment or contact outside Mitabhukta.","Mark sessions complete promptly after each session.","Maintain professional conduct at all times.","Contact support@mitabhukta.com for any issues."].map((r,i) => (
            <div key={i} style={{ display:"flex", gap:8, fontSize:13, color:"#92400e", marginBottom:6 }}><span>⚠️</span>{r}</div>
          ))}
        </div>
      </div>
    </div>
  );
}