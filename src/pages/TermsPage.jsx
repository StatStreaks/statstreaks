import PageLayout from "./PageLayout.jsx";

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

function Section({ title, items }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16, padding: "24px", marginBottom: 16,
    }}>
      <h2 style={{ fontSize: 13, fontWeight: 800, color: "#f43f5e", letterSpacing: 2, textTransform: "uppercase", margin: "0 0 16px" }}>{title}</h2>
      {items.map((text, i) => (
        <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
          <div style={{
            width: 20, height: 20, borderRadius: 5, background: "rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 800, flexShrink: 0, marginTop: 1,
          }}>{i + 1}</div>
          <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>{text}</p>
        </div>
      ))}
    </div>
  );
}

export default function TermsPage() {
  return (
    <PageLayout>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, color: "#f43f5e", letterSpacing: 3, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Legal</div>
        <h1 style={{ fontSize: 42, fontWeight: 900, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2, margin: 0, lineHeight: 1 }}>
          TERMS & PRIVACY
        </h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, lineHeight: 1.7, marginTop: 16 }}>
          Last updated April 2026. By using StatStreaks you agree to these terms.
        </p>
      </div>

      <Section title="Terms of Use" items={TERMS} />
      <Section title="Privacy & Your Data" items={PRIVACY} />

      <div style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: "24px", marginBottom: 16,
      }}>
        <h2 style={{ fontSize: 13, fontWeight: 800, color: "#f43f5e", letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px" }}>Questions?</h2>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
          If you have any questions about these terms or your data, get in touch.
        </p>
        <a href="mailto:statstreaks@gmail.com" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10, padding: "10px 16px", textDecoration: "none",
          color: "#ffffff", fontSize: 13, fontWeight: 700,
        }}>✉️ statstreaks@gmail.com</a>
      </div>
    </PageLayout>
  );
}
