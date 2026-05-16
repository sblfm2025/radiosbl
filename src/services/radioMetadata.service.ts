import { findCurrentBroadcastSlot } from "../utils/scheduleClock";

export type ParsedTrack = {
  artist: string;
  title: string;
};

export type TrackHistoryItem = ParsedTrack & {
  albumArtUrl: string;
  playedAt: string;
};

export type RadioMetadata = ParsedTrack & {
  rawTitle: string;
  albumArtUrl: string;
  isOnline: boolean;
  listeners: number;
  updatedAt: string;
  history: TrackHistoryItem[];
};

type IcecastSource = {
  title?: string;
  yp_currently_playing?: string;
  listeners?: number;
};

type IcecastPayload = {
  icestats?: {
    source?: IcecastSource | IcecastSource[];
  };
};

const STATUS_URL = "https://pu.klikhost.com/proxy/sbl/status-json.xsl";
const FALLBACK_ARTIST = "SBL RADIO";
const FALLBACK_TITLE = "Live Streaming";
const FALLBACK_ALBUM_ART = "/LogoSBL.svg";
const TRACK_HISTORY_KEY = "radio-sbl-track-history";
const ALBUM_ART_CACHE_KEY = "radio-sbl-album-art-cache";
const MAX_HISTORY = 5;

function unique(value: string, index: number, values: string[]) {
  return value.length > 0 && values.indexOf(value) === index;
}

function removeNoiseToken(value: string): string {
  return value
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\b(?:www\.)?[a-z0-9-]+\.(?:com|net|org|id|co|xyz|info|me)\b/gi, " ")
    .replace(/\([^)]*(?:official|video|lyrics?|audio|youtube|hd|hq|download|converter)[^)]*\)/gi, " ")
    .replace(/\[[^\]]*(?:official|video|lyrics?|audio|youtube|hd|hq|download|converter)[^\]]*\]/gi, " ")
    .replace(/\b(?:official|video|lyrics?|lyric|audio|youtube|yt|hd|hq|4k|download|converter|mp3|mp4|planetlagu|stafaband|gudanglagu|metrolagu|savefrom|y2mate)\b/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+[-–—]\s+$/g, "")
    .replace(/^\s+[-–—]\s+/g, "")
    .trim();
}

export function cleanTrackMetadata(value: string): string {
  return value
    .split(/\s+[-–—]\s+/)
    .map(removeNoiseToken)
    .filter(unique)
    .join(" - ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseTrackMetadata(value?: string): ParsedTrack {
  const cleaned = cleanTrackMetadata(value ?? "");

  if (!cleaned) {
    return {
      artist: FALLBACK_ARTIST,
      title: FALLBACK_TITLE
    };
  }

  const parts = cleaned
    .split(/\s+[-–—]\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return {
      artist: parts[0],
      title: parts.slice(1).join(" - ")
    };
  }

  return {
    artist: FALLBACK_ARTIST,
    title: parts[0] || FALLBACK_TITLE
  };
}

function getSafeLocalStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readJson<T>(key: string, fallback: T): T {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return fallback;
  }

  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage can fail in private mode or when quota is full.
  }
}

export function getTrackHistory(): TrackHistoryItem[] {
  return readJson<TrackHistoryItem[]>(TRACK_HISTORY_KEY, []);
}

function saveTrackToHistory(track: ParsedTrack, albumArtUrl: string): TrackHistoryItem[] {
  const nextItem: TrackHistoryItem = {
    ...track,
    albumArtUrl,
    playedAt: new Date().toISOString()
  };
  const history = getTrackHistory();
  const deduped = history.filter(
    (item) => item.artist !== track.artist || item.title !== track.title
  );
  const nextHistory = [nextItem, ...deduped].slice(0, MAX_HISTORY);
  writeJson(TRACK_HISTORY_KEY, nextHistory);
  return nextHistory;
}

function getAlbumArtCacheKey(track: ParsedTrack) {
  return `${track.artist}::${track.title}`.toLowerCase();
}

function readAlbumArtCache(): Record<string, string> {
  return readJson<Record<string, string>>(ALBUM_ART_CACHE_KEY, {});
}

