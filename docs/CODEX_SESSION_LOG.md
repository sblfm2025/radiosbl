# Codex Session Log

Tanggal kerja: 15 Mei 2026.

## Tujuan Utama

Membangun aplikasi PWA modern untuk LPPL Radio Suara Bumi Lasinrang sesuai
`docs/CODEX_MASTER_PROMPT.md`, lalu menyesuaikan isi aplikasi berdasarkan
lampiran jadwal siaran 2026, SK pengangkatan penyiar, dan link streaming resmi.

## Hasil Implementasi

- Scaffold React + Vite + TypeScript.
- UI premium mobile-first dengan identitas Radio SBL.
- Halaman:
  - Login
  - Dashboard
  - Penyiar
  - Absensi
  - Jadwal
  - Streaming
  - Live OB
  - Pengaduan
  - Profil
- PWA:
  - `public/manifest.webmanifest`
  - `public/sw.js`
  - register service worker
  - offline app shell
  - indikator Online/Offline
- Service layer awal:
  - Firebase Auth
  - Firestore
  - Google Drive placeholder
  - Attendance
  - Schedule
  - Live OB
  - YouTube
  - Discord
  - Gemini placeholder
- Firestore scaffold:
  - `firebase.json`
  - `firestore.rules`
  - `firestore.indexes.json`
  - seed export `tmp/firestore-seed.json`

## Data Resmi Dari Lampiran

### Identitas Radio

- Nama: Radio Suara Bumi Lasinrang.
- Legal: Lembaga Penyiaran Publik Lokal Radio Suara Bumi Lasinrang.
- Frekuensi: SBL 92,4 FM.
- Alamat: Jl. Bintang No. 1 Kabupaten Pinrang.
- Kode pos: 91212.
- Kontak: +62 851-2256-1992.
- Sosial media: Radio Suara Bumi Lasinrang.
- Website: `sbl.pinrangkab.go.id`.
- Halaman stream publik: `sbl.pinrangkab.go.id/radio-stream`.
- Stream langsung: `https://pu.klikhost.com/proxy/sbl/stream`.

### Direktur Utama

- Nama: Fajar Bakri.
- Jabatan: Direktur Utama.
- Nomor SK: `482/001/SBL/I/2026`.
- Tanggal SK: 02 Januari 2026.
- Tentang: Pengangkatan Penyiar Lembaga Penyiaran Publik Lokal Radio Suara Bumi Lasinrang.

### Pemetaan Penyiar

| Nama Lengkap | Nama Udara | Catatan |
| --- | --- | --- |
| Akhmad Amiruddin | Amar | Dari SK dan jadwal |
| Sulaiman | Sul | Dari SK dan jadwal |
| Wiwik | Wiwik | Nama sama |
| Riska Dwiyanti | Riska | Nama depan di jadwal |
| St. Rukiah | Ria | Disatukan dengan nama udara Ria |
| Muhammad Chendra Burhan | Hendra | Setup RadioBoss/program sisipan |
| Salmiah | Miah | Menggantikan Fadli Arifin |

Catatan penting: Fadli Arifin tidak digunakan sebagai penyiar aktif. Data aplikasi
menggunakan Salmiah dengan nama udara Miah.

### Jadwal Siaran 2026

Data jadwal utama dimasukkan ke `src/data/radioData.ts`:

- 28 slot program utama per minggu.
- 4 slot utama per hari:
  - 08.00 - 10.00
  - 14.00 - 16.00
  - 16.00 - 18.00
  - 20.00 - 22.00
- 7 program sisipan/tanpa penyiar setiap hari:
  - Salam Subuh
  - Semangat Pagi
  - Lasinrang Preneur
  - Keluarga Berdaya (PKK)
  - Iklan Layanan Masyarakat, Konten Edukasi, Tips
  - Program Religi
  - Lagu-lagu Terbaik

## File Penting Yang Dibuat/Diubah

- `src/App.tsx`
- `src/data/radioData.ts`
- `src/data/mockRepository.ts`
- `src/data/firestoreSeed.ts`
- `src/components/AudioPlayer.tsx`
- `src/components/Shell.tsx`
- `src/hooks/useOnlineStatus.ts`
- `src/lib/registerServiceWorker.ts`
- `src/utils/announcerResolver.ts`
- `src/utils/scheduleClock.ts`
- `src/utils/geolocation.ts`
- `src/utils/fileValidation.ts`
- `src/utils/youtube.ts`
- `src/services/*.ts`
- `src/types/domain.ts`
- `public/sw.js`
- `public/manifest.webmanifest`
- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`
- `scripts/export-firestore-seed.mjs`
- `docs/SCHEDULE_2026_ANALYSIS.md`
- `docs/ANNOUNCER_DECREE_2026_ANALYSIS.md`
- `docs/LINK_STREAM.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/DEPLOYMENT_GUIDE.md`

## Command Verifikasi

Seluruh command berikut sudah pernah dijalankan dan hijau:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run seed:export
```

Hasil test terakhir:

- 9 test files passed.
- 32 tests passed.

Hasil seed export terakhir:

```json
{
  "announcers": 7,
  "broadcastPrograms": 19,
  "broadcastSchedules": 28,
  "streamingSettings": 1,
  "appSettings": 1
}
```

## Status Dev Server

Dev server pernah diverifikasi merespons:

```txt
http://localhost:5173/
```

## Catatan Lanjutan

Prioritas berikutnya yang masuk akal:

- Tambahkan validasi visual browser/PWA setelah deploy.

## Update 15 Mei 2026 - Import Seed Firestore

- Menambahkan `scripts/import-firestore-seed.mjs`.
- Menambahkan npm script:
  - `npm run seed:import` untuk dry-run.
  - `npm run seed:import:write` untuk menulis ke Firestore.
- Import memakai file `tmp/firestore-seed.json`, ID dokumen deterministik, dan
  mode merge.
- Dokumentasi `docs/DATABASE_SCHEMA.md` dan `docs/FIREBASE_SETUP.md` diperbarui
  dengan alur export, dry-run, dan write.
- Verifikasi terbaru hijau:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test` menghasilkan 9 test files passed dan 32 tests passed.
  - `npm run build`
  - `npm run seed:export`
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.

## Update 15 Mei 2026 - Flow Selfie Absensi dan Google Drive Draft

- Memperluas `src/services/googleDrive.service.ts` dengan metadata draft Google
  Drive deterministik untuk mode demo/offline.
- Menambahkan helper `uploadAttendanceSelfie(file, ownerId)`.
- Memperluas `src/services/attendance.service.ts` dengan:
  - fallback check-in demo tanpa Firestore saat Firebase env belum aktif.
  - `checkInWithSelfie(input)` untuk validasi selfie, upload/draft Drive, lalu
    pembuatan record absensi.
  - fallback `listAttendanceRecords()` kosong saat env belum aktif.
- Test absensi diperluas untuk metadata Drive demo, check-in dengan selfie, dan
  fallback Firestore.
- Dokumentasi service absensi/Drive ditambahkan ke `docs/DATABASE_SCHEMA.md`.
- Verifikasi terbaru hijau:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test` menghasilkan 11 test files passed dan 40 tests passed.
  - `npm run build`
  - `npm run seed:export`
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.

## Update 15 Mei 2026 - UI Absensi Terhubung ke Service Selfie

- Halaman Absensi di `src/App.tsx` sekarang memakai `checkInWithSelfie()`.
- Tombol check-in menjalankan validasi selfie, metadata Google Drive demo/nyata,
  dan pembuatan record absensi melalui service.
- Panel absensi menampilkan ID record dan ID Drive selfie yang dihasilkan.
- Payload preview kini memakai hasil service, bukan string demo manual.
- Verifikasi terbaru hijau:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test` menghasilkan 11 test files passed dan 40 tests passed.
  - `npm run build`
  - `npm run seed:export`
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.

## Update 15 Mei 2026 - Validasi Runtime Lokal dan PWA Asset

- Dev server lokal diverifikasi di `http://localhost:5173/`.
- Endpoint/aset berikut merespons HTTP 200:
  - `/`
  - `/manifest.webmanifest`
  - `/sw.js`
  - `/LogoSBL.svg`
  - `/coverSBL.jpg`
- Service worker tetap mengecualikan stream langsung
  `https://pu.klikhost.com/proxy/sbl/stream` dari cache.

## Update 15 Mei 2026 - Konfigurasi Firebase Project

- Membuat `.env.local` lokal dari konfigurasi Firebase project `radiosbl`.
- `.env.local` tetap aman dari commit karena sudah tercantum di `.gitignore`.
- Menambahkan `VITE_FIREBASE_STORAGE_BUCKET` ke:
  - `.env.example`
  - `src/lib/env.ts`
  - `src/lib/firebase.ts`
  - `scripts/import-firestore-seed.mjs`
  - `docs/FIREBASE_SETUP.md`
- Menambahkan loader `.env.local` sederhana pada `scripts/import-firestore-seed.mjs`
  agar `npm run seed:import:write` dapat membaca konfigurasi Firebase dari file
  lokal.
- Menambahkan `shouldUseLocalFallback()` agar test tetap memakai data lokal dan
  tidak menyentuh Firestore nyata walaupun `.env.local` aktif.
- Verifikasi terbaru hijau:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test` menghasilkan 11 test files passed dan 40 tests passed.
  - `npm run build`
  - `npm run seed:export`
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.
- `npm run seed:import:write` belum dijalankan karena command itu akan menulis
  data ke Firestore project nyata.

## Update 15 Mei 2026 - Login Dengan Google

- Menambahkan Google Auth Provider di `src/services/firebaseAuth.service.ts`.
- Menambahkan `signInWithGoogle()` di `src/services/auth.service.ts`.
- Login Google tetap membaca profil `users/{uid}` dari Firestore setelah
  autentikasi berhasil.
- Halaman Login di `src/App.tsx` sekarang memiliki tombol `Masuk dengan Google`.
- Styling tombol Google ditambahkan di `src/styles/app.css`.
- Dokumentasi `docs/FIREBASE_SETUP.md` diperbarui: provider Email/Password dan
  Google perlu diaktifkan di Firebase Auth.
- Verifikasi terbaru hijau:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test` menghasilkan 11 test files passed dan 40 tests passed.
  - `npm run build`
  - `npm run seed:export`
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.

## Update 15 Mei 2026 - Konfigurasi Gemini API Key

- Menambahkan Gemini API key ke `.env.local` sebagai env lokal non-public:
  - `GEMINI_API_KEY`
  - `GEMINI_API_KEYS`
- Menambahkan `VITE_GEMINI_PROXY_ENDPOINT` sebagai URL frontend menuju
  backend/proxy Gemini.
- Menambahkan placeholder env Gemini ke `.env.example`.
- Memperbarui `src/services/gemini.service.ts` agar memanggil proxy endpoint,
  bukan langsung membawa API key ke frontend.
- Dokumentasi `docs/FIREBASE_SETUP.md` diperbarui dengan catatan bahwa Gemini
  API key tidak boleh memakai prefix `VITE_`.
- Verifikasi terbaru hijau:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test` menghasilkan 11 test files passed dan 40 tests passed.
  - `npm run build`
  - `npm run seed:export`
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.

## Update 15 Mei 2026 - Service CRUD Jadwal dan Penyiar

- Menambahkan `src/services/announcer.service.ts`.
- Memperluas `src/services/schedule.service.ts` dengan:
  - fallback data resmi saat Firebase env belum aktif.
  - `saveProgram(program)`.
  - `saveSchedule(schedule)`.
  - request tukar jadwal demo yang tidak menyentuh Firestore.
- Menambahkan test `src/tests/crudServices.test.ts` untuk memastikan fallback
  resmi memuat 7 penyiar, 19 program, dan 28 jadwal.
- Dokumentasi service CRUD awal ditambahkan ke `docs/DATABASE_SCHEMA.md`.
- Verifikasi terbaru hijau:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test` menghasilkan 11 test files passed dan 37 tests passed.
  - `npm run build`
  - `npm run seed:export`
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.

## Update 15 Mei 2026 - Profil User Firebase

- Menambahkan `src/services/userProfile.service.ts` untuk membaca profil
  `users/{uid}` dari Firestore setelah Firebase Auth berhasil.
- Login Firebase sekarang memakai role, status aktif, nama, email, employee ID,
  dan foto dari collection `users` jika tersedia.
- Jika dokumen profil belum tersedia, sesi fallback tetap dibuat dari Firebase
  Auth dengan role `employee`.
- Menambahkan test `src/tests/userProfile.test.ts` untuk validasi role dan
  fallback profil.
- Dokumentasi schema `users` ditambahkan ke `docs/DATABASE_SCHEMA.md`.
- Firebase Auth/Profile di-load secara dinamis agar modul Firebase tidak dipanggil
  sebelum env aktif dan login Firebase benar-benar digunakan.
- Verifikasi terbaru hijau:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test` menghasilkan 10 test files passed dan 34 tests passed.
  - `npm run build`
  - `npm run seed:export`
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.
- Catatan: build masih menampilkan warning chunk utama lebih dari 500 kB.
  Firebase sudah terpecah ke chunk kecil, sehingga optimasi berikutnya bisa
  difokuskan ke pemecahan halaman/ikon UI.

## Update 15 Mei 2026 - Optimasi Build Chunk

- Menambahkan konfigurasi `manualChunks` di `vite.config.ts`.
- Chunk React, ikon Lucide, dan Firebase dipisahkan dari entry aplikasi utama.
- Hasil build terbaru tidak lagi menampilkan warning chunk lebih dari 500 kB.
- Entry utama turun menjadi sekitar 36,64 kB, sementara vendor dipisah menjadi:
  - `react-vendor` sekitar 192,35 kB.
  - `firebase-vendor` sekitar 317,41 kB.
  - `icons` sekitar 9,54 kB.
- Verifikasi terbaru hijau:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test` menghasilkan 10 test files passed dan 34 tests passed.
  - `npm run build`
  - `npm run seed:export`
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.

