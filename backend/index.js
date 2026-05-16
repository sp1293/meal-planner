require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const fetch      = require("node-fetch");
const crypto     = require("crypto");
const bcrypt     = require("bcrypt");
const jwt        = require("jsonwebtoken");
const { Resend } = require("resend");
const admin      = require("firebase-admin");
const Razorpay   = require("razorpay");

const app       = express();
const resend    = new Resend(process.env.RESEND_API_KEY);
const FROM      = "Mitabhukta <noreply@mitabhukta.com>";
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error("❌ FATAL: JWT_SECRET env var is missing or too short (<32 chars). Refusing to start.");
  process.exit(1);
}

// ── Firebase Admin SDK ─────────────────────────────────────────────────────
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log("✅ Firebase Admin SDK initialized");
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

// ⚠️ Webhook route MUST be registered BEFORE express.json() because it needs raw body for signature verification.
// We attach raw body parser only for the webhook route.
app.post(
  "/api/razorpay-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"];
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error("❌ RAZORPAY_WEBHOOK_SECRET not configured");
        return res.status(500).send("Webhook not configured");
      }
      if (!signature) return res.status(400).send("Missing signature");

      // Verify signature using raw body
      const expected = crypto
        .createHmac("sha256", webhookSecret)
        .update(req.body)
        .digest("hex");

      if (expected !== signature) {
        console.warn("⚠️ Webhook signature mismatch");
        return res.status(400).send("Invalid signature");
      }

      const event = JSON.parse(req.body.toString());
      const eventId = event.id || `${event.event}_${Date.now()}`;
      console.log(`✅ Webhook received: ${event.event} (${eventId})`);

      // Idempotency: skip if already processed
      const eventDoc = admin.firestore().collection("webhookEvents").doc(eventId);
      const existing = await eventDoc.get();
      if (existing.exists) {
        console.log(`⏭️  Event ${eventId} already processed, skipping`);
        return res.status(200).send("OK (duplicate)");
      }
      await eventDoc.set({
        eventType: event.event,
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        payload: event,
      });

      // Handle the events we care about
      switch (event.event) {
        case "payment.captured": {
          const payment = event.payload?.payment?.entity;
          if (!payment) break;
          const notes = payment.notes || {};
          console.log(`💰 Payment captured: ${payment.id} for ${notes.userId || "unknown"} (${notes.tierKey || notes.type || "unknown"})`);

          // Safety net: if this was a tier subscription and verify-payment never ran, upgrade the user
          if (notes.tierKey && notes.userId) {
            const userRef = admin.firestore().doc(`users/${notes.userId}`);
            const userSnap = await userRef.get();
            if (userSnap.exists && userSnap.data().paymentId !== payment.id) {
              await userRef.update({
                tier: notes.tierKey,
                plansUsed: 0,
                subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
                paymentId: payment.id,
                orderId: payment.order_id,
                subscribedVia: "webhook_fallback",
              });
              console.log(`🛡️  Webhook safety-net upgraded user ${notes.userId} to ${notes.tierKey}`);
            }
          }
          break;
        }
        case "payment.failed": {
          const payment = event.payload?.payment?.entity;
          console.warn(`❌ Payment failed: ${payment?.id} - ${payment?.error_description || "unknown reason"}`);
          break;
        }
        case "refund.created":
        case "refund.processed": {
          const refund = event.payload?.refund?.entity;
          console.log(`💸 Refund: ${refund?.id} for payment ${refund?.payment_id}`);
          // TODO: downgrade user tier or mark booking refunded
          break;
        }
        default:
          console.log(`ℹ️  Unhandled event: ${event.event}`);
      }

      return res.status(200).send("OK");
    } catch (err) {
      console.error("Webhook error:", err.message);
      // Return 200 anyway so Razorpay doesn't retry for code errors
      return res.status(200).send("Error logged");
    }
  }
);

// Everything below uses normal JSON parsing
app.use(express.json({ limit: "10kb" }));

