import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

const PERKS = [
  { icon: "🎁", title: "3 Months Free",        desc: "First 100 signups get Pro plan free for 3 months at launch" },
  { icon: "⚡", title: "Priority Access",       desc: "Be first in line when payments go live — before public launch" },
  { icon: "🍛", title: "Unlimited Meal Plans",  desc: "Generate as many AI meal plans as you want during early access" },
  { icon: "💪", title: "Free Trainer Session",  desc: "One complimentary session with a certified trainer, on us" },
  { icon: "🔒", title: "Locked-in Pricing",     desc: "Pay ₹299/mo forever — price will rise for new users after launch" },
  { icon: "🌟", title: "Founding Member Badge", desc: "Exclusive badge on your profile — visible to trainers and community" },
];

const PLANS = [
  { name: "Starter", price: "₹299", period: "/mo", color: "#0891b2", perks: ["5-day meal plans", "10 plans/month", "Shopping list", "All age groups"] },
  { name: "Pro",     price: "₹599", period: "/mo", color: "#7c3aed", perks: ["7-day meal plans", "Unlimited plans", "Nutrition analysis", "Meal swap feature"], popular: true },
  { name: "Family",  price: "₹999", period: "/mo", color: "#059669", perks: ["Everything in Pro", "4 family profiles", "Kids & seniors plans", "Combined shopping list"] },
];

