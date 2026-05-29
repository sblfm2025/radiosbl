const { onRequest } = require("firebase-functions/v2/https");

const DEFAULT_ALLOWED_ORIGIN = "https://radiosbl.web.app";
const DRIVE_ROOT_FOLDER = process.env.GOOGLE_DRIVE_ROOT_FOLDER || "LPPL-RADIO";

function normalizeEnvValue(value) {
  return String(value || "").trim().replace(/^['"]|['"]$/g, "");
}

function getAllowedOrigin(request) {
  const origin = request.headers.origin || "";
  const configured = normalizeEnvValue(process.env.NOTIFICATION_PROXY_ALLOWED_ORIGIN);

  if (configured) {
    return configured;
  }

  if (origin === DEFAULT_ALLOWED_ORIGIN || /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin)) {
    return origin;
  }

  return DEFAULT_ALLOWED_ORIGIN;
}

function sendJson(request, response, statusCode, data) {
  response.set("Access-Control-Allow-Origin", getAllowedOrigin(request));
  response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.status(statusCode).json(data);
}

function escapeDriveQueryValue(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function sanitizeDriveName(value) {
  return String(value || "")
    .split("")
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || '<>:"/\\|?*'.includes(character) ? "-" : character;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function parseMultipartBuffer(buffer, contentType) {
  const boundaryMatch = String(contentType || "").match(/boundary=(?:"([^"]+)"|([^;]+))/i);
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
      file = {
        fieldName: name,
        name: sanitizeDriveName(filename || "upload"),
        mimeType: mimeType || "application/octet-stream",
        buffer: body
      };
    } else if (name) {
      fields[name] = body.toString("utf8");
    }

    cursor = nextBoundary;
  }

  return { fields, file };
}

async function refreshGoogleDriveAccessToken() {
  const clientId = normalizeEnvValue(process.env.GOOGLE_DRIVE_CLIENT_ID);
  const clientSecret = normalizeEnvValue(process.env.GOOGLE_DRIVE_CLIENT_SECRET);
  const refreshToken = normalizeEnvValue(process.env.GOOGLE_DRIVE_REFRESH_TOKEN);

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Konfigurasi Google Drive upload belum lengkap di Functions.");
  }

  const result = await fetchJsonWithTimeout(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token"
      })
    },
    20_000
  );

  if (!result.response.ok) {
    throw new Error(result.data.error_description || result.data.error || "Gagal refresh token Google Drive.");
  }

  return result.data.access_token;
}

async function driveFetch(path, { accessToken, method = "GET", headers = {}, body } = {}) {
  const response = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
    method,
    headers: { Authorization: `Bearer ${accessToken}`, ...headers },
    body
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error?.message || `Google Drive API error: ${JSON.stringify(json)}`);
  }
  return json;
}

async function ensureDriveFolder({ accessToken, name, parentId }) {
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

  const created = await driveFetch("/files?fields=id", {
    accessToken,
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      ...(parentId ? { parents: [parentId] } : {})
    })
  });

  return created.id;
}

