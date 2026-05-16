import { useEffect, useRef, useState } from "react";
import { TIERS } from "../config";
import { PricingCard } from "../components";
import { getVariant, logImpression, logClick } from "../utils/abTest";

const HERO_CTA_TEST = "hero-cta-v1";
const CTA_VARIANTS  = {
  A: { label: "Begin Your Plan →" },
  B: { label: "Get My Personalized Plan →" },
};

// Sample meal plan preview — shows users exactly what they get
const SAMPLE_PLAN = {
  day: "Monday",
  meals: [
    { type: "Breakfast", name: "Masala Oats with Vegetables", calories: 320, time: "15 min" },
    { type: "Lunch",     name: "Dal Tadka + Brown Rice + Salad", calories: 480, time: "30 min" },
    { type: "Snack",     name: "Roasted Chana + Green Tea", calories: 150, time: "5 min" },
    { type: "Dinner",    name: "Palak Paneer + 2 Rotis", calories: 420, time: "25 min" },
  ],
  totalCalories: 1370,
};

// Inline styles helpers — using CSS variables so the global theme controls colors
const ink        = "var(--text)";
const inkSoft    = "var(--text-2)";
const inkMute    = "var(--text-3)";
const paper      = "var(--bg)";
const paperCard  = "var(--bg-card)";
const paperDeep  = "var(--bg-deep)";
const walnut     = "var(--walnut-700)";
const walnutDark = "var(--walnut-800)";
const gold       = "var(--gold-500)";
const goldPale   = "var(--gold-50)";
const line       = "var(--border)";
const fontDisp   = "var(--font-display)";
const fontBody   = "var(--font-body)";

