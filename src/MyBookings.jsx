import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { TRAINERS_DATA } from "./Trainers";

const TIME_SLOTS = ["7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM","6:00 PM","7:00 PM","8:00 PM"];
const SESSION_TYPES = ["Video call","In-person"];

export default function MyBookings({ navigate }) {
  const { profile } = useAuth();
  const [step, setStep]           = useState("list"); // list | book | confirm
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedDay,     setSelectedDay]     = useState("");
  const [selectedTime,    setSelectedTime]    = useState("");
  const [sessionType,     setSessionType]     = useState("Video call");
  const [notes,           setNotes]           = useState("");
  const [booked,          setBooked]          = useState(false);

  // Mock bookings for demo
  const mockBookings = profile?.bookings || [];

  function handleBook(trainer) {
    setSelectedTrainer(trainer);
    setStep("book");
  }

  function handleConfirm() {
    if (!selectedDay || !selectedTime) return;
    setStep("confirm");
  }

  function handlePayment() {
    // In production: integrate Razorpay here
    setBooked(true);
    setStep("list");
  }

  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

  return (
    <div className="page">
      <div className="page-title anim-fade-up">
        <h1>📅 My Bookings</h1>
        <p>Manage your trainer sessions and schedule</p>
      </div>

      {booked && (
        <div className="banner banner-success mb-24">
          ✅ Session booked successfully! Your trainer will confirm within 24 hours.
        </div>
      )}

      {step === "list" && (
        <>
          {mockBookings.length === 0 && (
            <div className="card text-center anim-fade-up" style={{ padding: 48, marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)", marginBottom: 8 }}>No sessions booked yet</h3>
              <p style={{ color: "var(--text-3)", marginBottom: 24, fontSize: 14 }}>Book your first session with one of our certified trainers.</p>
              <button className="btn btn-primary" onClick={() => navigate("trainers")}>Browse Trainers →</button>
            </div>
          )}

          {/* Book a session */}
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary-dark)", marginBottom: 16 }}>Book a Session</h2>
          <div className="grid-2 anim-fade-up-2">
            {TRAINERS_DATA.map(trainer => (
              <div key={trainer.id} className="card" style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: trainer.gender === "Female" ? "#fce4ec" : "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                  {trainer.typeIcon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text)", marginBottom: 2 }}>{trainer.name}</div>
                  <div style={{ fontSize: 13, color: "var(--primary)", marginBottom: 4 }}>{trainer.speciality}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 10 }}>⭐ {trainer.rating} · ₹{trainer.pricePerHour}/hr · {trainer.sessionTypes.join(", ")}</div>
                  <button className="btn btn-primary btn-sm" onClick={() => handleBook(trainer)}>Book Session</button>
                </div>
              </div>
            ))}
          </div>

          {/* Platform security reminder */}
          <div className="card mt-24" style={{ background: "#fff8e1", border: "1px solid #fde68a" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "#92400e", marginBottom: 10 }}>🔒 Booking Safety Guidelines</h3>
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

      {step === "book" && selectedTrainer && (
        <div className="card anim-scale-in" style={{ maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => setStep("list")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
            ← Back
          </button>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary-dark)", marginBottom: 4 }}>Book Session</h2>
          <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 24 }}>with {selectedTrainer.name} · ₹{selectedTrainer.pricePerHour}/hr</p>

          <div className="form-group">
            <label>Session Type</label>
            <div style={{ display: "flex", gap: 10 }}>
              {SESSION_TYPES.map(s => (
                <button key={s} onClick={() => setSessionType(s)}
                  style={{ flex: 1, padding: "10px", border: `1.5px solid ${sessionType === s ? "var(--primary)" : "var(--border)"}`, background: sessionType === s ? "var(--primary-pale)" : "#fff", borderRadius: "var(--radius-sm)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)", color: sessionType === s ? "var(--primary-dark)" : "var(--text-3)", fontWeight: sessionType === s ? 600 : 400 }}>
                  {s === "Video call" ? "📹 Video Call" : "🏃 In-Person"}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Select Day</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {days.filter(d => selectedTrainer.availableDays.includes(d.slice(0,3))).map(d => (
                <button key={d} onClick={() => setSelectedDay(d)}
                  style={{ padding: "8px 14px", borderRadius: "var(--radius-full)", border: `1.5px solid ${selectedDay === d ? "var(--primary)" : "var(--border)"}`, background: selectedDay === d ? "var(--primary)" : "#fff", color: selectedDay === d ? "#fff" : "var(--text-3)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Select Time Slot</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {TIME_SLOTS.map(t => (
                <button key={t} onClick={() => setSelectedTime(t)}
                  style={{ padding: "8px 6px", borderRadius: "var(--radius-sm)", border: `1.5px solid ${selectedTime === t ? "var(--primary)" : "var(--border)"}`, background: selectedTime === t ? "var(--primary)" : "#fff", color: selectedTime === t ? "#fff" : "var(--text-3)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Notes for Trainer (optional)</label>
            <textarea className="form-control" rows={3} placeholder="Any health conditions, goals, or specific requests..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div style={{ background: "var(--primary-pale)", borderRadius: "var(--radius-sm)", padding: 14, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
              <span style={{ color: "var(--text-3)" }}>Session fee</span>
              <span style={{ fontWeight: 600 }}>₹{selectedTrainer.pricePerHour}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
              <span style={{ color: "var(--text-3)" }}>Platform fee</span>
              <span style={{ fontWeight: 600 }}>₹0 (waived)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 6 }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 700, color: "var(--primary-dark)" }}>₹{selectedTrainer.pricePerHour}</span>
            </div>
          </div>

          <button className="btn btn-primary btn-full btn-lg" onClick={handleConfirm} disabled={!selectedDay || !selectedTime}>
            Confirm & Pay ₹{selectedTrainer.pricePerHour}
          </button>
          <p style={{ fontSize: 12, color: "var(--text-4)", textAlign: "center", marginTop: 10 }}>🔒 Secure payment via Razorpay. Trainer gets paid only after session completion.</p>
        </div>
      )}

      {step === "confirm" && selectedTrainer && (
        <div className="card anim-scale-in" style={{ maxWidth: 480, margin: "0 auto", textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--primary-dark)", marginBottom: 8 }}>Confirm Your Booking</h2>
          <div style={{ background: "var(--bg-muted)", borderRadius: "var(--radius-md)", padding: 20, marginBottom: 24, textAlign: "left" }}>
            {[
              ["Trainer",  selectedTrainer.name],
              ["Type",     selectedTrainer.speciality],
              ["Day",      selectedDay],
              ["Time",     selectedTime],
              ["Session",  sessionType],
              ["Amount",   `₹${selectedTrainer.pricePerHour}`],
            ].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-3)" }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ background: "#fff8e1", border: "1px solid #fde68a", borderRadius: "var(--radius-sm)", padding: 12, marginBottom: 20, fontSize: 12, color: "#92400e", textAlign: "left" }}>
            ⚠️ By confirming, you agree to our platform guidelines. All communication must happen through NourishAI only.
          </div>
          <button className="btn btn-primary btn-full btn-lg" onClick={handlePayment}>
            Pay ₹{selectedTrainer.pricePerHour} via Razorpay
          </button>
          <p style={{ fontSize: 11, color: "var(--text-4)", marginTop: 10 }}>Razorpay integration coming soon. This is a demo booking.</p>
          <button className="btn btn-ghost btn-sm mt-12" onClick={() => setStep("book")}>← Go back</button>
        </div>
      )}
    </div>
  );
}