async function uploadFileToDrive({ accessToken, file, moduleName, ownerId }) {
  const rootFolderId = await ensureDriveFolder({ accessToken, name: DRIVE_ROOT_FOLDER });
  const moduleFolderId = await ensureDriveFolder({
    accessToken,
    name: sanitizeDriveName(moduleName || "uploads"),
    parentId: rootFolderId
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const driveFileName = sanitizeDriveName(`${timestamp}-${ownerId || "unknown"}-${file.name}`);
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
    throw new Error(uploaded.error?.message || `Upload Google Drive gagal: ${JSON.stringify(uploaded)}`);
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

async function uploadGoogleDriveFile(request) {
  const contentType = request.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    throw new Error("Gunakan multipart/form-data.");
  }

  const body = request.rawBody || Buffer.from([]);
  const { fields, file } = parseMultipartBuffer(body, contentType);
  if (!file) {
    throw new Error("Field file wajib dikirim.");
  }

  const accessToken = await refreshGoogleDriveAccessToken();
  return uploadFileToDrive({
    accessToken,
    file,
    moduleName: fields.module,
    ownerId: fields.ownerId
  });
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  return digits;
}

function getGeminiApiKeys() {
  return (
    process.env.GEMINI_API_KEYS ||
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEYS ||
    process.env.VITE_GEMINI_API_KEY ||
    ""
  )
    .split(",")
    .map((key) => normalizeEnvValue(key))
    .filter(Boolean);
}


function getGeminiModels() {
  return (process.env.GEMINI_MODELS || process.env.GEMINI_MODEL || "gemini-2.5-flash")
    .split(",")
    .map((model) => normalizeEnvValue(model))
    .filter(Boolean);
}

function getSpotifyCredentials() {
  const clientId = normalizeEnvValue(process.env.SPOTIFY_CLIENT_ID);
  const clientSecret = normalizeEnvValue(process.env.SPOTIFY_CLIENT_SECRET);

  return { clientId, clientSecret };
}

async function fetchJsonWithTimeout(url, options, timeoutMs = 20_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  } finally {
    clearTimeout(timeout);
  }
}

async function getSpotifyAccessToken() {
  const { clientId, clientSecret } = getSpotifyCredentials();

  if (!clientId || !clientSecret) {
    throw new Error("SPOTIFY_CLIENT_ID dan SPOTIFY_CLIENT_SECRET belum dikonfigurasi di proxy.");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const { response, data } = await fetchJsonWithTimeout(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    }
  );

  if (!response.ok) {
    throw new Error(data.error_description || data.error || "Token Spotify gagal dibuat.");
  }

  return data.access_token;
}

function pickLargestSpotifyImage(images) {
  return [...(images || [])].sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || "";
}

async function getSpotifyShowEpisodes(body) {
  const showId = normalizeEnvValue(body.showId || "5E9y3LGQv233K22ZzYANLF");
  const market = normalizeEnvValue(body.market || "ID");
  const limit = Math.min(Math.max(Number(body.limit || 50), 1), 50);
  const token = await getSpotifyAccessToken();
  const authorization = { Authorization: `Bearer ${token}` };
  const query = new URLSearchParams({ market, limit: String(limit), offset: "0" });

  const showResult = await fetchJsonWithTimeout(
    `https://api.spotify.com/v1/shows/${encodeURIComponent(showId)}?market=${encodeURIComponent(market)}`,
    { headers: authorization }
  );

  if (!showResult.response.ok) {
    throw new Error(showResult.data.error?.message || "Show Spotify tidak dapat dibaca.");
  }

  const episodesResult = await fetchJsonWithTimeout(
    `https://api.spotify.com/v1/shows/${encodeURIComponent(showId)}/episodes?${query.toString()}`,
    { headers: authorization }
  );

  if (!episodesResult.response.ok) {
    throw new Error(episodesResult.data.error?.message || "Episode Spotify tidak dapat dibaca.");
  }

  return {
    id: showResult.data.id,
    name: showResult.data.name,
    description: showResult.data.description,
    imageUrl: pickLargestSpotifyImage(showResult.data.images),
    sourceUrl: showResult.data.external_urls?.spotify || `https://open.spotify.com/show/${showId}`,
    episodes: episodesResult.data.items || []
  };
}

function buildProgramScriptPrompt(body) {
  const lines = [
    "Susun naskah siaran radio profesional untuk LPPL Radio Suara Bumi Lasinrang 92,4 FM.",
    "Gunakan bahasa Indonesia yang hangat, natural, singkat, dan siap dibaca penyiar.",
    "Jangan mengarang fakta spesifik di luar konteks. Jika butuh data, tulis placeholder yang mudah diisi penyiar.",
    "",
    `Program: ${body.programTitle || "-"}`,
    `Hari/Jam: ${body.day || "-"}, ${body.scheduleTime || "-"}`,
    `Penyiar aktif: ${body.announcerName || "Belum terdeteksi"}`,
    `Durasi target: ${body.durationMinutes || 3} menit`,
    `Gaya: ${body.tone || "hangat dan informatif"}`,
    `Deskripsi program: ${body.description || "-"}`,
    body.intervention ? `Arahan penyiar: ${body.intervention}` : "",
    "",
    "Formatkan dengan bagian: Opening, Bridge/Isi, Cue Lagu/Interaksi, Closing."
  ];

  return lines.filter(Boolean).join("\n");
}

function extractOpenAiText(data) {
  if (data.output_text) {
    return data.output_text;
  }

  return (data.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n");
}

async function sendWhatsAppMessage(body) {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const graphVersion = process.env.WHATSAPP_GRAPH_API_VERSION || "v20.0";
  const to = normalizePhone(body.to);
  const text = String(body.text || "").trim();

  if (!to || !text) {
    throw new Error("Field to dan text wajib diisi.");
  }

  if (!token || !phoneNumberId) {
    return {
      demo: true,
      messageId: `demo-wa-${Date.now()}`,
      to,
      text
    };
  }

  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          preview_url: false,
          body: text
        }
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "WhatsApp Cloud API menolak request.");
  }

  return {
    messageId: data.messages?.[0]?.id,
    to
  };
}

