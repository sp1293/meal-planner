import { useState, useEffect } from "react";
import "./styles/global.css";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { SubProvider } from "./context/SubContext";

import Navbar         from "./components/Navbar";
import { Footer, LoadingSpinner } from "./components";

import Landing        from "./pages/Landing";
import { LoginPage, SignupPage } from "./pages/Login";
import Dashboard      from "./pages/Dashboard";
import MealPlanner    from "./pages/MealPlanner";
import { MyPlansPage, AccountPage, SubscriptionPage } from "./pages/OtherPages";
import Trainers       from "./pages/Trainers";
import MyBookings     from "./pages/MyBookings";
import Guidelines     from "./pages/Guidelines";
import AdminPanel     from "./pages/AdminPanel";
import TrainerPortal  from "./pages/TrainerPortal";
import Referral       from "./pages/Referral";
import CalorieTracker from "./pages/CalorieTracker";
import GoalTracker    from "./pages/GoalTracker";
import LeftoverChef   from "./pages/LeftoverChef";
import PrivacyPolicy  from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound       from "./pages/NotFound";

// ── PWA Install Banner ─────────────────────────────────────────────────────
function PWAInstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [show,   setShow]   = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      if (!localStorage.getItem("pwa_dismissed")) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show || !prompt) return null;

  async function install() {
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setShow(false);
  }

  return (
    <div style={{ position: "fixed", bottom: 20, left: 20, right: 20, zIndex: 9999, maxWidth: 400, margin: "0 auto" }}>
      <div style={{ background: "#166534", color: "#fff", borderRadius: 16, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
        <img src="/logo192.png" alt="" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Install Mitabhukta</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Add to home screen for quick access</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={install} style={{ padding: "8px 16px", background: "#fff", color: "#166534", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Install</button>
          <button onClick={() => { localStorage.setItem("pwa_dismissed","1"); setShow(false); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 20, cursor: "pointer", padding: 0 }}>✕</button>
        </div>
      </div>
    </div>
  );
}

// ── Pages that don't require auth ─────────────────────────────────────────
const PUBLIC_PAGES = new Set(["landing","login","signup","guidelines","privacy","terms"]);

// ── Pages that require auth ────────────────────────────────────────────────
const PROTECTED_PAGES = new Set([
  "dashboard","planner","my-plans","account","subscription",
  "trainers","my-bookings","referral","admin","trainer-portal",
  "calories","goals","leftover-chef",
]);

function InnerApp() {
  const { user, profile, loading, role } = useAuth();
  const [page, setPage] = useState("landing");

  function navigate(p) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Auth-based redirects ───────────────────────────────────────────────────
  // IMPORTANT: Only depend on `user` and `loading` — NOT `profile` or `page`
  // profile loads async and causes race conditions if used here
  useEffect(() => {
    if (loading) return;

    if (user) {
      // Logged in — if on a public page, go to the right home page
      setPage(prev => {
        if (!PUBLIC_PAGES.has(prev)) return prev; // already on a real page, stay
        if (role === "trainer") return "trainer-portal";
        if (role === "admin")   return "admin";
        return "dashboard";
      });
    } else {
      // Logged out — if on a protected page, go to landing
      setPage(prev => PROTECTED_PAGES.has(prev) ? "landing" : prev);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);
  // NOTE: `role` intentionally omitted — role changes only after
  // profile loads which is a separate concern handled in renderPage

  if (loading) return <LoadingSpinner fullPage message="Loading Mitabhukta..." />;

  // ── Trainer shortcut ───────────────────────────────────────────────────────
  if (user && role === "trainer") {
    return <TrainerPortal navigate={navigate} />;
  }

  const showNavbar = page !== "trainer-portal";
  const showFooter = !["login","signup","trainer-portal"].includes(page);

  // ── Page renderer ──────────────────────────────────────────────────────────
  function renderPage() {
    // If logged in and somehow still on a public page, show dashboard
    if (user && PUBLIC_PAGES.has(page)) {
      return <Dashboard navigate={navigate} />;
    }

    // If logged out and on a protected page, show landing
    if (!user && PROTECTED_PAGES.has(page)) {
      return <Landing navigate={navigate} />;
    }

    switch (page) {
      // ── Public ──────────────────────────────────────────────────────────
      case "landing":    return <Landing navigate={navigate} />;
      case "login":      return <LoginPage navigate={navigate} />;
      case "signup":     return <SignupPage navigate={navigate} />;
      case "guidelines": return <Guidelines navigate={navigate} />;
      case "privacy":    return <PrivacyPolicy navigate={navigate} />;
      case "terms":      return <TermsOfService navigate={navigate} />;

      // ── Trainer ─────────────────────────────────────────────────────────
      case "trainer-portal": return <TrainerPortal navigate={navigate} />;

      // ── Admin ────────────────────────────────────────────────────────────
      case "admin":
        if (role !== "admin") return <Dashboard navigate={navigate} />;
        return <AdminPanel navigate={navigate} />;

      // ── Protected student pages ──────────────────────────────────────────
      case "dashboard":     return <Dashboard navigate={navigate} />;
      case "planner":       return <MealPlanner navigate={navigate} />;
      case "my-plans":      return <MyPlansPage navigate={navigate} />;
      case "account":       return <AccountPage navigate={navigate} />;
      case "subscription":  return <SubscriptionPage navigate={navigate} />;
      case "trainers":      return <Trainers navigate={navigate} />;
      case "my-bookings":   return <MyBookings navigate={navigate} />;
      case "referral":      return <Referral navigate={navigate} />;
      case "calories":      return <CalorieTracker navigate={navigate} />;
      case "goals":         return <GoalTracker navigate={navigate} />;
      case "leftover-chef": return <LeftoverChef navigate={navigate} />;

      default: return <NotFound navigate={navigate} />;
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {showNavbar && <Navbar page={page} navigate={navigate} />}
      <main style={{ flex: 1 }}>{renderPage()}</main>
      {showFooter && <Footer navigate={navigate} />}
      <PWAInstallBanner />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SubProvider>
        <InnerApp />
      </SubProvider>
    </AuthProvider>
  );
}