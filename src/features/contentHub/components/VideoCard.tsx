import { useState } from "react";
import type { VideoItem } from "../services/videoHub.service";
import type { TimestampLike } from "../../../types/domain";
import { Play, Youtube } from "lucide-react";
import "../styles/contentHub.css";

type VideoCardProps = {
  video: VideoItem;
};

export function VideoCard({ video }: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const getEmbedUrl = () => {
    let url = video.embedUrl;
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      url = url.replace("autoplay=1", "autoplay=0");
      if (!url.includes("autoplay=")) {
        url += url.includes("?") ? "&autoplay=1" : "?autoplay=1";
      }
    }
    return url;
  };

  const getThumbnailUrl = () => {
    // Ekstrak YouTube video ID untuk menampilkan thumbnail
    const match = video.embedUrl.match(
      /(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (match?.[1]) {
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }
    return null;
  };

  const formatDate = (dateStr: TimestampLike) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return String(dateStr);
    }
  };

  const thumbnail = getThumbnailUrl();

  return (
    <div className="video-card" data-testid={`video-card-${video.videoId}`}>
      <div className="video-card-player">
        {isPlaying ? (
          <iframe
            src={getEmbedUrl()}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          /* Thumbnail klik-untuk-putar — menghindari iframe kosong hitam */
          <div
            className="video-card-thumbnail"
            onClick={() => setIsPlaying(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setIsPlaying(true)}
            aria-label={`Putar video: ${video.title}`}
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={video.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={(e) => {
                  // Fallback jika thumbnail YouTube tidak tersedia
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).nextElementSibling?.removeAttribute("hidden");
                }}
              />
            ) : null}
            {/* Placeholder ketika thumbnail tidak ada */}
            {!thumbnail && (
              <div className="video-card-thumb-placeholder" aria-hidden="true">
                <Youtube size={40} color="rgba(255,255,255,0.4)" />
              </div>
            )}
            {/* Tombol play overlay */}
            <div className="video-card-play-overlay" aria-hidden="true">
              <div className="video-card-play-btn">
                <Play size={22} fill="#fff" color="#fff" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="video-card-content">
        <h4 className="video-card-title">{video.title}</h4>
        {video.description && <p className="video-card-desc">{video.description}</p>}

        {video.programTitle && (
          <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: "600" }}>
            Program: {video.programTitle}
          </span>
        )}

        <div className="video-card-footer">
          <span>{formatDate(video.publishedAt || video.createdAt)}</span>
          <div style={{ display: "flex", gap: "4px" }}>
            {video.tags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: "0.65rem"
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
