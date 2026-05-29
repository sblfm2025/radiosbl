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
    "- Selipkan pendekatan kearifan lokal Kabupaten Pinrang dan suku Bugis secara halus (misal menyapa 'Aga kareba', 'Salama', atau menyebut daerah-daerah di Pinrang jika relevan). Jangan terlalu kaku, buat terasa akrab dan merakyat.",
    "",
    "===== ATURAN PENULISAN =====",
    "ATURAN MUTLAK: JANGAN gunakan kalimat basa-basi pengantar (seperti 'Tentu, ini naskahnya'). JANGAN mencetak ulang Header/Metadata (seperti Judul Program, Nama Penyiar, Hari, Jam, Durasi).",
    "LANGSUNG hasilkan teks naskahnya saja. Jangan mengarang berita palsu. Jika butuh data riil (seperti nomor WA interaksi atau judul lagu), tulis placeholder dalam kurung siku yang mudah diisi penyiar.",
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

  if (!keysString) {
    console.warn("VITE_GEMINI_API_KEYS tidak ditemukan. Menggunakan naskah demo.");
    return {
      demo: true,
      provider: "demo",
      text: buildDemoScript(request)
    };
  }

  try {
    const genAI = getGenAIClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = buildGeminiPrompt(request);
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
    console.error("Kesalahan saat memanggil Gemini API:", error);
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
