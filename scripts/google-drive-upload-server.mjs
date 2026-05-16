import { createServer } from "node:http";
import {
  escapeDriveQueryValue,
  loadDotEnv,
  loadOAuthClient,
  readToken,
  refreshAccessToken
} from "./google-drive-lib.mjs";

await loadDotEnv();

const uploadPort = Number(process.env.GOOGLE_DRIVE_UPLOAD_PORT || 8787);
const rootFolderName = process.env.GOOGLE_DRIVE_ROOT_FOLDER || "LPPL-RADIO";
const client = await loadOAuthClient();

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": process.env.GOOGLE_DRIVE_ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function parseMultipart(buffer, contentType) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = boundaryMatch?.[1] ?? boundaryMatch?.[2];
  if (!boundary) {
    throw new Error("Boundary multipart tidak ditemukan.");
  }

  const delimiter = Buffer.from(`--${boundary}`);
  const fields = {};
  let file;
  let cursor = 0;

  while (cursor < buffer.length) {
    const partStart = buffer.indexOf(delimiter, cursor);
    if (partStart === -1) break;

    const contentStart = partStart + delimiter.length;
    if (buffer.slice(contentStart, contentStart + 2).toString() === "--") break;

    const headersStart = contentStart + 2;
    const headersEnd = buffer.indexOf(Buffer.from("\r\n\r\n"), headersStart);
    if (headersEnd === -1) break;

    const nextBoundary = buffer.indexOf(delimiter, headersEnd + 4);
    if (nextBoundary === -1) break;

    const rawHeaders = buffer.slice(headersStart, headersEnd).toString("utf8");
    const body = buffer.slice(headersEnd + 4, Math.max(headersEnd + 4, nextBoundary - 2));
    const disposition = rawHeaders.match(/content-disposition:\s*form-data;([^\r\n]+)/i)?.[1] ?? "";
    const name = disposition.match(/name="([^"]+)"/i)?.[1];
    const filename = disposition.match(/filename="([^"]*)"/i)?.[1];
    const mimeType = rawHeaders.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim();

    if (name && filename !== undefined) {
      file = { fieldName: name, name: filename, mimeType: mimeType || "application/octet-stream", buffer: body };
    } else if (name) {
      fields[name] = body.toString("utf8");
    }

    cursor = nextBoundary;
  }

  return { fields, file };
}

function sanitizeName(value) {
  return value
    .split("")
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || '<>:"/\\|?*'.includes(character) ? "-" : character;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

async function driveFetch(path, { accessToken, method = "GET", headers = {}, body } = {}) {
  const response = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
    method,
    headers: { Authorization: `Bearer ${accessToken}`, ...headers },
    body
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(`Google Drive API error: ${JSON.stringify(json)}`);
  }
  return json;
}

async function ensureFolder({ accessToken, name, parentId }) {
  const query = [
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    `name = '${escapeDriveQueryValue(name)}'`,
    parentId ? `'${escapeDriveQueryValue(parentId)}' in parents` : "'root' in parents"
  ].join(" and ");

  const search = await driveFetch(
    `/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=1`,
    { accessToken }
  );

  if (search.files?.[0]?.id) {
    return search.files[0].id;
  }

  const metadata = {
    name,
    mimeType: "application/vnd.google-apps.folder",
    ...(parentId ? { parents: [parentId] } : {})
  };

  const created = await driveFetch("/files?fields=id", {
    accessToken,
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(metadata)
  });

  return created.id;
}

async function uploadFile({ accessToken, file, moduleName, ownerId }) {
  const rootFolderId = await ensureFolder({ accessToken, name: rootFolderName });
  const moduleFolderId = await ensureFolder({
    accessToken,
    name: sanitizeName(moduleName || "uploads"),
    parentId: rootFolderId
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const driveFileName = sanitizeName(`${timestamp}-${ownerId || "unknown"}-${file.name}`);
  const boundary = `radio-sbl-${Date.now()}`;
  const metadata = {
    name: driveFileName,
    mimeType: file.mimeType,
    parents: [moduleFolderId],
    description: `Radio SBL upload module=${moduleName || "uploads"} owner=${ownerId || "unknown"}`
  };

  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`),
    Buffer.from(JSON.stringify(metadata)),
    Buffer.from(`\r\n--${boundary}\r\nContent-Type: ${file.mimeType}\r\n\r\n`),
    file.buffer,
    Buffer.from(`\r\n--${boundary}--`)
  ]);

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,createdTime",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": String(body.length)
      },
      body
    }
  );

  const uploaded = await response.json();
  if (!response.ok) {
    throw new Error(`Upload Google Drive gagal: ${JSON.stringify(uploaded)}`);
  }

  return {
    id: uploaded.id,
    driveFileId: uploaded.id,
    name: uploaded.name,
    mimeType: uploaded.mimeType,
    size: Number(uploaded.size ?? file.buffer.length),
    webViewLink: uploaded.webViewLink,
    module: moduleName || "uploads",
    ownerId: ownerId || "unknown",
    createdAt: uploaded.createdTime ?? new Date().toISOString()
  };
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "OPTIONS") {
      sendJson(response, 204, {});
      return;
    }

    if (request.method !== "POST" || request.url !== "/upload") {
      sendJson(response, 404, { error: "Endpoint tidak ditemukan." });
      return;
    }

    const contentType = request.headers["content-type"] ?? "";
    if (!contentType.includes("multipart/form-data")) {
      sendJson(response, 415, { error: "Gunakan multipart/form-data." });
      return;
    }

    const body = await readRequestBody(request);
    const { fields, file } = parseMultipart(body, contentType);
    if (!file) {
      sendJson(response, 400, { error: "Field file wajib dikirim." });
      return;
    }

    const token = await refreshAccessToken({ token: await readToken(), client });
    const driveFile = await uploadFile({
      accessToken: token.access_token,
      file,
      moduleName: fields.module,
      ownerId: fields.ownerId
    });

    sendJson(response, 200, driveFile);
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Upload Google Drive gagal."
    });
  }
});

server.listen(uploadPort, () => {
  console.log(`Google Drive upload endpoint aktif: http://localhost:${uploadPort}/upload`);
});
