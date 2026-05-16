import { describe, expect, it } from "vitest";
import { parseYouTubeVideoId, toYouTubeEmbedUrl } from "../utils/youtube";

describe("youtube parser", () => {
  it("parses watch URLs", () => {
    expect(parseYouTubeVideoId("https://www.youtube.com/watch?v=abc123")).toBe(
      "abc123"
    );
  });

  it("parses short URLs", () => {
    expect(parseYouTubeVideoId("https://youtu.be/live987")).toBe("live987");
  });

  it("builds embed URLs", () => {
    expect(toYouTubeEmbedUrl("https://www.youtube.com/live/live987")).toBe(
      "https://www.youtube.com/embed/live987"
    );
  });

  it("rejects non-youtube URLs", () => {
    expect(parseYouTubeVideoId("https://example.com/watch?v=abc123")).toBeNull();
  });
});