// ── Rate limiter ───────────────────────────────────────────────────────────
const rateLimitMap = new Map();
function rateLimit(maxRequests, windowMs) {
  return (req, res, next) => {
    const ip  = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "unknown";
    const key = `${ip}_${req.path}`;
    const now = Date.now();
    if (!rateLimitMap.has(key)) { rateLimitMap.set(key,{count:1,resetAt:now+windowMs}); return next(); }
    const limit = rateLimitMap.get(key);
    if (now > limit.resetAt) { rateLimitMap.set(key,{count:1,resetAt:now+windowMs}); return next(); }
    if (limit.count >= maxRequests) return res.status(429).json({ error:"Too many requests. Please wait." });
    limit.count++; next();
  };
}
setInterval(() => {
  const now = Date.now();
  for (const [k,v] of rateLimitMap.entries()) if (now > v.resetAt) rateLimitMap.delete(k);
}, 10*60*1000);

// ── Firebase auth token verifier ───────────────────────────────────────────
async function verifyAuthToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error:"Unauthorized — missing auth token" });
  }
  try {
    const token        = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.uid   = decodedToken.uid;
    req.email = decodedToken.email;
    next();
  } catch {
    return res.status(401).json({ error:"Unauthorized — invalid auth token" });
  }
}

// ── Admin role verifier (must come AFTER verifyAuthToken) ──────────────────
async function verifyAdmin(req, res, next) {
  try {
    const doc = await admin.firestore().doc(`users/${req.uid}`).get();
    if (!doc.exists || doc.data().role !== "admin") {
      return res.status(403).json({ error: "Unauthorized — admin only" });
    }
    next();
  } catch {
    return res.status(500).json({ error: "Authorization check failed" });
  }
}

