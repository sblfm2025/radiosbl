import { GoogleGenerativeAI } from "@google/generative-ai";
// import { getGenAIClient } from "./gemini.service";

export type AiScriptProvider = "openai" | "gemini";

// Cache configuration
// const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
// const GEMINI_TIMEOUT_MS = 5000; // 5 seconds for fail-fast
// const MAX_CACHE_SIZE = 50;

// interface CacheEntry {
//   data: ProgramScriptResponse;
//   timestamp: number;
// }

// const scriptCache = new Map<string, CacheEntry>();
// const pendingRequests = new Map<string, Promise<ProgramScriptResponse>>();

export type ProgramScriptRequest = {
  provider: AiScriptProvider;
  programTitle: string;
  scheduleTime: string;
  day: string;
  announcerName: string;
  description: string;
  tone: string;
  durationMinutes: number;
  intervention?: string;
  skipCache?: boolean; // Override caching for this request

  audienceSegment?: "umum" | "remaja" | "dewasa" | "keluarga" | "komunitas";
  broadcastMoment?: "pagi" | "siang" | "sore" | "malam";
  localContext?: string;
  weatherContext?: string;
  currentSituation?: string;
  interactionGoal?: string;
  musicPreference?: string;
  contentFocus?: string;
};

export type ProgramScriptResponse = {
  text: string;
  provider: AiScriptProvider | "demo";
  demo?: boolean;
  warning?: string;
};

function inferBroadcastMoment(scheduleTime: string | undefined | null): ProgramScriptRequest["broadcastMoment"] {
  if (!scheduleTime || typeof scheduleTime !== "string") return undefined;
  const hourMatch = scheduleTime.match(/\d{1,2}/);
  const hour = hourMatch ? Number(hourMatch[0]) : NaN;

  if (Number.isNaN(hour)) return undefined;
  if (hour >= 4 && hour < 11) return "pagi";
  if (hour >= 11 && hour < 15) return "siang";
  if (hour >= 15 && hour < 18) return "sore";
  return "malam";
}

function inferAudienceSegment(programTitle: string | undefined | null, description: string | undefined | null): ProgramScriptRequest["audienceSegment"] {
  const titleText = String(programTitle || "");
  const descText = String(description || "");
  const text = `${titleText} ${descText}`.toLowerCase();

  if (text.includes("anak muda") || text.includes("remaja") || text.includes("gen z")) {
    return "remaja";
  }
  if (text.includes("keluarga")) {
    return "keluarga";
  }
  if (text.includes("komunitas")) {
    return "komunitas";
  }
  if (text.includes("nostalgia") || text.includes("dewasa")) {
    return "dewasa";
  }
  return "umum";
}

function cleanPromptInput(value: unknown, fallback = "-"): string {
  const text = String(value || "").trim();
  if (!text) return fallback;

  return text
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .slice(0, 1200);
}

function buildDemoScript(request: ProgramScriptRequest): string {
  const announcer = request.announcerName || "penyiar Radio SBL";
  const moment = request.broadcastMoment || inferBroadcastMoment(request.scheduleTime) || "hari ini";

  return [
    `=== OPENING ===`,
    `Aga kareba, Sobat Bumi Lasinrang?`,
    ``,
    `Senang sekali bisa menyapa Anda di ${moment} ini bersama saya, ${announcer}, di Radio SBL 92,4 FM, Suara Pinrang, Suara Kita.`,
    ``,
    `=== SEGMENT/ISI ===`,
    request.description
      ? `Pada kesempatan ini, kita akan berbincang ringan tentang ${request.description}.`
      : `Hari ini kita hadir menemani aktivitas Anda dengan informasi ringan, musik pilihan, dan sapaan hangat untuk pendengar setia Radio SBL.`,
    ``,
    request.intervention
      ? `Catatan khusus untuk siaran kali ini: ${request.intervention}.`
      : `Jangan lupa, Sobat Bumi Lasinrang juga bisa ikut menyapa dan berbagi cerita melalui WhatsApp resmi Radio SBL di 0851-2256-1992.`,
    ``,
    `[CUE LAGU: Lagu pilihan yang sesuai dengan suasana program]`,
    ``,
    `=== CLOSING ===`,
    `Terima kasih sudah bersama Radio SBL. Tetap jaga semangat, jaga silaturahmi, dan sampai jumpa di program berikutnya.`,
    ``,
    `Radio SBL 92,4 FM, Suara Pinrang, Suara Kita.`
  ].filter(Boolean).join("\n");
}