## Update 15 Mei 2026 - Integrasi Google Drive API Lokal

- Menambahkan script OAuth Google Drive:
  - `scripts/google-drive-auth.mjs`
  - `scripts/google-drive-upload-server.mjs`
  - `scripts/google-drive-lib.mjs`
- Menambahkan npm script:
  - `npm run drive:auth` untuk membuat refresh token OAuth lokal.
  - `npm run drive:server` untuk menjalankan endpoint upload lokal.
- `.env.local` lokal diisi dengan endpoint upload Drive dan path file
  `client_secret_*.json`; file ini tetap aman dari commit karena sudah masuk
  `.gitignore`.
- Redirect URI OAuth lokal disesuaikan ke `http://localhost:5173` karena URI
  tersebut sudah terdaftar di file OAuth client yang tersedia.
- `src/services/googleDrive.service.ts` sekarang benar-benar melakukan POST
  multipart ke `VITE_GOOGLE_DRIVE_UPLOAD_ENDPOINT` jika env tersedia, dan tetap
  fallback ke metadata demo jika endpoint kosong.
- Dokumentasi `docs/GOOGLE_DRIVE_SETUP.md`, `docs/DATABASE_SCHEMA.md`, dan
  `docs/DEPLOYMENT_GUIDE.md` diperbarui dengan alur OAuth dan endpoint upload.
- Verifikasi terbaru hijau:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test` menghasilkan 11 test files passed dan 41 tests passed.
  - `npm run build`
  - `npm run seed:export`
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.

## Update 15 Mei 2026 - Perapihan Firestore Rules

- `firestore.rules` dirapikan ulang agar selaras dengan role dan permission di
  aplikasi:
  - `super_admin`
  - `admin`
  - `leader`
  - `announcer`
  - `reporter`
  - `operator`
  - `employee`
  - `public`
- Menambahkan helper rules untuk user aktif, role, owner, announcer ownership,
  validasi field, dan pembatasan perubahan field tertentu.
- Rules koleksi utama diselaraskan:
  - `users`
  - `employees`
  - `announcers`
  - `attendanceRecords`
  - `broadcastPrograms`
  - `broadcastSchedules`
  - `scheduleSwapRequests`
  - `coverageAssignments`
  - `coverageReports`
  - `liveEvents`
  - `obChecklists`
  - `youtubeLives`
  - `discordRooms`
  - `streamingSettings`
  - `complaints`
  - `driveFiles`
  - `notifications`
  - `aiLogs`
  - `activityLogs`
  - `appSettings`
- Public tetap dapat membuat pengaduan, tetapi payload dibatasi dan status awal
  wajib `Baru`.
- Absensi hanya dapat dibuat oleh user pemilik record; update mandiri dibatasi
  untuk field checkout.
- Program, jadwal, dan penyiar hanya dapat dikelola oleh admin/super admin.
- Live OB dapat dikelola oleh admin, leader, dan operator.
- Validasi Firebase CLI dry-run berhasil:
  - `npx firebase-tools deploy --only firestore:rules --project radiosbl --dry-run`
  - Rules compile sukses dan tidak dideploy.
- Verifikasi aplikasi terbaru hijau:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test` menghasilkan 11 test files passed dan 41 tests passed.
  - `npm run build`
  - `npm run seed:export`
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.

## Update 15 Mei 2026 - Social Preview WA/FB/Sosmed

- Memastikan `coverSBL.jpg` tersedia sebagai asset publik di
  `public/coverSBL.jpg`, sehingga hasil build menyediakan
  `/coverSBL.jpg` langsung dari Firebase Hosting.
- Ukuran gambar diverifikasi 1200 x 675 piksel, cocok untuk Open Graph large
  image.
- `index.html` diperbarui dengan meta:
  - `og:type`
  - `og:locale`
  - `og:site_name`
  - `og:url`
  - `og:title`
  - `og:description`
  - `og:image`
  - `og:image:secure_url`
  - `og:image:type`
  - `og:image:width`
  - `og:image:height`
  - `og:image:alt`
  - `twitter:card`
  - `twitter:title`
  - `twitter:description`
  - `twitter:image`
  - `twitter:image:alt`
  - `canonical`
  - `image_src`
- URL gambar sosial diset absolut:
  `https://radiosbl.web.app/coverSBL.jpg`.
- `firebase.json` ditambah header untuk `/coverSBL.jpg` agar dapat diakses
  crawler sosial dengan cache publik dan CORS terbuka.
- Service worker cache dinaikkan ke `radio-sbl-shell-v2`.
- `docs/DEPLOYMENT_GUIDE.md` ditambah checklist dan langkah verifikasi social
  sharing.
- Build dan deploy hosting berhasil:
  - `npm run build`
  - `npx firebase-tools deploy --only hosting --project radiosbl`
- Verifikasi publik berhasil:
  - `https://radiosbl.web.app/?v=cover-20260515` merespons HTTP 200 dan memuat
    meta Open Graph/Twitter.
  - `https://radiosbl.web.app/coverSBL.jpg?v=cover-20260515` merespons HTTP 200,
    `Content-Type: image/jpeg`, `Cache-Control: public, max-age=86400`, dan
    `Access-Control-Allow-Origin: *`.
  - Gambar publik terunduh dengan ukuran 1200 x 675 piksel dan 162396 byte.

## Update 15 Mei 2026 - Audit Responsif Mobile

- Melakukan audit layout mobile untuk penggunaan utama di HP.
- Merapikan `src/styles/app.css`:
  - Menambahkan proteksi global terhadap horizontal overflow.
  - Menambahkan `overflow-wrap` untuk teks panjang, URL, status, dan label.
  - Membuat card/list/form menjadi center dan stack rapi pada viewport kecil.
  - Merapikan `page-header`, hero, panel, metric card, info stack, file row,
    complaint row, profile card, dan bottom navigation untuk HP.
  - Mengubah jadwal mingguan di HP dari horizontal scroll menjadi card vertikal
    satu kolom agar lebih mudah dibaca.
  - Merapikan kartu penyiar, roster, director band, live OB, streaming, dan
    absensi agar teks dan tombol berada di tengah pada HP.
  - Menjaga bottom nav tetap stabil dengan label ellipsis jika layar sangat
    kecil.
- Memperbaiki `src/components/Waveform.tsx` dan CSS waveform karena tinggi bar
  sebelumnya memakai ekspresi CSS modulo yang tidak valid di browser.
- Audit headless Chrome viewport 390 x 844 berhasil untuk:
  - Login
  - Dashboard
  - Absensi
  - Jadwal
  - Streaming
  - Profil
- Hasil audit mobile:
  - `scrollWidth` sama dengan viewport 390 px.
  - Tidak ditemukan elemen keluar kanan/kiri layar pada halaman yang diuji.
- Verifikasi terbaru hijau:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test` menghasilkan 11 test files passed dan 41 tests passed.
  - `npm run build`
- Deploy hosting berhasil:
  - `npx firebase-tools deploy --only hosting --project radiosbl`

## Update 15 Mei 2026 - Foto Profil Penyiar

- Menambahkan `photoUrl` pada data profil penyiar resmi di
  `src/data/radioData.ts`.
- Pemetaan foto dari `public/crew`:
  - Amar: `/crew/AMAR%20(6).png`
  - Sul: `/crew/SUL%20(5).png`
  - Wiwik: `/crew/WIWIK%20(2).png`
  - Riska: `/crew/RISKA%20(2).png`
  - Ria: `/crew/RIA%20(4).png`
  - Hendra: `/crew/PROF%20(1).png`
  - Miah: `/crew/Miah.png`
- `src/App.tsx` diperbarui agar halaman Penyiar dan roster profil jadwal
  menampilkan foto, nama udara, nama lengkap, dan urutan SK.
- `src/styles/app.css` diperbarui untuk crop/contain foto penyiar yang rapi di
  desktop dan HP.
- `src/types/domain.ts`, `src/data/firestoreSeed.ts`, `firestore.rules`, dan
  `docs/DATABASE_SCHEMA.md` diperbarui agar field `photoUrl` ikut schema seed
  dan rules.

## Update 15 Mei 2026 - Pemulihan Sesi Setelah Terputus

- Membaca ulang `docs/CODEX_SESSION_LOG.md` untuk menyambung konteks kerja.
- Dikonfirmasi bahwa folder kerja `D:\RADIO-SBL` berisi project langsung, tetapi
  tidak memiliki folder `.git`, sehingga `git status` tidak tersedia.
- Memperbaiki lint di `src/App.tsx`:
  - Menghapus prop `data` yang tidak lagi dipakai pada `DashboardPage`.
  - Membungkus `handleLogout` dengan `useCallback`.
- Memperbaiki test metadata radio di `src/tests/radioMetadata.test.ts` dengan
  memory `localStorage` agar test tetap jalan di environment Node.
- Verifikasi terbaru:
  - `npm run lint` berhasil dengan 0 error dan 1 warning Fast Refresh lama di
    `src/contexts/AudioContext.tsx`.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 12 test files passed dan 44 tests passed.
  - `npm run build` berhasil.
  - `npm run seed:export` berhasil.
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.

## Update 15 Mei 2026 - Otomatisasi Player, Absensi On-Air, dan Request Lagu

- Menambahkan hook refresh slot siaran setiap 30 detik agar program aktif tidak
  perlu menunggu reload aplikasi.
- Menambahkan metadata `displayName` dan `airName` pada draft absensi agar
  absensi bisa dipakai untuk menentukan penyiar yang benar-benar hadir.
- Menambahkan `src/services/onAir.service.ts`:
  - Menggabungkan jadwal siaran aktif dengan record absensi hari ini.
  - Nama penyiar hanya tampil jika penyiar terjadwal sudah check-in dan belum
    check-out.
  - Slot sisipan/off-air tidak menampilkan penyiar.
- Streaming page sekarang memakai penyiar hasil absensi, bukan hanya nama dari
  jadwal. Jika belum ada absensi valid, UI menampilkan status menunggu absensi.
- Menambahkan `src/services/songRequest.service.ts`:
  - Membuat request lagu lokal.
  - Menyimpan antrean request di `localStorage`.
  - Membuat teks notifikasi aplikasi.
  - Membuat deep-link WhatsApp untuk penyiar on-air; jika nomor WA penyiar belum
    tersedia, fallback ke nomor resmi Radio SBL.
- Menambahkan form request lagu pada halaman Streaming, dengan antrean request
  terbaru dan pembukaan WA otomatis melalui `wa.me`.
- Menambahkan tipe domain `SongRequest` dan dokumentasi schema `songRequests`.
- Test baru:
  - `src/tests/onAir.test.ts`
  - `src/tests/songRequest.test.ts`
- Verifikasi terbaru:
  - `npm run lint` berhasil dengan 0 error dan 1 warning Fast Refresh lama di
    `src/contexts/AudioContext.tsx`.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 14 test files passed dan 48 tests passed.
  - `npm run build` berhasil.
  - `npm run seed:export` berhasil.
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.
- Dev server lokal aktif dan merespons HTTP 200 di `http://localhost:5173/`.

## Update 15 Mei 2026 - Request Lagu Firestore dan Cleanup Audio Context

- Memecah hook audio global dari `src/contexts/AudioContext.tsx` ke:
  - `src/contexts/audioContextState.ts`
  - `src/contexts/useGlobalAudio.ts`
- Hasilnya warning Fast Refresh dari ESLint hilang dan `npm run lint` sekarang
  benar-benar 0 error/0 warning.
- Memperluas `src/services/songRequest.service.ts`:
  - `submitSongRequest(input)` menulis ke Firestore `songRequests` saat Firebase
    aktif.
  - Tetap memakai localStorage fallback saat mode test/demo/offline.
  - Payload Firestore dibersihkan dari field `undefined` agar aman untuk SDK.
  - `listSongRequests()` membaca Firestore saat Firebase aktif dan localStorage
    saat fallback.
- Halaman Streaming sekarang memuat antrean request melalui service hibrida
  Firestore/localStorage.
- Menambahkan rules Firestore untuk `songRequests`:
  - create awal untuk status `new` atau `notified`;
  - read untuk user internal yang login;
  - update status oleh super admin, admin, leader, announcer, atau operator;
  - delete oleh admin.
- Menambah test fallback `submitSongRequest()` di
  `src/tests/songRequest.test.ts`.
- Validasi Firestore rules dry-run berhasil:
  - `npx firebase-tools deploy --only firestore:rules --project radiosbl --dry-run`
  - Rules compile sukses dan tidak dideploy.
- Verifikasi terbaru:
  - `npm run lint` berhasil tanpa warning.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 14 test files passed dan 49 tests passed.
  - `npm run build` berhasil.
  - `npm run seed:export` berhasil.
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.
  - Dev server lokal tetap merespons HTTP 200 di `http://localhost:5173/`.

## Update 15 Mei 2026 - Perbaikan Playback Stream Radio

- Menganalisa laporan player tidak bisa memutar stream.
- Verifikasi jaringan:
  - `https://pu.klikhost.com/proxy/sbl/status-json.xsl` merespons HTTP 200.
  - `GET https://pu.klikhost.com/proxy/sbl/stream` mengirim
    `Content-Type: audio/mpeg` dan data audio.
  - `HEAD` ke stream mengembalikan protocol violation/HTTP 0.9 pada tool CLI,
    sehingga player tidak boleh bergantung pada HEAD/probing semacam itu.
