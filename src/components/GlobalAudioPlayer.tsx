import { Pause, Play } from "lucide-react";
import { useGlobalAudio } from "../contexts/useGlobalAudio";

export function GlobalAudioPlayer({ hasBottomNav = true }: { hasBottomNav?: boolean }) {
  const {
    playing,
    togglePlayback,
    volume,
    setVolume,
    metadata,
    isExpanded
  } = useGlobalAudio();

  if (isExpanded) return null;

  return (
    <div className={`global-mini-player${hasBottomNav ? " with-bottom-nav" : ""}`}>
      <button
        type="button"
        className="global-mini-play"
        aria-label={playing ? "Jeda radio" : "Putar radio"}
        onClick={togglePlayback}
      >
        {playing ? <Pause size={18} /> : <Play size={18} fill="white" />}
      </button>

      <div className="global-mini-copy">
        <strong>{metadata.title}</strong>
        <span>{metadata.artist}</span>
      </div>

      <div className={`global-mini-eq${playing ? " playing" : ""}`} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((bar) => (
          <span key={bar} />
        ))}
      </div>

      <label className="global-mini-volume">
        <span>Volume</span>
        <input
          aria-label="Volume radio"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
        />
      </label>
    </div>
  );
}
