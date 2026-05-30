import { useEffect, useState, useCallback, useRef } from "react";
import { analyticsService, ListenerMetrics, MetricsTimeRange } from "../services/analytics.service";

export interface ListenerMetricsHookResult {
  metrics: ListenerMetrics | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => Promise<void>;
  isMonitoring: boolean;
}

export function useListenerMetrics(
  timeRange: MetricsTimeRange = MetricsTimeRange.TODAY,
  options: {
    enabled?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number; // default: 30 detik
  } = {}
): ListenerMetricsHookResult {
  const {
    enabled = true,
    autoRefresh = true,
    refreshInterval = 30000, // 30 detik
  } = options;

  const [metrics, setMetrics] = useState<ListenerMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeRangeRef = useRef<MetricsTimeRange>(timeRange);
  const loadingRef = useRef<boolean>(false);

  // Update timeRange jika berubah
  useEffect(() => {
    timeRangeRef.current = timeRange;
  }, [timeRange]);

  // Fungsi untuk mengambil data metrics
  const refresh = useCallback(async () => {
    if (!enabled || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const metricsData: ListenerMetrics = await analyticsService.getListenerMetrics(timeRangeRef.current);
      setMetrics(metricsData);
      setLastUpdate(new Date());
      setIsMonitoring(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Gagal mengambil data metrics";
      setError(errorMessage);
      setIsMonitoring(false);
      console.error("[useListenerMetrics] Error:", errorMessage);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [enabled]);

  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  // Setup auto-refresh
  useEffect(() => {
    if (!enabled || !autoRefresh) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Fetch awal
    refreshRef.current();

    // Setup interval
    intervalRef.current = setInterval(() => {
      refreshRef.current();
    }, refreshInterval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, autoRefresh, refreshInterval]);

  return {
    metrics,
    loading,
    error,
    lastUpdate,
    refresh,
    isMonitoring,
  };
}
