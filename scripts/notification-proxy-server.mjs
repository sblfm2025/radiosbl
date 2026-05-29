import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const DEFAULT_PORT = 8788;
const MAX_BODY_BYTES = 64 * 1024;

async function loadLocalEnv() {
  const envFile = resolve(".env.local");

  try {
    const content = await readFile(envFile, "utf8");

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const [key, ...valueParts] = trimmed.split("=");
      process.env[key] ??= valueParts.join("=");
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

function normalizeEnvValue(value) {
  return String(value || "").trim().replace(/^['"]|['"]$/g, "");
}

function getAllowedOrigin(request) {
  const origin = request.headers.origin || "";
  const configured = normalizeEnvValue(process.env.NOTIFICATION_PROXY_ALLOWED_ORIGIN);

  if (configured) {
    return configured;
  }

  if (/^https?:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin)) {
    return origin;
  }

  return "http://localhost:5173";
}

function sendJson(request, response, statusCode, data) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": getAllowedOrigin(request),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(data));
}

async function readJsonBody(request) {
  let raw = "";

  for await (const chunk of request) {
    raw += chunk;

    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
      throw new Error("Payload terlalu besar.");
    }
  }

  return raw ? JSON.parse(raw) : {};
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

  if (!token || !phoneNumberId) {
    return {
      demo: true,
      messageId: `demo-wa-${Date.now()}`,
      to,
      text
    };
  }

  if (!to || !text) {
    throw new Error("Field to dan text wajib diisi.");
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

  // Ambil daftar kunci dan acak urutannya untuk rotasi yang adil
  const shuffledKeys = [...apiKeys].sort(() => Math.random() - 0.5);
  const model = models[0] || "gemini-2.5-flash";

  console.log(`[Gemini] Memulai percobaan dengan ${shuffledKeys.length} kunci pada model: ${model}`);

  for (const [index, apiKey] of shuffledKeys.entries()) {
    try {
      const payload = {
        contents: [{ parts: [{ text: [context, prompt].filter(Boolean).join("\n\n") }] }]
      };

      console.log(`[Gemini] Mencoba kunci ke-${index + 1}: ${apiKey.substring(0, 10)}...`);

      const { response, data } = await fetchJsonWithTimeout(
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        console.error(`[Gemini] Kunci ke-${index + 1} Gagal (${response.status}):`, data.error?.message || "Error");
        
        // Jika kuota habis (429), kita bisa coba kunci lain karena mungkin project-nya berbeda
        if (response.status === 429) {
          continue;
        }
        
        // Jika error lain (403/400), lanjut ke kunci berikutnya
        continue;
      }

      console.log(`[Gemini] BERHASIL dengan kunci ke-${index + 1}!`);
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n") || "";

      return {
        model,
        text: text || "Gemini merespons, tetapi tidak mengembalikan teks."
      };
    } catch (error) {
      console.error(`[Gemini] Error pada kunci ke-${index + 1}:`, error instanceof Error ? error.message : "Request gagal");
    }
  }

  return {
    demo: true,
    warning: "Semua kunci Gemini sedang tidak dapat digunakan (Limit atau Block).",
    text: `[Demo Mode] Hasil draf untuk: ${prompt.substring(0, 50)}...`
  };
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

  const response = await fetch("https://api.openai.com/v1/responses", {
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "OpenAI API menolak request.");
  }

  return {
    provider: "openai",
    text: extractOpenAiText(data)
  };
}

async function generateAiScriptDraft(body) {
  console.log(`[AI Script] Request masuk untuk program: ${body.programTitle} (Provider: ${body.provider || "gemini"})`);
  
  if (body.provider === "openai") {
    return generateOpenAiScript(body);
  }

  // Rakit prompt dari data request frontend jika menggunakan provider gemini
  const prompt = buildProgramScriptPrompt(body);
  const result = await generateGeminiDraft({ prompt });
  return { ...result, provider: "gemini" };
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


await loadLocalEnv();

const port = Number(process.env.NOTIFICATION_PROXY_PORT || DEFAULT_PORT);

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(request, response, 204, {});
    return;
  }

  try {
    if (request.method !== "POST") {
      sendJson(request, response, 405, { error: "Method tidak didukung." });
      return;
    }

    const body = await readJsonBody(request);

    if (request.url === "/whatsapp/send") {
      sendJson(request, response, 200, await sendWhatsAppMessage(body));
      return;
    }

    if (request.url === "/gemini/draft") {
      sendJson(request, response, 200, await generateGeminiDraft(body));
      return;
    }

    if (request.url === "/openai/draft" || request.url === "/ai/script-draft") {
      sendJson(request, response, 200, await generateAiScriptDraft(body));
      return;
    }

    if (request.url === "/ai/script-rewrite") {
      sendJson(request, response, 200, await generateGeminiRewrite(body));
      return;
    }

    if (request.url === "/spotify/show-episodes") {
      sendJson(request, response, 200, await getSpotifyShowEpisodes(body));
      return;
    }

    sendJson(request, response, 404, { error: "Endpoint tidak ditemukan." });
  } catch (error) {
    sendJson(request, response, 400, {
      error: error instanceof Error ? error.message : "Request gagal diproses."
    });
  }
});

server.listen(port, () => {
  console.log(`Notification proxy listening on http://localhost:${port}`);
  console.log(`WhatsApp endpoint: http://localhost:${port}/whatsapp/send`);
  console.log(`Gemini endpoint: http://localhost:${port}/gemini/draft`);
  console.log(`AI script endpoint: http://localhost:${port}/ai/script-draft`);
  console.log(`AI rewrite endpoint: http://localhost:${port}/ai/script-rewrite`);
  console.log(`Spotify podcast endpoint: http://localhost:${port}/spotify/show-episodes`);
});
