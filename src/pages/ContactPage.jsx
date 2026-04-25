import PageLayout from "./PageLayout.jsx";

export default function ContactPage() {
  return (
    <PageLayout>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, color: "#f43f5e", letterSpacing: 3, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Get In Touch</div>
        <h1 style={{ fontSize: 42, fontWeight: 900, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2, margin: 0, lineHeight: 1 }}>
          CONTACT US
        </h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, lineHeight: 1.7, marginTop: 16 }}>
          We're a small team and we read every message. If something's wrong, we want to know about it.
        </p>
      </div>

      {/* Main contact card */}
      <div style={{
        background: "linear-gradient(135deg,#0e7490,#0891b2)",
        borderRadius: 16, padding: "28px 24px", marginBottom: 16,
        border: "1px solid rgba(6,182,212,0.3)",
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Email Us</div>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>
          Drop us an email for anything — bug reports, stats corrections, category ideas, or just to say hello.
        </p>
        <a href="mailto:statstreaks@gmail.com" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 10, padding: "12px 20px", textDecoration: "none",
          color: "#ffffff", fontSize: 14, fontWeight: 700,
        }}>✉️ statstreaks@gmail.com</a>
      </div>

      {/* Reason cards */}
      {[
        { emoji: "🐛", title: "Bug Reports", body: "Something broken? Tell us exactly what happened and what device you're on and we'll get it fixed." },
        { emoji: "📊", title: "Stats Corrections", body: "Spotted a wrong stat? Let us know the player, category and what the correct figure should be." },
        { emoji: "📂", title: "Category Requests", body: "Got an idea for a new Rush category or daily challenge theme? We're always looking for new content." },
        { emoji: "🤝", title: "Partnerships", body: "Interested in working with StatStreaks? Get in touch and let's have a conversation." },
      ].map(({ emoji, title, body }) => (
        <div key={title} style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: "20px 24px", marginBottom: 12,
          display: "flex", gap: 16, alignItems: "flex-start",
        }}>
          <div style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{emoji}</div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px", color: "#ffffff" }}>{title}</h2>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{body}</p>
          </div>
        </div>
      ))}

      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 32 }}>
        We aim to respond within 48 hours.
      </p>
    </PageLayout>
  );
}
