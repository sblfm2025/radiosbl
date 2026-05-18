import { getEnv } from "../lib/env";

export const PINRANG_BERKABAR_PLAYLIST_ID = "PLFv9iRIehC6xWCtxh_tJRbGiVJN5Hb61V";
export const PINRANG_BERKABAR_PLAYLIST_URL = `https://www.youtube.com/playlist?list=${PINRANG_BERKABAR_PLAYLIST_ID}`;

export type PinrangBerkabarVideo = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt?: string;
  channelTitle: string;
  url: string;
  source: "proxy" | "youtube-api" | "fallback";
};

export type PinrangBerkabarVideoFeed = {
  videos: PinrangBerkabarVideo[];
  nextPageToken?: string;
  source: PinrangBerkabarVideo["source"];
};

type YouTubePlaylistItem = {
  id?: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    channelTitle?: string;
    thumbnails?: {
      maxres?: { url?: string };
      standard?: { url?: string };
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
    resourceId?: {
      videoId?: string;
    };
  };
  contentDetails?: {
    videoId?: string;
  };
};

type YouTubePlaylistResponse = {
  items?: YouTubePlaylistItem[];
  nextPageToken?: string;
};

function isVideoListPayload(payload: unknown): payload is { videos: PinrangBerkabarVideo[]; nextPageToken?: string } {
  return typeof payload === "object" &&
    payload !== null &&
    "videos" in payload &&
    Array.isArray((payload as { videos?: unknown }).videos);
}

function normalizePlaylistItems(items: YouTubePlaylistItem[] | undefined, source: PinrangBerkabarVideo["source"]) {
  return (items ?? [])
    .map((item, index): PinrangBerkabarVideo | null => {
      const videoId = item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;
      if (!videoId) return null;

      return {
        id: videoId,
        title: item.snippet?.title || `Video Pinrang Berkabar ${index + 1}`,
        description: item.snippet?.description || "Video terbaru dari playlist Pinrang Berkabar.",
        thumbnailUrl:
          item.snippet?.thumbnails?.maxres?.url ??
          item.snippet?.thumbnails?.standard?.url ??
          item.snippet?.thumbnails?.high?.url ??
          item.snippet?.thumbnails?.medium?.url ??
          item.snippet?.thumbnails?.default?.url ??
          "/LogoSBL.svg",
        publishedAt: item.snippet?.publishedAt,
        channelTitle: item.snippet?.channelTitle || "Radio SBL",
        url: `https://www.youtube.com/watch?v=${videoId}&list=${PINRANG_BERKABAR_PLAYLIST_ID}`,
        source
      };
    })
    .filter((item): item is PinrangBerkabarVideo => Boolean(item));
}

export function getPinrangBerkabarFallback(): PinrangBerkabarVideo[] {
  return [
    {
      id: "pinrang-berkabar-playlist",
      title: "Playlist Pinrang Berkabar",
      description: "Buka playlist resmi YouTube Radio SBL untuk melihat video Pinrang Berkabar terbaru.",
      thumbnailUrl: "/LogoSBL.svg",
      channelTitle: "Radio SBL",
      url: PINRANG_BERKABAR_PLAYLIST_URL,
      source: "fallback"
    }
  ];
}

export async function listPinrangBerkabarVideos(pageToken?: string): Promise<PinrangBerkabarVideoFeed> {
  const proxyUrl = getEnv("VITE_PINRANG_BERKABAR_FEED_URL");

  if (proxyUrl) {
    const url = new URL(proxyUrl, window.location.origin);
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Feed Pinrang Berkabar belum merespons.");
    }
    const payload = await response.json() as unknown;
    if (isVideoListPayload(payload)) {
      return {
        videos: payload.videos.map((video) => ({ ...video, source: "proxy" })),
        nextPageToken: payload.nextPageToken,
        source: "proxy"
      };
    }
    const playlistPayload = payload as YouTubePlaylistResponse;
    return {
      videos: normalizePlaylistItems(playlistPayload.items, "proxy"),
      nextPageToken: playlistPayload.nextPageToken,
      source: "proxy"
    };
  }

  const apiKey = getEnv("VITE_YOUTUBE_API_KEY");
  if (!apiKey) {
    return {
      videos: getPinrangBerkabarFallback(),
      source: "fallback"
    };
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("playlistId", PINRANG_BERKABAR_PLAYLIST_ID);
  url.searchParams.set("maxResults", "12");
  url.searchParams.set("key", apiKey);
  if (pageToken) {
    url.searchParams.set("pageToken", pageToken);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("YouTube API belum bisa memuat playlist.");
  }

  const payload = await response.json() as YouTubePlaylistResponse;
  return {
    videos: normalizePlaylistItems(payload.items, "youtube-api"),
    nextPageToken: payload.nextPageToken,
    source: "youtube-api"
  };
}
