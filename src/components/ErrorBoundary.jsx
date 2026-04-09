import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console in dev — in production plug in Sentry here
    console.error("NourishAI Error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", padding: 24, background: "#f9fafb",
      }}>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          {/* Logo */}
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#166534", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 24px" }}>
            🥗
          </div>

          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, color: "#166534", marginBottom: 10 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.7, marginBottom: 28 }}>
            NourishAI hit an unexpected error. Your data is safe — this is just a display issue.
          </p>

          {/* Error details in dev */}
          {process.env.NODE_ENV === "development" && this.state.error && (
            <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 8, padding: 16, marginBottom: 24, textAlign: "left" }}>
              <div style={{ fontSize: 12, fontFamily: "monospace", color: "#dc2626", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {this.state.error.toString()}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: "12px 28px", background: "#166534", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              Reload App
            </button>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/"; }}
              style={{ padding: "12px 28px", background: "#fff", color: "#166534", border: "1.5px solid #166534", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              Go to Home
            </button>
          </div>

          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 24 }}>
            Still having issues?{" "}
            <a href="mailto:support@nourishai.com" style={{ color: "#166534" }}>support@nourishai.com</a>
          </p>
        </div>
      </div>
    );
  }
}
