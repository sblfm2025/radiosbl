import { useEffect, useState } from "react";
import { PageHeader } from "../../../components/PageHeader";
import { subscribeActiveSessions, listAllSessions } from "../services/listenerAnalytics.service";
import { subscribeStreamingErrors } from "../services/streamingError.service";
import { useIcecastStatus } from "../hooks/useIcecastStatus";
import type { ListenerAnalyticsSession, ListenerStreamingError } from "../../../types/domain";
import type { AuthSession } from "../../../services/auth.service";

// Import Komponen Tab Baru
import { SummaryTab } from "../components/SummaryTab";
import { RealTimeTab } from "../components/RealTimeTab";
import { ActiveSessionsTab } from "../components/ActiveSessionsTab";
import { PopularContentTab } from "../components/PopularContentTab";
import { GeoDistributionTab } from "../components/GeoDistributionTab";

import { RefreshCw, LayoutDashboard, Activity, Table, Award, MapPin } from "lucide-react";
import "../styles/listenerAnalytics.css";

type ListenerAnalyticsPageProps = {
  session: AuthSession | null;
};

type TabType = "summary" | "realtime" | "sessions" | "popular" | "geo";

export default function ListenerAnalyticsPage({ session }: ListenerAnalyticsPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const [timeDays, setTimeDays] = useState<number>(7); // Default 7 hari terakhir

  const [activeSessions, setActiveSessions] = useState<ListenerAnalyticsSession[]>([]);
  const [allSessions, setAllSessions] = useState<ListenerAnalyticsSession[]>([]);
  const [streamingErrors, setStreamingErrors] = useState<ListenerStreamingError[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Status Icecast Server dari polling hook
  const icecastStatus = useIcecastStatus();

  useEffect(() => {
    // 1. Subscribe sesi aktif secara real-time
    const unsubscribeActive = subscribeActiveSessions((sessions) => {
      setActiveSessions(sessions);
    });

    // 2. Subscribe logs error secara real-time
    const unsubscribeErrors = subscribeStreamingErrors((errors) => {
      setStreamingErrors(errors);
    });

    // 3. Muat data historis sesi saat halaman dibuka
    void loadHistoricalData();

    return () => {
      unsubscribeActive();
      unsubscribeErrors();
    };
  }, []);

  const loadHistoricalData = async () => {
    setRefreshing(true);
    try {
      const [data] = await Promise.all([
        listAllSessions(),
        icecastStatus.refresh()
      ]);
      setAllSessions(data);
    } catch (err) {
      console.error("Gagal memuat data analisis historis:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "summary":
        return (
          <SummaryTab
            activeSessions={activeSessions}
            allSessions={allSessions}
            icecast={icecastStatus}
            timeDays={timeDays}
          />
        );
      case "realtime":
        return (
          <RealTimeTab
            activeSessions={activeSessions}
            streamingErrors={streamingErrors}
          />
        );
      case "sessions":
        return (
          <ActiveSessionsTab
            activeSessions={activeSessions}
          />
        );
      case "popular":
        return (
          <PopularContentTab
            sessions={allSessions}
          />
        );
      case "geo":
        return (
          <GeoDistributionTab
            sessions={allSessions}
          />
        );
      default:
        return null;
    }
  };

  // Cek apakah tab saat ini memerlukan filter waktu
  const showTimeFilter = activeTab === "summary" || activeTab === "popular" || activeTab === "geo";

  return (
    <>
      <div className="analytics-page-head">
        <PageHeader
          eyebrow="Monitoring Stasiun"
          title="Dashboard Analytics Pendengar"
          description={`Pemantauan estimasi real-time pendengar aktif, integrasi server Icecast, performa konten populer, sebaran wilayah geografis, dan diagnosis kendala streaming stasiun Radio SBL.${session ? ` Operator: ${session.user.displayName}.` : ""}`}
        />
        
        <div className="analytics-page-actions">
          {showTimeFilter && (
            <div className="analytics-time-filter">
              <button
                type="button"
                onClick={() => setTimeDays(1)}
                className={`location-btn ${timeDays === 1 ? "primary" : "secondary"}`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setTimeDays(7)}
                className={`location-btn ${timeDays === 7 ? "primary" : "secondary"}`}
              >
                7 Hari
              </button>
              <button
                type="button"
                onClick={() => setTimeDays(30)}
                className={`location-btn ${timeDays === 30 ? "primary" : "secondary"}`}
              >
                30 Hari
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              void loadHistoricalData();
            }}
            className="location-btn secondary"
            disabled={refreshing || icecastStatus.loading}
          >
            <RefreshCw size={14} className={refreshing || icecastStatus.loading ? "spin" : ""} />
            Segarkan
          </button>
        </div>
      </div>

      {/* Navigasi Tab Premium */}
      <div className="analytics-tabs-container">
        <button
          type="button"
          onClick={() => setActiveTab("summary")}
          className={`analytics-tab-btn ${activeTab === "summary" ? "active" : ""}`}
        >
          <LayoutDashboard size={15} />
          Ringkasan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("realtime")}
          className={`analytics-tab-btn ${activeTab === "realtime" ? "active" : ""}`}
        >
          <Activity size={15} />
          Real-Time
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("sessions")}
          className={`analytics-tab-btn ${activeTab === "sessions" ? "active" : ""}`}
        >
          <Table size={15} />
          Sesi Aktif
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("popular")}
          className={`analytics-tab-btn ${activeTab === "popular" ? "active" : ""}`}
        >
          <Award size={15} />
          Konten Populer
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("geo")}
          className={`analytics-tab-btn ${activeTab === "geo" ? "active" : ""}`}
        >
          <MapPin size={15} />
          Sebaran Wilayah
        </button>
      </div>

      <div className="analytics-dashboard-content">
        {loading ? (
          <div className="analytics-loading-state">
            <div className="spinner-small"></div>
            <span>Memuat data analisis stasiun...</span>
          </div>
        ) : (
          renderActiveTabContent()
        )}
      </div>
    </>
  );
}
