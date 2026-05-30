# Tahap 5 - Listener Analytics dan Streaming Error Tracking

## Tujuan
Menambahkan analytics pendengar dan error streaming secara aman, terpisah, dan tidak mengganggu streaming.

## Acuan
Gunakan dokumen `LISTENER_ANALYTICS_MVP_RADIO_SBL.md` sebagai acuan detail khusus analytics.

## Fitur Tahap Ini

1. Session tracking streaming.
2. Heartbeat pendengar.
3. Estimasi pendengar aktif dari aplikasi.
4. GPS/lokasi presisi dengan izin eksplisit.
5. Device/browser/OS sederhana.
6. Program performance basic.
7. Streaming error tracking.
8. Dashboard admin analytics MVP.

## Prinsip Implementasi

- Analytics harus fail-safe.
- Jika tracking gagal, streaming tetap berjalan.
- Jika izin GPS ditolak, streaming tetap berjalan.
- Jangan memaksa GPS untuk mendengarkan radio.
- Jangan menyebut data sebagai pendengar pasti jika belum dari server streaming.
- Gunakan istilah “Estimasi Pendengar Aktif dari Aplikasi”.

## Struktur File

```txt
src/features/analytics/pages/ListenerAnalyticsPage.tsx
src/features/analytics/components/ActiveListenersCard.tsx
src/features/analytics/components/DeviceBreakdownCard.tsx
src/features/analytics/components/ProgramPerformanceCard.tsx
src/features/analytics/components/StreamingErrorCard.tsx
src/features/analytics/components/LocationPermissionPrompt.tsx
src/features/analytics/hooks/useListenerAnalytics.ts
src/features/analytics/hooks/useStreamingHeartbeat.ts
src/features/analytics/hooks/usePreciseLocationConsent.ts
src/features/analytics/services/listenerAnalytics.service.ts
src/features/analytics/services/streamingError.service.ts
src/features/analytics/utils/deviceInfo.ts
```

## Collection Analytics

```txt
listenerAnalyticsSessions/{sessionId}
listenerStreamingErrors/{errorId}
listenerAnalyticsDaily/{YYYY-MM-DD}
```

## Session Field

```ts
{
  sessionId: string;
  userId?: string;
  anonymousId: string;
  startedAt: Timestamp;
  lastSeenAt: Timestamp;
  endedAt?: Timestamp;
  status: 'active' | 'paused' | 'ended' | 'error';
  source: 'web-pwa';
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  browser: string;
  os: string;
  programId?: string;
  programTitle?: string;
  playDurationSeconds: number;
  locationPermission: 'not_requested' | 'granted' | 'denied' | 'unavailable' | 'failed';
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    capturedAt: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## GPS/Lokasi Presisi

### Aturan UX

Sebelum meminta GPS, tampilkan penjelasan:

```txt
Radio SBL dapat menggunakan lokasi perangkat untuk membantu membaca jangkauan pendengar secara lebih akurat. Izin lokasi tidak wajib. Jika ditolak, radio tetap dapat didengarkan seperti biasa.
```

Tombol:

- Izinkan lokasi.
- Lewati.

### Teknis

Gunakan browser geolocation API:

```ts
navigator.geolocation.getCurrentPosition(success, error, {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000,
});
```

### Larangan

- Jangan meminta lokasi saat halaman baru dibuka tanpa konteks.
- Jangan meminta lokasi berulang-ulang.
- Jangan memblokir tombol play jika lokasi ditolak.
- Jangan tampilkan latitude/longitude ke user biasa.
- Jangan tampilkan lokasi presisi di dashboard umum.

## Streaming Error Tracking

### Collection

```txt
listenerStreamingErrors/{errorId}
```

Field:

```ts
{
  errorId: string;
  sessionId?: string;
  event: 'play_failed' | 'buffering_timeout' | 'stalled' | 'network_error' | 'media_error' | 'unknown';
  message?: string;
  programId?: string;
  programTitle?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  createdAt: Timestamp;
}
```

## Dashboard MVP

Route:

```txt
/admin/listener-analytics
```

Cards:

- Estimasi pendengar aktif dari aplikasi.
- Total play hari ini.
- Total durasi dengar estimasi.
- Device breakdown.
- Program paling sering diputar.
- Streaming error terakhir.
- Lokasi pendengar yang memberi izin.

## Aggregation Tahap Awal

Jangan langsung Cloud Functions jika belum perlu.

Gunakan query terbatas:

- Hari ini.
- 7 hari terakhir.
- Limit per query.

Jika data sudah besar, baru pertimbangkan aggregation collection atau Cloud Functions.

## Security Rules Ringkas

- User biasa hanya boleh membuat/update session miliknya sendiri.
- Admin boleh baca dashboard.
- Latitude/longitude hanya admin tertentu.
- Jangan buka read public untuk analytics.

## Testing Tahap 5

```bash
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Manual:

- [ ] Play streaming membuat session.
- [ ] Pause mengubah status.
- [ ] Heartbeat memperbarui `lastSeenAt`.
- [ ] GPS prompt tidak muncul paksa terus-menerus.
- [ ] Jika GPS ditolak, radio tetap jalan.
- [ ] Jika Firestore error, radio tetap jalan.
- [ ] Error streaming tercatat.
- [ ] Dashboard analytics hanya admin.
- [ ] User biasa tidak bisa baca analytics.
- [ ] Istilah “estimasi” digunakan di UI.

## Rollback

Matikan flag:

```ts
listenerAnalytics: false
```

Jangan hapus data analytics kecuali ada keputusan admin.
