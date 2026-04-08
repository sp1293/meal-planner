import { useState, useEffect } from "react";
import "./styles/global.css";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { SubProvider } from "./context/SubContext";

import Navbar from "./components/Navbar";
import { Footer, ProtectedRoute, LoadingSpinner } from "./components";

import Landing   from "./pages/Landing";
import { LoginPage, SignupPage } from "./pages/Login";
import Dashboard  from "./pages/Dashboard";
import MealPlanner from "./pages/MealPlanner";
import { MyPlansPage, AccountPage, SubscriptionPage } from "./pages/OtherPages";

// ─── Inner App (has access to auth context) ───────────────────────────────────
function InnerApp() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState("landing");

  // Auto-redirect after login/logout
  useEffect(() => {
    if (!loading) {
      if (user && (page === "landing" || page === "login" || page === "signup")) {
        setPage("dashboard");
      }
      if (!user && ["dashboard","planner","my-plans","account","subscription"].includes(page)) {
        setPage("landing");
      }
    }
  }, [user, loading]);

  function navigate(p) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) return <LoadingSpinner fullPage message="Loading NourishAI..." />;

  const showNavbar = page !== "landing" || user;
  const showFooter = !["login","signup"].includes(page);

  // ─── Page Map ─────────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (page) {
      case "landing":
        return user ? <Dashboard navigate={navigate} /> : <Landing navigate={navigate} />;

      case "login":
        return user ? <Dashboard navigate={navigate} /> : <LoginPage navigate={navigate} />;

      case "signup":
        return user ? <Dashboard navigate={navigate} /> : <SignupPage navigate={navigate} />;

      case "dashboard":
        return (
          <ProtectedRoute navigate={navigate}>
            <Dashboard navigate={navigate} />
          </ProtectedRoute>
        );

      case "planner":
        return (
          <ProtectedRoute navigate={navigate}>
            <MealPlanner navigate={navigate} />
          </ProtectedRoute>
        );

      case "my-plans":
        return (
          <ProtectedRoute navigate={navigate}>
            <MyPlansPage navigate={navigate} />
          </ProtectedRoute>
        );

      case "account":
        return (
          <ProtectedRoute navigate={navigate}>
            <AccountPage navigate={navigate} />
          </ProtectedRoute>
        );

      case "subscription":
        return (
          <ProtectedRoute navigate={navigate}>
            <SubscriptionPage navigate={navigate} />
          </ProtectedRoute>
        );

      default:
        return <Landing navigate={navigate} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navbar — show on all pages except pure landing when logged out */}
      <Navbar page={page} navigate={navigate} />

      {/* Page Content */}
      <main style={{ flex: 1 }}>
        {renderPage()}
      </main>

      {/* Footer */}
      {showFooter && <Footer navigate={navigate} />}
    </div>
  );
}

// ─── Root App with Providers ──────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <SubProvider>
        <InnerApp />
      </SubProvider>
    </AuthProvider>
  );
}