- Memperbarui `src/contexts/AudioContext.tsx`:
  - Audio element sekarang dibuat melalui helper `buildAudio()`.
  - Saat play ditekan, player melakukan `load()` ulang dan mencoba retry dengan
    audio element baru jika percobaan pertama gagal.
  - Error playback kini lebih spesifik untuk network/decode/source unsupported.
  - Volume memakai `volumeRef` agar slider volume tidak membangun ulang stream.
- Verifikasi terbaru:
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 14 test files passed dan 49 tests passed.
  - `npm run build` berhasil.
  - Dev server lokal merespons HTTP 200 di `http://localhost:5173/`.

## Update 15 Mei 2026 - Live/OB Discord dan Rundown Event

- Memperluas `src/services/liveOb.service.ts` menjadi service hibrida:
  - `buildLiveEventDraft(input)`.
  - `createLiveEvent(payload)`.
  - `createLiveEventFromDraft(input)`.
  - `listLiveEvents()`.
  - `listLocalLiveEvents()`.
- Event Live/OB memakai Firestore `liveEvents` saat Firebase aktif dan fallback
  localStorage `radio-sbl-live-events` saat Firestore gagal/offline/demo.
- Halaman `LiveObPage` di `src/App.tsx` sekarang memiliki form event:
  - Judul event.
  - Lokasi.
  - Waktu mulai.
  - Link YouTube Live opsional.
  - Link Discord room opsional.
- Event yang dibuat tampil sebagai rundown event aktif dengan tombol buka Discord
  dan YouTube jika link tersedia.
- Menambahkan test `src/tests/liveOb.test.ts` untuk draft event dan fallback
  localStorage.
- Dokumentasi schema `liveEvents` diperbarui di `docs/DATABASE_SCHEMA.md`.
- Verifikasi terbaru:
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 17 test files passed dan 56 tests passed.
  - `npm run build` berhasil.
  - `npm run seed:export` berhasil.
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.
  - Dev server lokal merespons HTTP 200 di `http://localhost:5173/`.

## Update 15 Mei 2026 - Dokumen Handoff Lintas Akun

- Menambahkan `docs/HANDOFF.md` sebagai titik masuk cepat untuk melanjutkan
  pengembangan dari akun, perangkat, atau sesi Codex lain.
- Isi handoff mencakup:
  - cara melanjutkan project;
  - urutan dokumen yang harus dibaca;
  - command verifikasi;
  - status project terakhir;
  - fitur yang sudah ada;
  - file penting;
  - catatan teknis penting;
  - prioritas berikutnya;
  - kebiasaan wajib setiap sesi.
- Memperbarui `README.md` dengan bagian "Melanjutkan Dari Sesi/Akun Lain" yang
  menunjuk ke `docs/HANDOFF.md`, `docs/CODEX_SESSION_LOG.md`, dan
  `docs/DATABASE_SCHEMA.md`.
- Aturan kerja ke depan:
  - setiap perubahan signifikan dicatat di `docs/CODEX_SESSION_LOG.md`;
  - perubahan status besar project juga diringkas di `docs/HANDOFF.md`.

## Update 15 Mei 2026 - Fallback Permission dan Layout Streaming Mobile

- Menindaklanjuti analisa screenshot halaman Streaming:
  - Firestore permission error pada `songRequests`/profil.
  - Konten halaman Streaming tertutup bottom navigation.
  - Logo fallback SBL ter-crop di lingkaran album art.
- Memperbarui `src/services/songRequest.service.ts`:
  - `submitSongRequest()` sekarang fallback ke localStorage jika Firestore
    menolak/bermasalah.
  - `listSongRequests()` sekarang fallback ke localStorage jika read Firestore
    gagal, sehingga tidak lagi memunculkan unhandled promise error di UI.
- Memperbarui `src/services/userProfile.service.ts`:
  - Read profil Firestore yang gagal kini memakai profil fallback dari Firebase
    Auth agar sesi tetap bisa berjalan.
  - Upsert super admin yang gagal karena rules belum sinkron tidak memutus sesi.
- Merapikan halaman Streaming di `src/App.tsx`:
  - Area fixed sekarang memakai padding bawah lebih besar agar konten tidak
    tertutup bottom nav.
  - Konten utama memakai `justifyContent: flex-start` agar scroll lebih natural.
  - Request lagu dibuat collapsible supaya layar player tetap bersih.
  - Fallback logo SBL memakai `object-fit: contain`; album art lagu tetap
    `cover`.
- Verifikasi terbaru:
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 14 test files passed dan 49 tests passed.
  - `npm run build` berhasil.
  - `npm run seed:export` berhasil.
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.
  - Dev server lokal merespons HTTP 200 di `http://localhost:5173/`.

## Update 15 Mei 2026 - Responsif Desktop untuk Halaman Streaming

- Menindaklanjuti masalah halaman Streaming yang selalu terasa mobile di desktop.
- Mengganti wrapper inline fixed fullscreen pada `StreamingPage` menjadi class
  CSS `streaming-player-page`.
- Desktop:
  - Streaming sekarang tampil di area konten Shell.
  - Sidebar desktop tetap terlihat.
  - Halaman tidak lagi menutup seluruh app dengan `position: fixed`.
- Mobile/tablet kecil (`max-width: 980px`):
  - Streaming tetap fullscreen seperti digital music player.
  - Bottom padding tetap besar agar tidak tertutup bottom navigation.
- Verifikasi terbaru:
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 16 test files passed dan 54 tests passed.
  - `npm run build` berhasil.
  - Dev server lokal merespons HTTP 200 di `http://localhost:5173/`.

## Update 15 Mei 2026 - Editor Jadwal Fleksibel

- Menambahkan `src/services/scheduleSlot.service.ts` untuk override jadwal lokal:
  - `listCustomScheduleSlots()`.
  - `mergeScheduleSlots(officialSlots, customSlots?)`.
  - `saveCustomScheduleSlot(slot, sourceSlot?)`.
- Override disimpan di localStorage key `radio-sbl-custom-schedule-slots`.
- Slot override menyimpan `sourceDay/sourceTime` internal sehingga perubahan jam
  tetap menimpa slot jadwal resmi yang benar.
- Halaman `BroadcastSchedulePage` di `src/App.tsx` sekarang:
  - Memakai hasil merge jadwal resmi + override lokal.
  - Menyediakan tombol edit pada setiap slot.
  - Admin dapat mengubah jam, nama program, penyiar, dan deskripsi.
  - Setelah simpan, tampilan jadwal langsung diperbarui dan muncul success note.
- Menambahkan test `src/tests/scheduleSlot.test.ts` untuk memastikan override
  tetap bekerja walaupun jam slot diubah.
- Verifikasi terbaru:
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 16 test files passed dan 54 tests passed.
  - `npm run build` berhasil.
  - `npm run seed:export` berhasil.
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.
  - Dev server lokal merespons HTTP 200 di `http://localhost:5173/`.

## Update 15 Mei 2026 - Service Pengaduan dan Saran Publik

- Menambahkan `src/services/complaint.service.ts`:
  - `createComplaintDraft(input)`.
  - `submitComplaint(input)`.
  - `listComplaints()`.
  - `listLocalComplaints()`.
  - `updateComplaintStatus(complaint, status)`.
- Service pengaduan memakai Firestore `complaints` saat Firebase aktif dan
  fallback localStorage saat Firestore gagal/offline/demo.
- Halaman `ComplaintsPage` di `src/App.tsx` sekarang:
  - Form submit nyata untuk nama pelapor, kategori, dan isi pengaduan/saran.
  - Menampilkan antrean dari Firestore/fallback lokal.
  - Mendukung update status `Terverifikasi`, `Diproses`, dan `Selesai`.
  - Tetap memakai mock data resmi sebagai tampilan awal jika antrean belum ada.
- Menambahkan test `src/tests/complaint.test.ts` untuk draft, submit fallback,
  dan update status.
- Dokumentasi schema `complaints` diperbarui di `docs/DATABASE_SCHEMA.md`.
- Verifikasi terbaru:
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 15 test files passed dan 53 tests passed.
  - `npm run build` berhasil.
  - `npm run seed:export` berhasil.
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.
  - Dev server lokal merespons HTTP 200 di `http://localhost:5173/`.

## Update 15 Mei 2026 - Cache Absensi Lokal untuk On-Air Otomatis

- Memperkuat alur absensi-on-air agar tetap bekerja saat Firestore rules belum
  sinkron atau perangkat sedang offline.
- Memperbarui `src/services/attendance.service.ts`:
  - Menambahkan cache lokal `radio-sbl-attendance-records`.
  - `checkInWithSelfie()` sekarang menyimpan record absensi berhasil ke cache
    lokal setelah upload/draft selfie.
  - `listAttendanceRecords()` memakai cache lokal pada mode fallback dan juga
    fallback ke cache jika query Firestore gagal.
  - Menambahkan `listLocalAttendanceRecords()`.
- Memperbarui `AttendancePage` di `src/App.tsx`:
  - Setelah check-in berhasil, App langsung refresh attendance records.
  - Player/on-air tidak perlu menunggu interval 60 detik untuk membaca absensi
    lokal terbaru.
- Menambahkan test cache absensi lokal di `src/tests/attendance.test.ts`.
- Verifikasi terbaru:
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 14 test files passed dan 51 tests passed.
  - `npm run build` berhasil.
  - `npm run seed:export` berhasil.
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.
  - Dev server lokal merespons HTTP 200 di `http://localhost:5173/`.

## Update 15 Mei 2026 - Halaman Antrean Request Lagu

- Menambahkan page key dan navigasi `requests` di `src/data/radioData.ts`.
- Dashboard quick menu sekarang mengarah ke `Request Lagu`.
- Menambahkan halaman `SongRequestsPage` di `src/App.tsx`:
  - Memuat request lagu dari service hibrida Firestore/localStorage.
  - Auto-refresh antrean setiap 30 detik.
  - Mengelompokkan request menjadi masuk sekarang, siap diputar, dan riwayat.
  - Menyediakan aksi `Antrekan`, `Diputar`, `Tolak/Lewati`, dan link WhatsApp
    jika tersedia.
- Menambahkan `updateDocument()` di `src/services/firestore.service.ts`.
- Memperluas `src/services/songRequest.service.ts`:
  - `updateSongRequestStatus(request, status)`.
  - Update status memakai Firestore saat tersedia dan fallback localStorage saat
    Firestore gagal/offline.
- Menambahkan styling ringan untuk action request, empty state, dan success note
  di `src/styles/app.css`.
- Menambahkan test update status request lokal di
  `src/tests/songRequest.test.ts`.
- Verifikasi terbaru:
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 14 test files passed dan 50 tests passed.
  - `npm run build` berhasil.
  - `npm run seed:export` berhasil.
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.
  - Dev server lokal merespons HTTP 200 di `http://localhost:5173/`.

## Update 15 Mei 2026 - Deploy Firestore Rules Produksi

- Melanjutkan dari `docs/HANDOFF.md` dan membaca ulang
  `docs/CODEX_SESSION_LOG.md`.
- Verifikasi lokal terbaru hijau:
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 17 test files passed dan 56 tests passed.
  - `npm run build` berhasil.
  - `npm run seed:export` berhasil.
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.
- Validasi Firestore rules dry-run berhasil:
  - `npx firebase-tools deploy --only firestore:rules --project radiosbl --dry-run`
  - Rules compile sukses dan tidak dideploy pada langkah dry-run.
- Deploy rules produksi berhasil:
  - `npx firebase-tools deploy --only firestore:rules --project radiosbl`
  - Ruleset baru: `projects/radiosbl/rulesets/3736ee4a-96a3-4a0a-b691-5ed5f4502e5b`.
- `docs/HANDOFF.md` diperbarui agar prioritas berikutnya dimulai dari import
  seed Firestore nyata bila sudah siap menulis data produksi.

## Update 15 Mei 2026 - Import Seed Firestore Produksi

- Menjalankan `npm run seed:import:write`, tetapi gagal dengan
  `PERMISSION_DENIED` karena script Web SDK belum login sebagai user admin dan
  rules produksi sudah ketat.
- Menambahkan `scripts/import-firestore-seed-cli.mjs` sebagai jalur import
  produksi lewat Firestore REST API dan access token Firebase CLI lokal.
- Menambahkan npm script:
  - `npm run seed:import:write:cli`
- Import produksi berhasil:
  - `npm run seed:import:write:cli`
  - 56 dokumen seed tertulis ke project `radiosbl`.
- Verifikasi REST Firestore berhasil dan jumlah dokumen sesuai seed:
  - `announcers`: 7
  - `broadcastPrograms`: 19
  - `broadcastSchedules`: 28
  - `streamingSettings`: 1
  - `appSettings`: 1
- Dokumentasi `docs/HANDOFF.md`, `docs/DATABASE_SCHEMA.md`, dan
  `docs/FIREBASE_SETUP.md` diperbarui dengan alur import CLI REST.

## Update 15 Mei 2026 - Proxy Notifikasi, Realtime Firestore, dan Deploy

- Menambahkan `scripts/notification-proxy-server.mjs`:
  - `POST /whatsapp/send` untuk WhatsApp Cloud API.
  - `POST /gemini/draft` untuk Gemini.
  - Mode demo aktif jika secret WhatsApp/Gemini belum tersedia.
- Menambahkan npm script:
  - `npm run proxy:notifications`