export default function Landing({ navigate }) {
  const ctaVariant = useRef(getVariant(HERO_CTA_TEST)).current;
  const cta = CTA_VARIANTS[ctaVariant];
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => { logImpression(HERO_CTA_TEST, ctaVariant); }, []); // eslint-disable-line

  return (
    <div style={{ background: paper, color: ink, fontFamily: fontBody }}>

      {/* ── Early Access Banner ───────────────────────────────────────── */}
      <div style={{ background: walnutDark, padding: "12px 24px", textAlign: "center" }}>
        <span style={{ fontSize: 12, color: goldPale, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>
          Early access · First 100 members receive 3 months Pro free.{" "}
          <button onClick={() => navigate("early-access")}
            style={{ background: "none", border: "none", color: "#F0E2C5", fontSize: 12, fontWeight: 500, cursor: "pointer", textDecoration: "underline", fontFamily: "inherit", letterSpacing: "inherit", textTransform: "inherit" }}>
            Claim your spot →
          </button>
        </span>
      </div>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section style={{ padding: "60px 0 100px" }}>
        <div className="container" style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 80, alignItems: "center" }} className_mobile="hero-inner">

          <style>{`
            @media (max-width: 900px) {
              .hero-grid { grid-template-columns: 1fr !important; gap: 60px !important; }
              .hero-h1 { font-size: 56px !important; }
              .hero-art { aspect-ratio: 1/1 !important; }
              .floating-card { position: static !important; margin: 16px 0 !important; max-width: 100% !important; right: auto !important; left: auto !important; top: auto !important; bottom: auto !important; }
              .why-h2 { font-size: 40px !important; }
              .why-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
              .section-pad { padding: 80px 0 !important; }
              .final-h2 { font-size: 40px !important; }
            }
          `}</style>

          <div className="hero-grid anim-fade-up" style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 80, alignItems: "center", width: "100%" }}>
            <div>
              {/* Eyebrow */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 14, fontSize: 12, color: walnut, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 40, fontWeight: 500 }}>
                <span style={{ width: 32, height: 1, background: walnut }} />
                Indian Wellness, Considered
              </div>

              {/* Headline — premium serif, large, italic emphasis */}
              <h1 className="hero-h1" style={{ fontFamily: fontDisp, fontSize: 88, fontWeight: 300, lineHeight: 0.98, letterSpacing: "-0.04em", color: ink, marginBottom: 36, fontVariationSettings: '"opsz" 144' }}>
                The way<br />
                we should<br />
                <em style={{ fontStyle: "italic", color: walnut, fontWeight: 300 }}>have been</em><br />
                eating.
              </h1>

              {/* Lead */}
              <p style={{ fontSize: 18, lineHeight: 1.7, color: inkSoft, marginBottom: 44, maxWidth: 460 }}>
                A quiet practice of intentional, regional Indian meals — designed for your body, your family, and the kitchen you actually cook in.
              </p>

              {/* CTAs */}
              <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 48, flexWrap: "wrap" }}>
                <button
                  onClick={() => { logClick(HERO_CTA_TEST, ctaVariant); navigate("signup"); }}
                  style={{ background: walnut, color: paperCard, padding: "18px 36px", border: "none", borderRadius: 2, fontSize: 12, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", fontFamily: fontBody, transition: "background .2s" }}
                  onMouseOver={(e) => e.currentTarget.style.background = walnutDark}
                  onMouseOut={(e) => e.currentTarget.style.background = walnut}>
                  {cta.label}
                </button>
                <button
                  onClick={() => navigate("how-it-works")}
                  style={{ background: "none", border: "none", color: ink, fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: fontBody, paddingBottom: 6, borderBottom: `1px solid ${ink}` }}>
                  How it works
                </button>
              </div>

              {/* Trust line */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, color: inkMute, fontSize: 14, fontStyle: "italic", fontFamily: fontDisp }}>
                <div style={{ display: "flex" }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", border: `2px solid ${paper}`, background: goldPale, color: walnutDark, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontDisp, fontWeight: 500, fontSize: 12 }}>P</div>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", border: `2px solid ${paper}`, background: walnut, color: paperCard, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontDisp, fontWeight: 500, fontSize: 12, marginLeft: -8 }}>A</div>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", border: `2px solid ${paper}`, background: gold, color: paperCard, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontDisp, fontWeight: 500, fontSize: 12, marginLeft: -8 }}>M</div>
                </div>
                <span>Trusted by 2,400 home kitchens</span>
              </div>
            </div>

            {/* Hero illustration with floating cards */}
            <div className="hero-art" style={{ position: "relative", aspectRatio: "4/5" }}>
              <div style={{ position: "relative", width: "100%", height: "100%", background: paperDeep, borderRadius: 2, overflow: "hidden" }}>
                <svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
                  <rect width="400" height="500" fill="#ECE5D8" />
                  <circle cx="200" cy="240" r="170" fill="#E8D9BC" opacity="0.5" />
                  {/* Bowl */}
                  <ellipse cx="200" cy="290" rx="125" ry="20" fill="#3D311E" />
                  <path d="M 75 290 Q 75 395 200 395 Q 325 395 325 290 Z" fill="#5C4A2E" />
                  <ellipse cx="200" cy="290" rx="123" ry="17" fill="#B89968" />
                  <ellipse cx="200" cy="288" rx="117" ry="12" fill="#8B6E45" />
                  {/* Food in bowl */}
                  <circle cx="170" cy="282" r="14" fill="#3D311E" />
                  <circle cx="200" cy="278" r="16" fill="#A85432" opacity="0.9" />
                  <circle cx="230" cy="284" r="12" fill="#D4A574" />
                  <circle cx="185" cy="295" r="10" fill="#B0392A" opacity="0.85" />
                  <circle cx="215" cy="294" r="8" fill="#D4A03C" />
                  {/* Steam */}
                  <path d="M 170 245 Q 165 225 175 205 Q 180 190 170 175" stroke="#5C4A2E" strokeWidth="1.5" fill="none" opacity="0.35" strokeLinecap="round" />
                  <path d="M 200 240 Q 195 220 205 200 Q 210 185 200 170" stroke="#5C4A2E" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
                  <path d="M 230 245 Q 225 225 235 205 Q 240 190 230 175" stroke="#5C4A2E" strokeWidth="1.5" fill="none" opacity="0.35" strokeLinecap="round" />
                  {/* Spice notes */}
                  <circle cx="80" cy="140" r="4" fill="#5C4A2E" opacity="0.5" />
                  <circle cx="340" cy="170" r="3" fill="#B89968" />
                  <circle cx="60" cy="395" r="4" fill="#D4A574" opacity="0.8" />
                  <circle cx="350" cy="410" r="5" fill="#5C4A2E" opacity="0.4" />
                  {/* Museum tag */}
                  <text x="40" y="465" fontFamily="Fraunces" fontStyle="italic" fontSize="12" fill="#8A8278">No. 1</text>
                </svg>
              </div>

              {/* Floating card: top-right */}
              <div className="floating-card" style={{ position: "absolute", top: 40, right: -36, maxWidth: 220, background: paperCard, border: `1px solid ${line}`, padding: "20px 24px", borderRadius: 2 }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: inkMute, marginBottom: 10 }}>Today, for lunch</div>
                <div style={{ fontFamily: fontDisp, fontSize: 19, fontWeight: 400, color: ink, marginBottom: 6, lineHeight: 1.2, letterSpacing: "-0.01em" }}>Palak Paneer<br />& Phulka</div>
                <div style={{ fontSize: 12, color: walnut, fontWeight: 500, letterSpacing: "0.02em" }}>480 KCAL · 30 MIN</div>
              </div>

              {/* Floating card: bottom-left */}
              <div className="floating-card" style={{ position: "absolute", bottom: 48, left: -40, background: paperCard, border: `1px solid ${line}`, padding: "20px 24px", borderRadius: 2 }}>
                <div style={{ fontSize: 10, color: walnut, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 10 }}>— Family Plan</div>
                <div style={{ fontFamily: fontDisp, fontSize: 19, fontWeight: 400, color: ink, marginBottom: 6, lineHeight: 1.2, letterSpacing: "-0.01em" }}>Cooked for four</div>
                <div style={{ fontFamily: fontDisp, fontStyle: "italic", color: gold, fontSize: 13, marginTop: 6 }}>★ ★ ★ ★ ★</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Press line ────────────────────────────────────────────────── */}
      <div className="container">
        <div style={{ borderTop: `1px solid ${line}`, padding: "36px 0", textAlign: "center", fontSize: 11, color: inkMute, letterSpacing: "0.24em", textTransform: "uppercase", fontFamily: fontDisp, fontStyle: "italic" }}>
          <em>As featured in</em>&nbsp;&nbsp;
          <span style={{ fontStyle: "normal", margin: "0 24px" }}>YourStory</span>·
          <span style={{ fontStyle: "normal", margin: "0 24px" }}>The Hindu</span>·
          <span style={{ fontStyle: "normal", margin: "0 24px" }}>Mint</span>·
          <span style={{ fontStyle: "normal", margin: "0 24px" }}>Vogue India</span>
        </div>
      </div>

      {/* ── Why / Mindful eating section ──────────────────────────────── */}
      <section className="section-pad" style={{ padding: "120px 0 140px", background: paperDeep }}>
        <div className="container">
          <div style={{ maxWidth: 760, margin: "0 auto 100px", textAlign: "center" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", color: walnut, marginBottom: 32, fontWeight: 500 }}>
              — A different kind of meal plan —
            </div>
            <h2 className="why-h2" style={{ fontFamily: fontDisp, fontSize: 60, fontWeight: 300, lineHeight: 1.05, letterSpacing: "-0.03em", color: ink, marginBottom: 28, fontVariationSettings: '"opsz" 144' }}>
              Mindful eating, returned to <em style={{ fontStyle: "italic" }}>everyday life</em>.
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.75, color: inkSoft, maxWidth: 560, margin: "0 auto" }}>
              Mitabhukta — Sanskrit for one who eats with measure — is built around an old idea: that food, made with care for who you are, is itself a form of medicine.
            </p>
          </div>

          <div className="why-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 72, maxWidth: 1080, margin: "0 auto" }}>
            {[
              { num: "i.", title: "For your body, specifically.", body: "We adapt meals to your conditions — diabetes, PCOS, thyroid, blood pressure — and to the way your particular body asks to be fed." },
              { num: "ii.", title: "Regional, not generic.", body: "Pongal, thepla, ragi mudde, kosambari. Real dishes from real kitchens — not a softened version of \"Indian food.\"" },
              { num: "iii.", title: "Guided by humans.", body: "Certified nutritionists, yoga teachers, and physiotherapists you can book — for when an app isn't enough." },
            ].map((item) => (
              <div key={item.num}>
                <div style={{ fontFamily: fontDisp, fontStyle: "italic", fontSize: 56, fontWeight: 300, color: gold, lineHeight: 1, marginBottom: 32, letterSpacing: "-0.02em" }}>
                  {item.num}
                </div>
                <h3 style={{ fontFamily: fontDisp, fontSize: 22, fontWeight: 400, lineHeight: 1.3, marginBottom: 16, color: ink, letterSpacing: "-0.01em", fontVariationSettings: '"opsz" 144' }}>
                  {item.title}
                </h3>
                <p style={{ color: inkSoft, fontSize: 15, lineHeight: 1.7 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sample Meal Plan Preview ──────────────────────────────────── */}
      <section className="section-pad" style={{ padding: "120px 0", background: paper }}>
        <div className="container" style={{ maxWidth: 920 }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 11, color: walnut, letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: 24, fontWeight: 500 }}>
              — A working week —
            </div>
            <h2 className="why-h2" style={{ fontFamily: fontDisp, fontSize: 48, fontWeight: 300, color: ink, marginBottom: 16, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              What <em style={{ fontStyle: "italic" }}>Monday</em> looks like.
            </h2>
            <p style={{ fontSize: 16, color: inkSoft, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
              A real plan generated by Mitabhukta. Authentic, balanced, achievable.
            </p>
          </div>

          {/* Day selector */}
          <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 40, flexWrap: "wrap" }}>
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day, i) => (
              <button key={day} onClick={() => setActiveDay(i)}
                style={{ padding: "10px 20px", border: "none", background: activeDay===i ? ink : "transparent", color: activeDay===i ? paperCard : inkMute, fontSize: 11, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer", fontFamily: fontBody, transition: "all .2s", borderRadius: 2 }}>
                {day}
              </button>
            ))}
          </div>

          {/* Meal cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 1, background: line, border: `1px solid ${line}`, marginBottom: 40 }}>
            {SAMPLE_PLAN.meals.map((meal) => (
              <div key={meal.type} style={{ background: paperCard, padding: "32px 24px" }}>
                <div style={{ fontSize: 10, fontWeight: 500, color: walnut, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 16 }}>
                  {meal.type}
                </div>
                <div style={{ fontFamily: fontDisp, fontSize: 22, fontWeight: 400, color: ink, marginBottom: 12, lineHeight: 1.25, letterSpacing: "-0.01em" }}>
                  {meal.name}
                </div>
                <div style={{ fontSize: 12, color: inkMute, letterSpacing: "0.06em" }}>
                  {meal.calories} kcal&nbsp;&nbsp;·&nbsp;&nbsp;{meal.time}
                </div>
              </div>
            ))}
          </div>

          {/* Total + CTA */}
          <div style={{ background: walnutDark, padding: "32px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(245, 241, 234, 0.5)", marginBottom: 8, letterSpacing: "0.16em", textTransform: "uppercase" }}>Daily total</div>
              <div style={{ fontFamily: fontDisp, fontSize: 28, fontWeight: 400, color: goldPale, letterSpacing: "-0.02em" }}>
                {SAMPLE_PLAN.totalCalories} kcal — <em style={{ fontStyle: "italic", color: gold }}>balanced</em>
              </div>
              <div style={{ fontSize: 13, color: "rgba(245, 241, 234, 0.5)", marginTop: 6, fontStyle: "italic", fontFamily: fontDisp }}>
                Includes macros, shopping list, and step-by-step recipes
              </div>
            </div>
            <button
              onClick={() => navigate("signup")}
              style={{ background: gold, color: walnutDark, padding: "16px 30px", border: "none", borderRadius: 2, fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", fontFamily: fontBody, whiteSpace: "nowrap" }}>
              See the full week →
            </button>
          </div>
        </div>
      </section>

      {/* ── Features section ─────────────────────────────────────────── */}
      <section className="section-pad" style={{ padding: "120px 0", background: paperDeep }}>
        <div className="container">
          <div style={{ maxWidth: 720, marginBottom: 80 }}>
            <div style={{ fontSize: 11, color: walnut, letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: 24, fontWeight: 500 }}>
              — Everything in one practice —
            </div>
            <h2 className="why-h2" style={{ fontFamily: fontDisp, fontSize: 56, fontWeight: 300, color: ink, marginBottom: 24, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              The full <em style={{ fontStyle: "italic" }}>kitchen practice</em>.
            </h2>
            <p style={{ fontSize: 17, color: inkSoft, lineHeight: 1.75 }}>
              No more juggling five apps for what should be one practice — a quiet, daily ritual.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 0 }}>
            {[
              { title: "AI Meal Plans", body: "Personalized 7-day Indian meal plans generated in 30 seconds — built from your goals, conditions, and preferences." },
              { title: "Shopping Lists", body: "Auto-generated, organized by category. One tap to BigBasket, Blinkit, or Zepto." },
              { title: "Nutrition Analysis", body: "Macros and micronutrients for every dish — without surrendering taste for tracking." },
              { title: "Family Profiles", body: "Different plans for every family member from one account. Kids, teens, adults, seniors — each their own." },
              { title: "Leftover Chef", body: "Tell us what's in your fridge. Get an Indian recipe in seconds. No waste, no waste of mind." },
              { title: "Certified Trainers", body: "Book verified yoga instructors, gym trainers, and physiotherapists. Sessions from ₹400/hour." },
            ].map((f, i) => (
              <div key={f.title} style={{ padding: "40px 32px", borderTop: i < 3 ? `1px solid ${line}` : "none", borderBottom: `1px solid ${line}`, borderRight: (i + 1) % 3 !== 0 ? `1px solid ${line}` : "none", background: paperCard }}>
                <div style={{ fontFamily: fontDisp, fontStyle: "italic", fontSize: 13, color: gold, marginBottom: 16, letterSpacing: "0.04em" }}>
                  No. {String(i + 1).padStart(2, "0")}
                </div>
                <h3 style={{ fontFamily: fontDisp, fontSize: 22, fontWeight: 400, color: ink, marginBottom: 12, letterSpacing: "-0.01em" }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 14, color: inkSoft, lineHeight: 1.7 }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Age Groups ───────────────────────────────────────────────── */}
      <section className="section-pad" style={{ padding: "120px 0", background: paper }}>
        <div className="container">
          <div style={{ maxWidth: 720, marginBottom: 64 }}>
            <div style={{ fontSize: 11, color: walnut, letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: 24, fontWeight: 500 }}>
              — For every stage of life —
            </div>
            <h2 className="why-h2" style={{ fontFamily: fontDisp, fontSize: 56, fontWeight: 300, color: ink, marginBottom: 24, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              From the youngest <em style={{ fontStyle: "italic" }}>to the eldest</em>.
            </h2>
          </div>

          <div className="why-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
            {[
              { age: "Kids", range: "Under 12", body: "Fun, vitamin-rich meals built around growth, calcium, and the patience of a child's palate." },
              { age: "Teens", range: "13 – 17", body: "High-protein, high-energy meals for growing bodies and demanding school days." },
              { age: "Adults", range: "18 – 59", body: "Balanced, sustainable plans for the long arc of a working life and family demands." },
              { age: "Seniors", range: "60+", body: "Gentle, anti-inflammatory, easy-to-digest meals high in calcium and dietary fiber." },
            ].map((g, i) => (
              <div key={g.age} style={{ paddingTop: 28, borderTop: `1px solid ${ink}` }}>
                <div style={{ fontFamily: fontDisp, fontStyle: "italic", fontSize: 14, color: gold, marginBottom: 24 }}>
                  — {String(i + 1).padStart(2, "0")}
                </div>
                <h3 style={{ fontFamily: fontDisp, fontSize: 28, fontWeight: 400, color: ink, marginBottom: 4, letterSpacing: "-0.02em" }}>
                  {g.age}
                </h3>
                <div style={{ fontSize: 13, color: inkMute, marginBottom: 16, fontStyle: "italic", fontFamily: fontDisp }}>
                  {g.range}
                </div>
                <p style={{ fontSize: 14, color: inkSoft, lineHeight: 1.7 }}>
                  {g.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About / Why we built it ──────────────────────────────────── */}
      <section className="section-pad" style={{ padding: "120px 0", background: paperDeep }}>
        <div className="container" style={{ maxWidth: 760, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: walnut, letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: 32, fontWeight: 500 }}>
            — Why we built this —
          </div>
          <h2 className="why-h2" style={{ fontFamily: fontDisp, fontSize: 48, fontWeight: 300, color: ink, marginBottom: 32, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Western nutrition apps don't know <em style={{ fontStyle: "italic" }}>dal.</em>
          </h2>
          <p style={{ fontSize: 17, color: inkSoft, lineHeight: 1.85, marginBottom: 24 }}>
            Most wellness apps were built for Western kitchens. Dal, sabzi, roti, and rice don't fit their calorie models. Their portion sizes assume a different family. Their flavors, a different palate.
          </p>
          <p style={{ fontSize: 17, color: inkSoft, lineHeight: 1.85, marginBottom: 48 }}>
            We built Mitabhukta for Indian households — for the way we actually cook, eat, and feed the people we love.
          </p>
          <div style={{ display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap", fontSize: 13, color: inkMute, fontStyle: "italic", fontFamily: fontDisp }}>
            <span>Private by design</span>
            <span>·</span>
            <span>Powered by Claude AI</span>
            <span>·</span>
            <span>Built in India</span>
            <span>·</span>
            <span>Free to begin</span>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section className="section-pad" style={{ padding: "120px 0", background: paper }}>
        <div className="container">
          <div style={{ maxWidth: 720, marginBottom: 64, textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
            <div style={{ fontSize: 11, color: walnut, letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: 24, fontWeight: 500 }}>
              — Begin where you are —
            </div>
            <h2 className="why-h2" style={{ fontFamily: fontDisp, fontSize: 56, fontWeight: 300, color: ink, marginBottom: 24, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              Simple, <em style={{ fontStyle: "italic" }}>transparent</em>.
            </h2>
            <p style={{ fontSize: 17, color: inkSoft, lineHeight: 1.7 }}>
              Start free. Upgrade when you're ready. Cancel any time, without ceremony.
            </p>
          </div>
          <div className="grid-4" style={{ alignItems: "start" }}>
            {Object.keys(TIERS).map(key => (
              <PricingCard key={key} tierKey={key} currentTier={null} onSelect={() => navigate("signup")} />
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <div style={{ display: "inline-block", borderTop: `1px solid ${line}`, borderBottom: `1px solid ${line}`, padding: "20px 36px" }}>
              <span style={{ fontSize: 11, color: walnut, letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 500 }}>Early Access</span>
              <span style={{ fontSize: 14, color: inkSoft, margin: "0 16px", fontStyle: "italic", fontFamily: fontDisp }}>
                First 100 members receive 3 months Pro free.
              </span>
              <button onClick={() => navigate("early-access")}
                style={{ background: "none", border: "none", color: walnut, fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: fontBody, borderBottom: `1px solid ${walnut}`, paddingBottom: 2 }}>
                Claim your spot →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────── */}
      <section className="section-pad" style={{ padding: "120px 0", background: paperDeep }}>
        <div className="container" style={{ maxWidth: 1000 }}>
          <div style={{ textAlign: "center", marginBottom: 80 }}>
            <div style={{ fontSize: 11, color: walnut, letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: 24, fontWeight: 500 }}>
              — From the kitchen —
            </div>
            <h2 className="why-h2" style={{ fontFamily: fontDisp, fontSize: 48, fontWeight: 300, color: ink, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              What <em style={{ fontStyle: "italic" }}>early readers</em> say.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 56 }}>
            {[
              { quote: "Finally an app that actually understands Indian food. The meal plans are practical and my family loves them.", name: "Priya S.", city: "Bengaluru" },
              { quote: "The AI generates a full week of meals in seconds. Better than anything I've seen for Indian nutrition.", name: "Rahul M.", city: "Hyderabad" },
              { quote: "Booked a yoga session through Mitabhukta — seamless. The trainer knew exactly what I needed.", name: "Ananya K.", city: "Chennai" },
            ].map((t) => (
              <div key={t.name}>
                <div style={{ fontFamily: fontDisp, fontSize: 56, fontWeight: 300, color: gold, lineHeight: 0.7, marginBottom: 16, fontStyle: "italic" }}>"</div>
                <p style={{ fontFamily: fontDisp, fontSize: 19, color: ink, lineHeight: 1.55, marginBottom: 24, fontWeight: 400, letterSpacing: "-0.005em" }}>
                  {t.quote}
                </p>
                <div style={{ fontSize: 12, color: walnut, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  {t.name}
                </div>
                <div style={{ fontSize: 12, color: inkMute, fontStyle: "italic", fontFamily: fontDisp, marginTop: 4 }}>
                  {t.city}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="section-pad" style={{ padding: "140px 0", background: walnutDark, textAlign: "center" }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <div style={{ fontSize: 11, color: gold, letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: 32, fontWeight: 500 }}>
            — Begin today —
          </div>
          <h2 className="final-h2" style={{ fontFamily: fontDisp, fontSize: 64, fontWeight: 300, color: goldPale, marginBottom: 28, letterSpacing: "-0.035em", lineHeight: 1.05 }}>
            The next meal you cook<br />could be <em style={{ fontStyle: "italic", color: gold }}>the right one.</em>
          </h2>
          <p style={{ fontSize: 17, color: "rgba(243, 233, 212, 0.7)", marginBottom: 48, lineHeight: 1.7, maxWidth: 480, margin: "0 auto 48px" }}>
            Your first personalized Indian meal plan is thirty seconds away. Free, forever.
          </p>
          <button
            onClick={() => { logClick(HERO_CTA_TEST, ctaVariant); navigate("signup"); }}
            style={{ background: gold, color: walnutDark, padding: "20px 44px", border: "none", borderRadius: 2, fontSize: 13, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer", fontFamily: fontBody, marginBottom: 24 }}>
            Begin My Plan →
          </button>
          <div style={{ fontSize: 12, color: "rgba(243, 233, 212, 0.4)", fontStyle: "italic", fontFamily: fontDisp }}>
            Free forever · No credit card · Thirty seconds
          </div>
        </div>
      </section>

    </div>
  );
}