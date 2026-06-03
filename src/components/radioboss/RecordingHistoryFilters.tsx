import type { RecordingHistoryFilters as Filters } from "../../services/radioboss/programRecordings.service";
import type { RecordingStatus } from "../../types/domain";

type RecordingHistoryFiltersProps = {
  filters: Filters;
  onChange: (filters: Filters) => void;
};

const statuses: Array<RecordingStatus | "all"> = [
  "all",
  "waiting_schedule",
  "waiting_attendance",
  "ready",
  "recording",
  "stopping",
  "stopped",
  "completed",
  "failed",
  "skipped_no_attendance",
  "skipped_disabled",
  "manual_override",
  "gateway_offline",
  "radioboss_offline"
];

export function RecordingHistoryFilters({ filters, onChange }: RecordingHistoryFiltersProps) {
  return (
    <section className="radioboss-history-filters" aria-label="Filter riwayat rekaman">
      <label>
        <span>Tanggal</span>
        <input type="date" value={filters.date ?? ""} onChange={(event) => onChange({ ...filters, date: event.target.value })} />
      </label>
      <label>
        <span>Program</span>
        <input value={filters.program ?? ""} onChange={(event) => onChange({ ...filters, program: event.target.value })} placeholder="Cari program" />
      </label>
      <label>
        <span>Penyiar</span>
        <input value={filters.announcer ?? ""} onChange={(event) => onChange({ ...filters, announcer: event.target.value })} placeholder="Cari penyiar" />
      </label>
      <label>
        <span>Status</span>
        <select value={filters.status ?? "all"} onChange={(event) => onChange({ ...filters, status: event.target.value as RecordingStatus | "all" })}>
          {statuses.map((status) => (
            <option key={status} value={status}>{status === "all" ? "Semua" : status}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Gateway</span>
        <input value={filters.gateway ?? ""} onChange={(event) => onChange({ ...filters, gateway: event.target.value })} placeholder="studio-main" />
      </label>
    </section>
  );
}
