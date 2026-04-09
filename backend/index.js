require('dotenv').config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "NourishAI backend is running!" });
});

// ─── AI Meal Plan ─────────────────────────────────────────────────────────────
app.post("/api/meal-plan", async (req, res) => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "AI request failed" });
  }
});

// ─── Google Places — Nearby Restaurants ──────────────────────────────────────
app.get("/api/places", async (req, res) => {
  const { lat, lng, keyword } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: "lat and lng required" });

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3000&type=restaurant&keyword=${encodeURIComponent(keyword || "restaurant")}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    // Return only what we need — never expose raw API response
    const restaurants = (data.results || []).slice(0, 5).map(r => ({
      name: r.name,
      rating: r.rating,
      totalRatings: r.user_ratings_total,
      address: r.vicinity,
      openNow: r.opening_hours?.open_now,
      priceLevel: r.price_level,
      placeId: r.place_id,
      photo: r.photos?.[0]?.photo_reference || null,
    }));

    res.json({ restaurants });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

// ─── Google Places — Place Details (for Swiggy/Zomato deep link) ─────────────
app.get("/api/place-details", async (req, res) => {
  const { placeId } = req.query;
  if (!placeId) return res.status(400).json({ error: "placeId required" });

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,url&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data.result || {});
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch place details" });
  }
});

app.listen(3001, () => console.log("NourishAI backend running on port 3001"));