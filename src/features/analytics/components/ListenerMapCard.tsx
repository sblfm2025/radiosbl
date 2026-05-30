/**
 * ListenerMapCard — Visualisasi Sebaran Wilayah Pendengar
 * Menampilkan daftar kota/kabupaten pendengar dengan bar chart sederhana.
 * Data bersumber dari field location.city / location.region pada sesi Firestore.
 */

import React, { useEffect, useState } from 'react';
import { analyticsService, type LocationBreakdown, MetricsTimeRange } from '../services/analytics.service';
import { getFlagEmoji } from '../services/geolocation.service';

interface ListenerMapCardProps {
  timeRange?: MetricsTimeRange;
  maxCities?: number;
}

type ViewMode = 'cities' | 'regions' | 'countries';

export function ListenerMapCard({
  timeRange = MetricsTimeRange.TODAY,
  maxCities = 10,
}: ListenerMapCardProps) {
  const [data, setData] = useState<LocationBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('cities');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    analyticsService
      .getLocationBreakdown(timeRange)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [timeRange]);

  const isEmpty = !data || data.totalWithLocation === 0;

  // Hitung max count untuk normalisasi bar width
  function getMaxCount(mode: ViewMode): number {
    if (!data) return 1;
    if (mode === 'cities') return Math.max(1, ...data.cities.map((c) => c.count));
    if (mode === 'regions') return Math.max(1, ...Object.values(data.regions));
    return Math.max(1, ...Object.values(data.countries).map((c) => c.count));
  }

  const maxCount = getMaxCount(viewMode);

  const cardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '16px',
    border: '1px solid var(--line)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  };

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: '8px',
    border: '1px solid',
    borderColor: active ? 'var(--blue)' : 'var(--line)',
    background: active ? 'var(--blue)' : 'transparent',
    color: active ? 'white' : 'var(--muted)',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>
            🗺️ Sebaran Wilayah Pendengar
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
            Berdasarkan IP geolocation • Otomatis tanpa izin GPS
          </p>
        </div>
        {data && (
          <div style={{
            background: 'var(--blue)',
            color: 'white',
            borderRadius: '10px',
            padding: '4px 12px',
            fontSize: '0.8rem',
            fontWeight: 700,
          }}>
            {data.totalWithLocation} sesi terlacak
          </div>
        )}
      </div>

      {/* View mode tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {(['cities', 'regions', 'countries'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            style={tabBtnStyle(viewMode === mode)}
          >
            {mode === 'cities' ? '🏙️ Kota' : mode === 'regions' ? '🗾 Provinsi' : '🌏 Negara'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{
              height: '44px',
              borderRadius: '8px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }} />
          ))}
        </div>
      ) : isEmpty ? (
        <div style={{
          textAlign: 'center',
          padding: '32px 16px',
          color: 'var(--muted)',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📍</div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>Belum ada data lokasi</p>
          <p style={{ margin: '6px 0 0', fontSize: '0.8rem' }}>
            Data akan muncul setelah pendengar memutar radio
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {viewMode === 'cities' && data.cities.slice(0, maxCities).map((item, idx) => (
            <LocationBar
              key={`${item.city}-${item.region}`}
              rank={idx + 1}
              label={item.city}
              sublabel={item.region}
              flag={getFlagEmoji(item.countryCode)}
              count={item.count}
              maxCount={maxCount}
              color={idx === 0 ? '#3b82f6' : idx === 1 ? '#8b5cf6' : idx === 2 ? '#10b981' : '#6b7280'}
            />
          ))}

          {viewMode === 'regions' && Object.entries(data.regions)
            .sort(([, a], [, b]) => b - a)
            .slice(0, maxCities)
            .map(([region, count], idx) => (
              <LocationBar
                key={region}
                rank={idx + 1}
                label={region}
                flag="🗾"
                count={count}
                maxCount={maxCount}
                color={idx === 0 ? '#3b82f6' : idx === 1 ? '#8b5cf6' : idx === 2 ? '#10b981' : '#6b7280'}
              />
            ))}

          {viewMode === 'countries' && Object.values(data.countries)
            .sort((a, b) => b.count - a.count)
            .slice(0, maxCities)
            .map((item, idx) => (
              <LocationBar
                key={item.code}
                rank={idx + 1}
                label={item.name}
                flag={getFlagEmoji(item.code)}
                count={item.count}
                maxCount={maxCount}
                color={idx === 0 ? '#3b82f6' : idx === 1 ? '#8b5cf6' : idx === 2 ? '#10b981' : '#6b7280'}
              />
            ))}
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

interface LocationBarProps {
  rank: number;
  label: string;
  sublabel?: string;
  flag: string;
  count: number;
  maxCount: number;
  color: string;
}

function LocationBar({ rank, label, sublabel, flag, count, maxCount, color }: LocationBarProps) {
  const barWidth = Math.max(4, (count / maxCount) * 100);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 12px',
      borderRadius: '10px',
      background: rank === 1 ? `${color}08` : 'transparent',
      border: rank === 1 ? `1px solid ${color}20` : '1px solid transparent',
      transition: 'background 0.2s',
    }}>
      {/* Rank */}
      <span style={{
        minWidth: '24px',
        textAlign: 'center',
        fontSize: '0.8rem',
        fontWeight: 700,
        color: rank <= 3 ? color : 'var(--muted)',
      }}>
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}`}
      </span>

      {/* Flag */}
      <span style={{ fontSize: '1.2rem' }}>{flag}</span>

      {/* Label + bar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>{label}</span>
            {sublabel && (
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: '6px' }}>{sublabel}</span>
            )}
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color, marginLeft: '8px', whiteSpace: 'nowrap' }}>
            {count} sesi
          </span>
        </div>
        {/* Bar */}
        <div style={{
          height: '5px',
          borderRadius: '3px',
          background: '#f0f0f0',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${barWidth}%`,
            borderRadius: '3px',
            background: `linear-gradient(90deg, ${color}, ${color}99)`,
            transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
      </div>
    </div>
  );
}
