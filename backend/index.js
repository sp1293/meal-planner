require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const fetch      = require("node-fetch");
const crypto     = require("crypto");
const bcrypt     = require("bcrypt");
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
  starter: 29900,
  pro:     59900,
  family:  99900,
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
app.post("/api/meal-plan", rateLimit(10, 60 * 1000), async (req, res) => {
  try {
    const { model, max_tokens, messages } = req.body;
    if (!model || !messages || !Array.isArray(messages)) return res.status(400).json({ error: "Invalid request body" });
    if (messages.length > 10) return res.status(400).json({ error: "Too many messages" });
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens, messages }),
    });
    res.json(await response.json());
  } catch (err) {
    console.error("AI error:", err.message);
    res.status(500).json({ error: "AI request failed." });
  }
});

// ── Google Places ──────────────────────────────────────────────────────────
app.get("/api/places", rateLimit(30, 60 * 1000), async (req, res) => {
  const lat = parseFloat(req.query.lat), lng = parseFloat(req.query.lng);
  const keyword = sanitizeString(req.query.keyword || "restaurant", 50);
  if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: "Invalid coordinates" });
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return res.status(500).json({ error: "Places API not configured" });
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3000&type=restaurant&keyword=${encodeURIComponent(keyword)}&key=${key}`;
    const data = await (await fetch(url)).json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") return res.status(500).json({ error: "Failed to fetch restaurants" });
    res.json({ restaurants: (data.results || []).slice(0, 5).map(r => ({ name: r.name, rating: r.rating, address: r.vicinity, openNow: r.opening_hours?.open_now, priceLevel: r.price_level, placeId: r.place_id })) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

// ── TRAINER: Secure login via backend (bcrypt) ─────────────────────────────
// Called from AuthContext instead of checking plain text client-side
app.post("/api/trainer-login", rateLimit(10, 60 * 1000), async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    // Find trainer by email in Firestore
    const snapshot = await admin.firestore().collection("trainers")
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({ error: "No trainer found with this email." });
    }

    const trainerDoc  = snapshot.docs[0];
    const trainerData = trainerDoc.data();

    if (trainerData.status === "suspended") {
      return res.status(403).json({ error: "Your account has been suspended. Contact support@mitabhukta.com." });
    }

    // Compare password — supports both bcrypt hashes and legacy plain text
    // (plain text check allows migration without forcing all trainers to reset)
    let passwordMatch = false;
    if (trainerData.passwordHash) {
      // New secure path: bcrypt comparison
      passwordMatch = await bcrypt.compare(password, trainerData.passwordHash);
    } else if (trainerData.password) {
      // Legacy plain text — compare and migrate to bcrypt on success
      passwordMatch = trainerData.password === password;
      if (passwordMatch) {
        // Migrate to bcrypt silently
        const hash = await bcrypt.hash(password, 12);
        await trainerDoc.ref.update({ passwordHash: hash, password: admin.firestore.FieldValue.delete() });
        console.log(`✅ Migrated trainer ${email} password to bcrypt`);
      }
    }

    if (!passwordMatch) {
      return res.status(401).json({ error: "Incorrect password." });
    }

    // Return trainer data (without password fields)
    const { password: _p, passwordHash: _ph, ...safeTrainerData } = trainerData;
    console.log(`✅ Trainer login: ${email}`);
    res.json({ success: true, trainer: safeTrainerData });

  } catch (err) {
    console.error("Trainer login error:", err.message);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// ── TRAINER: Create trainer with hashed password + send invite email ────────
app.post("/api/create-trainer", rateLimit(5, 60 * 1000), async (req, res) => {
  try {
    const { trainerData, adminUid } = req.body;
    if (!trainerData || !adminUid) return res.status(400).json({ error: "Missing required fields" });

    // Verify caller is an admin
    const adminDoc = await admin.firestore().doc(`users/${adminUid}`).get();
    if (!adminDoc.exists || adminDoc.data().role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { name, email, password, type, typeIcon, speciality, location,
      experience, pricePerHour, gender, bio, languages, availableDays } = trainerData;

    if (!name || !email || !password) return res.status(400).json({ error: "Name, email and password are required" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    // Check if trainer with this email already exists
    const existing = await admin.firestore().collection("trainers")
      .where("email", "==", email.toLowerCase()).limit(1).get();
    if (!existing.empty) return res.status(400).json({ error: "A trainer with this email already exists" });

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 12);

    const trainerId   = `trainer_${Date.now()}`;
    const savedData   = {
      id:            trainerId,
      name:          sanitizeString(name),
      email:         sanitizeString(email).toLowerCase(),
      passwordHash,               // bcrypt hash — never plain text
      type:          sanitizeString(type),
      typeIcon:      sanitizeString(typeIcon || "💪"),
      speciality:    sanitizeString(speciality),
      location:      sanitizeString(location),
      experience:    parseInt(experience) || 0,
      pricePerHour:  parseInt(pricePerHour) || 0,
      gender:        sanitizeString(gender),
      bio:           sanitizeString(bio || ""),
      languages:     (languages || []).map(l => sanitizeString(l)),
      availableDays: availableDays || [],
      sessionTypes:  ["Video call", "In-person"],
      rating:        0,
      totalSessions: 0,
      totalEarnings: 0,
      highlights:    [],
      role:          "trainer",
      status:        "active",
      createdAt:     admin.firestore.FieldValue.serverTimestamp(),
      createdBy:     adminUid,
    };

    await admin.firestore().collection("trainers").doc(trainerId).set(savedData);

    // Send invite email to trainer with login credentials
    await resend.emails.send({
      from: FROM,
      to:   email,
      subject: `Welcome to Mitabhukta Trainer Portal! 🎉`,
      html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr>
    <td style="background:linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%);padding:40px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">🏋️</div>
      <div style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#fff;">Welcome to Mitabhukta!</div>
      <div style="font-size:14px;color:rgba(255,255,255,0.7);margin-top:8px;">Trainer Portal Access</div>
    </td>
  </tr>
  <tr>
    <td style="padding:40px;">
      <h2 style="font-family:Georgia,serif;font-size:22px;color:#052e16;margin:0 0 16px;">Hi ${sanitizeString(name)}! 👋</h2>
      <p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 24px;">
        You've been added as a certified trainer on <strong>Mitabhukta</strong>. You can now log in to manage your sessions and schedule.
      </p>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="font-size:13px;font-weight:700;color:#052e16;margin-bottom:14px;">🔑 Your Login Credentials</div>
        <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:10px;">
          <span style="color:#6b7280;">Email:</span>
          <strong style="color:#052e16;">${sanitizeString(email)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:14px;">
          <span style="color:#6b7280;">Password:</span>
          <strong style="color:#052e16;font-family:monospace;">${sanitizeString(password)}</strong>
        </div>
      </div>

      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px;margin-bottom:24px;font-size:13px;color:#92400e;">
        🔒 <strong>Important:</strong> Please change your password after first login from your Account Settings. Never share your credentials with anyone.
      </div>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:28px;">
        <div style="font-size:13px;font-weight:700;color:#052e16;margin-bottom:12px;">📋 Your Profile Details</div>
        <div style="font-size:13px;color:#374151;line-height:2;">
          <strong>Type:</strong> ${sanitizeString(type)} · ${sanitizeString(speciality)}<br/>
          <strong>Location:</strong> ${sanitizeString(location)}<br/>
          <strong>Rate:</strong> ₹${pricePerHour}/hour<br/>
          <strong>Experience:</strong> ${experience} years
        </div>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:0 0 20px;">
          <a href="https://mitabhukta.com" style="display:inline-block;background:#166534;color:#fff;font-size:16px;font-weight:700;padding:16px 48px;border-radius:8px;text-decoration:none;">Login to Trainer Portal →</a>
        </td></tr>
      </table>

      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;font-size:13px;color:#991b1b;">
        ⚠️ <strong>Platform Rules:</strong> Never request payment or personal contact outside Mitabhukta. All sessions must be conducted through our platform.
        <a href="https://mitabhukta.com" style="color:#991b1b;font-weight:700;"> Read guidelines →</a>
      </div>
    </td>
  </tr>
  <tr>
    <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
      <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;">Questions? <a href="mailto:support@mitabhukta.com" style="color:#166534;">support@mitabhukta.com</a></p>
      <p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} Mitabhukta · Bengaluru, India</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`,
    });

    const { passwordHash: _ph, ...returnData } = savedData;
    console.log(`✅ Trainer created & invite sent: ${email}`);
    res.json({ success: true, trainer: returnData });

  } catch (err) {
    console.error("Create trainer error:", err.message);
    res.status(500).json({ error: "Failed to create trainer: " + err.message });
  }
});

