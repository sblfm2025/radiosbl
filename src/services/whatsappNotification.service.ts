export type WhatsAppNotificationInput = {
  to?: string;
  text: string;
};

export type WhatsAppNotificationResult = {
  delivered: boolean;
  messageId?: string;
  fallbackReason?: string;
};

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  return digits;
}

export function buildWhatsAppDeepLink(input: WhatsAppNotificationInput): string | undefined {
  if (!input.to) {
    return undefined;
  }

  const normalizedPhone = normalizePhone(input.to);

  if (!normalizedPhone) {
    return undefined;
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(input.text)}`;
}

export async function sendWhatsAppNotification(
  input: WhatsAppNotificationInput
): Promise<WhatsAppNotificationResult> {
  const proxyEndpoint = import.meta.env.VITE_WHATSAPP_PROXY_ENDPOINT as string | undefined;

  if (!proxyEndpoint || !input.to) {
    return {
      delivered: false,
      fallbackReason: !input.to ? "Nomor WhatsApp tujuan belum tersedia." : "Proxy WhatsApp belum dikonfigurasi."
    };
  }

  try {
    const response = await fetch(proxyEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: normalizePhone(input.to),
        text: input.text
      })
    });

    if (!response.ok) {
      return {
        delivered: false,
        fallbackReason: `Proxy WhatsApp gagal dengan status ${response.status}.`
      };
    }

    const data = (await response.json()) as { messageId?: string; id?: string };

    return {
      delivered: true,
      messageId: data.messageId || data.id
    };
  } catch (error) {
    return {
      delivered: false,
      fallbackReason: error instanceof Error ? error.message : "Proxy WhatsApp tidak dapat diakses."
    };
  }
}
