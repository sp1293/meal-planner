import { useState } from "react";
import { doc, updateDoc, arrayUnion, increment, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useSub } from "../context/SubContext";
import { callAI, AGE_GROUPS, DIET_OPTIONS, CUISINE_OPTIONS, HEALTH_GOALS } from "../config";
import { AgeGroupSelector, MealCard } from "../components";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const DEFAULT_PREFS = {
  ageGroup: "adults", diet: "No restrictions", cuisine: "Any",
  allergies: "", familySize: "2", goal: "Balanced healthy eating",
  calories: "2000", cookTime: "Any",
};

export default function MealPlanner({ navigate }) {
  const { user, profile, updateUserProfile } = useAuth();
  const { plan, canGenerate } = useSub();

  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeDay, setActiveDay] = useState("Monday");
  const [showShopping, setShowShopping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const plansUsed = profile?.plansUsed || 0;
  const canGen = canGenerate(plansUsed);

  function set(key, val) { setPrefs(p => ({ ...p, [key]: val })); }

  function buildPrompt() {
    const ag = AGE_GROUPS[prefs.ageGroup];
    const days = plan.planDays;

    return `You are a world-class nutritionist and chef. Generate a detailed ${days}-day meal plan.

PROFILE:
- Age Group: ${ag.label} (${ag.range})
- Dietary preference: ${prefs.diet}
- Cuisine: ${prefs.cuisine}
- Allergies/restrictions: ${prefs.allergies || "None"}
- Family size: ${prefs.familySize} people
- Daily calorie target: ${prefs.calories} kcal
- Health goal: ${prefs.goal}
- Cook time preference: ${prefs.cookTime}

NUTRITION FOCUS for ${ag.label}: ${ag.nutritionFocus}
Typical calorie range for this age group: ${ag.calorieRange} kcal/day

REQUIREMENTS:
- Each meal must be appropriate for ${ag.label} (${ag.range})
- Use realistic, commonly available ingredients
- Include variety across the week
- Include difficulty level for each meal (Easy/Medium/Hard)
${prefs.ageGroup === "kids" ? "- Make meals fun, colorful, and kid-friendly. No spicy food." : ""}
${prefs.ageGroup === "seniors" ? "- Use soft textures, easy digestion, low sodium, anti-inflammatory ingredients." : ""}
${prefs.ageGroup === "teens" ? "- Include high-protein options and satisfying portions for active teens." : ""}

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "planName": "Descriptive plan name",
  "ageGroup": "${prefs.ageGroup}",
  "days": [
    {
      "day": "Monday",
      "totalCalories": 1900,
      "meals": {
        "breakfast": { "name": "...", "calories": 400, "time": "10 min", "difficulty": "Easy", "description": "..." },
        "lunch":     { "name": "...", "calories": 550, "time": "20 min", "difficulty": "Easy", "description": "..." },
        "dinner":    { "name": "...", "calories": 700, "time": "30 min", "difficulty": "Medium", "description": "..." },
        "snack":     { "name": "...", "calories": 200, "time": "5 min",  "difficulty": "Easy", "description": "..." }
      }
    }
  ],
  "shopping_list": {
    "Produce":  ["item1", "item2"],
    "Proteins": ["item1"],
    "Dairy":    ["item1"],
    "Grains":   ["item1"],
    "Pantry":   ["item1"],
    "Spices":   ["item1"]
  },
  "nutrition_summary": "2-3 sentence summary of nutritional highlights and how it meets the goals.",
  "weekly_tips": ["tip1", "tip2", "tip3"]
}`;
  }

  async function generate() {
    if (!canGen) { setError(`You've used all ${plan.plansPerMonth} plans this month. Upgrade to generate more!`); return; }
    setLoading(true); setError(""); setMealPlan(null); setShowShopping(false); setSaved(false);
    try {
      const result = await callAI(buildPrompt());
      const parsed = JSON.parse(result.replace(/```json|```/g, "").trim());
      setMealPlan(parsed);
      setActiveDay(parsed.days[0]?.day || "Monday");
      // Increment plan usage counter
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

  return (
    <div className="page">
      <div className="page-title anim-fade-up">
        <h1>🍛 Meal Planner</h1>
        <p>Generate a personalized {plan.planDays}-day meal plan powered by Claude Opus</p>
      </div>

      {error && <div className="banner banner-error mb-16">{error} <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, marginLeft: 8 }}>✕</button></div>}

      {!canGen && (
        <div className="banner banner-warn mb-16">
          You've used all {plan.plansPerMonth} plans this month.
          <button onClick={() => navigate("subscription")} style={{ marginLeft: 8, color: "var(--primary-dark)", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Upgrade now →</button>
        </div>
      )}

      {!mealPlan ? (
        <div className="card anim-fade-up-2" style={{ maxWidth: 780, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary-dark)", marginBottom: 24 }}>Customize Your Plan</h2>

          {/* Age Group */}
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
                {["Any","Under 15 min","Under 30 min","Under 45 min","No preference"].map(o => <option key={o}>{o}</option>)}
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
            <input className="form-control" type="text" placeholder="e.g. nuts, shellfish, dairy, eggs..." value={prefs.allergies} onChange={e => set("allergies", e.target.value)} />
          </div>

          <div style={{ background: "var(--primary-pale)", border: "1px solid var(--primary-soft)", borderRadius: "var(--radius-sm)", padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "var(--primary-dark)" }}>
            📋 Your plan: <strong>{plan.planDays} days</strong> · {plan.plansPerMonth >= 999 ? "Unlimited plans" : `${Math.max(0, plan.plansPerMonth - plansUsed)} plans remaining this month`} · {plan.shoppingList ? "Shopping list included" : "No shopping list"} · {plan.nutritionAnalysis ? "Nutrition analysis included" : ""}
          </div>

          <button className="btn btn-primary btn-full btn-lg" onClick={generate} disabled={loading || !canGen}>
            {loading ? <><span className="spin">⟳</span>&nbsp; Generating your meal plan...</> : `✨ Generate ${plan.planDays}-Day Meal Plan`}
          </button>
        </div>
      ) : (
        <div className="anim-fade-in">
          {/* Plan header */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="flex-between" style={{ flexWrap: "wrap", gap: 12 }}>
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
                <button className="btn btn-secondary btn-sm" onClick={() => { setMealPlan(null); setSaved(false); }}>+ New Plan</button>
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

              {/* Meals grid */}
              {currentDay && (
                <div className="grid-auto">
                  {Object.entries(currentDay.meals).map(([type, meal]) => (
                    <MealCard key={type} type={type} meal={meal} />
                  ))}
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
            </>
          ) : (
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
