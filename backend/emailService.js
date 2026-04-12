// ── emailService.js ────────────────────────────────────────────────────────
// Add this file to your backend folder
// Install: npm install resend

const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Mitabhukta <noreply@mitabhukta.com>";
const APP_URL = "https://mitabhukta.com";

// ── Verification email ─────────────────────────────────────────────────────
async function sendVerificationEmail({ to, name, verificationLink }) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your Mitabhukta account",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%);padding:40px 40px 32px;text-align:center;">
              <div style="font-size:32px;margin-bottom:8px;">🥗</div>
              <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#fff;letter-spacing:-0.5px;">Mitabhukta</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px;">Your Wellness, Reimagined.</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="font-family:Georgia,serif;font-size:24px;color:#052e16;margin:0 0 12px;">
                Hey ${name || "there"}, verify your email 👋
              </h1>
              <p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 28px;">
                Thanks for signing up for Mitabhukta! Click the button below to verify your email address and activate your account.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 32px;">
                    <a href="${verificationLink}"
                      style="display:inline-block;background:#166534;color:#fff;font-size:16px;font-weight:700;padding:16px 40px;border-radius:8px;text-decoration:none;letter-spacing:0.2px;">
                      ✅ Verify My Email
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What's included -->
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin-bottom:28px;">
                <div style="font-size:13px;font-weight:700;color:#052e16;margin-bottom:14px;text-transform:uppercase;letter-spacing:0.5px;">
                  🎉 Your free account includes:
                </div>
                ${[
                  "2 AI-powered meal plans per month",
                  "Access to certified yoga & fitness trainers",
                  "Smart Indian grocery shopping lists",
                  "Calorie tracking with AI photo detection",
                  "Leftover Chef — recipes from what's in your kitchen",
                ].map(f => `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                  <span style="color:#16a34a;font-size:14px;font-weight:700;">✓</span>
                  <span style="font-size:14px;color:#374151;">${f}</span>
                </div>`).join("")}
              </div>

              <!-- Link fallback -->
              <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:28px;">
                <p style="font-size:12px;color:#6b7280;margin:0 0 8px;">If the button doesn't work, copy and paste this link:</p>
                <a href="${verificationLink}" style="font-size:12px;color:#166534;word-break:break-all;">${verificationLink}</a>
              </div>

              <p style="font-size:13px;color:#9ca3af;margin:0;">
                If you didn't create a Mitabhukta account, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <p style="font-size:12px;color:#9ca3af;margin:0 0 8px;">
                © ${new Date().getFullYear()} Mitabhukta · Bengaluru, India
              </p>
              <p style="font-size:12px;color:#9ca3af;margin:0;">
                <a href="${APP_URL}/privacy" style="color:#6b7280;text-decoration:none;">Privacy Policy</a>
                &nbsp;·&nbsp;
                <a href="${APP_URL}/terms" style="color:#6b7280;text-decoration:none;">Terms of Service</a>
                &nbsp;·&nbsp;
                <a href="${APP_URL}" style="color:#6b7280;text-decoration:none;">mitabhukta.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}

// ── Password reset email ───────────────────────────────────────────────────
async function sendPasswordResetEmail({ to, name, resetLink }) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your Mitabhukta password",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%);padding:40px 40px 32px;text-align:center;">
              <div style="font-size:32px;margin-bottom:8px;">🔑</div>
              <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#fff;">Mitabhukta</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px;">Your Wellness, Reimagined.</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="font-family:Georgia,serif;font-size:24px;color:#052e16;margin:0 0 12px;">
                Reset your password
              </h1>
              <p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 28px;">
                Hi ${name || "there"}, we received a request to reset your Mitabhukta password. Click the button below to set a new one.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 32px;">
                    <a href="${resetLink}"
                      style="display:inline-block;background:#166534;color:#fff;font-size:16px;font-weight:700;padding:16px 40px;border-radius:8px;text-decoration:none;">
                      🔑 Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:28px;">
                <p style="font-size:13px;color:#92400e;margin:0;">
                  ⚠️ This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
                </p>
              </div>

              <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:28px;">
                <p style="font-size:12px;color:#6b7280;margin:0 0 8px;">If the button doesn't work, copy this link:</p>
                <a href="${resetLink}" style="font-size:12px;color:#166534;word-break:break-all;">${resetLink}</a>
              </div>

              <p style="font-size:13px;color:#9ca3af;margin:0;">
                If you didn't request this, no action is needed. Your password won't change.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <p style="font-size:12px;color:#9ca3af;margin:0 0 8px;">
                © ${new Date().getFullYear()} Mitabhukta · Bengaluru, India
              </p>
              <p style="font-size:12px;color:#9ca3af;margin:0;">
                <a href="${APP_URL}" style="color:#6b7280;text-decoration:none;">mitabhukta.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}

// ── Welcome email (send after verification) ────────────────────────────────
async function sendWelcomeEmail({ to, name }) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Welcome to Mitabhukta, ${name}! 🎉`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%);padding:40px;text-align:center;">
              <div style="font-size:48px;margin-bottom:12px;">🎉</div>
              <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#fff;">Welcome to Mitabhukta!</div>
              <div style="font-size:14px;color:rgba(255,255,255,0.75);margin-top:8px;">Your wellness journey starts now.</div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="font-family:Georgia,serif;font-size:22px;color:#052e16;margin:0 0 16px;">
                Hi ${name}, you're all set! 👋
              </h2>
              <p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 28px;">
                Your Mitabhukta account is verified and ready. Here's how to get started:
              </p>
              ${[
                { step: "1", title: "Generate your first meal plan", desc: "Tell us your age group and dietary preferences — AI does the rest.", link: `${APP_URL}`, cta: "Try Meal Planner →" },
                { step: "2", title: "Track your calories", desc: "Snap a photo of your food and let AI count the calories instantly.", link: `${APP_URL}`, cta: "Open Calorie Tracker →" },
                { step: "3", title: "Book a trainer session", desc: "Browse certified yoga and fitness trainers and book a session.", link: `${APP_URL}`, cta: "View Trainers →" },
              ].map(s => `
              <div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:16px;">
                <div style="display:flex;gap:12px;align-items:flex-start;">
                  <div style="width:28px;height:28px;background:#166534;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;text-align:center;line-height:28px;">${s.step}</div>
                  <div>
                    <div style="font-weight:700;font-size:15px;color:#111827;margin-bottom:4px;">${s.title}</div>
                    <div style="font-size:13px;color:#6b7280;margin-bottom:10px;">${s.desc}</div>
                    <a href="${s.link}" style="font-size:13px;color:#166534;font-weight:600;text-decoration:none;">${s.cta}</a>
                  </div>
                </div>
              </div>`).join("")}

              <div style="text-align:center;margin-top:32px;">
                <a href="${APP_URL}"
                  style="display:inline-block;background:#166534;color:#fff;font-size:16px;font-weight:700;padding:16px 48px;border-radius:8px;text-decoration:none;">
                  Go to Dashboard →
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <p style="font-size:12px;color:#9ca3af;margin:0;">
                Questions? Reply to this email or contact <a href="mailto:support@mitabhukta.com" style="color:#166534;">support@mitabhukta.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail };
