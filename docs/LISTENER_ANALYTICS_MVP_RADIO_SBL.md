# IMPLEMENTASI AMAN: Listener Analytics MVP Radio SBL

## Status Dokumen

Dokumen ini adalah arahan teknis untuk menambahkan fitur **Listener Analytics Dashboard** pada Aplikasi Radio SBL dengan prinsip utama:

> Fitur analytics harus menjadi module tambahan yang aman, terpisah, fail-safe, dan tidak mengganggu tampilan premium maupun alur data yang sudah berjalan stabil.

Dokumen ini merupakan versi MVP yang disesuaikan dari perencanaan besar Listener Analytics Dashboard. Fokus tahap awal adalah mencatat data pendengar dari aplikasi, menampilkan estimasi pendengar aktif, membaca performa program, dan menyiapkan fondasi analytics yang bisa dikembangkan ke tahap lanjutan.

---

## 1. Tujuan Implementasi

Fitur ini bertujuan membantu tim Radio SBL mengetahui gambaran pendengar aplikasi, seperti:

1. Estimasi pendengar aktif dari aplikasi.
2. Jumlah play streaming harian.
3. Durasi dengar estimasi.
4. Program yang paling sering diputar.
5. Jam ramai pendengar.
6. Perangkat yang paling banyak digunakan.
7. Lokasi pendengar berdasarkan izin lokasi pengguna.
8. Data pendukung untuk evaluasi program, laporan internal, proposal kerja sama, sponsor, atau kebutuhan pengembangan siaran.

---

## 2. Prinsip Wajib

Developer wajib mengikuti prinsip berikut:

1. Jangan mengubah UI premium yang sudah stabil.
2. Jangan mengubah alur data lama.
3. Jangan mengubah schema collection lama.
4. Jangan mengganggu fitur streaming.
5. Jangan mengganggu mini player.
6. Jangan mengganggu absensi.
7. Jangan mengganggu jadwal siaran.
8. Jangan mengganggu request lagu.
9. Jangan mengganggu AI naskah.
10. Jangan mengganggu manajemen user.
11. Jangan mengganggu role dan akses yang sudah berjalan.
12. Analytics harus bersifat fail-safe.
13. Jika tracking gagal, aplikasi tetap harus berjalan normal.
14. Jika izin lokasi ditolak, streaming tetap harus berjalan normal.
15. Jangan memaksa user memberi izin lokasi untuk mendengarkan radio.
16. Kerjakan di branch baru.
17. Wajib backup sebelum coding.
18. Wajib uji mandiri sebelum merge.

---

## 3. Backup Wajib Sebelum Pengerjaan

Sebelum developer menulis kode, lakukan backup state stabil aplikasi.

```bash
git status
git add .
git commit -m "backup: stable state before listener analytics"
git checkout -b feature/listener-analytics-mvp
```

File yang wajib diperiksa dan diamankan:

```txt
firestore.rules
firestore.indexes.json
firebase.json
.env
.env.example
src/firebase*
src/services/*
src/hooks/*
src/components/*stream*
src/pages/*stream*
src/components/*player*
src/pages/admin/*
```

Jika ada perubahan besar yang tidak sengaja menyentuh modul lama, developer wajib rollback sebelum lanjut.

---

## 4. Scope Tahap 1

Tahap pertama hanya membuat analytics MVP dari aktivitas pendengar di aplikasi.

Event yang dicatat:

```txt
stream_play
stream_pause
stream_stop
stream_heartbeat
stream_error
location_permission_requested
location_permission_granted
location_permission_denied
location_captured
location_failed
```

Data utama yang boleh disimpan:

```txt
sessionId anonim
startedAt
lastSeenAt
endedAt
status active/ended
programId
programTitle
deviceType
browser
os
source web-pwa
playDurationSeconds
location permission status
latitude
longitude
location accuracy
capturedAt
createdAt
updatedAt
```

Data yang tidak boleh disimpan pada MVP:

```txt
nama pendengar
email pendengar
nomor HP pendengar
alamat lengkap otomatis
NIK atau identitas pribadi
kontak pribadi
riwayat lokasi berulang yang terlalu detail tanpa kebutuhan jelas
```

