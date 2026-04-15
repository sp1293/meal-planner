export default function UpgradeModal({ feature, onClose, navigate }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:"var(--radius-lg)", padding:32, maxWidth:420, width:"100%", textAlign:"center", animation:"scaleIn 0.25s ease" }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🔒</div>
        <h2 style={{ fontFamily:"var(--font-display)", fontSize:22, color:"var(--primary-dark)", marginBottom:8 }}>
          Pro Feature
        </h2>
        <p style={{ fontSize:15, color:"var(--text-3)", lineHeight:1.7, marginBottom:8 }}>
          <strong>{feature}</strong> is available on Starter and above.
        </p>
        <p style={{ fontSize:13, color:"var(--text-4)", marginBottom:24 }}>
          Upgrade your plan to unlock unlimited meal plans, shopping lists, nutrition analysis, and more.
        </p>
        <div style={{ background:"var(--primary-pale)", border:"1px solid var(--primary-soft)", borderRadius:"var(--radius-md)", padding:"16px 20px", marginBottom:24, textAlign:"left" }}>
          <div style={{ fontSize:13, fontWeight:700, color:"var(--primary-dark)", marginBottom:10 }}>What you'll unlock:</div>
          {["✓ Unlimited AI meal plans","✓ Smart shopping lists","✓ Full nutrition analysis","✓ All 4 age groups","✓ Family profiles"].map(f=>(
            <div key={f} style={{ fontSize:13, color:"var(--primary-dark)", marginBottom:4 }}>{f}</div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn btn-primary" style={{ flex:1 }}
            onClick={() => { onClose(); navigate("subscription"); }}>
            🚀 Upgrade Now
          </button>
          <button className="btn btn-ghost" style={{ flex:1 }} onClick={onClose}>
            Maybe later
          </button>
        </div>
        <p style={{ fontSize:11, color:"var(--text-4)", marginTop:12 }}>Starting at just ₹299/month</p>
      </div>
    </div>
  );
}