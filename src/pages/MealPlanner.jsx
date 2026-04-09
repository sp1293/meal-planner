import { useState } from "react";
import { doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useSub } from "../context/SubContext";
import { callAI, API_URL, AGE_GROUPS, DIET_OPTIONS, CUISINE_OPTIONS, HEALTH_GOALS } from "../config";
import { AgeGroupSelector, MealCard } from "../components";

const DEFAULT_PREFS = {
  ageGroup: "adults", diet: "Vegetarian", cuisine: "Indian",
  allergies: "", familySize: "4", goal: "Balanced healthy eating",
  calories: "2000", cookTime: "Any",
};

const PRICE_LEVEL = ["", "₹", "₹₹", "₹₹₹", "₹₹₹₹"];

export default function MealPlanner({ navigate }) {
  const { user, profile, updateUserProfile } = useAuth();
  const { plan, canGenerate } = useSub();

  const [prefs, setPrefs]           = useState(DEFAULT_PREFS);
  const [mealPlan, setMealPlan]     = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [activeDay, setActiveDay]   = useState("Monday");
  const [showShopping, setShowShopping] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  // Restaurant state
  const [restaurants, setRestaurants]           = useState({});
  const [loadingRest, setLoadingRest]           = useState({});
  const [userLocation, setUserLocation]         = useState(null);
  const [locationAsked, setLocationAsked]       = useState(false);
  const [locationError, setLocationError]       = useState("");

  // Recipe modal
  const [recipeModal, setRecipeModal]   = useState(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeCache, setRecipeCache]   = useState({});

  // Meal swap
  const [swapping, setSwapping] = useState({});

  const plansUsed = profile?.plansUsed || 0;
  const canGen    = canGenerate(plansUsed);

  function set(key, val) { setPrefs(p => ({ ...p, [key]: val })); }

  // ─── Location ───────────────────────────────────────────────────────────────
  function requestLocation() {
    setLocationAsked(true);
    if (!navigator.geolocation) { setLocationError("Geolocation not supported."); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()  => setLocationError("Location denied. Enable location in browser settings to see nearby restaurants.")
    );
  }

  // ─── Fetch Restaurants ──────────────────────────────────────────────────────
  async function fetchRestaurants(mealType, mealName) {
    const key = `${activeDay}-${mealType}`;
    if (restaurants[key] || loadingRest[key]) return;
    if (!userLocation) { requestLocation(); return; }

    setLoadingRest(l => ({ ...l, [key]: true }));
    try {
      const keyword = encodeURIComponent(mealName || "restaurant");
      const res = await fetch(
        `${API_URL.replace("/api/meal-plan", "")}/api/places?lat=${userLocation.lat}&lng=${userLocation.lng}&keyword=${keyword}`
      );
      const data = await res.json();
      setRestaurants(r => ({ ...r, [key]: data.restaurants || [] }));
    } catch {
      setRestaurants(r => ({ ...r, [key]: [] }));
    } finally {
      setLoadingRest(l => ({ ...l, [key]: false }));
    }
  }

  // ─── Fetch Recipe ────────────────────────────────────────────────────────────
  async function fetchRecipe(mealType, meal) {
    const cacheKey = meal.name;
    if (recipeCache[cacheKey]) { setRecipeModal({ ...meal, mealType, recipe: recipeCache[cacheKey] }); return; }
    setRecipeModal({ ...meal, mealType, loading: true });
    setRecipeLoading(true);
    try {
      const prompt = `You are a professional chef. Give a detailed recipe for "${meal.name}".

Respond ONLY with valid JSON (no markdown):
{
  "name": "${meal.name}",
  "servings": 4,
  "prepTime": "10 min",
  "cookTime": "20 min",
  "difficulty": "Easy",
  "ingredients": [
    { "amount": "2 cups", "item": "basmati rice" }
  ],
  "steps": [
    "Step 1: ...",
    "Step 2: ..."
  ],
  "tips": ["tip1", "tip2"],
  "nutrition": { "calories": 400, "protein": "12g", "carbs": "55g", "fat": "8g" }
}`;
      const result = await callAI(prompt);
      const recipe = JSON.parse(result.replace(/```json|```/g, "").trim());
      setRecipeCache(c => ({ ...c, [cacheKey]: recipe }));
      setRecipeModal({ ...meal, mealType, recipe });
    } catch {
      setRecipeModal({ ...meal, mealType, recipe: null, error: true });
    } finally {
      setRecipeLoading(false);
    }
  }

  // ─── Meal Swap ───────────────────────────────────────────────────────────────
  async function swapMeal(day, mealType) {
    const key = `${day}-${mealType}`;
    setSwapping(s => ({ ...s, [key]: true }));
    try {
      const ag = AGE_GROUPS[prefs.ageGroup];
      const prompt = `Generate ONE alternative ${mealType} meal for ${ag.label} (${ag.range}).
Diet: ${prefs.diet}, Cuisine: ${prefs.cuisine}, Goal: ${prefs.goal}
Allergies: ${prefs.allergies || "None"}
Nutrition focus: ${ag.nutritionFocus}

Respond ONLY with valid JSON (no markdown):
{ "name": "...", "calories": 400, "time": "20 min", "difficulty": "Easy", "description": "..." }`;

      const result = await callAI(prompt);
      const newMeal = JSON.parse(result.replace(/```json|```/g, "").trim());
      setMealPlan(prev => ({
        ...prev,
        days: prev.days.map(d =>
          d.day === day
            ? { ...d, meals: { ...d.meals, [mealType]: newMeal } }
            : d
        ),
      }));
      // Clear restaurant cache for this meal
      const restKey = `${day}-${mealType}`;
      setRestaurants(r => { const copy = { ...r }; delete copy[restKey]; return copy; });
    } catch {
      setError("Failed to swap meal. Please try again.");
    } finally {
      setSwapping(s => ({ ...s, [key]: false }));
    }
  }

  // ─── Generate Plan ───────────────────────────────────────────────────────────
  function buildPrompt() {
    const ag   = AGE_GROUPS[prefs.ageGroup];
    const days = plan.planDays;
    return `You are an expert Indian nutritionist. Generate a ${days}-day Indian meal plan.

Diet: ${prefs.diet} | Cuisine: ${prefs.cuisine} | Calories: ${prefs.calories} kcal/day
Age group: ${ag.label} (${ag.range}) | Family: ${prefs.familySize} people
Goal: ${prefs.goal} | Cook time: ${prefs.cookTime}
Allergies: ${prefs.allergies || "None"}
Nutrition focus: ${ag.nutritionFocus}
${prefs.ageGroup === "kids" ? "No spicy food. Fun colorful meals." : ""}
${prefs.ageGroup === "seniors" ? "Soft textures, low sodium, easy digestion." : ""}
${prefs.ageGroup === "teens" ? "High protein, satisfying portions." : ""}

Use authentic Indian dishes. Keep descriptions to ONE short sentence only.

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "planName": "Short plan name",
  "ageGroup": "${prefs.ageGroup}",
  "days": [
    {
      "day": "Monday",
      "totalCalories": 1900,
      "meals": {
        "breakfast": { "name": "Poha", "calories": 350, "time": "15 min", "difficulty": "Easy", "description": "One sentence." },
        "lunch":     { "name": "Dal Rice", "calories": 550, "time": "20 min", "difficulty": "Easy", "description": "One sentence." },
        "dinner":    { "name": "Palak Paneer", "calories": 650, "time": "30 min", "difficulty": "Medium", "description": "One sentence." },
        "snack":     { "name": "Chai", "calories": 150, "time": "5 min", "difficulty": "Easy", "description": "One sentence." }
      }
    }
  ],
  "shopping_list": {
    "Vegetables": ["item1"],
    "Dal & Pulses": ["item1"],
    "Grains": ["item1"],
    "Dairy": ["item1"],
    "Spices": ["item1"]
  },
  "nutrition_summary": "One sentence only.",
  "weekly_tips": ["tip1", "tip2"]
}`;
  }

  async function generate() {
    if (!canGen) { setError(`You've used all ${plan.plansPerMonth} plans this month. Upgrade to generate more!`); return; }
    setLoading(true); setError(""); setMealPlan(null);
    setShowShopping(false); setSaved(false);
    setRestaurants({}); setRecipeCache({});
    if (!locationAsked) requestLocation();
    try {
      const result  = await callAI(buildPrompt());
      const parsed  = JSON.parse(result.replace(/```json|```/g, "").trim());
      setMealPlan(parsed);
      setActiveDay(parsed.days[0]?.day || "Monday");
      if (user && plan.plansPerMonth < 999) {
        await updateDoc(doc(db, "users", user.uid), { plansUsed: increment(1) });
        await updateUserProfile({ plansUsed: plansUsed + 1 });
      }
    } catch (e) {
      setError("Failed to generate meal plan. Please try again. " + (e.message || ""));
    } finally { setLoading(false); }
  }

  async function savePlan() {
    if (!mealPlan || !user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        savedPlans: arrayUnion({
          id: Date.now().toString(),
          name: mealPlan.planName,
          ageGroup: mealPlan.ageGroup,
          createdAt: new Date().toISOString(),
          days: mealPlan.days.length,
          summary: mealPlan.nutrition_summary,
          plan: mealPlan,
        }),
      });
      setSaved(true);
    } catch { setError("Failed to save plan."); }
    finally { setSaving(false); }
  }

  const currentDay = mealPlan?.days?.find(d => d.day === activeDay);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      {/* Recipe Modal */}
      {recipeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setRecipeModal(null)}>
          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: 28, maxWidth: 560, width: "100%", maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)" }}>{recipeModal.name}</h2>
              <button onClick={() => setRecipeModal(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text-3)" }}>✕</button>
            </div>
            {recipeModal.loading ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTop: "3px solid var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                <p style={{ color: "var(--text-3)", fontSize: 14 }}>Fetching recipe...</p>
              </div>
            ) : recipeModal.error ? (
              <p style={{ color: "var(--red-500)", fontSize: 14 }}>Failed to load recipe. Please try again.</p>
            ) : recipeModal.recipe ? (
              <div>
                <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                  {[
                    { label: "Prep", value: recipeModal.recipe.prepTime },
                    { label: "Cook", value: recipeModal.recipe.cookTime },
                    { label: "Serves", value: recipeModal.recipe.servings },
                    { label: "Level", value: recipeModal.recipe.difficulty },
                  ].map(m => (
                    <div key={m.label} style={{ background: "var(--primary-pale)", borderRadius: "var(--radius-sm)", padding: "8px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 600 }}>{m.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--primary-dark)" }}>{m.value}</div>
                    </div>
                  ))}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--primary-dark)", marginBottom: 10 }}>Ingredients</h3>
                <ul style={{ paddingLeft: 18, marginBottom: 20 }}>
                  {recipeModal.recipe.ingredients?.map((ing, i) => (
                    <li key={i} style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 6 }}>
                      <strong>{ing.amount}</strong> {ing.item}
                    </li>
                  ))}
                </ul>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--primary-dark)", marginBottom: 10 }}>Instructions</h3>
                {recipeModal.recipe.steps?.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                    <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>{step}</p>
                  </div>
                ))}
                {recipeModal.recipe.tips?.length > 0 && (
                  <div style={{ background: "var(--amber-50)", border: "1px solid var(--amber-100)", borderRadius: "var(--radius-sm)", padding: 14, marginTop: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#92400e", marginBottom: 8 }}>💡 Chef Tips</div>
                    {recipeModal.recipe.tips.map((tip, i) => <p key={i} style={{ fontSize: 13, color: "#92400e", marginBottom: 4 }}>• {tip}</p>)}
                  </div>
                )}
                {recipeModal.recipe.nutrition && (
                  <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                    {Object.entries(recipeModal.recipe.nutrition).map(([k, v]) => (
                      <div key={k} style={{ background: "var(--bg-muted)", borderRadius: "var(--radius-sm)", padding: "6px 12px", fontSize: 12, color: "var(--text-3)" }}>
                        <strong>{k}:</strong> {v}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div className="page-title anim-fade-up">
        <h1>🍛 Meal Planner</h1>
        <p>Personalized {plan.planDays}-day Indian meal plans powered by Claude AI</p>
      </div>

      {error && <div className="banner banner-error mb-16">{error} <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, marginLeft: 8 }}>✕</button></div>}
      {locationError && <div className="banner banner-warn mb-16">{locationError}</div>}

      {!canGen && (
        <div className="banner banner-warn mb-16">
          You've used all {plan.plansPerMonth} plans this month.
          <button onClick={() => navigate("subscription")} style={{ marginLeft: 8, color: "var(--primary-dark)", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Upgrade now →</button>
        </div>
      )}

      {!mealPlan ? (
        <div className="card anim-fade-up-2" style={{ maxWidth: 780, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary-dark)", marginBottom: 24 }}>Customize Your Plan</h2>
          <div className="form-group">
            <AgeGroupSelector selected={prefs.ageGroup} onChange={v => set("ageGroup", v)} allowedGroups={plan.ageGroups} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Dietary Preference</label>
              <select className="form-control" value={prefs.diet} onChange={e => set("diet", e.target.value)}>
                {DIET_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Cuisine Style</label>
              <select className="form-control" value={prefs.cuisine} onChange={e => set("cuisine", e.target.value)}>
                {CUISINE_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Daily Calories</label>
              <select className="form-control" value={prefs.calories} onChange={e => set("calories", e.target.value)}>
                {["1200","1500","1800","2000","2200","2500","3000"].map(o => <option key={o}>{o} kcal</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Family Size</label>
              <select className="form-control" value={prefs.familySize} onChange={e => set("familySize", e.target.value)}>
                {["1","2","3","4","5","6","7","8"].map(o => <option key={o}>{o} {o === "1" ? "person" : "people"}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Cook Time</label>
              <select className="form-control" value={prefs.cookTime} onChange={e => set("cookTime", e.target.value)}>
                {["Any","Under 15 min","Under 30 min","Under 45 min"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Health Goal</label>
              <select className="form-control" value={prefs.goal} onChange={e => set("goal", e.target.value)}>
                {HEALTH_GOALS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Allergies / Foods to Avoid</label>
            <input className="form-control" type="text" placeholder="e.g. peanuts, dairy, gluten..." value={prefs.allergies} onChange={e => set("allergies", e.target.value)} />
          </div>
          <div style={{ background: "var(--primary-pale)", border: "1px solid var(--primary-soft)", borderRadius: "var(--radius-sm)", padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "var(--primary-dark)" }}>
            📋 Your plan: <strong>{plan.planDays} days</strong> · {plan.plansPerMonth >= 999 ? "Unlimited plans" : `${Math.max(0, plan.plansPerMonth - plansUsed)} plans remaining`} · {plan.shoppingList ? "Shopping list ✓" : ""} {plan.nutritionAnalysis ? "· Nutrition analysis ✓" : ""}
          </div>
          <button className="btn btn-primary btn-full btn-lg" onClick={generate} disabled={loading || !canGen}>
            {loading ? <><span className="spin">⟳</span>&nbsp; Generating your plan...</> : `✨ Generate ${plan.planDays}-Day Meal Plan`}
          </button>
        </div>
      ) : (
        <div className="anim-fade-in">
          {/* Plan header */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary-dark)", marginBottom: 6 }}>{mealPlan.planName}</h2>
                <p style={{ fontSize: 14, color: "var(--text-3)", maxWidth: 600 }}>{mealPlan.nutrition_summary}</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {plan.shoppingList && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowShopping(s => !s)}>
                    {showShopping ? "📅 View Plan" : "🛒 Shopping List"}
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={savePlan} disabled={saving || saved}>
                  {saved ? "✅ Saved!" : saving ? "Saving..." : "💾 Save Plan"}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setMealPlan(null); setSaved(false); setRestaurants({}); }}>+ New Plan</button>
              </div>
            </div>
          </div>

          {!showShopping ? (
            <>
              {/* Day tabs */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {mealPlan.days.map(d => (
                  <button key={d.day} onClick={() => setActiveDay(d.day)}
                    style={{ padding: "8px 18px", borderRadius: "var(--radius-full)", border: "1.5px solid", borderColor: activeDay === d.day ? "var(--primary)" : "var(--border)", background: activeDay === d.day ? "var(--primary)" : "#fff", color: activeDay === d.day ? "#fff" : "var(--text-3)", fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "var(--transition)" }}>
                    {d.day.slice(0, 3)}
                    {d.totalCalories && <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }}>{d.totalCalories}kcal</span>}
                  </button>
                ))}
              </div>

              {/* Meals */}
              {currentDay && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                  {Object.entries(currentDay.meals).map(([type, meal]) => {
                    const restKey = `${activeDay}-${type}`;
                    const restList = restaurants[restKey] || [];
                    const isLoadingRest = loadingRest[restKey];
                    const isSwapping = swapping[`${activeDay}-${type}`];

                    return (
                      <div key={type}>
                        {/* Meal Card */}
                        <MealCard type={type} meal={meal} />

                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => fetchRecipe(type, meal)} style={{ fontSize: 12 }}>
                            📖 View Recipe
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => swapMeal(activeDay, type)} disabled={isSwapping} style={{ fontSize: 12 }}>
                            {isSwapping ? <><span className="spin">⟳</span> Swapping...</> : "🔄 Swap Meal"}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => fetchRestaurants(type, meal.name)} style={{ fontSize: 12 }}>
                            📍 Nearby Restaurants
                          </button>
                        </div>

                        {/* Restaurants */}
                        {isLoadingRest && (
                          <div style={{ marginTop: 10, padding: 12, background: "var(--bg-muted)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--text-3)" }}>
                            <span className="spin">⟳</span> Finding nearby restaurants...
                          </div>
                        )}

                        {!locationAsked && (
                          <div style={{ marginTop: 10, padding: 12, background: "var(--primary-pale)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--primary-dark)" }}>
                            📍 Enable location to see nearby restaurants
                          </div>
                        )}

                        {restList.length > 0 && (
                          <div style={{ marginTop: 10 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--text-3)", marginBottom: 8 }}>📍 Nearby Restaurants</div>
                            {restList.map((r, i) => (
                              <div key={i} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 12px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                                  <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                                    {r.rating && <span>⭐ {r.rating} ({r.totalRatings?.toLocaleString("en-IN")})</span>}
                                    {r.priceLevel && <span style={{ marginLeft: 8 }}>{PRICE_LEVEL[r.priceLevel]}</span>}
                                    {r.openNow !== undefined && <span style={{ marginLeft: 8, color: r.openNow ? "var(--success)" : "var(--danger)" }}>{r.openNow ? "Open" : "Closed"}</span>}
                                  </div>
                                  <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.address}</div>
                                </div>
                                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                  <a href={`https://www.swiggy.com/search?query=${encodeURIComponent(r.name)}`} target="_blank" rel="noopener noreferrer"
                                    style={{ padding: "4px 8px", background: "#fc8019", color: "#fff", borderRadius: 4, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                                    Swiggy
                                  </a>
                                  <a href={`https://www.zomato.com/search?q=${encodeURIComponent(r.name)}`} target="_blank" rel="noopener noreferrer"
                                    style={{ padding: "4px 8px", background: "#e23744", color: "#fff", borderRadius: 4, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                                    Zomato
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tips */}
              {mealPlan.weekly_tips?.length > 0 && (
                <div className="card mt-24">
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--primary-dark)", marginBottom: 14 }}>💡 Weekly Tips</h3>
                  {mealPlan.weekly_tips.map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, fontSize: 14, color: "var(--text-2)", marginBottom: 8, lineHeight: 1.6 }}>
                      <span style={{ color: "var(--primary)", flexShrink: 0 }}>✓</span> {tip}
                    </div>
                  ))}
                </div>
              )}

              {/* Grocery Links */}
              <div className="card mt-24" style={{ background: "var(--primary-pale)", border: "1px solid var(--primary-soft)" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--primary-dark)", marginBottom: 12 }}>🛒 Order Groceries Online</h3>
                <p style={{ fontSize: 13, color: "var(--primary-dark)", marginBottom: 16, opacity: 0.8 }}>Get all your ingredients delivered to your doorstep</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {[
                    { name: "BigBasket", url: "https://www.bigbasket.com", color: "#84c225", emoji: "🧺" },
                    { name: "Blinkit",   url: "https://blinkit.com",       color: "#f8c200", emoji: "⚡" },
                    { name: "Zepto",     url: "https://www.zeptonow.com",  color: "#8025f6", emoji: "🟣" },
                    { name: "JioMart",   url: "https://www.jiomart.com",   color: "#0072bc", emoji: "🔵" },
                  ].map(g => (
                    <a key={g.name} href={g.url} target="_blank" rel="noopener noreferrer"
                      style={{ padding: "10px 18px", background: "#fff", border: `1.5px solid ${g.color}`, borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 600, color: g.color, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "var(--transition)" }}
                      onMouseEnter={e => e.currentTarget.style.background = g.color + "15"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                      {g.emoji} {g.name}
                    </a>
                  ))}
                </div>
              </div>
            </>
          ) : (
            // Shopping List
            <div className="card">
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary-dark)", marginBottom: 20 }}>🛒 Shopping List</h3>
              <div className="grid-3">
                {Object.entries(mealPlan.shopping_list).map(([cat, items]) => (
                  <div key={cat}>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".8px", color: "var(--primary)", marginBottom: 10 }}>{cat}</div>
                    {items.map(item => (
                      <label key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-2)", marginBottom: 8, cursor: "pointer" }}>
                        <input type="checkbox" style={{ cursor: "pointer", accentColor: "var(--primary)" }} />
                        {item}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-3)", marginBottom: 12 }}>Order all ingredients online:</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {[
                    { name: "BigBasket", url: "https://www.bigbasket.com", color: "#84c225" },
                    { name: "Blinkit",   url: "https://blinkit.com",       color: "#f8c200" },
                    { name: "Zepto",     url: "https://www.zeptonow.com",  color: "#8025f6" },
                    { name: "JioMart",   url: "https://www.jiomart.com",   color: "#0072bc" },
                  ].map(g => (
                    <a key={g.name} href={g.url} target="_blank" rel="noopener noreferrer"
                      style={{ padding: "8px 16px", background: "#fff", border: `1.5px solid ${g.color}`, borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600, color: g.color, textDecoration: "none" }}>
                      {g.name} →
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}