Catatan penting:

- GPS/lokasi presisi dan latitude/longitude tetap dimasukkan sesuai permintaan.
- Namun pengambilan lokasi wajib berdasarkan izin eksplisit dari browser/perangkat.
- Jika user menolak izin lokasi, aplikasi tetap harus berfungsi penuh.
- Jangan membuat lokasi sebagai syarat mendengarkan radio.

---

## 5. Batasan Penting Agar Tidak Merusak Aplikasi

Developer dilarang:

1. Mengubah struktur Dashboard utama.
2. Mengganti desain premium yang sudah berjalan.
3. Mengubah flow streaming.
4. Mengubah event play/pause utama yang sudah stabil.
5. Mengubah struktur data jadwal siaran.
6. Mengubah logic mini player kecuali menambahkan pemanggilan analytics kecil.
7. Mengubah logic absensi.
8. Mengubah logic request lagu.
9. Mengubah logic AI naskah.
10. Mengubah role user tanpa audit.
11. Memasang analytics yang membuat halaman streaming lambat.
12. Membuat Firestore write berlebihan setiap beberapa detik.
13. Menampilkan lokasi presisi kepada semua admin tanpa pembatasan.

Analytics harus menjadi lapisan tambahan yang tidak mempengaruhi pengalaman utama.

---

## 6. Struktur File yang Disarankan

Buat module baru yang terpisah:

```txt
src/features/analytics/
  components/
    AnalyticsSummaryCards.tsx
    ActiveListenersCard.tsx
    DeviceBreakdownCard.tsx
    ProgramPerformanceCard.tsx
    LocationAnalyticsCard.tsx
    HourlyActivityChart.tsx
  hooks/
    useListenerAnalytics.ts
    useActiveListenerEstimate.ts
    useLocationPermission.ts
  services/
    listenerAnalytics.service.ts
    listenerLocation.service.ts
    listenerDevice.service.ts
  types/
    listenerAnalytics.types.ts
  utils/
    analyticsSession.util.ts
    deviceParser.util.ts
    locationSanitizer.util.ts

src/pages/admin/
  ListenerAnalyticsPage.tsx

docs/
  LISTENER_ANALYTICS_MVP.md
```

Jangan menyebar logic analytics ke banyak file lama.

Komponen lama hanya boleh menambahkan pemanggilan kecil seperti:

```ts
trackStreamPlay(payload)
trackStreamPause(payload)
trackStreamStop(payload)
startAnalyticsHeartbeat(payload)
stopAnalyticsHeartbeat()
requestListenerLocationIfAllowed()
```

---

## 7. Firestore Collection Baru

Gunakan collection baru agar tidak mengganggu data lama.

```txt
listenerAnalyticsSessions/{sessionId}
listenerAnalyticsEvents/{eventId}
listenerAnalyticsDaily/{YYYY-MM-DD}
listenerAnalyticsLocationConsent/{sessionId}
```

Untuk MVP, collection utama yang wajib adalah:

```txt
listenerAnalyticsSessions/{sessionId}
```

Collection lain boleh ditambahkan jika dibutuhkan, tetapi jangan dibuat terlalu kompleks pada tahap awal.

---

## 8. Schema Session Analytics

Contoh document:

```ts
export type ListenerAnalyticsSession = {
  sessionId: string

  startedAt: Timestamp
  lastSeenAt: Timestamp
  endedAt?: Timestamp
  status: 'active' | 'ended' | 'error'

  source: 'web-pwa'

  device: {
    type: 'mobile' | 'tablet' | 'desktop' | 'unknown'
    os: string
    browser: string
  }

  program?: {
    id?: string
    title?: string
    startTime?: Timestamp
    endTime?: Timestamp
  }

  playback: {
    playCount: number
    pauseCount: number
    errorCount: number
    playDurationSeconds: number
    lastEvent: 'play' | 'pause' | 'stop' | 'heartbeat' | 'error'
  }

  location: {
    permission: 'unknown' | 'requested' | 'granted' | 'denied' | 'unavailable' | 'failed'
    latitude?: number
    longitude?: number
    accuracy?: number
    altitude?: number | null
    heading?: number | null
    speed?: number | null
    capturedAt?: Timestamp
    source: 'browser-geolocation' | 'none'
  }

  privacy: {
    locationConsentVersion: string
    locationConsentText: string
    preciseLocationEnabled: boolean
  }

  createdAt: Timestamp
  updatedAt: Timestamp
}
```

