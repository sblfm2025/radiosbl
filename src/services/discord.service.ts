export type DiscordNotification = {
  webhookUrl: string;
  content: string;
};

export async function sendDiscordNotification({
  webhookUrl,
  content
}: DiscordNotification): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  });

  if (!response.ok) {
    throw new Error("Gagal mengirim notifikasi Discord.");
  }
}
