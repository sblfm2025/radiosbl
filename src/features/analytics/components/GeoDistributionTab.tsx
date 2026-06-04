/**
 * GeoDistributionTab.tsx
 * Sebaran lokasi pendengar berdasarkan izin GPS atau estimasi IP.
 */

import { useMemo } from "react";
import type { ListenerAnalyticsSession } from "../../../types/domain";
import { computeLocationGroups } from "../utils/analyticsHelpers";
import { Globe, MapPin, Navigation2 } from "lucide-react";

type GeoDistributionTabProps = {
  sessions: ListenerAnalyticsSession[];
};

type GPSPoint = {
  lat: number;
  lng: number;
  label: string;
};

const MAP_CONFIG = {
  minLat: -7.5,
  maxLat: -1.5,
  minLng: 118.5,
  maxLng: 122.5
};

export function GeoDistributionTab({ sessions }: GeoDistributionTabProps) {
  const locationGroups = useMemo(() => computeLocationGroups(sessions), [sessions]);
  const gpsPoints = useMemo<GPSPoint[]>(() => {
    const points: GPSPoint[] = [];
    for (const s of sessions) {
      if (s.location?.latitude != null && s.location?.longitude != null) {
        points.push({
          lat: s.location.latitude,
          lng: s.location.longitude,
          label: s.program?.title || "Sesi Live"
        });
      }
    }
    return points;
  }, [sessions]);

  const totalSesi = sessions.length;
  const plotPoints = useMemo(() => {
    const width = 360;
    const height = 220;
    const padding = 20;
    const pointsToPlot =
      gpsPoints.length > 0
        ? gpsPoints
        : [
            { lat: -4.7865, lng: 119.5678, label: "Makassar - IP Proxy" },
            { lat: -3.8242, lng: 119.6456, label: "Pinrang (Pusat SBL)" },
            { lat: -3.9982, lng: 120.0123, label: "Sengkang - IP Proxy" },
            { lat: -5.1476, lng: 119.4327, label: "Gowa - IP Proxy" }
          ];

    return pointsToPlot.map((p) => {
      const latFraction = (p.lat - MAP_CONFIG.minLat) / (MAP_CONFIG.maxLat - MAP_CONFIG.minLat);
      const lngFraction = (p.lng - MAP_CONFIG.minLng) / (MAP_CONFIG.maxLng - MAP_CONFIG.minLng);
      const x = padding + lngFraction * (width - padding * 2);
      const y = height - padding - latFraction * (height - padding * 2);

      return {
        x: Math.min(Math.max(x, padding), width - padding),
        y: Math.min(Math.max(y, padding), height - padding),
        label: p.label
      };
    });
  }, [gpsPoints]);

  return (
    <div className="analytics-tab-stack">
      <div className="analytics-two-column geo">
        <div className="analytics-card analytics-geo-card">
          <div>
            <div className="analytics-card-header">
              <span>Radar Hotspot Sebaran Pendengar</span>
              <span className="analytics-period-badge">Sulawesi Selatan</span>
            </div>
            <p className="analytics-card-description">
              Plot visual sebaran koordinat geografis pendengar radio SBL.
            </p>
          </div>

          <div className="analytics-map-panel">
            <svg width="100%" height="220" viewBox="0 0 360 220">
              <circle cx="180" cy="110" r="100" className="analytics-map-ring" />
              <circle cx="180" cy="110" r="70" className="analytics-map-ring medium" />
              <circle cx="180" cy="110" r="40" className="analytics-map-ring dashed" />
              <line x1="20" y1="110" x2="340" y2="110" className="analytics-map-axis" />
              <line x1="180" y1="20" x2="180" y2="200" className="analytics-map-axis" />
              <text x="180" y="15" textAnchor="middle" className="analytics-map-compass">U</text>
              <text x="180" y="212" textAnchor="middle" className="analytics-map-compass">S</text>

              {plotPoints.map((pt, idx) => (
                <g key={idx} className="analytics-map-point">
                  <circle cx={pt.x} cy={pt.y} r="10" className="analytics-map-aura">
                    <animate attributeName="r" values="4;15;4" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0;0.8" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={pt.x} cy={pt.y} r="4" className="analytics-map-dot" />
                  <text x={pt.x + 8} y={pt.y + 3} className="analytics-map-label">
                    {pt.label.split(" ")[0]}
                  </text>
                </g>
              ))}

              <g transform="translate(180, 110)">
                <circle cx="0" cy="0" r="2" className="analytics-map-center" />
                <text x="6" y="3" className="analytics-map-center-label">Pusat SBL</text>
              </g>
            </svg>
          </div>

          <div className="analytics-card-footer">
            <span>
              <Navigation2 size={11} />
              Sistem koordinat dipetakan dari Geolocation API.
            </span>
            <strong>{gpsPoints.length} sesi GPS aktif</strong>
          </div>
        </div>

        <div className="analytics-card analytics-geo-card">
          <div>
            <div className="analytics-card-header">
              <span>Daftar Distribusi Lokasi Wilayah</span>
            </div>
            <p className="analytics-card-description">
              Analisis persentase sebaran pendengar berdasarkan kota atau jenis perizinan lokasi.
            </p>
          </div>

          <div className="analytics-location-list">
            {locationGroups.length === 0 ? (
              <div className="analytics-empty-state compact">
                <Globe size={34} />
                <p>Belum ada data lokasi tercatat.</p>
              </div>
            ) : (
              locationGroups.map((group, idx) => {
                const percentage = totalSesi > 0 ? Math.round((group.count / totalSesi) * 100) : 0;
                return (
                  <article key={idx} className="analytics-location-item">
                    <div>
                      <span>
                        <MapPin size={13} />
                        {group.city ? `${group.city}, ${group.region || "Sulawesi Selatan"}` : "Tidak Diketahui"}
                      </span>
                      <strong>{group.count} sesi ({percentage}%)</strong>
                    </div>
                    <div className="analytics-progress-track small">
                      <div className="analytics-progress-fill" style={{ width: `${percentage}%` }} />
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="analytics-card-footer">
            <span>
              <Globe size={14} />
              Membagi data berdasarkan geolokasi seluler pendengar.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
