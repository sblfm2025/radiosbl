import { createServer } from "node:http";
import {
  driveScope,
  exchangeCodeForToken,
  loadDotEnv,
  loadOAuthClient,
  resolveRedirectUri,
  saveToken
} from "./google-drive-lib.mjs";

await loadDotEnv();

const client = await loadOAuthClient();
const redirectUri = resolveRedirectUri(client);
const redirectUrl = new URL(redirectUri);

if (redirectUrl.hostname !== "localhost" && redirectUrl.hostname !== "127.0.0.1") {
  throw new Error("GOOGLE_DRIVE_REDIRECT_URI harus mengarah ke localhost untuk script OAuth lokal.");
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", client.clientId);
authUrl.searchParams.set("redirect_uri", redirectUri);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", driveScope);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

console.log("Buka URL ini, login dengan akun Google Drive tujuan, lalu izinkan akses:");
console.log(authUrl.toString());
console.log(`Menunggu callback OAuth di ${redirectUri}`);

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", redirectUri);
    if (requestUrl.pathname !== redirectUrl.pathname) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const code = requestUrl.searchParams.get("code");
    if (!code) {
      throw new Error(requestUrl.searchParams.get("error") ?? "OAuth code tidak ditemukan.");
    }

    const token = await exchangeCodeForToken({ code, client, redirectUri });
    await saveToken(token);

    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Google Drive OAuth berhasil. Tab ini boleh ditutup.");
    console.log("Token Google Drive tersimpan. Jalankan npm run drive:server untuk endpoint upload.");
    server.close();
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.message : "OAuth gagal.");
    console.error(error);
    server.close();
  }
});

server.listen(Number(redirectUrl.port || 80), redirectUrl.hostname);
