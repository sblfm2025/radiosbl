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
        title: "1. Login & Masuk Aplikasi",
        content: (
          <div style={{ paddingLeft: "16px" }}>
            <p style={{ marginBottom: "8px" }}>Untuk masuk ke Super-App Radio SBL, Anda harus menggunakan kredensial yang didaftarkan oleh Manajemen.</p>
            <ol style={{ paddingLeft: "16px", marginBottom: "12px", lineHeight: "1.6" }}>
              <li>Buka tautan aplikasi di <em>browser</em> (disarankan menggunakan Google Chrome atau Safari).</li>
              <li>Pilih opsi <strong>Sign In with Google</strong> atau masukkan Email & Password Anda.</li>
              <li>Jika login berhasil, Anda akan langsung diarahkan ke <strong>Dashboard Utama</strong>.</li>
            </ol>
            <p style={{ fontSize: "13px", background: "var(--color-bg-subtle)", padding: "12px", borderRadius: "6px", borderLeft: "3px solid var(--color-primary)" }}>
              💡 <em>Perhatian: Jika muncul pesan "Anda login sebagai Tamu", segera laporkan ke Admin agar email Anda ditautkan ke profil penyiar yang tepat.</em>
            </p>
          </div>
        )
      },
      {
        title: "2. Cara Melakukan Absensi (Radius GPS)",
        content: (
          <div style={{ paddingLeft: "16px" }}>
            <p style={{ marginBottom: "8px" }}>Sistem presensi kami menggunakan <em>Geofencing</em>. Anda hanya bisa absen jika berada di dalam radius Studio Utama.</p>
            <ol style={{ paddingLeft: "16px", marginBottom: "12px", lineHeight: "1.6" }}>
              <li>Di navigasi utama (atau di deretan ikon bawah untuk ponsel), ketuk menu <strong>Absensi</strong>.</li>
              <li>Sistem akan meminta izin lokasi. <strong>Izinkan</strong> peramban (browser) untuk mengakses GPS perangkat Anda.</li>
              <li>Tunggu hingga jarak terkalibrasi. Jika indikator menunjukkan "Di Dalam Radius" (warna hijau), panel absensi akan terbuka.</li>
              <li>Klik tombol <strong>Ambil Foto Selfie</strong> untuk merekam presensi visual (kamera depan akan aktif).</li>
              <li>Tekan <strong>Absen Masuk</strong> atau <strong>Absen Keluar</strong> sesuai shift operasional Anda.</li>
            </ol>
          </div>
        )
      },
      {
        title: "3. Cara Merespon Tukar Jadwal",
        content: (
          <div style={{ paddingLeft: "16px" }}>
            <p style={{ marginBottom: "8px" }}>Sebagai penyiar pengganti, Anda wajib memberikan persetujuan sebelum jadwal resmi berpindah nama ke Anda.</p>
            <ol style={{ paddingLeft: "16px", lineHeight: "1.6" }}>
              <li>Buka <strong>Menu Lengkap</strong> lalu pilih aplikasi <strong>Tukar Jadwal</strong>.</li>
              <li>Gulir ke bawah ke bagian <strong>Riwayat & Permintaan Masuk</strong>.</li>
              <li>Cari kartu permintaan dengan label peringatan berwarna kuning (Permintaan Masuk).</li>
              <li>Tinjau alasan pertukaran, kemudian klik <strong>Setujui</strong> (Approve) atau <strong>Tolak</strong> (Reject).</li>
              <li>Jika disetujui, jadwal siaran akan otomatis diperbarui dan tercatat di kalender utama stasiun.</li>
            </ol>
          </div>
        )
      }
    ],
    "Tutorial Penyiar": [
      {
        title: "1. Cara Membuat Naskah AI (Smart Script Studio)",
        content: (
          <div style={{ paddingLeft: "16px" }}>
            <p style={{ marginBottom: "8px" }}>Editor Naskah cerdas ini dirancang untuk memproduksi materi siaran secara presisi menggunakan mesin <em>Gemini AI</em>.</p>
            <ol style={{ paddingLeft: "16px", marginBottom: "12px", lineHeight: "1.6" }}>
              <li>Buka aplikasi <strong>Buat Naskah</strong>. Anda akan masuk ke halaman "Smart Script Studio".</li>
              <li>Pada tab <strong>Generator</strong>, pilih Program Siaran Anda dan tentukan durasi (contoh: 3 Menit).</li>
              <li>Tentukan <strong>Gaya Bahasa / Tone</strong> (Formal, Santai, Energik, Anak Muda, dsb).</li>
              <li>Di kolom Topik, ketik detail pembahasan (contoh: <em>"Opening Berita Pagi tentang Cuaca Buruk di Pinrang"</em>).</li>
              <li>Klik <strong>Hasilkan Naskah AI</strong>. Dalam hitungan detik, kerangka naskah akan muncul di <em>Editor</em>.</li>
            </ol>
            <h4 style={{ marginTop: "16px", marginBottom: "8px", fontWeight: "600" }}>Alat Editor (Toolbar Lanjutan):</h4>
            <ul style={{ paddingLeft: "16px", lineHeight: "1.6" }}>
              <li>Blok teks dan gunakan ikon <strong>Bold</strong> atau <strong>Italic</strong> untuk memberikan penekanan intonasi saat Anda membaca.</li>
              <li>Gunakan ikon <strong>Penanda Cue (🎵/🗣️)</strong> untuk menyisipkan tanda batas masuknya efek suara (SFX) atau jeda iklan.</li>
              <li>Sistem telah dilengkapi <strong>Auto-Save</strong>. Pekerjaan Anda tersimpan ke memori lokal setiap 3 detik.</li>
            </ul>
          </div>
        )
      },
      {
        title: "2. Membaca Naskah via Teleprompter",
        content: (
          <div style={{ paddingLeft: "16px" }}>
            <p style={{ marginBottom: "8px" }}>Mode Teleprompter dirancang khusus untuk layar studio agar Anda dapat bersiaran tanpa harus memegang kertas.</p>
            <ol style={{ paddingLeft: "16px", lineHeight: "1.6" }}>
              <li>Di dalam editor naskah, cari ikon <strong>Monitor Play (Teleprompter)</strong> di sudut atas editor.</li>
              <li>Layar akan beralih menjadi mode gelap penuh (*Full-screen Dark Mode*) dengan teks berukuran sangat besar.</li>
              <li>Gunakan tombol panel di bawah layar untuk mengatur <strong>Kecepatan Gulir</strong> (1x, 1.5x, 2x).</li>
              <li>Klik <strong>Play</strong> saat <em>On-Air</em> agar teks bergulir ke atas secara perlahan seiring tempo bicara Anda.</li>
              <li>Tekan tombol <strong>Keluar</strong> atau tekan tombol Escape (Esc) pada keyboard untuk kembali ke editor.</li>
            </ol>
          </div>
        )
      },
      {
        title: "3. Memonitor Request Lagu secara Realtime",
        content: (
          <div style={{ paddingLeft: "16px" }}>
            <p style={{ marginBottom: "8px" }}>Semua permintaan lagu dari WhatsApp maupun Portal Publik akan terpusat ke satu layar.</p>
            <ol style={{ paddingLeft: "16px", lineHeight: "1.6" }}>
              <li>Buka menu <strong>Request Lagu</strong> saat Anda sedang siaran di studio.</li>
              <li>Kartu permintaan akan bermunculan secara <em>realtime</em> tanpa perlu Anda me-<em>refresh</em> halaman.</li>
              <li>Daftar akan menampilkan Nama Pendengar, Judul Lagu/Artis, serta Pesan (Kirim-kirim salam).</li>
              <li>Jika lagu sudah Anda putar di <em>deck</em>, jangan lupa klik tombol <strong>Tandai Selesai (Centang)</strong> agar layar antrean tetap bersih.</li>
            </ol>
          </div>
        )
      }
    ],
    "Tutorial Admin": [
      {
        title: "1. Mengelola Persetujuan (Approval Center)",
        content: (
          <div style={{ paddingLeft: "16px" }}>
            <p style={{ marginBottom: "8px" }}>Sebagai administrator, Anda berperan sebagai pengawas operasional dengan hak veto terhadap intervensi sistem.</p>
            <ol style={{ paddingLeft: "16px", lineHeight: "1.6" }}>
              <li>Akses menu <strong>Approval Center</strong>.</li>
              <li>Sistem akan menyortir otomatis semua permintaan *pending* ke bagian teratas. Ini mencakup: <em>Absensi di Luar Radius (Bypass)</em>, <em>Cuti Tahunan</em>, atau <em>Override Jadwal Paksa</em>.</li>
              <li>Klik pada kartu pengajuan untuk membaca justifikasi/alasan yang diberikan oleh pegawai.</li>
              <li>Eksekusi keputusan: <strong>Approve (Setujui)</strong> atau <strong>Reject (Tolak)</strong>. Anda juga bisa menyertakan catatan balasan singkat.</li>
            </ol>
          </div>
        )
      },
      {
        title: "2. Alur Pemeriksaan Review Naskah AI",
        content: (
          <div style={{ paddingLeft: "16px" }}>
            <p style={{ marginBottom: "8px" }}>Untuk menjaga standarisasi jurnalistik dan Pedoman Media Siber, naskah harus diverifikasi.</p>
            <ol style={{ paddingLeft: "16px", lineHeight: "1.6" }}>
              <li>Buka aplikasi <strong>Buat Naskah</strong>.</li>
              <li>Masuk ke tab <strong>Review Naskah</strong> (Tab ini dikhususkan bagi Admin/Program Director).</li>
              <li>Sistem akan menampilkan semua naskah yang masih berstatus <em>Draft</em> milik seluruh tim siaran.</li>
              <li>Periksa kontennya. Jika disetujui, klik <strong>Approve</strong>. Naskah otomatis berpindah ke tab <em>Naskah Siap Siaran</em> dan penyiar terkait akan menerima izin bacanya.</li>
              <li>Naskah yang telah dibacakan *on-air* dapat ditandai sebagai <em>Used (Selesai)</em> pada tab berikutnya untuk kebutuhan arsip dinas.</li>
            </ol>
          </div>
        )
      }
    ],
    "Tutorial Reporter": [
      {
        title: "1. Alur Kerja Liputan (Workflow Newsroom)",
        content: (
          <div style={{ paddingLeft: "16px" }}>
            <p style={{ marginBottom: "8px" }}>Super-App dirancang untuk memperpendek jarak pelaporan antara lapangan dan redaksi pusat.</p>
            <ol style={{ paddingLeft: "16px", marginBottom: "12px", lineHeight: "1.6" }}>
              <li>Akses aplikasi <strong>Liputan / Newsroom</strong> melalui Menu Lengkap.</li>
              <li>Lihat daftar penugasan (<em>Assignment</em>) yang diberikan oleh redaktur di kolom <strong>Tugas Baru</strong>.</li>
              <li>Klik kartu tugas tersebut dan perbarui statusnya menjadi <strong>In Progress</strong> agar redaktur mengetahui Anda sudah di lapangan.</li>
              <li>Susun kerangka laporan *(draft berita)* pada editor naskah yang tersedia.</li>
              <li>Unggah lampiran media pendukung (Dokumentasi Foto TKP atau Rekaman Audio Wawancara).</li>
              <li>Bila telah usai, tekan <strong>Submit (Kirim ke Redaksi)</strong>. Liputan akan masuk ke meja editor untuk tayang di platform <em>Pinrang Berkabar</em>.</li>
            </ol>
          </div>
        )
      }
    ],
    "Video Tutorial": [
      {
        title: "Koleksi Video Walkthrough Interaktif",
        content: (
          <div style={{ paddingLeft: "16px" }}>
            <p style={{ marginBottom: "12px", lineHeight: "1.6" }}>
              Bagi Anda yang lebih nyaman dengan pembelajaran secara visual, tim Radio SBL telah memproduksi kompilasi <em>screencast</em> cara kerja sistem di lapangan sesungguhnya.
            </p>
            <ul style={{ paddingLeft: "16px", lineHeight: "1.6" }}>
              <li style={{ marginBottom: "8px" }}>
                <a href="#" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                  <PlayCircle size={16} /> Modul 1: Orientasi Dashboard Super-App (03:15)
                </a>
              </li>
              <li style={{ marginBottom: "8px" }}>
                <a href="#" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                  <PlayCircle size={16} /> Modul 2: Simulasi Absensi Geofencing & Rekam Selfie (02:30)
                </a>
              </li>
              <li style={{ marginBottom: "8px" }}>
                <a href="#" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                  <PlayCircle size={16} /> Modul 3: Praktek Produksi Naskah AI hingga Setup Teleprompter (05:45)
                </a>
              </li>
              <li style={{ marginBottom: "8px" }}>
                <a href="#" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                  <PlayCircle size={16} /> Modul 4: Manajemen Persetujuan untuk Level Eksekutif (04:10)
                </a>
              </li>
            </ul>
            <p style={{ marginTop: "16px", fontSize: "13px", color: "var(--color-text-secondary)", background: "var(--color-bg-subtle)", padding: "10px", borderRadius: "6px" }}>
              <em>Catatan: Repositori video ditautkan secara langsung ke saluran YouTube Internal Radio SBL. Jika Anda menemui tautan rusak (broken link), harap hubungi divisi Multimedia.</em>
            </p>
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