// ── Input sanitizer ────────────────────────────────────────────────────────
function sanitizeString(str, maxLen = 500) {
  if (typeof str !== "string") return "";
  return str.replace(/[<>"'`]/g, "").trim().slice(0, maxLen);
}

// ── Tier prices ────────────────────────────────────────────────────────────
const TIER_PRICES = { starter:29900, pro:59900, family:99900 };

// ── Keep Render awake ──────────────────────────────────────────────────────
setInterval(async () => {
  try { await fetch("https://meal-planner-backend-0ul2.onrender.com/"); console.log("Keep-alive ping"); }
  catch (e) { console.warn("Keep-alive failed:", e.message); }
}, 14*60*1000);

// ── Email templates ────────────────────────────────────────────────────────
function verificationEmailHtml(name, link) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;"><tr><td align="center"><table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%);padding:40px;text-align:center;"><div style="font-size:36px;margin-bottom:8px;">🥗</div><div style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#fff;">Mitabhukta</div><div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px;">Your Wellness, Reimagined.</div></td></tr><tr><td style="padding:40px;"><h1 style="font-family:Georgia,serif;font-size:22px;color:#052e16;margin:0 0 12px;">Hey ${name}, verify your email 👋</h1><p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 28px;">Thanks for signing up! Click below to activate your account.</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 0 32px;"><a href="${link}" style="display:inline-block;background:#166534;color:#fff;font-size:16px;font-weight:700;padding:16px 40px;border-radius:8px;text-decoration:none;">✅ Verify My Email</a></td></tr></table><div style="background:#f9fafb;border-radius:8px;padding:14px;margin-bottom:20px;"><p style="font-size:12px;color:#6b7280;margin:0 0 6px;">Button not working? Copy this link:</p><a href="${link}" style="font-size:11px;color:#166534;word-break:break-all;">${link}</a></div><p style="font-size:12px;color:#9ca3af;margin:0;">If you didn't create this account, ignore this email.</p></td></tr><tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;"><p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} Mitabhukta · Bengaluru, India · <a href="https://mitabhukta.com" style="color:#6b7280;">mitabhukta.com</a></p></td></tr></table></td></tr></table></body></html>`;
}

function bookingConfirmationStudentHtml({ studentName, trainerName, speciality, dateLabel, time, sessionType, price, bookingId }) {
  const rows = [["Trainer",trainerName],["Speciality",speciality],["Date",dateLabel],["Time",time],["Session Type",sessionType],["Amount Paid",`₹${price}`],["Booking ID",bookingId]];
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;"><tr><td align="center"><table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%);padding:36px;text-align:center;"><div style="font-size:40px;margin-bottom:8px;">✅</div><div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#fff;">Booking Confirmed!</div></td></tr><tr><td style="padding:36px;"><p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 24px;">Hi <strong>${studentName}</strong>, your session is confirmed!</p><div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:20px;">${rows.map(([k,v])=>`<div style="display:flex;justify-content:space-between;font-size:14px;padding:8px 0;border-bottom:1px solid #dcfce7;"><span style="color:#4b5563;">${k}</span><strong style="color:#052e16;">${v}</strong></div>`).join("")}</div><div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;margin-bottom:24px;font-size:13px;color:#991b1b;">🔒 Never pay your trainer directly. All communication must go through Mitabhukta.</div><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="https://mitabhukta.com" style="display:inline-block;background:#166534;color:#fff;font-size:15px;font-weight:700;padding:14px 40px;border-radius:8px;text-decoration:none;">View My Bookings →</a></td></tr></table></td></tr><tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;"><p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} Mitabhukta · Bengaluru, India</p></td></tr></table></td></tr></table></body></html>`;
}

function bookingNotificationTrainerHtml({ trainerName, studentName, speciality, dateLabel, time, sessionType, price, notes, bookingId }) {
  const rows = [["Student",studentName],["Speciality",speciality],["Date",dateLabel],["Time",time],["Session Type",sessionType],["Your Earning",`₹${Math.round(price*0.8)} (after platform fee)`],["Booking ID",bookingId]];
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;"><tr><td align="center"><table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%);padding:36px;text-align:center;"><div style="font-size:40px;margin-bottom:8px;">📅</div><div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#fff;">New Session Booked!</div></td></tr><tr><td style="padding:36px;"><p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 24px;">Hi <strong>${trainerName}</strong>, you have a new booking!</p><div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:20px;">${rows.map(([k,v])=>`<div style="display:flex;justify-content:space-between;font-size:14px;padding:8px 0;border-bottom:1px solid #dcfce7;"><span style="color:#4b5563;">${k}</span><strong style="color:#052e16;">${v}</strong></div>`).join("")}</div>${notes?`<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;margin-bottom:20px;font-size:13px;color:#1e40af;">📝 <strong>Student Notes:</strong> ${notes}</div>`:""}<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;margin-bottom:24px;font-size:13px;color:#991b1b;">⚠️ All communication must happen through Mitabhukta only.</div><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="https://mitabhukta.com" style="display:inline-block;background:#166534;color:#fff;font-size:15px;font-weight:700;padding:14px 40px;border-radius:8px;text-decoration:none;">View in Trainer Portal →</a></td></tr></table></td></tr><tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;"><p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} Mitabhukta · Bengaluru, India</p></td></tr></table></td></tr></table></body></html>`;
}

function trainerInviteHtml({ name, email, password, type, speciality, location, experience, pricePerHour }) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;"><tr><td align="center"><table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%);padding:40px;text-align:center;"><div style="font-size:48px;margin-bottom:12px;">🏋️</div><div style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#fff;">Welcome to Mitabhukta!</div><div style="font-size:14px;color:rgba(255,255,255,0.7);margin-top:8px;">Trainer Portal Access</div></td></tr><tr><td style="padding:40px;"><h2 style="font-family:Georgia,serif;font-size:22px;color:#052e16;margin:0 0 16px;">Hi ${name}! 👋</h2><p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 24px;">You've been added as a certified trainer on <strong>Mitabhukta</strong>.</p><div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:20px;"><div style="font-size:13px;font-weight:700;color:#052e16;margin-bottom:14px;">🔑 Your Login Credentials</div><div style="font-size:14px;padding:8px 0;border-bottom:1px solid #dcfce7;display:flex;justify-content:space-between;"><span style="color:#6b7280;">Email:</span><strong style="color:#052e16;">${email}</strong></div><div style="font-size:14px;padding:8px 0;display:flex;justify-content:space-between;"><span style="color:#6b7280;">Password:</span><strong style="color:#052e16;font-family:monospace;">${password}</strong></div></div><div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px;margin-bottom:20px;font-size:13px;color:#92400e;">🔒 Please change your password after first login.</div><div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;"><div style="font-size:13px;font-weight:700;color:#052e16;margin-bottom:12px;">📋 Your Profile</div><div style="font-size:13px;color:#374151;line-height:2;"><strong>Type:</strong> ${type} · ${speciality}<br/><strong>Location:</strong> ${location}<br/><strong>Rate:</strong> ₹${pricePerHour}/hour<br/><strong>Experience:</strong> ${experience} years</div></div><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="https://mitabhukta.com" style="display:inline-block;background:#166534;color:#fff;font-size:16px;font-weight:700;padding:16px 48px;border-radius:8px;text-decoration:none;">Login to Trainer Portal →</a></td></tr></table></td></tr><tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;"><p style="font-size:12px;color:#9ca3af;margin:0 0 4px;">Questions? <a href="mailto:support@mitabhukta.com" style="color:#166534;">support@mitabhukta.com</a></p><p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} Mitabhukta · Bengaluru, India</p></td></tr></table></td></tr></table></body></html>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.get("/", (req, res) => res.json({ status:"Mitabhukta backend running", version:"3.1" }));

// ── AI Meal Plan (protected) ───────────────────────────────────────────────
app.post("/api/meal-plan", rateLimit(10,60000), verifyAuthToken, async (req,res) => {
  try {
    const { model, max_tokens, messages } = req.body;
    if (!model||!messages||!Array.isArray(messages)) return res.status(400).json({ error:"Invalid request body" });
    if (messages.length > 10) return res.status(400).json({ error:"Too many messages" });
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{ "Content-Type":"application/json", "x-api-key":process.env.ANTHROPIC_API_KEY, "anthropic-version":"2023-06-01" },
      body: JSON.stringify({ model, max_tokens, messages }),
    });
    res.json(await response.json());
  } catch(err) {
    console.error("AI error:", err.message);
    res.status(500).json({ error:"AI request failed." });
  }
});

