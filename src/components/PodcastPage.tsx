import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Headphones,
  ListMusic,
  Pause,
  Play,
  Radio,
  Search,
  Sparkles
} from "lucide-react";
import {
  DEFAULT_PODCAST_EMBED_URL,
  DEFAULT_PODCAST_SOURCE_URL,
  getConfiguredPodcastApiEndpoint,
  getConfiguredPodcastFeedUrl,
  loadPodcastFeed,
  loadSpotifyPodcastFeed,
  type PodcastEpisode,
  type PodcastFeed
} from "../services/podcast.service";

const SPOTIFY_ICON_PATH =
  "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.58 14.43a.73.73 0 0 1-1 .24c-2.74-1.67-6.18-2.05-10.23-1.12a.73.73 0 0 1-.33-1.42c4.43-1.02 8.24-.58 11.32 1.3.34.21.45.66.24 1Zm1.33-2.95a.9.9 0 0 1-1.24.3c-3.13-1.93-7.91-2.49-11.62-1.36a.91.91 0 0 1-.53-1.74c4.24-1.29 9.5-.67 13.09 1.54.43.26.56.83.3 1.26Zm.12-3.07c-3.76-2.23-9.96-2.44-13.55-1.35a1.08 1.08 0 1 1-.63-2.06c4.12-1.25 10.96-1 15.29 1.57a1.08 1.08 0 0 1-1.11 1.84Z";

