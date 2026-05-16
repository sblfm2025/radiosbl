import type { CSSProperties } from "react";

export function Waveform() {
  return (
    <div className="waveform" aria-hidden="true">
      {Array.from({ length: 18 }, (_, index) => {
        const height = 22 + (index % 7) * 8;

        return (
          <span
            key={index}
            style={
              {
                "--bar-height": `${height}px`,
                "--bar-delay": `${index * 0.05}s`
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
