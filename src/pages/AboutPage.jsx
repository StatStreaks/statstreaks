import PageLayout from "./PageLayout.jsx";

function Card({ children, dark=false }) {
  if (dark) return (
    <div style={{
      background:"linear-gradient(135deg,#15803d,#16a34a,#22c55e)",
      borderRadius:16, padding:"18px", marginBottom:12,
      boxShadow:"0 4px 20px rgba(22,163,74,0.35)", border:"1px solid rgba(22,163,74,0.4)",
      position:"relative", overflow:"hidden",
    }}>
      <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 16px,rgba(255,255,255,0.03) 16px,rgba(255,255,255,0.03) 17px)", pointerEvents:"none" }}/>
      <div style={{ position:"relative" }}>{children}</div>
    </div>
  );
  return (
    <div style={{
      background:"#ffffff", borderRadius:16, padding:"18px", marginBottom:12,
      boxShadow:"0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
      border:"1px solid #e2e8f0", position:"relative", overflow:"hidden",
    }}>
      <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 16px,rgba(0,0,0,0.01) 16px,rgba(0,0,0,0.01) 17px)", pointerEvents:"none" }}/>
      <div style={{ position:"relative" }}>{children}</div>
    </div>
  );
}

const items = [
  { title:"What is StatStreaks?", body:"A daily football higher-or-lower guessing game built around one simple question: is this player's stat higher or lower than the last? Whether it's Premier League goals, international caps, or club appearances — if you know your football, you'll love it." },
  { title:"Daily Mode", body:"Every day brings a new themed challenge with 11 player cards. Guess correctly to build your Career Caps streak. Two wrong answers and you're out — come back tomorrow to keep it going." },
  { title:"Rush Mode", body:"30 seconds. As many correct answers as you can. Multiple categories to compete across — Premier League goals, international caps, club appearances and more. Score big enough and you'll top the global leaderboard." },
  { title:"Who made it?", body:"StatStreaks was built by a football fan, for football fans. It's completely free to play. If you enjoy it, tell a mate — that's all the support we need." },
];

export default function AboutPage() {
  return (
    <PageLayout title="About" description="StatStreaks is a free daily football higher or lower stats game — find out what it is, how it works, and who built it." canonical="/about">
      {items.map(({ title, body }) => (
        <Card key={title}>
          <div style={{ fontSize:11, fontWeight:800, color:"#0f172a", letterSpacing:1, textTransform:"uppercase", marginBottom:10, fontFamily:"'Inter',sans-serif" }}>{title}</div>
          <p style={{ margin:0, fontSize:12, color:"#475569", lineHeight:1.6, fontFamily:"'Inter',sans-serif" }}>{body}</p>
        </Card>
      ))}
      <Card dark>
        <div style={{ fontSize:11, fontWeight:800, color:"#ffffff", letterSpacing:1, textTransform:"uppercase", marginBottom:10, fontFamily:"'Inter',sans-serif" }}>Ready To Play?</div>
        <p style={{ margin:"0 0 14px", fontSize:12, color:"rgba(255,255,255,0.85)", lineHeight:1.6, fontFamily:"'Inter',sans-serif" }}>Today's challenge is waiting. How many can you get right?</p>
        <a href="/" style={{
          display:"inline-flex", alignItems:"center", gap:8,
          background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)",
          borderRadius:10, padding:"10px 16px", textDecoration:"none",
          color:"#ffffff", fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:700,
        }}>▶ Play Now</a>
      </Card>
    </PageLayout>
  );
}