// ── Razorpay: Create subscription order ───────────────────────────────────
app.post("/api/create-order", rateLimit(10, 60 * 1000), async (req, res) => {
  try {
    const { tierKey, userId, email } = req.body;
    if (!tierKey || !userId) return res.status(400).json({ error: "tierKey and userId are required" });
    const amount = TIER_PRICES[tierKey];
    if (!amount) return res.status(400).json({ error: "Invalid tier" });
    const order = await razorpay.orders.create({ amount, currency: "INR", receipt: `rcpt_${userId.slice(0,10)}_${Date.now()}`, notes: { tierKey, userId, email: email || "" } });
    res.json({ orderId: order.id, amount: order.amount });
  } catch (err) {
    res.status(500).json({ error: "Failed to create order" });
  }
});

// ── Razorpay: Verify subscription payment ─────────────────────────────────
app.post("/api/verify-payment", rateLimit(10, 60 * 1000), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tierKey, userId } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ error: "Missing payment details" });
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");
    if (expected !== razorpay_signature) return res.status(400).json({ success: false, error: "Invalid payment signature" });
    await admin.firestore().doc(`users/${userId}`).update({ tier: tierKey, plansUsed: 0, subscribedAt: admin.firestore.FieldValue.serverTimestamp(), paymentId: razorpay_payment_id, orderId: razorpay_order_id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: "Payment verification failed" });
  }
});

