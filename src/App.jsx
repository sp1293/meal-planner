import { useState, useEffect, useRef } from "react";
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

const PUBLIC_PAGES    = new Set(["landing","login","signup","guidelines","privacy","terms"]);
const PROTECTED_PAGES = new Set(["dashboard","planner","my-plans","account","subscription","trainers","my-bookings","referral","admin","trainer-portal","calories","goals","leftover-chef"]);

function InnerApp() {
  const { user, profile, loading, role } = useAuth();
  const [page, setPage] = useState("landing");
  const renderCount = useRef(0);

  // ── DEBUG: log every render ──────────────────────────────────────────────
  renderCount.current += 1;
  console.log(`[APP render #${renderCount.current}] page="${page}" user=${!!user} profile=${!!profile} loading=${loading} role="${role}"`);

  function navigate(p) {
    console.log(`[NAVIGATE] "${page}" → "${p}"`);
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    console.log(`[EFFECT] fired. loading=${loading} user=${!!user} page="${page}"`);
    if (loading) return;

    if (user) {
      setPage(prev => {
        if (!PUBLIC_PAGES.has(prev)) {
          console.log(`[EFFECT] user logged in, page="${prev}" is protected — staying`);
          return prev;
        }
        const next = role === "trainer" ? "trainer-portal" : role === "admin" ? "admin" : "dashboard";
        console.log(`[EFFECT] user logged in, redirecting from "${prev}" → "${next}"`);
        return next;
      });
    } else {
      setPage(prev => {
        if (PROTECTED_PAGES.has(prev)) {
          console.log(`[EFFECT] no user, redirecting from "${prev}" → "landing"`);
          return "landing";
        }
        console.log(`[EFFECT] no user, page="${prev}" is public — staying`);
        return prev;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  if (loading) return <LoadingSpinner fullPage message="Loading Mitabhukta..." />;

  if (user && role === "trainer") return <TrainerPortal navigate={navigate} />;

  const showNavbar = page !== "trainer-portal";
  const showFooter = !["login","signup","trainer-portal"].includes(page);

  function renderPage() {
    if (user && PUBLIC_PAGES.has(page)) {
      console.log(`[RENDER] user on public page "${page}" — showing Dashboard`);
      return <Dashboard navigate={navigate} />;
    }
    if (!user && PROTECTED_PAGES.has(page)) {
      console.log(`[RENDER] no user on protected page "${page}" — showing Landing`);
      return <Landing navigate={navigate} />;
    }
    switch (page) {
      case "landing":        return <Landing navigate={navigate} />;
      case "login":          return <LoginPage navigate={navigate} />;
      case "signup":         return <SignupPage navigate={navigate} />;
      case "guidelines":     return <Guidelines navigate={navigate} />;
      case "privacy":        return <PrivacyPolicy navigate={navigate} />;
      case "terms":          return <TermsOfService navigate={navigate} />;
      case "trainer-portal": return <TrainerPortal navigate={navigate} />;
      case "admin":          return role !== "admin" ? <Dashboard navigate={navigate} /> : <AdminPanel navigate={navigate} />;
      case "dashboard":      return <Dashboard navigate={navigate} />;
      case "planner":        return <MealPlanner navigate={navigate} />;
      case "my-plans":       return <MyPlansPage navigate={navigate} />;
      case "account":        return <AccountPage navigate={navigate} />;
      case "subscription":   return <SubscriptionPage navigate={navigate} />;
      case "trainers":       return <Trainers navigate={navigate} />;
      case "my-bookings":    return <MyBookings navigate={navigate} />;
      case "referral":       return <Referral navigate={navigate} />;
      case "calories":       return <CalorieTracker navigate={navigate} />;
      case "goals":          return <GoalTracker navigate={navigate} />;
      case "leftover-chef":  return <LeftoverChef navigate={navigate} />;
      default:               return <NotFound navigate={navigate} />;
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