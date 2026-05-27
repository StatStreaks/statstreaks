import { useState } from "react";
import { Helmet } from "react-helmet-async";

const LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABDoAAAEWCAYAAACHe/dTAAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAAEAAElEQVR4nOT9acxs2XUWjq9d55wa3nqHO9/uvj3Y7anbTjwldgYncRLbmbAdbBPHFgmEQETigAUkOIkiCL+EQCxAECQ+IPEhClGARBaSEYoIEnxAEYI/OBFD02899nD7zve+Q811zv5/qPPsWmfV2vvsU1Xv7euwpHur3lPn7L323mt41trDMa1WiyRZa933JEloPp9TkiSU5zkRET355BP2gx/8ICVJYu8zxqyUoxG/zxhDxhg6Ojqif/tv/45++P4/u61cTz/5X37i/+rLf3BFAIBRJB4AAAAB";

export default function PageLayout({ children, title, description, canonical }) {
  // Build page-specific title (avoids duplicate by never falling back to a default here)
  const pageTitle = title
    ? `${title} · StatStreaks`
    : "StatStreaks – The Football Higher or Lower Game";

  // Only set canonical if a path is explicitly provided
  const canonicalUrl = canonical
    ? `https://statstreaks.com${canonical}`
    : null;

  // Only set description if one is explicitly provided
  const metaDescription = description || null;

  return (
    <div style={{ minHeight:"100vh", background:"#0f1923", fontFamily:"'Inter',sans-serif", position:"relative" }}>
      <Helmet>
        {/* Single title tag – no duplicate */}
        <title>{pageTitle}</title>

        {/* Meta description – only rendered when a page-specific one is supplied */}
        {metaDescription && (
          <meta name="description" content={metaDescription} />
        )}

        {/* Canonical – only rendered when an explicit path is supplied */}
        {canonicalUrl && (
          <link rel="canonical" href={canonicalUrl} />
        )}
      </Helmet>

      {/* Top colour bar */}
      <div style={{ position:"fixed", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,#0891b2,#06b6d4)", zIndex:10 }}/>
      {/* Pitch texture */}
      <div style={{ position:"fixed", inset:0, backgroundImage:"repeating-linear-gradient(160deg,transparent,transparent 60px,rgba(255,255,255,0.018) 60px,rgba(255,255,255,0.018) 61px)", pointerEvents:"none", zIndex:0 }}/>

      <div style={{ position:"relative", zIndex:1, maxWidth:460, margin:"0 auto", padding:"24px 16px 48px" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <a href="/" style={{ textDecoration:"none", flexShrink:0 }}>
            <img src={LOGO} alt="StatStreaks" style={{ width:180, height:"auto", display:"block" }}/>
          </a>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:24, fontWeight:900, color:"#ffffff", fontFamily:"'Bebas Neue',sans-serif", lineHeight:1, letterSpacing:1 }}>{title}</div>
          </div>
          <a href="/" style={{
            background:"linear-gradient(135deg,#15803d,#16a34a,#22c55e)",
            border:"none", borderRadius:10, color:"#ffffff",
            fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:700,
            padding:"8px 14px", textDecoration:"none", flexShrink:0,
          }}>▶ Play</a>
        </div>

        {/* Nav */}
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
          {[
            { label:"How To Play", href:"/how-to-play" },
            { label:"About", href:"/about" },
            { label:"Terms", href:"/terms" },
            { label:"Contact", href:"/contact" },
          ].map(({label, href}) => (
            <a key={href} href={href} style={{
              background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
              borderRadius:8, color:"rgba(255,255,255,0.55)", fontFamily:"'Inter',sans-serif",
              fontSize:11, fontWeight:600, padding:"6px 12px", textDecoration:"none",
            }}>{label}</a>
          ))}
        </div>

        {children}

        {/* Footer */}
        <div style={{ marginTop:32, paddingTop:16, borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", gap:12, flexWrap:"wrap" }}>
          {[
            { label:"Home", href:"/" },
            { label:"How To Play", href:"/how-to-play" },
            { label:"About", href:"/about" },
            { label:"Terms & Privacy", href:"/terms" },
            { label:"Contact", href:"/contact" },
          ].map(({label, href}, i, arr) => (
            <>
              <a key={href} href={href} style={{ color:"rgba(255,255,255,0.25)", fontSize:10, fontFamily:"'Inter',sans-serif", textDecoration:"none" }}>{label}</a>
              {i < arr.length-1 && <span style={{ color:"rgba(255,255,255,0.1)", fontSize:10 }}>·</span>}
            </>
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #0f1923; }
      `}</style>
    </div>
  );
}