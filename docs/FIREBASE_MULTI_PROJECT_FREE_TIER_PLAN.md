# Rencana Multi Firebase Free Tier

Dokumen ini menyimpan rencana lanjutan agar Radio SBL tetap memakai paket gratis/Spark, tetapi beban Firestore tidak menumpuk di satu project.

## Tujuan

- Mempertahankan Firebase utama `radiosbl` untuk aplikasi inti.
- Memisahkan fitur yang boros read/write ke Firebase project lain.
- Mengaktifkan kembali fitur otomatis secara bertahap tanpa membuat kuota aplikasi utama limit.
- Tetap memakai paket gratis selama memungkinkan.

## Pembagian Project yang Disarankan

### 1. Firebase Utama: `radiosbl`

Tetap dipakai untuk aplikasi utama:

- Authentication.
- Data user dan role.
- Absensi.
- Jadwal siaran.
- Profil penyiar.
- Konten aplikasi utama.
- Data administrasi yang tidak terlalu sering berubah.

Target: project ini harus tetap ringan dan stabil untuk login/operasional utama.

### 2. Firebase Kedua: Request Lagu dan Studio Gateway

Disarankan untuk fitur yang sering polling atau sering berubah:

- `radiobossStatus`
- `radiobossNowPlaying`
- `radiobossGatewayHeartbeat`
- `radiobossCommands`
- `songRequests`
- `radiobossAuditLogs` khusus gateway/request

Manfaat:

- Request lagu dan command queue tidak menghabiskan kuota Firestore utama.
- Gateway bisa aktif dengan interval lebih nyaman tanpa mengganggu app utama.
- Jika request lagu ramai, dampaknya terisolasi di project kedua.

Catatan implementasi:

- `studio-gateway` menulis/membaca Firebase kedua.
- Aplikasi Radio SBL membaca status RadioBOSS/request lagu dari Firebase kedua.
- Frontend perlu konfigurasi Firebase kedua, misalnya:

```env
VITE_GATEWAY_FIREBASE_API_KEY=
VITE_GATEWAY_FIREBASE_AUTH_DOMAIN=
VITE_GATEWAY_FIREBASE_PROJECT_ID=
VITE_GATEWAY_FIREBASE_STORAGE_BUCKET=
VITE_GATEWAY_FIREBASE_APP_ID=
VITE_GATEWAY_FIREBASE_MESSAGING_SENDER_ID=
```

Gateway perlu konfigurasi service account kedua:

```env
FIREBASE_PROJECT_ID=nama-project-kedua
GOOGLE_APPLICATION_CREDENTIALS=./service-account-gateway.json
```

### 3. Firebase Ketiga: Recording

Opsional jika fitur recording perlu diaktifkan penuh:

- `programRecordings`
- `programRecordingRules`
- `recording audit logs`
- status start/stop rekaman
- metadata file recording

Manfaat:

- Auto recording dan riwayat rekaman tidak mengganggu kuota utama maupun request lagu.
- Jika recording sering update status, dampaknya terisolasi.

Catatan:

- File audio rekaman sebaiknya tetap di disk lokal/Google Drive, bukan Firebase Storage Spark, agar storage/bandwidth tidak cepat habis.
- Firestore ketiga cukup menyimpan metadata, status, dan path file.

## Strategi Bertahap

### Tahap 0: Mode Hemat Darurat

Saat kuota utama limit, gunakan `.env` gateway hemat:

```env
POLL_INTERVAL_SECONDS=60
FIRESTORE_OP_TIMEOUT_MS=30000
FIRESTORE_QUOTA_COOLDOWN_SECONDS=900
NOW_PLAYING_MIN_WRITE_SECONDS=60
STATUS_MIN_WRITE_SECONDS=120
HEARTBEAT_INTERVAL_SECONDS=120

COMMAND_WORKER_ENABLED=false
AUTO_RECORDING_ENABLED=false
SONG_REQUEST_WORKER_ENABLED=false
SONG_REQUEST_AUTO_FORWARD_TO_RADIOBOSS=false
WHATSAPP_REQUEST_WORKER_ENABLED=false
```

### Tahap 1: Firebase Kedua untuk Gateway dan Request Lagu

Prioritas pertama saat siap lanjut:

1. Buat Firebase project kedua khusus gateway/request.
2. Buat Web App dan Service Account untuk project kedua.
3. Tambahkan konfigurasi Firebase kedua di frontend Radio SBL.
4. Ubah service RadioBoss/request agar bisa membaca dari Firestore kedua.
5. Ubah `studio-gateway` agar memakai project kedua.
6. Aktifkan kembali:

```env
COMMAND_WORKER_ENABLED=true
SONG_REQUEST_WORKER_ENABLED=true
SONG_REQUEST_AUTO_FORWARD_TO_RADIOBOSS=false
```

Auto-forward tetap sebaiknya `false` dulu sampai usage stabil.

### Tahap 2: Aktifkan Request Lagu Otomatis Secara Terukur

Jika usage Firebase kedua aman:

```env
SONG_REQUEST_AUTO_FORWARD_TO_RADIOBOSS=true
SONG_REQUEST_WORKER_INTERVAL_SECONDS=300
COMMAND_POLL_INTERVAL_SECONDS=120
```

Pantau 1-2 hari sebelum memperpendek interval.

### Tahap 3: Firebase Ketiga untuk Recording

Jika auto recording ingin aktif penuh:

1. Buat Firebase project ketiga khusus recording.
2. Pindahkan `programRecordings` dan `programRecordingRules`.
3. Tambahkan konfigurasi Firebase recording di gateway dan frontend admin.
4. Aktifkan:

```env
AUTO_RECORDING_ENABLED=true
AUTO_RECORDING_INTERVAL_SECONDS=300
```

Turunkan interval hanya jika kuota aman.

## Aturan Free Tier

- Jangan menyimpan heartbeat/listener analytics terlalu rapat.
- Hindari query tanpa `limit`.
- Hindari listener real-time untuk koleksi besar.
- Gunakan polling lambat untuk fitur yang tidak perlu real-time.
- Audit log harus di-throttle atau dibatasi.
- Pisahkan fitur boros ke project berbeda.
- Hapus/arsipkan data lama secara berkala.

## Status Saat Dokumen Ini Dibuat

- App utama sudah dimitigasi:
  - listener analytics default mati.
  - heartbeat analytics diperlambat.
  - query analytics dan absensi dibatasi.
- `studio-gateway` sudah dipush dengan default lebih hemat.
- PC Studio perlu memakai `.env` hemat sampai project kedua siap.

## Catatan Lanjutan

Saat siap dilanjutkan, mulai dari **Tahap 1: Firebase Kedua untuk Gateway dan Request Lagu**.

Tujuan akhirnya:

- Firebase utama: aplikasi inti.
- Firebase kedua: request lagu dan gateway.
- Firebase ketiga: recording, jika diperlukan.

Dengan pembagian ini, risiko limit kuota bisa dipisah per fitur dan peluang tetap gratis jauh lebih besar.
