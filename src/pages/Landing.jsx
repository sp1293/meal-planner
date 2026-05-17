import { useEffect, useRef } from "react";
import { TIERS } from "../config";
import { getVariant, logImpression, logClick } from "../utils/abTest";

const HERO_CTA_TEST = "hero-cta-v1";
const CTA_VARIANTS  = {
  A: { label: "Begin Your Plan →" },
  B: { label: "Get My Personalized Plan →" },
};

// Sample meal plan shown in the hero card
const SAMPLE_MEALS = [
  { type: "Breakfast", name: "Masala oats with vegetables",       cal: 320 },
  { type: "Lunch",     name: "Dal tadka, brown rice, kachumber",  cal: 480 },
  { type: "Snack",     name: "Roasted chana, masala chai",         cal: 150 },
  { type: "Dinner",    name: "Palak paneer with phulkas",          cal: 420 },
];

// CSS variable shortcuts so theme cascades from global.css
const ink        = "var(--text)";
const inkSoft    = "var(--text-2)";
const inkMute    = "var(--text-3)";
const inkLight   = "var(--text-4)";
const paper      = "var(--bg)";
const paperCard  = "var(--bg-card)";
const walnut     = "var(--walnut-700)";
const walnutDark = "var(--walnut-800)";
const gold       = "var(--gold-500)";
const goldPale   = "var(--gold-50)";
const goldDark   = "var(--gold-600)";
const line       = "var(--border)";
const fontDisp   = "var(--font-display)";
const fontBody   = "var(--font-body)";

// Compact pricing-tier metadata, sourced from TIERS config
function tierCard(tierKey) {
  const t = TIERS[tierKey];
  if (!t) return null;
  const subline = {
    free:    "3-day plans · 2 / month",
    starter: "5-day plans · 10 / month",
    pro:     "7-day plans · Unlimited",
    family:  "4 profiles · Everything",
  }[tierKey] || "";
  return { name: t.name, price: t.priceLabel, period: t.period, sub: subline, popular: t.popular };
}

