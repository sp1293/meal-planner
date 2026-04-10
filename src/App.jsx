import { useState, useEffect, useRef, lazy, Suspense } from "react";
import "./styles/global.css";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { SubProvider } from "./context/SubContext";

import Navbar         from "./components/Navbar";
import { Footer, ProtectedRoute, LoadingSpinner } from "./components";

// ── Eager — critical path (landing + auth screens load instantly) ──────────
import Landing              from "./pages/Landing";
import { LoginPage, SignupPage } from "./pages/Login";

// ── Lazy — authenticated pages load only when first visited ───────────────
// Named exports need the .then(m => ({ default: m.X })) pattern for lazy().
const Dashboard      = lazy(() => import("./pages/Dashboard"));
const MealPlanner    = lazy(() => import("./pages/MealPlanner"));
const MyPlansPage    = lazy(() => import("./pages/OtherPages").then(m => ({ default: m.MyPlansPage })));
const AccountPage    = lazy(() => import("./pages/OtherPages").then(m => ({ default: m.AccountPage })));
const SubscriptionPage = lazy(() => import("./pages/OtherPages").then(m => ({ default: m.SubscriptionPage })));
const Trainers       = lazy(() => import("./pages/Trainers"));
const MyBookings     = lazy(() => import("./pages/MyBookings"));
const Guidelines     = lazy(() => import("./pages/Guidelines"));
const AdminPanel     = lazy(() => import("./pages/AdminPanel"));
const TrainerPortal  = lazy(() => import("./pages/TrainerPortal"));
const Referral       = lazy(() => import("./pages/Referral"));
const CalorieTracker = lazy(() => import("./pages/CalorieTracker"));
const GoalTracker    = lazy(() => import("./pages/GoalTracker"));
const LeftoverChef   = lazy(() => import("./pages/LeftoverChef"));
const PrivacyPolicy  = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const NotFound       = lazy(() => import("./pages/NotFound"));

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
    const result = await prompt.userChoice;
    if (result.outcome === "accepted") setShow(false);
  }

  function dismiss() {
    localStorage.setItem("pwa_dismissed", "1");
    setShow(false);
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
          <button onClick={dismiss} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 20, cursor: "pointer", padding: 0 }}>✕</button>
        </div>
      </div>
    </div>
  );
}

// ── Public pages — always accessible ──────────────────────────────────────
const PUBLIC_PAGES = ["landing", "login", "signup", "guidelines", "privacy", "terms"];

// ── Protected pages — need login ───────────────────────────────────────────
const PROTECTED_PAGES = [
  "dashboard","planner","my-plans","account","subscription",
  "trainers","my-bookings","referral","admin","trainer-portal",
  "calories","goals","leftover-chef",
];

function InnerApp() {
  const { user, loading, role } = useAuth();
  const [page, setPage] = useState("landing");
  // True after the very first Firebase session resolution (handles page-refresh
  // with an existing session). Subsequent logins are handled by the login
  // handlers themselves — this flag prevents the effect from racing with them.
  const sessionChecked = useRef(false);

  function navigate(p) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    if (loading) return;

    if (user) {
      // Only auto-redirect on the very first check (e.g. page refresh with
      // an existing session). After that, login handlers drive navigation so
      // we don't override sub-screens like Google prefs.
      if (!sessionChecked.current && PUBLIC_PAGES.includes(page)) {
        setPage("dashboard");
      }
      sessionChecked.current = true;
      return;
    }

    // ── Logged out ───────────────────────────────────────────────────────
    sessionChecked.current = true;
    if (PROTECTED_PAGES.includes(page)) {
      setPage("landing");
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]); // role/profile intentionally omitted — they load async

  // Show loading spinner while Firebase resolves auth state
  if (loading) return <LoadingSpinner fullPage message="Loading Mitabhukta..." />;

  // Trainer always sees trainer portal
  if (user && role === "trainer") {
    return <TrainerPortal navigate={navigate} />;
  }

  const showNavbar = page !== "trainer-portal";
  const showFooter = !["login", "signup", "trainer-portal"].includes(page);

  const renderPage = () => {
    // ── Auth pages — redirect to dashboard if already logged in ────────
    if (["landing", "login", "signup"].includes(page)) {
      if (user) return <Dashboard navigate={navigate} />;
    }

    switch (page) {
      // Public
      case "landing":    return <Landing navigate={navigate} />;
      case "login":      return <LoginPage navigate={navigate} />;
      case "signup":     return <SignupPage navigate={navigate} />;
      case "guidelines": return <Guidelines navigate={navigate} />;
      case "privacy":    return <PrivacyPolicy navigate={navigate} />;
      case "terms":      return <TermsOfService navigate={navigate} />;

      // Trainer
      case "trainer-portal": return <TrainerPortal navigate={navigate} />;

      // Protected — admin
      case "admin":
        return <ProtectedRoute navigate={navigate}><AdminPanel navigate={navigate} /></ProtectedRoute>;

      // Protected — student
      case "dashboard":
        return <ProtectedRoute navigate={navigate}><Dashboard navigate={navigate} /></ProtectedRoute>;
      case "planner":
        return <ProtectedRoute navigate={navigate}><MealPlanner navigate={navigate} /></ProtectedRoute>;
      case "my-plans":
        return <ProtectedRoute navigate={navigate}><MyPlansPage navigate={navigate} /></ProtectedRoute>;
      case "account":
        return <ProtectedRoute navigate={navigate}><AccountPage navigate={navigate} /></ProtectedRoute>;
      case "subscription":
        return <ProtectedRoute navigate={navigate}><SubscriptionPage navigate={navigate} /></ProtectedRoute>;
      case "trainers":
        return <ProtectedRoute navigate={navigate}><Trainers navigate={navigate} /></ProtectedRoute>;
      case "my-bookings":
        return <ProtectedRoute navigate={navigate}><MyBookings navigate={navigate} /></ProtectedRoute>;
      case "referral":
        return <ProtectedRoute navigate={navigate}><Referral navigate={navigate} /></ProtectedRoute>;
      case "calories":
        return <ProtectedRoute navigate={navigate}><CalorieTracker navigate={navigate} /></ProtectedRoute>;
      case "goals":
        return <ProtectedRoute navigate={navigate}><GoalTracker navigate={navigate} /></ProtectedRoute>;
      case "leftover-chef":
        return <ProtectedRoute navigate={navigate}><LeftoverChef navigate={navigate} /></ProtectedRoute>;

      default:
        return <NotFound navigate={navigate} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {showNavbar && <Navbar page={page} navigate={navigate} />}
      <main style={{ flex: 1 }}>
        <Suspense fallback={<LoadingSpinner fullPage />}>
          {renderPage()}
        </Suspense>
      </main>
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