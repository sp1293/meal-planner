import { useState, useEffect } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const TIME_SLOTS    = ["7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM","6:00 PM","7:00 PM","8:00 PM"];
const SESSION_TYPES = ["Video call","In-person"];
const API = process.env.REACT_APP_API_URL?.replace("/api/meal-plan","") || "https://meal-planner-backend-0ul2.onrender.com";
const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_SdZk5BUyxiup3p";

function getNext14Days() {
  const days = [];
  const dayNames   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      fullDay:  ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()],
      shortDay: dayNames[d.getDay()],
      date:     d.getDate(),
      month:    monthNames[d.getMonth()],
      year:     d.getFullYear(),
      label:    `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`,
      iso:      d.toISOString().split("T")[0],
    });
  }
  return days;
}

function getCancellationFee(booking) {
  const [year, month, day] = booking.dateIso.split("-").map(Number);
  const time24 = convertTo24(booking.time);
  const [hours, minutes] = time24.split(":").map(Number);
  const sessionDateTime = new Date(year, month - 1, day, hours, minutes, 0);
  const hoursUntil = (sessionDateTime - new Date()) / (1000 * 60 * 60);
  if (hoursUntil >= 12) return { fee: 0, pct: 0, label: "Full refund", color: "#15803d", refund: booking.price };
  if (hoursUntil >= 6)  return { fee: Math.round(booking.price * 0.10), pct: 10, label: "10% cancellation fee", color: "#d97706", refund: Math.round(booking.price * 0.90) };
  if (hoursUntil >= 1)  return { fee: Math.round(booking.price * 0.20), pct: 20, label: "20% cancellation fee", color: "#ea580c", refund: Math.round(booking.price * 0.80) };
  return { fee: Math.round(booking.price * 0.50), pct: 50, label: "50% cancellation fee", color: "#dc2626", refund: Math.round(booking.price * 0.50) };
}

function convertTo24(time12) {
  const [time, modifier] = time12.split(" ");
  const [hoursStr, minutes] = time.split(":");
  let h = parseInt(hoursStr, 10);
  if (modifier === "AM") { if (h === 12) h = 0; }
  else { if (h !== 12) h += 12; }
  return `${String(h).padStart(2,"0")}:${minutes||"00"}:00`;
}

function downloadCalendar(booking) {
  const [year, month, day] = booking.dateIso.split("-").map(Number);
  const [h, m] = convertTo24(booking.time).split(":").map(Number);
  function pad(n) { return String(n).padStart(2,"0"); }
  const startDt = `${year}${pad(month)}${pad(day)}T${pad(h)}${pad(m)}00`;
  const endDt   = `${year}${pad(month)}${pad(day)}T${pad(h+1)}${pad(m)}00`;
  const now = new Date().toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
  const ics = [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Mitabhukta//Session Booking//EN",
    "CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",
    `UID:${booking.id}@mitabhukta`,`DTSTAMP:${now}`,
    `DTSTART:${startDt}`,`DTEND:${endDt}`,
    `SUMMARY:Mitabhukta Session - ${booking.trainerName}`,
    `DESCRIPTION:${booking.sessionType} session with ${booking.trainerName}.\\nBooked via Mitabhukta.`,
    `LOCATION:${booking.sessionType==="Video call"?"Online - link shared by trainer":"In-Person - location shared by trainer"}`,
    "BEGIN:VALARM","TRIGGER:-PT1H","ACTION:DISPLAY",
    `DESCRIPTION:Reminder: Session with ${booking.trainerName} in 1 hour`,
    "END:VALARM","END:VEVENT","END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics],{type:"text/calendar;charset=utf-8"});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href=url; a.download=`mitabhukta-${booking.trainerName.replace(/\s/g,"-")}.ics`;
  a.click(); URL.revokeObjectURL(url);
}

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function StarRating({ value, onChange, readonly }) {
  return (
    <div style={{display:"flex",gap:4}}>
      {[1,2,3,4,5].map(star => (
        <button key={star} type="button" onClick={() => !readonly && onChange && onChange(star)}
          style={{background:"none",border:"none",fontSize:28,cursor:readonly?"default":"pointer",color:star<=value?"#f59e0b":"#d1d5db",padding:2}}>★</button>
      ))}
    </div>
  );
}

function getTypeIcon(type) {
  return {"Yoga Instructor":"🧘","Gym Trainer":"🏋️","Nutritionist":"🥗","Physiotherapist":"🩺"}[type]||"💪";
}

async function apiCall(endpoint, body) {
  const res = await fetch(`${API}/api/${endpoint}`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body),
  });
  return res.json();
}