// ── Google Places ──────────────────────────────────────────────────────────
app.get("/api/places", rateLimit(30,60000), async (req,res) => {
  const lat = parseFloat(req.query.lat), lng = parseFloat(req.query.lng);
  const keyword = sanitizeString(req.query.keyword||"restaurant", 50);
  if (isNaN(lat)||isNaN(lng)) return res.status(400).json({ error:"Invalid coordinates" });
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return res.status(500).json({ error:"Places API not configured" });
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3000&type=restaurant&keyword=${encodeURIComponent(keyword)}&key=${key}`;
    const data = await (await fetch(url)).json();
    if (data.status!=="OK"&&data.status!=="ZERO_RESULTS") return res.status(500).json({ error:"Failed to fetch restaurants" });
    res.json({ restaurants:(data.results||[]).slice(0,5).map(r=>({ name:r.name, rating:r.rating, address:r.vicinity, openNow:r.opening_hours?.open_now, priceLevel:r.price_level, placeId:r.place_id })) });
  } catch { res.status(500).json({ error:"Failed to fetch restaurants" }); }
});

// ── Trainer login — bcrypt verify + JWT token ──────────────────────────────
app.post("/api/trainer-login", rateLimit(10,60000), async (req,res) => {
  try {
    const { email, password } = req.body;
    if (!email||!password) return res.status(400).json({ error:"Email and password required" });

    const snap = await admin.firestore().collection("trainers")
      .where("email","==",email.toLowerCase()).limit(1).get();
    if (snap.empty) return res.status(401).json({ error:"No trainer found with this email." });

    const trainerDoc  = snap.docs[0];
    const trainerData = trainerDoc.data();

    if (trainerData.status==="suspended")
      return res.status(403).json({ error:"Account suspended. Contact support@mitabhukta.com." });

    let match = false;
    if (trainerData.passwordHash) {
      match = await bcrypt.compare(password, trainerData.passwordHash);
    } else if (trainerData.password) {
      match = trainerData.password === password;
      if (match) {
        const hash = await bcrypt.hash(password, 12);
        await trainerDoc.ref.update({ passwordHash:hash, password:admin.firestore.FieldValue.delete() });
        console.log(`✅ Migrated trainer ${email} to bcrypt`);
      }
    }
    if (!match) return res.status(401).json({ error:"Incorrect password." });

    const token = jwt.sign(
      { trainerId:trainerDoc.id, email:trainerData.email, role:"trainer" },
      JWT_SECRET,
      { expiresIn:"7d" }
    );

    const { password:_p, passwordHash:_ph, ...safeData } = trainerData;
    console.log(`✅ Trainer login: ${email}`);
    res.json({ success:true, trainer:safeData, token });

  } catch(err) {
    console.error("Trainer login error:", err.message);
    res.status(500).json({ error:"Login failed. Please try again." });
  }
});

// ── Create trainer (admin only) — now uses verifyAuthToken + verifyAdmin ──
app.post("/api/create-trainer", rateLimit(5,60000), verifyAuthToken, verifyAdmin, async (req,res) => {
  try {
    const { trainerData } = req.body;
    if (!trainerData) return res.status(400).json({ error:"Missing required fields" });

    const { name, email, password, type, typeIcon, speciality, location, experience, pricePerHour, gender, bio, languages, availableDays } = trainerData;
    if (!name||!email||!password) return res.status(400).json({ error:"Name, email and password required" });
    if (password.length < 6) return res.status(400).json({ error:"Password must be at least 6 characters" });

    const existing = await admin.firestore().collection("trainers")
      .where("email","==",email.toLowerCase()).limit(1).get();
    if (!existing.empty) return res.status(400).json({ error:"A trainer with this email already exists" });

    const passwordHash = await bcrypt.hash(password, 12);
    const trainerId    = `trainer_${Date.now()}`;
    const savedData    = {
      id:trainerId, name:sanitizeString(name), email:sanitizeString(email).toLowerCase(),
      passwordHash, type:sanitizeString(type), typeIcon:sanitizeString(typeIcon||"💪"),
      speciality:sanitizeString(speciality), location:sanitizeString(location),
      experience:parseInt(experience)||0, pricePerHour:parseInt(pricePerHour)||0,
      gender:sanitizeString(gender), bio:sanitizeString(bio||""),
      languages:(languages||[]).map(l=>sanitizeString(l)), availableDays:availableDays||[],
      sessionTypes:["Video call","In-person"], rating:0, totalSessions:0, totalEarnings:0,
      highlights:[], role:"trainer", status:"active",
      createdAt:admin.firestore.FieldValue.serverTimestamp(), createdBy:req.uid,
    };

    await admin.firestore().collection("trainers").doc(trainerId).set(savedData);

    await resend.emails.send({
      from:FROM, to:email,
      subject:"Welcome to Mitabhukta Trainer Portal! 🎉",
      html: trainerInviteHtml({ name:sanitizeString(name), email:sanitizeString(email), password, type:sanitizeString(type), speciality:sanitizeString(speciality), location:sanitizeString(location), experience, pricePerHour }),
    });

    const { passwordHash:_ph, ...returnData } = savedData;
    console.log(`✅ Trainer created & invite sent: ${email}`);
    res.json({ success:true, trainer:returnData });
  } catch(err) {
    console.error("Create trainer error:", err.message);
    res.status(500).json({ error:"Failed to create trainer: "+err.message });
  }
});

// ── Subscription: Create order — NOW PROTECTED ─────────────────────────────
app.post("/api/create-order", rateLimit(10,60000), verifyAuthToken, async (req,res) => {
  try {
    const { tierKey } = req.body;
    const userId = req.uid;       // from token, not body
    const email  = req.email;     // from token, not body
    if (!tierKey) return res.status(400).json({ error:"tierKey required" });
    const amount = TIER_PRICES[tierKey];
    if (!amount) return res.status(400).json({ error:"Invalid tier" });
    const order = await razorpay.orders.create({
      amount,
      currency:"INR",
      receipt:`rcpt_${userId.slice(0,10)}_${Date.now()}`,
      notes:{ tierKey, userId, email: email || "" }
    });
    res.json({ orderId:order.id, amount:order.amount });
  } catch(err) {
    console.error("Create order error:", err.message);
    res.status(500).json({ error:"Failed to create order" });
  }
});

// ── Subscription: Verify payment — NOW PROTECTED ───────────────────────────
app.post("/api/verify-payment", rateLimit(10,60000), verifyAuthToken, async (req,res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tierKey } = req.body;
    const userId = req.uid;       // from token, never trust body
    if (!razorpay_order_id||!razorpay_payment_id||!razorpay_signature||!tierKey) {
      return res.status(400).json({ error:"Missing payment details" });
    }

    // Verify signature
    const expected = crypto.createHmac("sha256",process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id+"|"+razorpay_payment_id).digest("hex");
    if (expected!==razorpay_signature) {
      console.warn(`⚠️ Invalid signature for user ${userId}, order ${razorpay_order_id}`);
      return res.status(400).json({ success:false, error:"Invalid signature" });
    }

    // Additional safety: confirm the order's notes match this user
    try {
      const order = await razorpay.orders.fetch(razorpay_order_id);
      if (order?.notes?.userId && order.notes.userId !== userId) {
        console.warn(`⚠️ Order ${razorpay_order_id} belongs to ${order.notes.userId} but ${userId} tried to claim it`);
        return res.status(403).json({ success:false, error:"Order does not belong to this user" });
      }
      if (order?.notes?.tierKey && order.notes.tierKey !== tierKey) {
        return res.status(400).json({ success:false, error:"Tier mismatch" });
      }
    } catch (fetchErr) {
      console.warn("Could not fetch order for cross-check:", fetchErr.message);
      // Continue anyway — signature is the primary security
    }

    await admin.firestore().doc(`users/${userId}`).update({
      tier:tierKey,
      plansUsed:0,
      subscribedAt:admin.firestore.FieldValue.serverTimestamp(),
      paymentId:razorpay_payment_id,
      orderId:razorpay_order_id,
    });
    console.log(`✅ Subscription activated: ${userId} → ${tierKey}`);
    res.json({ success:true });
  } catch(err) {
    console.error("Verify payment error:", err.message);
    res.status(500).json({ success:false, error:"Payment verification failed" });
  }
});

// ── Booking: Create Razorpay order — NOW PROTECTED ─────────────────────────
app.post("/api/create-booking-order", rateLimit(10,60000), verifyAuthToken, async (req,res) => {
  try {
    const { trainerId, price } = req.body;
    const studentId = req.uid;     // from token
    if (!trainerId||!price) return res.status(400).json({ error:"Missing required fields" });
    if (price < 1 || price > 100000) return res.status(400).json({ error:"Invalid price" });
    const order = await razorpay.orders.create({
      amount:Math.round(price*100),
      currency:"INR",
      receipt:`booking_${studentId.slice(0,8)}_${Date.now()}`,
      notes:{ type:"booking", studentId, trainerId }
    });
    res.json({ orderId:order.id, amount:order.amount });
  } catch(err) {
    console.error("Create booking order error:", err.message);
    res.status(500).json({ error:"Failed to create booking order" });
  }
});

// ── Booking: Verify payment — NOW PROTECTED ────────────────────────────────
app.post("/api/verify-booking-payment", rateLimit(10,60000), verifyAuthToken, async (req,res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking } = req.body;
    if (!razorpay_order_id||!razorpay_payment_id||!razorpay_signature||!booking) {
      return res.status(400).json({ error:"Missing required fields" });
    }

    // Force studentId to be the authenticated user, not whatever the frontend sent
    if (booking.studentId && booking.studentId !== req.uid) {
      return res.status(403).json({ error:"Student ID mismatch" });
    }
    const studentId = req.uid;

    // Verify signature
    const expected = crypto.createHmac("sha256",process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id+"|"+razorpay_payment_id).digest("hex");
    if (expected!==razorpay_signature) {
      return res.status(400).json({ success:false, error:"Invalid signature" });
    }

    const bookingId   = `booking_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const bookingData = {
      id:bookingId,
      studentId,
      studentName:sanitizeString(booking.studentName),
      studentEmail:sanitizeString(booking.studentEmail || req.email || ""),
      trainerId:sanitizeString(booking.trainerId),
      trainerName:sanitizeString(booking.trainerName),
      trainerEmail:sanitizeString(booking.trainerEmail||""),
      trainerIcon:sanitizeString(booking.trainerIcon),
      trainerGender:sanitizeString(booking.trainerGender),
      speciality:sanitizeString(booking.speciality),
      type:sanitizeString(booking.type),
      price:Number(booking.price),
      dateLabel:sanitizeString(booking.dateLabel),
      dateIso:sanitizeString(booking.dateIso),
      time:sanitizeString(booking.time),
      sessionType:sanitizeString(booking.sessionType),
      notes:sanitizeString(booking.notes||""),
      status:"Confirmed",
      paymentId:razorpay_payment_id,
      orderId:razorpay_order_id,
      review:null,
      createdAt:admin.firestore.FieldValue.serverTimestamp(),
    };
    await admin.firestore().collection("bookings").doc(bookingId).set(bookingData);

    if (bookingData.studentEmail) {
      resend.emails.send({ from:FROM, to:bookingData.studentEmail, subject:`✅ Session Confirmed — ${bookingData.trainerName} on ${bookingData.dateLabel}`, html:bookingConfirmationStudentHtml({ studentName:bookingData.studentName, trainerName:bookingData.trainerName, speciality:bookingData.speciality, dateLabel:bookingData.dateLabel, time:bookingData.time, sessionType:bookingData.sessionType, price:bookingData.price, bookingId }) })
        .catch(e => console.warn("Student email failed:", e.message));
    }
    if (bookingData.trainerEmail) {
      resend.emails.send({ from:FROM, to:bookingData.trainerEmail, subject:`📅 New Booking — ${bookingData.studentName} on ${bookingData.dateLabel}`, html:bookingNotificationTrainerHtml({ trainerName:bookingData.trainerName, studentName:bookingData.studentName, speciality:bookingData.speciality, dateLabel:bookingData.dateLabel, time:bookingData.time, sessionType:bookingData.sessionType, price:bookingData.price, notes:bookingData.notes, bookingId }) })
        .catch(e => console.warn("Trainer email failed:", e.message));
    }

    console.log(`✅ Booking saved: ${bookingId}`);
    res.json({ success:true, bookingId, booking:bookingData });
  } catch(err) {
    console.error("Verify booking payment error:", err.message);
    res.status(500).json({ success:false, error:"Booking payment verification failed" });
  }
});

