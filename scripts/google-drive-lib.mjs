import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export const driveScope = "https://www.googleapis.com/auth/drive.file";
export const defaultTokenPath = "C:/tmp/radio-sbl-google-drive-token.json";

export async function loadDotEnv(path = ".env.local") {
  try {
    const content = await readFile(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const [key, ...valueParts] = trimmed.split("=");
      if (!process.env[key]) {
        process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // .env.local is optional for CI and docs-only checks.
  }
}

export async function loadOAuthClient() {
  const clientSecretPath = process.env.GOOGLE_DRIVE_CLIENT_SECRET_PATH;
  if (!clientSecretPath) {
    throw new Error("GOOGLE_DRIVE_CLIENT_SECRET_PATH belum diatur.");
  }

  const raw = await readFile(clientSecretPath, "utf8");
  const parsed = JSON.parse(raw);
  const config = parsed.web ?? parsed.installed;

  if (!config?.client_id || !config?.client_secret) {
    throw new Error("File client secret Google OAuth tidak valid.");
  }

  return {
    clientId: config.client_id,
    clientSecret: config.client_secret,
    redirectUris: config.redirect_uris ?? []
  };
}

export function resolveRedirectUri(client) {
  if (process.env.GOOGLE_DRIVE_REDIRECT_URI) {
    return process.env.GOOGLE_DRIVE_REDIRECT_URI;
  }

  return (
    client.redirectUris.find((uri) => uri.startsWith("http://localhost")) ??
    "http://localhost:8788/oauth2callback"
  );
}

export function getTokenPath() {
  return process.env.GOOGLE_DRIVE_TOKEN_PATH || defaultTokenPath;
}

export async function readToken() {
  return JSON.parse(await readFile(getTokenPath(), "utf8"));
}

export async function saveToken(token) {
  const tokenPath = getTokenPath();
  await mkdir(dirname(tokenPath), { recursive: true });
  await writeFile(tokenPath, JSON.stringify(token, null, 2));
}

export async function exchangeCodeForToken({ code, client, redirectUri }) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: client.clientId,
      client_secret: client.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });

  const token = await response.json();
  if (!response.ok) {
    throw new Error(`Gagal menukar OAuth code: ${JSON.stringify(token)}`);
  }

  return {
    ...token,
    expires_at: Date.now() + Number(token.expires_in ?? 0) * 1000
  };
}

export async function refreshAccessToken({ token, client }) {
  if (token.access_token && token.expires_at && Date.now() < token.expires_at - 60_000) {
    return token;
  }

  if (!token.refresh_token) {
    throw new Error("Refresh token Google Drive belum tersedia. Jalankan npm run drive:auth.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: client.clientId,
      client_secret: client.clientSecret,
      refresh_token: token.refresh_token,
      grant_type: "refresh_token"
    })
  });

  const refreshed = await response.json();
  if (!response.ok) {
    throw new Error(`Gagal refresh token Google Drive: ${JSON.stringify(refreshed)}`);
  }

  const nextToken = {
    ...token,
    ...refreshed,
    refresh_token: token.refresh_token,
    expires_at: Date.now() + Number(refreshed.expires_in ?? 0) * 1000
  };
  await saveToken(nextToken);
  return nextToken;
}

export function escapeDriveQueryValue(value) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