export default function Landing({ navigate }) {
  const ctaVariant = useRef(getVariant(HERO_CTA_TEST)).current;
  const cta = CTA_VARIANTS[ctaVariant];

  useEffect(() => { logImpression(HERO_CTA_TEST, ctaVariant); }, []); // eslint-disable-line

  function handleSignupCta() {
    logClick(HERO_CTA_TEST, ctaVariant);
    navigate("signup");
  }

  return (
    <div style={{ background: paper, color: ink, fontFamily: fontBody }}>

      {/* Mobile overrides */}
      <style>{`
        @media (max-width: 900px) {
          .ml-hero-grid    { grid-template-columns: 1fr !important; gap: 48px !important; min-height: auto !important; padding: 32px 0 56px !important; }
          .ml-hero-h1      { font-size: 48px !important; }
          .ml-features     { grid-template-columns: 1fr !important; }
          .ml-ages         { grid-template-columns: repeat(2, 1fr) !important; gap: 28px !important; }
          .ml-bottom-grid  { grid-template-columns: 1fr !important; gap: 56px !important; }
          .ml-tiers        { grid-template-columns: repeat(2, 1fr) !important; }
          .ml-final-h2     { font-size: 32px !important; }
          .ml-section-h2   { font-size: 32px !important; }
        }
      `}</style>

      {/* ── Top announcement bar ──────────────────────────────────── 
      <div style={{ background: walnutDark, padding: "10px 24px", textAlign: "center" }}>
        <span style={{ fontSize: 11, color: goldPale, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500 }}>
          Early access · First 100 members receive 3 months Pro free.{" "}
          <button onClick={() => navigate("early-access")}
            style={{ background: "none", border: "none", color: gold, fontSize: 11, fontWeight: 500, cursor: "pointer", textDecoration: "underline", fontFamily: "inherit", letterSpacing: "inherit", textTransform: "inherit" }}>
            Claim your spot →
          </button>
        </span>
      </div> */}

      {/* ════════════ SCREEN 1: HERO ════════════ */}
      <section style={{ padding: "48px 0 56px", minHeight: "calc(100vh - 0px)", display: "flex", alignItems: "center" }}>
        <div className="ml-hero-grid container" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 80, alignItems: "center", width: "100%" }}>

          {/* Left column */}
          <div className="anim-fade-up">
            <div style={{ fontSize: 11, color: walnut, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 28, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 14 }}>
              <span style={{ width: 28, height: 1, background: walnut, display: "inline-block" }} />
              Indian Wellness, Considered
            </div>

            <h1 className="ml-hero-h1" style={{ fontFamily: fontDisp, fontSize: 76, fontWeight: 300, lineHeight: 1.0, letterSpacing: "-0.035em", color: ink, marginBottom: 28, fontVariationSettings: '"opsz" 144' }}>
              The way we<br />
              <em style={{ fontStyle: "italic", color: walnut, fontWeight: 300 }}>should have been</em><br />
              eating.
            </h1>

            <p style={{ fontSize: 17, lineHeight: 1.65, color: inkSoft, marginBottom: 36, maxWidth: 480 }}>
              Personalized Indian meal plans — designed for your body, your family, and the kitchen you actually cook in. AI-generated, nutritionist-refined, real Indian food.
            </p>

            <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 36, flexWrap: "wrap" }}>
              <button
                onClick={handleSignupCta}
                style={{ background: walnut, color: paperCard, padding: "16px 32px", border: "none", borderRadius: 2, fontSize: 12, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", fontFamily: fontBody, transition: "background .2s" }}
                onMouseOver={(e) => e.currentTarget.style.background = walnutDark}
                onMouseOut={(e) => e.currentTarget.style.background = walnut}>
                {cta.label}
              </button>
              <button
                onClick={() => navigate("how-it-works")}
                style={{ background: "none", border: "none", color: ink, fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: fontBody, paddingBottom: 4, borderBottom: `1px solid ${ink}` }}>
                See how it works
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, color: inkLight, fontSize: 13, fontStyle: "italic", fontFamily: fontDisp }}>
              <div style={{ display: "flex" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${paper}`, background: goldPale, color: walnutDark, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontDisp, fontWeight: 500, fontSize: 11 }}>P</div>
                <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${paper}`, background: walnut, color: paperCard, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontDisp, fontWeight: 500, fontSize: 11, marginLeft: -8 }}>A</div>
                <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${paper}`, background: gold, color: paperCard, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontDisp, fontWeight: 500, fontSize: 11, marginLeft: -8 }}>M</div>
              </div>
              <span>Trusted by 2,400 home kitchens · Free to begin</span>
            </div>
          </div>

          {/* Right column: hero meal-preview card */}
          <div className="anim-fade-up-2" style={{ background: paperCard, border: `1px solid ${line}`, padding: 32, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: inkLight, marginBottom: 24 }}>
              <span>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: walnut, marginRight: 8, display: "inline-block", verticalAlign: "middle" }} />
                Today's plan
              </span>
              <span>No. 01</span>
            </div>
            <div style={{ fontFamily: fontDisp, fontSize: 22, fontWeight: 400, color: ink, marginBottom: 4, letterSpacing: "-0.01em" }}>
              A Monday for one.
            </div>
            <div style={{ fontFamily: fontDisp, fontStyle: "italic", fontSize: 14, color: inkLight, marginBottom: 28 }}>
              Vegetarian · 1,370 kcal · balanced
            </div>

            {SAMPLE_MEALS.map((m, i) => (
              <div key={m.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "14px 0", borderBottom: i < SAMPLE_MEALS.length - 1 ? `1px solid ${line}` : "none" }}>
                <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: walnut, fontWeight: 500, width: 70, flexShrink: 0 }}>{m.type}</span>
                <span style={{ fontFamily: fontDisp, fontSize: 16, color: ink, flex: 1, padding: "0 16px", letterSpacing: "-0.005em" }}>{m.name}</span>
                <span style={{ fontSize: 12, color: inkLight, fontFamily: fontDisp, fontStyle: "italic" }}>{m.cal} kcal</span>
              </div>
            ))}

            <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${ink}`, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: fontDisp, fontSize: 18, color: ink }}>
                1,370 kcal <em style={{ fontStyle: "italic", color: goldDark }}>— balanced</em>
              </span>
              <span style={{ fontSize: 11, color: inkLight, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Macros · Shopping list · Recipes
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Press line ────────────────────────────────────────────── */}
      <div className="container">
        <div style={{ padding: "28px 0", textAlign: "center", fontSize: 10, color: inkLight, letterSpacing: "0.28em", textTransform: "uppercase", fontFamily: fontDisp, fontStyle: "italic", borderTop: `1px solid ${line}`, borderBottom: `1px solid ${line}` }}>
          <em>As featured in</em>&nbsp;&nbsp;
          <span style={{ fontStyle: "normal", margin: "0 20px" }}>YourStory</span>·
          <span style={{ fontStyle: "normal", margin: "0 20px" }}>The Hindu</span>·
          <span style={{ fontStyle: "normal", margin: "0 20px" }}>Mint</span>·
          <span style={{ fontStyle: "normal", margin: "0 20px" }}>Vogue India</span>
        </div>
      </div>

      {/* ════════════ SCREEN 2: EVERYTHING ELSE ════════════ */}
      <section style={{ padding: "56px 0" }}>
        <div className="container">

          {/* Section header */}
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}>
            <div style={{ fontSize: 10, color: walnut, letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: 16, fontWeight: 500 }}>
              — Everything in one practice —
            </div>
            <h2 className="ml-section-h2" style={{ fontFamily: fontDisp, fontSize: 40, fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.03em", color: ink, marginBottom: 16 }}>
              The full <em style={{ fontStyle: "italic" }}>kitchen practice</em>.
            </h2>
            <p style={{ fontSize: 15, color: inkSoft, lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
              Built around how Indians actually eat — adapted to your conditions, your family, your life.
            </p>
          </div>

          {/* Features 3x2 grid */}
          <div className="ml-features" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: line, border: `1px solid ${line}`, marginBottom: 64 }}>
            {[
              { title: "AI Meal Plans",        body: "Personalized 7-day plans in 30 seconds. Built from your body, goals, and conditions." },
              { title: "Smart Shopping Lists", body: "Auto-generated, category-organized. One tap to BigBasket, Blinkit, or Zepto." },
              { title: "Nutrition Analysis",   body: "Macros and micros for every dish — without surrendering taste for tracking." },
              { title: "Family Profiles",      body: "Different plans for every family member, one account. Kids, teens, adults, seniors." },
              { title: "Leftover Chef",        body: "Tell us what's in your fridge. Get an Indian recipe in seconds. No waste, no decisions." },
              { title: "Certified Trainers",   body: "Book yoga instructors, gym trainers, and physiotherapists. Sessions from ₹400/hour." },
            ].map((f, i) => (
              <div key={f.title} style={{ background: paperCard, padding: "28px 24px" }}>
                <div style={{ fontFamily: fontDisp, fontStyle: "italic", fontSize: 12, color: gold, marginBottom: 10 }}>
                  No. {String(i + 1).padStart(2, "0")}
                </div>
                <h3 style={{ fontFamily: fontDisp, fontSize: 19, fontWeight: 400, color: ink, marginBottom: 8, letterSpacing: "-0.01em" }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 13, color: inkSoft, lineHeight: 1.65 }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>

          {/* Age groups */}
          <div className="ml-ages" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, marginBottom: 80, paddingTop: 48, borderTop: `1px solid ${line}` }}>
            {[
              { age: "Kids",    range: "Under 12", body: "Fun, vitamin-rich meals built around growth and a child's palate." },
              { age: "Teens",   range: "13 – 17",  body: "High-protein, high-energy plans for growing bodies and demanding days." },
              { age: "Adults",  range: "18 – 59",  body: "Balanced, sustainable plans for working life and family demands." },
              { age: "Seniors", range: "60+",      body: "Anti-inflammatory, easy-to-digest meals high in calcium and fiber." },
            ].map((g, i) => (
              <div key={g.age}>
                <div style={{ fontFamily: fontDisp, fontStyle: "italic", fontSize: 13, color: gold, marginBottom: 12 }}>
                  — {String(i + 1).padStart(2, "0")}
                </div>
                <h4 style={{ fontFamily: fontDisp, fontSize: 22, fontWeight: 400, color: ink, marginBottom: 2, letterSpacing: "-0.015em" }}>
                  {g.age}
                </h4>
                <div style={{ fontSize: 12, color: inkLight, fontStyle: "italic", fontFamily: fontDisp, marginBottom: 10 }}>
                  {g.range}
                </div>
                <p style={{ fontSize: 13, color: inkSoft, lineHeight: 1.65 }}>
                  {g.body}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom: Pricing + Testimonials side-by-side */}
          <div className="ml-bottom-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 64, marginBottom: 32 }}>

            {/* Pricing */}
            <div>
              <div style={{ fontSize: 11, color: walnut, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12, fontWeight: 500 }}>
                — Begin where you are —
              </div>
              <h3 style={{ fontFamily: fontDisp, fontSize: 28, fontWeight: 300, color: ink, marginBottom: 24, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
                Simple, <em style={{ fontStyle: "italic" }}>transparent</em>.
              </h3>

              <div className="ml-tiers" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {Object.keys(TIERS).map((k) => {
                  const c = tierCard(k);
                  if (!c) return null;
                  const isPopular = c.popular;
                  return (
                    <button
                      key={k}
                      onClick={() => navigate("signup")}
                      style={{
                        background: paperCard,
                        border: `${isPopular ? 1.5 : 1}px solid ${isPopular ? walnut : line}`,
                        padding: "18px 14px",
                        textAlign: "center",
                        cursor: "pointer",
                        fontFamily: fontBody,
                        transition: "border-color .2s",
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = walnut}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = isPopular ? walnut : line}>
                      <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: isPopular ? goldDark : walnut, marginBottom: 8, fontWeight: 500 }}>
                        {c.name}{isPopular ? " · Popular" : ""}
                      </div>
                      <div style={{ fontFamily: fontDisp, fontSize: 24, fontWeight: 400, color: ink, letterSpacing: "-0.02em", marginBottom: 4 }}>
                        {c.price}
                        {c.period && <em style={{ fontSize: 11, fontStyle: "italic", color: inkLight, marginLeft: 2 }}>{c.period}</em>}
                      </div>
                      <div style={{ fontSize: 11, color: inkLight, lineHeight: 1.5 }}>
                        {c.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: inkSoft, fontStyle: "italic", fontFamily: fontDisp }}>
                Cancel any time, without ceremony.
              </div>
            </div>

            {/* Testimonials */}
            <div>
              <div style={{ fontSize: 11, color: walnut, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12, fontWeight: 500 }}>
                — From the kitchen —
              </div>
              <h3 style={{ fontFamily: fontDisp, fontSize: 28, fontWeight: 300, color: ink, marginBottom: 24, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
                What <em style={{ fontStyle: "italic" }}>readers say</em>.
              </h3>

              {[
                { quote: "Finally an app that actually understands Indian food. My family loves them.", name: "Priya S.", city: "Bengaluru" },
                { quote: "A full week of meals in seconds. Better than anything I've seen for Indian nutrition.", name: "Rahul M.", city: "Hyderabad" },
                { quote: "Booked a yoga session — seamless. The trainer knew exactly what I needed.", name: "Ananya K.", city: "Chennai" },
              ].map((t) => (
                <div key={t.name} style={{ borderLeft: `2px solid ${walnut}`, paddingLeft: 16, marginBottom: 20 }}>
                  <p style={{ fontFamily: fontDisp, fontSize: 14, color: ink, lineHeight: 1.5, marginBottom: 6 }}>
                    "{t.quote}"
                  </p>
                  <div style={{ fontSize: 11, color: walnut, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}>
                    {t.name} <em style={{ fontStyle: "italic", color: inkLight, marginLeft: 4, fontFamily: fontDisp, textTransform: "none", letterSpacing: 0 }}>· {t.city}</em>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section style={{ background: walnutDark, padding: "64px 0", textAlign: "center" }}>
        <div className="container">
          <h2 className="ml-final-h2" style={{ fontFamily: fontDisp, fontSize: 44, fontWeight: 300, color: goldPale, marginBottom: 16, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            The next meal you cook<br />could be <em style={{ fontStyle: "italic", color: gold }}>the right one</em>.
          </h2>
          <p style={{ color: "rgba(243, 233, 212, 0.6)", fontSize: 15, marginBottom: 32, fontStyle: "italic", fontFamily: fontDisp }}>
            Your first personalized Indian meal plan is thirty seconds away.
          </p>
          <button
            onClick={handleSignupCta}
            style={{ background: gold, color: walnutDark, padding: "18px 40px", border: "none", borderRadius: 2, fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", fontFamily: fontBody }}>
            Begin My Plan →
          </button>
          <div style={{ color: "rgba(243, 233, 212, 0.4)", fontSize: 11, marginTop: 16, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Free forever · No credit card · Thirty seconds
          </div>
        </div>
      </section>

    </div>
  );
}