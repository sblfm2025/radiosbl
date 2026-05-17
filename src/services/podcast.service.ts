export type PodcastEpisode = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  duration: string;
  imageUrl: string;
  embedUrl?: string;
  audioUrl?: string;
  episodeUrl?: string;
};

export type PodcastFeed = {
  title: string;
  description: string;
  imageUrl: string;
  sourceUrl: string;
  episodes: PodcastEpisode[];
};

type SpotifyImage = {
  url: string;
  width?: number;
  height?: number;
};

type SpotifyEpisode = {
  id: string;
  name: string;
  description: string;
  release_date: string;
  duration_ms: number;
  images?: SpotifyImage[];
  external_urls?: {
    spotify?: string;
  };
};

type SpotifyShowEpisodesResponse = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  sourceUrl: string;
  episodes: SpotifyEpisode[];
  warning?: string;
};

export const DEFAULT_PODCAST_SOURCE_URL =
  "https://open.spotify.com/show/5E9y3LGQv233K22ZzYANLF";
export const DEFAULT_PODCAST_EMBED_URL =
  "https://open.spotify.com/embed/show/5E9y3LGQv233K22ZzYANLF";
export const DEFAULT_PODCAST_IMAGE_URL = "/coverSBL.jpg";
export const DEFAULT_SPOTIFY_SHOW_ID = "5E9y3LGQv233K22ZzYANLF";

function getText(parent: Element, selector: string): string {
  return parent.querySelector(selector)?.textContent?.trim() ?? "";
}

function getEpisodeImage(item: Element, channelImage: string): string {
  return (
    item.querySelector("image")?.getAttribute("href") ??
    item.querySelector("itunes\\:image")?.getAttribute("href") ??
    item.querySelector("itunes\\:image")?.getAttribute("url") ??
    channelImage
  );
}

function getEpisodeAudio(item: Element): string | undefined {
  return item.querySelector("enclosure")?.getAttribute("url") ?? undefined;
}

function getEpisodeUrl(item: Element): string | undefined {
  return getText(item, "link") || getEpisodeAudio(item);
}

function cleanDescription(value: string): string {
  const textOnly = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return textOnly || "Episode podcast Radio SBL.";
}

export function parsePodcastFeed(xmlText: string, sourceUrl: string): PodcastFeed {
  const document = new DOMParser().parseFromString(xmlText, "application/xml");
  const parserError = document.querySelector("parsererror");

  if (parserError) {
    throw new Error("Feed podcast tidak dapat dibaca.");
  }

  const channel = document.querySelector("channel");

  if (!channel) {
    throw new Error("Format feed podcast tidak dikenali.");
  }

  const channelImage =
    channel.querySelector("image url")?.textContent?.trim() ||
    channel.querySelector("itunes\\:image")?.getAttribute("href") ||
    DEFAULT_PODCAST_IMAGE_URL;

  const episodes = Array.from(channel.querySelectorAll("item")).map((item, index) => {
    const title = getText(item, "title") || `Episode ${index + 1}`;
    const guid = getText(item, "guid") || getEpisodeUrl(item) || `${sourceUrl}-${index}`;

    return {
      id: guid,
      title,
      description: cleanDescription(
        getText(item, "description") || getText(item, "itunes\\:summary")
      ),
      publishedAt: getText(item, "pubDate"),
      duration: getText(item, "itunes\\:duration"),
      imageUrl: getEpisodeImage(item, channelImage),
      audioUrl: getEpisodeAudio(item),
      episodeUrl: getEpisodeUrl(item)
    };
  });

  return {
    title: getText(channel, "title") || "Podcast Radio SBL",
    description: cleanDescription(
      getText(channel, "description") || getText(channel, "itunes\\:summary")
    ),
    imageUrl: channelImage,
    sourceUrl,
    episodes
  };
}

export function getConfiguredPodcastFeedUrl(): string {
  return (
    import.meta.env.VITE_PODCAST_FEED_URL ??
    import.meta.env.VITE_PODCAST_RSS_URL ??
    ""
  ).trim();
}

function isLocalPodcastEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function isLocalPodcastProxyEnabled(): boolean {
  return ["true", "1", "yes"].includes(
    String(import.meta.env.VITE_ENABLE_LOCAL_PODCAST_PROXY ?? "").trim().toLowerCase()
  );
}

export function getConfiguredPodcastApiEndpoint(): string {
  const endpoint = (
    import.meta.env.VITE_PODCAST_API_ENDPOINT ??
    import.meta.env.VITE_SPOTIFY_SHOW_EPISODES_ENDPOINT ??
    ""
  ).trim();

  if (import.meta.env.DEV && isLocalPodcastEndpoint(endpoint) && !isLocalPodcastProxyEnabled()) {
    return "";
  }

  return endpoint;
}

export async function loadPodcastFeed(feedUrl: string): Promise<PodcastFeed> {
  const response = await fetch(feedUrl);

  if (!response.ok) {
    throw new Error("Feed podcast belum bisa dimuat.");
  }

  return parsePodcastFeed(await response.text(), feedUrl);
}

function formatSpotifyDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((part) => String(part).padStart(2, "0"))
      .join(":");
  }

  return [minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

function pickLargestImage(images: SpotifyImage[] | undefined, fallback: string): string {
  if (!images || images.length === 0) {
    return fallback;
  }

  return [...images].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? fallback;
}

export async function loadSpotifyPodcastFeed(
  endpoint: string,
  showId = DEFAULT_SPOTIFY_SHOW_ID
): Promise<PodcastFeed> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      showId,
      market: "ID",
      limit: 50
    })
  });

  const payload = (await response.json().catch(() => ({}))) as
    | SpotifyShowEpisodesResponse
    | { error?: string };

  if (!response.ok || "error" in payload) {
    const errorMessage = "error" in payload ? payload.error : "";
    throw new Error(errorMessage || "Episode Spotify belum bisa dimuat.");
  }

  const show = payload as SpotifyShowEpisodesResponse;

  return {
    title: show.name || "Podcast Radio SBL",
    description: cleanDescription(show.description),
    imageUrl: show.imageUrl || DEFAULT_PODCAST_IMAGE_URL,
    sourceUrl: show.sourceUrl || DEFAULT_PODCAST_SOURCE_URL,
    episodes: show.episodes.map((episode) => ({
      id: episode.id,
      title: episode.name,
      description: cleanDescription(episode.description),
      publishedAt: episode.release_date,
      duration: formatSpotifyDuration(episode.duration_ms),
      imageUrl: pickLargestImage(episode.images, show.imageUrl || DEFAULT_PODCAST_IMAGE_URL),
      episodeUrl: episode.external_urls?.spotify
    }))
  };
}
