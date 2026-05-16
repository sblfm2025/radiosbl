import { toYouTubeEmbedUrl } from "../utils/youtube";

export function buildYouTubeEmbed(input: string): string {
  const embedUrl = toYouTubeEmbedUrl(input);

  if (!embedUrl) {
    throw new Error("URL YouTube tidak valid.");
  }

  return embedUrl;
}
