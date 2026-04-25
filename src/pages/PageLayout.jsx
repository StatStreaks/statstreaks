// Shared layout for static pages
export default function PageLayout({ children }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg,#0f172a 0%,#1e293b 60%,#0f172a 100%)",
      fontFamily: "'Inter',sans-serif",
      color: "#ffffff",
    }}>
      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        maxWidth: 900, margin: "0 auto",
      }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2, color: "#ffffff" }}>
            STAT<span style={{ color: "#f43f5e" }}>STREAKS</span>
          </span>
        </a>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {[
            { label: "How To Play", href: "/how-to-play" },
            { label: "About", href: "/about" },
            { label: "Contact", href: "/contact" },
          ].map(({ label, href }) => (
            <a key={href} href={href} style={{
              textDecoration: "none", color: "rgba(255,255,255,0.55)",
              fontSize: 13, fontWeight: 600, letterSpacing: 0.3,
              transition: "color 0.2s",
            }}
              onMouseEnter={e => e.target.style.color = "#ffffff"}
              onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.55)"}
            >{label}</a>
          ))}
          <a href="/" style={{
            textDecoration: "none", background: "linear-gradient(135deg,#e11d48,#f43f5e)",
            color: "#ffffff", fontSize: 13, fontWeight: 700, padding: "8px 16px",
            borderRadius: 8, letterSpacing: 0.3,
          }}>▶ Play</a>
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 700, margin: "0 auto", padding: "40px 24px 80px" }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "24px",
        textAlign: "center",
        color: "rgba(255,255,255,0.3)",
        fontSize: 12,
        maxWidth: 900, margin: "0 auto",
      }}>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
          {[
            { label: "Home", href: "/" },
            { label: "How To Play", href: "/how-to-play" },
            { label: "About", href: "/about" },
            { label: "Terms & Privacy", href: "/terms" },
            { label: "Contact", href: "/contact" },
          ].map(({ label, href }) => (
            <a key={href} href={href} style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none", fontSize: 12 }}>{label}</a>
          ))}
        </div>
        © {new Date().getFullYear()} StatStreaks · statstreaks@gmail.com
      </footer>
    </div>
  );
}
