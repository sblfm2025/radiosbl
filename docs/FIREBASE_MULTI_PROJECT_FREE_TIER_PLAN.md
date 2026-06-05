# Rencana Multi Firebase Free Tier

Dokumen ini menyimpan rencana lanjutan agar Radio SBL tetap memakai paket gratis/Spark, tetapi beban Firestore tidak menumpuk di satu project.

## Tujuan

- Mempertahankan Firebase utama `radiosbl` untuk aplikasi inti.
- Memisahkan fitur yang boros read/write ke Firebase project lain.
- Mengaktifkan kembali fitur otomatis secara bertahap tanpa membuat kuota aplikasi utama limit.
- Tetap memakai paket gratis selama memungkinkan.

## Pembagian Project yang Disarankan

## Project yang Sudah Disiapkan

### Project Request RadioBoss

Project ini dipakai untuk request lagu, command RadioBoss, status gateway, dan data gateway yang sering berubah.

```env
VITE_GATEWAY_FIREBASE_API_KEY=AIzaSyCY7-rKolzbkV-fCdFvTyDSLbOuhnUvD38
VITE_GATEWAY_FIREBASE_AUTH_DOMAIN=overlaysbl.firebaseapp.com
VITE_GATEWAY_FIREBASE_PROJECT_ID=overlaysbl
VITE_GATEWAY_FIREBASE_STORAGE_BUCKET=overlaysbl.firebasestorage.app
VITE_GATEWAY_FIREBASE_APP_ID=1:319351353032:web:69bdd648c3c187d706fffd
VITE_GATEWAY_FIREBASE_MESSAGING_SENDER_ID=319351353032
```

Untuk `studio-gateway`, project ini membutuhkan service account sendiri:

```env
FIREBASE_PROJECT_ID=overlaysbl
GOOGLE_APPLICATION_CREDENTIALS=./service-account-gateway-request.json
```

### Project Rekam Siaran RadioBoss

Project ini dipakai jika fitur auto recording dan riwayat rekaman ingin dipisahkan total dari request lagu.

```env
VITE_RECORDING_FIREBASE_API_KEY=AIzaSyAlLrzVLZyVRjdi3HGbwsEyvgUAOY4qRfY
VITE_RECORDING_FIREBASE_AUTH_DOMAIN=radio-sbl-overlay.firebaseapp.com
VITE_RECORDING_FIREBASE_PROJECT_ID=radio-sbl-overlay
VITE_RECORDING_FIREBASE_STORAGE_BUCKET=radio-sbl-overlay.firebasestorage.app
VITE_RECORDING_FIREBASE_APP_ID=1:1012850098092:web:1ee49e340bec2720228409
VITE_RECORDING_FIREBASE_MESSAGING_SENDER_ID=1012850098092
```

Untuk `studio-gateway`, project ini membutuhkan service account sendiri:

```env
RECORDING_FIREBASE_PROJECT_ID=radio-sbl-overlay
RECORDING_GOOGLE_APPLICATION_CREDENTIALS=./service-account-recording.json
```

Catatan: konfigurasi Firebase Web di atas memang akan dipakai frontend dan bukan pengganti service account. Gateway yang berjalan di PC Studio tetap perlu file service account untuk menulis server-side.

## Security Rules Project Terpisah

Karena project `overlaysbl` dan `radio-sbl-overlay` adalah Firebase project berbeda, sesi login/Auth dari project utama `radiosbl` tidak otomatis berlaku di project tersebut. Untuk itu rules project terpisah dibuat khusus per fungsi, bukan memakai role `users` dari project utama.

File rules yang dipakai:

- `firestore.gateway.rules` untuk project `overlaysbl`.
- `firestore.recording.rules` untuk project `radio-sbl-overlay`.
- `firebase.gateway.json` untuk deploy rules gateway/request.
- `firebase.recording.json` untuk deploy rules recording.

Deploy rules:

```bash
firebase deploy --config firebase.gateway.json --only firestore:rules --project overlaysbl --non-interactive
firebase deploy --config firebase.recording.json --only firestore:rules --project radio-sbl-overlay --non-interactive
```

Status deploy terakhir:

- `overlaysbl`: ruleset `projects/overlaysbl/rulesets/496fa02d-1a73-4ffe-bb43-112fb394a81b`.
- `radio-sbl-overlay`: ruleset `projects/radio-sbl-overlay/rulesets/4f9d45e3-afcc-4607-983e-7191169d6523`.

Catatan keamanan:

- Rules secondary sengaja hanya membuka koleksi yang diperlukan fitur RadioBOSS.
- Penulisan gateway/server tetap lewat Firebase Admin SDK sehingga bypass rules.
- Frontend dapat membaca status/request/recording dari project terpisah tanpa perlu Auth project kedua.
- Rules ini praktis untuk free tier dan pemisahan kuota, tetapi bukan pengganti sistem Auth lintas project. Jika nanti ingin lebih ketat, opsi lanjutannya adalah custom token Auth di project kedua/ketiga atau proxy server.

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
- App utama sudah diarahkan membaca/menulis fitur RadioBOSS ke Firebase terpisah:
  - request/status/command/song request ke `overlaysbl`.
  - recording/rules ke `radio-sbl-overlay`.
- `studio-gateway` sudah mendukung Firebase recording terpisah.
- Security rules untuk `overlaysbl` dan `radio-sbl-overlay` sudah disiapkan dan dideploy.
- PC Studio perlu `git pull`, `npm install` jika dependency berubah, `npm run build`, dan update `.env` dengan service account project terpisah.

## Catatan Lanjutan

Saat siap dilanjutkan, mulai dari **Tahap 1: Firebase Kedua untuk Gateway dan Request Lagu**.

Tujuan akhirnya:

- Firebase utama: aplikasi inti.
- Firebase kedua: request lagu dan gateway.
- Firebase ketiga: recording, jika diperlukan.

Dengan pembagian ini, risiko limit kuota bisa dipisah per fitur dan peluang tetap gratis jauh lebih besar.
