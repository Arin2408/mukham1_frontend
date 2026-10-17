import { ImageResponse } from "next/server";

// The preview picture shown when a Mukham link is shared on WhatsApp,
// LinkedIn, X and similar.
export const runtime = "edge";
export const alt = "Mukham - face and location based attendance";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "linear-gradient(135deg, #0a0a0a 55%, #172554 100%)",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: 26,
              background: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 76,
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: 4 }}>MUKHAM</div>
        </div>
        <div style={{ marginTop: 48, fontSize: 44, color: "#d4d4d8", maxWidth: 900 }}>
          Face and location based attendance, shifts and tasks for your team.
        </div>
      </div>
    ),
    size
  );
}
