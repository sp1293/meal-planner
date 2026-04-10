import { TIERS } from "../config";
import { PricingCard } from "../components";

export default function Landing({ navigate }) {
  const features = [
    { icon: "🧒", title: "Every Age Group",     desc: "Tailored plans for Kids, Teens, Adults and Seniors — each with age-specific nutrition and portion guidance." },
    { icon: "🤖", title: "Powered by Claude Opus", desc: "The most advanced AI model generates deeply personalized, nutritionally balanced meal plans in seconds." },
    { icon: "🛒", title: "Smart Shopping Lists", desc: "Auto-generated grocery lists organized by category — so you never forget an ingredient." },
    { icon: "📊", title: "Nutrition Analysis",   desc: "Get detailed macro and micronutrient breakdowns for every plan you generate." },
    { icon: "👨‍👩‍👧‍👦", title: "Family Profiles",     desc: "Manage separate meal plans for every family member, all from one account." },
    { icon: "🔄", title: "Instant Swaps",        desc: "Don't like a meal? Swap it instantly and the AI regenerates just that one meal." },
  ];

  return (
    <div>
      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)",
        padding: "100px 24px 80px", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 80%, rgba(34,197,94,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(234,179,8,0.1) 0%, transparent 50%)" }} />
        <div style={{ maxWidth: 760, margin: "0 auto", position: "relative" }} className="anim-fade-up">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "var(--radius-full)", padding: "6px 16px", marginBottom: 28 }}>
            <span style={{ fontSize: 12 }}>✨</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>Powered by Claude Opus — Anthropic's most powerful AI</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px, 7vw, 72px)", fontWeight: 700, color: "#fff", lineHeight: 1.1, marginBottom: 24 }}>
            Meal Plans for <br />
            <span style={{ color: "#4ade80" }}>Every Age.</span> Every Need.
          </h1>
          <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "rgba(255,255,255,0.75)", maxWidth: 540, margin: "0 auto 40px", lineHeight: 1.7 }}>
            AI-generated weekly meal plans tailored for kids, teens, adults, and seniors — with smart shopping lists and nutrition analysis.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-lg" onClick={() => navigate("signup")}
              style={{ background: "#4ade80", color: "#052e16", fontWeight: 700, fontSize: 16 }}>
              Start free — no card needed →
            </button>
            <button className="btn btn-lg btn-ghost" onClick={() => navigate("login")}
              style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.08)" }}>
              Sign in
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ maxWidth: 700, margin: "60px auto 0", display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap" }} className="anim-fade-up-2">
          {[["4","Age Groups Supported"],["7","Day Meal Plans"],["∞","Dietary Combinations"]].map(([val, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 700, color: "#4ade80" }}>{val}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Age Groups Showcase */}
      <section style={{ padding: "80px 24px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 42px)", color: "var(--primary-dark)", marginBottom: 12 }}>Built for Every Stage of Life</h2>
            <p style={{ fontSize: 16, color: "var(--text-3)", maxWidth: 500, margin: "0 auto" }}>One app. Four age-specific nutrition approaches. Countless meal possibilities.</p>
          </div>
          <div className="grid-4">
            {[
              { icon: "🧒", label: "Kids",    range: "Under 12", color: "#fef3c7", border: "#fde68a", accent: "#d97706", desc: "Fun, colorful meals kids actually want to eat. No spicy food. Packed with vitamins for growth." },
              { icon: "👦", label: "Teens",   range: "13–17",    color: "#ffe4e6", border: "#fecdd3", accent: "#e11d48", desc: "High-protein, high-energy plans for growing bodies and active lifestyles." },
              { icon: "👤", label: "Adults",  range: "18–59",    color: "#dbeafe", border: "#bfdbfe", accent: "#1d4ed8", desc: "Balanced macros, convenient prep times, and plans that fit a busy schedule." },
              { icon: "👴", label: "Seniors", range: "60+",      color: "#d1fae5", border: "#a7f3d0", accent: "#059669", desc: "Easy to chew, heart-healthy, anti-inflammatory meals with high calcium and fiber." },
            ].map(g => (
              <div key={g.label} style={{ background: g.color, border: `1.5px solid ${g.border}`, borderRadius: "var(--radius-lg)", padding: 24 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{g.icon}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: g.accent, marginBottom: 4 }}>{g.label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: g.accent, opacity: 0.7, marginBottom: 12 }}>{g.range}</div>
                <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65 }}>{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 42px)", color: "var(--primary-dark)", marginBottom: 12 }}>Everything You Need</h2>
            <p style={{ fontSize: 16, color: "var(--text-3)" }}>One subscription. A complete nutrition planning system.</p>
          </div>
          <div className="grid-3">
            {features.map(f => (
              <div key={f.title} className="card card-hover">
                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--primary-dark)", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: "80px 24px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 42px)", color: "var(--primary-dark)", marginBottom: 12 }}>Simple, Transparent Pricing</h2>
            <p style={{ fontSize: 16, color: "var(--text-3)" }}>Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid-4" style={{ alignItems: "start" }}>
            {Object.keys(TIERS).map(key => (
              <PricingCard key={key} tierKey={key} currentTier={null} onSelect={() => navigate("signup")} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px", background: "var(--primary-dark)", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)", color: "#fff", marginBottom: 16 }}>Start Eating Better Today</h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 32 }}>Join thousands of families planning healthier meals with Mitabhukta.</p>
          <button className="btn btn-lg" onClick={() => navigate("signup")}
            style={{ background: "#4ade80", color: "#052e16", fontWeight: 700 }}>
            Create your free account →
          </button>
        </div>
      </section>
    </div>
  );
}
