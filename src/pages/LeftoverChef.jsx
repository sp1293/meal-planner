import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSub } from "../context/SubContext";
import { callAI } from "../config";

// ─── Common Indian pantry staples for quick-add ────────────────────────────
const PANTRY_STAPLES = [
  "Rice", "Dal", "Atta", "Onion", "Tomato", "Potato", "Ginger", "Garlic",
  "Paneer", "Curd", "Eggs", "Chicken", "Spinach", "Cauliflower", "Peas",
  "Lemon", "Coriander", "Cumin", "Turmeric", "Chilli", "Mustard seeds",
  "Coconut", "Milk", "Butter", "Oil", "Bread", "Oats", "Poha", "Semolina",
];

// ─── Parse AI response into structured recipes ─────────────────────────────
function parseRecipes(text) {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed  = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : parsed.recipes || [];
  } catch {
    return [];
  }
}

// ─── Single Recipe Card ────────────────────────────────────────────────────
function RecipeCard({ recipe, index, onSave, saved }) {
  const [expanded, setExpanded] = useState(false);

  const diffColor = {
    Easy:   { bg: "#f0fdf4", color: "#15803d" },
    Medium: { bg: "#fffbeb", color: "#d97706" },
    Hard:   { bg: "#fff5f5", color: "#dc2626" },
  }[recipe.difficulty] || { bg: "#f0fdf4", color: "#15803d" };

  return (
    <div className="card" style={{ marginBottom: 16, border: saved ? "1.5px solid var(--primary)" : "1px solid var(--border)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--text)" }}>
              {recipe.emoji} {recipe.name}
            </span>
            {saved && <span style={{ fontSize: 11, background: "var(--primary-pale)", color: "var(--primary)", padding: "2px 10px", borderRadius: "var(--radius-full)", fontWeight: 700 }}>✓ Saved</span>}
          </div>
          <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6, margin: 0 }}>{recipe.description}</p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--primary-dark)", fontFamily: "var(--font-display)" }}>{recipe.calories}</div>
          <div style={{ fontSize: 11, color: "var(--text-4)" }}>kcal</div>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {[
          [`⏱ ${recipe.cookTime}`, "#eff6ff", "#1d4ed8"],
          [`👨‍🍳 ${recipe.difficulty}`, diffColor.bg, diffColor.color],
          [`🍽 Serves ${recipe.serves}`, "#f0fdf4", "#15803d"],
          [`💪 P: ${recipe.protein}g`, "#fdf4ff", "#7c3aed"],
          [`🌾 C: ${recipe.carbs}g`, "#fffbeb", "#d97706"],
          [`🥑 F: ${recipe.fat}g`, "#fff5f5", "#dc2626"],
        ].map(([label, bg, color]) => (
          <span key={label} style={{ fontSize: 12, background: bg, color, padding: "4px 10px", borderRadius: "var(--radius-full)", fontWeight: 600 }}>
            {label}
          </span>
        ))}
      </div>

      {/* Health tip */}
      {recipe.healthTip && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontSize: 13, color: "#15803d", marginBottom: 14 }}>
          💚 <strong>Health tip:</strong> {recipe.healthTip}
        </div>
      )}

      {/* Missing ingredients */}
      {recipe.missingIngredients?.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontSize: 13, color: "#92400e", marginBottom: 14 }}>
          🛒 <strong>You'll need:</strong> {recipe.missingIngredients.join(", ")}
        </div>
      )}

      {/* Expand/collapse */}
      <button onClick={() => setExpanded(e => !e)}
        style={{ background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 16px", fontSize: 13, cursor: "pointer", color: "var(--text-3)", fontFamily: "var(--font-body)", width: "100%", marginBottom: expanded ? 16 : 0, transition: "var(--transition)" }}>
        {expanded ? "▲ Hide Instructions" : "▼ View Step-by-Step Instructions"}
      </button>

      {/* Instructions */}
      {expanded && (
        <div className="anim-fade-in">
          {/* Ingredients */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".5px" }}>Ingredients</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 6 }}>
              {recipe.ingredients?.map((ing, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text-2)", alignItems: "center" }}>
                  <span style={{ color: "var(--primary)", fontWeight: 700, flexShrink: 0 }}>•</span>
                  {ing}
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".5px" }}>Instructions</div>
            {recipe.steps?.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.65, margin: 0 }}>{step}</p>
              </div>
            ))}
          </div>

          {/* Healthier alternative */}
          {recipe.healthierAlternative && (
            <div style={{ background: "var(--primary-pale)", border: "1px solid var(--primary-soft)", borderRadius: "var(--radius-sm)", padding: "10px 14px", marginTop: 12, fontSize: 13, color: "var(--primary-dark)" }}>
              ✨ <strong>Healthier twist:</strong> {recipe.healthierAlternative}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button className="btn btn-primary btn-sm" onClick={() => onSave(recipe)} style={{ flex: 1 }}>
          {saved ? "✓ Saved to My Plans" : "💾 Save Recipe"}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(e => !e)}>
          {expanded ? "Hide" : "Cook Now 👨‍🍳"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function LeftoverChef({ navigate }) {
  const { profile }       = useAuth();
  const { plan }          = useSub();
  const fileInputRef      = useRef(null);

  const [ingredients,   setIngredients]   = useState([]);
  const [inputText,     setInputText]     = useState("");
  const [recipeCount,   setRecipeCount]   = useState(3);
  const [recipes,       setRecipes]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [savedRecipes,  setSavedRecipes]  = useState([]);
  const [photoLoading,  setPhotoLoading]  = useState(false);
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [searchDone,    setSearchDone]    = useState(false);

  // ── Plan gate ────────────────────────────────────────────────────────────
  const hasAccess = ["starter","pro","family"].includes(plan?.id);

  if (!hasAccess) {
    return (
      <div className="page">
        <div className="page-title anim-fade-up">
          <h1>🍳 Leftover Chef</h1>
          <p>Cook smart with what you have</p>
        </div>
        <div className="card anim-scale-in" style={{ maxWidth: 480, margin: "0 auto", textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary-dark)", marginBottom: 10 }}>Starter Plan Required</h2>
          <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 24, lineHeight: 1.7 }}>
            Leftover Chef is available on Starter (₹299/mo) and above. Upgrade to cook smart with whatever's in your kitchen!
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate("subscription")}>Upgrade to Starter — ₹299/mo</button>
          <button className="btn btn-ghost btn-sm mt-12" onClick={() => navigate("dashboard")}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // ── Add ingredient from text input ───────────────────────────────────────
  function addIngredient() {
    const items = inputText.split(",").map(s => s.trim()).filter(s => s.length > 0 && s.length < 50);
    const newItems = items.filter(i => !ingredients.includes(i));
    if (newItems.length > 0) {
      setIngredients(prev => [...prev, ...newItems]);
    }
    setInputText("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addIngredient();
    }
  }

  function removeIngredient(item) {
    setIngredients(prev => prev.filter(i => i !== item));
  }

  function addStaple(staple) {
    if (!ingredients.includes(staple)) {
      setIngredients(prev => [...prev, staple]);
    }
  }

  // ── Photo upload → AI reads ingredients ─────────────────────────────────
  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB."); return; }

    setPhotoLoading(true);
    setError("");

    try {
      // Convert to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setUploadedPhoto(URL.createObjectURL(file));

      // Call Claude vision to identify ingredients
      const res = await fetch(
        process.env.REACT_APP_API_URL?.replace("/api/meal-plan", "") + "/api/meal-plan" ||
        "https://meal-planner-backend-0ul2.onrender.com/api/meal-plan",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 500,
            messages: [{
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: file.type, data: base64 } },
                { type: "text",  text: 'List all the food ingredients, vegetables, fruits, and grocery items you can see in this image. Return ONLY a JSON array of strings, no other text. Example: ["tomato","onion","rice","dal"]. Be specific about Indian ingredients if present.' },
              ],
            }],
          }),
        }
      );

      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("") || "[]";
      const detected = JSON.parse(text.replace(/```json|```/g, "").trim());

      if (Array.isArray(detected) && detected.length > 0) {
        const newItems = detected.filter(i => typeof i === "string" && !ingredients.includes(i));
        setIngredients(prev => [...prev, ...newItems]);
      } else {
        setError("Couldn't detect ingredients clearly. Try adding them manually.");
      }
    } catch {
      setError("Failed to read photo. Please add ingredients manually.");
    } finally {
      setPhotoLoading(false);
    }
  }

  // ── Generate recipes ─────────────────────────────────────────────────────
  async function generateRecipes() {
    if (ingredients.length < 2) { setError("Please add at least 2 ingredients."); return; }
    setLoading(true); setError(""); setRecipes([]); setSearchDone(false);

    const dietPref    = profile?.dietPreference || "vegetarian";
    const healthGoal  = profile?.healthGoal     || "balanced healthy eating";

    const prompt = `You are an expert Indian nutritionist and chef. The user has these ingredients available: ${ingredients.join(", ")}.

Their dietary preference: ${dietPref}
Their health goal: ${healthGoal}

Suggest exactly ${recipeCount} healthy Indian recipes they can make primarily using these ingredients. Recipes should be practical, healthy, and use common Indian cooking methods.

Return ONLY a valid JSON array with exactly ${recipeCount} recipes in this format:
[
  {
    "name": "Recipe Name",
    "emoji": "🍛",
    "description": "Brief appetizing description (1-2 sentences)",
    "cookTime": "20 mins",
    "difficulty": "Easy",
    "serves": 2,
    "calories": 320,
    "protein": 12,
    "carbs": 45,
    "fat": 8,
    "healthTip": "Why this recipe is healthy (1 sentence)",
    "healthierAlternative": "One tip to make it even healthier",
    "ingredients": ["1 cup rice", "2 tbsp dal", "..."],
    "missingIngredients": ["ingredient not in their list but needed"],
    "steps": ["Step 1...", "Step 2...", "Step 3..."]
  }
]

Rules:
- Prioritize using the available ingredients
- Keep missingIngredients minimal (max 2-3 common items)
- Make steps clear and beginner-friendly
- Calories and macros must be realistic
- Difficulty must be exactly "Easy", "Medium", or "Hard"
- Return ONLY the JSON array, no other text`;

    try {
      const text    = await callAI(prompt);
      const parsed  = parseRecipes(text);
      if (parsed.length === 0) throw new Error("Could not parse recipes");
      setRecipes(parsed);
      setSearchDone(true);
    } catch {
      setError("Failed to generate recipes. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function saveRecipe(recipe) {
    if (!savedRecipes.find(r => r.name === recipe.name)) {
      setSavedRecipes(prev => [...prev, recipe]);
    }
  }

  function clearAll() {
    setIngredients([]);
    setRecipes([]);
    setUploadedPhoto(null);
    setError("");
    setSearchDone(false);
  }

  return (
    <div className="page">
      <div className="page-title anim-fade-up">
        <h1>🍳 Leftover Chef</h1>
        <p>Tell us what's in your kitchen — we'll suggest healthy Indian recipes you can cook right now</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }} className="anim-fade-up-2">

        {/* Left — Ingredient input */}
        <div className="card">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)", marginBottom: 6 }}>
            What's in your kitchen?
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 20 }}>
            Add ingredients by typing, uploading a fridge photo, or tapping common staples below.
          </p>

          {/* Text input */}
          <div className="form-group">
            <label>Type ingredients</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="form-control" type="text"
                placeholder="e.g. onion, tomato, paneer..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={200}
                style={{ flex: 1 }} />
              <button className="btn btn-primary btn-sm" onClick={addIngredient} disabled={!inputText.trim()}>Add</button>
            </div>
            <p className="form-hint">Press Enter or comma to add multiple</p>
          </div>

          {/* Photo upload */}
          <div className="form-group">
            <label>📸 Upload fridge/pantry photo</label>
            <div style={{ border: "2px dashed var(--border)", borderRadius: "var(--radius-md)", padding: 20, textAlign: "center", cursor: "pointer", background: "var(--bg-muted)", transition: "var(--transition)" }}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
              {photoLoading ? (
                <div>
                  <span className="spin" style={{ fontSize: 24, display: "block", marginBottom: 8 }}>⟳</span>
                  <p style={{ fontSize: 13, color: "var(--text-3)" }}>Reading ingredients from photo...</p>
                </div>
              ) : uploadedPhoto ? (
                <div>
                  <img src={uploadedPhoto} alt="Uploaded" style={{ maxHeight: 120, borderRadius: "var(--radius-sm)", marginBottom: 8, objectFit: "cover" }} />
                  <p style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>✓ Ingredients detected! Tap to upload another.</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                  <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 4 }}>Tap to take or upload a photo</p>
                  <p style={{ fontSize: 11, color: "var(--text-4)" }}>AI will detect ingredients automatically</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
              onChange={handlePhotoUpload} style={{ display: "none" }} />
          </div>

          {/* Added ingredients */}
          {ingredients.length > 0 && (
            <div className="form-group">
              <label>Your ingredients ({ingredients.length})</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {ingredients.map(ing => (
                  <span key={ing} style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--primary-pale)", color: "var(--primary-dark)", padding: "5px 12px", borderRadius: "var(--radius-full)", fontSize: 13, fontWeight: 500 }}>
                    {ing}
                    <button onClick={() => removeIngredient(ing)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontSize: 14, padding: 0, lineHeight: 1, marginLeft: 2 }}>✕</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && <div className="banner banner-error mb-16">{error}</div>}

          {/* Recipe count */}
          <div className="form-group">
            <label>Number of recipes</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[3, 5].map(n => (
                <button key={n} type="button" onClick={() => setRecipeCount(n)}
                  style={{ flex: 1, padding: "10px", border: `1.5px solid ${recipeCount === n ? "var(--primary)" : "var(--border)"}`, background: recipeCount === n ? "var(--primary-pale)" : "#fff", borderRadius: "var(--radius-sm)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)", color: recipeCount === n ? "var(--primary-dark)" : "var(--text-3)", fontWeight: recipeCount === n ? 600 : 400, transition: "var(--transition)" }}>
                  {n} recipes
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary btn-full btn-lg" onClick={generateRecipes}
            disabled={loading || ingredients.length < 2}>
            {loading
              ? <><span className="spin">⟳</span> Cooking up ideas...</>
              : `🍳 Find ${recipeCount} Recipes`}
          </button>

          {ingredients.length > 0 && (
            <button className="btn btn-ghost btn-full btn-sm mt-10" onClick={clearAll}>Clear all</button>
          )}
        </div>

        {/* Right — Common staples */}
        <div className="card">
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--primary-dark)", marginBottom: 6 }}>
            🛒 Common Indian Staples
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16 }}>Tap to quickly add what you have:</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {PANTRY_STAPLES.map(staple => {
              const added = ingredients.includes(staple);
              return (
                <button key={staple} onClick={() => added ? removeIngredient(staple) : addStaple(staple)}
                  style={{ padding: "7px 14px", borderRadius: "var(--radius-full)", border: `1.5px solid ${added ? "var(--primary)" : "var(--border)"}`, background: added ? "var(--primary)" : "#fff", color: added ? "#fff" : "var(--text-3)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: added ? 600 : 400, transition: "var(--transition)" }}>
                  {added ? "✓ " : ""}{staple}
                </button>
              );
            })}
          </div>

          {/* Tips */}
          <div style={{ marginTop: 24, background: "var(--bg-muted)", borderRadius: "var(--radius-md)", padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>💡 Tips for best results</div>
            {[
              "Add at least 4-5 ingredients for more recipe variety",
              "Include a protein (dal, paneer, eggs, chicken) for balanced recipes",
              "Mention spices you have — they make a big difference",
              "Upload a clear photo for automatic ingredient detection",
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text-3)", marginBottom: 6 }}>
                <span style={{ color: "var(--primary)" }}>→</span> {tip}
              </div>
            ))}
          </div>

          {/* Saved recipes */}
          {savedRecipes.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>
                💾 Saved Recipes ({savedRecipes.length})
              </div>
              {savedRecipes.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 12px", background: "var(--primary-pale)", borderRadius: "var(--radius-sm)", marginBottom: 6 }}>
                  <span>{r.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--primary-dark)", flex: 1 }}>{r.name}</span>
                  <span style={{ fontSize: 12, color: "var(--primary)" }}>{r.calories} kcal</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="card anim-scale-in" style={{ textAlign: "center", padding: 48, marginBottom: 24 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>👨‍🍳</div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)", marginBottom: 8 }}>
            Chef AI is cooking up ideas...
          </h3>
          <p style={{ fontSize: 14, color: "var(--text-3)" }}>
            Finding the best healthy recipes from your {ingredients.length} ingredients
          </p>
        </div>
      )}

      {/* Results */}
      {searchDone && recipes.length > 0 && (
        <div className="anim-fade-up">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--primary-dark)" }}>
              🍽 {recipes.length} Recipes for You
            </h2>
            <button className="btn btn-ghost btn-sm" onClick={generateRecipes}>
              🔄 Regenerate
            </button>
          </div>
          {recipes.map((recipe, i) => (
            <RecipeCard key={i} recipe={recipe} index={i}
              onSave={saveRecipe}
              saved={!!savedRecipes.find(r => r.name === recipe.name)} />
          ))}
        </div>
      )}

      {searchDone && recipes.length === 0 && !loading && (
        <div className="card text-center" style={{ padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <p style={{ color: "var(--text-3)" }}>Couldn't generate recipes. Try adding more ingredients or try again.</p>
          <button className="btn btn-primary mt-16" onClick={generateRecipes}>Try Again</button>
        </div>
      )}
    </div>
  );
}
