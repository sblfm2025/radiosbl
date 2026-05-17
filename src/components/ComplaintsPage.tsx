import { useState, useEffect, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Inbox,
  ListChecks,
  MessageSquare,
  Send,
  UserRound
} from "lucide-react";
import type { DashboardSnapshot } from "../data/mockRepository";
import type { Complaint } from "../types/domain";
import { subscribeComplaints, listComplaints, submitComplaint, updateComplaintStatus } from "../services/complaint.service";
import type { AuthSession } from "../services/auth.service";
import { canUser } from "../utils/rbac";

export function ComplaintsPage({ data, session }: { data: DashboardSnapshot, session: AuthSession | null }) {
  type ComplaintCategory = "Teknis" | "Program" | "Informasi Publik" | "Lainnya";
  type ComplaintActionStatus = "Terverifikasi" | "Diproses" | "Selesai";
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
    status: ComplaintActionStatus
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
      case "Baru": return { className: "is-new", icon: <AlertCircle size={14} /> };
      case "Terverifikasi": return { className: "is-verified", icon: <CheckCircle2 size={14} /> };
      case "Diproses": return { className: "is-progress", icon: <Clock size={14} /> };
      case "Selesai": return { className: "is-done", icon: <CheckCircle2 size={14} /> };
      default: return { className: "is-muted", icon: <AlertCircle size={14} /> };
    }
  }

  function formatComplaintDate(value: Complaint["createdAt"]): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  const complaintStats = {
    total: complaintItems.length,
    baru: complaintItems.filter((item) => item.status === "Baru").length,
    diproses: complaintItems.filter((item) => item.status === "Diproses").length,
    selesai: complaintItems.filter((item) => item.status === "Selesai").length
  };

  return (
    <main className="complaints-page">
      <section className="complaints-hero" aria-label="Ringkasan pengaduan dan saran">
        <div className="complaints-hero-copy">
          <div className="complaints-title-lockup">
            <img src="/LogoSBL.svg" alt="Radio SBL" />
            <div>
              <p className="eyebrow">Suara pendengar</p>
              <h1>Aduan & Saran</h1>
            </div>
          </div>
          <p>
            Catat masukan pendengar, laporan teknis, dan saran program agar tindak
            lanjut tim Radio SBL lebih tertata.
          </p>
        </div>

        <div className="complaints-summary-grid" aria-label="Ringkasan status aduan">
          <span>
            <Inbox size={20} />
            <strong>{complaintStats.total}</strong>
            Total aduan
          </span>
          <span>
            <AlertCircle size={20} />
            <strong>{complaintStats.baru}</strong>
            Baru
          </span>
          <span>
            <Clock size={20} />
            <strong>{complaintStats.diproses}</strong>
            Diproses
          </span>
          <span>
            <CheckCircle2 size={20} />
            <strong>{complaintStats.selesai}</strong>
            Selesai
          </span>
        </div>
      </section>

      {(notice || error) && (
        <div className="complaints-alert-stack" aria-live="polite">
          {notice && <p className="complaints-alert is-success">{notice}</p>}
          {error && <p className="complaints-alert is-error">{error}</p>}
        </div>
      )}

      <div className="complaints-layout">
        <section className="complaint-panel complaint-form-panel" aria-labelledby="complaint-form-title">
          <div className="complaint-panel-title">
            <span aria-hidden="true">
              <MessageSquare size={20} />
            </span>
            <div>
              <p className="eyebrow">Input manual</p>
              <h2 id="complaint-form-title">Catat Aduan Baru</h2>
            </div>
          </div>

          <form onSubmit={handleSubmitComplaint} className="complaint-form-modern">
            <label>
              <span>Nama Pelapor</span>
              <input
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Contoh: Pendengar Radio SBL"
                required
              />
            </label>

            <label>
              <span>Kategori Laporan</span>
              <select value={category} onChange={(e) => setCategory(e.target.value as ComplaintCategory)}>
                <option value="Teknis">Kendala Teknis (Sinyal, Audio)</option>
                <option value="Program">Program Siaran / Penyiar</option>
                <option value="Informasi Publik">Informasi Layanan Publik</option>
                <option value="Lainnya">Lainnya / Umum</option>
              </select>
            </label>

            <label>
              <span>Isi Pesan atau Saran</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tuliskan inti aduan, waktu kejadian, atau saran program."
                required
              />
            </label>

            <button type="submit" className="complaint-submit-button">
              <Send size={18} /> Simpan Laporan
            </button>
          </form>
        </section>

        <section className="complaint-panel complaint-list-panel" aria-labelledby="complaint-list-title">
          <div className="complaint-list-head">
            <div className="complaint-panel-title">
              <span aria-hidden="true">
                <ListChecks size={20} />
              </span>
              <div>
                <p className="eyebrow">Antrean tindak lanjut</p>
                <h2 id="complaint-list-title">Daftar Aduan Masuk</h2>
              </div>
            </div>
            <strong>{complaintItems.length}</strong>
          </div>

          <div className="complaint-list">
            {complaintItems.length === 0 ? (
              <div className="complaint-empty-state">
                <Inbox size={28} />
                <h3>Belum ada aduan masuk</h3>
                <p>Aduan yang dikirim pendengar akan tampil di sini.</p>
              </div>
            ) : complaintItems.map((item) => {
              const statusStyle = getStatusColor(item.status);
              const createdAt = formatComplaintDate(item.createdAt);

              return (
                <article key={item.id} className={`complaint-ticket ${statusStyle.className}`}>
                  <div className="complaint-ticket-head">
                    <div>
                      <h3>{item.reporterName}</h3>
                      <p>
                        <UserRound size={14} />
                        {item.category}
                        {createdAt && <span>{createdAt}</span>}
                      </p>
                    </div>
                    <span className={`complaint-status ${statusStyle.className}`}>
                      {statusStyle.icon} {item.status}
                    </span>
                  </div>

                  <p className="complaint-message">{item.message}</p>

                  {canUser(session?.user.role, "complaints:manage") && (
                    <div className="complaint-actions">
                      {item.status === "Baru" && (
                        <button onClick={() => handleComplaintStatus(item, "Terverifikasi")}>Verifikasi Laporan</button>
                      )}
                      {item.status === "Terverifikasi" && (
                        <button onClick={() => handleComplaintStatus(item, "Diproses")}>Proses Laporan</button>
                      )}
                      {item.status === "Diproses" && (
                        <button onClick={() => handleComplaintStatus(item, "Selesai")}>Tandai Selesai</button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
