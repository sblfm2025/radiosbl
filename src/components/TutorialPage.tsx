import { BookOpen, PlayCircle, Search, User, Mic2, ShieldCheck, AlertTriangle, ArrowLeft } from "lucide-react";
import { useState } from "react";

export function TutorialPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = [
    { title: "Panduan Cepat", icon: BookOpen, desc: "Langkah dasar menggunakan Radio SBL" },
    { title: "Tutorial Penyiar", icon: Mic2, desc: "Persiapan, jadwal, dan request lagu" },
    { title: "Tutorial Admin", icon: ShieldCheck, desc: "Manajemen user dan persetujuan" },
    { title: "Tutorial Reporter", icon: User, desc: "Liputan, event, dan laporan" },
    { title: "Video Tutorial", icon: PlayCircle, desc: "Tonton langkah demi langkah" },
    { title: "FAQ & Troubleshooting", icon: AlertTriangle, desc: "Pertanyaan umum dan solusi" },
  ];

  const guidesData: Record<string, { title: string, content: React.ReactNode }[]> = {
    "Panduan Cepat": [
      {
        title: "Cara Melakukan Absensi",
        content: (
          <div style={{ paddingLeft: "16px" }}>
            <ol style={{ paddingLeft: "16px", marginBottom: "12px" }}>
              <li>Buka menu <strong>Absensi</strong> di navigasi utama.</li>
              <li>Pastikan GPS/Lokasi perangkat Anda aktif dan memiliki akurasi tinggi (High Accuracy).</li>
              <li>Tunggu hingga indikator jarak menunjukkan Anda berada di dalam radius Radio SBL (warna hijau).</li>
              <li>Klik tombol <strong>Absen Masuk</strong> atau <strong>Ambil Foto Selfie</strong>.</li>
              <li>Tunggu konfirmasi absensi berhasil tersimpan.</li>
            </ol>
            <p style={{ fontSize: "13px", background: "var(--color-bg-subtle)", padding: "8px", borderRadius: "4px" }}>
              💡 <em>Tips: Jika lokasi tidak akurat, muat ulang (refresh) browser atau keluar sebentar dari ruangan tertutup.</em>
            </p>
          </div>
        )
      },
      {
        title: "Cara Merespon Tukar Jadwal",
        content: (
          <div style={{ paddingLeft: "16px" }}>
            <ol style={{ paddingLeft: "16px" }}>
              <li>Buka <strong>Menu Lengkap</strong> lalu pilih <strong>Tukar Jadwal</strong>.</li>
              <li>Gulir ke bawah ke bagian <strong>Riwayat & Permintaan Masuk</strong>.</li>
              <li>Jika ada permintaan masuk (label kuning), klik <strong>Setujui</strong> atau <strong>Tolak</strong>.</li>
              <li>Jika disetujui, jadwal siaran akan otomatis diperbarui.</li>
            </ol>
          </div>
        )
      }
    ],
    "Tutorial Penyiar": [
      {
        title: "Cara Membuat Naskah AI (Smart Script Studio)",
        content: (
          <div style={{ paddingLeft: "16px" }}>
            <ol style={{ paddingLeft: "16px" }}>
              <li>Buka menu <strong>Buat Naskah</strong>.</li>
              <li>Di tab <strong>Generator</strong>, pilih program siaran Anda dan atur durasi (contoh: 3 menit).</li>
              <li>Ketikkan topik atau instruksi (contoh: <em>Opening Berita Pagi yang Semangat</em>) dan pilih Gaya Bahasa (Formal/Santai).</li>
              <li>Klik <strong>Hasilkan Naskah AI</strong>.</li>
              <li>Gunakan tombol toolbar di atas editor untuk memformat (Bold, Italic) atau menambah pembatas segmen (Cue Marker). Naskah otomatis tersimpan setiap 3 detik.</li>
              <li>Gunakan ikon <strong>Teleprompter</strong> (gambar monitor) untuk membaca naskah saat bersiaran tanpa distraksi.</li>
            </ol>
          </div>
        )
      },
      {
        title: "Cara Memonitor Request Lagu",
        content: (
          <div style={{ paddingLeft: "16px" }}>
            <ol style={{ paddingLeft: "16px" }}>
              <li>Buka menu <strong>Request Lagu</strong>.</li>
              <li>Semua permintaan masuk akan tampil secara <em>realtime</em>.</li>
              <li>Tandai lagu sebagai <strong>Sudah Diputar</strong> dengan mengklik ikon centang agar daftar tetap bersih.</li>
            </ol>
          </div>
        )
      }
    ],
    "Tutorial Admin": [
      {
        title: "Cara Mengelola Persetujuan (Approval)",
        content: (
          <div style={{ paddingLeft: "16px" }}>
            <ol style={{ paddingLeft: "16px" }}>
              <li>Buka menu <strong>Approval Center</strong>.</li>
              <li>Tinjau daftar permintaan seperti absensi manual, pengajuan cuti, atau override jadwal.</li>
              <li>Klik <strong>Approve</strong> atau <strong>Reject</strong> lalu masukkan catatan alasan.</li>
            </ol>
          </div>
        )
      }
    ]
  };

  const faqs = [
    { question: "Kenapa absensi gagal?", answer: "Pastikan Anda berada di dalam radius studio. Periksa apakah browser memiliki izin akses lokasi." },
    { question: "GPS tidak akurat?", answer: "Aktifkan mode lokasi presisi (High Accuracy) di pengaturan perangkat, restart browser, lalu muat ulang (refresh) aplikasi." },
    { question: "Jadwal siaran tidak muncul?", answer: "Jadwal mungkin belum dirilis oleh admin. Coba ubah rentang tanggal atau pastikan Anda login dengan akun penyiar yang benar." },
    { question: "Video atau Streaming tidak jalan?", answer: "Periksa koneksi internet Anda. Pastikan tidak ada ekstensi pemblokir iklan (ad-blocker) yang menghalangi pemutaran media." },
    { question: "Cara tukar jadwal?", answer: "Buka menu 'Tukar Jadwal', pilih jadwal siaran Anda, pilih rekan pengganti, dan isi alasan. Rekan Anda akan mendapat notifikasi WhatsApp." },
    { question: "Cara mengekspor naskah AI?", answer: "Di halaman Buat Naskah, masuk ke tab 'Review Naskah' atau 'Naskah Siap Siaran'. Klik tombol 'Export' pada naskah yang dituju untuk mengunduhnya sebagai file TXT." },
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
            <p>Panduan operasional dan pemecahan masalah (Troubleshooting).</p>
          </div>
        </div>
      </section>

      {!activeCategory && (
        <section className="menu-quick-panel" aria-label="Pencarian tutorial">
          <label className="menu-search-field">
            <Search size={18} />
            <input
              type="search"
              placeholder="Cari panduan atau masalah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
        </section>
      )}

      <section className="menu-group-stack">
        {activeCategory ? (
          <div className="menu-group slide-in">
            <button 
              type="button" 
              onClick={() => setActiveCategory(null)}
              style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", marginBottom: "20px", fontWeight: 500 }}
            >
              <ArrowLeft size={18} /> Kembali ke Pusat Bantuan
            </button>
            
            <h2 style={{ fontSize: "20px", marginBottom: "16px", color: "var(--color-primary)" }}>
              {activeCategory}
            </h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {guidesData[activeCategory] ? guidesData[activeCategory].map((guide, idx) => (
                <div key={idx} style={{ background: "var(--color-bg-subtle)", borderRadius: "8px", border: "1px solid var(--color-border)", padding: "20px" }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "24px", height: "24px", background: "var(--color-primary)", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0 }}>
                      {idx + 1}
                    </div>
                    {guide.title}
                  </h3>
                  <div style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                    {guide.content}
                  </div>
                </div>
              )) : (
                <div className="ai-workspace-empty">
                  <div>
                    <BookOpen size={42} />
                    <h3>Dokumentasi Sedang Disusun</h3>
                    <p>Materi untuk {activeCategory} akan segera hadir di pembaruan berikutnya.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {!searchTerm && (
              <div className="menu-group">
                <h2>Kategori Dokumentasi</h2>
                <div className="menu-grid">
                  {categories.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button 
                        key={cat.title} 
                        type="button" 
                        className="menu-tile"
                        onClick={() => setActiveCategory(cat.title)}
                      >
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
            )}

            <div className="menu-group" style={{ marginTop: searchTerm ? "0" : "32px" }}>
              <h2>{searchTerm ? "Hasil Pencarian FAQ" : "FAQ & Troubleshooting"}</h2>
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
                        cursor: "pointer",
                        transition: "all 0.2s ease"
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
          </>
        )}
      </section>
    </main>
  );
}
