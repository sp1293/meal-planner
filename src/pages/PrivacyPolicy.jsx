export default function PrivacyPolicy({ navigate }) {
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
      <h1 style={s.h1}>Privacy Policy</h1>
      <p style={s.meta}>Last updated: April 2025 · Effective: April 2025</p>
      <p style={s.p}>Mitabhukta is committed to protecting your privacy. This policy explains how we collect, use, and protect your personal information when you use <a href="https://mitabhukta.com" style={{ color:"var(--primary)" }}>mitabhukta.com</a>.</p>
      <hr style={s.divider} />

      <h2 style={s.h2}>1. Information We Collect</h2>
      <p style={s.p}><strong>Information you provide:</strong></p>
      <ul>
        <li style={s.li}>Name and email address on registration</li>
        <li style={s.li}>Gender (for trainer matching and meal personalization)</li>
        <li style={s.li}>Age group preference and dietary preferences</li>
        <li style={s.li}>Session notes provided for trainer bookings</li>
        <li style={s.li}>Payment info (processed securely by Razorpay — we never store card details)</li>
      </ul>
      <p style={s.p}><strong>Collected automatically:</strong></p>
      <ul>
        <li style={s.li}>Device type, browser, IP address and approximate location</li>
        <li style={s.li}>Pages visited, features used, and session duration</li>
        <li style={s.li}>Referral source (how you found Mitabhukta)</li>
      </ul>

      <h2 style={s.h2}>2. How We Use Your Information</h2>
      <ul>
        <li style={s.li}>To provide and personalize meal plans and wellness features</li>
        <li style={s.li}>To process payments and manage subscriptions</li>
        <li style={s.li}>To manage trainer bookings and sessions</li>
        <li style={s.li}>To send transactional emails (booking confirmations, receipts)</li>
        <li style={s.li}>To improve our AI and platform features</li>
        <li style={s.li}>To prevent fraud and ensure platform security</li>
      </ul>

      <h2 style={s.h2}>3. Data Storage and Security</h2>
      <p style={s.p}>Your data is stored on Google Firebase (Firestore), hosted on Google Cloud. Our security measures include:</p>
      <ul>
        <li style={s.li}>All data encrypted in transit using TLS/HTTPS</li>
        <li style={s.li}>Trainer passwords hashed using bcrypt — never stored in plain text</li>
        <li style={s.li}>Firestore security rules restrict access so users can only read their own data</li>
        <li style={s.li}>API keys stored as environment variables — never in source code</li>
        <li style={s.li}>Payment card details never stored on our servers — handled by Razorpay's PCI-DSS infrastructure</li>
        <li style={s.li}>All backend API routes are rate-limited to prevent abuse</li>
      </ul>

      <h2 style={s.h2}>4. Data Sharing</h2>
      <p style={s.p}>We do not sell your personal data. We share information only with:</p>
      <ul>
        <li style={s.li}><strong>Trainers:</strong> Only your name and session notes for booked sessions</li>
        <li style={s.li}><strong>Service providers:</strong> Firebase (database), Resend (email), Razorpay (payments), Anthropic (AI — only meal request text, never personal details)</li>
        <li style={s.li}><strong>Legal requirements:</strong> If required by Indian law or court order</li>
      </ul>

      <h2 style={s.h2}>5. Your Rights</h2>
      <ul>
        <li style={s.li}><strong>Access:</strong> Request a copy of all personal data we hold about you</li>
        <li style={s.li}><strong>Correction:</strong> Update inaccurate info via Account Settings</li>
        <li style={s.li}><strong>Deletion:</strong> Request deletion by emailing <a href="mailto:privacy@mitabhukta.com" style={{ color:"var(--primary)" }}>privacy@mitabhukta.com</a></li>
        <li style={s.li}><strong>Portability:</strong> Request your data in a machine-readable format</li>
      </ul>
      <p style={s.p}>We will respond to all requests within 30 days.</p>

      <h2 style={s.h2}>6. Data Retention</h2>
      <ul>
        <li style={s.li}>Account data retained until you delete your account</li>
        <li style={s.li}>Booking records retained for 3 years for legal purposes</li>
        <li style={s.li}>Payment records retained for 7 years as required by Indian tax law</li>
        <li style={s.li}>Deleted account data purged within 30 days</li>
      </ul>

      <h2 style={s.h2}>7. Third-Party Services</h2>
      <ul>
        <li style={s.li}><strong>Google Firebase:</strong> <a href="https://firebase.google.com/support/privacy" style={{ color:"var(--primary)" }} target="_blank" rel="noopener noreferrer">firebase.google.com/support/privacy</a></li>
        <li style={s.li}><strong>Razorpay:</strong> <a href="https://razorpay.com/privacy/" style={{ color:"var(--primary)" }} target="_blank" rel="noopener noreferrer">razorpay.com/privacy</a></li>
        <li style={s.li}><strong>Anthropic (Claude AI):</strong> <a href="https://www.anthropic.com/privacy" style={{ color:"var(--primary)" }} target="_blank" rel="noopener noreferrer">anthropic.com/privacy</a></li>
        <li style={s.li}><strong>Resend (Email):</strong> <a href="https://resend.com/privacy" style={{ color:"var(--primary)" }} target="_blank" rel="noopener noreferrer">resend.com/privacy</a></li>
      </ul>

      <h2 style={s.h2}>8. Children's Privacy</h2>
      <p style={s.p}>Mitabhukta is not directed to children under 13. We do not knowingly collect data from children under 13.</p>

      <h2 style={s.h2}>9. Changes to This Policy</h2>
      <p style={s.p}>We will notify you of significant changes via email or in-app notice at least 14 days before they take effect.</p>

      <h2 style={s.h2}>10. Contact</h2>
      <div style={{ background:"var(--bg-muted)", borderRadius:"var(--radius-md)", padding:"16px 20px", fontSize:14, lineHeight:2, color:"var(--text-2)" }}>
        <strong>Mitabhukta — Privacy Team</strong><br/>
        Email: <a href="mailto:privacy@mitabhukta.com" style={{ color:"var(--primary)" }}>privacy@mitabhukta.com</a><br/>
        Location: Bengaluru, Karnataka, India
      </div>
      <hr style={s.divider} />
      <p style={{ fontSize:13, color:"var(--text-4)" }}>© {new Date().getFullYear()} Mitabhukta. All rights reserved.</p>
    </div>
  );
}