function buildIdentityRules(): string[] {
  return [
    "===== IDENTITAS =====",
    "LPPL Radio SBL 92,4 FM. Wajib: Sobat Bumi Lasinrang, Suara Pinrang, Suara Kita. Unsur lokal maks 1× kecuali diminta."
  ];
}

function buildSpokenStyleRules(): string[] {
  return [
    "===== GAYA =====",
    "Seperti bicara: kalimat pendek, transisi natural, variasi diksi. Hindari: formal berlebih, slogan/iklan berulang."
  ];
}

function buildAntiTemplateRules(): string[] {
  return [
    "===== VARIASI =====",
    "Opening berbasis waktu/program/tone. Hindari pola berulang dan generik."
  ];
}

function buildDurationRules(durationMinutes: number): string[] {
  if (durationMinutes <= 5) {
    return [
      "===== DURASI =====",
      "Pendek: opening singkat, 1 segmen, max 1 cue, closing kuat."
    ];
  }

  if (durationMinutes <= 15) {
    return [
      "===== DURASI =====",
      "Sedang: opening, 2 segmen, 1 cue, closing, 1 hook."
    ];
  }

  return [
    "===== DURASI =====",
    "Panjang: opening, beberapa segmen, transisi, cue, interaksi, closing, variasi ritme."
  ];
}

function buildSituationalRules(request: ProgramScriptRequest): string[] {
  const moment = request.broadcastMoment || inferBroadcastMoment(request.scheduleTime);
  const audience = request.audienceSegment || inferAudienceSegment(request.programTitle, request.description);

  return [
    "===== KONTEKS =====",
    `Momen: ${moment || "umum"} | Pendengar: ${audience || "umum"} | Lokal: ${request.localContext || "-"} | Cuaca: ${request.weatherContext || "-"} | Situasi: ${request.currentSituation || "-"} | Interaksi: ${request.interactionGoal || "tetap terhubung"} | Musik: ${request.musicPreference || "sesuai program"} | Fokus: ${request.contentFocus || "sesuai deskripsi"}`
  ];
}

function buildMusicCueRules(): string[] {
  return [
    "===== LAGU =====",
    "Rekomendasi nyata: judul+penyanyi benar-benar ada, bukan fiktif/kolaborasi. Prioritas: lagu Indonesia populer aman. Sesuaikan jam/tone/pendengar. Max 1-3 lagu. Format: [CUE LAGU: Judul - Penyanyi]. Opsi kategori: [CUE LAGU: Pop Indonesia bertema semangat]. Sebelum cue: pengantar singkat. Setelah cue: boleh hook interaksi. WhatsApp 0851-2256-1992 hanya untuk request/salam."
  ];
}

function buildSafetyRules(): string[] {
  return [
    "===== ATURAN KEAMANAN ISI =====",
    "- Jangan mengarang berita, data, nama pejabat, lokasi kejadian, jadwal acara, atau informasi publik yang tidak diberikan.",
    "- Jika informasi tidak tersedia, gunakan kalimat umum yang aman.",
    "- Jangan menyebut fakta terbaru kecuali diberikan dalam deskripsi atau arahan penyiar.",
    "- Jangan menciptakan kutipan narasumber.",
    "- Jangan membuat klaim kesehatan, hukum, politik, atau keuangan yang tidak berdasar.",
    "- Jangan mencetak ulang metadata seperti judul program, nama penyiar, hari, jam, dan durasi."
  ];
}

function buildOutputFormatRules(): string[] {
  return [
    "===== FORMAT =====",
    "Langsung naskah tanpa pengantar. Struktur: === OPENING ===, === SEGMENT/ISI ===, [CUE LAGU/IKLAN], === CLOSING ===."
  ];
}