---

## 9. Schema Event Analytics Opsional

Jika developer membutuhkan audit event terpisah, gunakan collection berikut:

```txt
listenerAnalyticsEvents/{eventId}
```

Contoh document:

```ts
export type ListenerAnalyticsEvent = {
  eventId: string
  sessionId: string
  eventType:
    | 'stream_play'
    | 'stream_pause'
    | 'stream_stop'
    | 'stream_heartbeat'
    | 'stream_error'
    | 'location_permission_requested'
    | 'location_permission_granted'
    | 'location_permission_denied'
    | 'location_captured'
    | 'location_failed'

  timestamp: Timestamp

  program?: {
    id?: string
    title?: string
  }

  location?: {
    permission: 'granted' | 'denied' | 'failed' | 'unavailable'
    latitude?: number
    longitude?: number
    accuracy?: number
  }

  metadata?: Record<string, unknown>
}
```

Catatan:

- Jangan mencatat event terlalu sering.
- Heartbeat tidak perlu membuat document event baru setiap waktu jika session document sudah cukup diperbarui.
- Gunakan event collection hanya jika benar-benar perlu audit detail.

---

## 10. Aturan GPS dan Lokasi Presisi

Karena fitur ini ikut menyimpan GPS/lokasi presisi dan latitude/longitude, wajib diterapkan aturan berikut.

### 10.1 Izin Eksplisit

Browser harus meminta izin lokasi menggunakan Geolocation API.

Tidak boleh mengambil lokasi diam-diam.

Tidak boleh membuat lokasi sebagai syarat untuk streaming.

Teks izin yang disarankan di UI:

```txt
Radio SBL dapat menggunakan lokasi perangkat Anda untuk membantu membaca sebaran pendengar dan meningkatkan kualitas program siaran. Lokasi hanya digunakan untuk analytics internal dan tidak wajib untuk mendengarkan streaming.
```

Tombol:

```txt
Izinkan Lokasi
Lewati
```

### 10.2 Jika Izin Ditolak

Jika user menolak lokasi:

1. Streaming tetap berjalan.
2. Mini player tetap berjalan.
3. Session analytics tetap dicatat tanpa latitude/longitude.
4. Field location.permission diisi `denied`.
5. Jangan tampilkan popup berulang-ulang yang mengganggu.

### 10.3 Frekuensi Pengambilan Lokasi

Untuk MVP, lokasi cukup diambil:

1. Saat session streaming dimulai, atau
2. Saat user pertama kali menekan play, atau
3. Saat user secara sadar menekan tombol izinkan lokasi.

Jangan mengambil lokasi berulang setiap heartbeat.

Jangan membuat tracking perjalanan atau riwayat lokasi bergerak.

### 10.4 Akurasi Lokasi

Simpan field berikut:

```txt
latitude
longitude
accuracy
capturedAt
permission
source
```

Field `accuracy` penting agar tim tahu apakah lokasi sangat presisi atau hanya perkiraan.

### 10.5 Tampilan Lokasi di Dashboard

Dashboard boleh menampilkan:

1. Peta sebaran titik pendengar.
2. Ringkasan lokasi berdasarkan area.
3. Kota/kecamatan jika nanti reverse geocoding ditambahkan.
4. Jumlah session dengan izin lokasi.
5. Jumlah session tanpa izin lokasi.

Namun untuk MVP, tampilan lokasi presisi harus dibatasi hanya untuk admin berwenang.

Disarankan ada dua mode:

```txt
Mode Ringkasan: tampilkan area umum/agregat
Mode Detail Admin: tampilkan titik latitude/longitude untuk kebutuhan internal terbatas
```

### 10.6 Retensi Data Lokasi Presisi

