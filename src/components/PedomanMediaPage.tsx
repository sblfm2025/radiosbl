import { FileText, CheckCircle2, AlertCircle, Info, ShieldAlert, Shield, User } from "lucide-react";
import { useState, useEffect } from "react";

const sections = [
  { id: "ruang-lingkup", title: "1. Ruang Lingkup" },
  { id: "verifikasi", title: "2. Verifikasi & Keberimbangan Berita" },
  { id: "isi-buatan-pengguna", title: "3. Isi Buatan Pengguna (UGC)" },
  { id: "opini", title: "4. Opini, Fakta, & Prasangka" },
  { id: "ralat", title: "5. Ralat, Koreksi, & Hak Jawab" },
  { id: "pencabutan", title: "6. Pencabutan Berita" },
  { id: "iklan", title: "7. Iklan & Sponsor" },
  { id: "hak-cipta", title: "8. Hak Cipta & Plagiarisme" },
  { id: "sengketa", title: "9. Penyelesaian Sengketa" },
];

export function PedomanMediaPage() {
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const totalScrollable = documentHeight - windowHeight;
      if (totalScrollable <= 0) {
        setReadingProgress(100);
      } else {
        setReadingProgress(Math.min(100, Math.max(0, (scrollPosition / totalScrollable) * 100)));
      }
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  return (
    <main className="dashboard-page pedoman-page" style={{ paddingBottom: '5rem', background: "var(--color-bg-base)" }}>
      <div 
        style={{
          position: "fixed", top: 0, left: 0, height: "4px", backgroundColor: "var(--color-primary, #10b981)",
          width: `${readingProgress}%`, zIndex: 100, transition: "width 0.1s ease-out"
        }}
      />
      
      <section className="dashboard-topbar" style={{ marginBottom: "2rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "2rem" }}>
        <div className="dashboard-greeting">
          <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>Pedoman Pemberitaan Media Siber</h1>
          <p style={{ color: "var(--color-text-secondary)", maxWidth: "800px", lineHeight: "1.6" }}>
            Berdasarkan Peraturan Dewan Pers Nomor: 1/Peraturan-DP/III/2012, dokumen ini diadaptasi sebagai kode etik operasional yang mengikat seluruh penyiar, redaktur, dan reporter yang berada di bawah naungan <strong>Lembaga Penyiaran Publik Lokal Radio Suara Bumi Lasinrang (LPPL Radio SBL 92.1 FM Pinrang)</strong> beserta divisi siber <em>Pinrang Berkabar</em>.
          </p>
        </div>
        <div style={{ background: "var(--color-bg-subtle)", padding: "16px", borderRadius: "12px" }}>
          <Shield size={48} color="var(--color-primary)" />
        </div>
      </section>

      <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap", alignItems: "flex-start", maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Sticky TOC */}
        <aside style={{ flex: "1 1 280px", position: "sticky", top: "2rem" }}>
          <div style={{ background: "var(--color-bg-surface)", padding: "20px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "1rem", color: "var(--color-text-muted)", letterSpacing: "1px" }}>DAFTAR ISI KODE ETIK</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              {sections.map(sec => (
                <li key={sec.id}>
                  <a 
                    href={`#${sec.id}`} 
                    style={{ 
                      textDecoration: "none", 
                      fontSize: "14px", 
                      color: "var(--color-text-secondary)", 
                      transition: "color 0.2s",
                      fontWeight: 500
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = "var(--color-primary)"}
                    onMouseOut={(e) => e.currentTarget.style.color = "var(--color-text-secondary)"}
                  >
                    {sec.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Content Section */}
        <section style={{ flex: "3 1 600px", display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          <article id="ruang-lingkup" style={{ background: "var(--color-bg-surface)", padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--color-primary)" }}>
              <FileText size={22} /> 1. Ruang Lingkup
            </h2>
            <p style={{ lineHeight: 1.7, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              Pedoman ini berlaku secara mengikat untuk seluruh layanan informasi, siaran langsung (On-Air), konten media sosial, dan portal berita <em>Pinrang Berkabar</em> yang dinaungi oleh <strong>Radio SBL Pinrang</strong>. 
            </p>
            <p style={{ lineHeight: 1.7, color: "var(--color-text-primary)" }}>
              Media Siber dalam konteks ini adalah segala bentuk media yang menggunakan wahana internet dan melaksanakan kegiatan jurnalistik, serta memenuhi persyaratan Undang-Undang Pers dan Standar Perusahaan Pers yang ditetapkan oleh Dewan Pers Nasional.
            </p>
          </article>

          <article id="verifikasi" style={{ background: "var(--color-bg-surface)", padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--color-primary)" }}>
              <CheckCircle2 size={22} /> 2. Verifikasi dan Keberimbangan Berita
            </h2>
            <ol style={{ lineHeight: 1.7, color: "var(--color-text-primary)", paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              <li>Pada prinsipnya setiap berita harus melalui <strong>proses verifikasi ganda (Cover Both Sides)</strong> yang ketat sebelum disiarkan atau dipublikasikan.</li>
              <li>Berita yang berpotensi merugikan pihak lain (contoh: dugaan korupsi, kecelakaan, konflik warga) membutuhkan verifikasi silang pada berita yang sama demi memenuhi prinsip keberimbangan dan keadilan.</li>
              <li>Satu-satunya pengecualian verifikasi awal dapat dimaklumi apabila:
                <ul style={{ marginTop: "8px", marginBottom: "8px", paddingLeft: "20px" }}>
                  <li>Berita tersebut mengandung urgensi publik yang sangat mendesak (contoh: bencana alam, peringatan dini bahaya).</li>
                  <li>Sumber informasi utama merupakan instansi resmi yang berwenang (contoh: BMKG, Kepolisian, BPBD Kabupaten Pinrang).</li>
                  <li>Media Siber diwajibkan mencantumkan keterangan: <em>"Informasi ini masih dalam proses konfirmasi."</em></li>
                </ul>
              </li>
              <li>Penyiar maupun kru Radio SBL <strong>dilarang keras</strong> menyebarkan asumsi tak berdasar atau berita hoaks.</li>
            </ol>
          </article>

          <article id="isi-buatan-pengguna" style={{ background: "var(--color-bg-surface)", padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--color-primary)" }}>
              <User size={22} /> 3. Isi Buatan Pengguna (User Generated Content)
            </h2>
            <p style={{ lineHeight: 1.7, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              Ini mencakup segala bentuk konten (artikel, video, suara, foto, atau kiriman pesan) yang dibuat oleh pendengar atau masyarakat umum melalui fitur <em>Request Lagu</em>, komentar Facebook, YouTube, atau portal berita.
            </p>
            <div style={{ padding: "16px", backgroundColor: "rgba(16, 185, 129, 0.05)", borderRadius: "8px", borderLeft: "4px solid var(--color-primary)" }}>
              <p style={{ margin: 0, lineHeight: 1.6, color: "var(--color-text-primary)" }}>
                Radio SBL berhak menyunting, menghapus, atau menolak penyiaran pesan dari publik apabila pesan tersebut:
              </p>
              <ul style={{ marginTop: "8px", marginBottom: 0, paddingLeft: "20px", lineHeight: "1.6" }}>
                <li>Mengandung ujaran kebencian, cacian, permusuhan, SARA (Suku, Agama, Ras, Antargolongan).</li>
                <li>Menganjurkan tindakan kekerasan atau memuat unsur pornografi/asusila.</li>
                <li>Menyebarkan fitnah atau mencemarkan nama baik seseorang/lembaga tanpa fakta.</li>
              </ul>
            </div>
          </article>

          <article id="opini" style={{ background: "var(--color-bg-surface)", padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--color-primary)" }}>
              <AlertCircle size={22} /> 4. Opini, Fakta, dan Prasangka
            </h2>
            <p style={{ lineHeight: 1.7, color: "var(--color-text-primary)" }}>
              Penyiar dilarang mencampuradukkan fakta dengan opini yang menghakimi (<em>judgmental opinion</em>). Radio SBL menghormati kebebasan berekspresi, namun dilarang keras menyampaikan informasi yang berpotensi memicu diskriminasi terhadap kelompok minoritas, gender, disabilitas, maupun etnis tertentu.
            </p>
          </article>

          <article id="ralat" style={{ background: "var(--color-bg-surface)", padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--color-primary)" }}>
              <Info size={22} /> 5. Ralat, Koreksi, dan Hak Jawab
            </h2>
            <p style={{ lineHeight: 1.7, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              Berdasarkan UU Pers Nasional, ralat, koreksi, dan hak jawab merupakan kewajiban mutlak media siber untuk memperbaiki informasi yang keliru atau tidak akurat yang telah dipublikasikan.
            </p>
            <ol style={{ lineHeight: 1.7, color: "var(--color-text-primary)", paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><strong>Ralat:</strong> Perbaikan dari pihak Radio SBL atas kekeliruan informasi teknis (contoh: salah sebut gelar, alamat, nama institusi). Ralat dicantumkan di bagian bawah berita aslinya.</li>
              <li><strong>Hak Jawab:</strong> Diberikan secara proporsional kepada narasumber atau institusi yang merasa dirugikan dari suatu berita agar mereka dapat menjelaskan posisi mereka pada tautan berita yang dikeluhkan tersebut.</li>
            </ol>
          </article>

          <article id="pencabutan" style={{ background: "var(--color-bg-surface)", padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--color-warning, #f59e0b)" }}>
              <ShieldAlert size={22} /> 6. Pencabutan Berita
            </h2>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "16px", backgroundColor: "rgba(245, 158, 11, 0.1)", borderRadius: "8px", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
              <ShieldAlert size={28} color="var(--color-warning, #f59e0b)" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, lineHeight: 1.7, color: "var(--color-text-primary)" }}>
                  Berita yang telah dipublikasikan (termasuk naskah di web) <strong>TIDAK DAPAT DICABUT</strong> karena alasan penyensoran dari luar redaksi, kecuali jika hal tersebut terkait langsung dengan:
                </p>
                <ul style={{ marginTop: "8px", marginBottom: "0", paddingLeft: "20px", lineHeight: "1.6" }}>
                  <li>Pelanggaran kesusilaan (Pornografi anak, dsb).</li>
                  <li>Membahayakan keamanan negara / rahasia negara.</li>
                  <li>Perintah tertulis dan mengikat dari Dewan Pers.</li>
                </ul>
                <p style={{ marginTop: "12px", marginBottom: 0, lineHeight: 1.7, fontWeight: 500 }}>
                  Pencabutan berita tetap wajib diumumkan kepada publik melalui rilis, dengan menyatakan <em>"Berita ini dicabut dengan alasan [Sebutkan Alasan]."</em>
                </p>
              </div>
            </div>
          </article>

          <article id="iklan" style={{ background: "var(--color-bg-surface)", padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--color-primary)" }}>
              <FileText size={22} /> 7. Iklan dan Sponsor (Advetorial)
            </h2>
            <p style={{ lineHeight: 1.7, color: "var(--color-text-primary)" }}>
              Media Siber Radio SBL wajib secara transparan membedakan antara konten berita/jurnalistik dan konten iklan/sponsor. Berita atau artikel advertorial yang bersifat komersial harus dengan tegas mencantumkan kata <strong>"Iklan"</strong>, <strong>"Advertorial"</strong>, <strong>"Disponsori Oleh"</strong> agar publik tidak tersesat dalam membedakan produk redaksi.
            </p>
          </article>

          <article id="hak-cipta" style={{ background: "var(--color-bg-surface)", padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--color-primary)" }}>
              <CheckCircle2 size={22} /> 8. Hak Cipta dan Plagiarisme
            </h2>
            <p style={{ lineHeight: 1.7, color: "var(--color-text-primary)" }}>
              Plagiarisme adalah kejahatan intelektual. Jika reporter atau penyiar mengutip teks, suara, gambar, atau video dari sumber pihak ketiga, ia wajib menyebutkan dan menautkan (link) sumber secara gamblang. Mengambil materi karya pihak lain tanpa izin atau tanpa pencantuman sumber adalah pelanggaran berat di internal Radio SBL.
            </p>
          </article>

          <article id="sengketa" style={{ background: "var(--color-bg-surface)", padding: "24px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--color-primary)" }}>
              <AlertCircle size={22} /> 9. Penyelesaian Sengketa Jurnalistik
            </h2>
            <p style={{ lineHeight: 1.7, color: "var(--color-text-primary)" }}>
              Penilaian akhir atas sengketa yang berkaitan dengan pelaksanaan Pedoman Pemberitaan Media Siber ini senantiasa diselesaikan oleh <strong>Dewan Pers</strong>. LPPL Radio Suara Bumi Lasinrang (Radio SBL) tunduk secara yuridis dan etis terhadap rekomendasi atau keputusan Dewan Pers dalam merespons segala pengaduan masyarakat.
            </p>
          </article>

          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "20px", borderTop: "1px solid var(--color-border)" }}>
            <p style={{ marginBottom: "16px" }}>Dokumen ini ditandatangani dan diberlakukan secara internal sebagai Standard Operating Procedure (SOP) Manajemen LPPL Radio SBL Pinrang 92.1 FM.</p>
            <p style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "0.5px" }}>Developed by <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>MAROA Project</span></p>
            <p style={{ fontSize: "11px", marginTop: "4px", opacity: 0.7 }}>&copy; {new Date().getFullYear()} LPPL Radio Suara Bumi Lasinrang</p>
          </div>

        </section>
      </div>
    </main>
  );
}