// ── Razorpay: Create booking order ────────────────────────────────────────
app.post("/api/create-booking-order", rateLimit(10, 60 * 1000), async (req, res) => {
  try {
    const { studentId, trainerId, price } = req.body;
    if (!studentId || !trainerId || !price) return res.status(400).json({ error: "studentId, trainerId and price are required" });
    const order = await razorpay.orders.create({ amount: Math.round(price * 100), currency: "INR", receipt: `booking_${studentId.slice(0,8)}_${Date.now()}`, notes: { type: "booking", studentId, trainerId } });
    res.json({ orderId: order.id, amount: order.amount });
  } catch (err) {
    res.status(500).json({ error: "Failed to create booking order" });
  }
});

// ── Razorpay: Verify booking payment + save to Firestore ──────────────────
app.post("/api/verify-booking-payment", rateLimit(10, 60 * 1000), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking) return res.status(400).json({ error: "Missing required fields" });
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");
    if (expected !== razorpay_signature) return res.status(400).json({ success: false, error: "Invalid payment signature" });
    const bookingId   = `booking_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const bookingData = {
      id: bookingId, studentId: sanitizeString(booking.studentId), studentName: sanitizeString(booking.studentName),
      studentEmail: sanitizeString(booking.studentEmail), trainerId: sanitizeString(booking.trainerId),
      trainerName: sanitizeString(booking.trainerName), trainerIcon: sanitizeString(booking.trainerIcon),
      trainerGender: sanitizeString(booking.trainerGender), speciality: sanitizeString(booking.speciality),
      type: sanitizeString(booking.type), price: Number(booking.price), dateLabel: sanitizeString(booking.dateLabel),
      dateIso: sanitizeString(booking.dateIso), time: sanitizeString(booking.time),
      sessionType: sanitizeString(booking.sessionType), notes: sanitizeString(booking.notes || ""),
      status: "Confirmed", paymentId: razorpay_payment_id, orderId: razorpay_order_id,
      review: null, createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await admin.firestore().collection("bookings").doc(bookingId).set(bookingData);
    console.log(`✅ Booking saved: ${bookingId}`);
    res.json({ success: true, bookingId, booking: bookingData });
  } catch (err) {
    res.status(500).json({ success: false, error: "Booking payment verification failed" });
  }
});

// ── Update booking status ─────────────────────────────────────────────────
app.post("/api/update-booking", rateLimit(20, 60 * 1000), async (req, res) => {
  try {
    const { bookingId, updates, studentId } = req.body;
    if (!bookingId || !updates || !studentId) return res.status(400).json({ error: "Missing required fields" });
    const allowed  = ["status","dateLabel","dateIso","time","review"];
    const filtered = {};
    for (const key of allowed) { if (updates[key] !== undefined) filtered[key] = updates[key]; }
    filtered.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    const ref  = admin.firestore().collection("bookings").doc(bookingId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Booking not found" });
    if (snap.data().studentId !== studentId) return res.status(403).json({ error: "Unauthorized" });
    await ref.update(filtered);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update booking" });
  }
});

// ── Referral: Auto-credit referrer ────────────────────────────────────────
app.post("/api/apply-referral", rateLimit(5, 60 * 1000), async (req, res) => {
  try {
    const { referralCode, newUserId } = req.body;
    if (!referralCode || !newUserId) return res.status(400).json({ error: "Missing required fields" });
    const snap = await admin.firestore().collection("users").where("referralCode","==",referralCode.toUpperCase()).limit(1).get();
    if (snap.empty) return res.json({ success: false, message: "Referral code not found" });
    const referrerDoc = snap.docs[0];
    if (referrerDoc.id === newUserId) return res.json({ success: false, message: "Cannot refer yourself" });
    if ((referrerDoc.data().referrals || []).includes(newUserId)) return res.json({ success: false, message: "Already credited" });
    await referrerDoc.ref.update({ referrals: admin.firestore.FieldValue.arrayUnion(newUserId) });
    await admin.firestore().doc(`users/${newUserId}`).update({ referredBy: referrerDoc.id, referralCode: referralCode.toUpperCase() });
    console.log(`✅ Referral credited: ${referrerDoc.id} → ${newUserId}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to apply referral" });
  }
});