Disarankan lokasi presisi tidak disimpan selamanya.

Rekomendasi MVP:

```txt
Lokasi presisi session: 30 hari
Agregat harian lokasi: boleh lebih lama
```

Jika belum ada Cloud Functions untuk auto-delete, tambahkan catatan manual cleanup atau script cleanup berkala.

---

## 11. Contoh Service: listenerLocation.service.ts

```ts
export type ListenerLocationResult = {
  permission: 'granted' | 'denied' | 'unavailable' | 'failed'
  latitude?: number
  longitude?: number
  accuracy?: number
  altitude?: number | null
  heading?: number | null
  speed?: number | null
  capturedAt: Date
  errorMessage?: string
}

export async function requestListenerLocation(): Promise<ListenerLocationResult> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return {
      permission: 'unavailable',
      capturedAt: new Date(),
      errorMessage: 'Geolocation is not available in this browser',
    }
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          permission: 'granted',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          capturedAt: new Date(),
        })
      },
      (error) => {
        const denied = error.code === error.PERMISSION_DENIED

        resolve({
          permission: denied ? 'denied' : 'failed',
          capturedAt: new Date(),
          errorMessage: error.message,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      }
    )
  })
}
```

Catatan implementasi:

- `enableHighAccuracy: true` boleh digunakan karena user meminta lokasi presisi.
- Tetap berikan timeout agar tidak menghambat streaming.
- Jangan tunggu lokasi selesai baru memulai audio.
- Jalankan lokasi secara paralel/fail-safe.

---

## 12. Contoh Service: listenerAnalytics.service.ts

```ts
import { doc, serverTimestamp, setDoc, updateDoc, increment } from 'firebase/firestore'
import { db } from '@/firebase'

type TrackPlayPayload = {
  sessionId: string
  programId?: string
  programTitle?: string
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown'
  os: string
  browser: string
}

export async function trackStreamPlay(payload: TrackPlayPayload) {
  try {
    const ref = doc(db, 'listenerAnalyticsSessions', payload.sessionId)

    await setDoc(
      ref,
      {
        sessionId: payload.sessionId,
        startedAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
        status: 'active',
        source: 'web-pwa',
        device: {
          type: payload.deviceType,
          os: payload.os,
          browser: payload.browser,
        },
        program: {
          id: payload.programId ?? null,
          title: payload.programTitle ?? null,
        },
        playback: {
          playCount: increment(1),
          pauseCount: 0,
          errorCount: 0,
          playDurationSeconds: 0,
          lastEvent: 'play',
        },
        location: {
          permission: 'unknown',
          source: 'none',
        },
        privacy: {
          locationConsentVersion: '2026-05-30-v1',
          locationConsentText:
            'Lokasi digunakan untuk analytics internal Radio SBL dan tidak wajib untuk mendengarkan streaming.',
          preciseLocationEnabled: false,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
  } catch (error) {
    console.warn('[listener-analytics] trackStreamPlay skipped', error)
  }
}

export async function updateSessionLocation(params: {
  sessionId: string
  permission: 'granted' | 'denied' | 'unavailable' | 'failed'
  latitude?: number
  longitude?: number
  accuracy?: number
}) {
  try {
    const ref = doc(db, 'listenerAnalyticsSessions', params.sessionId)

    await updateDoc(ref, {
      'location.permission': params.permission,
      'location.latitude': params.latitude ?? null,
      'location.longitude': params.longitude ?? null,
      'location.accuracy': params.accuracy ?? null,
      'location.capturedAt': serverTimestamp(),
      'location.source': params.permission === 'granted' ? 'browser-geolocation' : 'none',
      'privacy.preciseLocationEnabled': params.permission === 'granted',
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.warn('[listener-analytics] updateSessionLocation skipped', error)
  }
}

export async function trackStreamHeartbeat(params: {
  sessionId: string
  additionalSeconds?: number
}) {
  try {
    const ref = doc(db, 'listenerAnalyticsSessions', params.sessionId)

    await updateDoc(ref, {
      lastSeenAt: serverTimestamp(),
      status: 'active',
      'playback.lastEvent': 'heartbeat',
      'playback.playDurationSeconds': increment(params.additionalSeconds ?? 60),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.warn('[listener-analytics] heartbeat skipped', error)
  }
}

export async function trackStreamPause(sessionId: string) {
  try {
    const ref = doc(db, 'listenerAnalyticsSessions', sessionId)

    await updateDoc(ref, {
      lastSeenAt: serverTimestamp(),
      'playback.pauseCount': increment(1),
      'playback.lastEvent': 'pause',
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.warn('[listener-analytics] pause skipped', error)
  }
}

export async function trackStreamStop(sessionId: string) {
  try {
    const ref = doc(db, 'listenerAnalyticsSessions', sessionId)

    await updateDoc(ref, {
      endedAt: serverTimestamp(),
      status: 'ended',
      'playback.lastEvent': 'stop',
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.warn('[listener-analytics] stop skipped', error)
  }
}
```

