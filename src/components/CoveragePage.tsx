import { useState, type ChangeEvent } from "react";
import { FileText, Plus, Clock, Search, Wand2, Loader2, UploadCloud } from "lucide-react";
import { PageHeader } from "./PageHeader";
import type { CoverageAssignment, CoverageStatus } from "../types/domain";
import { uploadToGoogleDrive } from "../services/googleDrive.service";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

// Mock data until Firestore is fully wired up for Liputan
const mockCoverages: CoverageAssignment[] = [
  {
    id: "cov-1",
    title: "Kunjungan Bupati ke Desa Lero",
    description: "Liputan kegiatan penyerahan bantuan sosial dan dialog warga.",
    assignedToId: "rep-1",
    assignedToName: "Riska Dwiyanti",
    status: "In Progress",
    deadline: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cov-2",
    title: "Pameran UMKM Pinrang",
    description: "Wawancara dengan pelaku UMKM dan pengunjung pameran.",
    assignedToId: "rep-2",
    assignedToName: "Tim SBL",
    status: "Assigned",
    deadline: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cov-3",
    title: "Update Harga Pasar Sentral",
    description: "Laporan mingguan harga kebutuhan pokok.",
    assignedToId: "rep-1",
    assignedToName: "Riska Dwiyanti",
    status: "Reviewed",
    deadline: new Date(Date.now() - 43200000).toISOString(),
    draftContent: "Bawang merah turun 10%, beras stabil...",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const statusConfig: Record<CoverageStatus, { color: string; bg: string }> = {
  Assigned: { color: "var(--blue)", bg: "rgba(22, 119, 237, 0.1)" },
  "In Progress": { color: "var(--coral)", bg: "rgba(255, 87, 87, 0.1)" },
  Submitted: { color: "var(--yellow)", bg: "rgba(245, 180, 0, 0.1)" },
  Reviewed: { color: "var(--ink)", bg: "rgba(12, 36, 70, 0.1)" },
  Published: { color: "var(--green)", bg: "rgba(17, 163, 106, 0.1)" }
};

export function CoveragePage() {
  const [search, setSearch] = useState("");

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const handleUploadFile = async (covId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setNotice("");
    setError("");
    setUploadingId(covId);
    try {
      const result = await uploadToGoogleDrive({
        file,
        module: "liputan",
        ownerId: "tim-reporter-1"
      });
      setNotice(`File ${result.name} tersimpan di Google Drive.`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Upload Google Drive gagal."));
    } finally {
      setUploadingId(null);
      event.target.value = ""; // Reset input
    }
  };


  const handleNewAssignment = () => {
    setError("");
    setNotice("Form penugasan baru siap ditautkan ke Firestore. Untuk demo, daftar liputan masih memakai data contoh.");
  };

  const filtered = mockCoverages.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.assignedToName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        eyebrow="Newsroom"
        title="Info Liputan"
        description="Manajemen penugasan reporter, workflow naskah, dan arsip berita lapangan."
      />

      <section className="two-column">
        <div className="panel" style={{ gridColumn: "1 / -1" }}>
          <div className="panel-title" style={{ marginBottom: "16px" }}>
            <h3>Daftar Tugas Liputan</h3>
            <div className="panel-actions">

              <button type="button" className="primary-action" onClick={handleNewAssignment}>
                <Plus size={16} /> Penugasan Baru
              </button>
            </div>
          </div>

          {notice && <p className="success-note">{notice}</p>}
          {error && <p className="form-error">{error}</p>}

          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", background: "rgba(16, 42, 82, 0.03)", padding: "10px 16px", borderRadius: "16px" }}>
              <Search size={18} color="var(--muted)" />
              <input 
                type="text" 
                placeholder="Cari liputan atau nama reporter..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "0.95rem" }}
              />
            </div>
          </div>


          <div className="program-list">
            {filtered.map(cov => (
              <article key={cov.id} style={{ alignItems: "flex-start", cursor: "pointer" }}>
                <div style={{ background: statusConfig[cov.status].bg, color: statusConfig[cov.status].color, padding: "10px", borderRadius: "12px" }}>
                  <FileText size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: "block", fontSize: "1.05rem", marginBottom: "4px" }}>{cov.title}</strong>
                  <p style={{ margin: "0 0 8px", fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.4 }}>{cov.description}</p>
                  
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginTop: "12px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--blue)", background: "rgba(22, 119, 237, 0.08)", padding: "4px 8px", borderRadius: "8px" }}>
                      {cov.assignedToName}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} /> {new Date(cov.deadline as string).toLocaleDateString("id-ID")}
                    </span>

                    {/* Tombol Upload Bukti */}
                    <label style={{ 
                      marginLeft: "auto", 
                      fontSize: "0.8rem", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "6px", 
                      background: "var(--green)", 
                      color: "white", 
                      padding: "6px 12px", 
                      borderRadius: "8px",
                      cursor: uploadingId === cov.id ? "wait" : "pointer",
                      opacity: uploadingId === cov.id ? 0.7 : 1
                    }}>
                      {uploadingId === cov.id ? <Loader2 size={14} className="spin" /> : <UploadCloud size={14} />}
                      {uploadingId === cov.id ? "Mengunggah..." : "Kirim Bukti"}
                      <input 
                        type="file" 
                        accept="image/*,.pdf,.doc,.docx"
                        style={{ display: "none" }} 
                        onChange={(e) => handleUploadFile(cov.id, e)}
                        disabled={uploadingId === cov.id}
                      />
                    </label>
                  </div>
                </div>
                
                <span style={{ 
                  fontSize: "0.75rem", 
                  fontWeight: 800, 
                  color: statusConfig[cov.status].color, 
                  background: statusConfig[cov.status].bg, 
                  padding: "6px 12px", 
                  borderRadius: "999px",
                  whiteSpace: "nowrap"
                }}>
                  {cov.status}
                </span>
              </article>
            ))}

            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                <FileText size={48} opacity={0.2} style={{ margin: "0 auto 16px" }} />
                <p>Tidak ada liputan yang ditemukan.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
