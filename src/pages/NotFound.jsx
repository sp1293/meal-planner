export default function NotFound({ navigate }) {
  return (
    <div style={{
      minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24, background: "var(--bg)",
    }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }} className="anim-scale-in">
        <div style={{ fontSize: 80, marginBottom: 16 }}>🥗</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 64, color: "var(--primary)", marginBottom: 0, lineHeight: 1 }}>
          404
        </h1>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--primary-dark)", marginBottom: 12 }}>
          Page not found
        </h2>
        <p style={{ fontSize: 15, color: "var(--text-3)", lineHeight: 1.7, marginBottom: 32 }}>
          Looks like this page went on a diet and disappeared! Let's get you back on track.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate("dashboard")}>
            Go to Dashboard
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => navigate("planner")}>
            Start Meal Planning
          </button>
        </div>
        <div style={{ marginTop: 40, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            ["🍛 Meal Planner", "planner"],
            ["💪 Trainers",     "trainers"],
            ["🔥 Calorie Tracker","calories"],
            ["🍳 Leftover Chef","leftover-chef"],
          ].map(([label, id]) => (
            <button key={id} onClick={() => navigate(id)}
              style={{ background: "none", border: "none", color: "var(--primary)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 500 }}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