Catatan:

- Kode di atas adalah contoh pola, bukan wajib copy mentah.
- Sesuaikan import Firebase dengan struktur project Radio SBL.
- Jangan sampai error analytics naik ke UI utama.

---

## 13. Heartbeat Analytics

Heartbeat digunakan untuk menghitung estimasi pendengar aktif.

Rekomendasi MVP:

```txt
Interval heartbeat: 60 detik
Session aktif: lastSeenAt dalam 90 detik terakhir
```

Jangan gunakan heartbeat 10 detik pada MVP karena dapat menambah beban Firestore.

Pseudo-flow:

```txt
User klik play
  → buat/update session
  → mulai heartbeat 60 detik
  → request lokasi jika user mengizinkan

User klik pause
  → update pause
  → hentikan heartbeat

User klik stop/tutup player
  → update ended
  → hentikan heartbeat

Firestore error
  → console.warn saja
  → streaming tetap jalan
```

---

## 14. Integrasi dengan Streaming Player

Di komponen player utama, tambahkan analytics secara minimal.

Contoh pola:

```ts
async function handlePlay() {
  originalPlayHandler()

  try {
    await trackStreamPlay({
      sessionId,
      programId: currentProgram?.id,
      programTitle: currentProgram?.title,
      deviceType,
      os,
      browser,
    })

    startHeartbeat()
    requestLocationInBackground()
  } catch (error) {
    console.warn('[analytics] play tracking skipped', error)
  }
}
```

Catatan penting:

- `originalPlayHandler()` harus tetap berjalan seperti sebelumnya.
- Jangan menunggu analytics selesai untuk memulai streaming.
- Analytics berjalan sebagai tambahan setelah audio diproses.
- Jika analytics error, audio tidak boleh terganggu.

---

## 15. Dashboard Admin Analytics

Tambahkan menu baru:

```txt
Admin → Analytics Pendengar
```

Dashboard tahap pertama menampilkan:

1. Estimasi pendengar aktif dari aplikasi.
2. Total play hari ini.
3. Total durasi dengar estimasi.
4. Device breakdown.
5. Program paling sering diputar.
6. Jam ramai hari ini.
7. Jumlah session dengan izin lokasi.
8. Jumlah session tanpa izin lokasi.
9. Peta/titik lokasi pendengar jika library map sudah tersedia atau mudah ditambahkan.
10. Tabel ringkas session terbaru.

Label angka harus jujur.

Gunakan:

```txt
Estimasi Pendengar Aktif dari Aplikasi
```

Jangan gunakan:

```txt
Pendengar Aktif Sebenarnya
```

Kecuali nanti sudah terhubung ke server streaming asli.

---

## 16. UI/UX Dashboard

Dashboard analytics harus mengikuti tampilan premium Radio SBL.

Arahan visual:

```txt
rounded card
soft shadow
spacing lega
font konsisten
warna senada dengan aplikasi
ikon lucide-react
mobile-first responsive
hindari tabel kasar/default
hindari warna terlalu ramai
hindari dashboard admin berat
hindari tampilan seperti template mentah
```

Mobile:

```txt
1 kolom vertikal
card ringkas
chart sederhana
angka utama besar tapi tidak berlebihan
filter mudah disentuh
hindari horizontal scroll
```

