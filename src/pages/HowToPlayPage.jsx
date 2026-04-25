import PageLayout from "./PageLayout.jsx";

export default function HowToPlayPage() {
  return (
    <PageLayout>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, color: "#f43f5e", letterSpacing: 3, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Guide</div>
        <h1 style={{ fontSize: 42, fontWeight: 900, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2, margin: 0, lineHeight: 1 }}>
          HOW TO PLAY
        </h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, lineHeight: 1.7, marginTop: 16 }}>
          StatStreaks is a football higher-or-lower guessing game. Two modes, one goal — prove you know your stats.
        </p>
      </div>

      {/* Daily Mode */}
      <div style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: "24px", marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>📅</span>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>DAILY MODE</h2>
        </div>
        {[
          { step: "1", text: "Each day a new challenge drops — a theme like \"Premier League Goals · Spanish Legends\" with 11 player cards." },
          { step: "2", text: "You're shown a player and their stat. The next player is revealed — tap Higher or Lower to guess their stat." },
          { step: "3", text: "Get it wrong once and you receive a yellow card — one more chance. Get it wrong again and it's a red card — game over." },
          { step: "4", text: "Complete the challenge without a red card and you earn a Career Cap. Miss a day and your caps start to decay — keep your streak alive!" },
        ].map(({ step, text }) => (
          <div key={step} style={{ display: "flex", gap: 14, marginBottom: 14, alignItems: "flex-start" }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#e11d48,#f43f5e)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, color: "#ffffff", fontWeight: 800, flexShrink: 0,
            }}>{step}</div>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, paddingTop: 4 }}>{text}</p>
          </div>
        ))}
      </div>

      {/* Rush Mode */}
      <div style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: "24px", marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>⚡</span>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>RUSH MODE</h2>
        </div>
        {[
          { step: "1", text: "Choose a category — Premier League goals, international caps, club appearances and more." },
          { step: "2", text: "You have 30 seconds. Answer as many higher-or-lower questions as you can before the clock runs out." },
          { step: "3", text: "Get one wrong and you lose possession — you can keep going but the perfect run bonus is gone. Get two wrong and the session ends." },
          { step: "4", text: "Complete a perfect run with no mistakes and your score doubles. Your best scores go on the global leaderboard — weekly and all-time." },
        ].map(({ step, text }) => (
          <div key={step} style={{ display: "flex", gap: 14, marginBottom: 14, alignItems: "flex-start" }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, color: "#ffffff", fontWeight: 800, flexShrink: 0,
            }}>{step}</div>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, paddingTop: 4 }}>{text}</p>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: "24px", marginBottom: 32,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 14px", color: "#ffffff" }}>💡 Tips</h2>
        {[
          "Your career caps are cumulative — play every day to reach the higher tiers from Squad Player all the way to Hall of Fame.",
          "In Rush Mode, a perfect run doubles your score — if you're on a clean run, play it safe near the end.",
          "Rush categories have separate weekly and all-time leaderboards — you can be #1 this week even if someone has a higher all-time score.",
          "Miss two days in a row and you'll be offered a Restore — watch an ad to get your caps back, or take the decay hit.",
        ].map((tip, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f43f5e", flexShrink: 0, marginTop: 7 }} />
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>{tip}</p>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center" }}>
        <a href="/" style={{
          display: "inline-block", background: "linear-gradient(135deg,#e11d48,#f43f5e)",
          color: "#ffffff", fontWeight: 800, fontSize: 16, padding: "14px 40px",
          borderRadius: 12, textDecoration: "none", letterSpacing: 0.5,
        }}>▶ Play Now</a>
      </div>
    </PageLayout>
  );
}
