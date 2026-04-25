import PageLayout from "./PageLayout.jsx";

function Card({ children }) {
  return (
    <div style={{
      background:"#ffffff", borderRadius:16, padding:"18px",
      marginBottom:12, boxShadow:"0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
      border:"1px solid #e2e8f0", position:"relative", overflow:"hidden",
    }}>
      <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 16px,rgba(0,0,0,0.01) 16px,rgba(0,0,0,0.01) 17px)", pointerEvents:"none" }}/>
      <div style={{ position:"relative" }}>{children}</div>
    </div>
  );
}

function StepRow({ num, text }) {
  return (
    <div style={{ display:"flex", gap:10, marginBottom:10, alignItems:"flex-start" }}>
      <div style={{ width:20, height:20, borderRadius:5, background:"#0f172a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#ffffff", fontWeight:800, flexShrink:0, marginTop:1, fontFamily:"'Inter',sans-serif" }}>{num}</div>
      <p style={{ margin:0, fontSize:12, color:"#475569", lineHeight:1.6, fontFamily:"'Inter',sans-serif" }}>{text}</p>
    </div>
  );
}

export default function HowToPlayPage() {
  return (
    <PageLayout title="How To Play" description="Learn how to play StatStreaks — the free daily football higher or lower game. Daily mode, Rush mode, Career Caps and more explained." canonical="/how-to-play">

      <Card>
        <div style={{ fontSize:11, fontWeight:800, color:"#0f172a", letterSpacing:1, textTransform:"uppercase", marginBottom:12, fontFamily:"'Inter',sans-serif" }}>📅 Daily Mode</div>
        <StepRow num={1} text='Each day a new challenge drops — a theme like "Premier League Goals · Spanish Legends" with 11 player cards.' />
        <StepRow num={2} text="You're shown a player and their stat. The next player is revealed — tap Higher or Lower to guess." />
        <StepRow num={3} text="Get it wrong once and you receive a yellow card warning. You can still complete the challenge." />
        <StepRow num={4} text="Get it wrong a second time and it's a red card — game over. Come back tomorrow for a new challenge." />
        <StepRow num={5} text="Complete without a red card and you earn a Career Cap. Build your streak to climb the status tiers." />
      </Card>

      <Card>
        <div style={{ fontSize:11, fontWeight:800, color:"#0f172a", letterSpacing:1, textTransform:"uppercase", marginBottom:12, fontFamily:"'Inter',sans-serif" }}>⚡ Rush Mode</div>
        <StepRow num={1} text="Choose a category — Premier League goals, international caps, club appearances and more." />
        <StepRow num={2} text="You have 30 seconds. Answer as many higher-or-lower questions as you can." />
        <StepRow num={3} text="Get one wrong and you lose possession — you can keep going but the perfect run bonus is gone." />
        <StepRow num={4} text="Get two wrong and the session ends immediately." />
        <StepRow num={5} text="Finish a perfect run with no mistakes and your score doubles. Your best scores go on the global leaderboard — weekly and all-time." />
      </Card>

      <Card>
        <div style={{ fontSize:11, fontWeight:800, color:"#0f172a", letterSpacing:1, textTransform:"uppercase", marginBottom:12, fontFamily:"'Inter',sans-serif" }}>🧢 Career Caps</div>
        <StepRow num={1} text="Play the daily challenge every day to earn caps. Each successful completion adds one to your tally." />
        <StepRow num={2} text="Caps unlock status tiers from Academy Prospect all the way up to Hall of Fame." />
        <StepRow num={3} text="Your peak caps are tracked separately — even if your streak resets, your best is always remembered." />
      </Card>

      <Card>
        <div style={{ fontSize:11, fontWeight:800, color:"#0f172a", letterSpacing:1, textTransform:"uppercase", marginBottom:12, fontFamily:"'Inter',sans-serif" }}>💡 Tips</div>
        {[
          "In Rush Mode a perfect run doubles your score — if you're on a clean run near the end, play it safe.",
          "Rush categories have separate weekly and all-time leaderboards — you can top this week even if someone has a higher all-time score.",
          "Stats are all-time career figures unless the challenge theme says otherwise.",
        ].map((tip, i) => (
          <div key={i} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"flex-start" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#16a34a", flexShrink:0, marginTop:6 }} />
            <p style={{ margin:0, fontSize:12, color:"#475569", lineHeight:1.6, fontFamily:"'Inter',sans-serif" }}>{tip}</p>
          </div>
        ))}
      </Card>

      <div style={{ textAlign:"center", marginTop:8 }}>
        <a href="/" style={{
          display:"inline-block",
          background:"linear-gradient(135deg,#15803d,#16a34a,#22c55e)",
          color:"#ffffff", fontWeight:800, fontSize:15, padding:"13px 36px",
          borderRadius:12, textDecoration:"none", fontFamily:"'Inter',sans-serif",
          boxShadow:"0 4px 16px rgba(22,163,74,0.35)",
        }}>▶ Play Now</a>
      </div>

    </PageLayout>
  );
}