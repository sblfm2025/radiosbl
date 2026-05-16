import { useState, useEffect, type FormEvent } from "react";
import { Send, MessageSquare, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import type { DashboardSnapshot } from "../data/mockRepository";
import type { Complaint } from "../types/domain";
import { subscribeComplaints, listComplaints, submitComplaint, updateComplaintStatus } from "../services/complaint.service";

export function ComplaintsPage({ data }: { data: DashboardSnapshot }) {
  type ComplaintCategory = "Teknis" | "Program" | "Informasi Publik" | "Lainnya";
  const [reporterName, setReporterName] = useState("");
  const [category, setCategory] = useState<ComplaintCategory>("Teknis");
  const [message, setMessage] = useState("");
  const [complaintItems, setComplaintItems] = useState<Complaint[]>(() =>
    data.complaints.map((item, index) => ({
      id: `mock-complaint-${index}`,
      reporterName: "Publik",
      category: item.category as ComplaintCategory,
      message: item.title,
      status: item.status as "Baru" | "Terverifikasi" | "Diproses" | "Selesai",
      createdAt: new Date().toISOString()
    }))
  );
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const applyComplaints = (nextComplaints: Complaint[]) => {
      if (nextComplaints.length > 0) {
        setComplaintItems(nextComplaints);
      }
    };
    const unsubscribe = subscribeComplaints(applyComplaints);
    void listComplaints().then(applyComplaints);
    return () => unsubscribe();
  }, []);

  async function handleSubmitComplaint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");

    try {
      const complaint = await submitComplaint({
        reporterName,
        category,
        message
      });
      setComplaintItems((items) => [complaint, ...items].slice(0, 50));
      setMessage("");
      setNotice("Pengaduan/saran berhasil masuk ke antrean.");
    } catch (currentError) {
      setError(
        currentError instanceof Error
          ? currentError.message
          : "Pengaduan gagal dikirim."
      );
    }
  }

  async function handleComplaintStatus(
    complaint: (typeof complaintItems)[number],
    status: "Terverifikasi" | "Diproses" | "Selesai"
  ) {
    try {
      const updated = await updateComplaintStatus(complaint, status);
      setComplaintItems((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setNotice(`Pengaduan dari ${updated.reporterName} diubah menjadi ${status}.`);
      setTimeout(() => setNotice(""), 3000);
    } catch (currentError) {
      setError(
        currentError instanceof Error
          ? currentError.message
          : "Gagal memperbarui status pengaduan."
      );
    }
  }

  function getStatusColor(status: string) {
    switch(status) {
      case "Baru": return { bg: "rgba(255, 59, 59, 0.1)", color: "#FF3B3B", icon: <AlertCircle size={14} /> };
      case "Terverifikasi": return { bg: "rgba(245, 180, 0, 0.1)", color: "#f5b400", icon: <CheckCircle2 size={14} /> };
      case "Diproses": return { bg: "rgba(22, 119, 237, 0.1)", color: "var(--blue)", icon: <Clock size={14} /> };
      case "Selesai": return { bg: "rgba(17,163,106,0.1)", color: "#11a36a", icon: <CheckCircle2 size={14} /> };
      default: return { bg: "rgba(0,0,0,0.05)", color: "var(--muted)", icon: <AlertCircle size={14} /> };
    }
  }

  return (
    <div style={{ background: "#f8f9fc", minHeight: "100vh", paddingBottom: "100px" }}>
      <div style={{ background: "white", padding: "16px 20px 24px", borderBottom: "1px solid rgba(0,0,0,0.05)", position: "sticky", top: 0, zIndex: 10 }}>
        <h1 style={{ fontSize: "1.4rem", margin: 0, color: "var(--ink)", fontWeight: 700 }}>Pengaduan & Saran</h1>
        <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>Kelola masukan pendengar dan laporan teknis.</p>
      </div>

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Form Input Laporan */}
        <div style={{ background: "white", borderRadius: "32px", padding: "24px", boxShadow: "0 8px 32px rgba(12, 36, 70, 0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <div style={{ background: "rgba(22, 119, 237, 0.1)", color: "var(--blue)", width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageSquare size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--ink)" }}>Input Laporan Manual</h3>
          </div>

          {notice && <p style={{ background: "rgba(17,163,106,0.1)", color: "#11a36a", padding: "12px 16px", borderRadius: "16px", fontSize: "0.85rem", marginBottom: "20px", fontWeight: "bold" }}>{notice}</p>}
          {error && <p style={{ background: "rgba(255, 59, 59, 0.1)", color: "#FF3B3B", padding: "12px 16px", borderRadius: "16px", fontSize: "0.85rem", marginBottom: "20px", fontWeight: "bold" }}>{error}</p>}

          <form onSubmit={handleSubmitComplaint} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)" }}>Nama Pelapor</label>
              <input value={reporterName} onChange={(e) => setReporterName(e.target.value)} required style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.1)", outline: "none", fontSize: "0.95rem", background: "rgba(0,0,0,0.02)" }} />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)" }}>Kategori Laporan</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as ComplaintCategory)} style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.1)", outline: "none", fontSize: "0.95rem", background: "rgba(0,0,0,0.02)", appearance: "none" }}>
                <option value="Teknis">Kendala Teknis (Sinyal, Audio)</option>
                <option value="Program">Program Siaran / Penyiar</option>
                <option value="Informasi Publik">Informasi Layanan Publik</option>
                <option value="Lainnya">Lainnya / Umum</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)" }}>Isi Pesan/Saran</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} required style={{ width: "100%", padding: "16px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.1)", outline: "none", fontSize: "0.95rem", background: "rgba(0,0,0,0.02)", minHeight: "120px", resize: "vertical" }} />
            </div>

            <button type="submit" style={{ padding: "18px", borderRadius: "99px", background: "var(--blue)", color: "white", border: "none", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "8px", cursor: "pointer", fontSize: "1rem", boxShadow: "0 12px 24px rgba(22, 119, 237, 0.25)" }}>
              <Send size={18} /> Simpan Laporan
            </button>
          </form>
        </div>

        {/* Daftar Pengaduan */}
        <div>
          <h3 style={{ margin: "0 0 16px", fontSize: "1.2rem", color: "var(--ink)", display: "flex", alignItems: "center", gap: "8px" }}>
            Daftar Pengaduan Masuk
            <span style={{ background: "rgba(22, 119, 237, 0.1)", color: "var(--blue)", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "bold" }}>{complaintItems.length}</span>
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {complaintItems.map((item) => {
              const statusStyle = getStatusColor(item.status);
              return (
                <div key={item.id} style={{ background: "white", borderRadius: "24px", padding: "20px", boxShadow: "0 8px 32px rgba(12, 36, 70, 0.05)", borderLeft: `6px solid ${statusStyle.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <h4 style={{ margin: "0 0 4px", fontSize: "1.1rem", color: "var(--ink)" }}>{item.reporterName}</h4>
                      <div style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>Kategori: {item.category}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", background: statusStyle.bg, color: statusStyle.color, padding: "4px 10px", borderRadius: "99px", fontSize: "0.75rem", fontWeight: "bold" }}>
                      {statusStyle.icon} {item.status}
                    </div>
                  </div>
                  
                  <div style={{ background: "rgba(0,0,0,0.02)", padding: "12px 16px", borderRadius: "16px", fontSize: "0.95rem", color: "var(--ink)", fontStyle: "italic", marginBottom: "16px", border: "1px solid rgba(0,0,0,0.03)" }}>
                    "{item.message}"
                  </div>
                  
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {item.status === "Baru" && (
                      <button onClick={() => handleComplaintStatus(item, "Terverifikasi")} style={{ flex: 1, padding: "12px", borderRadius: "16px", background: "rgba(245, 180, 0, 0.1)", color: "#f5b400", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}>Verifikasi Laporan</button>
                    )}
                    {item.status === "Terverifikasi" && (
                      <button onClick={() => handleComplaintStatus(item, "Diproses")} style={{ flex: 1, padding: "12px", borderRadius: "16px", background: "rgba(22, 119, 237, 0.1)", color: "var(--blue)", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}>Proses Laporan</button>
                    )}
                    {item.status === "Diproses" && (
                      <button onClick={() => handleComplaintStatus(item, "Selesai")} style={{ flex: 1, padding: "12px", borderRadius: "16px", background: "rgba(17,163,106,0.1)", color: "#11a36a", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}>Tandai Selesai</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
