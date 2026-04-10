export default function Guidelines({ navigate }) {
  const studentRules = [
    { icon: "💳", title: "Pay only through Mitabhukta", desc: "Never pay trainers directly via UPI, cash, or bank transfer. All payments must go through our secure platform. This protects you with refund rights and session guarantees." },
    { icon: "🔒", title: "Keep contact details private", desc: "Do not share your personal phone number, WhatsApp, Instagram, or email with trainers. All communication happens through Mitabhukta's messaging system." },
    { icon: "📹", title: "Use only Mitabhukta session links", desc: "Video sessions are conducted via secure links provided by Mitabhukta. Never accept external Zoom/Meet links from trainers outside the platform." },
    { icon: "🚨", title: "Report policy violations immediately", desc: "If a trainer asks for direct payment or personal contact, report it immediately. We take all reports seriously and act within 24 hours." },
    { icon: "⭐", title: "Leave honest reviews", desc: "After each session, leave an honest review. This helps other students make informed decisions and helps us maintain quality on the platform." },
    { icon: "📋", title: "Cancellation policy", desc: "Cancel at least 12 hours before your session for a full refund. Late cancellations may incur a 50% fee. No-shows are non-refundable." },
  ];

  const trainerRules = [
    { icon: "💰", title: "Receive payments through Mitabhukta only", desc: "All session payments are processed through Mitabhukta and transferred to your account within 3-5 business days after session completion. Never request direct payment from students." },
    { icon: "🚫", title: "No off-platform contact", desc: "Do not share or request personal contact information (phone, WhatsApp, Instagram) with students. Violations result in immediate suspension." },
    { icon: "📅", title: "Honor your bookings", desc: "Confirmed bookings must be honored. More than 2 last-minute cancellations per month may result in reduced visibility or account suspension." },
    { icon: "🎓", title: "Maintain certifications", desc: "Your profile and certifications must be up to date. Misrepresenting qualifications will result in permanent removal from the platform." },
    { icon: "💬", title: "Professional conduct always", desc: "Maintain professional conduct with all students at all times. Inappropriate behavior of any kind results in immediate permanent ban." },
    { icon: "📊", title: "Commission structure", desc: "Mitabhukta retains a platform commission from each booking to cover payment processing, platform maintenance, and student acquisition. You keep the majority of each session fee." },
  ];

  const bypassConsequences = [
    "First offense: Official warning sent to both parties",
    "Second offense: 30-day account suspension",
    "Third offense: Permanent removal from the platform",
    "Trainer profile removed and not eligible to rejoin",
    "Student account permanently banned",
    "Legal action may be pursued for repeated violations",
  ];

  return (
    <div className="page-md" style={{ margin: "0 auto", padding: "48px 24px" }}>
      <div className="page-title anim-fade-up">
        <h1>🔒 Platform Guidelines</h1>
        <p>Rules and security guidelines for all Mitabhukta users. Please read carefully before using the platform.</p>
      </div>

      {/* Last updated */}
      <div style={{ fontSize: 12, color: "var(--text-4)", marginBottom: 32 }}>Last updated: April 2026 · Version 1.0</div>

      {/* Introduction */}
      <div className="card anim-fade-up-2" style={{ marginBottom: 24, background: "var(--primary-pale)", border: "1px solid var(--primary-soft)" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)", marginBottom: 10 }}>Our Platform Promise</h2>
        <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.8 }}>
          Mitabhukta is a trusted marketplace connecting students with certified wellness professionals.
          We handle all payments, scheduling, and communication to ensure a safe, transparent experience for everyone.
          These guidelines exist to protect both students and trainers, and ensure the highest quality of service.
        </p>
      </div>

      {/* Student Guidelines */}
      <div className="card anim-fade-up-2" style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary-dark)", marginBottom: 20 }}>
          👨‍🎓 Guidelines for Students
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {studentRules.map((rule, i) => (
            <div key={i} style={{ display: "flex", gap: 16, padding: 16, background: "var(--bg-muted)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{rule.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>{rule.title}</div>
                <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.65, margin: 0 }}>{rule.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trainer Guidelines */}
      <div className="card anim-fade-up-3" style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary-dark)", marginBottom: 20 }}>
          🏋️ Guidelines for Trainers
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {trainerRules.map((rule, i) => (
            <div key={i} style={{ display: "flex", gap: 16, padding: 16, background: "var(--bg-muted)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{rule.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>{rule.title}</div>
                <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.65, margin: 0 }}>{rule.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Off-platform bypass policy */}
      <div className="card anim-fade-up-4" style={{ marginBottom: 24, border: "2px solid #fecaca", background: "#fff5f5" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "#991b1b", marginBottom: 12 }}>
          🚨 Off-Platform Activity Policy
        </h2>
        <p style={{ fontSize: 14, color: "#7f1d1d", lineHeight: 1.7, marginBottom: 16 }}>
          Attempting to bypass Mitabhukta — including arranging direct payments, sharing personal contact details,
          or conducting sessions outside the platform — is a serious violation of our Terms of Service.
          This applies to both students and trainers.
        </p>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#991b1b", marginBottom: 10 }}>Consequences of violation:</div>
          {bypassConsequences.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#7f1d1d", marginBottom: 8 }}>
              <span>⚠️</span> {c}
            </div>
          ))}
        </div>
        <div style={{ background: "#fef2f2", borderRadius: "var(--radius-sm)", padding: 14, fontSize: 13, color: "#991b1b", fontWeight: 500 }}>
          💡 Why do we enforce this strictly? Mitabhukta invests significantly in acquiring students, maintaining the platform, processing payments securely, and vetting trainers. Off-platform activity harms the entire community and undermines the trust that makes Mitabhukta valuable for everyone.
        </div>
      </div>

      {/* Data Security */}
      <div className="card anim-fade-up-4" style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary-dark)", marginBottom: 16 }}>
          🛡️ Data & Cyber Security
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { icon: "🔐", title: "Account security", desc: "Use a strong unique password. Enable two-factor authentication when available. Never share your login credentials with anyone." },
            { icon: "🎣", title: "Phishing awareness", desc: "Mitabhukta will never ask for your password via email or chat. Be suspicious of any message asking for personal info or payment outside the app." },
            { icon: "🔗", title: "Safe links only", desc: "Only click links sent through official Mitabhukta emails (from @mitabhukta.com). Report suspicious links immediately." },
            { icon: "📱", title: "Secure devices", desc: "Always log out of Mitabhukta on shared devices. Keep your phone and browser updated for the latest security patches." },
            { icon: "💾", title: "Your data rights", desc: "You can request deletion of your account and data at any time by contacting support@mitabhukta.com. We comply within 30 days." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)", marginBottom: 3 }}>{item.title}</div>
                <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Refund Policy */}
      <div className="card anim-fade-up-4" style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary-dark)", marginBottom: 16 }}>
          💸 Refund Policy
        </h2>
        <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.8 }}>
          <div style={{ marginBottom: 10 }}>✅ <strong>Full refund:</strong> Cancel 12+ hours before session start time.</div>
          <div style={{ marginBottom: 10 }}>⚠️ <strong>50% refund:</strong> Cancel within 12 hours of session start time.</div>
          <div style={{ marginBottom: 10 }}>❌ <strong>No refund:</strong> No-show without cancellation.</div>
          <div style={{ marginBottom: 10 }}>✅ <strong>Full refund:</strong> If trainer cancels or fails to show.</div>
          <div>✅ <strong>Full refund:</strong> Technical issues preventing the session from occurring.</div>
        </div>
      </div>

      {/* Contact */}
      <div className="card" style={{ textAlign: "center", padding: 32 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--primary-dark)", marginBottom: 10 }}>Questions or Concerns?</h3>
        <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 16 }}>Our support team is here to help with any platform issues.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="mailto:support@mitabhukta.com" className="btn btn-primary btn-sm">✉️ support@mitabhukta.com</a>
          <a href="mailto:report@mitabhukta.com" className="btn btn-danger btn-sm">🚨 Report a Violation</a>
        </div>
      </div>
    </div>
  );
}
