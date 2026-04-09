import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { TRAINERS_DATA } from "./Trainers";

const TIME_SLOTS = ["7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM","6:00 PM","7:00 PM","8:00 PM"];
const SESSION_TYPES = ["Video call","In-person"];

// ─── Get next 14 days with day name and date ──────────────────────────────────
function getNext14Days() {
  const days = [];
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      fullDay:   ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()],
      shortDay:  dayNames[d.getDay()],
      date:      d.getDate(),
      month:     monthNames[d.getMonth()],
      year:      d.getFullYear(),
      label:     `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`,
      iso:       d.toISOString().split("T")[0],
    });
  }
  return days;
}

export default function MyBookings({ navigate }) {
  const { profile } = useAuth();
  const [step,            setStep]            = useState("list");
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedDate,    setSelectedDate]    = useState(null);
  const [selectedTime,    setSelectedTime]    = useState("");
  const [sessionType,     setSessionType]     = useState("Video call");
  const [notes,           setNotes]           = useState("");
  const [showSuccess,     setShowSuccess]     = useState(false);
  const [lastBooked,      setLastBooked]      = useState(null);

  // Persist bookings in localStorage so they survive page refresh
  const STORAGE_KEY = `nourishai_bookings_${profile?.uid || "guest"}`;
  const [myBookings, setMyBookings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(myBookings)); }
    catch {}
  }, [myBookings, STORAGE_KEY]);

  const availableDates = getNext14Days();

  function getTrainerDates(trainer) {
    return availableDates.filter(d => trainer.availableDays.includes(d.shortDay) || trainer.availableDays.includes(d.fullDay));
  }

  function handleBook(trainer) {
    setSelectedTrainer(trainer);
    setSelectedDate(null);
    setSelectedTime("");
    setSessionType("Video call");
    setNotes("");
    setStep("book");
  }

  function handleConfirm() {
    if (!selectedDate || !selectedTime) return;
    setStep("confirm");
  }

  function handlePayment() {
    const booking = {
      id:          Date.now().toString(),
      trainerId:   selectedTrainer.id,
      trainerName: selectedTrainer.name,
      trainerIcon: selectedTrainer.typeIcon,
      trainerGender: selectedTrainer.gender,
      speciality:  selectedTrainer.speciality,
      type:        selectedTrainer.type,
      price:       selectedTrainer.pricePerHour,
      dateLabel:   selectedDate.label,
      dateIso:     selectedDate.iso,
      time:        selectedTime,
      sessionType,
      notes,
      status:      "Confirmed",
      bookedAt:    new Date().toLocaleString("en-IN"),
    };
    const updated = [booking, ...myBookings];
    setMyBookings(updated);
    setLastBooked(booking);
    setShowSuccess(true);
    setStep("list");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="page">
      <div className="page-title anim-fade-up">
        <h1>📅 My Bookings</h1>
        <p>Manage your trainer sessions and schedule</p>
      </div>

      {/* Success banner */}
      {showSuccess && lastBooked && (
        <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "var(--radius-md)", padding: 20, marginBottom: 24 }} className="anim-scale-in">
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ fontSize: 36 }}>🎉</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#14532d", marginBottom: 6 }}>Session Booked Successfully!</div>
              <div style={{ fontSize: 14, color: "#15803d", marginBottom: 12, lineHeight: 1.6 }}>
                Your <strong>{lastBooked.sessionType}</strong> session with <strong>{lastBooked.trainerName}</strong> on{" "}
                <strong>{lastBooked.dateLabel}</strong> at <strong>{lastBooked.time}</strong> is confirmed.
              </div>
              <div style={{ background: "#dcfce7", borderRadius: "var(--radius-sm)", padding: "10px 14px", fontSize: 13, color: "#14532d" }}>
                📧 Confirmation sent to <strong>{profile?.email}</strong>. Your trainer will reach out within 24 hours with session details.
              </div>
            </div>
            <button onClick={() => setShowSuccess(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#15803d", fontSize: 20 }}>✕</button>
          </div>
        </div>
      )}

      {step === "list" && (
        <>
          {/* Upcoming sessions */}
          {myBookings.length > 0 && (
            <div style={{ marginBottom: 32 }} className="anim-fade-up">
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)", marginBottom: 16 }}>Your Upcoming Sessions</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {myBookings.map(b => (
                  <div key={b.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: b.trainerGender === "Female" ? "#fce4ec" : "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                        {b.trainerIcon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text)", marginBottom: 2 }}>{b.trainerName}</div>
                        <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 2 }}>
                          📅 {b.dateLabel} · ⏰ {b.time}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-4)" }}>
                          {b.sessionType} · {b.speciality}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 11, background: "#dcfce7", color: "#14532d", padding: "4px 12px", borderRadius: "var(--radius-full)", fontWeight: 700 }}>
                        ✅ {b.status}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--primary-dark)" }}>₹{b.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {myBookings.length === 0 && (
            <div className="card text-center anim-fade-up" style={{ padding: 48, marginBottom: 28 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)", marginBottom: 8 }}>No sessions booked yet</h3>
              <p style={{ color: "var(--text-3)", marginBottom: 24, fontSize: 14 }}>Book your first session with one of our certified trainers below.</p>
            </div>
          )}

          {/* Book a session */}
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)", marginBottom: 16 }}>Book a Session</h2>
          <div className="grid-2 anim-fade-up-2">
            {TRAINERS_DATA.map(trainer => (
              <div key={trainer.id} className="card card-hover" style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: trainer.gender === "Female" ? "#fce4ec" : "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                  {trainer.typeIcon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text)", marginBottom: 2 }}>{trainer.name}</div>
                  <div style={{ fontSize: 13, color: "var(--primary)", marginBottom: 2 }}>{trainer.type} · {trainer.speciality}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 10 }}>
                    ⭐ {trainer.rating} · ₹{trainer.pricePerHour}/hr · {trainer.sessionTypes.join(", ")}
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => handleBook(trainer)}>
                    Book Session
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Safety reminder */}
          <div className="card mt-24" style={{ background: "#fff8e1", border: "1px solid #fde68a" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "#92400e", marginBottom: 10 }}>🔒 Booking Safety Guidelines</h3>
            {[
              "Always book sessions through NourishAI — never pay trainers directly.",
              "Do not share your personal phone number or social media with trainers.",
              "All video sessions use secure links provided by NourishAI.",
              "Report any trainer who asks for direct payment or personal contact.",
            ].map((rule, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#92400e", marginBottom: 6 }}>
                <span>⚠️</span> {rule}
              </div>
            ))}
            <button onClick={() => navigate("guidelines")} style={{ background: "none", border: "none", color: "#92400e", fontWeight: 700, cursor: "pointer", fontSize: 13, marginTop: 8, padding: 0 }}>
              Read full platform guidelines →
            </button>
          </div>
        </>
      )}

      {/* Step 2 — Book */}
      {step === "book" && selectedTrainer && (
        <div className="card anim-scale-in" style={{ maxWidth: 640, margin: "0 auto" }}>
          <button onClick={() => setStep("list")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
            ← Back
          </button>

          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: selectedTrainer.gender === "Female" ? "#fce4ec" : "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
              {selectedTrainer.typeIcon}
            </div>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)", marginBottom: 2 }}>Book with {selectedTrainer.name}</h2>
              <p style={{ fontSize: 13, color: "var(--text-3)" }}>{selectedTrainer.speciality} · ₹{selectedTrainer.pricePerHour}/hr</p>
            </div>
          </div>

          {/* Session type */}
          <div className="form-group">
            <label>Session Type</label>
            <div style={{ display: "flex", gap: 10 }}>
              {SESSION_TYPES.map(s => (
                <button key={s} type="button" onClick={() => setSessionType(s)}
                  style={{ flex: 1, padding: "12px", border: `1.5px solid ${sessionType === s ? "var(--primary)" : "var(--border)"}`, background: sessionType === s ? "var(--primary-pale)" : "#fff", borderRadius: "var(--radius-sm)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)", color: sessionType === s ? "var(--primary-dark)" : "var(--text-3)", fontWeight: sessionType === s ? 600 : 400, transition: "var(--transition)" }}>
                  {s === "Video call" ? "📹 Video Call" : "🏃 In-Person"}
                </button>
              ))}
            </div>
          </div>

          {/* Date selection with actual dates */}
          <div className="form-group">
            <label>Select Date <span style={{ color: "var(--red-500)" }}>*</span></label>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
              {getTrainerDates(selectedTrainer).map(d => (
                <button key={d.iso} type="button" onClick={() => setSelectedDate(d)}
                  style={{ flexShrink: 0, padding: "10px 14px", borderRadius: "var(--radius-md)", border: `1.5px solid ${selectedDate?.iso === d.iso ? "var(--primary)" : "var(--border)"}`, background: selectedDate?.iso === d.iso ? "var(--primary)" : "#fff", color: selectedDate?.iso === d.iso ? "#fff" : "var(--text)", cursor: "pointer", fontFamily: "var(--font-body)", textAlign: "center", transition: "var(--transition)", minWidth: 64 }}>
                  <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>{d.shortDay}</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{d.date}</div>
                  <div style={{ fontSize: 10, opacity: 0.8 }}>{d.month}</div>
                </button>
              ))}
            </div>
            {selectedDate && <p style={{ fontSize: 12, color: "var(--primary)", marginTop: 8 }}>✓ {selectedDate.label} selected</p>}
          </div>

          {/* Time selection */}
          <div className="form-group">
            <label>Select Time Slot <span style={{ color: "var(--red-500)" }}>*</span></label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {TIME_SLOTS.map(t => (
                <button key={t} type="button" onClick={() => setSelectedTime(t)}
                  style={{ padding: "10px 6px", borderRadius: "var(--radius-sm)", border: `1.5px solid ${selectedTime === t ? "var(--primary)" : "var(--border)"}`, background: selectedTime === t ? "var(--primary)" : "#fff", color: selectedTime === t ? "#fff" : "var(--text-3)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: selectedTime === t ? 600 : 400, transition: "var(--transition)" }}>
                  {t}
                </button>
              ))}
            </div>
            {selectedTime && <p style={{ fontSize: 12, color: "var(--primary)", marginTop: 8 }}>✓ {selectedTime} selected</p>}
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>Notes for Trainer (optional)</label>
            <textarea className="form-control" rows={3}
              placeholder="Any health conditions, goals, or specific requests..."
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          {/* Price summary */}
          <div style={{ background: "var(--primary-pale)", borderRadius: "var(--radius-sm)", padding: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
              <span style={{ color: "var(--text-3)" }}>Session fee</span>
              <span style={{ fontWeight: 600 }}>₹{selectedTrainer.pricePerHour}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
              <span style={{ color: "var(--text-3)" }}>Platform fee</span>
              <span style={{ fontWeight: 600, color: "var(--primary)" }}>₹0 (waived)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 4 }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 700, color: "var(--primary-dark)" }}>₹{selectedTrainer.pricePerHour}</span>
            </div>
          </div>

          <button className="btn btn-primary btn-full btn-lg" onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime}>
            {(!selectedDate || !selectedTime) ? "Please select date & time to continue" : "Continue to Review →"}
          </button>
          <p style={{ fontSize: 12, color: "var(--text-4)", textAlign: "center", marginTop: 10 }}>
            🔒 Secure payment via Razorpay. Trainer gets paid only after session completion.
          </p>
        </div>
      )}

      {/* Step 3 — Confirm */}
      {step === "confirm" && selectedTrainer && selectedDate && (
        <div className="card anim-scale-in" style={{ maxWidth: 500, margin: "0 auto", padding: 36 }}>
          <button onClick={() => setStep("book")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 14, marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>
            ← Back
          </button>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary-dark)", marginBottom: 6 }}>Confirm Your Booking</h2>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>Review details before payment</p>
          </div>

          <div style={{ background: "var(--bg-muted)", borderRadius: "var(--radius-md)", padding: 20, marginBottom: 20 }}>
            {[
              ["Trainer",     selectedTrainer.name],
              ["Speciality",  selectedTrainer.speciality],
              ["Date",        selectedDate.label],
              ["Time",        selectedTime],
              ["Session",     sessionType],
              ["Amount",      `₹${selectedTrainer.pricePerHour}`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-3)" }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>

          {notes && (
            <div style={{ background: "#f0fdf4", borderRadius: "var(--radius-sm)", padding: 12, marginBottom: 16, fontSize: 13, color: "#15803d" }}>
              📝 Notes to trainer: {notes}
            </div>
          )}

          <div style={{ background: "#fff8e1", border: "1px solid #fde68a", borderRadius: "var(--radius-sm)", padding: 12, marginBottom: 16, fontSize: 12, color: "#92400e" }}>
            ⚠️ By confirming, you agree to our{" "}
            <button onClick={() => navigate("guidelines")} style={{ background: "none", border: "none", color: "#92400e", fontWeight: 700, cursor: "pointer", fontSize: 12, textDecoration: "underline" }}>platform guidelines</button>.
            All communication must happen through NourishAI only.
          </div>

          <div style={{ background: "var(--primary-pale)", borderRadius: "var(--radius-sm)", padding: 12, marginBottom: 20, fontSize: 13, color: "var(--primary-dark)" }}>
            📧 Confirmation will be sent to <strong>{profile?.email}</strong>
          </div>

          <button className="btn btn-primary btn-full btn-lg" onClick={handlePayment}>
            Pay ₹{selectedTrainer.pricePerHour} & Confirm Booking
          </button>
          <p style={{ fontSize: 11, color: "var(--text-4)", textAlign: "center", marginTop: 10 }}>
            Razorpay integration coming soon. This confirms your demo booking.
          </p>
        </div>
      )}
    </div>
  );
}