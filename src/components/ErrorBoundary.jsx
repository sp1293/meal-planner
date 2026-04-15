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
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24, background:"var(--bg)", fontFamily:"var(--font-body)" }}>
          <div style={{ maxWidth:480, textAlign:"center" }}>
            <div style={{ fontSize:56, marginBottom:16 }}>😕</div>
            <h1 style={{ fontFamily:"var(--font-display)", fontSize:26, color:"var(--primary-dark)", marginBottom:10 }}>Something went wrong</h1>
            <p style={{ fontSize:15, color:"var(--text-3)", marginBottom:24, lineHeight:1.7 }}>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <button onClick={() => window.location.reload()}
                style={{ padding:"12px 28px", background:"var(--primary)", color:"#fff", border:"none", borderRadius:"var(--radius-sm)", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"var(--font-body)" }}>
                🔄 Refresh Page
              </button>
              <button onClick={() => { this.setState({ hasError:false, error:null }); window.location.href="/"; }}
                style={{ padding:"12px 28px", background:"#fff", color:"var(--text-2)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"var(--font-body)" }}>
                🏠 Go Home
              </button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div style={{ marginTop:24, padding:16, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:"var(--radius-sm)", textAlign:"left" }}>
                <pre style={{ fontSize:11, color:"#991b1b", whiteSpace:"pre-wrap", wordBreak:"break-word", margin:0 }}>
                  {this.state.error.toString()}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}