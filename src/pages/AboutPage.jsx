import PageLayout from "./PageLayout.jsx";

export default function AboutPage() {
  return (
    <PageLayout>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, color: "#f43f5e", letterSpacing: 3, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>About</div>
        <h1 style={{ fontSize: 42, fontWeight: 900, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2, margin: 0, lineHeight: 1 }}>
          THE FOOTBALL STAT GAME
        </h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 16, lineHeight: 1.7, marginTop: 16 }}>
          StatStreaks is a free daily football higher-or-lower guessing game for fans who know their stats.
        </p>
      </div>

      {[
        {
          title: "What is StatStreaks?",
          body: "StatStreaks is a daily football trivia game built around one simple question: is this player's stat higher or lower than the last? Whether it's Premier League goals, international caps, or Champions League appearances — if you know your football, you'll love it.",
        },
        {
          title: "Daily Mode",
          body: "Every day brings a new challenge with 11 cards. Guess correctly and build your career caps streak. Miss two and you're out. Come back tomorrow to keep the streak alive — miss a day and your caps start to decay.",
        },
        {
          title: "Rush Mode",
          body: "30 seconds. As many correct answers as you can. Multiple categories to compete across — Premier League goals, international caps, club appearances and more. Score big enough and you'll top the global leaderboard.",
        },
        {
          title: "Who made it?",
          body: "StatStreaks was built by a football fan, for football fans. It's completely free to play. If you enjoy it, tell a mate — that's all the support we need.",
        },
      ].map(({ title, body }) => (
        <div key={title} style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: "24px", marginBottom: 16,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px", color: "#ffffff" }}>{title}</h2>
          <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>{body}</p>
        </div>
      ))}

      <div style={{
        background: "linear-gradient(135deg,#e11d48,#f43f5e)",
        borderRadius: 16, padding: "28px 24px", textAlign: "center", marginTop: 32,
      }}>
        <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2, marginBottom: 8 }}>
          READY TO PLAY?
        </div>
        <p style={{ margin: "0 0 20px", color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
          Today's challenge is waiting. How many can you get right?
        </p>
        <a href="/" style={{
          display: "inline-block", background: "#ffffff", color: "#e11d48",
          fontWeight: 800, fontSize: 15, padding: "12px 32px", borderRadius: 10,
          textDecoration: "none", letterSpacing: 0.5,
        }}>▶ Play Now</a>
      </div>
    </PageLayout>
  );
}
