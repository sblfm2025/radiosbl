import type { ProgramEpisode } from "../services/episode.service";
import type { TimestampLike } from "../../../types/domain";
import { Play, Pause, Calendar, Clock } from "lucide-react";
import "../styles/contentHub.css";

type EpisodeCardProps = {
  episode: ProgramEpisode;
  onPlay: (episode: ProgramEpisode) => void;
  isPlaying: boolean;
};

export function EpisodeCard({ episode, onPlay, isPlaying }: EpisodeCardProps) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Dengar";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}d`;
  };

  const formatDate = (dateStr: TimestampLike) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div className="episode-card" data-testid={`episode-card-${episode.episodeId}`}>
      <div className="episode-card-cover">
        <img src={episode.coverImageUrl || "/LogoSBL.svg"} alt={episode.title} />
        <button
          onClick={() => onPlay(episode)}
          className="episode-card-play-overlay"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: isPlaying ? 1 : 0,
            cursor: "pointer",
            transition: "opacity 0.2s ease"
          }}
          aria-label={isPlaying ? `Jeda ${episode.title}` : `Putar ${episode.title}`}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff"
            }}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: "2px" }} />}
          </div>
        </button>
      </div>

      <div className="episode-card-content">
        <span className="episode-card-program">{episode.programTitle}</span>
        <h4 className="episode-card-title">{episode.title}</h4>
        {episode.description && <p className="episode-card-description">{episode.description}</p>}
        
        <div className="episode-card-meta">
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Calendar size={13} />
            {formatDate(episode.publishedAt || episode.createdAt)}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Clock size={13} />
            {formatDuration(episode.durationSeconds)}
          </span>
        </div>
      </div>

      <style>{`
        .episode-card-cover:hover .episode-card-play-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
