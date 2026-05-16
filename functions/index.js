const { onRequest } = require("firebase-functions/v2/https");

const DEFAULT_ALLOWED_ORIGIN = "https://radiosbl.web.app";

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

      if (request.path === "/spotify/show-episodes") {
        sendJson(request, response, 200, await getSpotifyShowEpisodes(request.body || {}));
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
