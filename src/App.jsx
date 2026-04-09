import { useState, useEffect } from "react";
import "./styles/global.css";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { SubProvider } from "./context/SubContext";

import Navbar        from "./components/Navbar";
import { Footer, ProtectedRoute, LoadingSpinner } from "./components";

import Landing       from "./pages/Landing";
import { LoginPage, SignupPage } from "./pages/Login";
import Dashboard     from "./pages/Dashboard";
import MealPlanner   from "./pages/MealPlanner";
import { MyPlansPage, AccountPage, SubscriptionPage } from "./pages/OtherPages";
import Trainers      from "./pages/Trainers";
import MyBookings    from "./pages/MyBookings";
import Guidelines    from "./pages/Guidelines";
import AdminPanel    from "./pages/AdminPanel";
import TrainerPortal from "./pages/TrainerPortal";
import Referral      from "./pages/Referral";
import CalorieTracker from "./pages/CalorieTracker";
import GoalTracker   from "./pages/GoalTracker";
import LeftoverChef  from "./pages/LeftoverChef";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound      from "./pages/NotFound";

// ── PWA Install prompt ─────────────────────────────────────────────────────
function PWAInstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [show,   setShow]   = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      // Show banner only if user hasn't dismissed before
      const dismissed = localStorage.getItem("pwa_dismissed");
      if (!dismissed) setShow(true);
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
        <div style={{ fontSize: 32, flexShrink: 0 }}>🥗</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Install NourishAI</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Add to home screen for quick access</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={install}
            style={{ padding: "8px 16px", background: "#fff", color: "#166534", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Install
          </button>
          <button onClick={dismiss}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 20, cursor: "pointer", padding: 0 }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function InnerApp() {
  const { user, profile, loading, role } = useAuth();
  const [page, setPage] = useState("landing");

  useEffect(() => {
    if (!loading) {
      if (profile) {
        if (role === "trainer" && page !== "trainer-portal") {
          setPage("trainer-portal");
        } else if (role === "admin" && ["landing","login","signup"].includes(page)) {
          setPage("admin");
        } else if (role === "student" && ["landing","login","signup"].includes(page)) {
          setPage("dashboard");
        }
      }
      if (!user && !profile && [
        "dashboard","planner","my-plans","account","subscription",
        "trainers","my-bookings","referral","admin","trainer-portal",
        "calories","goals","leftover-chef",
      ].includes(page)) {
        setPage("landing");
      }
    }
  }, [user, profile, loading, role]);

  function navigate(p) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) return <LoadingSpinner fullPage message="Loading NourishAI..." />;

  if (role === "trainer" || page === "trainer-portal") {
    return <TrainerPortal navigate={navigate} />;
  }

  const showFooter  = !["login","signup","trainer-portal"].includes(page);
  const showNavbar  = !["trainer-portal"].includes(page);

  const renderPage = () => {
    switch (page) {
      case "landing":        return (user && profile) ? <Dashboard navigate={navigate} /> : <Landing navigate={navigate} />;
      case "login":          return (user && profile) ? <Dashboard navigate={navigate} /> : <LoginPage navigate={navigate} />;
      case "signup":         return (user && profile) ? <Dashboard navigate={navigate} /> : <SignupPage navigate={navigate} />;
      case "guidelines":     return <Guidelines navigate={navigate} />;
      case "privacy":        return <PrivacyPolicy navigate={navigate} />;
      case "terms":          return <TermsOfService navigate={navigate} />;
      case "trainer-portal": return <TrainerPortal navigate={navigate} />;

      case "admin":
        return <ProtectedRoute navigate={navigate}><AdminPanel navigate={navigate} /></ProtectedRoute>;
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