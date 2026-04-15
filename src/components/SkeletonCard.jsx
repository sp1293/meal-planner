export function SkeletonCard({ height = 80 }) {
  return (
    <div className="skeleton" style={{ height, borderRadius:"var(--radius-md)", marginBottom:12 }} />
  );
}

export function SkeletonGrid({ count = 4, height = 120 }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16 }}>
      {Array.from({ length:count }).map((_,i) => (
        <div key={i} className="skeleton" style={{ height, borderRadius:"var(--radius-md)" }} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {Array.from({ length:count }).map((_,i) => (
        <div key={i} style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:20, display:"flex", gap:14, alignItems:"center" }}>
          <div className="skeleton" style={{ width:48, height:48, borderRadius:"50%", flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div className="skeleton" style={{ height:14, borderRadius:4, marginBottom:8, width:"60%" }} />
            <div className="skeleton" style={{ height:12, borderRadius:4, width:"40%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div style={{ padding:"24px" }}>
      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:20 }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="skeleton" style={{ height:90, borderRadius:"var(--radius-md)" }} />
        ))}
      </div>
      {/* Content */}
      <div className="skeleton" style={{ height:20, borderRadius:4, width:"30%", marginBottom:16 }} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, marginBottom:20 }}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="skeleton" style={{ height:80, borderRadius:"var(--radius-md)" }} />
        ))}
      </div>
      <div className="skeleton" style={{ height:20, borderRadius:4, width:"25%", marginBottom:12 }} />
      <SkeletonList count={2} />
    </div>
  );
}