import PageLayout from "./PageLayout.jsx";

function Section({ title, items }) {
  return (
    <div style={{
      background:"#ffffff", borderRadius:16, padding:"18px", marginBottom:12,
      boxShadow:"0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
      border:"1px solid #e2e8f0", position:"relative", overflow:"hidden",
    }}>
      <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 16px,rgba(0,0,0,0.01) 16px,rgba(0,0,0,0.01) 17px)", pointerEvents:"none" }}/>
      <div style={{ position:"relative" }}>
        <div style={{ fontSize:11, fontWeight:800, color:"#0f172a", letterSpacing:1, textTransform:"uppercase", marginBottom:12, fontFamily:"'Inter',sans-serif" }}>{title}</div>
        {items.map((text, i) => (
          <div key={i} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"flex-start" }}>
            <div style={{ width:18, height:18, borderRadius:4, background:"#0f172a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#ffffff", fontWeight:800, flexShrink:0, marginTop:1, fontFamily:"'Inter',sans-serif" }}>{i+1}</div>
            <p style={{ margin:0, fontSize:12, color:"#475569", lineHeight:1.6, fontFamily:"'Inter',sans-serif" }}>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const TERMS = [
  "StatStreaks is a free-to-play football trivia game. By using the app you agree to these terms.",
  "All statistics are sourced from publicly available records and are provided for entertainment purposes only. We do our best to keep them accurate but cannot guarantee every figure is correct. If you spot an error, please let us know.",
  "StatStreaks is not affiliated with, endorsed by, or connected to any football club, league, governing body, or player.",
  "The app contains advertisements served by Google AdSense. These may be personalised based on your device settings and Google's own policies. StatStreaks is not responsible for the content of third-party ads.",
  "StatStreaks, including its name, logo, game format, design, and content, is the intellectual property of its creator. You may not copy, reproduce, resell, or create derivative works based on this game without explicit written permission.",
  "We reserve the right to update these terms at any time. Continued use of the app after changes are posted means you accept the updated terms.",
];

const PRIVACY = [
  "The only information we store is your chosen display name, your game scores, and an anonymous device ID generated on your device. None of this is linked to your real identity.",
  "This data is stored on secure servers (Supabase) and is used solely to power the leaderboards. It is never sold or shared with third parties for marketing purposes.",
  "We do not collect your email address, phone number, location, or any other personal information.",
  "Google AdSense, our ad provider, may collect data about your device and ad interactions in accordance with Google's Privacy Policy (policies.google.com). You can manage ad personalisation in your device settings.",
  "You have the right to request deletion of your data at any time. Email us at statstreaks@gmail.com and we will remove your records within 30 days.",
  "By using StatStreaks you acknowledge that your display name and scores may be visible to other players on the leaderboard.",
];

export default function TermsPage() {
  return (
    <PageLayout title="Terms & Privacy" description="StatStreaks terms of use and privacy policy. Find out how we handle your data and what you agree to by playing." canonical="/terms">
      <Section title="Terms of Use" items={TERMS} />
      <Section title="Privacy & Your Data" items={PRIVACY} />
      <div style={{
        background:"linear-gradient(135deg,#0e7490,#0891b2,#06b6d4)",
        borderRadius:16, padding:"18px", marginBottom:12,
        boxShadow:"0 4px 20px rgba(6,182,212,0.35)", border:"1px solid rgba(6,182,212,0.4)",
        position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 16px,rgba(255,255,255,0.03) 16px,rgba(255,255,255,0.03) 17px)", pointerEvents:"none" }}/>
        <div style={{ position:"relative" }}>
          <div style={{ fontSize:11, fontWeight:800, color:"#ffffff", letterSpacing:1, textTransform:"uppercase", marginBottom:10, fontFamily:"'Inter',sans-serif" }}>Questions?</div>
          <p style={{ margin:"0 0 14px", fontSize:12, color:"rgba(255,255,255,0.8)", lineHeight:1.6, fontFamily:"'Inter',sans-serif" }}>If you have any questions about these terms or your data, get in touch.</p>
          <a href="mailto:statstreaks@gmail.com" style={{
            display:"inline-flex", alignItems:"center", gap:8,
            background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)",
            borderRadius:10, padding:"10px 16px", textDecoration:"none",
            color:"#ffffff", fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:700,
          }}>✉️ statstreaks@gmail.com</a>
        </div>
      </div>
    </PageLayout>
  );
}