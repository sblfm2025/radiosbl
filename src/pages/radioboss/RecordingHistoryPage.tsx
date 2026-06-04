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

  const finishedCount = recordings.filter((recording) => recording.status === "completed" || recording.status === "stopped").length;
  const attentionCount = recordings.filter((recording) => (
    recording.status === "failed" ||
    recording.status === "gateway_offline" ||
    recording.status === "radioboss_offline"
  )).length;

  return (
    <main className="radioboss-page">
      <section className="radioboss-page-hero">
        <div>
          <p className="eyebrow">Integrasi RadioBOSS</p>
          <h1>Riwayat Rekaman</h1>
          <p>Audit hasil rekaman program penyiar dari Studio Gateway, termasuk file, durasi, dan catatan aman.</p>
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
          <span>Rekaman selesai</span>
          <strong>{finishedCount}</strong>
        </article>
        <article>
          <FileAudio size={18} />
          <span>Perlu perhatian</span>
          <strong>{attentionCount}</strong>
        </article>
      </section>

      <article className="radioboss-page-card">
        <div className="radioboss-card-head">
          <strong>Filter riwayat</strong>
          <small>Tanggal, program, penyiar, dan status.</small>
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
