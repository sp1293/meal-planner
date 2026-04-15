require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const fetch      = require("node-fetch");
const crypto     = require("crypto");
const { Resend } = require("resend");
const admin      = require("firebase-admin");
const Razorpay   = require("razorpay");

const app    = express();
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = "Mitabhukta <noreply@mitabhukta.com>";

// ── Firebase Admin SDK ─────────────────────────────────────────────────────
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log("Firebase Admin SDK initialized");
  } catch (err) {
    console.error("Firebase Admin SDK init failed:", err.message);
  }
}

// ── Razorpay ───────────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── CORS ───────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://mitabhukta.com",
  "https://www.mitabhukta.com",
  "http://localhost:3000",
  "https://meal-planner-ten-taupe.vercel.app",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET","POST","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

app.use(express.json({ limit: "10kb" }));

// ── Rate limiter ───────────────────────────────────────────────────────────
const rateLimitMap = new Map();

function rateLimit(maxRequests, windowMs) {
  return (req, res, next) => {
    const ip  = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "unknown";
    const key = `${ip}_${req.path}`;
    const now = Date.now();
    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    const limit = rateLimitMap.get(key);
    if (now > limit.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (limit.count >= maxRequests) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment and try again." });
    }
    limit.count++;
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 10 * 60 * 1000);

// ── Keep Render awake ──────────────────────────────────────────────────────
setInterval(async () => {
  try {
    await fetch("https://meal-planner-backend-0ul2.onrender.com/");
    console.log("Keep-alive ping sent");
  } catch (e) {
    console.warn("Keep-alive ping failed:", e.message);
  }
}, 14 * 60 * 1000);

// ── Input sanitizer ────────────────────────────────────────────────────────
function sanitizeString(str, maxLen = 500) {
  if (typeof str !== "string") return "";
  return str.replace(/[<>"'`]/g, "").trim().slice(0, maxLen);
}

// ── Tier prices ────────────────────────────────────────────────────────────
const TIER_PRICES = {
  starter: 29900,  // ₹299 in paise
  pro:     59900,  // ₹599 in paise
  family:  99900,  // ₹999 in paise
};

// ── Email HTML builder ─────────────────────────────────────────────────────
function verificationEmailHtml(name, verificationLink) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr>
    <td style="background:linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%);padding:40px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">🥗</div>
      <div style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#fff;">Mitabhukta</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px;">Your Wellness, Reimagined.</div>
    </td>
  </tr>
  <tr>
    <td style="padding:40px;">
      <h1 style="font-family:Georgia,serif;font-size:22px;color:#052e16;margin:0 0 12px;">Hey ${name}, verify your email 👋</h1>
      <p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 28px;">Thanks for signing up! Click the button below to verify your email and activate your account.</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:0 0 32px;">
          <a href="${verificationLink}" style="display:inline-block;background:#166534;color:#fff;font-size:16px;font-weight:700;padding:16px 40px;border-radius:8px;text-decoration:none;">✅ Verify My Email</a>
        </td></tr>
      </table>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="font-size:13px;font-weight:700;color:#052e16;margin-bottom:12px;">🎉 Your free account includes:</div>
        <div style="font-size:13px;color:#374151;line-height:1.8;">
          ✓ 2 AI meal plans per month<br/>✓ Certified trainer booking<br/>✓ Calorie tracker with photo AI<br/>✓ Leftover Chef recipes
        </div>
      </div>
      <div style="background:#f9fafb;border-radius:8px;padding:14px;margin-bottom:20px;">
        <p style="font-size:12px;color:#6b7280;margin:0 0 6px;">Button not working? Copy this link:</p>
        <a href="${verificationLink}" style="font-size:11px;color:#166534;word-break:break-all;">${verificationLink}</a>
      </div>
      <p style="font-size:12px;color:#9ca3af;margin:0;">If you didn't create this account, you can safely ignore this email.</p>
    </td>
  </tr>
  <tr>
    <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
      <p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} Mitabhukta · Bengaluru, India · <a href="https://mitabhukta.com" style="color:#6b7280;text-decoration:none;">mitabhukta.com</a></p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Health check ───────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "Mitabhukta backend running", version: "2.0" });
});