// ── Booking: Update — NOW PROTECTED, uses req.uid not body ─────────────────
app.post("/api/update-booking", rateLimit(20,60000), verifyAuthToken, async (req,res) => {
  try {
    const { bookingId, updates } = req.body;
    if (!bookingId||!updates) return res.status(400).json({ error:"Missing required fields" });
    const allowed  = ["status","dateLabel","dateIso","time","review"];
    const filtered = {};
    for (const key of allowed) if (updates[key]!==undefined) filtered[key]=updates[key];
    filtered.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    const ref  = admin.firestore().collection("bookings").doc(bookingId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error:"Booking not found" });
    if (snap.data().studentId !== req.uid) {
      return res.status(403).json({ error:"Unauthorized — not your booking" });
    }
    await ref.update(filtered);
    res.json({ success:true });
  } catch(err) {
    console.error("Update booking error:", err.message);
    res.status(500).json({ error:"Failed to update booking" });
  }
});

// ── Trainer: Change password ───────────────────────────────────────────────
app.post("/api/trainer-change-password", rateLimit(5,60000), async (req,res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    if (!email||!currentPassword||!newPassword) return res.status(400).json({ error:"All fields are required" });
    if (newPassword.length < 6) return res.status(400).json({ error:"New password must be at least 6 characters" });

    const snap = await admin.firestore().collection("trainers")
      .where("email","==",email.toLowerCase()).limit(1).get();
    if (snap.empty) return res.status(404).json({ error:"Trainer not found" });

    const trainerDoc  = snap.docs[0];
    const trainerData = trainerDoc.data();

    let match = false;
    if (trainerData.passwordHash) {
      match = await bcrypt.compare(currentPassword, trainerData.passwordHash);
    } else if (trainerData.password) {
      match = trainerData.password === currentPassword;
    }
    if (!match) return res.status(401).json({ error:"Current password is incorrect" });

    const newHash = await bcrypt.hash(newPassword, 12);
    await trainerDoc.ref.update({ passwordHash:newHash, password:admin.firestore.FieldValue.delete() });
    console.log(`✅ Trainer password changed: ${email}`);
    res.json({ success:true });
  } catch(err) {
    console.error("Trainer change password error:", err.message);
    res.status(500).json({ error:"Failed to change password" });
  }
});

