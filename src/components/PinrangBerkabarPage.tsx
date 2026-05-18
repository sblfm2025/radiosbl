import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ExternalLink, Loader2, PlayCircle, RefreshCw, Search, Video } from "lucide-react";
import { PageHeader } from "./PageHeader";
import {
  getPinrangBerkabarFallback,
  listPinrangBerkabarVideos,
  PINRANG_BERKABAR_PLAYLIST_ID,
  PINRANG_BERKABAR_PLAYLIST_URL,
  type PinrangBerkabarVideo
} from "../services/pinrangBerkabar.service";

function formatVideoDate(value?: string): string {
  if (!value) return "Tanggal belum tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tanggal belum tersedia";

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getSourceLabel(source: PinrangBerkabarVideo["source"]): string {
  switch (source) {
    case "proxy":
      return "Feed resmi";
    case "youtube-api":
      return "YouTube resmi";
    default:
      return "Playlist resmi";
  }
}

function getEmbedUrl(video: PinrangBerkabarVideo): string {
  if (video.source === "fallback" || video.id === "pinrang-berkabar-playlist") {
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${PINRANG_BERKABAR_PLAYLIST_ID}`;
  }

  return `https://www.youtube-nocookie.com/embed/${video.id}?rel=0&list=${PINRANG_BERKABAR_PLAYLIST_ID}`;
}

export function PinrangBerkabarPage() {
  const [videos, setVideos] = useState<PinrangBerkabarVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<PinrangBerkabarVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notice, setNotice] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  async function loadVideos() {
    setLoading(true);
    setNotice("");

    try {
      const feed = await listPinrangBerkabarVideos();
      const nextVideos = feed.videos.length > 0 ? feed.videos : getPinrangBerkabarFallback();
      setVideos(nextVideos);
      setSelectedVideo(nextVideos[0] ?? null);
      setNextPageToken(feed.nextPageToken);
      if (feed.videos.length === 0 || feed.source === "fallback") {
        setNotice("Daftar video otomatis belum tersedia. Playlist resmi tetap bisa dibuka langsung.");
      }
    } catch {
      const fallbackVideos = getPinrangBerkabarFallback();
      setVideos(fallbackVideos);
      setSelectedVideo(fallbackVideos[0] ?? null);
      setNextPageToken(undefined);
      setNotice("Video terbaru belum bisa dimuat. Buka playlist resmi untuk menonton langsung.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMoreVideos() {
    if (!nextPageToken || loadingMore) return;

    setLoadingMore(true);
    setNotice("");

    try {
      const feed = await listPinrangBerkabarVideos(nextPageToken);
      setVideos((current) => {
        const existingIds = new Set(current.map((video) => video.id));
        return [
          ...current,
          ...feed.videos.filter((video) => !existingIds.has(video.id))
        ];
      });
      setNextPageToken(feed.nextPageToken);
    } catch {
      setNotice("Video lanjutan belum bisa dimuat. Coba lagi atau buka playlist resmi.");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    void loadVideos();
  }, []);

  const summary = useMemo(() => {
    const source = videos[0]?.source ?? "fallback";
    return {
      count: videos.length,
      source: getSourceLabel(source)
    };
  }, [videos]);
  const filteredVideos = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return videos;

    return videos.filter((video) => {
      return [
        video.title,
        video.description,
        video.channelTitle,
        formatVideoDate(video.publishedAt)
      ].join(" ").toLowerCase().includes(keyword);
    });
  }, [searchQuery, videos]);
  const hasSearch = searchQuery.trim().length > 0;
  const playerVideo = selectedVideo ?? videos[0];
  const relatedVideos = playerVideo
    ? filteredVideos.filter((video) => video.id !== playerVideo.id)
    : filteredVideos;

  return (
    <>
      <PageHeader
        eyebrow="Video"
        title="Pinrang Berkabar"
        description="Video terbaru dari playlist YouTube Radio SBL untuk kabar dan informasi seputar Pinrang."
      />

      <section className="pinrang-video-page">
        <div className="pinrang-video-hero">
          <div className="pinrang-video-identity">
            <img src="/PinrangBerkabar.png" alt="Pinrang Berkabar" />
            <div>
              <span>
                <Video size={18} />
                Kanal video berita
              </span>
              <strong>Pinrang Berkabar</strong>
              <p>{summary.count} video ditampilkan dari {summary.source} Radio SBL.</p>
            </div>
          </div>
          <div className="pinrang-video-actions">
            <button type="button" onClick={() => void loadVideos()} disabled={loading}>
              {loading ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
              Coba lagi
            </button>
            <a href={PINRANG_BERKABAR_PLAYLIST_URL} target="_blank" rel="noreferrer">
              <ExternalLink size={16} />
              Buka playlist
            </a>
          </div>
        </div>

        {notice && (
          <div className="pinrang-video-notice">
            <AlertCircle size={17} />
            <span>{notice}</span>
          </div>
        )}

        <label className="pinrang-video-search">
          <Search size={18} />
          <span>Cari video</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari judul, tanggal, atau kanal..."
          />
        </label>

        {loading ? (
          <div className="pinrang-video-grid" aria-label="Memuat video Pinrang Berkabar">
            {Array.from({ length: 6 }).map((_, index) => (
              <article key={index} className="pinrang-video-card loading">
                <span />
                <div>
                  <i />
                  <i />
                  <i />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <>
            {playerVideo && (
              <section className="pinrang-video-player" aria-label="Player Pinrang Berkabar">
                <div>
                  <iframe
                    src={getEmbedUrl(playerVideo)}
                    title={`Player ${playerVideo.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                <aside>
                  <span>Now Playing</span>
                  <strong>{playerVideo.title}</strong>
                  <p>{playerVideo.description}</p>
                  <a href={playerVideo.url} target="_blank" rel="noreferrer">
                    <ExternalLink size={15} />
                    Buka di YouTube
                  </a>
                </aside>
              </section>
            )}

            <section className="pinrang-video-related" aria-label="Video lainnya">
              <div className="pinrang-video-section-head">
                <strong>Video Lainnya</strong>
                <small>{relatedVideos.length} video tersedia</small>
              </div>
              <div className="pinrang-video-carousel">
              {relatedVideos.map((video) => (
                <article key={video.id} className={`pinrang-video-card${playerVideo?.id === video.id ? " active" : ""}`}>
                  <button
                    type="button"
                    className="pinrang-video-thumb"
                    onClick={() => setSelectedVideo(video)}
                    aria-label={`Putar ${video.title} di halaman`}
                  >
                    <img src={video.thumbnailUrl} alt={video.title} loading="lazy" />
                    <span>
                      <PlayCircle size={18} />
                      Putar
                    </span>
                  </button>
                  <div className="pinrang-video-copy">
                    <span>Pinrang Berkabar</span>
                    <h2>{video.title}</h2>
                    <p>{video.description}</p>
                    <div>
                      <small>{formatVideoDate(video.publishedAt)}</small>
                      <small>{video.channelTitle}</small>
                    </div>
                  </div>
                </article>
              ))}
              </div>
            </section>

            {filteredVideos.length === 0 && (
              <div className="pinrang-video-empty">
                <Search size={28} />
                <strong>Video tidak ditemukan</strong>
                <p>Coba kata kunci lain atau kosongkan pencarian untuk melihat semua video yang sudah dimuat.</p>
                <button type="button" onClick={() => setSearchQuery("")}>
                  Reset pencarian
                </button>
              </div>
            )}

            {!hasSearch && nextPageToken && (
              <div className="pinrang-video-load-more">
                <button type="button" onClick={() => void loadMoreVideos()} disabled={loadingMore}>
                  {loadingMore ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
                  Muat lagi
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
