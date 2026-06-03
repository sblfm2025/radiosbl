import type { ListenerAnalyticsSession } from "../../../types/domain";
import { Laptop, Smartphone, Tablet, HelpCircle } from "lucide-react";

type DeviceBreakdownCardProps = {
  sessions: ListenerAnalyticsSession[];
};

export function DeviceBreakdownCard({ sessions }: DeviceBreakdownCardProps) {
  const total = sessions.length;
  
  const counts = sessions.reduce(
    (acc, s) => {
      const type = s.device?.type || "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    { mobile: 0, desktop: 0, tablet: 0, unknown: 0 } as Record<string, number>
  );

  const getPercentage = (count: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const devices = [
    { key: "mobile", label: "Mobile / HP", icon: Smartphone, count: counts.mobile, colorClass: "mobile" },
    { key: "desktop", label: "Desktop / PC", icon: Laptop, count: counts.desktop, colorClass: "desktop" },
    { key: "tablet", label: "Tablet", icon: Tablet, count: counts.tablet, colorClass: "tablet" },
    { key: "unknown", label: "Lain-lain", icon: HelpCircle, count: counts.unknown, colorClass: "unknown" }
  ];

  return (
    <div className="workflow-card">
      <div className="workflow-card-header">
        <span className="workflow-card-title">Perangkat Pendengar</span>
        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Total Sesi: {total}</span>
      </div>
      <div className="workflow-card-body">
        <div className="device-list-container">
          {devices.map((dev) => {
            const Icon = dev.icon;
            const pct = getPercentage(dev.count);

            return (
              <div key={dev.key} className="device-row-item">
                <div className="device-row-meta">
                  <span className="device-row-label">
                    <Icon size={16} />
                    {dev.label}
                  </span>
                  <span className="device-row-pct">
                    {pct}% <small style={{ color: "var(--color-text-muted)", fontSize: "10px", fontWeight: "normal" }}>({dev.count})</small>
                  </span>
                </div>
                <div className="device-bar-track">
                  <div
                    className={`device-bar-fill ${dev.colorClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
