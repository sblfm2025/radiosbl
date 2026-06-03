import { useEffect, useState } from "react";
import { Archive, FileAudio } from "lucide-react";
import { RecordingHistoryFilters } from "../../components/radioboss/RecordingHistoryFilters";
import { RecordingHistoryTable } from "../../components/radioboss/RecordingHistoryTable";
import {
  subscribeRecordingHistory,
  type RecordingHistoryFilters as Filters
} from "../../services/radioboss/programRecordings.service";
import type { ProgramRecording } from "../../types/domain";

export default function RecordingHistoryPage() {
  const [filters, setFilters] = useState<Filters>({ status: "all" });
  const [recordings, setRecordings] = useState<ProgramRecording[]>([]);

  useEffect(() => subscribeRecordingHistory(filters, setRecordings), [filters]);

  const completedCount = recordings.filter((recording) => recording.status === "completed").length;
  const failedCount = recordings.filter((recording) => recording.status === "failed").length;

  return (
    <main className="radioboss-page">
      <section className="radioboss-page-hero">
        <div>
          <p className="eyebrow">Integrasi RadioBOSS</p>
          <h1>Recording History</h1>
          <p>Lihat riwayat rekaman program dari Studio Gateway. Path file ditampilkan sebagai teks lokal PC studio.</p>
        </div>
        <span className="radioboss-hero-icon" aria-hidden="true">
          <Archive size={24} />
        </span>
      </section>

      <section className="radioboss-stat-grid" aria-label="Ringkasan riwayat rekaman">
        <article>
          <FileAudio size={18} />
          <span>Total tampil</span>
          <strong>{recordings.length}</strong>
        </article>
        <article>
          <FileAudio size={18} />
          <span>Selesai</span>
          <strong>{completedCount}</strong>
        </article>
        <article>
          <FileAudio size={18} />
          <span>Gagal</span>
          <strong>{failedCount}</strong>
        </article>
      </section>

      <article className="radioboss-page-card">
        <div className="radioboss-card-head">
          <strong>Filter riwayat</strong>
          <small>Tanggal, program, penyiar, status, dan gateway.</small>
        </div>
        <RecordingHistoryFilters filters={filters} onChange={setFilters} />
      </article>

      <article className="radioboss-page-card">
        <div className="radioboss-card-head">
          <strong>Daftar rekaman</strong>
          <small>Gunakan Salin Path untuk mengambil lokasi file rekaman.</small>
        </div>
        <RecordingHistoryTable recordings={recordings} />
      </article>
    </main>
  );
}
