// ─── AI Configuration ────────────────────────────────────────────────────────
export const API_URL = process.env.REACT_APP_API_URL || "https://meal-planner-backend-0ul2.onrender.com/api/meal-plan";
export const MODEL = "claude-sonnet-4-6";
export const MAX_TOKENS = 4000;

// ─── Subscription Tiers ───────────────────────────────────────────────────────
export const TIERS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "$0",
    period: "",
    color: "#6b7280",
    colorLight: "#f3f4f6",
    planDays: 3,
    plansPerMonth: 2,
    shoppingList: false,
    nutritionAnalysis: false,
    familyProfiles: 1,
    ageGroups: ["adults"],
    perks: ["3-day meal plans", "2 plans per month", "Basic recipes", "Email support"],
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: 5,
    priceLabel: "$5",
    period: "/mo",
    color: "#0891b2",
    colorLight: "#e0f2fe",
    planDays: 5,
    plansPerMonth: 10,
    shoppingList: true,
    nutritionAnalysis: false,
    familyProfiles: 1,
    ageGroups: ["kids","teens","adults","seniors"],
    perks: ["5-day meal plans", "10 plans per month", "Shopping list", "All age groups", "Priority support"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 15,
    priceLabel: "$15",
    period: "/mo",
    color: "#7c3aed",
    colorLight: "#ede9fe",
    planDays: 7,
    plansPerMonth: 999,
    shoppingList: true,
    nutritionAnalysis: true,
    familyProfiles: 1,
    ageGroups: ["kids","teens","adults","seniors"],
    perks: ["7-day meal plans", "Unlimited plans", "Shopping list", "Nutrition analysis", "All age groups", "Meal swap feature", "Priority support"],
    popular: true,
  },
  family: {
    id: "family",
    name: "Family",
    price: 25,
    priceLabel: "$25",
    period: "/mo",
    color: "#059669",
    colorLight: "#d1fae5",
    planDays: 7,
    plansPerMonth: 999,
    shoppingList: true,
    nutritionAnalysis: true,
    familyProfiles: 4,
    ageGroups: ["kids","teens","adults","seniors"],
    perks: ["Everything in Pro", "Up to 4 family profiles", "Kids & seniors nutrition", "Combined family shopping list", "Priority support"],
  },
};

// ─── Age Group Configuration ──────────────────────────────────────────────────
export const AGE_GROUPS = {
  kids: {
    id: "kids",
    label: "Kids",
    range: "Under 12",
    icon: "🧒",
    description: "Fun, nutritious meals kids love",
    nutritionFocus: "growth, calcium, iron, vitamins, kid-friendly flavors, no spicy food, colorful and fun presentation",
    calorieRange: "1200-1600",
  },
  teens: {
    id: "teens",
    label: "Teens",
    range: "13–17",
    icon: "👦",
    description: "High-energy plans for growing teens",
    nutritionFocus: "high protein for growth, energy for sports, calcium for bones, iron, healthy snacks, satisfying portions",
    calorieRange: "1800-2400",
  },
  adults: {
    id: "adults",
    label: "Adults",
    range: "18–59",
    icon: "👤",
    description: "Balanced plans for busy adults",
    nutritionFocus: "balanced macros, energy, weight management, heart health, convenience",
    calorieRange: "1500-2500",
  },
  seniors: {
    id: "seniors",
    label: "Seniors",
    range: "60+",
    icon: "👴",
    description: "Gentle, nutrient-rich meals for seniors",
    nutritionFocus: "soft textures, easy digestion, calcium for bones, low sodium, heart healthy, anti-inflammatory, high fiber",
    calorieRange: "1400-1800",
  },
};

// ─── Dietary Options ──────────────────────────────────────────────────────────
export const DIET_OPTIONS = [
  "No restrictions",
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Keto",
  "Paleo",
  "Gluten-free",
  "Dairy-free",
  "Low-carb",
  "Mediterranean",
  "High-protein",
];

export const CUISINE_OPTIONS = [
  "Any",
  "American",
  "Mediterranean",
  "Asian",
  "Indian",
  "Mexican",
  "Italian",
  "Japanese",
  "Middle Eastern",
];

export const HEALTH_GOALS = [
  "Balanced healthy eating",
  "Weight loss",
  "Muscle gain",
  "High protein",
  "Low carb",
  "Heart healthy",
  "Energy boost",
  "Better sleep",
  "Gut health",
];

// ─── AI Call Helper ────────────────────────────────────────────────────────────
export async function callAI(prompt, systemPrompt = "") {
  const body = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  };
  if (systemPrompt) body.system = systemPrompt;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Server error: ${res.status}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "API error");
  return data.content?.map(i => i.text || "").join("") || "";
}
