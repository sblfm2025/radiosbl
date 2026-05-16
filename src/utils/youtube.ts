const youtubeHostPattern = /(^|\.)youtube\.com$|(^|\.)youtu\.be$/;

export function parseYouTubeVideoId(input: string): string | null {
  try {
    const url = new URL(input);

    if (!youtubeHostPattern.test(url.hostname)) {
      return null;
    }

    if (url.hostname.endsWith("youtu.be")) {
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (url.pathname === "/watch") {
      return url.searchParams.get("v");
    }

    const parts = url.pathname.split("/").filter(Boolean);
    if (["embed", "live", "shorts"].includes(parts[0])) {
      return parts[1] ?? null;
    }

    return null;
  } catch {
    return null;
  }
}

export function toYouTubeEmbedUrl(input: string): string | null {
  const videoId = parseYouTubeVideoId(input);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}
