import type { CSSProperties } from "react";

export function Waveform({ playing = true }: { playing?: boolean }) {
  return (
    <>
      <style>
        {`
          @keyframes dashboardWaveSmooth {
            0% { transform: scaleY(0.3); opacity: 0.4; }
            50% { transform: scaleY(1.3); opacity: 1; }
            100% { transform: scaleY(0.3); opacity: 0.4; }
          }
        `}
      </style>
      <div aria-hidden="true" style={{ display: "flex", gap: "4px", alignItems: "center", height: "60px", justifyContent: "center", margin: "24px 0" }}>
        {Array.from({ length: 36 }, (_, index) => {
          const baseHeight = 12 + Math.abs(Math.sin(index * 0.4)) * 24 + Math.abs(Math.cos(index * 0.7)) * 12;
          return (
            <span
              key={index}
              style={{
                width: "4px",
                height: `${baseHeight}px`,
                borderRadius: "4px",
                background: "linear-gradient(180deg, var(--blue, #1665D8), var(--yellow, #F5A623))",
                animation: playing ? `dashboardWaveSmooth ${0.8 + (index % 3) * 0.2}s ease-in-out infinite` : "none",
                animationDelay: `${-index * 0.1}s`,
                opacity: playing ? 1 : 0.3,
                transformOrigin: "center",
                transition: "opacity 0.4s ease, height 0.4s ease",
                willChange: "transform"
              }}
            />
          );
        })}
      </div>
    </>
  );
}
