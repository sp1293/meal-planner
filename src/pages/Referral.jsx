import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const REWARDS = [
  { referrals: 1, reward: "7 extra days on your plan",   icon: "🎁" },
  { referrals: 3, reward: "1 extra meal plan credit",    icon: "🍛" },
  { referrals: 5, reward: "Free Starter plan for 1 month", icon: "⭐" },
  { referrals: 10, reward: "Free Pro plan for 1 month",   icon: "🏆" },
];

export default function Referral({ navigate }) {
  const { profile, user } = useAuth();
  const [copied,   setCopied]   = useState(false);
  const [referrals, setReferrals] = useState(profile?.referrals || []);

  // Generate unique referral code based on uid
  const referralCode = `NOURISH-${(user?.uid || "").slice(0, 6).toUpperCase()}`;
  const referralLink = `https://mitabhukta.com/?ref=${referralCode}`;

  const totalReferrals = referrals.length;
  const nextMilestone  = REWARDS.find(r => r.referrals > totalReferrals) || REWARDS[REWARDS.length - 1];
  const progressPct    = Math.min(100, (totalReferrals / nextMilestone.referrals) * 100);

  function copyLink() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function shareWhatsApp() {
    const msg = `🥗 Hey! I've been using Mitabhukta for personalized Indian meal plans and it's amazing!\n\nGet your first AI-powered meal plan free: ${referralLink}\n\nUse my referral code: *${referralCode}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function shareGeneral() {
    if (navigator.share) {
      navigator.share({ title: "Mitabhukta - AI Meal Planner", text: `Join me on Mitabhukta! Use my referral code ${referralCode} to get started.`, url: referralLink });
    } else {
      copyLink();
    }
  }

  return (
    <div className="page-md" style={{ margin: "0 auto", padding: "48px 24px" }}>
      <div className="page-title anim-fade-up">
        <h1>🎁 Refer & Earn</h1>
        <p>Invite friends to Mitabhukta and earn free plan extensions and meal plan credits</p>
      </div>

      {/* Your referral link */}
      <div className="card anim-fade-up-2" style={{ marginBottom: 24, background: "linear-gradient(135deg, #14532d, #166534)", color: "#fff", border: "none" }}>
        <div style={{ textAlign: "center", padding: "8px 0 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎁</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "#fff", marginBottom: 8 }}>Your Referral Code</h2>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "var(--radius-md)", padding: "14px 24px", display: "inline-block", marginBottom: 16 }}>
            <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 700, letterSpacing: 4, color: "#4ade80" }}>{referralCode}</div>
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 20 }}>Share this code or link with friends</div>

          {/* Referral link */}
          <div style={{ display: "flex", gap: 8, background: "rgba(255,255,255,0.1)", borderRadius: "var(--radius-sm)", padding: 10, marginBottom: 16, alignItems: "center" }}>
            <span style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>{referralLink}</span>
            <button onClick={copyLink}
              style={{ padding: "7px 16px", background: copied ? "#4ade80" : "#fff", color: copied ? "#14532d" : "var(--primary-dark)", border: "none", borderRadius: "var(--radius-xs)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", flexShrink: 0, transition: "all 0.2s" }}>
              {copied ? "✅ Copied!" : "Copy Link"}
            </button>
          </div>

          {/* Share buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={shareWhatsApp}
              style={{ padding: "11px 24px", background: "#25D366", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 8 }}>
              📱 Share on WhatsApp
            </button>
            <button onClick={shareGeneral}
              style={{ padding: "11px 24px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              📤 Share
            </button>
          </div>
        </div>
      </div>

      {/* Progress to next reward */}
      <div className="card anim-fade-up-3" style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)", marginBottom: 16 }}>📊 Your Progress</h3>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
          <span style={{ color: "var(--text-3)" }}>Total referrals</span>
          <span style={{ fontWeight: 700, color: "var(--primary-dark)" }}>{totalReferrals}</span>
        </div>
        <div style={{ height: 10, background: "var(--border)", borderRadius: "var(--radius-full)", overflow: "hidden", marginBottom: 10 }}>
          <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--primary)", borderRadius: "var(--radius-full)", transition: "width 0.8s ease" }} />
        </div>
        <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 20 }}>
          {totalReferrals >= nextMilestone.referrals
            ? `🎉 You've unlocked: ${nextMilestone.reward}!`
            : `${nextMilestone.referrals - totalReferrals} more referral${nextMilestone.referrals - totalReferrals !== 1 ? "s" : ""} to unlock: ${nextMilestone.icon} ${nextMilestone.reward}`}
        </div>

        {/* Stats */}
        <div className="grid-2">
          <div className="stat-card">
            <div className="label">Friends Referred</div>
            <div className="value">{totalReferrals}</div>
            <div className="sub">joined Mitabhukta</div>
          </div>
          <div className="stat-card" style={{ background: "#f0fdf4" }}>
            <div className="label">Rewards Earned</div>
            <div className="value">{REWARDS.filter(r => r.referrals <= totalReferrals).length}</div>
            <div className="sub">milestones unlocked</div>
          </div>
        </div>
      </div>

      {/* Rewards tiers */}
      <div className="card anim-fade-up-4" style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)", marginBottom: 20 }}>🏆 Reward Milestones</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {REWARDS.map((r, i) => {
            const unlocked = totalReferrals >= r.referrals;
            return (
              <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", padding: "14px 16px", background: unlocked ? "var(--primary-pale)" : "var(--bg-muted)", borderRadius: "var(--radius-md)", border: `1.5px solid ${unlocked ? "var(--primary-soft)" : "var(--border)"}` }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: unlocked ? "var(--primary)" : "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {unlocked ? "✅" : r.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: unlocked ? "var(--primary-dark)" : "var(--text)", marginBottom: 2 }}>
                    {r.referrals} {r.referrals === 1 ? "referral" : "referrals"} — {r.reward}
                  </div>
                  <div style={{ fontSize: 12, color: unlocked ? "var(--primary)" : "var(--text-4)" }}>
                    {unlocked ? "🎉 Unlocked!" : `${Math.max(0, r.referrals - totalReferrals)} more to go`}
                  </div>
                </div>
                {unlocked && <span style={{ fontSize: 11, background: "var(--primary)", color: "#fff", padding: "4px 12px", borderRadius: "var(--radius-full)", fontWeight: 700 }}>Claimed</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* How it works */}
      <div className="card anim-fade-up-4">
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--primary-dark)", marginBottom: 16 }}>How It Works</h3>
        {[
          { step: "1", title: "Share your link", desc: "Send your unique referral link or code to friends and family." },
          { step: "2", title: "Friend signs up", desc: "Your friend creates a Mitabhukta account using your referral link." },
          { step: "3", title: "Both get rewarded", desc: "Your friend gets their first plan free. You unlock milestone rewards!" },
          { step: "4", title: "Keep earning", desc: "The more friends you refer, the bigger the rewards. No limit!" },
        ].map(item => (
          <div key={item.step} style={{ display: "flex", gap: 16, padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{item.step}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-3)" }}>{item.desc}</div>
            </div>
          </div>
        ))}
        <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 16 }}>* Rewards are applied automatically to your account. Free plan extensions are added on top of your current plan.</p>
      </div>
    </div>
  );
}