// ── AI Meal Plan ───────────────────────────────────────────────────────────
app.post("/api/meal-plan",
  rateLimit(10, 60 * 1000),
  async (req, res) => {
    try {
      const { model, max_tokens, messages } = req.body;
      if (!model || !messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid request body" });
      }
      if (messages.length > 10) {
        return res.status(400).json({ error: "Too many messages" });
      }
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method:  "POST",
        headers: {
          "Content-Type":      "application/json",
          "x-api-key":         process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({ model, max_tokens, messages }),
      });
      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error("AI error:", err.message);
      res.status(500).json({ error: "AI request failed. Please try again." });
    }
  }
);

// ── Google Places ──────────────────────────────────────────────────────────
app.get("/api/places",
  rateLimit(30, 60 * 1000),
  async (req, res) => {
    const lat     = parseFloat(req.query.lat);
    const lng     = parseFloat(req.query.lng);
    const keyword = sanitizeString(req.query.keyword || "restaurant", 50);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }
    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (!key) return res.status(500).json({ error: "Places API not configured" });
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3000&type=restaurant&keyword=${encodeURIComponent(keyword)}&key=${key}`;
      const response = await fetch(url);
      const data     = await response.json();
      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        return res.status(500).json({ error: "Failed to fetch restaurants" });
      }
      const restaurants = (data.results || []).slice(0, 5).map(r => ({
        name: r.name, rating: r.rating, address: r.vicinity,
        openNow: r.opening_hours?.open_now, priceLevel: r.price_level, placeId: r.place_id,
      }));
      res.json({ restaurants });
    } catch (err) {
      console.error("Places error:", err.message);
      res.status(500).json({ error: "Failed to fetch restaurants" });
    }
  }
);

// ── Razorpay: Create order ─────────────────────────────────────────────────
app.post("/api/create-order",
  rateLimit(10, 60 * 1000),
  async (req, res) => {
    try {
      const { tierKey, userId, email } = req.body;
      if (!tierKey || !userId) {
        return res.status(400).json({ error: "tierKey and userId are required" });
      }
      const amount = TIER_PRICES[tierKey];
      if (!amount) {
        return res.status(400).json({ error: "Invalid tier" });
      }

      const order = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt:  `rcpt_${userId.slice(0, 10)}_${Date.now()}`,
        notes:    { tierKey, userId, email: email || "" },
      });

      console.log(`✅ Order created: ${order.id} for ${tierKey} - ${email}`);
      res.json({ orderId: order.id, amount: order.amount });
    } catch (err) {
      console.error("Create order error:", err.message);
      res.status(500).json({ error: "Failed to create order" });
    }
  }
);

// ── Razorpay: Verify payment ───────────────────────────────────────────────
app.post("/api/verify-payment",
  rateLimit(10, 60 * 1000),
  async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        tierKey,
        userId,
      } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing payment details" });
      }

      // Verify signature
      const body      = razorpay_order_id + "|" + razorpay_payment_id;
      const expected  = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

      if (expected !== razorpay_signature) {
        console.error("Payment signature mismatch");
        return res.status(400).json({ success: false, error: "Invalid payment signature" });
      }

      // Update user tier in Firestore via Admin SDK
      await admin.firestore().doc(`users/${userId}`).update({
        tier:         tierKey,
        plansUsed:    0,
        subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentId:    razorpay_payment_id,
        orderId:      razorpay_order_id,
      });

      console.log(`✅ Payment verified: ${razorpay_payment_id} — user ${userId} upgraded to ${tierKey}`);
      res.json({ success: true });
    } catch (err) {
      console.error("Verify payment error:", err.message);
      res.status(500).json({ success: false, error: "Payment verification failed" });
    }
  }
);

// ── Send verification email via Resend ─────────────────────────────────────
app.post("/api/send-verification-email",
  rateLimit(5, 60 * 1000),
  async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email) return res.status(400).json({ error: "email is required" });
      const verificationLink = await admin.auth().generateEmailVerificationLink(
        email, { url: "https://mitabhukta.com" }
      );
      await resend.emails.send({
        from: FROM, to: email,
        subject: "Verify your Mitabhukta account ✅",
        html: verificationEmailHtml(sanitizeString(name) || "there", verificationLink),
      });
      console.log(`✅ Verification email sent to ${email}`);
      res.json({ success: true });
    } catch (err) {
      console.error("Send verification email error:", err.message);
      res.status(500).json({ error: "Failed to send verification email" });
    }
  }
);

// ── Send password reset email via Resend ───────────────────────────────────
app.post("/api/send-password-reset",
  rateLimit(5, 60 * 1000),
  async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email) return res.status(400).json({ error: "email is required" });
      const resetLink = await admin.auth().generatePasswordResetLink(
        email, { url: "https://mitabhukta.com" }
      );
      await resend.emails.send({
        from: FROM, to: email,
        subject: "Reset your Mitabhukta password 🔑",
        html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%);padding:40px;text-align:center;">
    <div style="font-size:36px;margin-bottom:8px;">🔑</div>
    <div style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#fff;">Mitabhukta</div>
  </td></tr>
  <tr><td style="padding:40px;">
    <h1 style="font-family:Georgia,serif;font-size:22px;color:#052e16;margin:0 0 12px;">Reset your password</h1>
    <p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 28px;">Hi ${sanitizeString(name) || "there"}, click below to reset your Mitabhukta password.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 0 28px;">
      <a href="${resetLink}" style="display:inline-block;background:#166534;color:#fff;font-size:16px;font-weight:700;padding:16px 40px;border-radius:8px;text-decoration:none;">🔑 Reset My Password</a>
    </td></tr></table>
    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:14px;margin-bottom:24px;">
      <p style="font-size:13px;color:#92400e;margin:0;">⚠️ This link expires in <strong>1 hour</strong>.</p>
    </div>
    <div style="background:#f9fafb;border-radius:8px;padding:14px;">
      <p style="font-size:12px;color:#6b7280;margin:0 0 6px;">Button not working?</p>
      <a href="${resetLink}" style="font-size:11px;color:#166534;word-break:break-all;">${resetLink}</a>
    </div>
  </td></tr>
  <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
    <p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} Mitabhukta · Bengaluru, India</p>
  </td></tr>
</table></td></tr></table></body></html>`,
      });
      console.log(`✅ Password reset email sent to ${email}`);
      res.json({ success: true });
    } catch (err) {
      console.error("Send password reset error:", err.message);
      res.status(500).json({ error: "Failed to send password reset email" });
    }
  }
);