- Menambahkan env dokumentasi:
  - `VITE_WHATSAPP_PROXY_ENDPOINT`
  - `NOTIFICATION_PROXY_PORT`
  - `NOTIFICATION_PROXY_ALLOWED_ORIGIN`
  - `WHATSAPP_CLOUD_API_TOKEN`
  - `WHATSAPP_PHONE_NUMBER_ID`
  - `WHATSAPP_GRAPH_API_VERSION`
  - `GEMINI_MODEL`
- Menambahkan `src/services/whatsappNotification.service.ts` untuk:
  - membuat fallback deep-link `wa.me`;
  - mengirim notifikasi ke proxy jika endpoint tersedia.
- `src/services/songRequest.service.ts` sekarang mencoba proxy WhatsApp saat
  submit request lagu dan hanya membuka deep-link manual jika proxy tidak
  mengonfirmasi pengiriman.
- Menambahkan realtime listener Firestore:
  - `subscribeDocuments()` di `src/services/firestore.service.ts`.
  - `subscribeSongRequests()`.
  - `subscribeComplaints()`.
  - `subscribeLiveEvents()`.
  - `subscribeAttendanceRecords()`.
- Halaman Request, Streaming, Pengaduan, Live/OB, dan status absensi/on-air
  memakai listener realtime dengan fallback lokal.
- Override jadwal dipindahkan ke Firestore collection `customScheduleSlots`
  melalui:
  - `mergeScheduleSlotsRemote()`.
  - `saveCustomScheduleSlotRemote()`.
  - fallback `localStorage` tetap tersedia.
- Firestore rules diperbarui untuk collection `customScheduleSlots`.
- Test baru:
  - `src/tests/whatsappNotification.test.ts`.
  - test remote-compatible fallback untuk schedule slot.
- Verifikasi terbaru:
  - `node --check scripts/notification-proxy-server.mjs` berhasil.
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 18 test files passed dan 60 tests passed.
  - `npm run build` berhasil.
  - `npm run seed:export` berhasil.
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.
  - Proxy lokal mode demo berhasil untuk `/whatsapp/send` dan `/gemini/draft`.
  - Firestore rules dry-run compile sukses.
- Deploy terbaru berhasil:
  - `npx firebase-tools deploy --only firestore:rules --project radiosbl`
    merilis ruleset `85fc062a-94a3-4296-84f1-6c5c88723b8f`.
  - `npx firebase-tools deploy --only hosting --project radiosbl`.
- Verifikasi publik:
  - `https://radiosbl.web.app/?v=auto-20260515` merespons HTTP 200.

## Update 15 Mei 2026 - Firebase Functions Scaffold dan E2E Smoke Test

- Menambahkan Firebase Functions scaffold untuk proxy produksi:
  - `functions/package.json`
  - `functions/index.js`
  - function HTTP `notificationProxy`
  - region `asia-southeast1`
  - route `/whatsapp/send`
  - route `/gemini/draft`
- Menambahkan konfigurasi `functions` ke `firebase.json`.
- Menambahkan npm script:
  - `npm run functions:lint`
  - `npm run functions:deploy`
- Menjalankan `npm install` di folder `functions`.
- `npm run functions:lint` berhasil.
- Deploy Functions dicoba:
  - `npx firebase-tools deploy --only functions:notificationProxy --project radiosbl --non-interactive`
  - Gagal karena project `radiosbl` masih Spark Plan dan Firebase CLI tidak
    dapat enable `cloudbuild.googleapis.com` tanpa upgrade Blaze.
  - Endpoint Functions produksi masih 404 sampai deploy berhasil.
- Menambahkan Playwright e2e:
  - `@playwright/test` sebagai dev dependency.
  - `playwright.config.ts`.
  - `src/e2e/login.smoke.spec.ts`.
- `npm run test:e2e` berhasil:
  - 2 tests passed untuk login desktop dan mobile.
  - Smoke test memastikan layar login render, tombol utama terlihat, dan tidak
    ada horizontal overflow.
- Vitest dikonfigurasi agar tidak mengambil file e2e dan nested
  `functions/node_modules`.
- Verifikasi terbaru:
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 18 test files passed dan 60 tests passed.
  - `npm run test:e2e` menghasilkan 2 tests passed.
  - `npm run build` berhasil.
  - `npm run seed:export` berhasil.
  - `npm run seed:import` berhasil dry-run dan tidak menulis data.
  - `npx firebase-tools deploy --only hosting --project radiosbl --non-interactive` berhasil.
  - `https://radiosbl.web.app/?v=final2-20260515` merespons HTTP 200.

## Update 15 Mei 2026 - Audit UI/UX Poin 7 dan E2E Interaksi Inti

- Melanjutkan instruksi handoff untuk fokus poin 7: UI/UX digital music
  platform super app yang bersih, modern, mobile-first, dan tombol/link
  berfungsi.
- `src/App.tsx`:
  - `PageHeader` diperbaiki agar memakai `eyebrow`, `title`, dan `description`
    serta tidak lagi melakukan klik DOM tersembunyi ke bottom nav.
  - Dashboard menu dirapikan menjadi 9 shortcut nyata:
    Absensi, Jadwal Siaran, Penyiar Resmi, Info Liputan, Live/OB, Streaming,
    Saran & Aduan, Request Lagu, dan Profil.
  - Tombol bell dashboard kini membuka halaman Request Lagu.
  - Teks greeting yang rusak encoding dibersihkan.
  - Request tukar jadwal mengganti `alert()` dengan `scheduleNotice` inline.
  - Streaming page:
    - tombol kembali menuju dashboard;
    - tombol status kanan membuka request lagu;
    - kontrol skip 15 detik palsu diganti badge live/online;
    - tombol play/pause diberi `aria-label`;
    - action bawah menjadi link Website, link WhatsApp, dan tombol Bagikan
      memakai Web Share API/clipboard fallback.
- `src/components/CoveragePage.tsx`:
  - Upload Google Drive tidak lagi memakai `alert()`;
  - hasil sukses/gagal tampil sebagai `success-note`/`form-error`;
  - tombol Penugasan Baru memberi feedback inline untuk status demo.
- `src/styles/app.css`:
  - header halaman compact untuk layar app internal;
  - row action streaming responsif;
  - letter spacing heading/eyebrow dibuat 0.
- `src/e2e/login.smoke.spec.ts`:
  - menambah smoke test interaksi inti setelah login demo;
  - mengecek navigasi Request, Streaming, link Website/WhatsApp, tombol kembali,
    halaman Liputan, tombol Penugasan Baru, dan horizontal overflow.
- `playwright.config.ts`:
  - Vite e2e berjalan dengan `--mode test`.
- `src/lib/env.ts`:
  - `hasFirebaseConfig()` mengembalikan false saat `MODE === "test"` agar e2e
    tidak memakai Firebase Auth produksi.
- Verifikasi:
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 18 test files passed dan 60 tests passed.
  - `npm run test:e2e` menghasilkan 4 tests passed di mobile dan desktop.
  - `npm run build` berhasil.

## Update 15 Mei 2026 - MVP ChatGPT/OpenAI untuk Naskah Siaran

- Menjawab permintaan "lanjut" dari pembahasan ChatGPT/OpenAI dengan
  implementasi MVP, mengikuti pola aman yang sudah dipakai untuk Gemini:
  frontend hanya memanggil proxy, API key tetap di backend.
- `src/services/aiScript.service.ts` ditambahkan:
  - provider `openai` dan `gemini`;
  - request naskah program berisi program, hari/jam, penyiar, deskripsi, gaya,
    durasi, dan intervensi penyiar;
  - fallback demo lokal jika `VITE_AI_SCRIPT_PROXY_ENDPOINT` /
    `VITE_OPENAI_PROXY_ENDPOINT` belum diisi.
- `src/App.tsx`:
  - halaman `Jadwal Siaran` mendapat panel `Naskah siaran otomatis`;
  - user bisa memilih slot program, provider AI, durasi, gaya, serta arahan
    penyiar aktif;
  - hasil naskah tampil sebagai textarea yang bisa diedit penyiar sebelum
    dipakai.
- `scripts/notification-proxy-server.mjs`:
  - menambahkan builder prompt naskah Radio SBL;
  - menambahkan helper OpenAI Responses API via `POST /ai/script-draft`;
  - menambahkan alias `POST /openai/draft`;
  - jika `OPENAI_API_KEY` kosong, endpoint mengembalikan draft demo.
- `functions/index.js`:
  - menambahkan route yang sama untuk Firebase Functions production proxy:
    `/ai/script-draft` dan `/openai/draft`;
  - memakai `OPENAI_API_KEY`, `OPENAI_MODEL`, dan
    `OPENAI_MAX_OUTPUT_TOKENS` dari env backend.
- `.env.example`:
  - menambahkan `VITE_AI_SCRIPT_PROXY_ENDPOINT`;
  - menambahkan `VITE_OPENAI_PROXY_ENDPOINT`;
  - menambahkan `OPENAI_API_KEY`;
  - menambahkan `OPENAI_MODEL=gpt-5-mini`;
  - menambahkan `OPENAI_MAX_OUTPUT_TOKENS=900`.
- `src/styles/app.css`:
  - menambahkan styling panel AI naskah, provider pill, form grid, dan output
    textarea.
- `src/e2e/login.smoke.spec.ts`:
  - flow Jadwal kini menguji panel naskah otomatis, mengisi intervensi penyiar,
    klik `Buat naskah`, dan memastikan output editable muncul.
- Verifikasi:
  - `node --check scripts/notification-proxy-server.mjs` berhasil.
  - `node --check functions/index.js` berhasil.
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 18 test files passed dan 60 tests passed.
  - `npm run test:e2e` menghasilkan 4 tests passed di mobile dan desktop.
  - `npm run build` berhasil.

## Update 15 Mei 2026 - Arsip Draft Naskah AI

- Melanjutkan fitur AI naskah siaran agar hasil yang sudah diedit penyiar tidak
  hilang setelah refresh.
- `src/types/domain.ts`:
  - menambahkan tipe `ProgramScriptDraft`.
- `src/services/programScript.service.ts`:
  - service baru untuk menyimpan dan membaca arsip draft naskah program;
  - memakai collection Firestore `programScriptDrafts`;
  - fallback `localStorage` untuk mode test/offline/permission error.
- `src/App.tsx`:
  - `BroadcastSchedulePage` menerima `session`;
  - panel naskah AI punya tombol `Simpan draft`;
  - menampilkan `Arsip naskah terbaru`;
  - klik arsip memuat ulang konten ke editor naskah.
- `firestore.rules`:
  - menambahkan validator `validProgramScriptDraftPayload()`;
  - menambahkan match `/programScriptDrafts/{draftId}`;
  - read/create/update untuk role yang lolos `canUseAi()`, delete untuk admin.
- `src/styles/app.css`:
  - menambahkan styling list arsip naskah.
- `src/e2e/login.smoke.spec.ts`:
  - flow naskah AI kini menguji `Simpan draft` dan kemunculan arsip.
- `src/tests/programScript.test.ts`:
  - test simpan draft lokal;
  - test validasi konten kosong.
- Verifikasi:
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 19 test files passed dan 62 tests passed.
  - `npm run test:e2e` menghasilkan 4 tests passed di mobile dan desktop.
  - `npm run build` berhasil.

## Update 15 Mei 2026 - Deploy AI Naskah dan Arsip Draft

- Melanjutkan fitur ChatGPT/OpenAI dan arsip naskah sampai status produksi
  terbaru terdokumentasi.
- Verifikasi lokal sebelum deploy:
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 19 test files passed dan 62 tests passed.
  - `npm run test:e2e` menghasilkan 4 tests passed di mobile dan desktop.
  - `npm run build` berhasil.
  - `npm --prefix functions run lint` berhasil.
  - `node --check scripts/notification-proxy-server.mjs` berhasil.
  - `node --check functions/index.js` berhasil.
- Proxy lokal mode demo diuji:
  - `POST http://localhost:8788/ai/script-draft` merespons draft demo
    OpenAI/ChatGPT.
- Deploy Firestore rules produksi berhasil:
  - `npx firebase-tools deploy --only firestore:rules --project radiosbl --non-interactive`
  - Ruleset:
    `projects/radiosbl/rulesets/0e1734b1-a7ad-4f39-a1c5-ddd447c7f42a`.
- Deploy hosting produksi berhasil:
  - `npx firebase-tools deploy --only hosting --project radiosbl --non-interactive`
  - URL: `https://radiosbl.web.app`
  - Version:
    `projects/671712527716/sites/radiosbl/versions/5cf536588550e2de`
  - Release:
    `projects/671712527716/sites/radiosbl/channels/live/releases/1778834005958000`
- Verifikasi publik berhasil:
  - `https://radiosbl.web.app/?v=ai-script-20260515` merespons HTTP 200.
- Deploy Functions dicoba:
  - `npx firebase-tools deploy --only functions:notificationProxy --project radiosbl --non-interactive`
  - Gagal karena project `radiosbl` masih Spark Plan. Firebase CLI tidak bisa
    mengaktifkan `artifactregistry.googleapis.com` dan
    `cloudbuild.googleapis.com` tanpa upgrade Blaze.
- Dampak:
  - UI produksi untuk generator naskah AI dan arsip draft sudah tersedia.
  - Firestore rules untuk `programScriptDrafts` sudah aktif.
  - Endpoint proxy produksi `/ai/script-draft`, `/openai/draft`,
    `/gemini/draft`, dan `/whatsapp/send` belum aktif sampai project di-upgrade
    ke Blaze dan Functions berhasil dideploy.

