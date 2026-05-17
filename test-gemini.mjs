import { GoogleGenerativeAI } from "@google/generative-ai";

// Logika build prompt dari aiScript.service.ts
function buildGeminiPrompt(request) {
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

async function testScriptGeneration() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const modelName = "gemini-2.5-flash";

  if (!apiKey) {
    throw new Error("Set GEMINI_API_KEY atau VITE_GEMINI_API_KEY sebelum menjalankan test ini.");
  }

  console.log(`--- Mengetes Pembuatan Naskah Radio SBL dengan ${modelName} ---`);

  const request = {
    programTitle: "Pinrang Menyapa",
    scheduleTime: "08:00 - 09:00",
    day: "Senin",
    announcerName: "Andi Mallarangeng",
    description: "Membahas tentang persiapan panen padi di wilayah Mattiro Sompe.",
    tone: "hangat, informatif, dan dekat dengan petani",
    durationMinutes: 5,
    intervention: "Sapa pendengar di pesisir Pantai Lowita."
  };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = buildGeminiPrompt(request);
    console.log("Prompt berhasil dibuat. Mengirim ke Gemini...");

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("\n✅ NASKAH AI BERHASIL DIBUAT:");
    console.log("=========================================");
    console.log(text);
    console.log("=========================================");
  } catch (error) {
    console.error("❌ GAGAL membuat naskah:", error.message);
  }
}

testScriptGeneration();
