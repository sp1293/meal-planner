import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const GOAL_TYPES = [
  { id: "weight",   label: "Target Weight",   unit: "kg",    icon: "⚖️",  color: "#3b82f6" },
  { id: "steps",    label: "Daily Steps",      unit: "steps", icon: "👟",  color: "#f59e0b" },
  { id: "water",    label: "Daily Water",      unit: "L",     icon: "💧",  color: "#06b6d4" },
  { id: "workouts", label: "Weekly Workouts",  unit: "/week", icon: "🏋️",  color: "#8b5cf6" },
];

function getWeekDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
}

function getTodayKey() { return new Date().toISOString().split("T")[0]; }

function formatShortDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function GoalTracker({ navigate }) {
  const { profile } = useAuth();
  const STORAGE_KEY  = `mitabhukta_goals_${profile?.uid || "guest"}`;
  const LOG_KEY      = `mitabhukta_goal_logs_${profile?.uid || "guest"}`;
  const chartRef     = useRef(null);
  const chartRef2    = useRef(null);

  const [goals, setGoals] = useState(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : { weight: "", steps: "8000", water: "2.5", workouts: "4", currentWeight: "" }; }
    catch { return { weight: "", steps: "8000", water: "2.5", workouts: "4", currentWeight: "" }; }
  });

  const [logs, setLogs] = useState(() => {
    try { const s = localStorage.getItem(LOG_KEY); return s ? JSON.parse(s) : {}; }
    catch { return {}; }
  });

  const [activeTab,   setActiveTab]   = useState("today");
  const [editGoals,   setEditGoals]   = useState(false);
  const [tempGoals,   setTempGoals]   = useState(goals);
  const [logForm,     setLogForm]     = useState({ weight: "", steps: "", water: "", workouts: "" });
  const [savedToday,  setSavedToday]  = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(goals)); }
    catch {}
  }, [goals, STORAGE_KEY]);

  useEffect(() => {
    try { localStorage.setItem(LOG_KEY, JSON.stringify(logs)); }
    catch {}
  }, [logs, LOG_KEY]);

  useEffect(() => {
    if (activeTab === "progress") {
      setTimeout(renderCharts, 100);
    }
  }, [activeTab, logs]);

  const today     = getTodayKey();
  const todayLog  = logs[today] || {};
  const weekDays  = getWeekDays();

  function saveGoals() {
    setGoals(tempGoals);
    setEditGoals(false);
  }

  function logToday() {
    const entry = {};
    if (logForm.weight)   entry.weight   = parseFloat(logForm.weight);
    if (logForm.steps)    entry.steps    = parseInt(logForm.steps);
    if (logForm.water)    entry.water    = parseFloat(logForm.water);
    if (logForm.workouts) entry.workouts = parseInt(logForm.workouts);
    entry.loggedAt = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    setLogs(prev => ({ ...prev, [today]: { ...prev[today], ...entry } }));
    setSavedToday(true);
    setTimeout(() => setSavedToday(false), 2500);
  }

  function getPct(logged, target) {
    if (!target || !logged) return 0;
    return Math.min(100, Math.round((logged / target) * 100));
  }

  function getWeightTrend() {
    const weightLogs = weekDays.map(d => ({ date: d, weight: logs[d]?.weight || null })).filter(d => d.weight);
    if (weightLogs.length < 2) return null;
    const first = weightLogs[0].weight;
    const last  = weightLogs[weightLogs.length - 1].weight;
    return (last - first).toFixed(1);
  }

  const weightTrend = getWeightTrend();

  // Render charts
  function renderCharts() {
    if (typeof window === "undefined" || !window.Chart) return;

    // Weight chart
    const ctx1 = chartRef.current?.getContext("2d");
    if (ctx1) {
      if (chartRef.current._chartInstance) chartRef.current._chartInstance.destroy();
      const weightData = weekDays.map(d => logs[d]?.weight || null);
      const hasWeight  = weightData.some(v => v !== null);
      chartRef.current._chartInstance = new window.Chart(ctx1, {
        type: "line",
        data: {
          labels: weekDays.map(d => formatShortDate(d)),
          datasets: [{
            label: "Weight (kg)",
            data: weightData,
            borderColor: "#3b82f6",
            backgroundColor: "#eff6ff",
            borderWidth: 2,
            pointRadius: 5,
            pointBackgroundColor: "#3b82f6",
            tension: 0.4,
            spanGaps: true,
            fill: true,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: false, grid: { color: "#f3f4f6" }, ticks: { color: "#6b7280", font: { size: 11 } } },
            x: { grid: { display: false }, ticks: { color: "#6b7280", font: { size: 11 } } },
          },
        },
      });
    }

    // Steps/Water/Workouts bar chart
    const ctx2 = chartRef2.current?.getContext("2d");
    if (ctx2) {
      if (chartRef2.current._chartInstance) chartRef2.current._chartInstance.destroy();
      chartRef2.current._chartInstance = new window.Chart(ctx2, {
        type: "bar",
        data: {
          labels: weekDays.map(d => formatShortDate(d)),
          datasets: [
            {
              label: "Steps (÷100)",
              data: weekDays.map(d => Math.round((logs[d]?.steps || 0) / 100)),
              backgroundColor: "#fbbf24",
              borderRadius: 4,
            },
            {
              label: "Water (×10)",
              data: weekDays.map(d => Math.round((logs[d]?.water || 0) * 10)),
              backgroundColor: "#67e8f9",
              borderRadius: 4,
            },
            {
              label: "Workouts",
              data: weekDays.map(d => logs[d]?.workouts || 0),
              backgroundColor: "#a78bfa",
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: "#f3f4f6" }, ticks: { color: "#6b7280", font: { size: 11 } } },
            x: { grid: { display: false }, ticks: { color: "#6b7280", font: { size: 11 }, maxRotation: 0 } },
          },
        },
      });
    }
  }

  return (
    <div className="page">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" />

      <div className="page-title anim-fade-up">
        <h1>🎯 Goal Tracker</h1>
        <p>Track your weight, steps, water intake and workouts over time</p>
      </div>

      {/* Goal settings */}
      <div className="card anim-fade-up-2" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: editGoals ? 16 : 0 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--primary-dark)" }}>My Goals</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => { setEditGoals(e => !e); setTempGoals(goals); }}>
            {editGoals ? "Cancel" : "✏️ Edit Goals"}
          </button>
        </div>

        {editGoals ? (
          <div>
            <div className="grid-2">
              {[
                { key: "currentWeight", label: "Current Weight (kg)", placeholder: "e.g. 72" },
                { key: "weight",        label: "Target Weight (kg)",  placeholder: "e.g. 68" },
                { key: "steps",         label: "Daily Steps Goal",    placeholder: "e.g. 8000" },
                { key: "water",         label: "Daily Water Goal (L)", placeholder: "e.g. 2.5" },
                { key: "workouts",      label: "Weekly Workouts Goal", placeholder: "e.g. 4" },
              ].map(f => (
                <div key={f.key} className="form-group">
                  <label>{f.label}</label>
                  <input className="form-control" type="number" placeholder={f.placeholder} value={tempGoals[f.key] || ""} onChange={e => setTempGoals(g => ({ ...g, [f.key]: e.target.value }))} min="0" step="0.1" />
                </div>
              ))}
            </div>
            <button className="btn btn-primary" onClick={saveGoals}>Save Goals</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginTop: 14 }}>
            {[
              { label: "Current Weight", value: goals.currentWeight ? `${goals.currentWeight} kg` : "—", color: "#3b82f6" },
              { label: "Target Weight",  value: goals.weight        ? `${goals.weight} kg`         : "—", color: "#3b82f6" },
              { label: "Daily Steps",    value: goals.steps         ? `${parseInt(goals.steps).toLocaleString("en-IN")}` : "—", color: "#f59e0b" },
              { label: "Daily Water",    value: goals.water         ? `${goals.water} L`            : "—", color: "#06b6d4" },
              { label: "Weekly Workouts",value: goals.workouts      ? `${goals.workouts}/week`      : "—", color: "#8b5cf6" },
            ].map(g => (
              <div key={g.label} style={{ background: "var(--bg-muted)", borderRadius: "var(--radius-sm)", padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>{g.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: g.color }}>{g.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[{ id: "today", label: "Log Today" },{ id: "progress", label: "Progress Charts" },{ id: "history", label: "History" }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: "9px 18px", borderRadius: "var(--radius-full)", border: `1.5px solid ${activeTab === tab.id ? "var(--primary)" : "var(--border)"}`, background: activeTab === tab.id ? "var(--primary)" : "#fff", color: activeTab === tab.id ? "#fff" : "var(--text-3)", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-body)", transition: "var(--transition)" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Today's log */}
      {activeTab === "today" && (
        <div className="anim-fade-in">
          {savedToday && <div className="banner banner-success mb-16">✅ Today's progress saved!</div>}

          {/* Today's progress rings */}
          {(todayLog.steps || todayLog.water || todayLog.workouts || todayLog.weight) && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
              {[
                { key: "steps",    label: "Steps",    target: goals.steps,    unit: "",    color: "#f59e0b" },
                { key: "water",    label: "Water",    target: goals.water,    unit: "L",   color: "#06b6d4" },
                { key: "workouts", label: "Workouts", target: goals.workouts, unit: "",    color: "#8b5cf6" },
              ].map(g => {
                const val = todayLog[g.key];
                const p   = getPct(val, parseFloat(g.target));
                if (!val && !g.target) return null;
                return (
                  <div key={g.key} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 16, textAlign: "center" }}>
                    <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 10px" }}>
                      <svg width="80" height="80" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="7" />
                        <circle cx="40" cy="40" r="32" fill="none" stroke={g.color} strokeWidth="7"
                          strokeDasharray={`${2 * Math.PI * 32}`}
                          strokeDashoffset={`${2 * Math.PI * 32 * (1 - p / 100)}`}
                          strokeLinecap="round" transform="rotate(-90 40 40)"
                          style={{ transition: "stroke-dashoffset 0.5s ease" }} />
                      </svg>
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: g.color }}>{p}%</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{val ? `${val}${g.unit}` : "—"}</div>
                    <div style={{ fontSize: 11, color: "var(--text-4)" }}>{g.label}</div>
                  </div>
                );
              })}
              {todayLog.weight && (
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 16, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>⚖️</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#3b82f6" }}>{todayLog.weight} kg</div>
                  <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 4 }}>
                    {goals.weight ? `Goal: ${goals.weight} kg` : "Today's weight"}
                  </div>
                  {goals.weight && (
                    <div style={{ fontSize: 12, color: parseFloat(todayLog.weight) <= parseFloat(goals.weight) ? "var(--primary)" : "#f59e0b", fontWeight: 600, marginTop: 4 }}>
                      {parseFloat(todayLog.weight) <= parseFloat(goals.weight) ? "🎉 Goal reached!" : `${(parseFloat(todayLog.weight) - parseFloat(goals.weight)).toFixed(1)} kg to go`}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Log form */}
          <div className="card">
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--primary-dark)", marginBottom: 20 }}>
              Log Today — {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </h3>
            <div className="grid-2">
              {[
                { key: "weight",   label: "Weight (kg)",    placeholder: "e.g. 72.5", icon: "⚖️",  step: "0.1" },
                { key: "steps",    label: "Steps today",    placeholder: "e.g. 7500",  icon: "👟",  step: "100" },
                { key: "water",    label: "Water intake (L)",placeholder: "e.g. 2.0",  icon: "💧",  step: "0.1" },
                { key: "workouts", label: "Workouts done",  placeholder: "e.g. 1",     icon: "🏋️",  step: "1" },
              ].map(f => (
                <div key={f.key} className="form-group">
                  <label>{f.icon} {f.label}</label>
                  <input className="form-control" type="number" placeholder={f.placeholder} min="0" step={f.step}
                    value={logForm[f.key]} onChange={e => setLogForm(l => ({ ...l, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <button className="btn btn-primary btn-lg" onClick={logToday}
              disabled={!logForm.weight && !logForm.steps && !logForm.water && !logForm.workouts}>
              💾 Save Today's Progress
            </button>
          </div>
        </div>
      )}

      {/* Progress charts */}
      {activeTab === "progress" && (
        <div className="anim-fade-in">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" onLoad={renderCharts} />

          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--primary-dark)" }}>⚖️ Weight Trend</h3>
              {weightTrend && (
                <span style={{ fontSize: 13, fontWeight: 700, color: parseFloat(weightTrend) < 0 ? "#16a34a" : "#ef4444" }}>
                  {parseFloat(weightTrend) < 0 ? "↓" : "↑"} {Math.abs(parseFloat(weightTrend))} kg this week
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16 }}>Daily weight over last 7 days</p>
            <div style={{ position: "relative", height: 220 }}>
              <canvas ref={chartRef} role="img" aria-label="Weight trend chart over last 7 days" />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", fontSize: 12, color: "var(--text-3)" }}>
              <span style={{ width: 10, height: 10, background: "#3b82f6", borderRadius: 2, display: "inline-block" }} />
              Weight (kg)
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--primary-dark)", marginBottom: 4 }}>📊 Activity Overview</h3>
            <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16 }}>Steps, water and workouts — last 7 days</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
              {[["Steps ÷100","#fbbf24"],["Water ×10","#67e8f9"],["Workouts","#a78bfa"]].map(([label, color]) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-3)" }}>
                  <span style={{ width: 10, height: 10, background: color, borderRadius: 2, display: "inline-block" }} />
                  {label}
                </span>
              ))}
            </div>
            <div style={{ position: "relative", height: 220 }}>
              <canvas ref={chartRef2} role="img" aria-label="Activity chart showing steps, water and workouts over last 7 days" />
            </div>
          </div>

          <button className="btn btn-ghost btn-sm mt-16" onClick={renderCharts}>↻ Refresh Charts</button>
        </div>
      )}

      {/* History */}
      {activeTab === "history" && (
        <div className="anim-fade-in">
          {weekDays.filter(d => logs[d] && Object.keys(logs[d]).length > 0).length === 0 ? (
            <div className="card text-center" style={{ padding: 48 }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>📋</div>
              <p style={{ color: "var(--text-3)" }}>No logs yet. Start logging today!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[...weekDays].reverse().filter(d => logs[d] && Object.keys(logs[d]).filter(k => k !== "loggedAt").length > 0).map(date => {
                const log = logs[date];
                return (
                  <div key={date} className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--primary-dark)" }}>
                        {date === today ? "Today" : formatShortDate(date)}
                      </div>
                      {log.loggedAt && <span style={{ fontSize: 11, color: "var(--text-4)" }}>Logged at {log.loggedAt}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {log.weight   && <span style={{ fontSize: 13, background: "#eff6ff", color: "#1d4ed8", padding: "4px 12px", borderRadius: "var(--radius-full)", fontWeight: 600 }}>⚖️ {log.weight} kg</span>}
                      {log.steps    && <span style={{ fontSize: 13, background: "#fffbeb", color: "#d97706", padding: "4px 12px", borderRadius: "var(--radius-full)", fontWeight: 600 }}>👟 {parseInt(log.steps).toLocaleString("en-IN")} steps</span>}
                      {log.water    && <span style={{ fontSize: 13, background: "#ecfeff", color: "#0e7490", padding: "4px 12px", borderRadius: "var(--radius-full)", fontWeight: 600 }}>💧 {log.water} L</span>}
                      {log.workouts && <span style={{ fontSize: 13, background: "#f5f3ff", color: "#6d28d9", padding: "4px 12px", borderRadius: "var(--radius-full)", fontWeight: 600 }}>🏋️ {log.workouts} workout{log.workouts > 1 ? "s" : ""}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