// ── Referral: Auto-credit — NOW PROTECTED, uses req.uid ────────────────────
app.post("/api/apply-referral", rateLimit(5,60000), verifyAuthToken, async (req,res) => {
  try {
    const { referralCode } = req.body;
    const newUserId = req.uid;     // from token, not body
    if (!referralCode) return res.status(400).json({ error:"Missing referral code" });

    // Check if this user already has a referredBy — referrals are one-time only
    const newUserDoc = await admin.firestore().doc(`users/${newUserId}`).get();
    if (newUserDoc.exists && newUserDoc.data().referredBy) {
      return res.json({ success:false, message:"Already used a referral" });
    }

    const snap = await admin.firestore().collection("users")
      .where("referralCode","==",referralCode.toUpperCase()).limit(1).get();
    if (snap.empty) return res.json({ success:false, message:"Code not found" });
    const referrerDoc = snap.docs[0];
    if (referrerDoc.id===newUserId) return res.json({ success:false, message:"Cannot refer yourself" });
    if ((referrerDoc.data().referrals||[]).includes(newUserId)) return res.json({ success:false, message:"Already credited" });
    await referrerDoc.ref.update({ referrals:admin.firestore.FieldValue.arrayUnion(newUserId) });
    await admin.firestore().doc(`users/${newUserId}`).update({ referredBy:referrerDoc.id });
    console.log(`✅ Referral: ${referrerDoc.id} → ${newUserId}`);
    res.json({ success:true });
  } catch(err) {
    console.error("Apply referral error:", err.message);
    res.status(500).json({ error:"Failed to apply referral" });
  }
});

