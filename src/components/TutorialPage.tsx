import { BookOpen, PlayCircle, Search, User, Mic2, ShieldCheck, AlertTriangle } from "lucide-react";
import { useState } from "react";

export function TutorialPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    { title: "Panduan Cepat", icon: BookOpen, desc: "Langkah dasar menggunakan Radio SBL" },
    { title: "Tutorial Penyiar", icon: Mic2, desc: "Persiapan, jadwal, dan request lagu" },
    { title: "Tutorial Admin", icon: ShieldCheck, desc: "Manajemen user dan persetujuan" },
    { title: "Tutorial Reporter", icon: User, desc: "Liputan, event, dan laporan" },
    { title: "Video Tutorial", icon: PlayCircle, desc: "Tonton langkah demi langkah" },
    { title: "FAQ & Troubleshooting", icon: AlertTriangle, desc: "Pertanyaan umum dan solusi" },
  ];

  const faqs = [
    { question: "Kenapa absensi gagal?", answer: "Pastikan Anda berada di dalam radius studio. Periksa apakah browser memiliki izin akses lokasi." },
    { question: "GPS tidak akurat?", answer: "Aktifkan mode lokasi presisi (High Accuracy) di pengaturan perangkat, restart browser, lalu muat ulang (refresh) aplikasi." },
    { question: "Jadwal siaran tidak muncul?", answer: "Jadwal mungkin belum dirilis oleh admin. Coba ubah rentang tanggal atau pastikan Anda login dengan akun penyiar yang benar." },
    { question: "Video atau Streaming tidak jalan?", answer: "Periksa koneksi internet Anda. Pastikan tidak ada ekstensi pemblokir iklan (ad-blocker) yang menghalangi pemutaran media." },
    { question: "Cara tukar jadwal?", answer: "Buka menu 'Tukar Jadwal', pilih jadwal siaran Anda, pilih rekan pengganti, dan isi alasan. Rekan Anda akan mendapat notifikasi WhatsApp." },
    { question: "Cara membuat naskah AI?", answer: "Buka menu 'Buat Naskah', pilih jadwal siaran Anda, atur durasi dan gaya bahasa, lalu klik 'Hasilkan Naskah AI'." },
  ];

  const filteredFaqs = faqs.filter(
    faq => faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
           faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="menu-page">
      <section className="menu-hero" aria-label="Tutorial Radio SBL">
        <div className="menu-hero-lockup">
          <BookOpen size={40} className="text-primary" />
          <div>
            <p className="eyebrow">Pusat Bantuan</p>
            <h1>Tutorial & FAQ</h1>
            <p>Panduan lengkap menggunakan Radio SBL Operational Super App.</p>
          </div>
        </div>
      </section>

      <section className="menu-quick-panel" aria-label="Pencarian tutorial">
        <label className="menu-search-field">
          <Search size={18} />
          <input
            type="search"
            placeholder="Cari tutorial atau panduan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>
      </section>

      <section className="menu-group-stack">
        <div className="menu-group">
          <h2>Kategori Bantuan</h2>
          <div className="menu-grid">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <button key={cat.title} type="button" className="menu-tile">
                  <span className="menu-tile-icon">
                    <Icon size={21} />
                  </span>
                  <span>
                    <strong>{cat.title}</strong>
                    <small>{cat.desc}</small>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="menu-group" style={{ marginTop: "32px" }}>
          <h2>FAQ & Troubleshooting</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <details 
                  key={index} 
                  style={{ 
                    background: "var(--color-bg-subtle)", 
                    borderRadius: "8px", 
                    padding: "16px",
                    border: "1px solid var(--color-border)",
                    cursor: "pointer"
                  }}
                >
                  <summary style={{ fontWeight: 600, fontSize: "15px", outline: "none", color: "var(--color-text-primary)" }}>
                    {faq.question}
                  </summary>
                  <p style={{ marginTop: "12px", fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.5, marginLeft: "18px" }}>
                    {faq.answer}
                  </p>
                </details>
              ))
            ) : (
              <div className="ai-workspace-empty">
                <div>
                  <Search size={32} style={{ opacity: 0.5, margin: "0 auto 12px" }} />
                  <h3>Tidak ada hasil</h3>
                  <p>Coba gunakan kata kunci lain.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