export default function MyBookings({ navigate }) {
  const { profile, user } = useAuth();

  const [trainers,        setTrainers]        = useState([]);
  const [trainersLoading, setTrainersLoading] = useState(true);
  const [bookings,        setBookings]        = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const [step,            setStep]            = useState("list");
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedDate,    setSelectedDate]    = useState(null);
  const [selectedTime,    setSelectedTime]    = useState("");
  const [sessionType,     setSessionType]     = useState("Video call");
  const [notes,           setNotes]           = useState("");
  const [paying,          setPaying]          = useState(false);
  const [payError,        setPayError]        = useState("");
  const [showSuccess,     setShowSuccess]     = useState(false);
  const [lastBooked,      setLastBooked]      = useState(null);
  const [calDownloaded,   setCalDownloaded]   = useState(false);

  const [managingId,   setManagingId]   = useState(null);
  const [manageAction, setManageAction] = useState("");
  const [newDate,      setNewDate]      = useState(null);
  const [newTime,      setNewTime]      = useState("");
  const [updating,     setUpdating]     = useState(false);

  const [reviewingId,     setReviewingId]     = useState(null);
  const [reviewRating,    setReviewRating]    = useState(0);
  const [reviewComment,   setReviewComment]   = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const availableDates = getNext14Days();

  // Load trainers from Firestore
  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(query(collection(db,"trainers"), where("status","!=","suspended")));
        setTrainers(snap.docs.map(d=>({id:d.id,...d.data()})));
      } catch { setTrainers([]); }
      finally { setTrainersLoading(false); }
    }
    load();
  }, []);

  // Load bookings from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    async function load() {
      try {
        const snap = await getDocs(
          query(collection(db,"bookings"), where("studentId","==",user.uid))
        );
        const data = snap.docs.map(d=>({id:d.id,...d.data()}));
        // Sort by createdAt descending
        data.sort((a,b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        setBookings(data);
      } catch { setBookings([]); }
      finally { setBookingsLoading(false); }
    }
    load();
  }, [user?.uid]);

  function getTrainerDates(trainer) {
    return availableDates.filter(d =>
      (trainer.availableDays||[]).includes(d.shortDay) ||
      (trainer.availableDays||[]).includes(d.fullDay)
    );
  }

  function handleBook(trainer) {
    setSelectedTrainer(trainer); setSelectedDate(null);
    setSelectedTime(""); setSessionType("Video call"); setNotes(""); setPayError("");
    setStep("book");
  }

  // ── Payment flow: Razorpay → backend verify → Firestore save ─────────────
  async function handlePayment() {
    setPaying(true); setPayError("");
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { setPayError("Failed to load payment gateway. Please try again."); setPaying(false); return; }

      // Step 1: Create order on backend
      const orderData = await apiCall("create-booking-order", {
        studentId: user.uid,
        trainerId: selectedTrainer.id,
        price:     selectedTrainer.pricePerHour,
      });

      if (!orderData.orderId) {
        setPayError("Failed to create payment order. Please try again.");
        setPaying(false);
        return;
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key:         RAZORPAY_KEY,
        amount:      orderData.amount,
        currency:    "INR",
        name:        "Mitabhukta",
        description: `Session with ${selectedTrainer.name}`,
        image:       "/logo192.png",
        order_id:    orderData.orderId,
        prefill: {
          name:  profile?.displayName || "",
          email: user.email || "",
        },
        theme: { color: "#166534" },
        modal: {
          ondismiss: () => {
            setPaying(false);
            setPayError("Payment cancelled. Your session was not booked.");
          },
        },
        handler: async (response) => {
          // Step 3: Verify payment and save booking to Firestore via backend
          try {
            const bookingPayload = {
              studentId:     user.uid,
              studentName:   profile?.displayName || "",
              studentEmail:  user.email || "",
              trainerId:     selectedTrainer.id,
              trainerName:   selectedTrainer.name,
              trainerIcon:   selectedTrainer.typeIcon || getTypeIcon(selectedTrainer.type),
              trainerGender: selectedTrainer.gender,
              speciality:    selectedTrainer.speciality,
              type:          selectedTrainer.type,
              price:         selectedTrainer.pricePerHour,
              dateLabel:     selectedDate.label,
              dateIso:       selectedDate.iso,
              time:          selectedTime,
              sessionType,
              notes,
            };

            const result = await apiCall("verify-booking-payment", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              booking: bookingPayload,
            });

            if (result.success) {
              // Add to local state immediately
              setBookings(prev => [result.booking, ...prev]);
              setLastBooked(result.booking);
              setShowSuccess(true);
              setCalDownloaded(false);
              setStep("list");
              window.scrollTo({top:0,behavior:"smooth"});
            } else {
              setPayError("Payment verification failed. Please contact support@mitabhukta.com");
            }
          } catch {
            setPayError("Something went wrong saving your booking. Contact support@mitabhukta.com");
          } finally {
            setPaying(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setPayError("Payment failed. Please try again.");
        setPaying(false);
      });
      rzp.open();

    } catch (err) {
      console.error("Payment error:", err);
      setPayError("Something went wrong. Please try again.");
      setPaying(false);
    }
  }

  // ── Update booking via backend ────────────────────────────────────────────
  async function updateBooking(bookingId, updates) {
    setUpdating(true);
    try {
      const result = await apiCall("update-booking", {
        bookingId,
        updates,
        studentId: user.uid,
      });
      if (result.success) {
        setBookings(prev => prev.map(b => b.id === bookingId ? {...b, ...updates} : b));
      }
      return result.success;
    } catch {
      return false;
    } finally {
      setUpdating(false);
    }
  }

  function openManage(booking, action) {
    setManagingId(booking.id); setManageAction(action);
    setNewDate(null); setNewTime("");
  }

  async function handleReschedule() {
    if (!newDate || !newTime) return;
    const ok = await updateBooking(managingId, {
      status:    "Rescheduled",
      dateLabel: newDate.label,
      dateIso:   newDate.iso,
      time:      newTime,
    });
    if (ok) {
      setLastBooked({...bookings.find(b=>b.id===managingId), dateLabel: newDate.label, time: newTime});
      setShowSuccess(true);
      setManagingId(null); setManageAction("");
    }
  }

  async function handleCancel() {
    const ok = await updateBooking(managingId, { status: "Cancelled" });
    if (ok) { setManagingId(null); setManageAction(""); }
  }

  async function submitReview() {
    if (!reviewRating) return;
    const review = { rating: reviewRating, comment: reviewComment, submittedAt: new Date().toLocaleString("en-IN") };
    const ok = await updateBooking(reviewingId, { review });
    if (ok) {
      setReviewSubmitted(true);
      setTimeout(() => {
        setReviewingId(null); setReviewRating(0); setReviewComment(""); setReviewSubmitted(false);
      }, 2000);
    }
  }

  const managingBooking  = bookings.find(b => b.id === managingId);
  const managingTrainer  = managingBooking ? trainers.find(t => t.id === managingBooking.trainerId) : null;
  const cancelFee        = managingBooking ? getCancellationFee(managingBooking) : null;
  const reviewingBooking = bookings.find(b => b.id === reviewingId);

  const activeBookings    = bookings.filter(b => b.status === "Confirmed" || b.status === "Rescheduled");
  const completedBookings = bookings.filter(b => b.status === "Completed");
  const cancelledBookings = bookings.filter(b => b.status === "Cancelled");

  return (
    <div className="page">
      <div className="page-title anim-fade-up">
        <h1>📅 My Bookings</h1>
        <p>Manage your trainer sessions and schedule</p>
      </div>

      {/* Success banner */}
      {showSuccess && lastBooked && (
        <div style={{background:"#f0fdf4",border:"1.5px solid #86efac",borderRadius:"var(--radius-md)",padding:20,marginBottom:24}} className="anim-scale-in">
          <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
            <div style={{fontSize:36}}>🎉</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:16,color:"#14532d",marginBottom:6}}>
                {manageAction==="reschedule" ? "Session Rescheduled!" : "Session Booked & Payment Confirmed!"}
              </div>
              <div style={{fontSize:14,color:"#15803d",marginBottom:12,lineHeight:1.6}}>
                Your session with <strong>{lastBooked.trainerName}</strong> on{" "}
                <strong>{lastBooked.dateLabel}</strong> at <strong>{lastBooked.time}</strong> is confirmed.
              </div>
              <div style={{background:"#dcfce7",borderRadius:"var(--radius-sm)",padding:12,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontSize:13,color:"#14532d"}}>📅 Add to your calendar!</span>
                <button onClick={()=>{downloadCalendar(lastBooked);setCalDownloaded(true);}}
                  style={{padding:"7px 16px",background:calDownloaded?"#15803d":"#fff",color:calDownloaded?"#fff":"#15803d",border:"1.5px solid #15803d",borderRadius:"var(--radius-sm)",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"var(--font-body)"}}>
                  {calDownloaded?"✅ Added!":"📥 Add to Calendar"}
                </button>
              </div>
            </div>
            <button onClick={()=>{setShowSuccess(false);setManageAction("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#15803d",fontSize:20}}>✕</button>
          </div>
        </div>
      )}

      {/* Manage / Review Modal */}
      {(managingId || reviewingId) && (
        <div onClick={()=>{setManagingId(null);setReviewingId(null);}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"var(--bg-card)",borderRadius:"var(--radius-lg)",padding:28,maxWidth:540,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>

            {/* Cancel */}
            {manageAction==="cancel" && managingBooking && (
              <>
                <h2 style={{fontFamily:"var(--font-display)",fontSize:20,color:"var(--primary-dark)",marginBottom:6}}>Cancel Session</h2>
                <p style={{fontSize:14,color:"var(--text-3)",marginBottom:20}}>with {managingBooking.trainerName} · {managingBooking.dateLabel} at {managingBooking.time}</p>
                <div style={{background:cancelFee?.pct===0?"#f0fdf4":"#fff8e1",border:`1px solid ${cancelFee?.pct===0?"#86efac":"#fde68a"}`,borderRadius:"var(--radius-md)",padding:16,marginBottom:20}}>
                  <div style={{fontWeight:700,fontSize:15,color:cancelFee?.color,marginBottom:10}}>
                    {cancelFee?.pct===0?"✅":"⚠️"} {cancelFee?.label}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:6}}>
                    <span style={{color:"var(--text-3)"}}>Session amount</span>
                    <span style={{fontWeight:600}}>₹{managingBooking.price}</span>
                  </div>
                  {cancelFee?.pct>0 && (
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:6}}>
                      <span style={{color:"var(--text-3)"}}>Cancellation fee ({cancelFee.pct}%)</span>
                      <span style={{fontWeight:600,color:"var(--red-500)"}}>−₹{cancelFee.fee}</span>
                    </div>
                  )}
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:15,borderTop:"1px solid var(--border)",paddingTop:10,marginTop:6}}>
                    <span style={{fontWeight:700}}>Refund amount</span>
                    <span style={{fontWeight:700,color:cancelFee?.color}}>₹{cancelFee?.refund}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button className="btn btn-danger" style={{flex:1}} onClick={handleCancel} disabled={updating}>
                    {updating?"Cancelling...":"Confirm Cancellation"}
                  </button>
                  <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setManagingId(null)}>Keep Booking</button>
                </div>
              </>
            )}

            {/* Reschedule */}
            {manageAction==="reschedule" && managingBooking && managingTrainer && (
              <>
                <h2 style={{fontFamily:"var(--font-display)",fontSize:20,color:"var(--primary-dark)",marginBottom:6}}>Reschedule Session</h2>
                <p style={{fontSize:14,color:"var(--text-3)",marginBottom:20}}>with {managingBooking.trainerName} · currently {managingBooking.dateLabel} at {managingBooking.time}</p>
                <div className="form-group">
                  <label>New Date</label>
                  <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8}}>
                    {getTrainerDates(managingTrainer).map(d=>(
                      <button key={d.iso} type="button" onClick={()=>setNewDate(d)}
                        style={{flexShrink:0,padding:"10px 14px",borderRadius:"var(--radius-md)",border:`1.5px solid ${newDate?.iso===d.iso?"var(--primary)":"var(--border)"}`,background:newDate?.iso===d.iso?"var(--primary)":"#fff",color:newDate?.iso===d.iso?"#fff":"var(--text)",cursor:"pointer",textAlign:"center",minWidth:64,fontFamily:"var(--font-body)"}}>
                        <div style={{fontSize:11,opacity:0.8,marginBottom:2}}>{d.shortDay}</div>
                        <div style={{fontSize:18,fontWeight:700}}>{d.date}</div>
                        <div style={{fontSize:10,opacity:0.8}}>{d.month}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>New Time Slot</label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                    {TIME_SLOTS.map(t=>(
                      <button key={t} type="button" onClick={()=>setNewTime(t)}
                        style={{padding:"10px 6px",borderRadius:"var(--radius-sm)",border:`1.5px solid ${newTime===t?"var(--primary)":"var(--border)"}`,background:newTime===t?"var(--primary)":"#fff",color:newTime===t?"#fff":"var(--text-3)",fontSize:12,cursor:"pointer",fontFamily:"var(--font-body)"}}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button className="btn btn-primary" style={{flex:1}} onClick={handleReschedule} disabled={!newDate||!newTime||updating}>
                    {updating?"Rescheduling...":"Confirm Reschedule"}
                  </button>
                  <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setManagingId(null)}>Cancel</button>
                </div>
              </>
            )}

            {manageAction==="reschedule" && managingBooking && !managingTrainer && (
              <div style={{textAlign:"center",padding:24}}>
                <p style={{color:"var(--text-3)"}}>Trainer details unavailable. Contact support@mitabhukta.com</p>
                <button className="btn btn-ghost mt-16" onClick={()=>setManagingId(null)}>Close</button>
              </div>
            )}

            {/* Review */}
            {reviewingId && reviewingBooking && (
              <>
                <h2 style={{fontFamily:"var(--font-display)",fontSize:20,color:"var(--primary-dark)",marginBottom:6}}>⭐ Rate Your Session</h2>
                <p style={{fontSize:14,color:"var(--text-3)",marginBottom:20}}>with {reviewingBooking.trainerName} · {reviewingBooking.dateLabel}</p>
                {reviewSubmitted ? (
                  <div style={{textAlign:"center",padding:32}}>
                    <div style={{fontSize:48,marginBottom:12}}>🎉</div>
                    <div style={{fontWeight:700,fontSize:18,color:"var(--primary-dark)"}}>Review Submitted!</div>
                  </div>
                ) : reviewingBooking.review ? (
                  <div>
                    <StarRating value={reviewingBooking.review.rating} readonly />
                    {reviewingBooking.review.comment && (
                      <div style={{background:"var(--bg-muted)",borderRadius:"var(--radius-sm)",padding:14,fontSize:14,color:"var(--text-2)",margin:"12px 0"}}>"{reviewingBooking.review.comment}"</div>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={()=>setReviewingId(null)}>Close</button>
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Your Rating *</label>
                      <StarRating value={reviewRating} onChange={setReviewRating} />
                      {reviewRating>0 && <p style={{fontSize:12,color:"var(--primary)",marginTop:6}}>{["","😞 Poor","😐 Fair","🙂 Good","😊 Very Good","🤩 Excellent"][reviewRating]}</p>}
                    </div>
                    <div className="form-group">
                      <label>Comment (optional)</label>
                      <textarea className="form-control" rows={3} placeholder="Share your experience..."
                        value={reviewComment} onChange={e=>setReviewComment(e.target.value.slice(0,400))} />
                      <p style={{fontSize:11,color:"var(--text-4)",marginTop:4}}>{reviewComment.length}/400</p>
                    </div>
                    <div style={{display:"flex",gap:10}}>
                      <button className="btn btn-primary" style={{flex:1}} onClick={submitReview} disabled={!reviewRating||updating}>Submit Review</button>
                      <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setReviewingId(null)}>Cancel</button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {step==="list" && (
        <>
          {bookingsLoading ? (
            <div style={{textAlign:"center",padding:32}}>
              <span className="spin" style={{fontSize:28}}>⟳</span>
              <p style={{marginTop:10,color:"var(--text-3)"}}>Loading your bookings...</p>
            </div>
          ) : (
            <>
              {/* Active bookings */}
              {activeBookings.length>0 && (
                <div style={{marginBottom:32}} className="anim-fade-up">
                  <h2 style={{fontFamily:"var(--font-display)",fontSize:20,color:"var(--primary-dark)",marginBottom:16}}>Your Upcoming Sessions</h2>
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    {activeBookings.map(b=>(
                      <div key={b.id} className="card">
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                          <div style={{display:"flex",gap:14,alignItems:"center"}}>
                            <div style={{width:48,height:48,borderRadius:"50%",background:b.trainerGender==="Female"?"#fce4ec":"#e8f5e9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{b.trainerIcon}</div>
                            <div>
                              <div style={{fontWeight:600,fontSize:15,color:"var(--text)",marginBottom:2}}>{b.trainerName}</div>
                              <div style={{fontSize:13,color:"var(--text-3)",marginBottom:2}}>📅 {b.dateLabel} · ⏰ {b.time}</div>
                              <div style={{fontSize:12,color:"var(--text-4)"}}>{b.sessionType} · {b.speciality}</div>
                            </div>
                          </div>
                          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                            <span style={{fontSize:11,background:b.status==="Rescheduled"?"#dbeafe":"#dcfce7",color:b.status==="Rescheduled"?"#1d4ed8":"#14532d",padding:"4px 12px",borderRadius:"var(--radius-full)",fontWeight:700}}>
                              {b.status==="Rescheduled"?"🔄":"✅"} {b.status}
                            </span>
                            <span style={{fontSize:14,fontWeight:700,color:"var(--primary-dark)"}}>₹{b.price}</span>
                            <button className="btn btn-ghost btn-sm" onClick={()=>downloadCalendar(b)}>📅</button>
                            <button className="btn btn-ghost btn-sm" onClick={()=>openManage(b,"reschedule")}>🔄 Reschedule</button>
                            <button style={{fontSize:12,background:"#fff5f5",color:"var(--red-500)",border:"1px solid #fecaca",borderRadius:"var(--radius-xs)",padding:"6px 12px",cursor:"pointer",fontFamily:"var(--font-body)"}}
                              onClick={()=>openManage(b,"cancel")}>✕ Cancel</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed */}
              {completedBookings.length>0 && (
                <div style={{marginBottom:32}}>
                  <h2 style={{fontFamily:"var(--font-display)",fontSize:20,color:"var(--primary-dark)",marginBottom:16}}>Completed Sessions</h2>
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    {completedBookings.map(b=>(
                      <div key={b.id} className="card">
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                          <div style={{display:"flex",gap:14,alignItems:"center"}}>
                            <div style={{width:48,height:48,borderRadius:"50%",background:b.trainerGender==="Female"?"#fce4ec":"#e8f5e9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{b.trainerIcon}</div>
                            <div>
                              <div style={{fontWeight:600,fontSize:15,color:"var(--text)",marginBottom:2}}>{b.trainerName}</div>
                              <div style={{fontSize:13,color:"var(--text-3)",marginBottom:2}}>📅 {b.dateLabel} · ⏰ {b.time}</div>
                              {b.review && <div style={{display:"flex",gap:4,marginTop:4}}>{[1,2,3,4,5].map(s=><span key={s} style={{fontSize:14,color:s<=b.review.rating?"#f59e0b":"#d1d5db"}}>★</span>)}</div>}
                            </div>
                          </div>
                          <div style={{display:"flex",gap:8,alignItems:"center"}}>
                            <span style={{fontSize:11,background:"#dcfce7",color:"#14532d",padding:"4px 12px",borderRadius:"var(--radius-full)",fontWeight:700}}>✅ Completed</span>
                            <button className="btn btn-primary btn-sm" onClick={()=>{setReviewingId(b.id);setReviewRating(b.review?.rating||0);setReviewComment(b.review?.comment||"");}}>
                              {b.review?"View Review":"⭐ Rate Session"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cancelled */}
              {cancelledBookings.length>0 && (
                <div style={{marginBottom:32}}>
                  <h2 style={{fontFamily:"var(--font-display)",fontSize:18,color:"var(--text-3)",marginBottom:12}}>Cancelled Sessions</h2>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {cancelledBookings.map(b=>(
                      <div key={b.id} style={{background:"#fafafa",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,opacity:0.7}}>
                        <div style={{display:"flex",gap:12,alignItems:"center"}}>
                          <div style={{fontSize:22}}>{b.trainerIcon}</div>
                          <div>
                            <div style={{fontWeight:500,fontSize:14,color:"var(--text-3)"}}>{b.trainerName}</div>
                            <div style={{fontSize:12,color:"var(--text-4)"}}>{b.dateLabel} · {b.time}</div>
                          </div>
                        </div>
                        <span style={{fontSize:11,background:"#fee2e2",color:"#991b1b",padding:"3px 10px",borderRadius:"var(--radius-full)",fontWeight:700}}>❌ Cancelled</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bookings.length===0 && (
                <div className="card text-center anim-fade-up" style={{padding:48,marginBottom:28}}>
                  <div style={{fontSize:48,marginBottom:16}}>📅</div>
                  <h3 style={{fontFamily:"var(--font-display)",fontSize:20,color:"var(--primary-dark)",marginBottom:8}}>No sessions booked yet</h3>
                  <p style={{color:"var(--text-3)",marginBottom:24,fontSize:14}}>Book your first session with one of our certified trainers below.</p>
                </div>
              )}
            </>
          )}

          {/* Book a session */}
          <h2 style={{fontFamily:"var(--font-display)",fontSize:20,color:"var(--primary-dark)",marginBottom:16}}>Book a Session</h2>
          {RAZORPAY_KEY.startsWith("rzp_test_") && (
            <div style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:"var(--radius-sm)",padding:"10px 16px",marginBottom:16,fontSize:13,color:"#92400e"}}>
              🧪 <strong>Test Mode:</strong> Use card <code>4111 1111 1111 1111</code>, any future expiry, any CVV, OTP: 123456
            </div>
          )}

          {trainersLoading ? (
            <div style={{textAlign:"center",padding:32}}>
              <span className="spin" style={{fontSize:28}}>⟳</span>
              <p style={{marginTop:10,color:"var(--text-3)"}}>Loading trainers...</p>
            </div>
          ) : trainers.length===0 ? (
            <div className="card text-center" style={{padding:32}}>
              <p style={{color:"var(--text-3)"}}>No trainers available at the moment. Check back soon!</p>
            </div>
          ) : (
            <div className="grid-2 anim-fade-up-2">
              {trainers.map(trainer=>(
                <div key={trainer.id} className="card card-hover" style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                  <div style={{width:52,height:52,borderRadius:"50%",background:trainer.gender==="Female"?"#fce4ec":"#e8f5e9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>
                    {trainer.typeIcon||getTypeIcon(trainer.type)}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:15,color:"var(--text)",marginBottom:2}}>{trainer.name}</div>
                    <div style={{fontSize:13,color:"var(--primary)",marginBottom:2}}>{trainer.type} · {trainer.speciality}</div>
                    <div style={{fontSize:12,color:"var(--text-3)",marginBottom:10}}>⭐ {trainer.rating||"New"} · ₹{trainer.pricePerHour}/hr · {(trainer.sessionTypes||[]).join(", ")}</div>
                    <button className="btn btn-primary btn-sm" onClick={()=>handleBook(trainer)}>Book Session</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card mt-24" style={{background:"#fff8e1",border:"1px solid #fde68a"}}>
            <h3 style={{fontFamily:"var(--font-display)",fontSize:15,color:"#92400e",marginBottom:10}}>🔒 Booking Safety Guidelines</h3>
            {["Always book sessions through Mitabhukta — never pay trainers directly.","Do not share your personal phone number or social media with trainers.","All video sessions use secure links provided by Mitabhukta.","Report any trainer who asks for direct payment or personal contact."].map((rule,i)=>(
              <div key={i} style={{display:"flex",gap:8,fontSize:13,color:"#92400e",marginBottom:6}}><span>⚠️</span>{rule}</div>
            ))}
            <button onClick={()=>navigate("guidelines")} style={{background:"none",border:"none",color:"#92400e",fontWeight:700,cursor:"pointer",fontSize:13,marginTop:8,padding:0}}>Read full platform guidelines →</button>
          </div>
        </>
      )}

      {/* Step 2 — Book */}
      {step==="book" && selectedTrainer && (
        <div className="card anim-scale-in" style={{maxWidth:640,margin:"0 auto"}}>
          <button onClick={()=>setStep("list")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-3)",fontSize:14,marginBottom:20,display:"flex",alignItems:"center",gap:6}}>← Back</button>
          <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:24,paddingBottom:20,borderBottom:"1px solid var(--border)"}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:selectedTrainer.gender==="Female"?"#fce4ec":"#e8f5e9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>
              {selectedTrainer.typeIcon||getTypeIcon(selectedTrainer.type)}
            </div>
            <div>
              <h2 style={{fontFamily:"var(--font-display)",fontSize:20,color:"var(--primary-dark)",marginBottom:2}}>Book with {selectedTrainer.name}</h2>
              <p style={{fontSize:13,color:"var(--text-3)"}}>{selectedTrainer.speciality} · ₹{selectedTrainer.pricePerHour}/hr</p>
            </div>
          </div>

          <div className="form-group">
            <label>Session Type</label>
            <div style={{display:"flex",gap:10}}>
              {SESSION_TYPES.map(s=>(
                <button key={s} type="button" onClick={()=>setSessionType(s)}
                  style={{flex:1,padding:"12px",border:`1.5px solid ${sessionType===s?"var(--primary)":"var(--border)"}`,background:sessionType===s?"var(--primary-pale)":"#fff",borderRadius:"var(--radius-sm)",fontSize:14,cursor:"pointer",fontFamily:"var(--font-body)",color:sessionType===s?"var(--primary-dark)":"var(--text-3)",fontWeight:sessionType===s?600:400}}>
                  {s==="Video call"?"📹 Video Call":"🏃 In-Person"}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Select Date <span style={{color:"var(--red-500)"}}>*</span></label>
            <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8}}>
              {getTrainerDates(selectedTrainer).map(d=>(
                <button key={d.iso} type="button" onClick={()=>setSelectedDate(d)}
                  style={{flexShrink:0,padding:"10px 14px",borderRadius:"var(--radius-md)",border:`1.5px solid ${selectedDate?.iso===d.iso?"var(--primary)":"var(--border)"}`,background:selectedDate?.iso===d.iso?"var(--primary)":"#fff",color:selectedDate?.iso===d.iso?"#fff":"var(--text)",cursor:"pointer",fontFamily:"var(--font-body)",textAlign:"center",minWidth:64}}>
                  <div style={{fontSize:11,opacity:0.8,marginBottom:2}}>{d.shortDay}</div>
                  <div style={{fontSize:18,fontWeight:700}}>{d.date}</div>
                  <div style={{fontSize:10,opacity:0.8}}>{d.month}</div>
                </button>
              ))}
            </div>
            {selectedDate && <p style={{fontSize:12,color:"var(--primary)",marginTop:8}}>✓ {selectedDate.label} selected</p>}
          </div>

          <div className="form-group">
            <label>Select Time Slot <span style={{color:"var(--red-500)"}}>*</span></label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {TIME_SLOTS.map(t=>(
                <button key={t} type="button" onClick={()=>setSelectedTime(t)}
                  style={{padding:"10px 6px",borderRadius:"var(--radius-sm)",border:`1.5px solid ${selectedTime===t?"var(--primary)":"var(--border)"}`,background:selectedTime===t?"var(--primary)":"#fff",color:selectedTime===t?"#fff":"var(--text-3)",fontSize:12,cursor:"pointer",fontFamily:"var(--font-body)"}}>
                  {t}
                </button>
              ))}
            </div>
            {selectedTime && <p style={{fontSize:12,color:"var(--primary)",marginTop:8}}>✓ {selectedTime} selected</p>}
          </div>

          <div className="form-group">
            <label>Notes for Trainer (optional)</label>
            <textarea className="form-control" rows={3} placeholder="Any health conditions, goals, or specific requests..."
              value={notes} onChange={e=>setNotes(e.target.value)} maxLength={400} />
          </div>

          <div style={{background:"var(--primary-pale)",borderRadius:"var(--radius-sm)",padding:16,marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:8}}>
              <span style={{color:"var(--text-3)"}}>Session fee</span>
              <span style={{fontWeight:600}}>₹{selectedTrainer.pricePerHour}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:16,borderTop:"1px solid var(--border)",paddingTop:12,marginTop:4}}>
              <span style={{fontWeight:700}}>Total</span>
              <span style={{fontWeight:700,color:"var(--primary-dark)"}}>₹{selectedTrainer.pricePerHour}</span>
            </div>
          </div>

          {payError && <div className="banner banner-error mb-16">{payError}</div>}

          <button className="btn btn-primary btn-full btn-lg"
            onClick={handlePayment}
            disabled={!selectedDate || !selectedTime || paying}>
            {paying ? <><span className="spin">⟳</span> Processing...</> : (!selectedDate||!selectedTime) ? "Please select date & time" : `Pay ₹${selectedTrainer.pricePerHour} & Confirm →`}
          </button>
          <p style={{fontSize:12,color:"var(--text-4)",textAlign:"center",marginTop:10}}>
            🔒 Secured by Razorpay. Booking saved instantly after payment.
          </p>
        </div>
      )}
    </div>
  );
}