## Update 15 Mei 2026 - Rotasi Gemini Key dan Fallback Liputan

- Menindaklanjuti error `Failed to fetch` saat `Test Gemini` di halaman
  Liputan/OB dan permintaan memakai banyak Gemini API key untuk naskah.
- `scripts/notification-proxy-server.mjs`:
  - CORS lokal dibuat dinamis untuk semua origin `localhost`/`127.0.0.1`
    sehingga tidak terkunci ke port 5173 saja.
  - Menambahkan normalisasi env.
  - Menambahkan rotasi dan retry banyak key dari `GEMINI_API_KEYS` /
    `GEMINI_API_KEY`.
  - Menambahkan kompatibilitas sementara untuk env lama
    `VITE_GEMINI_API_KEYS` / `VITE_GEMINI_API_KEY` di sisi server.
  - Menambahkan fallback beberapa model Gemini:
    `gemini-2.0-flash`, `gemini-2.0-flash-lite`, `gemini-1.5-flash`.
  - Jika semua key/model gagal atau quota habis, endpoint mengembalikan draft
    demo dengan warning, bukan HTTP 400.
- `functions/index.js` diselaraskan dengan proxy lokal untuk deployment
  production setelah Blaze aktif.
- `src/services/gemini.service.ts`:
  - jika endpoint kosong atau fetch network gagal, halaman Liputan/OB menerima
    draft demo lokal, bukan error mentah `Failed to fetch`.
  - error API yang bukan network tetap ditampilkan dengan pesan backend.
- `src/services/aiScript.service.ts`:
  - saat provider Gemini dipilih, naskah siaran dapat memakai
    `VITE_AI_SCRIPT_PROXY_ENDPOINT` atau fallback ke
    `VITE_GEMINI_PROXY_ENDPOINT`;
  - network failure menghasilkan draft demo agar flow penyiar tidak putus.
- `.env.local` lokal diperbaiki:
  - endpoint Gemini diarahkan ke `http://localhost:8788/gemini/draft`;
  - endpoint AI diarahkan ke `http://localhost:8788/ai/script-draft`;
  - key Gemini dipindahkan ke `GEMINI_API_KEYS` non-public.
- Catatan keamanan:
  - scan build menemukan key Gemini pernah masuk bundle karena prefix `VITE_`;
  - env sudah dibersihkan dari `VITE_GEMINI_API_KEY(S)`;
  - rebuild terbaru dan scan `dist` menunjukkan 0 Gemini key bocor.
- Status key:
  - 4 key Gemini non-Firebase masih tersedia di workspace lokal;
  - satu nilai yang terbaca saat recovery adalah Firebase API key public, jadi
    dikeluarkan dari rotasi Gemini.
  - Semua key/model yang diuji terkena quota, sehingga proxy saat ini fallback
    demo dengan warning.
- Verifikasi:
  - `POST http://localhost:8788/gemini/draft` merespons 200 dengan fallback demo
    dan warning quota.
  - `POST http://localhost:8788/ai/script-draft` provider Gemini merespons 200
    dengan fallback demo dan warning quota.
  - `node --check scripts/notification-proxy-server.mjs` berhasil.
  - `node --check functions/index.js` berhasil.
  - `npm --prefix functions run lint` berhasil.
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 19 test files passed dan 62 tests passed.
  - `npm run build` berhasil.
  - `npm run test:e2e` sempat gagal karena Playwright reuse server Vite lama di
    port 5174 yang bukan mode test; setelah listener port 5174 dihentikan,
    `npm run test:e2e` berhasil 4 tests passed.

## Update 15 Mei 2026 - Uji Naskah Otomatis Dengan Endpoint Gemini

- Menindaklanjuti catatan bahwa `Naskah siaran otomatis` masih menampilkan teks
  `Draft demo dibuat. Isi endpoint dan API key...`.
- Audit env lokal:
  - `GEMINI_API_KEYS` tersedia 4 key non-Firebase;
  - `VITE_GEMINI_PROXY_ENDPOINT=http://localhost:8788/gemini/draft`;
  - `VITE_AI_SCRIPT_PROXY_ENDPOINT=http://localhost:8788/ai/script-draft`;
  - tidak ditemukan `OPENAI_API_KEY`, sehingga provider OpenAI memang akan
    fallback.
- `src/App.tsx`:
  - default provider naskah otomatis diubah dari `openai` menjadi `gemini`;
  - pesan lama `Draft demo dibuat...` diganti menjadi pesan fallback sementara;
  - warning quota dari proxy ditampilkan sebagai error note, bukan success note.
- `src/services/aiScript.service.ts`:
  - response AI sekarang membawa field `warning`;
  - mode `test` langsung memakai fallback lokal agar e2e tidak lambat menunggu
    retry Gemini key/model.
- `scripts/notification-proxy-server.mjs`, `functions/index.js`, dan
  `src/services/gemini.service.ts`:
  - teks fallback tidak lagi memakai awalan `Draft demo`;
  - memakai `Fallback sementara Radio SBL` agar statusnya lebih jelas.
- Uji langsung:
  - `POST http://localhost:8788/ai/script-draft` provider Gemini berhasil
    memanggil proxy.
  - Proxy membaca 4 key Gemini dan mencoba 3 model, total 12 percobaan.
  - Semua percobaan masih terkena quota, sehingga response 200 fallback dengan
    warning: `Gemini belum tersedia: 4 key dan 3 model sudah dicoba`.
- Verifikasi:
  - `node --check scripts/notification-proxy-server.mjs` berhasil.
  - `node --check functions/index.js` berhasil.
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 19 test files passed dan 62 tests passed.
  - `npm run test:e2e` menghasilkan 4 tests passed.
  - `npm run build` berhasil.

## Update 15 Mei 2026 - Perapihan Halaman Bertahap Berdasarkan Screenshot

- Menjalankan audit screenshot Playwright untuk desktop dan Pixel 5. Output
  disimpan di:
  - `tmp/ui-audit/`
  - `tmp/ui-audit-after/`
- Halaman yang diaudit:
  - Dashboard
  - Absensi
  - Jadwal
  - Streaming
  - Live/OB
  - Liputan
  - Request
  - Aduan
  - Profil
- Temuan visual:
  - halaman Jadwal masih terlalu besar dan terasa seperti hero, tidak seperti
    list operasional pada referensi;
  - tombol action halaman Liputan pecah kata pada mobile.
- `src/App.tsx`:
  - memperpendek judul halaman internal:
    - `Absensi foto dan lokasi` menjadi `Absensi`;
    - `Penyiar Resmi` menjadi `Penyiar`;
    - `Kalender program dan tukar jadwal` menjadi `Jadwal Siaran`;
    - `Produksi luar studio` menjadi `Live / OB`;
    - `Pengaduan dan aspirasi pendengar` menjadi `Saran & Pengaduan`;
    - `Pengaturan akun pengguna` menjadi `Profil`;
  - deskripsi Jadwal dipadatkan.
- `src/components/CoveragePage.tsx`:
  - action header memakai `.panel-actions` agar tombol rapi dan tidak pecah
    kata di mobile.
- `src/styles/app.css`:
  - menambahkan `.panel-actions`;
  - header internal mobile dibuat lebih ringkas, rata kiri, dan tidak
    mendominasi layar;
  - Jadwal mobile dibuat list satu kolom yang lebih padat, rata kiri, dan ikon
    kalender dekoratif pada kartu disembunyikan.
- `src/e2e/login.smoke.spec.ts`:
  - ekspektasi Live/OB disesuaikan dengan judul baru.
- Audit metrik setelah patch:
  - horizontal overflow: 0 pada semua halaman yang diuji;
  - tombol ikon tanpa label: 0;
  - link tanpa `href`: 0;
  - tombol clipped/terpotong: 0.
- Verifikasi:
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 18 test files passed dan 60 tests passed.
  - `npm run test:e2e` menghasilkan 4 tests passed di mobile dan desktop.
  - `npm run build` berhasil.

## Update 15 Mei 2026 - Audit Lanjutan Berdasarkan Referensi UI/UX

- Membaca referensi visual `docs/referensi_UI_UX.png` untuk menyelaraskan
  pengalaman app ke arah mobile super app: dashboard grid, kartu on-air,
  player streaming, jadwal, Live/OB, pengaduan, dan profil.
- Menjalankan audit Playwright manual pada desktop dan Pixel 5 untuk halaman:
  Dashboard, Absensi, Jadwal, Streaming, Live/OB, Liputan, Request, Aduan, dan
  Profil.
- Hasil audit manual:
  - tidak ada horizontal overflow di semua halaman yang diuji;
  - tidak ada tombol ikon tanpa label;
  - tidak ada link tanpa `href`.
- `src/App.tsx`:
  - tombol play dashboard diberi `type="button"` dan `aria-label`;
  - tombol ikon tukar/edit jadwal diberi `type="button"` dan `aria-label`;
  - tombol tutup modal edit/tukar jadwal diberi `type="button"` dan
    `aria-label`;
  - tombol `Kirim notifikasi kru` Live/OB kini memiliki aksi feedback inline,
    termasuk guard jika belum ada event aktif.
- `src/components/GlobalAudioPlayer.tsx`:
  - tombol play/pause mini player diberi `type="button"` dan `aria-label`.
- `src/components/AudioPlayer.tsx`:
  - ikon status stream dan volume yang tidak punya aksi diganti dari `button`
    menjadi elemen non-tombol, sehingga tidak menipu pengguna.
- `src/e2e/login.smoke.spec.ts`:
  - helper e2e kini memeriksa horizontal overflow, tombol ikon tanpa label, dan
    link kosong;
  - flow Live/OB ikut diuji dengan klik `Kirim notifikasi kru`.
- Verifikasi:
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 18 test files passed dan 60 tests passed.
  - `npm run test:e2e` menghasilkan 4 tests passed di mobile dan desktop.
  - `npm run build` berhasil.

---
### [2026-05-15] Sesi Pembenahan Super-App UI & Filosofi Mobile-First
**Agen yang Bertugas:** Codex / Antigravity

**Fokus Utama Sesi Ini:**
- Menyempurnakan prinsip desain: Mempermudah, Super Cerdas, dan Mobile-First.
- Redesain antarmuka secara komprehensif mengikuti referensi UI Super-App modern.

**Perubahan yang Dilakukan:**
1. **Redesain LoginPage**: Menghilangkan desain kaku lama, mengganti dengan latar biru solid SBL, kolom input kapsul/pill-shaped, dan menghilangkan metode login WhatsApp yang belum berfungsi, serta memperlebar tombol Google.
2. **Implementasi SplashPage**: Menambahkan halaman layar percikan (loading) animasi dengan efek denyut logo SBL, menggunakan delay 1.2 detik sebelum beralih ke halaman onboarding.
3. **Penyempurnaan OnboardingPage**: Membangun antarmuka selamat datang sebelum login dengan pemutar *equalizer* tiruan (pill besar dengan animasi rentang spektrum) dan foto grid, serta memastikan "Let's Get Started" mengarahkan pengguna untuk wajib *login*.
4. **Desain Floating Audio Player**: Mengubah status pemutar radio global menjadi "pipih" (*pill-shaped*), mentok di batas atas layar (`top: 16px`), dan diatur agar tidak muncul di layar Onboarding dan Splash.
5. **Navigasi Bottom Bar Interaktif**: Menambahkan logika panah kiri-kanan otomatis (*Chevron hints*) jika ada overflow, dan menggunakan skrip auto-scroll untuk menempatkan menu aktif persis di tengah layar.
6. **Penambahan Halaman Podcast**: Mengimplementasikan *UI Card* dan *List* sesuai desain referensi (termasuk filter kategori bergulir) dan menyambungkannya dengan tautan asli Podcast SBL di Spotify.
7. **Perbaikan HMR (Hot Module Replacement)**: Menyelamatkan lingkungan pengembangan *localhost* dari jeda loading berulang-ulang dengan mengekstrak `useCurrentBroadcastSlot` ke file *hooks* mandiri (`src/hooks/useCurrentBroadcastSlot.ts`), yang memecahkan konflik ekspor React Fast Refresh.

**Pesan Penyerahan (Handoff) untuk Agen Selanjutnya:**
Prinsip dasar sudah disepakati bersama pengguna: **Mempermudah (Zero-friction)**, **Super Cerdas (Automasi/Context)**, dan **Diutamakan di HP (Mobile-First)**. Setiap fitur yang akan ditambahkan ke depannya WAJIB melewati filter 3 pilar ini. Silakan tanyakan kepada pengguna fitur mana yang mau digarap perlahan di sesi berikutnya.
---

## Update 15 Mei 2026 - UX Modernisasi Onboarding, Login & Audio

- Memperbaiki responsivitas Desktop untuk Splash, Onboarding, dan Login Page agar memiliki layout split-screen yang modern.
- Memperbaiki masalah logo terpotong pada Desktop di LoginPage dengan \overflow-y: auto\ dan \justify-content\ yang disesuaikan.
- Menambahkan fungsionalitas Pendaftaran/Registrasi langsung di LoginPage, lengkap dengan kolom Nama, Nomor WhatsApp, dan validasi Konfirmasi Sandi.
- Terjemahan kustom untuk pesan error Firebase Auth agar berbahasa Indonesia dan ramah pengguna.
- Fitur *Lupa Kata Sandi* tidak lagi sekadar gimmick, sekarang berfungsi memanggil \sendPasswordResetEmail\ dari Firebase Auth.
- Saat registrasi baru, profil user otomatis langsung disimpan ke koleksi \users\ Firestore dengan default role \public\ (mencegah fallback ke \employee\).
- UI SplashPage disesuaikan dengan Slogan \Suara Pinrang, Suara Kita!\, animasi equalizer radio, dan membuang elemen generik.
- Fitur *Sweeper* Audio (\sweepersbl.mp3\) disuntikkan ke \AudioContext.tsx\ sehingga berbunyi tepat saat tombol Play pertama kali ditekan, sebelum radio stream berjalan.
- Tombol Play pada Onboarding dan Dashboard diberikan efek *Pulse Glow* putih/ungu animasi untuk memancing atensi pengguna.
- Validasi sukses via \
pm run typecheck\.

