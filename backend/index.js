require('dotenv').config();
const express  = require("express");
const cors     = require("cors");
const fetch    = require("node-fetch");

const app = express();

app.use(cors({ origin: "*", methods: ["GET","POST","OPTIONS"], allowedHeaders: ["Content-Type","Authorization"] }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "NourishAI backend is running!", version: "2.0" });
});

app.post("/api/meal-plan", async (req, res) => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method:  "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("AI error:", err.message);
    res.status(500).json({ error: { message: "AI request failed" } });
  }
});

app.get("/api/places", async (req, res) => {
  const { lat, lng, keyword } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: "lat and lng are required" });

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return res.status(500).json({ error: "Google Places API key not configured" });

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}` +
      `&radius=3000` +
      `&type=restaurant` +
      `&keyword=${encodeURIComponent(keyword || "restaurant")}` +
      `&key=${key}`;

    const response = await fetch(url);
    const data     = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return res.status(500).json({ error: data.error_message || data.status });
    }

    const restaurants = (data.results || []).slice(0, 5).map(r => ({
      name:         r.name,
      rating:       r.rating,
      totalRatings: r.user_ratings_total,
      address:      r.vicinity,
      openNow:      r.opening_hours?.open_now,
      priceLevel:   r.price_level,
      placeId:      r.place_id,
    }));

    res.json({ restaurants });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`NourishAI backend running on port ${PORT}`));