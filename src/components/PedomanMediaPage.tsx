import { FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

const sections = [
  { id: "ruang-lingkup", title: "1. Ruang Lingkup" },
  { id: "verifikasi", title: "2. Verifikasi dan Keberimbangan Berita" },
  { id: "opini", title: "3. Opini, Fakta, dan Bias" },
  { id: "ralat", title: "4. Ralat, Koreksi, dan Hak Jawab" },
  { id: "pencabutan", title: "5. Pencabutan Berita" },
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
    <main className="dashboard-page pedoman-page" style={{ paddingBottom: '5rem' }}>
      <div 
        style={{
          position: "fixed", top: 0, left: 0, height: "4px", backgroundColor: "var(--color-primary, #10b981)",
          width: `${readingProgress}%`, zIndex: 100, transition: "width 0.1s"
        }}
      />
      <section className="dashboard-topbar">
        <div className="dashboard-greeting">
          <h1>Pedoman Media Siber</h1>
          <p>Standar penyiaran & informasi publik di Radio SBL.</p>
        </div>
        <FileText size={32} style={{ opacity: 0.5 }} />
      </section>

      <div style={{ display: "flex", gap: "2rem", marginTop: "1rem", flexWrap: "wrap", alignItems: "flex-start" }}>
        
        {/* Sticky TOC */}
        <aside style={{ flex: "1 1 250px", position: "sticky", top: "1rem" }}>
          <div className="dashboard-panel">
            <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "0.5rem", color: "var(--color-text-muted)" }}>DAFTAR ISI</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {sections.map(sec => (
                <li key={sec.id}>
                  <a href={`#${sec.id}`} style={{ textDecoration: "none", fontSize: "14px", color: "inherit", opacity: 0.8 }}>
                    {sec.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Content Section */}
        <section style={{ flex: "3 1 500px", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <article id="ruang-lingkup" className="dashboard-panel">
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "0.5rem" }}>1. Ruang Lingkup</h2>
            <p style={{ lineHeight: 1.6, color: "var(--color-text-secondary)" }}>
              Pedoman ini berlaku untuk semua layanan informasi, berita, dan siaran publik yang disediakan oleh 
              Lembaga Penyiaran Publik Lokal Radio Suara Bumi Lasinrang (Radio SBL). Tujuannya adalah memastikan 
              integritas, keakuratan, dan profesionalisme dalam pengelolaan media siber sesuai dengan standar jurnalistik.
            </p>
          </article>

          <article id="verifikasi" className="dashboard-panel">
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "0.5rem" }}>2. Verifikasi dan Keberimbangan Berita</h2>
            <ul style={{ lineHeight: 1.6, color: "var(--color-text-secondary)", paddingLeft: "1.2rem", margin: 0 }}>
              <li>Pada prinsipnya setiap berita harus melalui verifikasi ketat sebelum disiarkan atau dipublikasikan.</li>
              <li>Berita yang mengandung tuduhan atau merugikan pihak lain memerlukan verifikasi dan memberikan porsi yang berimbang untuk klarifikasi pada berita yang sama.</li>
              <li>Penyiar dan reporter Radio SBL diwajibkan untuk tidak menyebarkan hoaks atau informasi yang tidak memiliki sumber yang kredibel.</li>
            </ul>
          </article>

          <article id="opini" className="dashboard-panel">
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "0.5rem" }}>3. Opini, Fakta, dan Bias</h2>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginTop: "0.5rem", padding: "1rem", backgroundColor: "rgba(0,0,0,0.03)", borderRadius: "8px" }}>
              <AlertCircle size={20} color="var(--color-warning, #f59e0b)" style={{ flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5 }}>
                Penyiar dilarang mencampuradukkan fakta dan opini pribadi yang dapat menghakimi atau mengarahkan pandangan publik pada satu sudut pandang tanpa dasar fakta yang berimbang.
              </p>
            </div>
          </article>

          <article id="ralat" className="dashboard-panel">
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "0.5rem" }}>4. Ralat, Koreksi, dan Hak Jawab</h2>
            <p style={{ lineHeight: 1.6, color: "var(--color-text-secondary)" }}>
              Setiap ralat, koreksi, dan hak jawab harus ditayangkan dengan menyebutkan informasi tentang ralat atau koreksi tersebut. Waktu publikasi ralat harus mengikuti secepat mungkin setelah kesalahan disadari atau hak jawab diterima.
            </p>
          </article>

          <article id="pencabutan" className="dashboard-panel">
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "0.5rem" }}>5. Pencabutan Berita</h2>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginTop: "0.5rem" }}>
              <CheckCircle2 size={18} color="var(--color-success, #10b981)" style={{ flexShrink: 0, marginTop: "2px" }} />
              <p style={{ margin: 0, lineHeight: 1.6, color: "var(--color-text-secondary)" }}>
                Berita yang sudah dipublikasikan tidak dapat dicabut kecuali jika terkait masalah SARA, asusila, atau disyaratkan oleh Dewan Pers/Komisi Penyiaran. Pencabutan harus disertai dengan alasan publik kepada pendengar dan pembaca.
              </p>
            </div>
          </article>
        </section>

      </div>
    </main>
  );
}
