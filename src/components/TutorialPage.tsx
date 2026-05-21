import { BookOpen, PlayCircle, Search, User, Mic2, ShieldCheck, AlertTriangle, ArrowLeft, Headphones, Video } from "lucide-react";
import { useState, useEffect } from "react";
export function TutorialPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    // Reset scroll when category changes to give a fresh visual starting point
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeCategory]);

  const categories = [
    { title: "Panduan Cepat", icon: BookOpen, desc: "Langkah dasar menggunakan Radio SBL" },
    { title: "Tutorial Penyiar", icon: Mic2, desc: "Persiapan, jadwal, dan request lagu" },
    { title: "Tutorial Admin", icon: ShieldCheck, desc: "Manajemen user dan persetujuan" },
    { title: "Tutorial Reporter", icon: User, desc: "Liputan, event, dan laporan" },
    { title: "Tutorial Operator", icon: Headphones, desc: "Monitoring dan operasional studio" },
    { title: "Pinrang Berkabar", icon: Video, desc: "Manajemen video dan media siber" },
    { title: "Video Tutorial", icon: PlayCircle, desc: "Tonton langkah demi langkah" },
    { title: "Troubleshooting", icon: AlertTriangle, desc: "Pemecahan masalah teknis" },
  ];

  const guidesData: Record<string, { title: string, content: React.ReactNode }[]> = {
    "Panduan Cepat": [
      {
        title: "1. Login ke Radio SBL Super-App",
        content: (
          <div className="prose">
            <p>Untuk masuk ke aplikasi, pastikan email Anda sudah terdaftar oleh Admin/Manajemen.</p>
            <ol>
              <li>Buka tautan aplikasi di <em>browser</em>.</li>
              <li>Pilih opsi <strong>Sign In with Google</strong> (disarankan) atau masukkan kredensial.</li>
              <li>Anda akan diarahkan ke <strong>Dashboard Utama</strong>.</li>
            </ol>
          </div>
        )
      },
      {
        title: "2. Absensi Berbasis Radius (Geofencing)",
        content: (
          <div className="prose">
            <ol>
              <li>Pilih menu <strong>Absensi</strong>.</li>
              <li>Izinkan akses lokasi GPS pada peramban Anda.</li>
              <li>Pastikan indikator menampilkan warna hijau ("Di Dalam Radius").</li>
              <li>Klik <strong>Ambil Foto Selfie</strong> lalu <strong>Absen Masuk</strong>.</li>
            </ol>
          </div>
        )
      },
      {
        title: "3. Mengecek Jadwal Siaran",
        content: (
          <div className="prose">
            <ol>
              <li>Pilih menu <strong>Jadwal Siaran</strong>.</li>
              <li>Anda akan melihat jadwal mingguan stasiun. Jadwal Anda disorot secara otomatis.</li>
              <li>Perhatikan tag warna (Live, Draft, Completed) pada jadwal.</li>
            </ol>
          </div>
        )
      },
      {
        title: "4. Request Lagu (Dasar)",
        content: (
          <div className="prose">
            <ol>
              <li>Buka menu <strong>Request Lagu</strong>.</li>
              <li>Semua permintaan masuk akan tampil secara <em>realtime</em>.</li>
              <li>Tandai lagu sebagai <strong>Selesai</strong> setelah diputarkan.</li>
            </ol>
          </div>
        )
      },
      {
        title: "5. Live Monitoring Dashboard",
        content: (
          <div className="prose">
            <ol>
              <li>Di halaman <strong>Dashboard</strong>, lihat bagian <strong>Featured Live Card</strong>.</li>
              <li>Anda dapat memantau program yang sedang <em>On-Air</em> beserta nama penyiarnya.</li>
            </ol>
          </div>
        )
      }
    ],
    "Tutorial Penyiar": [
      {
        title: "1. Persiapan & Login Studio",
        content: (
          <div className="prose">
            <ol>
              <li>Login menggunakan akun ber-<em>role</em> Penyiar.</li>
              <li>Lakukan absensi masuk minimal 15 menit sebelum program Anda dimulai.</li>
              <li>Buka tab jadwal untuk memastikan tidak ada perubahan mendadak dari Admin.</li>
            </ol>
          </div>
        )
      },
      {
        title: "2. Tukar Jadwal dengan Rekan",
        content: (
          <div className="prose">
            <ol>
              <li>Pilih menu <strong>Tukar Jadwal</strong>.</li>
              <li>Pilih jadwal Anda yang ingin ditukar, lalu pilih nama rekan penyiar pengganti.</li>
              <li>Isi kolom alasan (contoh: <em>Izin urusan keluarga</em>) lalu klik Ajukan.</li>
              <li>Rekan Anda dan Admin harus menyetujui pengajuan tersebut agar jadwal resmi berubah.</li>
            </ol>
          </div>
        )
      },
      {
        title: "3. Mengelola Antrean Request Lagu",
        content: (
          <div className="prose">
            <p>Manajemen request yang baik membuat siaran lebih interaktif.</p>
            <ol>
              <li>Buka menu <strong>Request Lagu</strong>.</li>
              <li>Perhatikan daftar antrean. Request dengan status "Notified" berarti belum diputarkan.</li>
              <li>Sebutkan nama dan pesan pendengar secara berurutan.</li>
              <li>Gunakan fitur "Swipe" (geser) atau tekan tombol <strong>Selesai</strong> pada kartu request agar antrean bersih.</li>
            </ol>
          </div>
        )
      },
      {
        title: "4. Menggunakan Smart Script Studio (AI Generator)",
        content: (
          <div className="prose">
            <ol>
              <li>Buka <strong>Buat Naskah</strong> lalu pilih program.</li>
              <li>Isi durasi dan topik spesifik (misal: "Tips menjaga kesehatan di musim hujan").</li>
              <li>Atur <em>Tone</em> menjadi "Santai" atau "Formal".</li>
              <li>Klik <strong>Hasilkan Naskah AI</strong>. Editor akan terisi otomatis.</li>
            </ol>
          </div>
        )
      },
      {
        title: "5. Menambahkan Cue Siaran & Format Teks",
        content: (
          <div className="prose">
            <ol>
              <li>Di dalam editor naskah, gunakan ikon pembatas (seperti Musik atau Jeda Iklan) pada *toolbar*.</li>
              <li>Sistem akan menyisipkan teks `[CUE: MUSIC IN]` atau `[SEGMENT BREAK]`.</li>
              <li>Tebalkan poin penting menggunakan ikon <strong>B</strong> (Bold).</li>
              <li>Naskah tersimpan otomatis setiap 3 detik.</li>
            </ol>
          </div>
        )
      },
      {
        title: "6. Operasional Teleprompter (Live Tools)",
        content: (
          <div className="prose">
            <ol>
              <li>Di halaman editor, klik ikon <strong>Monitor</strong> (Teleprompter).</li>
              <li>Tekan tombol <strong>Play</strong> untuk memulai guliran teks.</li>
              <li>Atur tombol kecepatan (&gt;&gt; atau &lt;&lt;) sesuai ritme baca Anda.</li>
            </ol>
          </div>
        )
      }
    ],
    "Tutorial Admin": [
      {
        title: "1. Monitoring Realtime (Command Center)",
        content: (
          <div className="prose">
            <ol>
              <li>Melalui <strong>Dashboard Utama</strong>, Anda dapat melihat widget "Sedang Siaran".</li>
              <li>Semua log aktivitas masuk secara *real-time* (absensi terbaru, request lagu, naskah).</li>
              <li>Perhatikan peringatan (badge) berwarna merah untuk tindakan yang membutuhkan perhatian segera.</li>
            </ol>
          </div>
        )
      },
      {
        title: "2. Menyetujui/Menolak Pengajuan (Approval System)",
        content: (
          <div className="prose">
            <ol>
              <li>Buka menu <strong>Approval Center</strong> atau <strong>Tukar Jadwal</strong> (bagian manajemen).</li>
              <li>Kartu pengajuan dari staf akan tampil dengan status <em>Pending</em>.</li>
              <li>Evaluasi pengajuan, lalu klik <strong>Approve</strong> atau <strong>Reject</strong>.</li>
              <li>Berikan catatan jika Anda menolak pengajuan tersebut.</li>
            </ol>
          </div>
        )
      },
      {
        title: "3. User Management & Hak Akses",
        content: (
          <div className="prose">
            <ol>
              <li>Akses menu <strong>Manajemen User</strong> (khusus Super Admin).</li>
              <li>Anda dapat mengubah *role* seorang user (misal dari Publik menjadi Penyiar).</li>
              <li>Untuk pengguna berstatus "Tamu", lakukan <em>Link Account</em> untuk menyambungkan email dengan data profil penyiar di Firebase.</li>
            </ol>
          </div>
        )
      },
      {
        title: "4. Manajemen Operasional Jadwal",
        content: (
          <div className="prose">
            <ol>
              <li>Masuk ke halaman <strong>Kalender / Jadwal</strong>.</li>
              <li>Pilih opsi "Override Jadwal" jika ada keadaan darurat (bencana alam/breaking news) yang mengharuskan jadwal reguler dibatalkan.</li>
              <li>Sistem akan menggantikan slot waktu tersebut dengan program khusus darurat.</li>
            </ol>
          </div>
        )
      },
      {
        title: "5. Laporan & Ekspor Data",
        content: (
          <div className="prose">
            <ol>
              <li>Buka halaman <strong>Laporan Absensi</strong> atau <strong>Laporan Siaran</strong>.</li>
              <li>Gunakan filter tanggal untuk menentukan periode pelaporan (contoh: 1 Bulan terakhir).</li>
              <li>Klik tombol <strong>Ekspor CSV/PDF</strong> untuk merekap data kinerja sebagai bahan evaluasi manajemen.</li>
            </ol>
          </div>
        )
      }
    ],
    "Tutorial Reporter": [
      {
        title: "1. Alur Kerja Newsroom (Workflow Liputan)",
        content: (
          <div className="prose">
            <ol>
              <li>Akses aplikasi <strong>Liputan / Newsroom</strong> melalui Menu Lengkap.</li>
              <li>Buka tab <strong>Tugas Saya</strong> untuk melihat instruksi peliputan (<em>Assignment</em>).</li>
              <li>Ubah status tugas menjadi <strong>In Progress</strong> saat Anda berada di lapangan.</li>
            </ol>
          </div>
        )
      },
      {
        title: "2. Upload Naskah Berita",
        content: (
          <div className="prose">
            <ol>
              <li>Gunakan editor di dalam kartu tugas Anda.</li>
              <li>Ketikkan naskah laporan (Gunakan prinsip 5W+1H jurnalistik).</li>
              <li>Pastikan mematuhi <strong>Pedoman Media Siber</strong> yang tersedia di menu.</li>
            </ol>
          </div>
        )
      },
      {
        title: "3. Upload Media (Voice Note & Foto)",
        content: (
          <div className="prose">
            <ol>
              <li>Klik ikon <strong>Klip Dokumen</strong> atau tombol lampiran di bawah editor liputan.</li>
              <li>Unggah aset visual (Foto) atau rekaman audio (Wawancara narasumber).</li>
              <li>Maksimal ukuran file mengikuti kebijakan *Firebase Storage* stasiun.</li>
            </ol>
          </div>
        )
      },
      {
        title: "4. Mengirim Liputan ke Redaksi",
        content: (
          <div className="prose">
            <ol>
              <li>Setelah semua siap, tekan tombol <strong>Submit Liputan</strong>.</li>
              <li>Status akan berubah menjadi <strong>Submitted / Reviewing</strong>.</li>
              <li>Tunggu persetujuan redaktur (Admin). Jika ada revisi, Anda akan menerima pemberitahuan.</li>
            </ol>
          </div>
        )
      }
    ],
    "Tutorial Operator": [
      {
        title: "1. Monitoring Realtime Live Studio",
        content: (
          <div className="prose">
            <p>Sebagai operator/teknisi di ruang kontrol utama (Master Control Room):</p>
            <ol>
              <li>Buka <strong>Dashboard</strong> khusus Operator.</li>
              <li>Pantau grafik status pemancar dan <em>uptime streaming</em> server.</li>
              <li>Jika ada gangguan (merah), lakukan *troubleshooting* pada instrumen fisik studio.</li>
            </ol>
          </div>
        )
      },
      {
        title: "2. Request Management",
        content: (
          <div className="prose">
            <p>Operator membantu penyiar menyaring <em>request</em> yang masuk.</p>
            <ol>
              <li>Buka modul <strong>Request Lagu</strong>.</li>
              <li>Tandai lagu-lagu yang sudah Anda masukkan ke *playlist* di RadioBOSS dengan status <strong>Queued</strong>.</li>
              <li>Hapus komentar atau <em>request</em> yang mengandung kata tidak pantas (SARA).</li>
            </ol>
          </div>
        )
      },
      {
        title: "3. Studio Monitoring & Operational Tools",
        content: (
          <div className="prose">
            <ol>
              <li>Pastikan komputer penyiar (Studio 1) sudah sinkron dengan jadwal aplikasi Super-App.</li>
              <li>Sediakan bantuan teknis jika penyiar mengeluhkan Teleprompter tidak bergulir.</li>
              <li>Gunakan tombol sinkronisasi paksa (*Force Sync*) pada menu pengaturan jika koneksi internet sempat terputus.</li>
            </ol>
          </div>
        )
      }
    ],
    "Pinrang Berkabar": [
      {
        title: "1. Mengelola Portal Video (Pinrang Berkabar)",
        content: (
          <div className="prose">
            <ol>
              <li>Portal <strong>Pinrang Berkabar</strong> adalah etalase video jurnalistik resmi Radio SBL.</li>
              <li>Video ditayangkan menggunakan ekosistem *embedded player* (seperti YouTube iframe) agar tidak membebani server lokal.</li>
              <li>Untuk menonton, klik <em>Thumbnail</em> video dan konten akan diputar di dalam aplikasi (tidak keluar jendela).</li>
            </ol>
          </div>
        )
      },
      {
        title: "2. Upload & Manajemen Video",
        content: (
          <div className="prose">
            <ol>
              <li>Hanya Admin dan Tim Multimedia yang dapat menambahkan video baru.</li>
              <li>Buka menu <strong>Kelola Konten &gt; Pinrang Berkabar</strong>.</li>
              <li>Masukkan Tautan YouTube, Judul Berita, dan Deskripsi.</li>
              <li>Berikan status <em>Published</em> agar video tampil di menu publik.</li>
            </ol>
          </div>
        )
      },
      {
        title: "3. Etika Media Siber & Guideline",
        content: (
          <div className="prose">
            <p>Setiap reporter dan admin video wajib tunduk pada <strong>Pedoman Media Siber</strong>.</p>
            <ol>
              <li>Video berita dilarang menampilkan identitas korban di bawah umur secara visual (blur wajib dilakukan).</li>
              <li>Hak Cipta: Dilarang menggunakan *footage* video milik stasiun TV lain tanpa izin (*fair use* diperbolehkan dengan mencantumkan sumber visual di layar).</li>
            </ol>
          </div>
        )
      }
    ],
    "Video Tutorial": [
      {
        title: "Screencast & Walkthrough",
        content: (
          <div className="prose">
            <p>Silakan tonton panduan visual berikut (Tautan ke Kanal YouTube Internal Radio SBL):</p>
            <ul>
              <li><a href="#" className="text-primary font-medium">Cara Login dan Pemahaman Dashboard Super-App (03:15)</a></li>
              <li><a href="#" className="text-primary font-medium">Langkah Absensi menggunakan Geofencing (02:30)</a></li>
              <li><a href="#" className="text-primary font-medium">Praktek Penulisan Naskah AI & Setup Teleprompter (05:45)</a></li>
              <li><a href="#" className="text-primary font-medium">Workflow Newsroom untuk Reporter Lapangan (04:10)</a></li>
            </ul>
          </div>
        )
      }
    ],
    "Troubleshooting": [
      {
        title: "1. Masalah GPS Tidak Akurat",
        content: (
          <div className="prose">
            <p><strong>Penyebab:</strong> Browser tidak diberikan hak ases presisi atau Anda berada di dalam gedung beton yang menghalangi satelit.</p>
            <p><strong>Solusi:</strong></p>
            <ul>
              <li>Aktifkan fitur <strong>High Accuracy / Lokasi Presisi</strong> di pengaturan Android/iOS Anda.</li>
              <li>Keluarlah dari ruangan, menepi di teras gedung selama 10 detik.</li>
              <li>Muat ulang (Refresh) halaman aplikasi.</li>
            </ul>
          </div>
        )
      },
      {
        title: "2. Jadwal Siaran Tidak Muncul",
        content: (
          <div className="prose">
            <p><strong>Penyebab:</strong> Jadwal belum dirilis, akun Anda belum di-<em>link</em>, atau salah filter hari.</p>
            <p><strong>Langkah Cepat:</strong></p>
            <ul>
              <li>Cek profil di sudut kanan atas, pastikan peran (role) Anda sudah "Penyiar".</li>
              <li>Ganti filter hari di kalender jadwal ke "Semua Hari".</li>
              <li>Hubungi Program Director.</li>
            </ul>
          </div>
        )
      },
      {
        title: "3. Teleprompter Naskah Macet",
        content: (
          <div className="prose">
            <p><strong>Penyebab:</strong> Browser mengalami <em>memory freeze</em> atau kecepatan teks diatur ke 0x.</p>
            <p><strong>Solusi:</strong></p>
            <ul>
              <li>Tekan tombol "Jeda" lalu "Play" kembali.</li>
              <li>Naikkan kecepatan di panel atas (misal ke 1.5x).</li>
            </ul>
          </div>
        )
      },
      {
        title: "4. Gagal Upload Foto Absensi",
        content: (
          <div className="prose">
            <p><strong>Penyebab:</strong> Izin kamera ditolak oleh *browser* atau ukuran foto terlalu besar.</p>
            <p><strong>Solusi:</strong></p>
            <ul>
              <li>Klik ikon gembok pada *URL bar browser*, izinkan opsi <strong>Kamera</strong>.</li>
              <li>Coba bersihkan *Cache* aplikasi.</li>
            </ul>
          </div>
        )
      }
    ]
  };

  const faqs = [
    { question: "Kenapa absensi gagal?", answer: "Pastikan Anda berada di dalam radius studio. Periksa apakah browser memiliki izin akses lokasi." },
    { question: "GPS tidak akurat?", answer: "Aktifkan mode lokasi presisi (High Accuracy) di pengaturan perangkat, restart browser, lalu muat ulang aplikasi." },
    { question: "Jadwal siaran tidak muncul?", answer: "Jadwal mungkin belum dirilis oleh admin. Pastikan Anda login dengan akun penyiar yang sudah diverifikasi (Bukan Tamu)." },
    { question: "Video atau Streaming tidak jalan?", answer: "Periksa koneksi internet Anda. Matikan fitur penghemat kuota atau pemblokir iklan (ad-blocker) pada browser." },
    { question: "Cara tukar jadwal?", answer: "Buka menu Tukar Jadwal, pilih jadwal siaran Anda, pilih rekan pengganti, dan isi alasan." },
    { question: "Kenapa saya tidak bisa buka Menu Approval?", answer: "Menu Approval Center dikhususkan untuk akun dengan peran Admin, Leader, atau Super Admin." },
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
            <p className="eyebrow">Pusat Pengetahuan (Knowledge Base)</p>
            <h1>Tutorial & Panduan Lengkap</h1>
            <p>Pusat operasional komprehensif mulai dari penyiar hingga admin newsroom.</p>
          </div>
        </div>
      </section>

      {!activeCategory && (
        <section className="menu-quick-panel" aria-label="Pencarian tutorial">
          <label className="menu-search-field">
            <Search size={18} />
            <input
              type="search"
              placeholder="Cari panduan, FAQ, atau ketik masalah Anda..."
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
              <ArrowLeft size={18} /> Kembali ke Kategori Dokumentasi
            </button>
            
            <h2 style={{ fontSize: "22px", marginBottom: "20px", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              {categories.find(c => c.title === activeCategory)?.icon && (() => {
                const IconComponent = categories.find(c => c.title === activeCategory)!.icon;
                return <IconComponent size={24} />;
              })()}
              {activeCategory}
            </h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {guidesData[activeCategory] ? guidesData[activeCategory].map((guide, idx) => (
                <article key={idx} style={{ background: "var(--color-bg-surface)", borderRadius: "12px", border: "1px solid var(--color-border)", padding: "24px" }}>
                  <h3 style={{ fontSize: "17px", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "12px", fontWeight: 600 }}>
                    <div style={{ width: "24px", height: "24px", background: "var(--color-primary)", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, marginTop: "2px" }}>
                      {idx + 1}
                    </div>
                    {guide.title}
                  </h3>
                  <div style={{ fontSize: "15px", color: "var(--color-text-secondary)", lineHeight: 1.6, marginLeft: "36px" }} className="tutorial-content">
                    {guide.content}
                  </div>
                </article>
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
                <h2>Buku Saku & Panduan Peran</h2>
                <div className="menu-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                  {categories.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button 
                        key={cat.title} 
                        type="button" 
                        className="menu-tile"
                        style={{ alignItems: "flex-start", padding: "20px", background: "var(--color-bg-surface)" }}
                        onClick={() => setActiveCategory(cat.title)}
                      >
                        <span className="menu-tile-icon" style={{ background: "var(--color-bg-subtle)", padding: "10px", borderRadius: "12px", color: "var(--color-primary)" }}>
                          <Icon size={24} />
                        </span>
                        <span style={{ textAlign: "left", marginTop: "4px" }}>
                          <strong style={{ fontSize: "16px", display: "block", marginBottom: "4px" }}>{cat.title}</strong>
                          <small style={{ fontSize: "13px", lineHeight: 1.4, color: "var(--color-text-secondary)", display: "block" }}>{cat.desc}</small>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="menu-group" style={{ marginTop: searchTerm ? "0" : "32px" }}>
              <h2>{searchTerm ? "Hasil Pencarian Cepat" : "FAQ (Pertanyaan Umum)"}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq, index) => (
                    <details 
                      key={index} 
                      style={{ 
                        background: "var(--color-bg-surface)", 
                        borderRadius: "8px", 
                        padding: "16px",
                        border: "1px solid var(--color-border)",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <summary style={{ fontWeight: 600, fontSize: "15px", outline: "none", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "var(--color-primary)", fontWeight: "bold" }}>Q:</span> {faq.question}
                      </summary>
                      <p style={{ marginTop: "12px", fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.6, marginLeft: "24px", paddingLeft: "12px", borderLeft: "2px solid var(--color-border)" }}>
                        {faq.answer}
                      </p>
                    </details>
                  ))
                ) : (
                  <div className="ai-workspace-empty">
                    <div>
                      <Search size={32} style={{ opacity: 0.5, margin: "0 auto 12px" }} />
                      <h3>Tidak ada FAQ yang cocok</h3>
                      <p>Ketik kata kunci lain seperti "lokasi", "jadwal", atau jelajahi kategori di atas.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>
      
      <style>{`
        .tutorial-content ol, .tutorial-content ul {
          margin-bottom: 16px;
          padding-left: 20px;
        }
        .tutorial-content li {
          margin-bottom: 8px;
        }
        .tutorial-content p {
          margin-bottom: 12px;
        }
        .tutorial-content strong {
          color: var(--color-text-primary);
        }
      `}</style>
      
      <div style={{ textAlign: "center", padding: "40px 20px 20px", marginTop: "32px", borderTop: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
        <p style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "0.5px" }}>Developed by <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>MAROA Project</span></p>
        <p style={{ fontSize: "11px", marginTop: "4px", opacity: 0.7 }}>&copy; {new Date().getFullYear()} LPPL Radio Suara Bumi Lasinrang</p>
      </div>
    </main>
  );
}