Desktop:

```txt
layout 2-3 kolom
summary cards di atas
chart di tengah
lokasi dan program performance di bawah
```

---

## 17. Akses dan Security Rules

Analytics hanya boleh diakses oleh admin/role yang berwenang.

User biasa tidak boleh membaca collection analytics.

Contoh arah rules konseptual:

```txt
listenerAnalyticsSessions:
  create/update: boleh dari client dengan data terbatas
  read: hanya admin

listenerAnalyticsDaily:
  read/write: hanya admin atau trusted server

listenerAnalyticsEvents:
  create: boleh dari client dengan validasi terbatas
  read: hanya admin
```

Developer wajib menyesuaikan dengan pola role existing di Radio SBL.

Jangan membuka read analytics untuk publik.

---

## 18. Validasi Data Client

Sebelum menulis ke Firestore, pastikan:

1. `sessionId` ada.
2. `deviceType` masuk enum yang benar.
3. `status` masuk enum yang benar.
4. `latitude` dan `longitude` hanya ditulis jika permission `granted`.
5. `latitude` berada antara -90 sampai 90.
6. `longitude` berada antara -180 sampai 180.
7. `accuracy` berupa number positif.
8. `playDurationSeconds` tidak negatif.
9. Field sensitif yang tidak diperlukan tidak ikut dikirim.

---

## 19. Privacy dan Kebijakan Pengguna

Karena fitur menyimpan latitude/longitude, update halaman Kebijakan Privasi atau Tentang aplikasi.

Tambahkan bagian:

```md
## Analytics Pendengar dan Lokasi

Aplikasi Radio SBL dapat mencatat data penggunaan streaming seperti waktu play, durasi dengar, perangkat, browser, program yang sedang didengarkan, dan estimasi aktivitas pendengar. Jika pengguna memberikan izin lokasi, aplikasi juga dapat menyimpan latitude, longitude, dan tingkat akurasi lokasi untuk kebutuhan analytics internal, evaluasi jangkauan siaran, dan peningkatan kualitas program.

Izin lokasi bersifat opsional. Pengguna tetap dapat mendengarkan streaming Radio SBL meskipun tidak memberikan izin lokasi. Data lokasi tidak digunakan untuk menampilkan identitas pribadi pendengar secara publik.
```

---

## 20. Testing Wajib

Sebelum merge, developer wajib menjalankan:

