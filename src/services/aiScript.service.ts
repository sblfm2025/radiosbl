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
};

export type ProgramScriptResponse = {
  text: string;
  provider: AiScriptProvider | "demo";
  demo?: boolean;
  warning?: string;
};

function buildDemoScript(request: ProgramScriptRequest): string {
  return [
    `FALLBACK SEMENTARA - ${request.programTitle}`,
    `Selamat datang di Radio SBL 92,4 FM, Suara Pinrang, Suara Kita.`,
    `Bersama ${request.announcerName || "penyiar Radio SBL"} dalam program ${request.programTitle}, ${request.day} pukul ${request.scheduleTime}.`,
    "",
    "BRIDGE",
    request.description
      ? `Hari ini kita akan mengangkat tema: ${request.description}.`
      : "Hari ini kita hadir dengan informasi, musik, dan sapaan hangat untuk pendengar Pinrang.",
    request.intervention ? `Catatan penyiar: ${request.intervention}` : "",
    "",
    "CLOSING",
    "Tetap di Radio SBL. Yang jauh terasa dekat, yang dekat terasa akrab."
  ].filter(Boolean).join("\n");
}

function buildGeminiPrompt(request: ProgramScriptRequest): string {
  return [
    "Susun naskah siaran radio profesional, kekinian, dan adaptif untuk LPPL Radio Suara Bumi Lasinrang 92,4 FM.",
    "Gunakan bahasa Indonesia yang hangat, natural, dan siap dibaca penyiar (spoken style).",
    "",
    "===== KEARIFAN LOKAL & IDENTITAS RADIO =====",
    "- WAJIB gunakan sapaan khas pendengar: \"Sobat Bumi Lasinrang\".",
    "- WAJIB selipkan tagline radio: \"Suara Pinrang, Suara Kita\".",
    "- Selipkan pendekatan kearifan lokal Kabupaten Pinrang dan suku Bugis secara halus. Gunakan sapaan/salam khas Bugis secara natural terutama di bagian Opening atau Closing, seperti: \"Aga Kareba?\" (untuk menanyakan kabar), \"Kurru' Sumange'\" (sebagai ungkapan syukur/terima kasih/semangat), atau \"Salama'ki na topada salama'\" (salam keselamatan bagi kita semua). Jangan terlalu kaku, buat terasa akrab dan merakyat.",
    "",
    "===== ATURAN PENULISAN =====",
    "ATURAN MUTLAK: JANGAN gunakan kalimat basa-basi pengantar (seperti 'Tentu, ini naskahnya'). JANGAN mencetak ulang Header/Metadata (seperti Judul Program, Nama Penyiar, Hari, Jam, Durasi).",
    "LANGSUNG hasilkan teks naskahnya saja. Jangan mengarang berita palsu. Jika butuh data riil seperti nomor WhatsApp interaksi resmi Radio SBL, gunakan selalu nomor \"0851-2256-1992\" (jangan gunakan placeholder untuk nomor WA). Untuk data dinamis lainnya (seperti judul lagu), tulis placeholder dalam kurung siku yang mudah diisi penyiar.",
    "",
    `[Konteks berikut HANYA sebagai acuan penyusunan isi naskah, JANGAN DITULIS ULANG]:`,
    `Program: ${request.programTitle}`,
    `Hari/Jam: ${request.day}, ${request.scheduleTime}`,
    `Penyiar aktif: Kak ${request.announcerName || "Belum terdeteksi"}`,
    `Durasi target: ${request.durationMinutes} menit`,
    `Gaya siaran: ${request.tone}`,
    `Deskripsi program: ${request.description || "-"}`,
    request.intervention ? `Arahan penyiar: ${request.intervention}` : "",
    "",
    "Format struktur teks dibagi menjadi: === OPENING ===, === SEGMENT/ISI ===, [CUE LAGU/IKLAN], === CLOSING ==="
  ].filter(Boolean).join("\n");
}

export async function generateProgramScript(
  request: ProgramScriptRequest
): Promise<ProgramScriptResponse> {
  if (import.meta.env.MODE === "test") {
    return {
      demo: true,
      provider: "demo",
      text: buildDemoScript(request)
    };
  }

  const keysString = import.meta.env.VITE_GEMINI_API_KEYS || import.meta.env.VITE_GEMINI_API_KEY || "";
  const proxyEndpoint = import.meta.env.VITE_GEMINI_PROXY_ENDPOINT || "https://asia-southeast1-radiosbl.cloudfunctions.net/notificationProxy/gemini/draft";

  if (!keysString) {
    console.warn("VITE_GEMINI_API_KEYS tidak ditemukan. Menggunakan naskah demo.");
    return {
      demo: true,
      provider: "demo",
      text: buildDemoScript(request)
    };
  }

  const prompt = buildGeminiPrompt(request);

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

      return {
        provider: "gemini",
        demo: !!data.demo,
        warning: data.warning,
        text: data.text || buildDemoScript(request)
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

    return {
      provider: "gemini",
      demo: false,
      text: text
    };
  } catch (error) {
    console.error("Kesalahan saat memanggil Gemini API secara langsung:", error);
    return {
      demo: true,
      provider: "demo",
      warning: "Gagal terhubung ke AI. Menampilkan naskah cadangan.",
      text: buildDemoScript(request)
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