## Update 15 Mei 2026 - Resolusi Navigasi & Smart Scroll

- Menyembunyikan Bottom Navigation pada versi Desktop (.bottom-nav-container display: none).
- Mengubah struktur dan urutan menu di radioData.ts (termasuk penambahan Podcast dan perubahan Liputan menjadi Event).
- Mengoptimalkan Smart Scroll pada Shell.tsx dengan penambahan onTouchMove, animasi ChevronLeft/Right, dan requestAnimationFrame untuk akurasi posisi scroll pada versi Mobile.

## Update 15 Mei 2026 - Audit Kegagalan & Pembersihan Dashboard

- INSIDEN: Kegagalan berulang pada implementasi panah scroll (ChevronLeft). Diduga akibat ketidaksesuaian Port (5174 vs 5175) dan masalah sinkronisasi DOM.
- LOGIKA BARU: Menggunakan manipulasi DOM langsung (Ref) dengan sensitivitas 0px.
- PROGRESS: Memulai perombakan Grid Dashboard Tengah untuk mengganti menu dummy dengan fitur fungsional (Podcast, Event, dll).

---

## Update 15 Mei 2026 - Babak 1 Perapian Halaman Jadwal

- Fokus hanya pada `BroadcastSchedulePage` sesuai prinsip iteratif satu halaman.
- Merapikan struktur halaman Jadwal dari inline style besar menjadi class CSS khusus:
  - `.schedule-page`
  - `.schedule-page-header`
  - `.schedule-day-tabs`
  - `.schedule-slot-card`
  - `.schedule-tools-panel`
  - `.schedule-modal`
- Menerapkan responsivitas Super-App:
  - mobile tetap satu kolom dengan tab hari horizontal;
  - desktop/tablet lebar menjadi dua kolom: daftar jadwal utama dan panel alat naskah AI;
  - root halaman memakai `100dvh`;
  - padding bawah menghitung `env(safe-area-inset-bottom)` agar aman dari bottom nav/home bar.
- Modal tukar/edit jadwal diberi `max-height`, `overflow-y: auto`, dan safe-area padding agar tidak terpotong di layar pendek.
- Menghapus import/state tidak terpakai khusus halaman Jadwal (`PageHeader`, ikon tidak terpakai, dan state arsip naskah yang belum ditampilkan).
- Catatan fungsi:
  - tombol Tukar Jadwal masih belum disambungkan ke Firestore; sengaja tidak diubah pada babak visual ini agar scope tetap kecil.
- Verifikasi:
  - `npx eslint src\components\BroadcastSchedulePage.tsx` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil: 19 files / 62 tests passed.
  - `npm run build` berhasil.
  - `npm run lint` global masih gagal karena banyak unused import lama di file lain (`App.tsx`, `DashboardPage`, beberapa page lain), bukan dari `BroadcastSchedulePage`.

---

## Update 15 Mei 2026 - Babak 2 Mobile Shell Jadwal, Mini Player, dan Hint Navigasi

- Menindaklanjuti evaluasi pengguna atas tampilan Jadwal mobile:
  - halaman Jadwal dikunci agar tidak horizontal overflow di layar kecil;
  - form panel AI diberi `min-width: 0` / `max-width: 100%` pada input, select, textarea, dan label;
  - padding bawah Jadwal mobile ditambah agar tidak tertutup mini player dan bottom navigation.
- Mengubah `GlobalAudioPlayer` menjadi mini player bawah yang lebih kecil:
  - posisi mobile berada di atas bottom navigation;
  - posisi desktop berada di pojok bawah, tidak lagi menutup header halaman;
  - isi dibuat satu baris: tombol play/pause, judul/artist ringkas, equalizer horizontal, dan slider volume;
  - kontrol volume terhubung ke state audio global, sehingga tetap sinkron dengan player utama.
- Merapikan `Shell` bottom navigation:
  - panah kiri/kanan sekarang berbasis state `canScrollLeft` / `canScrollRight`;
  - panah kanan muncul saat masih ada menu tersembunyi di kanan;
  - panah kiri muncul saat posisi scroll sudah bergeser ke kanan;
  - ketika mentok kanan, panah kanan hilang dan panah kiri tetap menjadi petunjuk balik.
- Verifikasi:
  - `npx eslint src\components\GlobalAudioPlayer.tsx src\components\Shell.tsx src\components\BroadcastSchedulePage.tsx` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil: 19 files / 62 tests passed.
  - `npm run build` berhasil.
- Koreksi lanjutan dari screenshot mobile:
  - elemen form AI Jadwal pada layar sempit dibuat lebih defensif terhadap teks panjang;
  - select/input/textarea dibatasi `min-width: 0`, `max-width: 100%`, dan ellipsis;
  - tombol utama Jadwal boleh wrap agar label tidak memaksa overflow;
  - mini player mobile dipadatkan lagi untuk viewport 420px ke bawah.

---

## Update 15 Mei 2026 - Babak 3 Polish Jadwal Referensi UI/UX dan Full-Width Player

- Mengarahkan tampilan Jadwal lebih dekat ke referensi UI/UX Super-App:
  - kartu jadwal dibuat lebih compact;
  - setiap slot jadwal diberi thumbnail program menggunakan aset `coverSBL.jpg`;
  - badge live, waktu, penyiar, dan aksi tetap dipertahankan;
  - panel AI tetap terbuka di desktop, tetapi tertutup default di mobile agar halaman Jadwal tidak terasa seperti form panjang.
- Mengubah mini radio player global:
  - desktop sekarang full-width pada area utama aplikasi, mentok di bawah layar;
  - mobile tetap full-width dan duduk aman di atas bottom navigation;
  - player tetap sinkron dengan `AudioContext`, tombol play tetap memanggil `togglePlayback`.
- Validasi audio:
  - `AudioContext.tsx` tetap menjalankan `sweepersbl.mp3` pada play pertama sebelum stream radio;
  - `public/sweepersbl.mp3` dan `dist/sweepersbl.mp3` tersedia.
- Verifikasi:
  - `npx eslint src\components\GlobalAudioPlayer.tsx src\components\Shell.tsx src\components\BroadcastSchedulePage.tsx` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil: 19 files / 62 tests passed.
  - `npm run build` berhasil.
- Koreksi lanjutan fit-width mobile:
  - saat `.content` berisi `.schedule-page`, padding horizontal shell mobile dihilangkan;
  - halaman Jadwal mengatur sendiri padding internalnya agar benar-benar fit viewport;
  - panel/list/form Jadwal dikunci `min-width: 0`, `max-width: 100%`, dan `overflow: hidden`;
  - kartu Jadwal pada layar kecil dipadatkan lagi: thumbnail 48px, action button 32px.

---

## Update 15 Mei 2026 - Babak 4 Pixel-Close Mobile Jadwal

- Menyesuaikan halaman Jadwal lebih dekat ke mockup referensi:
  - header mobile memakai lockup logo + eyebrow merah + judul;
  - tab hari memakai tombol panah kiri/kanan di sisi luar;
  - tab aktif dibuat biru solid, tab lain soft blue dengan radius besar;
  - kartu jadwal dibuat lebih rounded, lebih tebal, dan memakai thumbnail lebih dominan;
  - panel AI dikembalikan terbuka default di mobile sesuai mockup.
- Menyesuaikan shell bawah mobile seperti referensi:
  - radio player full-width paling bawah;
  - bottom navigation mengambang di atas radio player;
  - safe-area tetap dihitung agar tidak tertutup home bar.
- Desktop tetap dijaga:
  - Jadwal tetap dua kolom;
  - player full-width pada area utama aplikasi dan mentok bawah.
- Verifikasi:
  - `npx eslint src\components\BroadcastSchedulePage.tsx src\components\GlobalAudioPlayer.tsx src\components\Shell.tsx` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil: 19 files / 62 tests passed.
  - `npm run build` berhasil.

---

## Update 15 Mei 2026 - Babak 5 Koreksi Tipis Jadwal dan AI

- Header Jadwal:
  - logo bagian atas diperkecil agar seimbang dengan dua baris judul.
- Penyiar pada kartu Jadwal:
  - tampilan penyiar sekarang memakai nama udara saja;
  - nama penyiar dibuat klikable dan sementara diarahkan ke halaman `Penyiar` sebagai jembatan menuju halaman profil penyiar dinamis.
- Bottom navigation:
  - Shell diberi class halaman aktif (`app-shell-{page}` dan `content-{page}`);
  - bottom nav kembali mentok bawah secara default;
  - khusus halaman Jadwal, bottom nav naik di atas radio player;
  - transisi posisi nav/player ditambahkan agar perpindahan terasa halus.
- Naskah AI:
  - pilihan provider dihapus dari UI;
  - request naskah dikunci memakai Gemini;
  - service AI tidak lagi memakai fallback endpoint OpenAI;
  - jika Gemini quota/key sedang bermasalah, sistem tetap mengembalikan naskah sementara yang bisa diedit tanpa error merah yang terlalu mengganggu.
- Typography:
  - textarea naskah dan instruksi tambahan memakai font normal, bukan bold.
- Verifikasi:
  - `npx eslint src\components\BroadcastSchedulePage.tsx src\components\GlobalAudioPlayer.tsx src\components\Shell.tsx src\services\aiScript.service.ts` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil: 19 files / 62 tests passed.
  - `npm run build` berhasil.
- Audit Gemini langsung:
  - Proxy lokal `/ai/script-draft` berhasil dipanggil dan membaca 4 Gemini key.
  - Routing frontend/proxy benar karena response berisi `provider: "gemini"`.
  - Uji langsung ke Gemini API menghasilkan `HTTP 429 RESOURCE_EXHAUSTED` untuk `gemini-2.0-flash` dan `gemini-2.0-flash-lite` pada 4 key.
  - Default model lama `gemini-1.5-flash` menghasilkan `HTTP 404 NOT_FOUND`, sehingga dihapus dari default fallback model proxy lokal dan Cloud Functions.

---

## Update 15 Mei 2026 - Babak 6 Header, Profil Penyiar, dan Bottom Nav Global

- Header Jadwal:
  - spacing bawah dipindahkan dari `h1` ke wrapper lockup agar logo sejajar secara visual dengan dua baris judul;
  - ukuran logo mobile diperkecil sedikit agar tidak lebih tinggi dari blok teks.
- Link penyiar:
  - nama yang tampil di kartu Jadwal hanya nama udara;
  - setiap penyiar yang cocok dengan data profil menjadi tombol link biru tebal;
  - label non-penyiar seperti `Tim SBL` tetap tampil sebagai teks biasa.
- Profil penyiar dinamis:
  - menambahkan halaman `AnnouncerProfilePage`;
  - route internal `announcerProfile` memuat satu penyiar berdasarkan nama udara yang diklik;
  - header mengikuti pola halaman Jadwal dengan judul `Profil Penyiar`;
  - halaman memuat foto, status, statistik slot, dan daftar jadwal penyiar.
- Bottom navigation:
  - Shell menerima flag `hasMiniPlayer`;
  - bottom nav naik di atas mini player pada semua halaman yang memang memiliki mini player, bukan hanya Jadwal;
  - halaman tanpa mini player tetap memakai posisi normal.
- Verifikasi:
  - `npx eslint src\components\BroadcastSchedulePage.tsx src\components\AnnouncerProfilePage.tsx src\components\Shell.tsx src\App.tsx` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil: 19 files / 62 tests passed.
  - `npm run build` berhasil.

---

## Update 16 Mei 2026 - Babak Podcast Responsif dan Feed

- Halaman Podcast dirapikan sebagai babak terpisah sesuai `PERJANJIAN_JUMAT_MALAM.md`.
- Header Podcast sekarang mengikuti pola halaman Jadwal:
  - lockup logo Radio SBL;
  - eyebrow;
  - judul halaman ringkas;
  - sticky header dengan batas bawah halus.
- Dummy podcast dihapus dari `PodcastPage`.
- Menambahkan `src/services/podcast.service.ts`:
  - mendukung RSS/feed terbuka lewat `VITE_PODCAST_FEED_URL` atau `VITE_PODCAST_RSS_URL`;
  - parsing metadata channel dan item episode;
  - fallback ke sumber resmi Spotify yang sudah ada jika feed belum dikonfigurasi atau gagal dimuat.
- Layout Podcast dibuat responsif:
  - mobile memakai hero ringkas, daftar episode satu kolom, dan episode pilihan horizontal;
  - desktop memakai grid episode dua kolom dan episode pilihan empat kolom;
  - halaman mengikuti safe-area serta posisi mini player/bottom nav.