function formatDate(value: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatDuration(value: string): string {
  if (!value) {
    return "";
  }

  const parts = value.split(":").map(Number);

  if (parts.some(Number.isNaN)) {
    return value;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours > 0 ? `${hours}j ${minutes}m` : `${minutes}m ${seconds}d`;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return `${minutes}m ${seconds}d`;
  }

  return value;
}

function getEpisodeMeta(episode: PodcastEpisode): string {
  return [
    episode.publishedAt ? formatDate(episode.publishedAt) : "",
    formatDuration(episode.duration)
  ]
    .filter(Boolean)
    .join(" - ");
}

function getDescriptionPreview(value: string): string {
  if (!value) {
    return "Episode podcast Radio SBL.";
  }

  return value.length > 118 ? `${value.slice(0, 118)}...` : value;
}

function getEpisodeTarget(episode: PodcastEpisode): string {
  return episode.episodeUrl ?? episode.audioUrl ?? DEFAULT_PODCAST_SOURCE_URL;
}

function getEpisodeEmbedUrl(episode: PodcastEpisode): string {
  if (episode.embedUrl) {
    return episode.embedUrl;
  }

  if (episode.episodeUrl?.includes("open.spotify.com/episode/")) {
    return episode.episodeUrl.replace("/episode/", "/embed/episode/");
  }

  return "";
}

const fallbackFeed: PodcastFeed = {
  title: "Suara Bumi Lasinrang (SBL Podcast)",
  description:
    "Suara Bumi Lasinrang (SBL Podcast) adalah kanal podcast resmi Radio Suara Bumi Lasinrang 92.4 FM. Menghadirkan obrolan, cerita, dan informasi dari Pinrang untuk semua lapisan masyarakat - mulai dari isu publik, layanan masyarakat, budaya lokal, hingga suara komunitas dan generasi muda. Podcast ini menjadi ruang dengar alternatif dari siaran radio, agar Sobat Bumi Lasinrang bisa tetap terhubung kapan saja dan di mana saja. Suara Pinrang, Suara Kita!",
  imageUrl: "/LogoSBL.svg",
  sourceUrl: DEFAULT_PODCAST_SOURCE_URL,
  episodes: [
    {
      id: "2OfHzw96TOPL3OlG3NqsAF",
      title: "SBL FESTIVAL on AIR - Special Talkshow Hari Guru Nasional 2025",
      description: "Episode resmi SBL Podcast di Spotify.",
      publishedAt: "",
      duration: "",
      imageUrl: "https://image-cdn-fa.spotifycdn.com/image/ab67656300005f1f5decf14e352a2d9101a6d10c",
      embedUrl: "https://open.spotify.com/embed/episode/2OfHzw96TOPL3OlG3NqsAF?utm_source=oembed",
      episodeUrl: "https://open.spotify.com/episode/2OfHzw96TOPL3OlG3NqsAF"
    },
    {
      id: "7lcRxDo9wLbiBaT9FXpI0L",
      title: "Pinrang di Mata Dunia: Behind the Scene Festival Budaya Internasional",
      description: "Episode resmi SBL Podcast di Spotify.",
      publishedAt: "",
      duration: "",
      imageUrl: "https://image-cdn-ak.spotifycdn.com/image/ab67656300005f1f8d8eab9e6c1793afef3838b7",
      embedUrl: "https://open.spotify.com/embed/episode/7lcRxDo9wLbiBaT9FXpI0L?utm_source=oembed",
      episodeUrl: "https://open.spotify.com/episode/7lcRxDo9wLbiBaT9FXpI0L"
    },
    {
      id: "6UYorUu2KbO8fyuSWvOOrj",
      title: "Peran Pemuda di Festival Budaya Internasional Pinrang",
      description: "Talkshow bersama Ketua Karang Taruna.",
      publishedAt: "",
      duration: "",
      imageUrl: "https://image-cdn-ak.spotifycdn.com/image/ab67656300005f1ff2478c46511f8a45732cfbd5",
      embedUrl: "https://open.spotify.com/embed/episode/6UYorUu2KbO8fyuSWvOOrj?utm_source=oembed",
      episodeUrl: "https://open.spotify.com/episode/6UYorUu2KbO8fyuSWvOOrj"
    },
    {
      id: "1dHnI7k9QN7bXiQbZqgnju",
      title: "Peran Media Publik dalam Membangun Pinrang",
      description: "Episode resmi SBL Podcast di Spotify.",
      publishedAt: "",
      duration: "",
      imageUrl: "https://image-cdn-ak.spotifycdn.com/image/ab67656300005f1f55dbad6c98261985c05e736a",
      embedUrl: "https://open.spotify.com/embed/episode/1dHnI7k9QN7bXiQbZqgnju?utm_source=oembed",
      episodeUrl: "https://open.spotify.com/episode/1dHnI7k9QN7bXiQbZqgnju"
    },
    {
      id: "0rK7fsixLR7KjYQFxdKxoh",
      title: "Pinrang International Folklore Festival 2025",
      description: "Delegasi Malaysia dalam SBL Festival on AIR.",
      publishedAt: "",
      duration: "",
      imageUrl: "https://image-cdn-ak.spotifycdn.com/image/ab67656300005f1f3ebd484fecbd28e77af6042a",
      embedUrl: "https://open.spotify.com/embed/episode/0rK7fsixLR7KjYQFxdKxoh?utm_source=oembed",
      episodeUrl: "https://open.spotify.com/episode/0rK7fsixLR7KjYQFxdKxoh"
    },
    {
      id: "5h73WNzuIA34igCdhCGmvF",
      title: "Tiga Negara, Satu Cerita: Perspektif Global dari Studio SBL",
      description: "Episode resmi SBL Podcast di Spotify.",
      publishedAt: "",
      duration: "",
      imageUrl: "https://image-cdn-ak.spotifycdn.com/image/ab67656300005f1f59c271b007027d0e9f01f0b0",
      embedUrl: "https://open.spotify.com/embed/episode/5h73WNzuIA34igCdhCGmvF?utm_source=oembed",
      episodeUrl: "https://open.spotify.com/episode/5h73WNzuIA34igCdhCGmvF"
    }
  ]
};

export function PodcastPage() {
  const [feed, setFeed] = useState<PodcastFeed>(fallbackFeed);
  const [query, setQuery] = useState("");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [activeEpisodeId, setActiveEpisodeId] = useState(fallbackFeed.episodes[0]?.id ?? "");
  const [playerPaused, setPlayerPaused] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "embed">("idle");

  useEffect(() => {
    const feedUrl = getConfiguredPodcastFeedUrl();
    const spotifyEndpoint = getConfiguredPodcastApiEndpoint();

    if (!feedUrl && !spotifyEndpoint) {
      setStatus("embed");
      return;
    }

    let isMounted = true;
    setStatus("loading");

    const loader = feedUrl
      ? loadPodcastFeed(feedUrl)
      : loadSpotifyPodcastFeed(spotifyEndpoint);

    loader
      .then((nextFeed) => {
        if (isMounted) {
          setFeed(nextFeed);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (isMounted) {
          setFeed(fallbackFeed);
          setStatus("embed");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEpisodes = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) {
      return feed.episodes;
    }

    return feed.episodes.filter((episode) =>
      `${episode.title} ${episode.description}`.toLowerCase().includes(keyword)
    );
  }, [feed.episodes, query]);

  const featuredEpisodes = filteredEpisodes.slice(0, 2);
  const recentEpisodes = filteredEpisodes.slice(2, 14);
  const hasEpisodes = filteredEpisodes.length > 0;
  const hasSearchResults = filteredEpisodes.length > 0;
  const loadedEpisodeCount = feed.episodes.length;
  const resultLabel = query.trim()
    ? `${filteredEpisodes.length} hasil`
    : `${loadedEpisodeCount} episode`;
  const statusLabel = status === "loading"
    ? "Sinkronisasi feed"
    : status === "ready"
      ? "Feed terbaru"
      : "Fallback Spotify";
  const statusCopy = status === "loading"
    ? "Daftar lama tetap bisa diputar sambil feed terbaru dimuat."
    : status === "ready"
      ? "Episode sudah mengikuti sumber podcast yang terhubung."
      : "Episode fallback tetap tersedia saat feed belum dikonfigurasi.";
  const shouldCollapseDescription = feed.description.length > 210;
  const heroDescription =
    descriptionExpanded || !shouldCollapseDescription
      ? feed.description
      : `${feed.description.slice(0, 210)}...`;
  const activeEpisode =
    filteredEpisodes.find((episode) => episode.id === activeEpisodeId) ??
    feed.episodes.find((episode) => episode.id === activeEpisodeId) ??
    featuredEpisodes[0] ??
    recentEpisodes[0] ??
    null;

  function handlePlayEpisode(episode: PodcastEpisode) {
    if (episode.id === activeEpisodeId && !playerPaused) {
      setPlayerPaused(true);
      return;
    }

    const embedUrl = getEpisodeEmbedUrl(episode);

    if (!embedUrl) {
      window.open(getEpisodeTarget(episode), "_blank", "noopener,noreferrer");
      return;
    }

    setActiveEpisodeId(episode.id);
    setPlayerPaused(false);
  }

  return (
    <div className="podcast-page">
      <div className="podcast-content">
        <section className="podcast-hero" aria-label="Sumber podcast Radio SBL">
          <div className="podcast-hero-heading">
            <div className="podcast-hero-art">
              <img src={feed.imageUrl} alt={feed.title} />
            </div>
            <div className="podcast-hero-title">
              <p className="eyebrow">Radio SBL</p>
              <h2>{feed.title}</h2>
            </div>
          </div>

          <div className="podcast-hero-copy">
            <p>
              {heroDescription}
              {shouldCollapseDescription && (
                <button
                  type="button"
                  onClick={() => setDescriptionExpanded((expanded) => !expanded)}
                >
                  {descriptionExpanded ? "Tampilkan lebih ringkas" : "Selengkapnya"}
                </button>
              )}
            </p>
            <a href={feed.sourceUrl} target="_blank" rel="noreferrer" className="podcast-channel-link">
              <span className="podcast-spotify-link" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d={SPOTIFY_ICON_PATH} />
                </svg>
              </span>
              <span>SBL Podcast on Spotify</span>
            </a>
          </div>
        </section>

        <section className="podcast-command-panel" aria-label="Ringkasan podcast">
          <article>
            <ListMusic size={18} />
            <small>Katalog</small>
            <strong>{resultLabel}</strong>
            <span>{query.trim() ? "Hasil pencarian aktif" : "Siap diputar dari halaman ini"}</span>
          </article>
          <article>
            <Radio size={18} />
            <small>Status feed</small>
            <strong>{statusLabel}</strong>
            <span>{statusCopy}</span>
          </article>
          <article>
            <Headphones size={18} />
            <small>Sedang dipilih</small>
            <strong>{activeEpisode?.title ?? "Belum ada episode"}</strong>
            <span>{activeEpisode ? "Player mengikuti pilihan terbaru" : "Pilih episode untuk memulai"}</span>
          </article>
        </section>

        <div className="podcast-search">
          <Search size={20} color="#64748B" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari episode podcast..."
            aria-label="Cari episode podcast"
          />
        </div>

        {status === "loading" && (
          <section className="podcast-loading-strip" aria-label="Memuat feed podcast terbaru">
            <div className="ui-skeleton-card">
              <span className="ui-skeleton line short" />
              <span className="ui-skeleton line" />
            </div>
            <div className="ui-skeleton-card">
              <span className="ui-skeleton line medium" />
              <span className="ui-skeleton line" />
            </div>
          </section>
        )}

        {hasEpisodes ? (
          <>
            {activeEpisode && (
              <section className="podcast-player-panel" aria-label="Player podcast aktif">
                <div className="podcast-player-head">
                  <div>
                    <p className="eyebrow">Sedang Diputar</p>
                    <h3>{activeEpisode.title}</h3>
                    <span>{getEpisodeMeta(activeEpisode) || "SBL Podcast on Spotify"}</span>
                  </div>
                </div>
                {playerPaused ? (
                  <div className="podcast-player-paused">
                    <button
                      type="button"
                      className="podcast-player-resume"
                      onClick={() => setPlayerPaused(false)}
                      aria-label={`Lanjutkan ${activeEpisode.title}`}
                    >
                      <Play fill="currentColor" size={24} />
                    </button>
                    <span>Podcast dijeda</span>
                  </div>
                ) : (
                  <iframe
                    title={`Player ${activeEpisode.title}`}
                    src={getEpisodeEmbedUrl(activeEpisode)}
                    loading="lazy"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  />
                )}
              </section>
            )}

            {featuredEpisodes.length > 0 && (
              <section className="podcast-featured-section" aria-label="Episode pilihan">
                <div className="podcast-featured">
                  {featuredEpisodes.map((episode) => (
                    <article
                      key={episode.id}
                      className={`podcast-show-card${activeEpisode?.id === episode.id ? " is-active" : ""}`}
                    >
                      <span className="podcast-show-art">
                        <img src={episode.imageUrl || feed.imageUrl} alt={episode.title} />
                        <button
                          type="button"
                          className="podcast-play-mark"
                          onClick={() => handlePlayEpisode(episode)}
                          aria-label={`Putar ${episode.title}`}
                        >
                          {activeEpisode?.id === episode.id && !playerPaused ? (
                            <Pause fill="currentColor" size={15} />
                          ) : (
                            <Play fill="currentColor" size={15} />
                          )}
                        </button>
                      </span>
                      <span className="podcast-show-copy">
                        <small>
                          <Sparkles size={13} />
                          Episode pilihan
                        </small>
                        <strong>{episode.title}</strong>
                        <em>{getDescriptionPreview(episode.description)}</em>
                      </span>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {recentEpisodes.length > 0 && (
              <section className="podcast-episode-section" aria-label="Episode lainnya">
                <div className="podcast-section-title">
                  <h2>Episode Lainnya</h2>
                  <span>{recentEpisodes.length} episode</span>
                </div>

                <div className="podcast-episode-list">
                  {recentEpisodes.map((episode) => (
                    <article
                      key={episode.id}
                      className={`podcast-episode-card${activeEpisode?.id === episode.id ? " is-active" : ""}`}
                    >
                      <span className="podcast-episode-art">
                        <img src={episode.imageUrl || feed.imageUrl} alt={episode.title} />
                      </span>
                      <span className="podcast-episode-copy">
                        <strong>{episode.title}</strong>
                        <em>{getDescriptionPreview(episode.description)}</em>
                        {(episode.publishedAt || episode.duration) && (
                          <small>
                            <CalendarClock size={14} />
                            {getEpisodeMeta(episode)}
                          </small>
                        )}
                      </span>
                      <button
                        type="button"
                        className="podcast-card-play"
                        onClick={() => handlePlayEpisode(episode)}
                        aria-label={`Putar ${episode.title}`}
                      >
                        {activeEpisode?.id === episode.id && !playerPaused ? (
                          <Pause fill="currentColor" size={16} />
                        ) : (
                          <Play fill="currentColor" size={16} />
                        )}
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : query.trim() && !hasSearchResults ? (
          <section className="podcast-empty" aria-label="Hasil pencarian podcast">
            <Search size={38} />
            <h3>Tidak ada episode yang cocok</h3>
            <p>Coba gunakan kata kunci lain atau kosongkan pencarian untuk melihat semua episode.</p>
            <button type="button" onClick={() => setQuery("")}>
              Kosongkan pencarian
            </button>
          </section>
        ) : (
          <section className="podcast-embed-panel" aria-label="Podcast Spotify Radio SBL">
            <iframe
              title="Podcast Radio SBL di Spotify"
              src={DEFAULT_PODCAST_EMBED_URL}
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            />
          </section>
        )}
      </div>
    </div>
  );
}
