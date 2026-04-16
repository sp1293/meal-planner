import { useEffect, useRef, useState } from "react";
import { TIERS } from "../config";
import { PricingCard } from "../components";
import { getVariant, logImpression, logClick } from "../utils/abTest";

const HERO_CTA_TEST = "hero-cta-v1";
const CTA_VARIANTS  = {
  A: { label: "Generate My Meal Plan Free →", style: { background: "#4ade80", color: "#052e16" } },
  B: { label: "Get My Personalized Plan →",   style: { background: "#f97316", color: "#fff"    } },
};

// Sample meal plan preview — shows users exactly what they get
const SAMPLE_PLAN = {
  day: "Monday",
  meals: [
    { type: "Breakfast", name: "Masala Oats with Vegetables", calories: 320, time: "15 min", emoji: "🥣" },
    { type: "Lunch",     name: "Dal Tadka + Brown Rice + Salad", calories: 480, time: "30 min", emoji: "🍱" },
    { type: "Snack",     name: "Roasted Chana + Green Tea", calories: 150, time: "5 min",  emoji: "🫛" },
    { type: "Dinner",    name: "Palak Paneer + 2 Rotis", calories: 420, time: "25 min", emoji: "🥘" },
  ],
  totalCalories: 1370,
};

export default function Landing({ navigate }) {
  const ctaVariant = useRef(getVariant(HERO_CTA_TEST)).current;
  const cta = CTA_VARIANTS[ctaVariant];
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => { logImpression(HERO_CTA_TEST, ctaVariant); }, []); // eslint-disable-line

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>

      {/* ── Early Access Banner ───────────────────────────────────────── */}
      <div style={{ background: "#4ade80", padding: "10px 24px", textAlign: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#052e16" }}>
          🎁 Early access: First 100 members get 3 months Pro free!{" "}
          <button onClick={() => navigate("early-access")}
            style={{ background: "none", border: "none", color: "#052e16", fontSize: 13, fontWeight: 800, cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}>
            Claim your spot →
          </button>
        </span>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section style={{ background: "linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%)", padding: "64px 24px 56px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 80%,rgba(34,197,94,0.15) 0%,transparent 50%),radial-gradient(circle at 80% 20%,rgba(234,179,8,0.1) 0%,transparent 50%)" }} />
        <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }} className="anim-fade-up">

          {/* Emotional hook pill */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "var(--radius-full)", padding: "6px 16px", marginBottom: 24 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>🇮🇳 Built specifically for Indian nutrition & lifestyle</span>
          </div>

          {/* Strong headline */}
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,5.5vw,60px)", fontWeight: 700, color: "#fff", lineHeight: 1.1, marginBottom: 20 }}>
            Get a Personalized Indian<br />
            <span style={{ color: "#4ade80" }}>Weekly Meal Plan in 30 Seconds</span>
          </h1>

          {/* Emotional hook */}
          <p style={{ fontSize: "clamp(15px,2vw,18px)", color: "rgba(255,255,255,0.75)", maxWidth: 520, margin: "0 auto 12px", lineHeight: 1.7 }}>
            Tired of deciding what to cook every day? Struggling to eat healthy with Indian food?
          </p>
          <p style={{ fontSize: "clamp(14px,1.8vw,16px)", color: "rgba(255,255,255,0.55)", maxWidth: 460, margin: "0 auto 32px", lineHeight: 1.6 }}>
            Mitabhukta uses AI to create nutritionist-approved meal plans tailored to your age, goals, and Indian taste — in seconds. Free to start.
          </p>

          {/* Single clear CTA */}
          <div style={{ marginBottom: 16 }}>
            <button className="btn btn-lg"
              style={{ ...cta.style, fontWeight: 700, fontSize: 16, padding: "16px 36px", borderRadius: "var(--radius-md)" }}
              onClick={() => { logClick(HERO_CTA_TEST, ctaVariant); navigate("signup"); }}>
              {cta.label}
            </button>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 40 }}>
            Free forever · No credit card · Takes 30 seconds
          </p>

          {/* Trust stats */}
          <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
            {[
              ["4","Age Groups"],
              ["7‑Day","Meal Plans"],
              ["₹0","To Start"],
              ["30s","Plan Generated"],
            ].map(([val,label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "#4ade80" }}>{val}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sample Meal Plan Preview ──────────────────────────────────── */}
      <section style={{ padding: "52px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "inline-block", background: "var(--primary-pale)", color: "var(--primary-dark)", fontSize: 12, fontWeight: 700, padding: "4px 14px", borderRadius: "var(--radius-full)", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".5px" }}>
              Live Preview
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,3.5vw,34px)", color: "var(--primary-dark)", marginBottom: 8 }}>
              Here's What Your Meal Plan Looks Like
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-3)" }}>
              AI-generated, nutritionist-approved, 100% Indian meals tailored to your goals
            </p>
          </div>

          {/* Day selector */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24, flexWrap: "wrap" }}>
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day,i) => (
              <button key={day} onClick={() => setActiveDay(i)}
                style={{ padding: "7px 16px", borderRadius: "var(--radius-full)", border: `1.5px solid ${activeDay===i?"var(--primary)":"var(--border)"}`, background: activeDay===i?"var(--primary)":"#fff", color: activeDay===i?"#fff":"var(--text-3)", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-body)", transition: "var(--transition)" }}>
                {day}
              </button>
            ))}
          </div>

          {/* Meal cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 20 }}>
            {SAMPLE_PLAN.meals.map(meal => (
              <div key={meal.type} style={{ background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", padding: "18px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>{meal.type}</div>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{meal.emoji}</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)", marginBottom: 8, lineHeight: 1.4 }}>{meal.name}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, background: "#f0fdf4", color: "var(--primary-dark)", padding: "3px 8px", borderRadius: "var(--radius-full)", fontWeight: 600 }}>🔥 {meal.calories} kcal</span>
                  <span style={{ fontSize: 11, background: "#eff6ff", color: "#1d4ed8", padding: "3px 8px", borderRadius: "var(--radius-full)", fontWeight: 600 }}>⏱ {meal.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Total + CTA */}
          <div style={{ background: "linear-gradient(135deg,#052e16,#166534)", borderRadius: "var(--radius-md)", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Daily total · Monday</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "#4ade80" }}>
                {SAMPLE_PLAN.totalCalories} kcal — Balanced Indian Diet
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                Includes macros, shopping list & step-by-step recipes
              </div>
            </div>
            <button className="btn btn-lg"
              style={{ background: "#4ade80", color: "#052e16", fontWeight: 700, fontSize: 15, whiteSpace: "nowrap" }}
              onClick={() => navigate("signup")}>
              Get My Full 7-Day Plan →
            </button>
          </div>
        </div>
      </section>

      {/* ── Problem / Solution ────────────────────────────────────────── */}
      <section style={{ padding: "52px 24px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,3.5vw,34px)", color: "var(--primary-dark)", marginBottom: 8 }}>
              Sound Familiar?
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginBottom: 40 }}>
            {[
              { problem: "😩 'What should I cook today?' — every single day", solution: "AI generates your entire week's meal plan in 30 seconds" },
              { problem: "😕 Healthy eating tips don't account for Indian food", solution: "Every plan uses dal, sabzi, roti, rice — real Indian meals" },
              { problem: "⏰ No time to research nutrition for the whole family", solution: "Separate age-appropriate plans for kids, adults & seniors" },
              { problem: "🏋️ Booked a gym but don't know what to eat around it", solution: "Certified trainers + meal plans that complement your fitness goals" },
            ].map((item, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "20px 18px" }}>
                <div style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 10, lineHeight: 1.5 }}>{item.problem}</div>
                <div style={{ height: 1, background: "var(--border)", marginBottom: 10 }} />
                <div style={{ fontSize: 14, color: "var(--primary-dark)", fontWeight: 600, lineHeight: 1.5 }}>✅ {item.solution}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section style={{ padding: "52px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,3.5vw,34px)", color: "var(--primary-dark)", marginBottom: 8 }}>
              Everything in One App
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-3)" }}>No more juggling 5 different apps for your health</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 32 }}>
            {[
              { icon: "🤖", title: "AI Meal Plans",        desc: "Personalized 7-day Indian meal plans generated in 30 seconds." },
              { icon: "🛒", title: "Shopping Lists",       desc: "Auto-generated grocery lists so you never forget an ingredient." },
              { icon: "📊", title: "Nutrition Analysis",   desc: "Full macro & micronutrient breakdown for every meal." },
              { icon: "👨‍👩‍👧‍👦", title: "Family Profiles",    desc: "Different plans for every family member from one account." },
              { icon: "🍳", title: "Leftover Chef",        desc: "Tell us what's in your fridge. Get Indian recipes instantly." },
              { icon: "💪", title: "Certified Trainers",   desc: "Book verified yoga & fitness trainers. Sessions from ₹400/hr." },
            ].map(f => (
              <div key={f.title} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "20px 16px" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--primary-dark)", marginBottom: 6 }}>{f.title}</div>
                <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Age groups */}
          <div style={{ background: "var(--primary-dark)", borderRadius: "var(--radius-lg)", padding: "24px 28px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 16, textTransform: "uppercase", letterSpacing: ".5px" }}>
              Meal Plans for Every Age
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              {[
                { icon: "🧒", label: "Kids",    range: "Under 12", desc: "Fun, vitamin-rich meals kids actually enjoy eating." },
                { icon: "👦", label: "Teens",   range: "13–17",    desc: "High-protein plans for active, growing bodies." },
                { icon: "👤", label: "Adults",  range: "18–59",    desc: "Balanced macros that fit your busy lifestyle." },
                { icon: "👴", label: "Seniors", range: "60+",      desc: "Heart-healthy, easy-to-digest, anti-inflammatory meals." },
              ].map(g => (
                <div key={g.label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: "var(--radius-md)", padding: "14px 12px" }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{g.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#4ade80" }}>{g.label}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{g.range}</div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, margin: 0 }}>{g.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust / About ─────────────────────────────────────────────── */}
      <section style={{ padding: "52px 24px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--primary-pale)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px" }}>🥗</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,3vw,28px)", color: "var(--primary-dark)", marginBottom: 14 }}>
            Why We Built Mitabhukta
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.8, marginBottom: 16 }}>
            Most nutrition apps are built for Western diets. Dal, sabzi, roti, and rice don't fit their calorie models. We built Mitabhukta specifically for Indian households — using AI that actually understands our food, our family structures, and our lifestyle.
          </p>
          <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7, marginBottom: 28 }}>
            Built by a data engineer passionate about Indian nutrition. Every meal plan is validated against established nutritional guidelines for Indian dietary requirements.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { icon: "🔒", text: "Your data is private" },
              { icon: "🤖", text: "Powered by Claude AI" },
              { icon: "🇮🇳", text: "Made for India" },
              { icon: "💚", text: "Free to start" },
            ].map(t => (
              <div key={t.text} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-3)", background: "#fff", border: "1px solid var(--border)", padding: "8px 16px", borderRadius: "var(--radius-full)" }}>
                <span>{t.icon}</span><span>{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────── */}
      <section style={{ padding: "52px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,3.5vw,34px)", color: "var(--primary-dark)", marginBottom: 8 }}>
              Simple, Transparent Pricing
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-3)" }}>Start free. Upgrade when you're ready. No hidden fees ever.</p>
          </div>
          <div className="grid-4" style={{ alignItems: "start" }}>
            {Object.keys(TIERS).map(key => (
              <PricingCard key={key} tierKey={key} currentTier={null} onSelect={() => navigate("signup")} />
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <div style={{ display: "inline-block", background: "var(--primary-pale)", border: "1px solid var(--primary-soft)", borderRadius: "var(--radius-lg)", padding: "16px 28px" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--primary-dark)" }}>🎁 Early Access —</span>
              <span style={{ fontSize: 14, color: "var(--text-3)", margin: "0 8px" }}>First 100 members get 3 months Pro free!</span>
              <button className="btn btn-primary btn-sm" onClick={() => navigate("early-access")}>Claim →</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section style={{ padding: "48px 24px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,3vw,28px)", color: "var(--primary-dark)", marginBottom: 4 }}>
              What Early Users Say
            </h2>
          </div>
          <div className="grid-3">
            {[
              { name: "Priya S.",  city: "Bengaluru", quote: "Finally an app that actually understands Indian food. The meal plans are practical and my family loves them.", rating: 5 },
              { name: "Rahul M.",  city: "Hyderabad", quote: "The AI generates a full week of meals in seconds. Better than anything I've seen for Indian nutrition.", rating: 5 },
              { name: "Ananya K.", city: "Chennai",   quote: "Booked a yoga session through Mitabhukta — so seamless. The trainer knew exactly what I needed.", rating: 5 },
            ].map(t => (
              <div key={t.name} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "20px 18px" }}>
                <div style={{ fontSize: 14, color: "#f59e0b", marginBottom: 10 }}>{"★".repeat(t.rating)}</div>
                <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 14, fontStyle: "italic" }}>"{t.quote}"</p>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary-dark)" }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-4)" }}>{t.city}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section style={{ padding: "56px 24px", background: "var(--primary-dark)", textAlign: "center" }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,3.5vw,40px)", color: "#fff", marginBottom: 14, lineHeight: 1.2 }}>
            Stop Guessing What to Cook.<br />
            <span style={{ color: "#4ade80" }}>Start Eating Better Today.</span>
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 28, lineHeight: 1.7 }}>
            Join Indian families who have taken the guesswork out of healthy eating. Your personalized meal plan is 30 seconds away.
          </p>
          <button className="btn btn-lg"
            style={{ background: "#4ade80", color: "#052e16", fontWeight: 700, fontSize: 16, padding: "16px 40px", marginBottom: 16 }}
            onClick={() => { logClick(HERO_CTA_TEST, ctaVariant); navigate("signup"); }}>
            Generate My Free Meal Plan →
          </button>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>✓ Free forever</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>✓ No credit card</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>✓ Ready in 30 seconds</span>
          </div>
        </div>
      </section>

    </div>
  );
}