```bash
npm install
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Jika ada script yang belum tersedia atau gagal karena konfigurasi lama, developer wajib mencatat alasan teknisnya dan tetap menjalankan pengujian pengganti yang relevan.

---

## 21. Manual Testing Checklist

### Streaming

```txt
[ ] Streaming tetap bisa play.
[ ] Streaming tetap bisa pause.
[ ] Streaming tetap bisa stop.
[ ] Audio tidak delay karena analytics.
[ ] Jika Firestore error, audio tetap berjalan.
[ ] Jika izin lokasi muncul, audio tetap berjalan.
[ ] Jika izin lokasi ditolak, audio tetap berjalan.
```

### Mini Player

```txt
[ ] Mini player tetap muncul sesuai aturan lama.
[ ] Mini player tidak tampil di halaman yang memang dikecualikan.
[ ] Mini player tidak rusak setelah analytics aktif.
[ ] Tombol play/pause mini player tetap normal.
```

### Dashboard Utama

```txt
[ ] Dashboard utama tidak berubah layout.
[ ] Card lama tidak berubah ukuran ekstrem.
[ ] Warna dan font tetap konsisten.
[ ] Tidak ada komponen analytics muncul di dashboard utama kecuali memang ditentukan.
```

### Modul Lama

```txt
[ ] Absensi tetap normal.
[ ] Jadwal siaran tetap normal.
[ ] Request lagu tetap normal.
[ ] AI naskah tetap normal.
[ ] Manajemen user tetap normal.
[ ] Streaming page tetap normal.
```

### Analytics

```txt
[ ] Session dibuat saat play.
[ ] Heartbeat memperbarui lastSeenAt.
[ ] Pause memperbarui event terakhir.
[ ] Stop mengubah status menjadi ended.
[ ] Error streaming tercatat jika terjadi.
[ ] Device type terbaca.
[ ] Browser terbaca.
[ ] OS terbaca.
[ ] Program aktif tersimpan jika tersedia.
[ ] Dashboard menampilkan estimasi pendengar aktif.
[ ] Dashboard menampilkan total play hari ini.
[ ] Dashboard menampilkan device breakdown.
[ ] Dashboard menampilkan program performance.
```

### Lokasi GPS

```txt
[ ] Browser meminta izin lokasi secara eksplisit.
[ ] User bisa memilih Lewati/Tolak.
[ ] Jika izin diberikan, latitude tersimpan.
[ ] Jika izin diberikan, longitude tersimpan.
[ ] Jika izin diberikan, accuracy tersimpan.
[ ] Jika izin ditolak, permission menjadi denied.
[ ] Jika geolocation tidak tersedia, permission menjadi unavailable.
[ ] Tidak ada popup lokasi berulang yang mengganggu.
[ ] Lokasi tidak menjadi syarat streaming.
[ ] Lokasi hanya terlihat untuk admin berwenang.
```

### Mobile

```txt
[ ] Tidak ada horizontal scroll.
[ ] Card analytics rapi di layar kecil.
[ ] Tombol cukup besar untuk disentuh.
[ ] Popup izin lokasi tidak menutup player secara mengganggu.
[ ] Dashboard analytics tetap bisa dibaca di smartphone.
```

### Akses

```txt
[ ] User biasa tidak melihat menu analytics.
[ ] User biasa tidak bisa membuka URL analytics langsung.
[ ] Admin bisa membuka analytics.
[ ] Firestore rules tidak membuka data analytics ke publik.
```

---

## 22. Rollback Plan

Jika setelah implementasi muncul masalah pada streaming, dashboard utama, atau modul lama, lakukan rollback.

Langkah rollback:

```bash
git checkout main
git branch backup/failed-listener-analytics-mvp feature/listener-analytics-mvp
git branch -D feature/listener-analytics-mvp
```

Jika sudah merge dan harus revert:

```bash
git log --oneline
git revert <commit_hash>
```

Developer wajib memastikan rollback tidak menghapus data lama.

---

## 23. Prioritas Implementasi

Urutan kerja yang disarankan:

### Tahap A — Fondasi Aman

```txt
1. Backup dan branch baru.
2. Buat types analytics.
3. Buat sessionId util.
4. Buat device parser sederhana.
5. Buat listenerAnalytics.service.ts.
6. Buat listenerLocation.service.ts.
```

### Tahap B — Integrasi Streaming Minimal

```txt
1. Tambahkan track play.
2. Tambahkan track pause.
3. Tambahkan track stop.
4. Tambahkan heartbeat 60 detik.
5. Tambahkan request lokasi background/opsional.
6. Pastikan semua try/catch.
```

### Tahap C — Dashboard Admin

```txt
1. Buat ListenerAnalyticsPage.
2. Tambahkan summary cards.
3. Tambahkan estimasi active listener.
4. Tambahkan device breakdown.
5. Tambahkan program performance.
6. Tambahkan lokasi summary.
7. Batasi akses admin.
```

### Tahap D — Testing dan Polish

```txt
1. Jalankan typecheck.
2. Jalankan test.
3. Jalankan build.
4. Jalankan e2e jika tersedia.
5. Uji manual streaming.
6. Uji manual lokasi.
7. Uji mobile.
8. Review UI agar tetap premium.
```

---

## 24. Larangan Tahap 1

Jangan lakukan ini pada tahap pertama:

1. Jangan langsung implementasi Cloud Functions.
2. Jangan langsung implementasi export PDF.
3. Jangan langsung implementasi geolocation reverse lengkap sampai alamat detail.
4. Jangan membuat tracking lokasi berkala seperti aplikasi navigasi.
5. Jangan membuat dashboard terlalu kompleks.
6. Jangan menambahkan library berat tanpa alasan jelas.
7. Jangan mengubah struktur navigasi besar-besaran.
8. Jangan menyebut data sebagai pendengar streaming sebenarnya.
9. Jangan menyimpan data pribadi yang tidak dibutuhkan.
10. Jangan mengubah fitur yang sudah stabil hanya untuk analytics.

---

## 25. Output yang Diharapkan

Setelah implementasi MVP selesai, hasil yang diharapkan:

1. Module analytics berjalan sebagai add-on aman.
2. Tidak ada regresi pada fitur lama.
3. Streaming tetap stabil.
4. UI premium tetap terjaga.
5. Dashboard analytics hanya bisa diakses admin.
6. Estimasi listener aktif tampil.
7. Data play, pause, stop, heartbeat tercatat.
8. Lokasi GPS presisi tercatat jika user memberi izin.
9. Latitude, longitude, dan accuracy tersimpan dengan benar.
10. User tetap bisa mendengarkan radio tanpa izin lokasi.
11. Build production berhasil.
12. Dokumentasi teknis tersedia.

---

## 26. Catatan Pengembangan Tahap Berikutnya

Setelah MVP stabil selama 2-4 minggu, evaluasi kemungkinan tahap lanjutan:

1. Integrasi data server streaming asli.
2. Agregasi harian otomatis.
3. Cloud Functions untuk summary dan cleanup.
4. Export CSV.
5. Export PDF.
6. Peta sebaran pendengar lebih rapi.
7. Analisis performa program mingguan.
8. Laporan sponsor/donor.
9. Perbandingan jam siaran.
10. Rekomendasi waktu siaran terbaik.

Tahap lanjutan hanya boleh dilakukan setelah MVP terbukti tidak mengganggu aplikasi utama.

---

## 27. Ringkasan Eksekusi Developer

Gunakan instruksi ringkas ini saat mulai coding:

```txt
Tambahkan Listener Analytics MVP sebagai module baru terpisah.
Jangan ubah UI premium dan alur lama.
Tracking hanya add-on fail-safe.
Gunakan collection baru listenerAnalyticsSessions.
Catat play, pause, stop, heartbeat, error.
Tambahkan GPS/lokasi presisi opsional dengan izin eksplisit.
Simpan latitude, longitude, accuracy jika permission granted.
Jangan jadikan lokasi syarat streaming.
Dashboard hanya admin.
Label angka sebagai estimasi dari aplikasi.
Wajib backup, branch baru, typecheck, test, build, dan uji manual sebelum merge.
```

---

## 28. Final Acceptance Criteria

Fitur dianggap selesai jika semua poin berikut terpenuhi:

```txt
[ ] Ada branch feature/listener-analytics-mvp.
[ ] Ada commit backup sebelum perubahan.
[ ] Ada service analytics terpisah.
[ ] Ada service lokasi terpisah.
[ ] Collection baru digunakan.
[ ] Tidak ada schema lama yang berubah.
[ ] Streaming tetap normal.
[ ] Mini player tetap normal.
[ ] Dashboard utama tetap normal.
[ ] Modul lama tetap normal.
[ ] Admin bisa melihat analytics.
[ ] User biasa tidak bisa melihat analytics.
[ ] Session analytics tercatat saat play.
[ ] Heartbeat berjalan 60 detik.
[ ] Stop/pause tercatat.
[ ] GPS permission muncul dengan jelas.
[ ] Latitude/longitude tersimpan jika user mengizinkan.
[ ] Streaming tetap jalan jika lokasi ditolak.
[ ] Build production berhasil.
[ ] Tidak ada console error fatal.
[ ] UI analytics tetap premium dan mobile-friendly.
```

---

# Penutup

Fitur Listener Analytics MVP ini memungkinkan Radio SBL membaca perilaku pendengar dari aplikasi tanpa membongkar sistem yang sudah berjalan. Karena fitur ini juga menyertakan GPS/lokasi presisi dan latitude/longitude, implementasinya harus hati-hati, transparan, opsional, dan dibatasi aksesnya.

Prinsip terpenting:

> Analytics boleh gagal, tetapi streaming dan aplikasi utama tidak boleh ikut gagal.