// ── Send verification email ────────────────────────────────────────────────
app.post("/api/send-verification-email", rateLimit(5,60000), async (req,res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error:"email required" });
    const link = await admin.auth().generateEmailVerificationLink(email,{ url:"https://mitabhukta.com" });
    await resend.emails.send({ from:FROM, to:email, subject:"Verify your Mitabhukta account ✅", html:verificationEmailHtml(sanitizeString(name)||"there", link) });
    res.json({ success:true });
  } catch(err) { res.status(500).json({ error:"Failed to send verification email" }); }
});

// ── Send password reset email ──────────────────────────────────────────────
app.post("/api/send-password-reset", rateLimit(5,60000), async (req,res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error:"email required" });
    const link = await admin.auth().generatePasswordResetLink(email,{ url:"https://mitabhukta.com" });
    await resend.emails.send({ from:FROM, to:email, subject:"Reset your Mitabhukta password 🔑", html:`<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;"><tr><td align="center"><table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%);padding:40px;text-align:center;"><div style="font-size:36px;">🔑</div><div style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#fff;margin-top:8px;">Reset Password</div></td></tr><tr><td style="padding:40px;"><p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 28px;">Click below to reset your Mitabhukta password. This link expires in 1 hour.</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 0 28px;"><a href="${link}" style="display:inline-block;background:#166534;color:#fff;font-size:16px;font-weight:700;padding:16px 40px;border-radius:8px;text-decoration:none;">🔑 Reset My Password</a></td></tr></table><div style="background:#f9fafb;border-radius:8px;padding:14px;"><p style="font-size:12px;color:#6b7280;margin:0 0 6px;">Or copy this link:</p><a href="${link}" style="font-size:11px;color:#166534;word-break:break-all;">${link}</a></div></td></tr><tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;"><p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} Mitabhukta · Bengaluru, India</p></td></tr></table></td></tr></table></body></html>` });
    res.json({ success:true });
  } catch(err) { res.status(500).json({ error:"Failed to send reset email" }); }
});

