import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Inbox,
  ListChecks,
  MessageSquare,
  Search,
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
  type ComplaintStatus = Complaint["status"];
  type ComplaintStatusFilter = ComplaintStatus | "Semua";
  type ComplaintCategoryFilter = ComplaintCategory | "Semua";
  const complaintProgressSteps: ComplaintStatus[] = ["Baru", "Terverifikasi", "Diproses", "Selesai"];
  const [reporterName, setReporterName] = useState("");
  const [category, setCategory] = useState<ComplaintCategory>("Teknis");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplaintStatusFilter>("Semua");
  const [categoryFilter, setCategoryFilter] = useState<ComplaintCategoryFilter>("Semua");
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
    terverifikasi: complaintItems.filter((item) => item.status === "Terverifikasi").length,
    diproses: complaintItems.filter((item) => item.status === "Diproses").length,
    selesai: complaintItems.filter((item) => item.status === "Selesai").length
  };
  const filteredComplaintItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return complaintItems.filter((item) => {
      const matchesStatus = statusFilter === "Semua" || item.status === statusFilter;
      const matchesCategory = categoryFilter === "Semua" || item.category === categoryFilter;
      const searchable = [
        item.reporterName,
        item.category,
        item.message,
        item.status,
        formatComplaintDate(item.createdAt)
      ].join(" ").toLowerCase();
      const matchesQuery = !keyword || searchable.includes(keyword);

      return matchesStatus && matchesCategory && matchesQuery;
    });
  }, [categoryFilter, complaintItems, query, statusFilter]);
  const priorityComplaint = useMemo(() => {
    const priorityOrder: ComplaintStatus[] = ["Baru", "Terverifikasi", "Diproses"];

    return (
      priorityOrder
        .map((status) => complaintItems.find((item) => item.status === status))
        .find(Boolean) ?? null
    );
  }, [complaintItems]);
  const hasActiveFilters = Boolean(query.trim()) || statusFilter !== "Semua" || categoryFilter !== "Semua";

  function resetComplaintFilters() {
    setQuery("");
    setStatusFilter("Semua");
    setCategoryFilter("Semua");
  }

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

      <section className="complaints-command-panel" aria-label="Kontrol dan prioritas aduan">
        <label className="complaints-search-field">
          <Search size={18} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari pelapor, kategori, isi aduan..."
            aria-label="Cari aduan"
          />
        </label>

        <div className="complaints-filter-grid">
          <label>
            <Filter size={16} />
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ComplaintStatusFilter)}
            >
              <option value="Semua">Semua status</option>
              <option value="Baru">Baru</option>
              <option value="Terverifikasi">Terverifikasi</option>
              <option value="Diproses">Diproses</option>
              <option value="Selesai">Selesai</option>
            </select>
          </label>
          <label>
            <MessageSquare size={16} />
            <span>Kategori</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as ComplaintCategoryFilter)}
            >
              <option value="Semua">Semua kategori</option>
              <option value="Teknis">Teknis</option>
              <option value="Program">Program</option>
              <option value="Informasi Publik">Informasi Publik</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </label>
        </div>

        <div className="complaints-focus-row" aria-label="Prioritas tindak lanjut">
          <article>
            <ListChecks size={18} />
            <small>Tampilan aktif</small>
            <strong>{filteredComplaintItems.length} aduan</strong>
            <span>{hasActiveFilters ? "Filter sedang digunakan" : "Semua antrean ditampilkan"}</span>
          </article>
          <article>
            <AlertCircle size={18} />
            <small>Butuh atensi</small>
            <strong>{complaintStats.baru + complaintStats.terverifikasi} aduan</strong>
            <span>Baru atau menunggu proses awal</span>
          </article>
          <article>
            <Clock size={18} />
            <small>Prioritas berikutnya</small>
            <strong>{priorityComplaint?.reporterName ?? "Antrean aman"}</strong>
            <span>{priorityComplaint ? `${priorityComplaint.status} - ${priorityComplaint.category}` : "Tidak ada aduan aktif"}</span>
          </article>
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
            <strong>{filteredComplaintItems.length}</strong>
          </div>

          <div className="complaint-list">
            {filteredComplaintItems.length === 0 ? (
              <div className="complaint-empty-state">
                <Inbox size={28} />
                <h3>{hasActiveFilters ? "Tidak ada aduan yang cocok" : "Belum ada aduan masuk"}</h3>
                <p>
                  {hasActiveFilters
                    ? "Coba ubah kata kunci, status, atau kategori untuk melihat antrean lain."
                    : "Aduan yang dikirim pendengar akan tampil di sini."}
                </p>
                {hasActiveFilters && (
                  <button type="button" onClick={resetComplaintFilters}>
                    Reset filter
                  </button>
                )}
              </div>
            ) : filteredComplaintItems.map((item) => {
              const statusStyle = getStatusColor(item.status);
              const createdAt = formatComplaintDate(item.createdAt);
              const activeStepIndex = complaintProgressSteps.indexOf(item.status);

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

                  <div className="complaint-progress" aria-label={`Progres aduan ${item.reporterName}`}>
                    {complaintProgressSteps.map((step, index) => (
                      <span
                        key={step}
                        className={[
                          index <= activeStepIndex ? "is-complete" : "",
                          index === activeStepIndex ? "is-current" : ""
                        ].filter(Boolean).join(" ")}
                      >
                        <small>{step}</small>
                      </span>
                    ))}
                  </div>

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