- `.env.example` ditambah `VITE_PODCAST_FEED_URL=`.
- Sekalian membersihkan utang lint lama berupa import/state tidak terpakai di beberapa komponen agar verifikasi global hijau.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run lint` berhasil.
  - `npm run test` berhasil: 19 files / 62 tests passed.
  - `npm run build` berhasil.

### Koreksi 16 Mei 2026 - Spotify Show Episodes

- Menjawab kebutuhan agar URL channel Spotify `https://open.spotify.com/show/5E9y3LGQv233K22ZzYANLF` dapat menjadi sumber seluruh episode, bukan hanya satu embed/judul.
- Menambahkan endpoint proxy:
  - Cloud Function/local proxy: `POST /spotify/show-episodes`;
  - mengambil token Spotify dengan Client Credentials;
  - membaca metadata show dan episode dari Spotify Web API;
  - mengembalikan data episode untuk layout kartu Podcast.
- Frontend Podcast sekarang mencoba urutan sumber:
  - RSS `VITE_PODCAST_FEED_URL` jika ada;
  - Spotify proxy `VITE_PODCAST_API_ENDPOINT` jika RSS tidak ada;
  - fallback embed Spotify resmi jika proxy/kredensial belum siap.
- Konfigurasi baru:
  - `VITE_PODCAST_API_ENDPOINT`;
  - `SPOTIFY_CLIENT_ID`;
  - `SPOTIFY_CLIENT_SECRET`.
- Catatan:
  - URL `open.spotify.com/show/...` saja tidak cukup untuk daftar episode native di frontend karena endpoint episode Spotify memerlukan OAuth token.
  - Proxy lokal harus direstart setelah perubahan agar route baru aktif.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run lint` berhasil.
  - `npm --prefix functions run lint` berhasil.
  - `npm run test` berhasil: 19 files / 62 tests passed.
  - `npm run build` berhasil.
- Cek kredensial Spotify dari dashboard:
  - client credentials berhasil menghasilkan token (`HTTP 200`);
  - request episode show `5E9y3LGQv233K22ZzYANLF` masih ditolak (`HTTP 403`);
  - sesuai banner dashboard Spotify, aplikasi masih diblokir dari Web API karena akun belum Spotify Premium.
  - rekomendasi: aktifkan/upgrade akses Spotify Developer, lalu rotate client secret karena sempat terlihat di screenshot.

### Koreksi 16 Mei 2026 - Mode Gratis Embed Episode

- Karena akun Spotify Developer masih versi gratis dan Web API episode ditolak `HTTP 403`, halaman Podcast diberi fallback gratis:
  - beberapa episode resmi SBL dari channel Spotify ditanam sebagai Spotify embed;
  - layout tetap menyerupai versi dummy lama dengan kartu episode pilihan dan daftar episode terbaru;
  - fallback ini tidak mengarang episode, melainkan memakai episode ID publik dari halaman channel Spotify SBL.
- Jika nanti Web API sudah aktif, jalur `VITE_PODCAST_API_ENDPOINT` tetap tersedia untuk mengambil seluruh episode otomatis.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run lint` berhasil.
  - `npm run test` berhasil: 19 files / 62 tests passed.
  - `npm run build` berhasil.

### Koreksi 16 Mei 2026 - Header dan Metadata Podcast

- Header sticky Podcast dihapus agar tidak tumpang tindih dengan hero Podcast yang sudah menjadi pembuka halaman.
- Metadata tanggal/durasi untuk episode embed mode gratis tidak lagi ditampilkan jika Spotify oEmbed tidak menyediakan data tersebut.
- Teks "Tanggal belum tersedia" dihapus dari UI agar tidak terlihat seperti data rusak.
- CSS header Podcast yang tidak lagi dipakai ikut dibersihkan.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run lint` berhasil.
  - `npm run test` berhasil: 19 files / 62 tests passed.
  - `npm run build` berhasil.

### Koreksi 16 Mei 2026 - Poles Screenshot Podcast

- Hero Podcast:
  - deskripsi diganti ke copy resmi SBL Podcast dari pengguna;
  - gambar hero diganti menjadi logo SBL;
  - tombol "Buka Sumber Resmi" diganti menjadi ikon Spotify saja yang mengarah ke channel Spotify.
- Notice mode gratis dihapus dari UI.
- Kartu episode pilihan bagian atas tidak lagi memakai iframe Spotify sempit agar tidak muncul scrollbar internal horizontal/vertikal.
- Kartu episode pilihan kini memakai cover episode + tombol play visual dan tetap membuka episode resmi di Spotify.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run lint` berhasil.
  - `npm run test` berhasil: 19 files / 62 tests passed.
  - `npm run build` berhasil.

### Koreksi 16 Mei 2026 - Layout Mobile Podcast Proporsional

- Struktur hero Podcast disusun ulang:
  - logo dan judul berada di lockup atas yang seimbang;
  - deskripsi berada full width di bawahnya;
  - deskripsi dipotong dengan tombol `Selengkapnya` / `Tampilkan lebih ringkas`;
  - link channel menjadi baris ikon Spotify + teks `SBL Podcast on Spotify`.
- Search tetap berada tepat di bawah hero.
- Episode pilihan dibatasi menjadi dua item dan dibuat kartu persegi panjang tersusun vertikal pada mobile.
- Judul daftar bawah diganti menjadi `Episode Lainnya`.
- Desktop tetap responsif dengan featured card dua kolom.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run lint` berhasil.
  - `npm run test` berhasil: 19 files / 62 tests passed.
  - `npm run build` berhasil.

### Koreksi 17 Mei 2026 - Poles Ikon Grid Dashboard

- Dashboard quick menu dipoles agar terlihat lebih modern dan profesional:
  - setiap shortcut kini memakai aksen warna per fitur, tidak lagi semua biru seragam;
  - kartu menu diberi permukaan putih berlapis, highlight aksen tipis, icon container bergradasi lembut, dan hover/focus state yang lebih jelas;
  - label menu dibuat lebih stabil untuk mobile dengan text wrapping aman dan ukuran kartu konsisten;
  - tombol menu diberi `type="button"` dan `aria-label` agar aksesibilitas tetap rapi.
- Tombol tiga titik dashboard kini menjadi toggle dua arah:
  - saat menu tambahan sudah terbuka, tombol tetap tampil untuk menyembunyikan lagi;
  - ukuran tombol dan titik dibuat lebih kecil agar tidak mendominasi grid.
- Navigasi dan permission menu tidak diubah.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run build` berhasil.
  - `npm run lint` masih gagal karena error lama di `scratch/*.mjs`, beberapa komponen, dan service yang tidak terkait perubahan dashboard.
  - `npm run test` masih gagal pada 5 assertion lama terkait resolver/seed penyiar `Miah/Salmiah`, bukan area dashboard menu.

### Koreksi 17 Mei 2026 - Visualizer Latar Radio Player

- Radio player Dashboard diberi animasi latar yang lebih hidup:
  - bar visualizer 24 kolom di belakang metadata siaran;
  - orbit/pulse lingkaran halus di area tombol play;
  - shimmer lembut dan respons hover/focus;
  - animasi lebih aktif saat radio sedang `playing`.
- Komponen `AudioPlayer` reusable juga dipoles:
  - background aurora bergerak pelan;
  - bar visualizer memakai gradasi dan intensitas berbeda ketika stream diputar.
