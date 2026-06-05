# Audit Kuota Firebase 2026-06-05

## Ringkasan

Screenshot Firebase menunjukkan Cloud Firestore Spark sudah menyentuh:

- Writes: 20K / hari, 100% limit
- Reads: 46K / hari, 91.3% limit

Penyebab paling kuat adalah kombinasi heartbeat analytics pendengar, listener real-time admin, dan gateway studio yang sebelumnya berpotensi polling/menulis terlalu sering.

## Penyebab Utama

### 1. Heartbeat analytics pendengar terlalu rapat

Sebelumnya `useStreamingHeartbeat` menulis ke `listenerAnalyticsSessions` setiap 15 detik selama audio diputar.

Dampak kasar:

- 1 pendengar aktif: 240 writes / jam
- 10 pendengar aktif: 2.400 writes / jam
- 80 pendengar aktif selama 1 jam: sekitar 19.200 writes

Ini cocok dengan gejala writes 20K habis dalam beberapa jam.

### 2. Analytics aktif global

`ListenerAnalyticsTracker` dipasang di root app, sehingga write analytics terjadi untuk pemutar audio secara global, bukan hanya saat admin membuka halaman analytics.

### 3. Query analytics tanpa limit

Dashboard analytics sebelumnya membaca seluruh `listenerAnalyticsSessions` dan seluruh `listenerStreamingErrors`. Jika koleksi sudah besar, sekali buka halaman bisa menghabiskan banyak reads.

### 4. Listener absensi membaca koleksi penuh

Saat user login, app membuka listener `attendanceRecords` dan juga memanggil read manual untuk koleksi yang sama. Ini menggandakan read awal.

### 5. Studio Gateway

Repo `sblfm2025/studio-gateway` sudah punya commit mitigasi `c500915 Stabilkan beban Firestore gateway`, tetapi default lama masih berisiko jika build/konfigurasi di PC studio belum diperbarui.

## Perubahan Aplikasi Utama

- `VITE_ENABLE_LISTENER_ANALYTICS` ditambahkan dan default `false`.
- Heartbeat analytics diubah dari 15 detik menjadi 3 menit.
- Heartbeat awal duplikatif setelah play dihapus.
- Query sesi aktif dibatasi 200 dokumen.
- Query histori analytics dibatasi 500 dokumen.
- Query streaming error dibatasi 100 dokumen.
- Streaming error hanya dicatat ke Firestore jika analytics diaktifkan.
- Listener absensi dibatasi 300 record terbaru.
- Read manual `listAttendanceRecords()` yang duplikatif setelah subscribe dihapus.

## Perubahan Studio Gateway Lokal

Perubahan dilakukan di `tmp/studio-gateway`:

- Polling utama default: 60 detik.
- Minimal write `radiobossNowPlaying/current`: 60 detik.
- Minimal write `radiobossStatus/current`: 120 detik.
- Minimal write `radiobossGatewayHeartbeat/{gatewayId}`: 120 detik.
- Command worker default nonaktif.
- Song request worker default nonaktif.
- Auto recording default tetap nonaktif.
- Song request auto-forward harus eksplisit `true`.

## Konfigurasi Free Tier yang Disarankan

App utama:

```env
VITE_ENABLE_LISTENER_ANALYTICS=false
```

Studio Gateway:

```env
POLL_INTERVAL_SECONDS=60
NOW_PLAYING_MIN_WRITE_SECONDS=60
STATUS_MIN_WRITE_SECONDS=120
HEARTBEAT_INTERVAL_SECONDS=120
FIRESTORE_QUOTA_COOLDOWN_SECONDS=900
COMMAND_WORKER_ENABLED=false
COMMAND_POLL_INTERVAL_SECONDS=120
AUTO_RECORDING_ENABLED=false
AUTO_RECORDING_INTERVAL_SECONDS=300
SONG_REQUEST_WORKER_ENABLED=false
SONG_REQUEST_WORKER_INTERVAL_SECONDS=300
SONG_REQUEST_AUTO_FORWARD_TO_RADIOBOSS=false
```

Jika command/auto request benar-benar diperlukan, aktifkan satu per satu dan pantau usage Firestore setelah 1-2 jam.

## Estimasi Dampak

Jika analytics tetap dimatikan:

- Write heartbeat pendengar ke Firestore turun ke 0.
- Streaming error analytics tidak menulis ke Firestore.
- Read dashboard analytics tidak terjadi karena halaman analytics tidak aktif.

Jika analytics diaktifkan kembali:

- Write heartbeat turun dari 240 writes/jam/pendengar menjadi sekitar 20 writes/jam/pendengar.
- Query admin dibatasi agar tidak membaca koleksi penuh.

## Checklist Operasional

1. Deploy ulang app utama setelah perubahan.
2. Pastikan `.env.local` produksi tidak mengisi `VITE_ENABLE_LISTENER_ANALYTICS=true`.
3. Update dan rebuild Studio Gateway di PC studio.
4. Pastikan hanya satu proses gateway berjalan.
5. Pantau Firebase Usage setelah reset kuota harian.
6. Jika writes naik cepat lagi, matikan worker gateway non-kritis lebih dulu.

## Verifikasi Lokal

- `npm run typecheck`: berhasil.
- `npm test -- listenerAnalytics`: berhasil.
- `npm test -- attendance`: berhasil.
- `npm run build`: berhasil.
- `npm run build` di `tmp/studio-gateway`: berhasil setelah `npm ci`.