function buildGeminiPrompt(request: ProgramScriptRequest): string {
  return [
    "Susun naskah siaran radio profesional, natural, cerdas, dan siap dibaca penyiar untuk LPPL Radio Suara Bumi Lasinrang 92,4 FM.",
    "",
    ...buildIdentityRules(),
    "",
    ...buildSpokenStyleRules(),
    "",
    ...buildAntiTemplateRules(),
    "",
    ...buildDurationRules(request.durationMinutes),
    "",
    ...buildSituationalRules(request),
    "",
    ...buildMusicCueRules(),
    "",
    "Catatan penting: untuk rekomendasi lagu, lebih baik menyebut lagu nyata yang populer dan terverifikasi secara umum daripada hanya memberi kategori. Gunakan kategori hanya sebagai opsi terakhir jika tidak yakin.",
    "",
    ...buildSafetyRules(),
    "",
    "[Konteks berikut HANYA sebagai acuan penyusunan isi naskah, JANGAN DITULIS ULANG]:",
    `Program: ${request.programTitle}`,
    `Hari/Jam: ${request.day}, ${request.scheduleTime}`,
    `Penyiar aktif: **${request.announcerName || "Belum terdeteksi"}**`,
    `Durasi target: ${request.durationMinutes} menit`,
    `Gaya siaran: ${request.tone}`,
    `Deskripsi program: ${request.description || "-"}`,
    request.intervention ? `Arahan penyiar: ${request.intervention}` : "",
    request.localContext ? `Konteks lokal tambahan: ${request.localContext}` : "",
    request.currentSituation ? `Situasi tambahan: ${request.currentSituation}` : "",
    "",
    ...buildOutputFormatRules()
  ].filter(Boolean).join("\n");
}

export function normalizeGeneratedScript(text: string): string {
  return text
    .replace(/^```[a-z]*\n?/i, "")
    .replace(/```$/i, "")
    .replace(/^(Tentu|Berikut|Baik),?.*naskah.*?:/i, "")
    .trim();
}

export function ensureRadioIdentity(text: string): string {
  let output = text.trim();

  if (!output.includes("Sobat Bumi Lasinrang")) {
    output = output.replace(
      "=== OPENING ===",
      "=== OPENING ===\nSobat Bumi Lasinrang,"
    );
  }

  if (!output.includes("Suara Pinrang, Suara Kita")) {
    output += "\n\nRadio SBL 92,4 FM, Suara Pinrang, Suara Kita.";
  }

  return output;
}

