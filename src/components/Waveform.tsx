export function Waveform({ playing = true }: { playing?: boolean }) {
  return (
    <div className={`waveform${playing ? " playing" : ""}`} aria-hidden="true">
      {Array.from({ length: 36 }, (_, index) => (
        <span
          key={index}
          className={`waveform-bar waveform-bar-${(index % 12) + 1} waveform-speed-${(index % 3) + 1}`}
        />
      ))}
    </div>
  );
}