// ── Send verification email ────────────────────────────────────────────────
app.post("/api/send-verification-email", rateLimit(5, 60 * 1000), async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: "email is required" });
    const verificationLink = await admin.auth().generateEmailVerificationLink(email, { url: "https://mitabhukta.com" });
    await resend.emails.send({ from: FROM, to: email, subject: "Verify your Mitabhukta account ✅", html: verificationEmailHtml(sanitizeString(name) || "there", verificationLink) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send verification email" });
  }
});

// ── Send password reset email ──────────────────────────────────────────────
app.post("/api/send-password-reset", rateLimit(5, 60 * 1000), async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: "email is required" });
    const resetLink = await admin.auth().generatePasswordResetLink(email, { url: "https://mitabhukta.com" });
    await resend.emails.send({
      from: FROM, to: email, subject: "Reset your Mitabhukta password 🔑",
      html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;"><tr><td align="center"><table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%);padding:40px;text-align:center;"><div style="font-size:36px;margin-bottom:8px;">🔑</div><div style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#fff;">Mitabhukta</div></td></tr><tr><td style="padding:40px;"><h1 style="font-family:Georgia,serif;font-size:22px;color:#052e16;margin:0 0 12px;">Reset your password</h1><p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 28px;">Hi ${sanitizeString(name) || "there"}, click below to reset your password.</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 0 28px;"><a href="${resetLink}" style="display:inline-block;background:#166534;color:#fff;font-size:16px;font-weight:700;padding:16px 40px;border-radius:8px;text-decoration:none;">🔑 Reset My Password</a></td></tr></table><div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:14px;"><p style="font-size:13px;color:#92400e;margin:0;">⚠️ This link expires in <strong>1 hour</strong>.</p></div></td></tr><tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;"><p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} Mitabhukta · Bengaluru, India</p></td></tr></table></td></tr></table></body></html>`,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send password reset email" });
  }
});

// ── Send welcome email ─────────────────────────────────────────────────────
app.post("/api/send-welcome", rateLimit(5, 60 * 1000), async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: "email is required" });
    await resend.emails.send({
      from: FROM, to: email, subject: `Welcome to Mitabhukta, ${sanitizeString(name) || "there"}! 🎉`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;"><tr><td align="center"><table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%);padding:40px;text-align:center;"><div style="font-size:48px;margin-bottom:12px;">🎉</div><div style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#fff;">Welcome to Mitabhukta!</div></td></tr><tr><td style="padding:40px;"><h2 style="font-family:Georgia,serif;font-size:20px;color:#052e16;margin:0 0 14px;">Hi ${sanitizeString(name) || "there"}, you're all set! 👋</h2><p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 28px;">Your email is verified and your account is active.</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="https://mitabhukta.com" style="display:inline-block;background:#166534;color:#fff;font-size:16px;font-weight:700;padding:16px 48px;border-radius:8px;text-decoration:none;">Go to Dashboard →</a></td></tr></table></td></tr><tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;"><p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} Mitabhukta · Bengaluru, India</p></td></tr></table></td></tr></table></body></html>`,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send welcome email" });
  }
});

// ── 404 + error handlers ───────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, req, res, next) => { res.status(500).json({ error: "Internal server error" }); });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Mitabhukta backend running on port ${PORT}`));