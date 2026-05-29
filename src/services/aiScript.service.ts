import { getGenAIClient } from "./gemini.service";

export type AiScriptProvider = "openai" | "gemini";

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

function inferBroadcastMoment(scheduleTime: string): ProgramScriptRequest["broadcastMoment"] {
  const hourMatch = scheduleTime.match(/\d{1,2}/);
  const hour = hourMatch ? Number(hourMatch[0]) : NaN;

  if (Number.isNaN(hour)) return undefined;
  if (hour >= 4 && hour < 11) return "pagi";
  if (hour >= 11 && hour < 15) return "siang";
  if (hour >= 15 && hour < 18) return "sore";
  return "malam";
}

function inferAudienceSegment(programTitle: string, description: string): ProgramScriptRequest["audienceSegment"] {
  const text = `${programTitle} ${description}`.toLowerCase();

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
    "===== IDENTITAS RADIO =====",
    "- Ini adalah naskah untuk LPPL Radio Suara Bumi Lasinrang 92,4 FM.",
    "- Wajib gunakan sapaan pendengar: \"Sobat Bumi Lasinrang\".",
    "- Wajib selipkan tagline: \"Suara Pinrang, Suara Kita\".",
    "- Nuansa lokal Kabupaten Pinrang dan budaya Bugis boleh digunakan secara halus.",
    "- Gunakan unsur lokal maksimal 1 kali dalam satu naskah kecuali diminta khusus oleh penyiar.",
    "- Jangan memaksakan semua ungkapan lokal dalam satu naskah."
  ];
}

function buildSpokenStyleRules(): string[] {
  return [
    "===== GAYA BAHASA SIARAN =====",
    "- Tulis seperti penyiar benar-benar berbicara, bukan seperti artikel.",
    "- Gunakan kalimat pendek dan mudah dibaca.",
    "- Hindari paragraf terlalu panjang.",
    "- Buat transisi antarbagian terasa natural.",
    "- Gunakan jeda napas alami melalui pemenggalan paragraf.",
    "- Jangan terlalu formal kecuali tone meminta formal.",
    "- Jangan terlalu banyak slogan.",
    "- Jangan membuat kalimat yang terdengar seperti iklan berlebihan.",
    "- Buat variasi diksi dan opening agar tidak terasa berulang antar-generate."
  ];
}

function buildAntiTemplateRules(): string[] {
  return [
    "===== ATURAN ANTI TEMPLATE =====",
    "- Jangan selalu membuka dengan pola yang sama.",
    "- Hindari opening generik seperti: \"Kembali lagi bersama saya\" jika tidak diperlukan.",
    "- Variasikan opening berdasarkan waktu siaran, nama program, tone, dan arahan penyiar.",
    "- Jangan mengulang frasa yang sama terlalu sering.",
    "- Jangan membuat naskah terasa seperti hasil copy-paste dari template."
  ];
}

function buildDurationRules(durationMinutes: number): string[] {
  if (durationMinutes <= 5) {
    return [
      "===== ATURAN DURASI =====",
      "- Durasi pendek.",
      "- Buat opening singkat.",
      "- Gunakan 1 segmen utama.",
      "- Maksimal 1 cue lagu.",
      "- Closing singkat dan kuat."
    ];
  }

  if (durationMinutes <= 15) {
    return [
      "===== ATURAN DURASI =====",
      "- Durasi sedang.",
      "- Buat opening, 2 segmen isi, 1 cue lagu, dan closing.",
      "- Tambahkan 1 hook interaksi pendengar.",
      "- Jaga agar tiap segmen tidak terlalu panjang."
    ];
  }

  return [
    "===== ATURAN DURASI =====",
    "- Durasi panjang.",
    "- Buat opening, beberapa segmen isi, transisi antarsegmen, cue lagu, interaksi pendengar, dan closing.",
    "- Sisipkan variasi ritme agar penyiar tidak terdengar monoton.",
    "- Gunakan beberapa hook ringan untuk mempertahankan perhatian pendengar."
  ];
}

function buildSituationalRules(request: ProgramScriptRequest): string[] {
  const moment = request.broadcastMoment || inferBroadcastMoment(request.scheduleTime);
  const audience = request.audienceSegment || inferAudienceSegment(request.programTitle, request.description);

  return [
    "===== KONTEKS SITUASI =====",
    `- Momen siaran: ${moment || "umum"}`,
    `- Target pendengar: ${audience || "umum"}`,
    `- Konteks lokal: ${request.localContext || "-"}`,
    `- Cuaca/suasana: ${request.weatherContext || "-"}`,
    `- Situasi saat ini: ${request.currentSituation || "-"}`,
    `- Tujuan interaksi: ${request.interactionGoal || "ajak pendengar tetap terhubung secara natural"}`,
    `- Preferensi musik: ${request.musicPreference || "sesuaikan dengan program dan tone"}`,
    `- Fokus konten: ${request.contentFocus || "sesuaikan dengan deskripsi program"}`
  ];
}

function buildMusicCueRules(): string[] {
  return [
    "===== ATURAN CUE LAGU =====",
    "- Jika yakin dengan judul dan penyanyi, gunakan format: [CUE LAGU: Judul Lagu - Penyanyi].",
    "- Jika tidak yakin, jangan mengarang judul lagu.",
    "- Jika tidak yakin, gunakan format kategori: [CUE LAGU: Pop Indonesia bertema semangat pagi].",
    "- Sebelum cue lagu, buat pengantar singkat yang relevan.",
    "- Akhiri pengantar lagu dengan pertanyaan ringan untuk interaksi pendengar.",
    "- Gunakan nomor WhatsApp resmi Radio SBL: 0851-2256-1992."
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
    "===== FORMAT OUTPUT =====",
    "Langsung hasilkan naskah saja.",
    "Jangan gunakan kalimat pengantar seperti: \"Berikut naskahnya\".",
    "",
    "Gunakan struktur:",
    "=== OPENING ===",
    "=== SEGMENT/ISI ===",
    "[CUE LAGU/IKLAN]",
    "=== CLOSING ==="
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

  try {
    const genAI = getGenAIClient();
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
    console.error("Kesalahan saat memanggil Gemini API secara langsung:", error);
    return {
      demo: true,
      provider: "demo",
      warning: "AI utama sementara tidak tersedia. Sistem menampilkan naskah cadangan yang tetap bisa diedit manual.",
      text: buildDemoScript(sanitizedRequest)
    };
  }
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
    console.error("Kesalahan saat memanggil AI Rewrite Proxy:", error);
    throw new Error(
      "AI Rewrite sementara tidak tersedia.\n\n" +
      "Silakan coba kembali beberapa saat lagi.\n" +
      "Naskah asli Anda tetap aman."
    );
  }
}