export default function EarlyAccess({ navigate }) {
  const [email,     setEmail]     = useState("");
  const [name,      setName]      = useState("");
  const [plan,      setPlan]      = useState("Pro");
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState("");
  const [count,     setCount]     = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !name) { setError("Please fill in your name and email."); return; }
    if (!email.includes("@")) { setError("Please enter a valid email address."); return; }
    setLoading(true); setError("");

    try {
      // Check for duplicate
      const existing = await getDocs(
        query(collection(db, "waitlist"), where("email", "==", email.toLowerCase().trim()))
      );
      if (!existing.empty) {
        setError("You're already on the waitlist! We'll be in touch soon. 🎉");
        setLoading(false);
        return;
      }

      // Save to Firestore
      await addDoc(collection(db, "waitlist"), {
        name:      name.trim(),
        email:     email.toLowerCase().trim(),
        plan,
        createdAt: serverTimestamp(),
        source:    "early-access-page",
        notified:  false,
      });

      // Get total count
      const all = await getDocs(collection(db, "waitlist"));
      setCount(all.size);
      setSubmitted(true);

    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #052e16 0%, #14532d 60%, #166534 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }} className="anim-scale-in">
          <div style={{ fontSize: 72, marginBottom: 24 }}>🎉</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, color: "#fff", marginBottom: 12, lineHeight: 1.2 }}>
            You're on the list!
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: 8 }}>
            Welcome to Mitabhukta Early Access, <strong style={{ color: "#4ade80" }}>{name.split(" ")[0]}</strong>!
          </p>
          {count && (
            <div style={{ display: "inline-block", background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "var(--radius-full)", padding: "6px 20px", marginBottom: 24 }}>
              <span style={{ fontSize: 14, color: "#4ade80", fontWeight: 600 }}>
                🏆 You're #{count} on the waitlist
              </span>
            </div>
          )}
          <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "var(--radius-lg)", padding: 28, marginBottom: 28, textAlign: "left" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#4ade80", marginBottom: 16, textTransform: "uppercase", letterSpacing: "1px" }}>
              What happens next
            </div>
            {[
              "You'll receive a confirmation email shortly",
              "When payments launch, you'll get exclusive first access",
              "Your 3 months free will be automatically applied",
              "Locked-in ₹" + (plan === "Starter" ? "299" : plan === "Pro" ? "599" : "999") + "/mo pricing — forever",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#4ade80", color: "#052e16", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.6 }}>{step}</p>
              </div>
            ))}
          </div>

          {/* Share prompt */}
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>
            Share with friends — every referral moves you up the list! 🚀
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
            <a href={`https://wa.me/?text=${encodeURIComponent("I just joined the Mitabhukta Early Access waitlist! AI-powered Indian meal planning, calorie tracking and trainer booking. Join free: https://mitabhukta.com/early-access")}`}
              target="_blank" rel="noopener noreferrer"
              style={{ padding: "12px 24px", background: "#25D366", color: "#fff", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
              📱 Share on WhatsApp
            </a>
            <button
              onClick={() => { navigator.clipboard.writeText("https://mitabhukta.com/early-access"); }}
              style={{ padding: "12px 24px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              🔗 Copy Link
            </button>
          </div>
          <button onClick={() => navigate("dashboard")}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  // ── Main page ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8" }}>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #052e16 0%, #14532d 60%, #166534 100%)", padding: "80px 24px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 80%, rgba(34,197,94,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(234,179,8,0.1) 0%, transparent 50%)" }} />
        <div style={{ maxWidth: 680, margin: "0 auto", position: "relative" }} className="anim-fade-up">

          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "var(--radius-full)", padding: "6px 18px", marginBottom: 28 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 13, color: "#4ade80", fontWeight: 600 }}>Limited Early Access — First 100 spots only</span>
          </div>

          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 6vw, 60px)", fontWeight: 700, color: "#fff", lineHeight: 1.1, marginBottom: 20 }}>
            Get 3 Months Free<br />
            <span style={{ color: "#4ade80" }}>When We Launch</span>
          </h1>

          <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "rgba(255,255,255,0.75)", maxWidth: 500, margin: "0 auto 16px", lineHeight: 1.7 }}>
            Mitabhukta paid plans are coming soon. Join the waitlist today and lock in the lowest price forever — plus 3 months completely free.
          </p>

          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
            No payment required now · Cancel anytime · Price locked in forever
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>

          {/* Left — Form */}
          <div>
            <div className="card" style={{ padding: 32, marginBottom: 24 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary-dark)", marginBottom: 6 }}>
                Join the Waitlist
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 24 }}>
                Takes 30 seconds. No credit card needed.
              </p>

              {error && <div className="banner banner-error mb-16">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Your name</label>
                  <input className="form-control" type="text" placeholder="Priya Sharma"
                    value={name} onChange={e => setName(e.target.value)} required maxLength={80} />
                </div>
                <div className="form-group">
                  <label>Email address</label>
                  <input className="form-control" type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>

                {/* Plan selector */}
                <div className="form-group">
                  <label>Which plan interests you?</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {PLANS.map(p => (
                      <button key={p.name} type="button" onClick={() => setPlan(p.name)}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", border: `1.5px solid ${plan === p.name ? p.color : "var(--border)"}`, background: plan === p.name ? p.color + "10" : "#fff", borderRadius: "var(--radius-sm)", cursor: "pointer", fontFamily: "var(--font-body)", transition: "var(--transition)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${p.color}`, background: plan === p.name ? p.color : "transparent", transition: "var(--transition)" }} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                            {p.name}
                            {p.popular && <span style={{ marginLeft: 8, fontSize: 10, background: p.color, color: "#fff", padding: "2px 8px", borderRadius: "var(--radius-full)", fontWeight: 700 }}>POPULAR</span>}
                          </span>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: p.color }}>{p.price}<span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-4)" }}>{p.period}</span></span>
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}
                  style={{ marginTop: 8, fontSize: 15 }}>
                  {loading
                    ? <><span className="spin">⟳</span> Joining waitlist...</>
                    : "🚀 Join Early Access — It's Free"}
                </button>
              </form>

              <p style={{ fontSize: 12, color: "var(--text-4)", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
                By joining, you agree to our{" "}
                <button onClick={() => navigate("terms")} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 12, fontFamily: "var(--font-body)" }}>Terms</button>{" "}and{" "}
                <button onClick={() => navigate("privacy")} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 12, fontFamily: "var(--font-body)" }}>Privacy Policy</button>.
                We'll only email you about Mitabhukta.
              </p>
            </div>

            {/* Social proof */}
            <div style={{ background: "var(--primary-pale)", border: "1px solid var(--primary-soft)", borderRadius: "var(--radius-md)", padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary-dark)", marginBottom: 12 }}>
                💬 What beta users are saying
              </div>
              {[
                { name: "Priya S.", city: "Bengaluru", text: "Finally an Indian meal planning app that actually works! Can't wait for the paid version." },
                { name: "Rahul M.", city: "Hyderabad",  text: "The AI meal plans are incredible. The photo calorie tracker alone is worth paying for." },
              ].map((t, i) => (
                <div key={i} style={{ marginBottom: i === 0 ? 12 : 0 }}>
                  <p style={{ fontSize: 13, color: "var(--primary-dark)", fontStyle: "italic", marginBottom: 4 }}>"{t.text}"</p>
                  <p style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>— {t.name}, {t.city}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Perks */}
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary-dark)", marginBottom: 6 }}>
              Early Access Perks
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 20 }}>
              First 100 members get exclusive benefits — forever.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
              {PERKS.map((perk, i) => (
                <div key={i} className="card" style={{ padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>{perk.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--primary-dark)", marginBottom: 4 }}>{perk.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.5 }}>{perk.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing comparison */}
            <div style={{ background: "var(--primary-dark)", borderRadius: "var(--radius-lg)", padding: 24, color: "#fff" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>
                Price Comparison
              </div>
              {[
                { label: "HealthifyMe Pro",  price: "₹2,499/mo", cross: true },
                { label: "Dietitian consult", price: "₹2,000+/session", cross: true },
                { label: "Mitabhukta Pro",   price: "₹599/mo", cross: false, highlight: true },
                { label: "Early access price", price: "₹599/mo + 3 months FREE", cross: false, green: true },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                  <span style={{ fontSize: 13, color: row.highlight ? "#fff" : "rgba(255,255,255,0.6)", fontWeight: row.highlight ? 600 : 400 }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: row.green ? "#4ade80" : row.cross ? "rgba(255,255,255,0.3)" : "#fff", textDecoration: row.cross ? "line-through" : "none" }}>
                    {row.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