function writeAlbumArtCache(track: ParsedTrack, albumArtUrl: string) {
  const cache = readAlbumArtCache();
  cache[getAlbumArtCacheKey(track)] = albumArtUrl;
  writeJson(ALBUM_ART_CACHE_KEY, cache);
}

function getCachedAlbumArt(track: ParsedTrack): string {
  const cache = readAlbumArtCache();
  return cache[getAlbumArtCacheKey(track)] ?? "";
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function lookupMusicBrainzAlbumArt(track: ParsedTrack): Promise<string> {
  const query = encodeURIComponent(`artist:"${track.artist}" AND recording:"${track.title}"`);
  const payload = await fetchJson<{
    recordings?: Array<{
      releases?: Array<{ id?: string }>;
    }>;
  }>(`https://musicbrainz.org/ws/2/recording?query=${query}&fmt=json&inc=releases&limit=1`);
  const releaseId = payload?.recordings?.[0]?.releases?.[0]?.id;

  if (!releaseId) {
    return "";
  }

  const coverPayload = await fetchJson<{
    images?: Array<{ front?: boolean; image?: string; thumbnails?: { large?: string } }>;
  }>(`https://coverartarchive.org/release/${releaseId}`);
  const image = coverPayload?.images?.find((item) => item.front) ?? coverPayload?.images?.[0];

  return image?.thumbnails?.large ?? image?.image ?? "";
}

async function lookupItunesAlbumArt(track: ParsedTrack): Promise<string> {
  const term = encodeURIComponent(`${track.artist} ${track.title}`);
  const payload = await fetchJson<{
    results?: Array<{ artworkUrl100?: string }>;
  }>(`https://itunes.apple.com/search?term=${term}&entity=song&limit=1`);
  const artwork = payload?.results?.[0]?.artworkUrl100;

  return artwork?.replace("100x100bb", "600x600bb") ?? "";
}

export async function lookupAlbumArt(track: ParsedTrack): Promise<string> {
  if (track.artist === FALLBACK_ARTIST && track.title === FALLBACK_TITLE) {
    return FALLBACK_ALBUM_ART;
  }

  const cached = getCachedAlbumArt(track);
  if (cached) {
    return cached;
  }

  const albumArtUrl =
    (await lookupMusicBrainzAlbumArt(track)) ||
    (await lookupItunesAlbumArt(track)) ||
    FALLBACK_ALBUM_ART;

  writeAlbumArtCache(track, albumArtUrl);
  return albumArtUrl;
}

function getIcecastSource(payload: IcecastPayload): IcecastSource | null {
  const source = payload.icestats?.source;
  if (Array.isArray(source)) {
    return source[0] ?? null;
  }
  return source ?? null;
}

export async function fetchRadioMetadata(statusUrl = STATUS_URL): Promise<RadioMetadata> {
  const payload = await fetchJson<IcecastPayload>(statusUrl);
  const source = payload ? getIcecastSource(payload) : null;
  const rawTitle = source?.title || source?.yp_currently_playing || "";
  const track = parseTrackMetadata(rawTitle);
  const albumArtUrl = await lookupAlbumArt(track);
  const history = saveTrackToHistory(track, albumArtUrl);

  return {
    ...track,
    rawTitle,
    albumArtUrl,
    isOnline: Boolean(source),
    listeners: source?.listeners ?? 0,
    updatedAt: new Date().toISOString(),
    history
  };
}

export function resolveOnAirAnnouncer(attendanceUserIds: string[] = [], date = new Date()) {
  const slot = findCurrentBroadcastSlot(date);

  if (slot.type !== "main") {
    return "";
  }

  if (attendanceUserIds.length === 0) {
    return slot.announcer;
  }

  const presentNames = attendanceUserIds.map((value) => value.toLowerCase());
  return slot.announcer
    .split(/\s*(?:&|\/|,)\s*/)
    .map((name) => name.trim())
    .filter((name) => presentNames.includes(name.toLowerCase()))
    .join(" & ");
}

export const radioMetadataFallback: RadioMetadata = {
  artist: FALLBACK_ARTIST,
  title: FALLBACK_TITLE,
  rawTitle: "",
  albumArtUrl: FALLBACK_ALBUM_ART,
  isOnline: false,
  listeners: 0,
  updatedAt: "",
  history: []
};
