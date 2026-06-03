/**
 * useIcecastStatus.ts
 * Hook untuk mengambil data pendengar dari server Icecast via polling.
 * Mendukung deteksi CORS otomatis dan bypass menggunakan CORS proxy AllOrigins secara fail-safe.
 */

import { useCallback, useState, useEffect, useRef } from "react";

export type IcecastStatus = {
  listeners: number;
  streamName: string;
  streamStart?: string;
  online: boolean;
  error?: string;
  lastUpdatedAt?: string;
};

export type IcecastStatusState = IcecastStatus & {
  loading: boolean;
  lastUpdatedAt?: string;
  refresh: () => Promise<void>;
};

const POLLING_INTERVAL_MS = 30_000; // 30 detik

// URL Icecast terkonfigurasi via env var
const ICECAST_STATUS_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_ICECAST_STATUS_URL) ||
  "https://pu.klikhost.com/proxy/sbl/status-json.xsl"; // default fallback stasiun

async function fetchIcecastStatus(url: string): Promise<IcecastStatus> {
  let res: Response;
  
  try {
    // 1. Coba fetch langsung
    res = await fetch(url, { signal: AbortSignal.timeout(4000) });
  } catch (err) {
    // 2. Jika gagal (misal karena kendala CORS di browser), coba bypass via CORS proxy
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    res = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) });
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const contentType = res.headers.get("content-type") || "";
  let data: any;

  // Mendapatkan text untuk diparse
  const text = await res.text();

  try {
    // Coba parse sebagai JSON terlebih dahulu
    data = JSON.parse(text);
  } catch {
    // Jika gagal parse JSON, coba parsing XML text sederhana
    const match = text.match(/<listeners>(\d+)<\/listeners>/);
    const listeners = match ? parseInt(match[1]!, 10) : 0;
    const nameMatch = text.match(/<server_name>(.*?)<\/server_name>/);
    return {
      listeners,
      streamName: nameMatch?.[1] || "RADIO SBL 92.4 FM",
      online: true
    };
  }

  // Format JSON Icecast: data.icestats.source
  const source = data?.icestats?.source;
  const sourceArr = Array.isArray(source) ? source : source ? [source] : [];
  const totalListeners = sourceArr.reduce(
    (sum: number, s: any) => sum + (parseInt(s.listeners ?? "0", 10) || 0),
    0
  );
  const firstName = sourceArr[0]?.server_name || "RADIO SBL 92.4 FM";

  return {
    listeners: totalListeners,
    streamName: firstName,
    streamStart: sourceArr[0]?.stream_start,
    online: true // Jika berhasil parsing dan source ada data
  };
}

export function useIcecastStatus(): IcecastStatusState {
  const [status, setStatus] = useState<IcecastStatus>({
    listeners: 0,
    streamName: "RADIO SBL 92.4 FM",
    online: false
  });
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchIcecastStatus(ICECAST_STATUS_URL);
      setStatus({
        ...result,
        lastUpdatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      setStatus(prev => ({ ...prev, online: false, error: err?.message, lastUpdatedAt: new Date().toISOString() }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void poll();
    timerRef.current = setInterval(() => void poll(), POLLING_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [poll]);

  return {
    ...status,
    loading,
    refresh: poll
  };
}
