import { Radio, Users } from "lucide-react";

type ActiveListenersCardProps = {
  activeCount: number;
};

export function ActiveListenersCard({ activeCount }: ActiveListenersCardProps) {
  return (
    <article className="metric-card-visual" aria-label="Estimasi Pendengar Aktif">
      <div className="metric-card-icon-wrap blue">
        <Radio size={22} className="pulse-animation-sbl" />
      </div>
      <div className="metric-card-info">
        <span className="metric-card-label">Pendengar Aktif</span>
        <h3 className="metric-card-val">{activeCount}</h3>
        <span style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
          Estimasi aplikasi (Realtime)
        </span>
      </div>
    </article>
  );
}
