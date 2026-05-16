import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildWhatsAppDeepLink,
  sendWhatsAppNotification
} from "../services/whatsappNotification.service";

describe("whatsapp notification service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("builds a WhatsApp deep link with normalized Indonesian phone numbers", () => {
    const url = buildWhatsAppDeepLink({
      to: "0851-2256-1992",
      text: "Request lagu Radio SBL"
    });

    expect(url).toContain("https://wa.me/6285122561992");
    expect(url).toContain("Request%20lagu%20Radio%20SBL");
  });

  it("returns fallback result when proxy endpoint is not configured", async () => {
    const result = await sendWhatsAppNotification({
      to: "085122561992",
      text: "Halo SBL"
    });

    expect(result.delivered).toBe(false);
    expect(result.fallbackReason).toContain("Proxy WhatsApp");
  });

  it("posts to the configured proxy endpoint", async () => {
    vi.stubEnv("VITE_WHATSAPP_PROXY_ENDPOINT", "http://localhost:8788/whatsapp/send");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: "wamid.test" })
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendWhatsAppNotification({
      to: "085122561992",
      text: "Halo SBL"
    });

    expect(result).toMatchObject({
      delivered: true,
      messageId: "wamid.test"
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8788/whatsapp/send",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          to: "6285122561992",
          text: "Halo SBL"
        })
      })
    );
  });
});
