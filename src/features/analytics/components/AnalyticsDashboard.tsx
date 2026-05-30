import React from "react";
import { LiveListenerCountCard } from "./LiveListenerCountCard";
import { ActiveSessionsCard } from "./ActiveSessionsCard";
import { ListenerMetricsCard } from "./ListenerMetricsCard";
import { TopContentCard } from "./TopContentCard";
import { RealTimeListenersCard } from "./RealTimeListenersCard";
import { ListenerMapCard } from "./ListenerMapCard";
import { MetricsTimeRange } from "../services/analytics.service";

export interface AnalyticsDashboardProps {
  title?: string;
  enableRealTime?: boolean;
  realTimeInterval?: number;
}

export function AnalyticsDashboard({
  title = "Dashboard Listener Analytics",
  enableRealTime = true,
  realTimeInterval = 30000,
}: AnalyticsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = React.useState<MetricsTimeRange>(MetricsTimeRange.TODAY);
  const [activeTab, setActiveTab] = React.useState<number>(0);

  const tabs = ["Ringkasan", "Real-Time", "Sesi Aktif", "Konten Populer", "Sebaran Wilayah"];

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600, color: "var(--ink)" }}>{title}</h1>
        
        {/* Time range buttons */}
        <div style={{ display: "flex", borderRadius: "12px", border: "1px solid var(--line)", overflow: "hidden", background: "white" }}>
          <button
            type="button"
            onClick={() => setSelectedTimeRange(MetricsTimeRange.TODAY)}
            style={{
              padding: "8px 16px",
              border: 0,
              background: selectedTimeRange === MetricsTimeRange.TODAY ? "var(--blue)" : "transparent",
              color: selectedTimeRange === MetricsTimeRange.TODAY ? "white" : "var(--muted)",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={() => setSelectedTimeRange(MetricsTimeRange.LAST_7_DAYS)}
            style={{
              padding: "8px 16px",
              border: 0,
              background: selectedTimeRange === MetricsTimeRange.LAST_7_DAYS ? "var(--blue)" : "transparent",
              color: selectedTimeRange === MetricsTimeRange.LAST_7_DAYS ? "white" : "var(--muted)",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              borderLeft: "1px solid var(--line)",
              borderRight: "1px solid var(--line)",
            }}
          >
            7 Hari
          </button>
          <button
            type="button"
            onClick={() => setSelectedTimeRange(MetricsTimeRange.LAST_30_DAYS)}
            style={{
              padding: "8px 16px",
              border: 0,
              background: selectedTimeRange === MetricsTimeRange.LAST_30_DAYS ? "var(--blue)" : "transparent",
              color: selectedTimeRange === MetricsTimeRange.LAST_30_DAYS ? "white" : "var(--muted)",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            30 Hari
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--line)", gap: "16px", overflowX: "auto" }}>
        {tabs.map((tab, idx) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(idx)}
            style={{
              padding: "12px 8px",
              background: "transparent",
              border: 0,
              borderBottom: activeTab === idx ? "2px solid var(--blue)" : "2px solid transparent",
              color: activeTab === idx ? "var(--blue)" : "var(--muted)",
              fontWeight: 600,
              fontSize: "0.95rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div>
        {/* Ringkasan Panel */}
        {activeTab === 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            <LiveListenerCountCard />
            <ListenerMetricsCard timeRange={selectedTimeRange} />
            <ListenerMetricsCard title="Statistik Mingguan" timeRange={MetricsTimeRange.LAST_7_DAYS} />
          </div>
        )}

        {/* Real-Time Panel */}
        {activeTab === 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            <RealTimeListenersCard refreshInterval={realTimeInterval} />
            {enableRealTime && (
              <LiveListenerCountCard title="Pendengar Aktif (Quick View)" />
            )}
          </div>
        )}

        {/* Sesi Aktif Panel */}
        {activeTab === 2 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
            <ActiveSessionsCard maxRows={15} />
          </div>
        )}

        {/* Konten Populer Panel */}
        {activeTab === 3 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            <TopContentCard timeRange={selectedTimeRange} maxItems={10} />
            <TopContentCard title="Top Konten 7 Hari" timeRange={MetricsTimeRange.LAST_7_DAYS} maxItems={10} />
          </div>
        )}

        {/* Sebaran Wilayah Panel */}
        {activeTab === 4 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
            <ListenerMapCard timeRange={selectedTimeRange} maxCities={15} />
          </div>
        )}
      </div>
    </div>
  );
}
