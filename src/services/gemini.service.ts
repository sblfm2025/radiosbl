import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGenAIClient(): GoogleGenerativeAI {
  const keysString = import.meta.env.VITE_GEMINI_API_KEYS || import.meta.env.VITE_GEMINI_API_KEY || "";
  const keys = keysString.split(",").map((k: string) => k.trim()).filter(Boolean);
  
  if (keys.length === 0) {
    return new GoogleGenerativeAI("");
  }
  
  // Rotasi otomatis dengan memilih key secara acak
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return new GoogleGenerativeAI(randomKey);
}

export type GeminiDraftRequest = {
  prompt: string;
  context?: string;
};

function buildLocalDraft(request: GeminiDraftRequest): string {
  return [
    "Fallback sementara Gemini Radio SBL:",
    request.context,
    request.prompt,
    "",
    "Selamat pagi pendengar Radio SBL 92,4 FM. Tetap bersama kami untuk informasi, musik, dan kabar Pinrang hari ini."
  ].filter(Boolean).join("\n");
}

export async function analyzeAttendancePhoto(imageBlob: Blob, displayName: string = "Penyiar"): Promise<{ isValid: boolean; reason: string; description: string; greeting: string }> {
  const genAI = getGenAIClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Menggunakan Gemini 2.5 Flash sesuai standar SBL
  
  const imageData = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(imageBlob);
  });

  const timeString = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const hour = new Date().getHours();
  let timeOfDay = "Pagi";
  if (hour >= 10 && hour < 15) timeOfDay = "Siang";
  else if (hour >= 15 && hour < 18) timeOfDay = "Sore";
  else if (hour >= 18) timeOfDay = "Malam";

  const prompt = `
    Analisis foto selfie absensi staf radio ini. Nama penyiar/staf: Kak ${displayName}. Waktu saat ini: ${timeOfDay} (${timeString}).
    
    Tugasmu:
    1. Pastikan ada wajah manusia yang jelas.
    2. Berikan "description" objektif tentang foto (misal: "Pria kacamata mengenakan headset") untuk direkap HRD.
    3. Jika foto tidak layak (gelap, bukan orang, menutupi kamera), berikan isValid: false dan isi "reason".
    4. Buat "greeting" (sapaan) yang personal, interaktif, menyenangkan, sangat kekinian, dan sedikit memuji paras atau gaya berpakaian penyiar di dalam foto secara spesifik. Pastikan menyebut "Kak [Nama]".
    
    Format respon harus JSON murni tanpa markdown formatting:
    {
      "isValid": boolean,
      "reason": "alasan tolakan, atau kosong",
      "description": "deskripsi objektif untuk admin",
      "greeting": "sapaan manis untuk UI penyiar"
    }
  `;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: imageData, mimeType: imageBlob.type } }
  ]);

  const responseText = result.response.text().replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(responseText);
  } catch (err) {
    console.error("Gagal parse AI response:", responseText);
    return { isValid: true, reason: "", description: "Foto berhasil dianalisis.", greeting: `Semangat ${timeOfDay} Kak ${displayName}!` };
  }
}

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError || (error instanceof Error && /failed to fetch|network/i.test(error.message));
}

export async function generateDraft(request: GeminiDraftRequest): Promise<string> {
  const proxyEndpoint = import.meta.env.VITE_GEMINI_PROXY_ENDPOINT as string | undefined;

  if (!proxyEndpoint) {
    return buildLocalDraft(request);
  }

  try {
    const response = await fetch(proxyEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });

    const data = (await response.json().catch(() => ({}))) as { text?: string; result?: string; error?: string };

    if (!response.ok) {
      throw new Error(data.error || "Gemini API gagal memproses permintaan.");
    }

    return data.text || data.result || "Tidak ada hasil dari AI.";
  } catch (error: unknown) {
    if (isNetworkError(error)) {
      return buildLocalDraft(request);
    }

    throw error;
  }
}
