import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

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

export async function analyzeAttendancePhoto(imageBlob: Blob): Promise<{ isValid: boolean; reason: string; description: string }> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Menggunakan Gemini 2.5 Flash sesuai standar SBL
  
  const imageData = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(imageBlob);
  });

  const prompt = `
    Analisis foto selfie absensi staf radio ini. 
    Tugasmu:
    1. Pastikan ada wajah manusia yang jelas.
    2. Berikan deskripsi singkat tentang foto tersebut (misal: "Pria mengenakan headset di depan mic").
    3. Jika foto tidak layak (gelap, bukan orang, atau menutupi kamera), berikan isValid: false.
    
    Format respon harus JSON murni:
    {
      "isValid": boolean,
      "reason": "alasan jika tidak valid, atau kosong jika valid",
      "description": "deskripsi singkat apa yang terlihat di foto"
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
    return { isValid: true, reason: "", description: "Foto berhasil dianalisis." };
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
