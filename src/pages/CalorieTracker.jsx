import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const MEAL_TYPES = ["breakfast","lunch","dinner","snack"];
const MEAL_COLORS = {
  breakfast: { bg: "#fffbeb", border: "#fde68a", tag: "#d97706" },
  lunch:     { bg: "#f0fdf4", border: "#bbf7d0", tag: "#15803d" },
  dinner:    { bg: "#eff6ff", border: "#bfdbfe", tag: "#1d4ed8" },
  snack:     { bg: "#fdf4ff", border: "#e9d5ff", tag: "#7c3aed" },
};

const API_BASE = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace("/api/meal-plan", "")
  : "https://meal-planner-backend-0ul2.onrender.com";

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export default function CalorieTracker({ navigate }) {
  const { profile } = useAuth();
  const STORAGE_KEY = `mitabhukta_calories_${profile?.uid || "guest"}`;
  const photoRef    = useRef(null);

  const [data, setData] = useState(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : {}; }
    catch { return {}; }
  });

  const [selectedDate,  setSelectedDate]  = useState(getTodayKey());
  const [showAddForm,   setShowAddForm]   = useState(false);
  const [addingTo,      setAddingTo]      = useState("breakfast");
  const [form,          setForm]          = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const [photoLoading,  setPhotoLoading]  = useState(false);
  const [photoPreview,  setPhotoPreview]  = useState(null);
  const [photoError,    setPhotoError]    = useState("");
  const [photoResult,   setPhotoResult]   = useState(null); // detected items from AI
  const [calorieTarget, setCalorieTarget] = useState(() => {
    try { return parseInt(localStorage.getItem(`mitabhukta_cal_target_${profile?.uid}`) || "2000"); }
    catch { return 2000; }
  });
  const [editingTarget, setEditingTarget] = useState(false);
  const [tempTarget,    setTempTarget]    = useState(calorieTarget);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch {}
  }, [data, STORAGE_KEY]);

  const dayData    = data[selectedDate] || {};
  const allEntries = MEAL_TYPES.flatMap(t => (dayData[t] || []).map(e => ({ ...e, mealType: t })));
  const totalCals  = allEntries.reduce((s, e) => s + (e.calories || 0), 0);
  const totalProt  = allEntries.reduce((s, e) => s + (e.protein  || 0), 0);
  const totalCarbs = allEntries.reduce((s, e) => s + (e.carbs    || 0), 0);
  const totalFat   = allEntries.reduce((s, e) => s + (e.fat      || 0), 0);
  const pct        = Math.min(100, Math.round((totalCals / calorieTarget) * 100));
  const remaining  = calorieTarget - totalCals;
  const last7      = getLast7Days();

  // ── Photo scan using Claude Vision ──────────────────────────────────────
  async function handlePhotoScan(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setPhotoError("Please upload an image."); return; }
    if (file.size > 5 * 1024 * 1024) { setPhotoError("Image must be under 5MB."); return; }

    setPhotoLoading(true);
    setPhotoError("");
    setPhotoResult(null);
    setPhotoPreview(URL.createObjectURL(file));

    try {
      // Convert to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch(`${API_BASE}/api/meal-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model:      "claude-sonnet-4-6",
          max_tokens: 800,
          messages: [{
            role: "user",
            content: [
              {
                type:   "image",
                source: { type: "base64", media_type: file.type, data: base64 },
              },
              {
                type: "text",
                text: `You are a nutrition expert. Analyze this food photo and identify all food items visible.
For each item, estimate calories and macros based on the visible portion size.
Also give a total for the entire meal.

Return ONLY valid JSON in this exact format, no other text:
{
  "items": [
    { "name": "Food Item Name", "calories": 250, "protein": 8, "carbs": 35, "fat": 6, "portion": "1 cup approx" }
  ],
  "total": { "calories": 250, "protein": 8, "carbs": 35, "fat": 6 },
  "mealName": "Short meal name e.g. Dal Rice Plate",
  "confidence": "high/medium/low",
  "notes": "Any important notes about the estimate"
}

Be realistic with Indian food portions. If you cannot identify the food clearly, set confidence to "low".`,
              },
            ],
          }],
        }),
      });

      const data     = await response.json();
      const text     = data.content?.map(c => c.text || "").join("") || "";
      const cleaned  = text.replace(/```json|```/g, "").trim();
      const parsed   = JSON.parse(cleaned);

      if (parsed?.total && parsed?.mealName) {
        setPhotoResult(parsed);
        // Auto-fill the form with detected values
        setForm({
          name:     parsed.mealName,
          calories: String(parsed.total.calories),
          protein:  String(parsed.total.protein),
          carbs:    String(parsed.total.carbs),
          fat:      String(parsed.total.fat),
        });
      } else {
        setPhotoError("Couldn't analyze the food clearly. Please fill in manually.");
      }
    } catch {
      setPhotoError("Failed to analyze photo. Please fill in manually.");
    } finally {
      setPhotoLoading(false);
    }
  }

  function openAddForm(type) {
    setAddingTo(type);
    setShowAddForm(true);
    setForm({ name: "", calories: "", protein: "", carbs: "", fat: "" });
    setPhotoPreview(null);
    setPhotoResult(null);
    setPhotoError("");
  }

  function addEntry() {
    if (!form.name || !form.calories) return;
    const entry = {
      id:       Date.now().toString(),
      name:     form.name,
      calories: parseInt(form.calories) || 0,
      protein:  parseInt(form.protein)  || 0,
      carbs:    parseInt(form.carbs)    || 0,
      fat:      parseInt(form.fat)      || 0,
      time:     new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      fromPhoto: !!photoResult,
    };
    setData(prev => ({
      ...prev,
      [selectedDate]: {
        ...prev[selectedDate],
        [addingTo]: [...(prev[selectedDate]?.[addingTo] || []), entry],
      },
    }));
    setForm({ name: "", calories: "", protein: "", carbs: "", fat: "" });
    setPhotoPreview(null);
    setPhotoResult(null);
    setShowAddForm(false);
  }

  // Add individual detected item
  function addDetectedItem(item) {
    const entry = {
      id:       Date.now().toString(),
      name:     item.name,
      calories: item.calories,
      protein:  item.protein  || 0,
      carbs:    item.carbs    || 0,
      fat:      item.fat      || 0,
      time:     new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      fromPhoto: true,
    };
    setData(prev => ({
      ...prev,
      [selectedDate]: {
        ...prev[selectedDate],
        [addingTo]: [...(prev[selectedDate]?.[addingTo] || []), entry],
      },
    }));
  }

  function removeEntry(mealType, id) {
    setData(prev => ({
      ...prev,
      [selectedDate]: {
        ...prev[selectedDate],
        [mealType]: (prev[selectedDate]?.[mealType] || []).filter(e => e.id !== id),
      },
    }));
  }

  function saveTarget() {
    const t = parseInt(tempTarget);
    if (!isNaN(t) && t > 0) {
      setCalorieTarget(t);
      localStorage.setItem(`mitabhukta_cal_target_${profile?.uid}`, t);
    }
    setEditingTarget(false);
  }

  const weeklyData = last7.map(date => {
    const d = data[date] || {};
    return {
      label: formatDate(date).split(",")[0],
      cals:  MEAL_TYPES.flatMap(t => d[t] || []).reduce((s, e) => s + (e.calories || 0), 0),
    };
  });
  const maxCals       = Math.max(...weeklyData.map(d => d.cals), calorieTarget);
  const progressColor = pct >= 100 ? "#ef4444" : pct >= 85 ? "#f59e0b" : "#16a34a";

  const confidenceColor = { high: "#15803d", medium: "#d97706", low: "#dc2626" };

  return (
    <div className="page">
      <div className="page-title anim-fade-up">
        <h1>🔥 Calorie Tracker</h1>
        <p>Log meals manually or just snap a photo — AI estimates the calories instantly</p>
      </div>

      {/* Date selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }} className="anim-fade-up">
        {last7.map(date => (
          <button key={date} onClick={() => setSelectedDate(date)}
            style={{ flexShrink: 0, padding: "10px 16px", borderRadius: "var(--radius-md)", border: `1.5px solid ${selectedDate === date ? "var(--primary)" : "var(--border)"}`, background: selectedDate === date ? "var(--primary)" : "#fff", color: selectedDate === date ? "#fff" : "var(--text)", cursor: "pointer", fontFamily: "var(--font-body)", textAlign: "center", transition: "var(--transition)", minWidth: 70 }}>
            <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>{formatDate(date).split(" ")[0]}</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{new Date(date + "T00:00:00").getDate()}</div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>{formatDate(date).split(" ")[2]}</div>
          </button>
        ))}
      </div>

      {/* Daily summary */}
      <div className="card anim-fade-up-2" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)", marginBottom: 2 }}>{formatDate(selectedDate)}</div>
            <div style={{ fontSize: 13, color: "var(--text-3)" }}>{selectedDate === getTodayKey() ? "Today" : ""}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {editingTarget ? (
              <>
                <input type="number" value={tempTarget} onChange={e => setTempTarget(e.target.value)}
                  style={{ width: 80, padding: "6px 10px", border: "1.5px solid var(--primary)", borderRadius: "var(--radius-sm)", fontSize: 14, fontFamily: "var(--font-body)" }} />
                <button className="btn btn-primary btn-sm" onClick={saveTarget}>Save</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingTarget(false)}>Cancel</button>
              </>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditingTarget(true); setTempTarget(calorieTarget); }}>
                🎯 Target: {calorieTarget} kcal
              </button>
            )}
          </div>
        </div>

        {/* Calorie ring + stats */}
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, alignItems: "center", marginBottom: 16 }}>
          <div style={{ position: "relative", width: 120, height: 120 }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none" stroke={progressColor} strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
                strokeLinecap="round" transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dashoffset 0.6s ease" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: progressColor }}>{totalCals}</div>
              <div style={{ fontSize: 10, color: "var(--text-4)" }}>kcal eaten</div>
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
              <span style={{ color: "var(--text-3)" }}>Eaten</span>
              <span style={{ fontWeight: 600, color: progressColor }}>{totalCals} kcal</span>
            </div>
            <div style={{ height: 8, background: "var(--border)", borderRadius: "var(--radius-full)", overflow: "hidden", marginBottom: 8 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: progressColor, borderRadius: "var(--radius-full)", transition: "width 0.6s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 14 }}>
              <span style={{ color: "var(--text-3)" }}>Target: {calorieTarget} kcal</span>
              <span style={{ color: remaining < 0 ? "#ef4444" : "var(--primary)", fontWeight: 600 }}>
                {remaining >= 0 ? `${remaining} remaining` : `${Math.abs(remaining)} over`}
              </span>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[["Protein", totalProt, "#3b82f6"],["Carbs", totalCarbs, "#f59e0b"],["Fat", totalFat, "#ef4444"]].map(([label, val, color]) => (
                <div key={label} style={{ flex: 1, background: "var(--bg-muted)", borderRadius: "var(--radius-sm)", padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color }}>{val}g</div>
                  <div style={{ fontSize: 11, color: "var(--text-4)" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add meal buttons */}
      {!showAddForm && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }} className="anim-fade-up-2">
          {MEAL_TYPES.map(type => (
            <button key={type} className="btn btn-ghost btn-sm"
              onClick={() => openAddForm(type)} style={{ fontSize: 13 }}>
              + Add {type}
            </button>
          ))}
          {/* Quick photo scan button */}
          <button className="btn btn-primary btn-sm"
            onClick={() => { openAddForm("snack"); setTimeout(() => photoRef.current?.click(), 100); }}
            style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            📸 Scan Food Photo
          </button>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="card anim-scale-in" style={{ marginBottom: 20, borderColor: MEAL_COLORS[addingTo]?.border, borderWidth: 1.5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--primary-dark)" }}>
              Add to {addingTo.charAt(0).toUpperCase() + addingTo.slice(1)}
            </h3>
            <button onClick={() => setShowAddForm(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-3)" }}>✕</button>
          </div>

          {/* Meal type selector */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {MEAL_TYPES.map(t => (
              <button key={t} type="button" onClick={() => setAddingTo(t)}
                style={{ padding: "6px 12px", borderRadius: "var(--radius-full)", border: `1.5px solid ${addingTo === t ? "var(--primary)" : "var(--border)"}`, background: addingTo === t ? "var(--primary-pale)" : "#fff", color: addingTo === t ? "var(--primary-dark)" : "var(--text-3)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: addingTo === t ? 600 : 400 }}>
                {t}
              </button>
            ))}
          </div>

          {/* ── Photo Scan Section ── */}
          <div style={{ background: "var(--bg-muted)", borderRadius: "var(--radius-md)", padding: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>📸 Scan with AI</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>Take a photo of your meal — AI estimates calories instantly</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => photoRef.current?.click()} disabled={photoLoading}
                style={{ flexShrink: 0 }}>
                {photoLoading ? <><span className="spin">⟳</span> Scanning...</> : "📷 Take Photo"}
              </button>
            </div>
            <input ref={photoRef} type="file" accept="image/*" capture="environment"
              onChange={handlePhotoScan} style={{ display: "none" }} />

            {/* Photo preview */}
            {photoPreview && (
              <div style={{ marginBottom: 12 }}>
                <img src={photoPreview} alt="Food" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: "var(--radius-sm)" }} />
              </div>
            )}

            {/* Loading */}
            {photoLoading && (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
                <p style={{ fontSize: 13, color: "var(--text-3)" }}>AI is analyzing your food photo...</p>
              </div>
            )}

            {/* Photo error */}
            {photoError && <div className="banner banner-error" style={{ marginTop: 8 }}>{photoError}</div>}

            {/* AI Results */}
            {photoResult && !photoLoading && (
              <div className="anim-fade-in">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                    🤖 AI detected: {photoResult.mealName}
                  </div>
                  <span style={{ fontSize: 11, background: confidenceColor[photoResult.confidence] + "22", color: confidenceColor[photoResult.confidence], padding: "2px 10px", borderRadius: "var(--radius-full)", fontWeight: 700, textTransform: "capitalize" }}>
                    {photoResult.confidence} confidence
                  </span>
                </div>

                {/* Individual items */}
                {photoResult.items?.length > 1 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 8 }}>Detected items — tap to add individually:</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {photoResult.items.map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", borderRadius: "var(--radius-sm)", padding: "8px 12px", border: "1px solid var(--border)" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{item.name}</div>
                            <div style={{ fontSize: 11, color: "var(--text-4)" }}>{item.portion} · P:{item.protein}g C:{item.carbs}g F:{item.fat}g</div>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary-dark)" }}>{item.calories} kcal</span>
                            <button className="btn btn-ghost btn-sm" onClick={() => addDetectedItem(item)} style={{ fontSize: 11 }}>+ Add</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total summary */}
                <div style={{ background: "var(--primary-pale)", borderRadius: "var(--radius-sm)", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary-dark)" }}>Total meal estimate</div>
                    <div style={{ fontSize: 12, color: "var(--primary)", marginTop: 2 }}>
                      P:{photoResult.total.protein}g · C:{photoResult.total.carbs}g · F:{photoResult.total.fat}g
                    </div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--primary-dark)", fontFamily: "var(--font-display)" }}>
                    {photoResult.total.calories} kcal
                  </div>
                </div>

                {photoResult.notes && (
                  <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 8, fontStyle: "italic" }}>
                    ℹ️ {photoResult.notes}
                  </div>
                )}

                <p style={{ fontSize: 11, color: "var(--text-4)", marginTop: 8 }}>
                  ⚠️ AI estimates may vary. You can edit the values below before saving.
                </p>
              </div>
            )}
          </div>

          {/* Manual form — pre-filled from photo or blank */}
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-3)", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".5px" }}>
            {photoResult ? "Edit & Confirm" : "Or enter manually"}
          </div>
          <div className="grid-2" style={{ marginBottom: 12 }}>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Food name *</label>
              <input className="form-control" type="text" placeholder="e.g. Poha, Dal Rice, Apple..."
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                maxLength={80} />
            </div>
            <div className="form-group">
              <label>Calories (kcal) *</label>
              <input className="form-control" type="number" placeholder="e.g. 350" min="0" max="5000"
                value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Protein (g) <span style={{ color: "var(--text-4)", fontWeight: 400 }}>optional</span></label>
              <input className="form-control" type="number" placeholder="e.g. 12" min="0" max="500"
                value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Carbs (g) <span style={{ color: "var(--text-4)", fontWeight: 400 }}>optional</span></label>
              <input className="form-control" type="number" placeholder="e.g. 55" min="0" max="1000"
                value={form.carbs} onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Fat (g) <span style={{ color: "var(--text-4)", fontWeight: 400 }}>optional</span></label>
              <input className="form-control" type="number" placeholder="e.g. 8" min="0" max="500"
                value={form.fat} onChange={e => setForm(f => ({ ...f, fat: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={addEntry} disabled={!form.name || !form.calories}>
              {photoResult ? "✅ Save AI Entry" : "Add Entry"}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Meal logs */}
      <div className="anim-fade-up-3" style={{ marginBottom: 28 }}>
        {MEAL_TYPES.map(type => {
          const entries  = dayData[type] || [];
          const c        = MEAL_COLORS[type];
          const mealCals = entries.reduce((s, e) => s + (e.calories || 0), 0);
          return (
            <div key={type} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: c.tag }} />
                  <span style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: c.tag }}>{type}</span>
                </div>
                <span style={{ fontSize: 13, color: "var(--text-3)" }}>{mealCals} kcal</span>
              </div>
              {entries.length === 0 ? (
                <div style={{ padding: "12px 16px", background: c.bg, border: `1px dashed ${c.border}`, borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--text-4)", cursor: "pointer" }}
                  onClick={() => openAddForm(type)}>
                  + Tap to log {type}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {entries.map(entry => (
                    <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: c.bg, border: `1px solid ${c.border}`, borderRadius: "var(--radius-sm)", padding: "10px 14px" }}>
                      <div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{entry.name}</span>
                          {entry.fromPhoto && <span style={{ fontSize: 10, background: "#eff6ff", color: "#1d4ed8", padding: "1px 6px", borderRadius: "var(--radius-full)", fontWeight: 700 }}>📸 AI</span>}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>
                          {entry.time}
                          {entry.protein > 0 && ` · P:${entry.protein}g`}
                          {entry.carbs   > 0 && ` · C:${entry.carbs}g`}
                          {entry.fat     > 0 && ` · F:${entry.fat}g`}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: c.tag }}>{entry.calories} kcal</span>
                        <button onClick={() => removeEntry(type, entry.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", fontSize: 16, padding: 0, lineHeight: 1 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Weekly bar chart */}
      <div className="card anim-fade-up-4">
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--primary-dark)", marginBottom: 4 }}>📊 Weekly Calories</h3>
        <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16 }}>Last 7 days vs your {calorieTarget} kcal target</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
          {weeklyData.map((d, i) => {
            const barH    = maxCals > 0 ? Math.round((d.cals / maxCals) * 120) : 0;
            const targetH = Math.round((calorieTarget / maxCals) * 120);
            const isToday = last7[i] === getTodayKey();
            const over    = d.cals > calorieTarget;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 10, color: "var(--text-4)" }}>{d.cals > 0 ? d.cals : ""}</div>
                <div style={{ width: "100%", height: 120, display: "flex", alignItems: "flex-end", position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: targetH, borderTop: "1.5px dashed #d1d5db", zIndex: 1 }} />
                  <div style={{ width: "100%", height: barH || 3, background: over ? "#ef4444" : isToday ? "var(--primary)" : "#a7f3d0", borderRadius: "3px 3px 0 0", transition: "height 0.4s ease", position: "relative", zIndex: 2 }} />
                </div>
                <div style={{ fontSize: 11, color: isToday ? "var(--primary)" : "var(--text-4)", fontWeight: isToday ? 700 : 400 }}>{d.label}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: "var(--text-3)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, background: "var(--primary)", borderRadius: 2, display: "inline-block" }} />Today</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, background: "#ef4444", borderRadius: 2, display: "inline-block" }} />Over target</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 16, height: 2, borderTop: "2px dashed #d1d5db", display: "inline-block" }} />Target line</span>
        </div>
      </div>
    </div>
  );
}