// ── Send welcome email ─────────────────────────────────────────────────────
app.post("/api/send-welcome", rateLimit(5,60000), async (req,res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error:"email required" });
    await resend.emails.send({ from:FROM, to:email, subject:`Welcome to Mitabhukta, ${sanitizeString(name)||"there"}! 🎉`, html:`<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;"><tr><td align="center"><table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%);padding:40px;text-align:center;"><div style="font-size:48px;">🎉</div><div style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#fff;margin-top:12px;">Welcome to Mitabhukta!</div></td></tr><tr><td style="padding:40px;"><h2 style="font-family:Georgia,serif;font-size:20px;color:#052e16;margin:0 0 14px;">Hi ${sanitizeString(name)||"there"}, you're all set! 👋</h2><p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 28px;">Your email is verified and your account is active.</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="https://mitabhukta.com" style="display:inline-block;background:#166534;color:#fff;font-size:16px;font-weight:700;padding:16px 48px;border-radius:8px;text-decoration:none;">Go to Dashboard →</a></td></tr></table></td></tr><tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;"><p style="font-size:12px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} Mitabhukta · Bengaluru, India</p></td></tr></table></td></tr></table></body></html>` });
    res.json({ success:true });
  } catch(err) { res.status(500).json({ error:"Failed to send welcome email" }); }
});

// ── 404 + error handlers ───────────────────────────────────────────────────
app.use((req,res) => res.status(404).json({ error:"Route not found" }));
app.use((err,req,res,next) => { console.error("Server error:", err.message); res.status(500).json({ error:"Internal server error" }); });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Mitabhukta backend running on port ${PORT}`));