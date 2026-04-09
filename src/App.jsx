import { useState, useEffect } from "react";
import "./styles/global.css";

import CalorieTracker from "./pages/CalorieTracker";
import GoalTracker    from "./pages/GoalTracker";

import LeftoverChef from "./pages/LeftoverChef";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { SubProvider } from "./context/SubContext";

import Navbar         from "./components/Navbar";
import { Footer, ProtectedRoute, LoadingSpinner } from "./components";

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

function InnerApp() {
  const { user, profile, loading, role } = useAuth();
  const [page, setPage] = useState("landing");

  useEffect(() => {
    if (!loading) {
      // Role-based redirect after login
      if (profile) {
        if (role === "trainer" && !["trainer-portal"].includes(page)) {
          setPage("trainer-portal");
        } else if (role === "admin" && ["landing","login","signup"].includes(page)) {
          setPage("admin");
        } else if (role === "student" && ["landing","login","signup"].includes(page)) {
          setPage("dashboard");
        }
      }
      // Redirect to landing if not logged in and trying to access protected pages
      if (!user && !profile && ["dashboard","planner","my-plans","account","subscription","trainers","my-bookings","referral","admin","trainer-portal"].includes(page)) {
        setPage("landing");
      }
    }
  }, [user, profile, loading, role]);

  function navigate(p) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) return <LoadingSpinner fullPage message="Loading NourishAI..." />;

  // Trainer gets their own portal — no main navbar/footer
  if (role === "trainer" || page === "trainer-portal") {
    return <TrainerPortal navigate={navigate} />;
  }

  const showFooter = !["login","signup","trainer-portal"].includes(page);

  const renderPage = () => {
    switch (page) {
      case "landing":       return (user && profile) ? <Dashboard navigate={navigate} /> : <Landing navigate={navigate} />;
      case "login":         return (user && profile) ? <Dashboard navigate={navigate} /> : <LoginPage navigate={navigate} />;
      case "signup":        return (user && profile) ? <Dashboard navigate={navigate} /> : <SignupPage navigate={navigate} />;
      case "guidelines":    return <Guidelines navigate={navigate} />;
      case "trainer-portal":return <TrainerPortal navigate={navigate} />;

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
        return <Landing navigate={navigate} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar page={page} navigate={navigate} />
      <main style={{ flex: 1 }}>{renderPage()}</main>
      {showFooter && <Footer navigate={navigate} />}
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