- Aksesibilitas:
  - layer visualizer diberi `aria-hidden`;
  - menghormati `prefers-reduced-motion: reduce`.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run build` berhasil.
  - Cek Playwright manual mobile berhasil: 24 bar visualizer tampil, orbit tersedia, dan tidak ada overflow horizontal.
  - `npm run lint` masih gagal karena error lama di `scratch/*.mjs`, unused import/variable, dan `any` di file non-player.
  - `npm run test` masih gagal pada 5 assertion lama terkait resolver/seed penyiar `Miah/Salmiah`.

### Koreksi 17 Mei 2026 - Visualizer Lebih Terlihat & Fallback Jadwal Senyap

- Berdasarkan preview iPhone 14 Pro Max, visualizer player Dashboard diperjelas:
  - opacity bar dinaikkan;
  - ditambahkan garis frekuensi tipis;
  - orbit tombol play dibuat lebih kontras;
  - idle animation tetap halus tetapi lebih mudah terlihat.
- Error Firestore permission pada `weekly_schedule_slots` tidak lagi dicetak sebagai error merah berulang:
  - jika Firestore mengembalikan `permission-denied`, aplikasi langsung memakai jadwal lokal;
  - error non-permission tetap dilaporkan satu kali sebagai warning.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run build` berhasil.
  - Cek Playwright manual iPhone 14 Pro Max mode demo berhasil: 24 bar, frequency line, orbit, dan tidak ada overflow horizontal.

### Koreksi 17 Mei 2026 - Spectrum Player Lebih Halus

- Visualizer radio player Dashboard disesuaikan ulang agar teks tetap terbaca:
  - warna spectrum dibuat mendekati biru latar;
  - opacity, glow, dan garis frekuensi diturunkan;
  - tinggi bar dikurangi agar tidak menabrak metadata siaran;
  - mode hover/playing tetap hidup tetapi lebih lembut.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run build` berhasil.

### Koreksi 17 Mei 2026 - Visualizer Wave Spectrum

- Visualizer radio player Dashboard diubah dari bar menjadi wave spectrum ala referensi:
  - SVG dotted wave cyan/magenta dengan mesh tipis di belakang;
  - animasi dash bergerak pelan dan lebih cepat saat `playing`;
  - warna tetap berada di keluarga biru/cyan agar menyatu dengan kartu player;
  - layer tetap di background dengan `aria-hidden`.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run build` berhasil.
  - Cek Playwright iPhone 14 Pro Max mode demo berhasil: 3 spectrum line, 2 mesh line, dan tidak ada overflow horizontal.

### Koreksi 17 Mei 2026 - Cover dan Detail Program Siaran

- Menambahkan katalog program di `src/data/radioData.ts`:
  - setiap program memiliki judul resmi, deskripsi singkat, dan cover dari `public/program`;
  - pencocokan nama menangani variasi jadwal seperti `Weekend Edition`, `Podcast / Siaran Reguler`, dan `Aga Kareba / SBL on Stage`;
  - fallback tetap memakai identitas Radio SBL bila nama program belum terpetakan.
- Halaman Jadwal:
  - kartu jadwal sekarang memakai cover program yang sesuai;
  - kartu bisa diklik atau dibuka via keyboard untuk menampilkan modal detail program;
  - modal detail menampilkan cover, judul, hari/jam, penyiar, dan deskripsi singkat;
  - tombol penyiar, tukar jadwal, dan edit jadwal tidak ikut membuka modal detail.
- Dashboard:
  - kartu `Jadwal Berikutnya` memakai cover dan deskripsi dari katalog program.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run build` berhasil.
  - Cek Playwright iPhone 14 Pro Max mode demo berhasil: cover `Salam_Bumi_lasinrang.jpg` tampil dan modal detail `Salam Bumi Lasinrang` terbuka tanpa overflow horizontal.
  - `npm run lint` masih gagal karena debt lama lint di file non-perubahan seperti `scratch/*.mjs`, unused import/variable, dan `any`.
  - `npm run test` masih gagal pada 5 assertion lama terkait resolver/seed penyiar `Miah/Salmiah`.

### Koreksi 17 Mei 2026 - Frame Cover Program 16:9

- Frame cover program pada kartu jadwal dan kartu `Jadwal Berikutnya` Dashboard diubah dari kotak kecil menjadi rasio 16:9 agar lebih pas dengan gambar di `public/program`.
- Ukuran mobile juga disesuaikan agar cover tetap terbaca tanpa membuat layout melebar.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run build` berhasil.

### Koreksi 17 Mei 2026 - Sinkronisasi Jadwal Berikutnya Dashboard

- Memperbaiki logika `Jadwal Berikutnya` di Dashboard:
  - sebelumnya hanya mencari slot berikutnya dari jadwal utama mingguan;
  - sekarang kandidat dihitung dari jadwal utama remote/lokal plus seluruh program sisipan harian;
  - pemilihan memakai waktu mulai terdekat setelah waktu saat ini, sehingga saat `Jeda Siaran 23.00 - 05.00` kartu berikutnya menampilkan `Salam Subuh 05.00 - 07.00`.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run build` berhasil.
  - Cek Playwright iPhone 14 Pro Max mode demo berhasil: player `Jeda Siaran`, kartu berikutnya `Salam Subuh`, cover `/program/Info_Terkini.jpg`, tanpa overflow horizontal.
  - `npm run lint` masih gagal karena debt lama lint; warning baru di Dashboard sudah dirapikan.
  - `npm run test` masih gagal pada 5 assertion lama terkait resolver/seed penyiar `Miah/Salmiah`.

### Koreksi 17 Mei 2026 - Cover Popup Program 16:9

- Cover pada popup/detail program juga diubah ke rasio 16:9 agar konsisten dengan kartu jadwal dan Dashboard.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run build` berhasil.

### Koreksi 17 Mei 2026 - Layout Jadwal Berikutnya Dashboard

- Kartu `Jadwal Berikutnya` di Dashboard dibuat sebagai layout khusus:
  - mobile satu kolom: cover 16:9 di atas, judul/meta/jam/deskripsi di bawah;
  - desktop dua kolom: cover kiri proporsional dan tingginya sama dengan blok teks kanan;
  - deskripsi tetap dibatasi agar kartu tidak terlalu panjang.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run build` berhasil.
  - Cek Playwright:
    - iPhone 14 Pro Max: `gridTemplateColumns` satu kolom, cover 280x157.5, tanpa overflow;
    - desktop 1366px: cover dan blok teks sama tinggi 193.875px.

### Koreksi 17 Mei 2026 - Detail Program dari Profil Penyiar

- Jadwal siaran di halaman profil penyiar sekarang berupa tombol program interaktif.
- Klik program terkait membuka popup detail program yang sama:
  - cover 16:9;
  - judul program;
  - hari/jam siaran;
  - penyiar/PIC;
  - deskripsi singkat dari katalog program.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run build` berhasil.
  - Cek Playwright iPhone 14 Pro Max mode demo berhasil: dari Jadwal ke profil penyiar, klik slot program membuka modal detail `Aga Kareba?` dengan cover `/program/Aga_Kareba.jpg`, tanpa overflow horizontal.

### Koreksi 17 Mei 2026 - Query Tukar Jadwal Tanpa Composite Index

- Memperbaiki error Firestore di `ScheduleSwapPage`: query `schedule_swaps` tidak lagi menggabungkan `where(...)` dengan `orderBy("createdAt")`, sehingga tidak memicu kebutuhan composite index Firebase.
- Urutan permintaan tukar jadwal sekarang dihitung di sisi aplikasi melalui helper `sortByNewest`, termasuk daftar user dan daftar admin `pending_admin`.
- Membersihkan beberapa warning di `ScheduleSwapPage`:
  - import ikon/type yang tidak dipakai dihapus;
  - `loadData` dibuat stabil dengan `useCallback`;
  - submit dan response menunggu reload data selesai.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run build` berhasil.
  - `npm run lint` masih gagal karena debt lama di `scratch/*.mjs` dan beberapa file non-perubahan; tidak ada error lint baru dari file swap yang disentuh.

### Koreksi 17 Mei 2026 - Poles Splash dan Login

- Membuat aset latar baru `public/sbl-auth-studio-bg.png` dengan visual studio radio malam tanpa teks/watermark.
- Merapikan `SplashPage`:
  - latar studio radio penuh layar;
  - panel `91.5 FM` untuk desktop;
  - kartu logo, chip `On Air`, dan visualizer gelombang.
- Merapikan `LoginPage`:
  - layout mobile berupa kartu glass yang ringkas;
  - layout desktop split-screen dengan panel brand dan panel form;
  - tab Masuk/Daftar, input berikon, tombol aksi lime, Google login, lupa sandi, dan toggle kata sandi tetap fungsional.
- Menambahkan override `content-splash`, `content-onboarding`, dan `content-login` agar halaman pembuka bebas padding shell dan tidak bocor scroll/area putih.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil, 17 file test / 54 test lulus.
  - `npm run build` berhasil.
  - `npx playwright test login.smoke.spec.ts` berhasil, 4 test lulus di mobile dan desktop.
  - Cek Playwright manual:
    - splash mobile 390x844: `scrollWidth=390`, `clientWidth=390`, `scrollHeight=844`;
    - splash desktop 1440x900: `scrollWidth=1440`, `clientWidth=1440`, `scrollHeight=900`;
    - login mobile 390x844: `scrollWidth=390`, `clientWidth=390`, `scrollHeight=844`;
    - login desktop 1440x900: `scrollWidth=1440`, `clientWidth=1440`, `scrollHeight=900`.
  - `npm run lint` masih gagal karena debt lama di banyak file non-perubahan (`scratch/*.mjs`, unused import/variable, dan beberapa `any`); perubahan splash/login tidak menambah error TypeScript/build.

### Koreksi 17 Mei 2026 - Proxy Podcast Lokal Opsional

- Merapikan error console `ERR_CONNECTION_REFUSED` dari `POST http://localhost:8789/spotify/show-episodes`.
- `.env.local` lokal diarahkan agar `VITE_PODCAST_API_ENDPOINT` kosong dan `VITE_ENABLE_LOCAL_PODCAST_PROXY=false`.
- `.env.example` menambahkan `VITE_ENABLE_LOCAL_PODCAST_PROXY=false` sebagai dokumentasi resmi.
- `podcast.service.ts` sekarang mengabaikan endpoint podcast `localhost`, `127.0.0.1`, atau `::1` saat mode development, kecuali `VITE_ENABLE_LOCAL_PODCAST_PROXY=true/1/yes`.
- Hasilnya:
  - development harian memakai fallback episode statis tanpa request ke proxy yang belum dinyalakan;
  - testing proxy Spotify live tetap bisa dilakukan dengan menjalankan `npm run proxy:notifications` dan mengaktifkan flag lokal.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil, 17 file test / 54 test lulus.
  - `npm run build` berhasil.
  - Cek Playwright manual tidak menemukan request/failure ke `localhost:8789` atau `/spotify/show-episodes` pada sesi dev.
  - `npm run lint` masih gagal karena debt lama di file non-perubahan (`scratch/*.mjs`, unused import/variable, dan beberapa `any`).

### Koreksi 17 Mei 2026 - Hapus Halaman Onboarding

- Menghapus halaman onboarding yang berisi tombol `Mulai Sekarang` dari alur pembuka.
- `SplashPage` sekarang langsung mengarah ke halaman login setelah animasi 1,2 detik.
- Membersihkan referensi route onboarding:
  - `PageKey` tidak lagi memiliki nilai `onboarding`;
  - `App.tsx` tidak lagi mengimpor/merender `OnboardingPage`;
  - `Shell.tsx` tidak lagi memeriksa `activePage === "onboarding"`;
  - file `src/components/OnboardingPage.tsx` dihapus;
  - CSS khusus `.onboarding-*`, `.app-shell-onboarding`, dan `.content-onboarding` dihapus.
- Verifikasi:
  - `rg -n "onboarding|OnboardingPage" src` tidak menemukan referensi tersisa.
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil, 17 file test / 54 test lulus.
  - `npm run build` berhasil.
  - `npx playwright test login.smoke.spec.ts` berhasil, 4 test lulus.

### Koreksi 17 Mei 2026 - Checkbox Ingat Saya Dibuat Fungsional

- Menjawab audit UI login: checkbox `Ingat saya` sebelumnya hanya elemen visual.
- `LoginPage` sekarang menyimpan state `rememberSession` dan meneruskannya ke:
  - `signIn`;
  - `signUp`;
  - `signInWithGoogle`.
- Firebase Auth:
  - saat `Ingat saya` aktif memakai `browserLocalPersistence`;
  - saat tidak aktif memakai `browserSessionPersistence`.
- Mode demo:
  - saat `Ingat saya` aktif sesi disimpan di `localStorage`;
  - saat tidak aktif sesi disimpan di `sessionStorage`;
  - logout membersihkan keduanya agar tidak ada sesi tertinggal.
- Auto-onboarding staf SBL (`nomor@radiosbl.com`) ikut menghormati pilihan persistence.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil, 17 file test / 54 test lulus.
  - `npm run build` berhasil.

### Koreksi 17 Mei 2026 - Poles Halaman Penyiar

- Merapikan halaman `Penyiar` agar konsisten dengan tema super-app Radio SBL:
  - header hero baru berbahasa Indonesia dengan lockup logo, tagline, dan ringkasan jumlah penyiar/slot/jam;
  - kartu penyiar menjadi tombol interaktif untuk membuka profil;
  - kartu memakai foto, status aktif, statistik, hari siaran, cuplikan jadwal, dan CTA `Lihat profil`;
  - inline style lama di `AnnouncersPage` dipindahkan ke class CSS yang responsif;
  - layout mobile satu kolom, tablet dua kolom, desktop tiga kolom tanpa overflow horizontal.
- Profil penyiar ikut diselaraskan:
  - header sticky khusus profil penyiar;
  - foto profil memakai frame visual yang sama;
  - kartu profil diberi border/shadow lebih konsisten;
  - detail jadwal tetap membuka popup detail program seperti sebelumnya.
- Foto penyiar di `radioData.ts` diarahkan ke aset lokal `public/crew` agar tidak bergantung pada remote image dan lebih stabil saat preview.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil, 17 file test / 54 test lulus.
  - `npm run build` berhasil.
  - `npx playwright test login.smoke.spec.ts` berhasil, 4 test lulus.
  - `npx eslint src\App.tsx src\components\AnnouncerProfilePage.tsx src\data\radioData.ts` berhasil.
  - Cek Playwright manual mode test:
    - mobile 390x844 halaman Penyiar `scrollWidth=390`, `clientWidth=390`;
    - desktop 1440x900 halaman Penyiar `scrollWidth=1440`, `clientWidth=1440`;
    - profil penyiar mobile/desktop juga tanpa overflow horizontal.
  - `npm run lint` penuh masih gagal karena debt lama di file non-perubahan (`scratch/*.mjs`, beberapa unused import/variable, dan beberapa `any`).

### Koreksi 17 Mei 2026 - Audit dan Poles Halaman Aduan

- Merapikan halaman `Aduan & Saran` agar konsisten dengan tema UI/UX Radio SBL:
  - mengganti tampilan inline-style lama menjadi class CSS khusus `complaints-*`;
  - menambahkan hero dengan logo, tagline `Suara pendengar`, dan ringkasan status aduan;
  - membuat panel input aduan manual lebih jelas untuk operator/admin;
  - daftar aduan tampil sebagai tiket status dengan badge `Baru`, `Terverifikasi`, `Diproses`, dan `Selesai`;
  - empty state dan notifikasi sukses/error memakai gaya visual yang konsisten;
  - layout desktop memakai dua kolom, sedangkan mobile satu kolom tanpa overflow horizontal.
- Fungsi tetap nyata:
  - submit aduan tetap memakai `submitComplaint`;
  - realtime/list tetap memakai `subscribeComplaints` dan `listComplaints`;
  - perubahan status tetap memakai `updateComplaintStatus`.
- Koreksi kecil di `ProfilePage.tsx`:
  - membersihkan import ikon lucide yang dobel/korup agar `typecheck` kembali berjalan.
- Verifikasi:
  - `npx eslint src\components\ComplaintsPage.tsx src\components\ProfilePage.tsx` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil, 17 file test / 54 test lulus.
  - `npm run build` berhasil.
  - Cek Playwright manual mode test:
    - mobile 390x844 halaman Aduan `scrollWidth=390`, `clientWidth=390`;
    - desktop 1440x900 halaman Aduan `scrollWidth=1440`, `clientWidth=1440`;
    - tombol tanpa label kosong: `0`.
  - `npm run lint` penuh masih gagal karena debt lama lint lintas repo, terutama file `scratch/*.mjs`, beberapa unused import/variable, dan beberapa `any` di file non-perubahan.

### Koreksi 17 Mei 2026 - Poles Halaman Pembuatan Naskah AI

- Merapikan halaman `Buat Naskah AI` agar konsisten dengan halaman operasional lain:
  - header lama diganti hero dengan logo Radio SBL, tagline `Asisten kreatif`, dan deskripsi fungsi yang lebih jelas;
  - badge/teks visual `Gemini 2.5 Flash` dihapus dari UI;
  - notifikasi hasil berhasil tidak lagi menyebut nama model teknis;
  - ditambahkan kartu konteks program aktif berisi hari/jam, nama program, deskripsi, dan penyiar;
  - panel konfigurasi dan editor draft dibuat lebih rapi, responsif, dan nyaman dipakai di desktop maupun mobile;
  - tombol utama memakai aksen hijau-lime agar selaras dengan splash/login dan halaman Aduan.
- Fungsi tetap nyata:
  - generator tetap memakai `generateProgramScript`;
  - simpan arsip tetap memakai `saveProgramScript`;
  - model internal service tidak diubah agar integrasi AI tetap berjalan.
- Koreksi pendukung:
  - `attendance.service.ts` diselaraskan lagi agar status dasar test kembali `present/outside_radius`, sambil mempertahankan field tambahan verifikasi yang sudah ada.
- Verifikasi:
  - `npx eslint src\components\AiScriptPage.tsx src\services\aiScript.service.ts src\services\attendance.service.ts` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil, 17 file test / 54 test lulus.
  - `npm run build` berhasil.
  - `npx playwright test login.smoke.spec.ts` berhasil, 4 test lulus.
  - Cek Playwright manual mode test:
    - mobile 390x844 halaman Naskah AI `scrollWidth=390`, `clientWidth=390`;
    - desktop 1440x900 halaman Naskah AI `scrollWidth=1440`, `clientWidth=1440`;
    - teks `Gemini 2.5 Flash` tidak muncul di UI;
    - tombol tanpa label kosong: `0`.
  - `npm run lint` penuh masih gagal karena debt lama lint lintas repo, terutama `scratch/*.mjs`, unused import/variable, dan beberapa `any` di file non-perubahan.

### Koreksi 17 Mei 2026 - Compact Konfigurasi Naskah AI

- Menyesuaikan layout halaman `Buat Naskah AI`:
  - lebar maksimal hero/konten dinaikkan ke `1320px`;
  - kolom `Konfigurasi Naskah` di desktop dipadatkan menjadi sekitar `286px`;
  - gap, padding, input, textarea, dan tombol panel konfigurasi diperkecil;
  - area `Hasil Draft Naskah` otomatis mengambil ruang yang lebih luas;
  - tinggi minimum editor dinaikkan agar area hasil terasa lebih lapang.
- Verifikasi:
  - `npx eslint src\components\AiScriptPage.tsx` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil, 17 file test / 54 test lulus.
  - `npm run build` berhasil.
  - Cek Playwright manual mode test:
    - mobile 390x844: `scrollWidth=390`, `clientWidth=390`, konfigurasi/hasil tetap satu kolom;
    - desktop 1440x900: panel konfigurasi `286px`, area hasil `756px`, editor `640px`;
    - teks `Gemini 2.5 Flash` tetap tidak muncul di UI.
  - `npm run lint` penuh masih gagal karena debt lama lint lintas repo, terutama `scratch/*.mjs`, unused import/variable, dan beberapa `any` di file non-perubahan.
