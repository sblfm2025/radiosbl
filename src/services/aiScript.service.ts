import { GoogleGenerativeAI } from "@google/generative-ai";

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
    "Susun naskah siaran radio profesional untuk LPPL Radio Suara Bumi Lasinrang 92,4 FM.",
    "Gunakan bahasa Indonesia yang hangat, natural, singkat, dan siap dibaca penyiar.",
    "Jangan mengarang fakta spesifik di luar konteks. Jika butuh data, tulis placeholder yang mudah diisi penyiar.",
    "",
    `Program: ${request.programTitle}`,
    `Hari/Jam: ${request.day}, ${request.scheduleTime}`,
    `Penyiar aktif: ${request.announcerName || "Belum terdeteksi"}`,
    `Durasi target: ${request.durationMinutes} menit`,
    `Gaya: ${request.tone}`,
    `Deskripsi program: ${request.description || "-"}`,
    request.intervention ? `Arahan penyiar: ${request.intervention}` : "",
    "",
    "Formatkan dengan bagian: Opening, Bridge/Isi, Cue Lagu/Interaksi, Closing."
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

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY tidak ditemukan. Menggunakan naskah demo.");
    return {
      demo: true,
      provider: "demo",
      text: buildDemoScript(request)
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Menggunakan gemini-2.5-flash sesuai spesifikasi project
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
