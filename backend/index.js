require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const fetch     = require("node-fetch");

const app = express();

// ── CORS — only allow your actual domains ──────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://mitabhukta.com",
  "http://localhost:3000",
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl) only in dev
    if (!origin && process.env.NODE_ENV !== "production") return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET","POST","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

app.use(express.json({ limit: "10kb" })); // Prevent large payload attacks

// ── Simple in-memory rate limiter ─────────────────────────────────────────
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
      return res.status(429).json({
        error: "Too many requests. Please wait a moment and try again."
      });
    }

    limit.count++;
    next();
  };
}

// Clean up rate limit map every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 10 * 60 * 1000);

// ── Input sanitizer ────────────────────────────────────────────────────────
function sanitizeString(str, maxLen = 500) {
  if (typeof str !== "string") return "";
  return str.replace(/[<>"'`]/g, "").trim().slice(0, maxLen);
}

// ── Health check ───────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "Mitabhukta backend running", version: "2.0" });
});

// ── AI Meal Plan — 10 requests per minute per IP ──────────────────────────
app.post("/api/meal-plan",
  rateLimit(10, 60 * 1000),
  async (req, res) => {
    try {
      // Validate request body
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

// ── Google Places — 30 requests per minute per IP ─────────────────────────
app.get("/api/places",
  rateLimit(30, 60 * 1000),
  async (req, res) => {
    const lat     = parseFloat(req.query.lat);
    const lng     = parseFloat(req.query.lng);
    const keyword = sanitizeString(req.query.keyword || "restaurant", 50);

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (!key) return res.status(500).json({ error: "Places API not configured" });

    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
        `?location=${lat},${lng}` +
        `&radius=3000` +
        `&type=restaurant` +
        `&keyword=${encodeURIComponent(keyword)}` +
        `&key=${key}`;

      const response = await fetch(url);
      const data     = await response.json();

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        return res.status(500).json({ error: "Failed to fetch restaurants" });
      }

      const restaurants = (data.results || []).slice(0, 5).map(r => ({
        name:        r.name,
        rating:      r.rating,
        address:     r.vicinity,
        openNow:     r.opening_hours?.open_now,
        priceLevel:  r.price_level,
        placeId:     r.place_id,
      }));

      res.json({ restaurants });
    } catch (err) {
      console.error("Places error:", err.message);
      res.status(500).json({ error: "Failed to fetch restaurants" });
    }
  }
);

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Mitabhukta backend running on port ${PORT}`));