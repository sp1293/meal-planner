export default function TermsOfService({ navigate }) {
  const s = {
    page:    { maxWidth:800, margin:"0 auto", padding:"48px 24px", fontFamily:"var(--font-body)" },
    h1:      { fontFamily:"var(--font-display)", fontSize:32, color:"var(--primary-dark)", marginBottom:8 },
    h2:      { fontFamily:"var(--font-display)", fontSize:20, color:"var(--primary-dark)", marginTop:36, marginBottom:10 },
    p:       { fontSize:15, lineHeight:1.8, color:"var(--text-2)", marginBottom:14 },
    li:      { fontSize:15, lineHeight:1.8, color:"var(--text-2)", marginBottom:6 },
    meta:    { fontSize:13, color:"var(--text-4)", marginBottom:32 },
    divider: { border:"none", borderTop:"1px solid var(--border)", margin:"32px 0" },
  };
  return (
    <div style={s.page}>
      <button onClick={() => navigate && navigate("landing")}
        style={{ background:"none", border:"none", color:"var(--primary)", cursor:"pointer", fontSize:14, marginBottom:24, padding:0, fontFamily:"var(--font-body)" }}>
        ← Back
      </button>
      <h1 style={s.h1}>Terms of Service</h1>
      <p style={s.meta}>Last updated: April 2025 · Effective: April 2025</p>
      <p style={s.p}>Welcome to Mitabhukta. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.</p>
      <hr style={s.divider} />

      <h2 style={s.h2}>1. About Mitabhukta</h2>
      <p style={s.p}>Mitabhukta is an AI-powered Indian wellness platform providing personalized meal planning, calorie tracking, leftover recipe generation, and certified trainer booking. We are operated from Bengaluru, India.</p>
      <p style={s.p}>Our platform uses Claude AI (by Anthropic) to generate meal recommendations. These are for general wellness only and do not constitute medical advice.</p>

      <h2 style={s.h2}>2. Eligibility</h2>
      <p style={s.p}>You must be at least 13 years old to use Mitabhukta. By using our services, you confirm that all information you provide is accurate and you will not use the platform for any unlawful purpose.</p>

      <h2 style={s.h2}>3. Account Registration</h2>
      <p style={s.p}>You are responsible for maintaining the confidentiality of your login credentials. Notify us immediately at <a href="mailto:support@mitabhukta.com" style={{ color:"var(--primary)" }}>support@mitabhukta.com</a> if you suspect unauthorized access.</p>

      <h2 style={s.h2}>4. Subscription Plans and Payments</h2>
      <p style={s.p}>Mitabhukta offers a free tier and paid subscription plans billed monthly via Razorpay.</p>
      <ul>
        <li style={s.li}><strong>Free Plan:</strong> 2 AI meal plans per month</li>
        <li style={s.li}><strong>Starter Plan (₹299/mo):</strong> Increased limits and shopping lists</li>
        <li style={s.li}><strong>Pro Plan (₹599/mo):</strong> Unlimited plans and all features</li>
        <li style={s.li}><strong>Family Plan (₹999/mo):</strong> All Pro features for up to 5 profiles</li>
      </ul>
      <p style={s.p}>Subscription fees are non-refundable except where required by law. We reserve the right to change pricing with 30 days' notice.</p>

      <h2 style={s.h2}>5. Trainer Booking</h2>
      <p style={s.p}>All bookings and payments must be made exclusively through Mitabhukta. You agree to:</p>
      <ul>
        <li style={s.li}>Never pay trainers directly outside the platform</li>
        <li style={s.li}>Not share personal contact information with trainers</li>
        <li style={s.li}>Honor our cancellation policy (12+ hrs = full refund; 6–12 hrs = 10% fee; 1–6 hrs = 20% fee; &lt;1 hr = 50% fee)</li>
        <li style={s.li}>Treat trainers with respect and professionalism</li>
      </ul>

      <h2 style={s.h2}>6. AI-Generated Content</h2>
      <p style={s.p}>Meal plans and nutritional information are for general wellness only. They do not constitute medical advice. Always consult a qualified healthcare provider before making significant dietary changes.</p>

      <h2 style={s.h2}>7. Acceptable Use</h2>
      <p style={s.p}>You agree not to hack, scrape, abuse, or misuse the platform in any way. Accounts that violate these terms may be suspended or terminated.</p>

      <h2 style={s.h2}>8. Intellectual Property</h2>
      <p style={s.p}>All content on Mitabhukta is owned by or licensed to us. You may not reproduce or distribute our content without written permission.</p>

      <h2 style={s.h2}>9. Limitation of Liability</h2>
      <p style={s.p}>Our total liability to you for any claim shall not exceed the amount you paid us in the 3 months preceding the claim. Mitabhukta is a wellness tool, not a medical device.</p>

      <h2 style={s.h2}>10. Governing Law</h2>
      <p style={s.p}>These Terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka.</p>

      <h2 style={s.h2}>11. Contact</h2>
      <div style={{ background:"var(--bg-muted)", borderRadius:"var(--radius-md)", padding:"16px 20px", fontSize:14, lineHeight:2, color:"var(--text-2)" }}>
        <strong>Mitabhukta</strong><br/>
        Email: <a href="mailto:legal@mitabhukta.com" style={{ color:"var(--primary)" }}>legal@mitabhukta.com</a><br/>
        Support: <a href="mailto:support@mitabhukta.com" style={{ color:"var(--primary)" }}>support@mitabhukta.com</a><br/>
        Location: Bengaluru, Karnataka, India
      </div>
      <hr style={s.divider} />
      <p style={{ fontSize:13, color:"var(--text-4)" }}>© {new Date().getFullYear()} Mitabhukta. All rights reserved.</p>
    </div>
  );
}