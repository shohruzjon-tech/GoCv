/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "GoCV — Free AI-Powered Resume Builder";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background:
          "linear-gradient(135deg, #08081a 0%, #0f0f2e 40%, #1a0a30 70%, #08081a 100%)",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Neon glow circles */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          left: "-100px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-120px",
          right: "-80px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: "200px",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
          padding: "40px",
        }}
      >
        {/* Logo text */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <span
            style={{
              fontSize: "64px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-2px",
            }}
          >
            Go
          </span>
          <span
            style={{
              fontSize: "64px",
              fontWeight: 800,
              background: "linear-gradient(135deg, #818cf8, #06b6d4, #a855f7)",
              backgroundClip: "text",
              color: "transparent",
              letterSpacing: "-2px",
            }}
          >
            CV
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "36px",
            fontWeight: 700,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: "16px",
            maxWidth: "800px",
          }}
        >
          Free AI-Powered Resume Builder
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: "20px",
            color: "#a1a1aa",
            textAlign: "center",
            lineHeight: 1.5,
            maxWidth: "650px",
            marginBottom: "32px",
          }}
        >
          Create professional, ATS-optimized CVs in minutes. Get a shareable
          online page & download stunning PDFs.
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            "AI-Powered",
            "ATS-Optimized",
            "Free PDF Export",
            "Shareable Link",
          ].map((text) => (
            <div
              key={text}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 20px",
                borderRadius: "24px",
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
                color: "#818cf8",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* URL bar at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "30px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 24px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#10b981",
          }}
        />
        <span style={{ color: "#71717a", fontSize: "16px" }}>gocv.live</span>
      </div>
    </div>,
    { ...size },
  );
}