export async function generateProgramScript(
  request: ProgramScriptRequest
): Promise<ProgramScriptResponse> {
  const sanitizedRequest: ProgramScriptRequest = {
    ...request,
    programTitle: cleanPromptInput(request.programTitle),
    announcerName: cleanPromptInput(request.announcerName),
    description: cleanPromptInput(request.description),
    tone: cleanPromptInput(request.tone),
    durationMinutes: Number(request.durationMinutes) || 5,
    intervention: request.intervention ? cleanPromptInput(request.intervention) : undefined,
    localContext: request.localContext ? cleanPromptInput(request.localContext) : undefined,
    currentSituation: request.currentSituation ? cleanPromptInput(request.currentSituation) : undefined,
    weatherContext: request.weatherContext ? cleanPromptInput(request.weatherContext) : undefined,
    interactionGoal: request.interactionGoal ? cleanPromptInput(request.interactionGoal) : undefined,
    musicPreference: request.musicPreference ? cleanPromptInput(request.musicPreference) : undefined,
    contentFocus: request.contentFocus ? cleanPromptInput(request.contentFocus) : undefined,
  };

  if (import.meta.env.MODE === "test") {
    return {
      demo: true,
      provider: "demo",
      text: buildDemoScript(sanitizedRequest)
    };
  }

  const keysString = import.meta.env.VITE_GEMINI_API_KEYS || import.meta.env.VITE_GEMINI_API_KEY || "";
  const proxyEndpoint = import.meta.env.VITE_GEMINI_PROXY_ENDPOINT || "https://asia-southeast1-radiosbl.cloudfunctions.net/notificationProxy/gemini/draft";

  if (!keysString) {
    console.warn("VITE_GEMINI_API_KEYS tidak ditemukan. Menggunakan naskah demo.");
    return {
      demo: true,
      provider: "demo",
      text: buildDemoScript(sanitizedRequest)
    };
  }

  const prompt = buildGeminiPrompt(sanitizedRequest);

  if (proxyEndpoint) {
    try {
      const response = await fetch(proxyEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Gagal memanggil proxy.");
      }

      const cleanText = ensureRadioIdentity(normalizeGeneratedScript(data.text || ""));

      return {
        provider: "gemini",
        demo: !!data.demo,
        warning: data.warning,
        text: cleanText || buildDemoScript(sanitizedRequest)
      };
    } catch (error) {
      console.error("Gagal menggunakan proxy, mencoba direct call:", error);
    }
  }

  const apiKeys = keysString.split(",").map((k: string) => k.trim()).filter(Boolean);
  const shuffledKeys = [...apiKeys].sort(() => Math.random() - 0.5);

  for (const [index, apiKey] of shuffledKeys.entries()) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error("AI mengembalikan respon kosong.");
      }

      const cleanText = ensureRadioIdentity(normalizeGeneratedScript(text));

      return {
        provider: "gemini",
        demo: false,
        text: cleanText
      };
    } catch (error) {
      console.warn(`Kesalahan saat memanggil Gemini API secara langsung dengan kunci ke-${index + 1}:`, error);
    }
  }

  console.error("Semua kunci Gemini API gagal digunakan saat direct call.");
  return {
    demo: true,
    provider: "demo",
    warning: "AI utama sementara tidak tersedia. Sistem menampilkan naskah cadangan yang tetap bisa diedit manual.",
    text: buildDemoScript(sanitizedRequest)
  };
}

export async function rewriteProgramScript(
  currentText: string,
  mode: "formal" | "santai" | "singkat" | "energik" | "anak-muda" | "profesional"
): Promise<string> {
  if (import.meta.env.MODE === "test") {
    return `[Gaya ${mode}]:\n${currentText}`;
  }

  const rewriteEndpoint =
    import.meta.env.VITE_AI_SCRIPT_REWRITE_ENDPOINT ||
    "https://asia-southeast1-radiosbl.cloudfunctions.net/notificationProxy/ai/script-rewrite";

  const programTitle = "Naskah Editor";

  try {
    const response = await fetch(rewriteEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: currentText,
        mode,
        programTitle
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Gagal memproses permintaan rewrite.");
    }

    if (!data.text) {
      throw new Error("AI mengembalikan respon kosong.");
    }

    return data.text.trim();
  } catch (error) {
    console.warn("Gagal menggunakan proxy AI Rewrite, mencoba direct call:", error);
  }

  const keysString = import.meta.env.VITE_GEMINI_API_KEYS || import.meta.env.VITE_GEMINI_API_KEY || "";
  if (!keysString) {
    throw new Error(
      "AI Rewrite tidak tersedia.\n\n" +
      "Kunci API tidak terkonfigurasi di sistem.\n" +
      "Naskah asli Anda tetap aman."
    );
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
${currentText}
"""
  `.trim();

  const apiKeys = keysString.split(",").map((k: string) => k.trim()).filter(Boolean);
  const shuffledKeys = [...apiKeys].sort(() => Math.random() - 0.5);

  for (const [index, apiKey] of shuffledKeys.entries()) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (text && text.trim()) {
        return text.trim();
      }
    } catch (directError) {
      console.warn(`Kesalahan saat memanggil Gemini API secara langsung untuk Rewrite dengan kunci ke-${index + 1}:`, directError);
    }
  }

  throw new Error(
    "AI Rewrite sementara tidak tersedia.\n\n" +
    "Semua kunci API Gemini mengalami gangguan atau limitasi.\n" +
    "Silakan coba kembali beberapa saat lagi."
  );
}
