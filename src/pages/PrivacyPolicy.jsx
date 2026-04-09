export default function PrivacyPolicy({ navigate }) {
  return (
    <div className="page-md" style={{ margin: "0 auto", padding: "48px 24px" }}>
      <div className="page-title anim-fade-up">
        <h1>🔒 Privacy Policy</h1>
        <p>Last updated: April 2026 · Effective immediately</p>
      </div>

      <div className="card anim-fade-up-2" style={{ marginBottom: 20, background: "var(--primary-pale)", border: "1px solid var(--primary-soft)" }}>
        <p style={{ fontSize: 14, color: "var(--primary-dark)", lineHeight: 1.8 }}>
          NourishAI ("we", "us", "our") is committed to protecting your personal information.
          This Privacy Policy explains how we collect, use, and protect your data when you use our platform,
          in compliance with India's Information Technology Act, 2000 and the IT (Amendment) Act, 2008.
        </p>
      </div>

      {[
        {
          title: "1. Information We Collect",
          content: [
            { subtitle: "Account Information", text: "When you sign up, we collect your name, email address, and gender (optional, used for trainer matching). If you sign up with Google, we receive your name, email, and profile photo from Google." },
            { subtitle: "Booking Data", text: "When you book a trainer session, we store the trainer name, date, time, session type, and any notes you provide." },
            { subtitle: "Health & Fitness Data", text: "Information you voluntarily enter in our Calorie Tracker and Goal Tracker is stored locally on your device. We do not transmit this data to our servers." },
            { subtitle: "Usage Data", text: "We collect standard web analytics data including pages visited, features used, and session duration to improve our platform." },
          ],
        },
        {
          title: "2. How We Use Your Information",
          content: [
            { subtitle: "Platform Services", text: "To provide meal planning, trainer booking, and wellness tracking features." },
            { subtitle: "Trainer Matching", text: "Your gender preference is used solely to suggest appropriate trainers. It is never shared with third parties." },
            { subtitle: "Communications", text: "We may send booking confirmations and platform updates to your registered email. You can opt out at any time." },
            { subtitle: "Security", text: "To detect and prevent fraudulent activity, unauthorized access, and policy violations." },
          ],
        },
        {
          title: "3. Data Sharing",
          content: [
            { subtitle: "We Never Sell Your Data", text: "NourishAI does not sell, rent, or trade your personal information to any third party for commercial purposes." },
            { subtitle: "Trainers", text: "Trainers can only see your name and session notes for booked sessions. They cannot see your email, phone, or personal details." },
            { subtitle: "Service Providers", text: "We use Firebase (Google) for authentication and data storage, and Anthropic for AI meal planning. These providers have their own privacy policies." },
            { subtitle: "Legal Requirements", text: "We may disclose information if required by Indian law or court order." },
          ],
        },
        {
          title: "4. Data Security",
          content: [
            { subtitle: "Encryption", text: "All data is encrypted in transit using HTTPS/TLS. Firebase encrypts all data at rest." },
            { subtitle: "Access Controls", text: "Strict Firestore security rules ensure users can only access their own data. Admin access is limited to authorized personnel only." },
            { subtitle: "No Storage of Passwords", text: "We use Firebase Authentication. Your password is never stored in plain text on our servers." },
          ],
        },
        {
          title: "5. Your Rights",
          content: [
            { subtitle: "Access", text: "You can view all your data in your Account Settings at any time." },
            { subtitle: "Correction", text: "You can update your profile information directly in the app." },
            { subtitle: "Deletion", text: "You can request deletion of your account and all associated data by emailing support@nourishai.com. We will process your request within 30 days." },
            { subtitle: "Data Portability", text: "You can export your meal plans and booking history from the app." },
          ],
        },
        {
          title: "6. Cookies & Local Storage",
          content: [
            { subtitle: "Local Storage", text: "We use browser local storage to save your bookings, calorie logs, and preferences on your device. This data stays on your device and is not transmitted to our servers." },
            { subtitle: "Firebase Cookies", text: "Firebase Authentication uses cookies to maintain your login session. These are essential and cannot be disabled while using the platform." },
          ],
        },
        {
          title: "7. Children's Privacy",
          content: [
            { subtitle: "Age Requirement", text: "NourishAI is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected data from a child, please contact us immediately." },
          ],
        },
        {
          title: "8. Changes to This Policy",
          content: [
            { subtitle: "Updates", text: "We may update this Privacy Policy periodically. We will notify you of significant changes via email or an in-app notice. Continued use of the platform after changes constitutes acceptance." },
          ],
        },
      ].map((section, i) => (
        <div key={i} className="card anim-fade-up-3" style={{ marginBottom: 16 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)", marginBottom: 16 }}>{section.title}</h2>
          {section.content.map((item, j) => (
            <div key={j} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: j < section.content.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)", marginBottom: 4 }}>{item.subtitle}</div>
              <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7, margin: 0 }}>{item.text}</p>
            </div>
          ))}
        </div>
      ))}

      {/* Contact */}
      <div className="card" style={{ textAlign: "center", padding: 32 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--primary-dark)", marginBottom: 10 }}>Questions about your privacy?</h3>
        <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 16 }}>
          Contact our Data Protection Officer at:
        </p>
        <a href="mailto:privacy@nourishai.com" className="btn btn-primary btn-sm">📧 privacy@nourishai.com</a>
        <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 16 }}>
          NourishAI · Bengaluru, Karnataka, India
        </p>
      </div>
    </div>
  );
}
