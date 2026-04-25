import PageLayout from "./PageLayout.jsx";

export default function ContactPage() {
  return (
    <PageLayout title="Contact Us">

      <div style={{
        background:"linear-gradient(135deg,#0e7490,#0891b2,#06b6d4)",
        borderRadius:16, padding:"18px", marginBottom:12,
        boxShadow:"0 4px 20px rgba(6,182,212,0.35)", border:"1px solid rgba(6,182,212,0.4)",
        position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 16px,rgba(255,255,255,0.03) 16px,rgba(255,255,255,0.03) 17px)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)", pointerEvents:"none" }}/>
        <div style={{ position:"relative" }}>
          <div style={{ fontSize:11, fontWeight:800, color:"#ffffff", letterSpacing:1, textTransform:"uppercase", marginBottom:10, fontFamily:"'Inter',sans-serif" }}>Get in Touch</div>
          <p style={{ margin:"0 0 14px", fontSize:12, color:"rgba(255,255,255,0.8)", lineHeight:1.6, fontFamily:"'Inter',sans-serif" }}>
            Found a stats error? Want to request a new category? Got a bug to report? We want to hear from you.
          </p>
          <a href="mailto:statstreaks@gmail.com" style={{
            display:"inline-flex", alignItems:"center", gap:8,
            background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)",
            borderRadius:10, padding:"10px 16px", textDecoration:"none",
            color:"#ffffff", fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:700,
          }}>✉️ statstreaks@gmail.com</a>
        </div>
      </div>

      {[
        { emoji:"🐛", title:"Bug Reports", body:"Something broken? Tell us what happened and what device you're on and we'll get it fixed." },
        { emoji:"📊", title:"Stats Corrections", body:"Spotted a wrong stat? Let us know the player, category and what the correct figure should be." },
        { emoji:"📂", title:"Category Requests", body:"Got an idea for a new Rush category or daily challenge theme? We're always looking for new content." },
      ].map(({ emoji, title, body }) => (
        <div key={title} style={{
          background:"#ffffff", borderRadius:16, padding:"16px 18px", marginBottom:12,
          boxShadow:"0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
          border:"1px solid #e2e8f0", display:"flex", gap:14, alignItems:"flex-start",
          position:"relative", overflow:"hidden",
        }}>
          <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 16px,rgba(0,0,0,0.01) 16px,rgba(0,0,0,0.01) 17px)", pointerEvents:"none" }}/>
          <div style={{ fontSize:26, flexShrink:0, lineHeight:1, position:"relative" }}>{emoji}</div>
          <div style={{ position:"relative" }}>
            <div style={{ fontSize:11, fontWeight:800, color:"#0f172a", letterSpacing:1, textTransform:"uppercase", marginBottom:6, fontFamily:"'Inter',sans-serif" }}>{title}</div>
            <p style={{ margin:0, fontSize:12, color:"#475569", lineHeight:1.6, fontFamily:"'Inter',sans-serif" }}>{body}</p>
          </div>
        </div>
      ))}

      <p style={{ fontSize:11, color:"rgba(255,255,255,0.25)", textAlign:"center", marginTop:8, fontFamily:"'Inter',sans-serif" }}>
        We aim to respond within 48 hours.
      </p>
    </PageLayout>
  );
}