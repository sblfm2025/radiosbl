import { ExternalLink, Pause, Play } from "lucide-react";
import { useGlobalAudio } from "../contexts/useGlobalAudio";

export function GlobalAudioPlayer({
  hasBottomNav = true,
  onOpenStreaming
}: {
  hasBottomNav?: boolean;
  onOpenStreaming?: () => void;
}) {
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
      <div className="global-mini-logo" aria-hidden="true">
        <img className="mini-player-logo" src="/LogoSBL.svg" alt="" />
      </div>

      <div className="global-mini-copy mini-player-title">
        <strong><span>LIVE</span> {metadata.title}</strong>
        <small>{metadata.artist}</small>
      </div>

      <button
        type="button"
        className="global-mini-play"
        aria-label={playing ? "Jeda radio" : "Putar radio"}
        onClick={togglePlayback}
      >
        {playing ? <Pause size={18} /> : <Play size={18} fill="white" />}
      </button>

      <div className={`global-mini-eq${playing ? " playing" : ""}`} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((bar) => (
          <span key={bar} />
        ))}
      </div>

      {onOpenStreaming && (
        <button
          type="button"
          className="global-mini-open"
          onClick={onOpenStreaming}
          aria-label="Buka halaman streaming"
        >
          <ExternalLink size={17} />
        </button>
      )}

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
