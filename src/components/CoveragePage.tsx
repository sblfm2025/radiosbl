import { useMemo, useState, type ChangeEvent } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  FileText,
  Filter,
  Loader2,
  Plus,
  Search,
  UploadCloud,
  UserRound
} from "lucide-react";
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

function getStatusClass(status: CoverageStatus) {
  return status.replace(/\s+/g, "-").toLowerCase();
}

function formatCoverageDeadline(value: CoverageAssignment["deadline"]): string {
  const date = new Date(value as string | number | Date);

  if (Number.isNaN(date.getTime())) {
    return "Deadline belum jelas";
  }

  return date.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}

function getDeadlineState(value: CoverageAssignment["deadline"]): "overdue" | "today" | "upcoming" {
  const date = new Date(value as string | number | Date);

  if (Number.isNaN(date.getTime())) {
    return "upcoming";
  }

  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDeadline = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startDeadline.getTime() - startToday.getTime()) / 86400000);

  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  return "upcoming";
}

export function CoveragePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CoverageStatus | "Semua">("Semua");

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

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return mockCoverages.filter((coverage) => {
      const matchesStatus = statusFilter === "Semua" || coverage.status === statusFilter;
      const searchable = [
        coverage.title,
        coverage.description,
        coverage.assignedToName,
        coverage.status,
        formatCoverageDeadline(coverage.deadline)
      ].join(" ").toLowerCase();

      return matchesStatus && (!keyword || searchable.includes(keyword));
    });
  }, [search, statusFilter]);

  const coverageSummary = {
    assigned: mockCoverages.filter((item) => item.status === "Assigned").length,
    inProgress: mockCoverages.filter((item) => item.status === "In Progress").length,
    reviewed: mockCoverages.filter((item) => item.status === "Reviewed" || item.status === "Published").length,
    dueToday: mockCoverages.filter((item) => getDeadlineState(item.deadline) === "today").length
  };
  const priorityCoverage = useMemo(
    () =>
      [...mockCoverages].sort((a, b) => {
        const stateWeight = { overdue: 0, today: 1, upcoming: 2 };
        const statusWeight: Record<CoverageStatus, number> = {
          "In Progress": 0,
          Assigned: 1,
          Submitted: 2,
          Reviewed: 3,
          Published: 4
        };
        const deadlineDiff =
          stateWeight[getDeadlineState(a.deadline)] - stateWeight[getDeadlineState(b.deadline)];

        if (deadlineDiff !== 0) return deadlineDiff;
        return statusWeight[a.status] - statusWeight[b.status];
      })[0],
    []
  );
  const hasActiveFilters = Boolean(search.trim()) || statusFilter !== "Semua";

  function resetCoverageFilters() {
    setSearch("");
    setStatusFilter("Semua");
  }

  return (
    <>
      <PageHeader
        eyebrow="Newsroom"
        title="Info Liputan"
        description="Manajemen penugasan reporter, workflow naskah, dan arsip berita lapangan."
      />

      <section className="two-column">
        <div className="panel coverage-panel">
          <div className="coverage-summary" aria-label="Ringkasan liputan">
            <article>
              <span>Ditugaskan</span>
              <strong>{coverageSummary.assigned}</strong>
            </article>
            <article>
              <span>Berjalan</span>
              <strong>{coverageSummary.inProgress}</strong>
            </article>
            <article>
              <span>Review</span>
              <strong>{coverageSummary.reviewed}</strong>
            </article>
            <article>
              <span>Hari ini</span>
              <strong>{coverageSummary.dueToday}</strong>
            </article>
          </div>

          <div className="coverage-command-panel" aria-label="Kontrol dan prioritas liputan">
            <div className="coverage-search-bar">
              <Search size={18} color="var(--muted)" />
              <input
                type="text"
                placeholder="Cari liputan, reporter, status..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Cari liputan"
              />
            </div>
            <label className="coverage-filter-field">
              <Filter size={16} />
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as CoverageStatus | "Semua")}
              >
                <option value="Semua">Semua status</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Submitted">Submitted</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Published">Published</option>
              </select>
            </label>
            <div className="coverage-priority-card">
              <AlertCircle size={18} />
              <small>Prioritas lapangan</small>
              <strong>{priorityCoverage?.title ?? "Tidak ada tugas"}</strong>
              <span>{priorityCoverage ? `${priorityCoverage.assignedToName} - ${formatCoverageDeadline(priorityCoverage.deadline)}` : "Antrean liputan aman"}</span>
            </div>
          </div>

          <div className="panel-title coverage-panel-title">
            <h3>Daftar Tugas Liputan</h3>
            <div className="panel-actions">

              <button type="button" className="primary-action" onClick={handleNewAssignment}>
                <Plus size={16} /> Penugasan Baru
              </button>
            </div>
          </div>

          {notice && <p className="success-note">{notice}</p>}
          {error && <p className="form-error">{error}</p>}


          <div className="program-list">
            {filtered.map((cov) => {
              const statusClass = getStatusClass(cov.status);
              const deadlineState = getDeadlineState(cov.deadline);

              return (
                <article key={cov.id} className={`coverage-card ${statusClass}`}>
                  <div className={`coverage-card-icon ${statusClass}`}>
                    <FileText size={20} />
                  </div>
                  <div className="coverage-card-copy">
                    <strong>{cov.title}</strong>
                    <p>{cov.description}</p>
                    
                    <div className="coverage-card-meta">
                      <span className="coverage-assignee">
                        <UserRound size={12} />
                        {cov.assignedToName}
                      </span>
                      <span className={`coverage-deadline ${deadlineState}`}>
                        <CalendarClock size={12} /> {formatCoverageDeadline(cov.deadline)}
                      </span>

                      <label className={`coverage-upload ${uploadingId === cov.id ? "uploading" : ""}`}>
                        {uploadingId === cov.id ? <Loader2 size={14} className="spin" /> : <UploadCloud size={14} />}
                        {uploadingId === cov.id ? "Mengunggah..." : "Kirim Bukti"}
                        <input 
                          type="file" 
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={(e) => handleUploadFile(cov.id, e)}
                          disabled={uploadingId === cov.id}
                        />
                      </label>
                    </div>
                  </div>
                  
                  <span className={`coverage-status ${statusClass}`}>
                    {cov.status === "Published" ? <CheckCircle2 size={13} /> : null}
                    {cov.status}
                  </span>
                </article>
              );
            })}

            {filtered.length === 0 && (
              <div className="coverage-empty-state">
                <FileText size={48} />
                <p>Tidak ada liputan yang ditemukan.</p>
                {hasActiveFilters && (
                  <button type="button" onClick={resetCoverageFilters}>
                    Reset filter
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
