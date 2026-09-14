import { ImageResponse } from "next/og";

export const alt = "nextround – Übe dein Vorstellungsgespräch. Same you. Higher chances.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#fafaf7",
          color: "#111111",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: -2 }}>nextround</span>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <path d="M4 16l5-8M11 16l5-8M18 16l3-5" stroke="#5b2eff" strokeWidth="3.2" strokeLinecap="round" />
            </svg>
          </div>
          <span
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#5b2eff",
              background: "#f0ebff",
              padding: "10px 22px",
              borderRadius: 999,
            }}
          >
            Kostenlos · Ohne Anmeldung
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -3, maxWidth: 1000 }}>
            Bereit für dein nächstes Vorstellungsgespräch?
          </div>
          <div style={{ fontSize: 34, color: "#5c5c66", maxWidth: 960, lineHeight: 1.3 }}>
            Übe typische Fragen für deine Lehrstelle und bekomme sofort ehrliches Feedback.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#5b2eff",
              color: "white",
              fontSize: 32,
              fontWeight: 700,
              padding: "20px 40px",
              borderRadius: 24,
            }}
          >
            Los geht&apos;s →
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: "#5b2eff", fontStyle: "italic" }}>
            Same you. Higher chances.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
