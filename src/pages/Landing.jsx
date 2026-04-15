import { useEffect, useRef } from "react";
import { TIERS } from "../config";
import { PricingCard } from "../components";
import { getVariant, logImpression, logClick } from "../utils/abTest";

const HERO_CTA_TEST = "hero-cta-v1";
const CTA_VARIANTS  = {
  A: { label: "Get Started Free →",        style: { background: "#4ade80", color: "#052e16" } },
  B: { label: "Plan My First Meal Free →", style: { background: "#f97316", color: "#fff"    } },
};

export default function Landing({ navigate }) {
  const ctaVariant = useRef(getVariant(HERO_CTA_TEST)).current;
  const cta = CTA_VARIANTS[ctaVariant];

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
      <section style={{ background: "linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%)", padding: "64px 24px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 80%,rgba(34,197,94,0.15) 0%,transparent 50%),radial-gradient(circle at 80% 20%,rgba(234,179,8,0.1) 0%,transparent 50%)" }} />
        <div style={{ maxWidth: 680, margin: "0 auto", position: "relative" }} className="anim-fade-up">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "var(--radius-full)", padding: "5px 14px", marginBottom: 20 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>✨ AI-Powered Indian Wellness Platform</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px,6vw,64px)", fontWeight: 700, color: "#fff", lineHeight: 1.1, marginBottom: 18 }}>
            Eat Mindfully.<br /><span style={{ color: "#4ade80" }}>Live Fully.</span>
          </h1>
          <p style={{ fontSize: "clamp(15px,2vw,18px)", color: "rgba(255,255,255,0.72)", maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.65 }}>
            AI-powered Indian meal plans, calorie tracking, and certified trainer booking — all in one place. Free to start.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
            <button className="btn btn-lg"
              style={{ ...cta.style, fontWeight: 700, fontSize: 15 }}
              onClick={() => { logClick(HERO_CTA_TEST, ctaVariant); navigate("signup"); }}>
              {cta.label}
            </button>
            <button className="btn btn-lg btn-ghost" onClick={() => navigate("login")}
              style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.08)", fontSize: 15 }}>
              Sign in
            </button>
          </div>

          {/* Stats inline */}
          <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
            {[["4","Age Groups"],["7‑Day","Meal Plans"],["∞","Indian Recipes"],["100%","Free to Start"]].map(([val,label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "#4ade80" }}>{val}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features + Age Groups (combined) ─────────────────────────── */}
      <section style={{ padding: "48px 24px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>

          {/* Section label */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,3.5vw,36px)", color: "var(--primary-dark)", marginBottom: 8 }}>Everything You Need</h2>
            <p style={{ fontSize: 14, color: "var(--text-3)" }}>One subscription. A complete wellness system built for India.</p>
          </div>

          {/* 6 feature cards — compact 3x2 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 32 }}>
            {[
              { icon: "🤖", title: "Claude AI Plans",      desc: "Deeply personalized Indian meal plans generated in seconds." },
              { icon: "🛒", title: "Smart Shopping Lists", desc: "Auto-generated grocery lists organized by category." },
              { icon: "📊", title: "Nutrition Analysis",   desc: "Macro & micronutrient breakdowns for every plan." },
              { icon: "👨‍👩‍👧‍👦", title: "Family Profiles",    desc: "Separate plans for every family member, one account." },
              { icon: "🍳", title: "Leftover Chef",        desc: "Turn fridge ingredients into healthy Indian recipes instantly." },
              { icon: "💪", title: "Certified Trainers",   desc: "Book verified yoga & fitness trainers directly through the app." },
            ].map(f => (
              <div key={f.title} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "18px 16px" }}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--primary-dark)", marginBottom: 4 }}>{f.title}</div>
                <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Age Groups — compact horizontal strip */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px 24px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-3)", marginBottom: 14, textTransform: "uppercase", letterSpacing: ".5px" }}>Built for Every Stage of Life</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              {[
                { icon: "🧒", label: "Kids",    range: "Under 12", color: "#fef3c7", accent: "#d97706", desc: "Fun, colorful meals. Packed with vitamins for growth." },
                { icon: "👦", label: "Teens",   range: "13–17",    color: "#ffe4e6", accent: "#e11d48", desc: "High-protein plans for growing, active bodies." },
                { icon: "👤", label: "Adults",  range: "18–59",    color: "#dbeafe", accent: "#1d4ed8", desc: "Balanced macros that fit a busy schedule." },
                { icon: "👴", label: "Seniors", range: "60+",      color: "#d1fae5", accent: "#059669", desc: "Heart-healthy, easy-to-digest, anti-inflammatory." },
              ].map(g => (
                <div key={g.label} style={{ background: g.color, borderRadius: "var(--radius-md)", padding: "14px 12px" }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{g.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: g.accent }}>{g.label}</div>
                  <div style={{ fontSize: 11, color: g.accent, opacity: 0.7, marginBottom: 6 }}>{g.range}</div>
                  <p style={{ fontSize: 11, color: "#374151", lineHeight: 1.5, margin: 0 }}>{g.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────── */}
      <section style={{ padding: "48px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,3.5vw,36px)", color: "var(--primary-dark)", marginBottom: 8 }}>Simple, Transparent Pricing</h2>
            <p style={{ fontSize: 14, color: "var(--text-3)" }}>Start free. Upgrade when you're ready. No hidden fees.</p>
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

      {/* ── Social proof ──────────────────────────────────────────────── */}
      <section style={{ padding: "40px 24px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px,3vw,28px)", color: "var(--primary-dark)", marginBottom: 4 }}>What Our Users Say</h2>
          </div>
          <div className="grid-3">
            {[
              { name: "Priya S.",  city: "Bengaluru", quote: "Finally an app that understands Indian food! The meal plans are practical and delicious.", rating: 5 },
              { name: "Rahul M.",  city: "Hyderabad", quote: "The calorie tracker with photo AI is a game changer. Snap a photo of my thali and it's done.", rating: 5 },
              { name: "Ananya K.", city: "Chennai",   quote: "Booked a yoga session through Mitabhukta — so easy! The trainer was amazing.", rating: 5 },
            ].map(t => (
              <div key={t.name} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "18px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 16, marginBottom: 8, color: "#f59e0b" }}>{"★".repeat(t.rating)}</div>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.65, marginBottom: 12, fontStyle: "italic" }}>"{t.quote}"</p>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary-dark)" }}>{t.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-4)" }}>{t.city}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section style={{ padding: "48px 24px", background: "var(--primary-dark)", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,3.5vw,38px)", color: "#fff", marginBottom: 12 }}>
            Start Your Wellness Journey Today
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", marginBottom: 24, lineHeight: 1.65 }}>
            Join families across India planning healthier meals with Mitabhukta. Free to start — no credit card needed.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-lg" onClick={() => navigate("signup")}
              style={{ background: "#4ade80", color: "#052e16", fontWeight: 700, fontSize: 15 }}>
              Create Free Account →
            </button>
            <button className="btn btn-lg btn-ghost" onClick={() => navigate("early-access")}
              style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.08)", fontSize: 15 }}>
              🚀 Early Access
            </button>
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 14 }}>
            Free forever · No credit card · Cancel anytime
          </p>
        </div>
      </section>

    </div>
  );
}