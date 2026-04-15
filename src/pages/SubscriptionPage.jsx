import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useSub } from "../context/SubContext";
import { TIERS } from "../config";
import { PricingCard } from "../components";

const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_SdZk5BUyxiup3p";
const API = process.env.REACT_APP_API_URL?.replace("/api/meal-plan", "")
  || "https://meal-planner-backend-0ul2.onrender.com";

// ── Load Razorpay script ───────────────────────────────────────────────────
function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function SubscriptionPage({ navigate }) {
  const { profile, user, updateUserProfile } = useAuth();
  const { tier, plan } = useSub();
  const [loading,   setLoading]   = useState(false);
  const [msg,       setMsg]       = useState("");
  const [msgType,   setMsgType]   = useState("success"); // success | error

  function showMsg(text, type = "success") {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(""), 5000);
  }

  // ── Handle plan selection ────────────────────────────────────────────────
  async function handleSelectPlan(tierKey) {
    if (tierKey === tier) return;
    if (tierKey === "free") {
      // Downgrade to free — no payment needed
      try {
        await updateUserProfile({ tier: "free", plansUsed: 0 });
        showMsg("✅ Downgraded to Free plan.");
      } catch {
        showMsg("❌ Failed to update plan.", "error");
      }
      return;
    }

    setLoading(true); setMsg("");

    try {
      // Step 1 — Load Razorpay script
      const loaded = await loadRazorpay();
      if (!loaded) {
        showMsg("❌ Failed to load payment gateway. Please try again.", "error");
        setLoading(false);
        return;
      }

      // Step 2 — Create order on backend
      const orderRes = await fetch(`${API}/api/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tierKey,
          userId: user.uid,
          email:  user.email,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.orderId) {
        showMsg("❌ Failed to create order. Please try again.", "error");
        setLoading(false);
        return;
      }

      // Step 3 — Open Razorpay checkout
      const selectedTier = TIERS[tierKey];
      const options = {
        key:         RAZORPAY_KEY,
        amount:      orderData.amount,
        currency:    "INR",
        name:        "Mitabhukta",
        description: `${selectedTier.name} Plan — Monthly`,
        image:       "/logo192.png",
        order_id:    orderData.orderId,
        prefill: {
          name:  profile?.displayName || "",
          email: user.email || "",
        },
        theme: { color: "#166534" },
        modal: {
          ondismiss: () => {
            setLoading(false);
            showMsg("Payment cancelled.", "error");
          },
        },
        handler: async (response) => {
          // Step 4 — Verify payment on backend
          try {
            const verifyRes = await fetch(`${API}/api/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                tierKey,
                userId: user.uid,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              await updateUserProfile({ tier: tierKey, plansUsed: 0 });
              showMsg(`🎉 Successfully upgraded to ${selectedTier.name} plan!`);
            } else {
              showMsg("❌ Payment verification failed. Contact support.", "error");
            }
          } catch {
            showMsg("❌ Payment verification error. Contact support@mitabhukta.com", "error");
          } finally {
            setLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        showMsg("❌ Payment failed. Please try again.", "error");
        setLoading(false);
      });
      rzp.open();

    } catch (err) {
      console.error("Payment error:", err);
      showMsg("❌ Something went wrong. Please try again.", "error");
      setLoading(false);
    }
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-title anim-fade-up">
        <h1>💳 Manage Subscription</h1>
        <p>Choose the plan that works best for you and your family</p>
      </div>

      {/* Message banner */}
      {msg && (
        <div className={`banner ${msgType === "success" ? "banner-success" : "banner-error"} mb-24`}>
          {msg}
        </div>
      )}

      {/* Current plan summary */}
      <div className="card anim-fade-up-2" style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--text-3)", marginBottom: 4 }}>
              Current Plan
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: plan.color }}>
                {plan.name}
              </span>
              <span style={{ fontSize: 16, color: "var(--text-3)" }}>{plan.priceLabel}{plan.period}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 14 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 24, color: "var(--primary-dark)" }}>{profile?.plansUsed || 0}</div>
              <div style={{ color: "var(--text-3)", fontSize: 12 }}>Plans used</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 24, color: "var(--primary-dark)" }}>{plan.planDays}</div>
              <div style={{ color: "var(--text-3)", fontSize: 12 }}>Days/plan</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 24, color: "var(--primary-dark)" }}>
                {plan.plansPerMonth >= 999 ? "∞" : plan.plansPerMonth}
              </div>
              <div style={{ color: "var(--text-3)", fontSize: 12 }}>Plans/month</div>
            </div>
          </div>
        </div>
      </div>

      {/* Test mode notice */}
      {RAZORPAY_KEY.startsWith("rzp_test_") && (
        <div className="banner mb-24" style={{ background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e" }}>
          🧪 <strong>Test Mode Active</strong> — Use test card: <code>4111 1111 1111 1111</code>, any future expiry, any CVV.
        </div>
      )}

      {/* Pricing grid */}
      <div className="grid-4 anim-fade-up-3" style={{ alignItems: "start", marginBottom: 32 }}>
        {Object.keys(TIERS).map(key => (
          <div key={key} style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.2s" }}>
            <PricingCard
              tierKey={key}
              currentTier={tier}
              onSelect={loading ? undefined : handleSelectPlan}
            />
          </div>
        ))}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div style={{ textAlign: "center", padding: "16px", marginBottom: 24 }}>
          <span className="spin" style={{ fontSize: 24 }}>⟳</span>
          <p style={{ fontSize: 14, color: "var(--text-3)", marginTop: 8 }}>Processing payment...</p>
        </div>
      )}

      {/* Feature comparison table */}
      <div className="card anim-fade-up-4">
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)", marginBottom: 20 }}>
          Compare All Features
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ minWidth: 600 }}>
            <thead>
              <tr>
                <th style={{ width: "35%" }}>Feature</th>
                {Object.values(TIERS).map(t => (
                  <th key={t.id} style={{ color: t.color }}>{t.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Plan Length",        t => `${t.planDays} days`],
                ["Plans / Month",      t => t.plansPerMonth >= 999 ? "Unlimited" : t.plansPerMonth],
                ["Shopping List",      t => t.shoppingList ? "✅" : "—"],
                ["Nutrition Analysis", t => t.nutritionAnalysis ? "✅" : "—"],
                ["Family Profiles",    t => t.familyProfiles === 1 ? "1" : `Up to ${t.familyProfiles}`],
                ["Kids Age Group",     t => t.ageGroups.includes("kids") ? "✅" : "—"],
                ["Seniors Age Group",  t => t.ageGroups.includes("seniors") ? "✅" : "—"],
                ["Price",              t => `${t.priceLabel}${t.period}`],
              ].map(([label, fn]) => (
                <tr key={label}>
                  <td style={{ fontWeight: 500 }}>{label}</td>
                  {Object.values(TIERS).map(t => <td key={t.id}>{fn(t)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 20, padding: 16, background: "var(--primary-pale)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--primary-dark)" }}>
          🔒 Payments are secured by Razorpay. Your card details are never stored on our servers.
          Cancel anytime from Account Settings.
        </div>
      </div>
    </div>
  );
}