async function generateGeminiDraft(body) {
  const apiKeys = getGeminiApiKeys();
  const models = getGeminiModels();
  const prompt = String(body.prompt || "").trim();
  const context = String(body.context || "").trim();

  if (!prompt) {
    throw new Error("Field prompt wajib diisi.");
  }

  if (apiKeys.length === 0) {
    return {
      demo: true,
      warning: "Gemini API key belum tersedia di proxy.",
      text: `Fallback sementara Radio SBL:\n\n${prompt}`
    };
  }

  // Pilih satu kunci dan satu model secara acak untuk membagi beban
  const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  const model = models[0] || "gemini-2.0-flash"; // Selalu prioritaskan model utama

  const payload = {
    contents: [
      {
        parts: [{ text: [context, prompt].filter(Boolean).join("\n\n") }]
      }
    ]
  };

  try {
    const { response, data } = await fetchJsonWithTimeout(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      // Jika terkena limit (429), jangan coba lagi, langsung beri tahu user
      if (response.status === 429) {
        throw new Error("Kuota API Gemini sedang penuh (Limit Harian). Silakan coba lagi nanti.");
      }
      throw new Error(data.error?.message || `Gemini Error: ${response.status}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n") || "";

    return {
      model,
      text: text || "Gemini merespons, tetapi tidak mengembalikan teks."
    };
  } catch (error) {
    // Jika gagal secara teknis, berikan fallback demo agar aplikasi tetap berjalan
    return {
      demo: true,
      warning: error instanceof Error ? error.message : "Terjadi gangguan koneksi ke AI.",
      text: `[Demo Mode] Hasil draf untuk: ${prompt.substring(0, 50)}...`
    };
  }
}

async function generateOpenAiScript(body) {
  const apiKey = process.env.OPENAI_API_KEY || "";
  const model = process.env.OPENAI_MODEL || "gpt-5-mini";
  const prompt = buildProgramScriptPrompt(body);

  if (!apiKey) {
    return {
      demo: true,
      provider: "demo",
      text: `Draft demo ChatGPT/OpenAI Radio SBL:\n\n${prompt}`
    };
  }

  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: prompt,
      max_output_tokens: Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 900)
    })
  });

  const data = await openAiResponse.json();

  if (!openAiResponse.ok) {
    throw new Error(data.error?.message || "OpenAI API menolak request.");
  }

  return {
    provider: "openai",
    text: extractOpenAiText(data)
  };
}

async function generateAiScriptDraft(body) {
  if (body.provider === "gemini") {
    const prompt = buildProgramScriptPrompt(body);
    const result = await generateGeminiDraft({ prompt });
    return { ...result, provider: "gemini" };
  }

  return generateOpenAiScript(body);
}

async function generateGeminiRewrite(body) {
  const startTime = Date.now();
  const apiKeys = getGeminiApiKeys();
  const models = getGeminiModels();
  const text = String(body.text || "").trim();
  const mode = String(body.mode || "").trim();
  const programTitle = String(body.programTitle || "Unknown Program");

  if (!text) {
    throw new Error("Naskah asli wajib diisi.");
  }
  if (!mode) {
    throw new Error("Mode rewrite wajib ditentukan.");
  }

  console.log(`[rewrite_request] Program: ${programTitle}, Mode: ${mode}`);

  if (apiKeys.length === 0) {
    const errorMsg = "Gemini API key belum tersedia di proxy.";
    console.error(`[rewrite_failed] Program: ${programTitle}, Mode: ${mode}, Duration: ${Date.now() - startTime}ms, Provider: demo, Error: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  let modeInstruction = "";
  switch (mode) {
    case "formal":
      modeInstruction = "Ubah menjadi lebih resmi, lebih rapi, dan lebih profesional.";
      break;
    case "singkat":
      modeInstruction = "Ringkas naskah agar jauh lebih pendek (target: 20-30% lebih ringkas) tanpa menghilangkan inti pesannya.";
      break;
    case "energik":
      modeInstruction = "Ubah menjadi lebih bersemangat, lebih hidup, dan lebih radio-friendly (penuh energi positif).";
      break;
    case "anak-muda":
      modeInstruction = "Ubah menjadi lebih santai dan kekinian ala anak muda (Gen Z), namun tetap sopan, layak siar, dan tidak menggunakan kata kasar.";
      break;
    case "santai":
      modeInstruction = "Ubah menjadi santai, hangat, dan kasual ala ngobrol.";
      break;
    case "profesional":
      modeInstruction = "Ubah menjadi berkelas, elegan, dan profesional untuk target pendengar kelas atas.";
      break;
    default:
      modeInstruction = "Sesuaikan gaya bahasa naskah dengan gaya yang natural untuk siaran radio.";
  }

  const prompt = `
Tugas Anda adalah menulis ulang (rewrite) naskah siaran radio berikut ini.

Instruksi Spesifik: ${modeInstruction}

ATURAN MUTLAK (WAJIB DIPATUHI):
1. JANGAN mengubah struktur segmen naskah asli.
2. JANGAN menghapus atau mengubah frasa/tagline khas berikut jika ada di naskah asli:
   - "Sobat Bumi Lasinrang"
   - "Suara Pinrang, Suara Kita"
3. JANGAN menambah berita baru, fakta baru, atau narasumber baru yang tidak ada pada naskah asli.
4. Pertahankan semua penanda/marker segmentasi naskah (seperti === OPENING ===, === ISI ===, === CLOSING ===, dan [CUE] atau [CUE LAGU/IKLAN]).
5. Proses Rewrite HANYA mengubah gaya bahasa sesuai gaya yang diminta di atas.
6. JANGAN memberikan kalimat pengantar atau penutup tambahan (seperti "Ini hasil revisinya:" atau sejenisnya). LANGSUNG cetak teks hasil revisi naskah secara utuh.

NASKAH ASLI:
"""
${text}
"""
  `.trim();

  const shuffledKeys = [...apiKeys].sort(() => Math.random() - 0.5);
  const model = models[0] || "gemini-2.5-flash";

  for (const [index, apiKey] of shuffledKeys.entries()) {
    try {
      const payload = {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      };

      const { response, data } = await fetchJsonWithTimeout(
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        console.error(`[AI Rewrite] Key ke-${index + 1} Gagal (${response.status}): ${data.error?.message || "Unknown error"}`);
        continue;
      }

      const rewrittenText = data.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n") || "";
      const duration = Date.now() - startTime;

      console.log(`[rewrite_success] Program: ${programTitle}, Mode: ${mode}, Duration: ${duration}ms, Provider: gemini`);

      return {
        text: rewrittenText.trim(),
        provider: "gemini"
      };
    } catch (error) {
      console.error(`[AI Rewrite] Key ke-${index + 1} error:`, error instanceof Error ? error.message : error);
    }
  }

  const durationFailed = Date.now() - startTime;
  const failureMsg = "Semua kunci Gemini sedang tidak dapat digunakan (Limit, Block, atau 403).";
  console.error(`[rewrite_failed] Program: ${programTitle}, Mode: ${mode}, Duration: ${durationFailed}ms, Provider: demo, Error: ${failureMsg}`);
  throw new Error(failureMsg);
}


exports.notificationProxy = onRequest(
  {
    region: "asia-southeast1",
    cors: false,
    maxInstances: 5
  },
  async (request, response) => {
    if (request.method === "OPTIONS") {
      sendJson(request, response, 204, {});
      return;
    }

    if (request.method !== "POST") {
      sendJson(request, response, 405, { error: "Method tidak didukung." });
      return;
    }

    try {
      if (request.path === "/whatsapp/send") {
        sendJson(request, response, 200, await sendWhatsAppMessage(request.body || {}));
        return;
      }

      if (request.path === "/gemini/draft") {
        sendJson(request, response, 200, await generateGeminiDraft(request.body || {}));
        return;
      }

      if (request.path === "/openai/draft" || request.path === "/ai/script-draft") {
        sendJson(request, response, 200, await generateAiScriptDraft(request.body || {}));
        return;
      }

      if (request.path === "/ai/script-rewrite") {
        sendJson(request, response, 200, await generateGeminiRewrite(request.body || {}));
        return;
      }

      if (request.path === "/spotify/show-episodes") {
        sendJson(request, response, 200, await getSpotifyShowEpisodes(request.body || {}));
        return;
      }

      if (request.path === "/drive/upload") {
        sendJson(request, response, 200, await uploadGoogleDriveFile(request));
        return;
      }

      sendJson(request, response, 404, { error: "Endpoint tidak ditemukan." });
    } catch (error) {
      sendJson(request, response, 400, {
        error: error instanceof Error ? error.message : "Request gagal diproses."
      });
    }
  }
);