// ── Send welcome email ─────────────────────────────────────────────────────
app.post("/api/send-welcome",
  rateLimit(5, 60 * 1000),
  async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email) return res.status(400).json({ error: "email is required" });
      await resend.emails.send({
        from: FROM, to: email,
        subject: `Welcome to Mitabhukta, ${sanitizeString(name) || "there"}! 🎉`,
        html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;">
  <tr><td style="background:linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%);padding:40px;text-align:center;">
    <div style="font-size:48px;margin-bottom:12px;">🎉</div>
    <div style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#fff;">Welcome to Mitabhukta!</div>
  </td></tr>
  <tr><td style="padding:40px;">
    <h2 style="font-family:Georgia,serif;font-size:20px;color:#052e16;margin:0 0 14px;">Hi ${sanitizeString(name) || "there"}, you're all set! 👋</h2>
    <p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 28px;">Your email is verified and your account is active.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="https://mitabhukta.com" style="display:inline-block;background:#166534;color:#fff;font-size:16px;font-weight:700;padding:16px 48px;border-radius:8px;text-decoration:none;">Go to Dashboard →</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
    <p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} Mitabhukta · Bengaluru, India</p>
  </td></tr>
</table></td></tr></table></body></html>`,
      });
      console.log(`✅ Welcome email sent to ${email}`);
      res.json({ success: true });
    } catch (err) {
      console.error("Send welcome error:", err.message);
      res.status(500).json({ error: "Failed to send welcome email" });
    }
  }
);

// ── 404 + error handlers ───────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Mitabhukta backend running on port ${PORT}`));