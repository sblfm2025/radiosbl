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
- Urutan permintaan tukar jadwal sekarang dihitung di sisi aplikasi melalui helper `sortByNewest`.
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

### Koreksi 17 Mei 2026 - Tukar Jadwal Tanpa Approval Admin

- Menetapkan alur resmi pertukaran jadwal menjadi langsung antar penyiar:
  - pemohon mengajukan permintaan dengan status `pending_target`;
  - penyiar pengganti dapat menyetujui atau menolak;
  - jika disetujui, override jadwal langsung dibuat dan status menjadi `approved`;
  - jika ditolak, status menjadi `rejected`.
- Membersihkan jalur lama approval admin:
  - status `pending_admin` dihapus dari tipe domain dan Firestore rules;
  - helper `getPendingSwapsForAdmin()` dihapus dari service tukar jadwal;
  - komponen `AdminVerificationPage` dihapus karena tidak lagi menjadi bagian alur produk.
- Merapikan label status pada halaman `Tukar Jadwal`:
  - pemohon melihat `Menunggu rekan penyiar`;
  - target pengganti melihat `Menunggu keputusan Anda`;
  - status selesai menampilkan `Disetujui, jadwal diperbarui` atau `Ditolak`.
- Verifikasi:
  - `npx eslint src\components\ScheduleSwapPage.tsx src\services\scheduleSwap.service.ts src\types\domain.ts` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil.
  - `npm run lint` penuh masih gagal karena debt lama lint lintas repo, terutama `scratch/*.mjs`, beberapa unused import/variable, dan beberapa `any` di file non-perubahan.

### Koreksi 17 Mei 2026 - Hardening Tombol Tukar Jadwal

- Memastikan ulang alur resmi tukar jadwal tetap tanpa antrean admin:
  - pemohon mengajukan request;
  - penyiar pengganti menyetujui atau menolak;
  - approval langsung membuat override jadwal dan status menjadi `approved`.
- Menambahkan fallback lokal di `scheduleSwap.service.ts` untuk mode test/demo atau saat Firestore belum siap/permission/offline:
  - request tersimpan ke `localStorage`;
  - riwayat tetap bisa dibaca oleh pemohon dan target;
  - klik `Setujui` tetap mencatat override lokal agar UI tidak jatuh ke error.
- Memperkuat resolve nama penyiar pengganti agar mode lokal langsung memakai katalog penyiar lokal, bukan memaksa baca Firestore.
- Merapikan label form halaman `Tukar Jadwal` dengan `htmlFor`/`id` agar input tanggal, pilihan slot, pilihan penyiar, dan alasan bisa diakses aman oleh user maupun Playwright.
- Menambahkan smoke test `src/e2e/schedule-swap.smoke.spec.ts`:
  - seed sesi demo pemohon;
  - kirim request tukar jadwal;
  - ganti sesi ke penyiar pengganti;
  - klik `Setujui`;
  - validasi status `approved` dan override tercatat.
- Verifikasi:
  - `npx eslint src\e2e\schedule-swap.smoke.spec.ts src\services\scheduleSwap.service.ts src\components\ScheduleSwapPage.tsx` berhasil.
  - `npm run typecheck` berhasil.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 2 test mobile/desktop lulus.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 6 test lulus.

### Koreksi 17 Mei 2026 - Notifikasi Target Tukar Jadwal

- Memperbaiki kasus pengajuan sudah muncul di sisi pemohon, tetapi tidak muncul sebagai notifikasi/permintaan masuk di pihak penyiar pengganti.
- Akar masalah:
  - request bisa menyimpan `targetAnnouncerId` sebagai ID penyiar/WA seperti `wa-085...`, sementara akun login penyiar memakai UID Firebase berbeda;
  - query lama hanya mencari `targetAnnouncerId == session.user.id`.
- Perbaikan:
  - `ScheduleSwapRequest` menambahkan metadata `requesterAliases` dan `targetAnnouncerAliases`;
  - `createSwapRequest` mengisi alias dari UID, nomor WA, `wa-{nomor}`, `airName`, `displayName`, `employeeId`, dan `announcerNames`;
  - `getMySwapRequests(session.user)` mencari berdasarkan UID, alias target, dan fallback kompatibel untuk request lama yang belum punya alias;
  - label `PERMINTAAN MASUK` kini dihitung dengan helper `isIncomingScheduleSwap`, sehingga pemohon tidak salah dianggap target;
  - badge notifikasi `Shell` mendengarkan beberapa alias target dan menghitung hanya status `pending_target`;
  - alias disimpan dalam bentuk asli dan lowercase, sedangkan query produksi memakai alias yang bisa dibuktikan oleh rules (`uid`, WhatsApp, `wa-{nomor}`, nama udara, nama tampil, employeeId);
  - listener notifikasi diberi error handler agar permission/index issue tidak memecah UI;
  - Firestore rules mengizinkan read/update target berdasarkan alias penyiar.
- Verifikasi:
  - `npx eslint src\services\scheduleSwap.service.ts src\components\ScheduleSwapPage.tsx src\components\BroadcastSchedulePage.tsx src\components\Shell.tsx src\e2e\schedule-swap.smoke.spec.ts src\types\domain.ts` berhasil.
  - `npm run typecheck` berhasil.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 2 test mobile/desktop lulus.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 6 test lulus.
- Deploy produksi:
  - `npx firebase-tools deploy --only firestore:rules --project radiosbl` berhasil.
  - Ruleset Firestore: `projects/radiosbl/rulesets/04dd2099-8f27-44b7-ad50-d0a729f8534f`.
  - `npx firebase-tools deploy --only hosting --project radiosbl` berhasil.
  - Hosting version: `projects/671712527716/sites/radiosbl/versions/b6f33bd4656b2756`.
  - Hosting release: `projects/671712527716/sites/radiosbl/channels/live/releases/1779024707949000`.
  - Verifikasi publik `https://radiosbl.web.app/?v=schedule-swap-alias-20260517` merespons HTTP 200 dan memuat bundle `index-WiyIZXia`.

### Koreksi 17 Mei 2026 - Audit Lanjutan Tukar Jadwal Produksi

- Audit lanjutan dilakukan setelah laporan pengguna bahwa alur masih belum berhasil.
- Akar risiko produksi yang ditemukan:
  - approval membuat schedule override dengan `createdBy` dari `targetAnnouncerId`, padahal rules mewajibkan `createdBy == request.auth.uid`;
  - sebagian profil penyiar memakai UID Firebase berbeda dari ID WA/penyiar, sehingga target perlu dibuktikan lewat alias;
  - query alias yang berjalan paralel bisa gagal total kalau satu query terkena `permission-denied`;
  - badge notifikasi hanya mendengarkan `targetAnnouncerAliases`, sehingga request lama yang hanya punya `targetAnnouncerId` masih bisa luput.
- Perbaikan:
  - `updateSwapStatus` sekarang menerima aktor login dan approval menyimpan override dengan `createdBy` UID akun yang menyetujui;
  - `ScheduleSwapPage` meneruskan `session.user` saat klik `Setujui` atau `Tolak`;
  - query daftar permintaan memakai helper recoverable sehingga satu query alias yang gagal tidak menjatuhkan seluruh daftar;
  - query alias resmi menambahkan `announcerNames` agar cocok dengan profil penyiar hasil sinkronisasi;
  - badge notifikasi `Shell` ikut membaca request legacy berbasis `targetAnnouncerId`;
  - Firestore rules diperkuat agar field opsional aman dicek dengan guard, menerima bukti `announcerNames`, dan approval target hanya valid dari status `pending_target`;
  - jalur admin lama tetap tidak dipakai sebagai alur resmi.
- Verifikasi:
  - `npx eslint src\services\scheduleSwap.service.ts src\components\ScheduleSwapPage.tsx src\components\BroadcastSchedulePage.tsx src\components\Shell.tsx src\e2e\schedule-swap.smoke.spec.ts src\types\domain.ts` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil dan menghasilkan bundle `index-B1MP49Pk.js`.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 2 test mobile/desktop lulus.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 6 test lulus.
- Deploy produksi:
  - `npx firebase-tools deploy --only firestore:rules --project radiosbl` berhasil.
  - Ruleset Firestore: `projects/radiosbl/rulesets/9d8f86da-39af-4daa-8726-1ea28068bc80`.
  - `npx firebase-tools deploy --only hosting --project radiosbl` berhasil.
  - Hosting version: `projects/671712527716/sites/radiosbl/versions/9cc4e1064aa784ec`.
  - Hosting release: `projects/671712527716/sites/radiosbl/channels/live/releases/1779026090645000`.
  - Verifikasi publik `https://radiosbl.web.app/?v=schedule-swap-direct-fix-20260517` merespons HTTP 200 dan memuat bundle `index-B1MP49Pk.js`.
- Catatan operasional:
  - Request yang dibuat sebelum patch alias mungkin perlu dikirim ulang jika dokumen lamanya tidak memiliki alias dan `targetAnnouncerId` tidak cocok dengan UID/WA target.
  - Jika target masih tidak melihat permintaan baru, cek dokumen `users/{uid}` target: minimal `active: true`, role penyiar/admin, serta `whatsapp`, `airName`, atau `announcerNames` harus sesuai data penyiar.

### Koreksi 17 Mei 2026 - Audit Tanggal Tukar Jadwal

- Audit dilakukan karena alur lama pernah berhasil saat hanya memilih jadwal program, lalu rawan berubah setelah field `Tanggal Tukar` ditambahkan.
- Perbaikan:
  - `targetDate` sekarang wajib dinormalisasi di `scheduleSwap.service.ts` dengan format `YYYY-MM-DD`;
  - request tanpa tanggal valid langsung gagal sebelum disimpan, sehingga tidak diam-diam memakai tanggal hari ini;
  - approval jadwal memakai `targetDate` yang dipilih sebagai tanggal `scheduleOverrides.date`;
  - Firestore rules mewajibkan `targetDate` pada payload `schedule_swaps`;
  - smoke test Playwright diperketat untuk memverifikasi tanggal muncul di pemohon, muncul di target, tersimpan sebagai `swap.targetDate`, dan override memakai tanggal yang sama.
- Simulasi mandiri:
  - pemohon `Miah` memilih tanggal `2026-05-18`;
  - memilih slot siaran pada hari Senin;
  - mengirim ke `Amar`;
  - sesi target `Amar` melihat permintaan masuk pada tanggal yang sama;
  - target klik `Setujui`;
  - test memastikan status `approved`, `override.date == 2026-05-18`, dan `createdBy` adalah UID target.
- Verifikasi:
  - `npx eslint src\services\scheduleSwap.service.ts src\components\ScheduleSwapPage.tsx src\components\BroadcastSchedulePage.tsx src\components\Shell.tsx src\e2e\schedule-swap.smoke.spec.ts src\types\domain.ts` berhasil.
  - `npm run typecheck` berhasil.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 2 test mobile/desktop lulus.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-DfA9pxwY.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 6 test lulus.
- Deploy produksi:
  - Ruleset Firestore: `projects/radiosbl/rulesets/318ceb7d-9a79-489d-b95f-fc179ddd36fa`.
  - Hosting version: `projects/671712527716/sites/radiosbl/versions/81eb98a19cbde785`.
  - Hosting release: `projects/671712527716/sites/radiosbl/channels/live/releases/1779026626565000`.
  - Verifikasi publik `https://radiosbl.web.app/?v=schedule-swap-date-fix-20260517` merespons HTTP 200 dan memuat bundle `index-DfA9pxwY.js`.
- Catatan operasional:
  - request lama yang dibuat sebelum field tanggal diwajibkan sebaiknya dikirim ulang, karena approval baru sengaja tidak memakai fallback tanggal hari ini.

### Koreksi 17 Mei 2026 - WhatsApp Konfirmasi Tukar Jadwal

- Menambahkan notifikasi WhatsApp untuk penyiar pengganti saat request tukar jadwal dibuat.
- Perbaikan:
  - service tukar jadwal menambahkan `submitSwapRequest()` yang menyimpan request, membuat teks WA, membuat link konfirmasi, dan mencoba mengirim via `sendWhatsAppNotification`;
  - isi pesan WA memuat pemohon, tanggal tukar, jadwal/program, alasan, dan link konfirmasi;
  - link konfirmasi memakai `?page=scheduleSwap&swapId=...` agar penyiar pengganti diarahkan ke halaman Tukar Jadwal setelah login;
  - jika proxy WhatsApp aktif, pesan dikirim otomatis;
  - jika proxy belum aktif, UI membuka draft WhatsApp `wa.me/api.whatsapp.com` agar pemohon bisa mengirim manual;
  - alur dari halaman `Tukar Jadwal` dan modal tukar di halaman `Jadwal` sama-sama memakai jalur baru ini.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\App.tsx src\services\scheduleSwap.service.ts src\components\ScheduleSwapPage.tsx src\components\BroadcastSchedulePage.tsx src\e2e\schedule-swap.smoke.spec.ts src\services\whatsappNotification.service.ts` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-ZW2RNGDI.js`.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 2 test mobile/desktop lulus; test memastikan draft WhatsApp berisi nomor target, teks permintaan, dan `page=scheduleSwap`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 6 test lulus.
- Deploy produksi:
  - Hosting version: `projects/671712527716/sites/radiosbl/versions/ee8ccd9fa25ed8aa`.
  - Hosting release: `projects/671712527716/sites/radiosbl/channels/live/releases/1779027381112000`.
  - Verifikasi publik `https://radiosbl.web.app/?v=schedule-swap-wa-link-20260517` merespons HTTP 200 dan memuat bundle `index-ZW2RNGDI.js`.
- Catatan operasional:
  - Pengiriman otomatis penuh membutuhkan `VITE_WHATSAPP_PROXY_ENDPOINT` mengarah ke proxy WhatsApp dan secret WhatsApp Cloud API aktif; tanpa itu, fallback draft WhatsApp tetap berjalan.

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

### Koreksi 17 Mei 2026 - Realtime Tukar Jadwal

- Menjawab catatan pengguna bahwa permintaan/jawaban tukar jadwal sebelumnya sudah bekerja, tetapi perlu refresh untuk melihat notifikasi dan status.
- Perbaikan:
  - `scheduleSwap.service.ts` menambahkan `subscribeMySwapRequests()` berbasis Firestore `onSnapshot`;
  - subscription membaca request sebagai pemohon, target UID, target alias, dan request legacy berbasis `targetAnnouncerId`;
  - hasil beberapa listener digabung dan dideduplikasi agar daftar tidak dobel;
  - error query alias yang recoverable tidak menjatuhkan seluruh halaman;
  - mode lokal/demo memakai event `sbl_schedule_swaps_changed` dan `storage` agar dua tab Playwright bisa melihat perubahan tanpa reload;
  - `ScheduleSwapPage` kini memakai subscription realtime, bukan memuat ulang manual setelah submit/approve;
  - target melihat `Menunggu keputusan Anda` segera setelah pemohon mengirim;
  - pemohon melihat `Disetujui, jadwal diperbarui` atau `Ditolak` segera setelah target menjawab.
- Alur resmi tetap sama:
  - pemohon -> penyiar pengganti setuju/tolak -> jika setuju jadwal langsung diperbarui;
  - tidak ada antrean/approval admin.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\services\scheduleSwap.service.ts src\components\ScheduleSwapPage.tsx src\e2e\schedule-swap.smoke.spec.ts` berhasil.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 4 test lulus termasuk simulasi realtime tanpa refresh.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-DKEk9RuI.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 8 test lulus.
- Deploy produksi:
  - `npx firebase-tools deploy --only hosting --project radiosbl` berhasil.
  - Hosting version: `projects/671712527716/sites/radiosbl/versions/15e9dd744eb09045`.
  - Hosting release: `projects/671712527716/sites/radiosbl/channels/live/releases/1779028062546000`.
  - Verifikasi publik `https://radiosbl.web.app/?v=schedule-swap-realtime-20260517` merespons HTTP 200 dan memuat bundle `index-DKEk9RuI.js`.
- Catatan:
  - Firestore rules tidak dideploy ulang untuk perubahan realtime ini karena tidak ada perubahan rules setelah patch tanggal/alias terakhir.

### Koreksi 17 Mei 2026 - Fondasi UI Arahan_UI Batch 1

- Fokus mengikuti `docs/ARAHAN_UI.md`: presentation layer, bukan rebuild sistem.
- Perbaikan:
  - bottom navigation mobile dikunci menjadi 5 item: `Beranda`, `Jadwal`, `Absensi`, `Request`, dan `Menu`;
  - halaman baru `Menu Lengkap` ditambahkan untuk menampung fitur lain tanpa menghilangkan akses user lama;
  - `Menu Lengkap` memakai grup Operasional, Siaran, Konten, Administrasi, dan Sistem;
  - sidebar desktop dikelompokkan ulang dengan struktur yang sama agar tidak berupa daftar panjang;
  - badge notifikasi tukar jadwal tetap tampil lewat tombol `Menu` mobile dan tile `Tukar Jadwal`;
  - token CSS awal ditambahkan untuk `.ui-card`, `.ui-button`, dan `.ui-badge`;
  - test e2e login/navigation ditambah untuk memastikan bottom nav mobile 5 item, menu lengkap terbuka, sidebar desktop berkelompok, dan tidak ada overflow horizontal;
  - test tukar jadwal disesuaikan agar pada mobile membuka `Tukar Jadwal` lewat `Menu Lengkap`, tanpa mengubah flow resmi atau service.
- Batasan:
  - tidak ada perubahan schema Firebase, service utama, auth, role, absensi, jadwal, request lagu, Google Drive, atau AI.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\data\radioData.ts src\components\Shell.tsx src\components\MenuPage.tsx src\App.tsx src\e2e\login.smoke.spec.ts src\e2e\schedule-swap.smoke.spec.ts` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-B5oAHb4b.js`.
  - `npx playwright test login.smoke.spec.ts` berhasil, 6 test lulus.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 4 test lulus.

### Koreksi 17 Mei 2026 - Dashboard Mobile Arahan_UI Batch 2

- Fokus mengikuti `docs/ARAHAN_UI.md`: Dashboard mobile harus menjawab "Apa yang harus saya lakukan sekarang?".
- Perbaikan:
  - menambahkan papan aksi utama setelah player ON AIR;
  - papan aksi menampilkan `Jadwal saya hari ini`, `Absensi`, `Request lagu`, dan `Notifikasi penting`;
  - kartu jadwal pribadi mencari slot hari ini yang cocok dengan `airName`, `displayName`, atau awalan email user;
  - kartu absensi membaca record hari ini dari data yang sudah tersedia di App, tanpa query/service baru;
  - aksi cepat mengarah ke halaman resmi: Jadwal, Absensi, Request, dan Menu Lengkap;
  - layout mobile satu kolom, desktop dua kolom, dengan tipografi lebih ringkas.
- Batasan:
  - tidak ada perubahan Firebase schema, auth, role, service absensi, service jadwal, atau business logic.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx src\e2e\login.smoke.spec.ts` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-Drfdizqp.js`.
  - `npx playwright test login.smoke.spec.ts` berhasil, 6 test lulus.

### Koreksi 17 Mei 2026 - Absensi Mobile Arahan_UI Batch 3

- Fokus mengikuti `docs/ARAHAN_UI.md`: halaman Absensi mobile harus sangat jelas untuk status hari ini, lokasi/GPS, selfie, check-in, dan check-out.
- Perbaikan:
  - menambahkan ringkasan atas `Status hari ini`, `Lokasi dan GPS`, dan `Bukti selfie`;
  - ringkasan berubah sesuai kondisi check-in, check-out, jarak kantor, akurasi GPS, dan upload selfie;
  - copy halaman diperjelas agar user paham langkah absen tanpa membaca istilah teknis;
  - label tipe absensi diperluas untuk status di luar radius/perlu tinjau/rejected;
  - error check-out tidak lagi memakai `alert()`, diganti pesan inline ramah user;
  - type `AttendanceType` ditambahkan agar pilihan status tidak memakai `any`;
  - teks akurasi GPS memakai ASCII `+/-` agar aman lint/build.
- Batasan:
  - tidak ada perubahan algoritma absensi, lokasi, radius, AI selfie, upload Google Drive, Firestore schema, rules, atau service.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\AttendancePage.tsx src\components\DashboardPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-1m8Aj1mq.js`.
  - `npx playwright test login.smoke.spec.ts` berhasil, 6 test lulus.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 4 test lulus.

### Koreksi 17 Mei 2026 - Jadwal Siaran Mobile Arahan_UI Batch 4

- Fokus mengikuti `docs/ARAHAN_UI.md`: jadwal siaran tidak terasa seperti tabel statis dan program tentative harus dibedakan dari program utama.
- Perbaikan:
  - menambahkan ringkasan tanggal berisi hari/tanggal, jumlah slot, dan program live jika ada;
  - menambahkan empty state manusiawi saat tanggal yang dipilih belum memiliki jadwal;
  - menstandarkan status slot: `Reguler`, `Sedang Berjalan`, `Pengganti`, `Khusus`, `Tentative`, `Tentative Aktif`, dan `Dibatalkan`;
  - program dengan format `Program A / Program B` dipisahkan menjadi program utama dan baris `Tentative`, bukan ditampilkan sebagai satu judul utama;
  - detail program memakai program utama agar cover/deskripsi tidak salah karena judul gabungan;
  - styling mobile diperketat agar ringkasan dan card tetap satu kolom, ringkas, dan mudah dipindai.
- Batasan:
  - tidak ada perubahan business logic jadwal, service jadwal, rules, schema Firebase, atau flow tukar jadwal.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\BroadcastSchedulePage.tsx src\components\AttendancePage.tsx src\components\DashboardPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-Dxrgnxoh.js`.
  - `npx playwright test login.smoke.spec.ts` berhasil, 6 test lulus.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 4 test lulus.

### Koreksi 17 Mei 2026 - Request Lagu Mobile Arahan_UI Batch 5

- Fokus mengikuti `docs/ARAHAN_UI.md`: Request Lagu harus terasa realtime, berbasis card, dan mudah diproses dengan satu tangan.
- Perbaikan:
  - halaman `Request Lagu` dibungkus ulang menjadi card-based UI tanpa mengubah service request lagu;
  - request dikelompokkan menjadi `Masuk sekarang`, `Siap diputar`, dan `Riwayat`;
  - ringkasan atas menampilkan jumlah request masuk, antrean, dan selesai;
  - setiap kartu menampilkan pengirim, lagu/artis, nomor WhatsApp, pesan, status, dan tombol cepat;
  - aksi cepat tetap memakai status existing: simpan ke antrean, tandai diputar, balas WhatsApp, dan tolak;
  - empty state dibuat lebih manusiawi untuk tiap kelompok;
  - styling mobile dibuat satu kolom dengan tombol full-width agar aman di layar kecil.
- Perbaikan test:
  - smoke test tukar jadwal diperketat agar cek tanggal pada kartu permintaan/status yang tepat, bukan dropdown.
- Batasan:
  - tidak ada perubahan business logic request lagu, Firestore schema, rules, service, atau integrasi WhatsApp.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\SongRequestsPage.tsx src\components\BroadcastSchedulePage.tsx src\components\AttendancePage.tsx src\components\DashboardPage.tsx src\components\Shell.tsx src\components\MenuPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-5N8Rzx4u.js`.
  - `npx playwright test login.smoke.spec.ts` berhasil, 6 test lulus.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 4 test lulus setelah locator test diperketat.

### Koreksi 17 Mei 2026 - Buat Naskah AI Mobile Arahan_UI Batch 6

- Fokus mengikuti `docs/ARAHAN_UI.md`: Buat Naskah AI mobile harus menampilkan kontrol utama dulu, hasil mudah diedit, dan aksi salin/simpan jelas.
- Perbaikan:
  - tab workspace diganti menjadi komponen class-based yang konsisten dan lebih ringkas di mobile;
  - panel generator tetap memakai service `generateProgramScript`, `rewriteProgramScript`, `saveProgramScript`, dan `listProgramScripts` yang sudah ada;
  - tombol aksi hasil naskah dirapikan: `Salin`, `Teleprompter`, dan `Arsip`;
  - fitur salin naskah ditambahkan via clipboard dengan pesan sukses/error ramah user;
  - opsi rewrite diringkas menjadi bar kecil yang tidak membuat layout melebar;
  - statistik naskah dipindah ke grid konsisten: jumlah kata, estimasi baca, dan karakter;
  - arsip draft diganti menjadi card list responsif dengan empty state lebih jelas;
  - placeholder review/siap siaran dibuat lebih rapi tanpa mengubah status/flow arsip.
- Batasan:
  - tidak ada perubahan service AI, prompt backend, provider Gemini, Firestore schema, atau struktur data draft naskah.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\AiScriptPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-IKJGTv0L.js`.
  - `npx playwright test login.smoke.spec.ts` berhasil, 6 test lulus.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 4 test lulus.

### Koreksi 17 Mei 2026 - Manajemen User Mobile Arahan_UI Batch 7

- Fokus mengikuti `docs/ARAHAN_UI.md`: Manajemen User mobile dipakai untuk aksi cepat, sedangkan desktop tetap mendukung tabel detail.
- Perbaikan:
  - menambahkan daftar user versi mobile berbentuk card, sehingga layar kecil tidak dipaksa memakai tabel horizontal;
  - setiap card menampilkan nama, air name/email, alert profil belum lengkap, ringkasan hadir/izin/terakhir absen, role, status, dan tombol detail;
  - aksi cepat mobile tetap memakai handler existing untuk ubah role dan aktif/nonaktif user;
  - desktop table tetap dipertahankan agar workflow lama admin tidak hilang;
  - CSS mobile menyembunyikan tabel pada layar kecil dan menampilkan card list dengan tombol minimum 42px;
  - import dan catch lama yang tidak terpakai dibersihkan agar lint file ini bersih.
- Batasan:
  - tidak ada perubahan role, permission, service user profile, Firestore schema, auth, atau logic sinkronisasi staf.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\UsersManagementPage.tsx src\components\AiScriptPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-aH4QwXmK.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.

### Koreksi 18 Mei 2026 - Streaming dan Liputan Arahan_UI Batch 8

- Fokus mengikuti `docs/ARAHAN_UI.md`: modul Streaming dan Liputan/Reporter masuk Prioritas 3, dengan target mobile lebih rapi tanpa mengubah service.
- Perbaikan Streaming:
  - style lokal di `StreamingPage` dipindahkan ke `app.css` agar konsisten dengan design system;
  - menambahkan ringkasan siaran `Status`, `Program`, dan `Penyiar` di atas player;
  - keyframes visualizer/player dipindahkan ke stylesheet global;
  - audio context, metadata, play/pause, volume, dan request lagu tidak diubah.
- Perbaikan Liputan:
  - menambahkan ringkasan status liputan: `Ditugaskan`, `Berjalan`, dan `Review`;
  - card liputan diberi class khusus agar lebih stabil di mobile;
  - tombol upload bukti dibuat lebih mudah ditekan di mobile;
  - import lama yang tidak terpakai dibersihkan.
- Batasan:
  - tidak ada perubahan upload Google Drive, service request lagu, service liputan, data mock liputan, audio context, atau schema Firebase.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\StreamingPage.tsx src\components\CoveragePage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-CJuoVUGb.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.

### Koreksi 18 Mei 2026 - Live/OB Arahan_UI Batch 9

- Fokus mengikuti `docs/ARAHAN_UI.md`: modul OB/Liputan perlu terasa operasional di mobile, dengan checklist, form event, dan rundown yang mudah dipindai.
- Perbaikan:
  - menambahkan ringkasan Live/OB: progres checklist, jumlah event, dan status event aktif;
  - checklist alat dipindahkan ke class CSS dan dibuat sebagai baris aksi stabil dengan state `done`;
  - form jadwal Live/OB dipindahkan ke class CSS dengan input dan tombol yang lebih konsisten;
  - tombol `Kirim ke Grup WA` tetap memakai alur lama, hanya distandarkan tampilannya;
  - rundown event aktif dipindahkan ke card class-based dengan link Discord/YouTube yang mudah ditekan;
  - layout mobile dibuat satu kolom dan link event full-width bila ruang sempit.
- Batasan:
  - tidak ada perubahan `liveOb.service`, schema `LiveEvent`, notifikasi WhatsApp, data checklist, atau logic pembuatan event.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\LiveObPage.tsx src\components\CoveragePage.tsx src\components\StreamingPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-c6vjBXmB.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.

### Koreksi 18 Mei 2026 - Tukar Jadwal Arahan_UI Batch 10

- Fokus mengikuti `docs/ARAHAN_UI.md` sambil menjaga alur resmi tukar jadwal: pemohon mengirim ke penyiar pengganti, penyiar pengganti setuju/tolak, dan jika setuju jadwal langsung diperbarui tanpa antrean admin.
- Perbaikan:
  - halaman `Tukar Jadwal` dipindahkan dari inline style besar menjadi class-based UI yang konsisten dengan halaman lain;
  - menambahkan ringkasan atas untuk `Permintaan masuk`, `Menunggu rekan`, dan `Selesai`;
  - form pengajuan dibuat lebih stabil di mobile dengan field, helper text, tombol submit, warning jadwal kosong, dan pesan error inline;
  - kartu riwayat/permintaan masuk dibuat lebih mudah dipindai dengan badge jenis permintaan, status, tanggal, target/pemohon, alasan, dan tombol `Setujui`/`Tolak`;
  - `alert()` pada gagal kirim/gagal tanggapi diganti pesan inline agar klik tombol tidak terasa error mendadak di mobile;
  - teks ringkasan disesuaikan agar tidak bentrok dengan locator smoke test status resmi di kartu permintaan.
- Batasan:
  - tidak ada perubahan `scheduleSwap.service`, Firestore schema/rules, logic WhatsApp, realtime subscription, status swap, atau flow approval admin lama.
  - tidak ada jalur admin baru; alur tetap langsung antar penyiar.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\ScheduleSwapPage.tsx src\e2e\schedule-swap.smoke.spec.ts` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-Cc7s19Ib.js`.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 4 test lulus.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Build masih menampilkan warning Vite dynamic/static import lama; bukan error dan tidak terkait perubahan batch ini.

### Koreksi 18 Mei 2026 - Laporan Absensi Arahan_UI Batch 11

- Fokus mengikuti `docs/ARAHAN_UI.md`: laporan admin tetap kuat di desktop, tetapi tidak memaksa mobile membaca tabel horizontal.
- Perbaikan:
  - halaman `Rekap Kehadiran Staf` dipindahkan ke layout class-based dengan hero, tabs, filter panel, stat cards, panel tabel, dan drawer detail;
  - tab `Ringkasan`, `Harian`, `Penyiar / Staf`, dan `Izin & Cuti` tetap memakai data/filter lama;
  - tampilan mobile ditambahkan sebagai card list untuk rekap staf, daftar harian, dan izin/cuti;
  - tabel desktop tetap dipertahankan untuk workflow admin detail;
  - drawer detail absensi dirapikan dengan section selfie, lokasi/waktu, device, dan aksi validasi admin;
  - `alert()` pada gagal validasi admin diganti notice inline, dan validasi sukses juga memberi feedback inline;
  - teks akurasi lokasi memakai ASCII `+/-` agar aman lint/build.
- Batasan:
  - tidak ada perubahan `attendance.service`, `listAttendanceRecords`, `updateAttendanceStatus`, algoritma absensi, Firebase schema/rules, atau format CSV.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\AttendanceReportPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-BhZ7T8P0.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Build masih menampilkan warning Vite dynamic/static import lama; bukan error dan tidak terkait perubahan batch ini.

### Koreksi 18 Mei 2026 - Dashboard Premium Polish Batch 12

- Fokus mengikuti `docs/LANJUTAN_UI.md`: refinement over decoration, dashboard lebih tenang, scanable, dan bebas inline style besar.
- Perbaikan:
  - `DashboardPage` dipindahkan ke struktur class-based untuk topbar, radio player, action board, menu, panel jadwal, podcast, dan profile sheet;
  - radio player tetap memakai visualizer lama, tetapi markup lebih bersih dan cover/status/on-air lebih stabil di mobile;
  - menu dashboard tidak lagi memakai wrapper inline besar, dan section dashboard memakai panel reusable;
  - bottom sheet profil dipindahkan ke class CSS dan tombol keluar tidak lagi memakai `confirm()`;
  - konfirmasi logout sekarang tampil inline di profile sheet dengan tombol `Batal` dan `Keluar`;
  - tombol ikon dashboard tetap diberi `aria-label` agar smoke test aksesibilitas tetap aman;
  - responsif mobile disesuaikan agar player, panel, dan sheet profil tidak melebar atau tertutup bottom nav.
- Batasan:
  - tidak ada perubahan `useGlobalAudio`, metadata streaming, role/permission, navigasi page key, service jadwal, data absensi, atau algoritma jadwal berikutnya.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-b_-f2ZgO.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Build masih menampilkan warning Vite dynamic/static import lama; bukan error dan tidak terkait perubahan batch ini.

### Koreksi 18 Mei 2026 - Lanjutan Cleanup Inline UI Batch 13

- Fokus mengikuti `docs/LANJUTAN_UI.md`: menyelesaikan sisa inline style dan popup browser pada halaman yang disebut user.
- Perbaikan:
  - `AttendancePage` dipindahkan ke class-based UI untuk modal izin lokasi, modal kamera/selfie, panel status, form absensi, notice error, receipt check-in, check-out, dan info card;
  - `UsersManagementPage` dipindahkan ke struktur class-based untuk header, summary, tab, tabel desktop, card mobile, drawer detail, form edit, notice, dan dialog konfirmasi;
  - `alert()`/`confirm()` di `UsersManagementPage` diganti notice dan dialog konfirmasi internal untuk sinkronisasi staf serta reset sandi;
  - teleprompter `AiScriptPage` dipindahkan dari inline style besar ke class CSS untuk toolbar, tombol speed/play, area scroll, naskah, dan garis fokus;
  - `CoveragePage` dibersihkan dari sisa inline kecil pada panel, search bar, card, status, upload, dan empty state;
  - `StreamingPage` dibersihkan dari inline besar pada header, visual player, metadata, tombol play, volume, history card, tombol request, form, dan alert request;
  - `BroadcastSchedulePage` tidak lagi memakai `alert()` saat gagal mengirim tukar jadwal dari halaman jadwal, melainkan `scheduleNotice` inline;
  - sisa inline date picker, default slot text, dan helper modal di `BroadcastSchedulePage` dipindahkan ke class CSS.
- Batasan:
  - tidak ada perubahan service, schema/rules Firebase, role/permission, algoritma absensi, logic AI, upload Google Drive, audio context, request lagu, atau flow tukar jadwal;
  - alur resmi tukar jadwal tetap: pemohon -> penyiar pengganti setuju/tolak -> jika setuju jadwal langsung diperbarui, tanpa antrean admin.
- Verifikasi:
  - `rg -n "style=|alert\\(|confirm\\(" src/components/AttendancePage.tsx src/components/UsersManagementPage.tsx src/components/AiScriptPage.tsx src/components/CoveragePage.tsx src/components/StreamingPage.tsx src/components/BroadcastSchedulePage.tsx` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\AttendancePage.tsx src\components\UsersManagementPage.tsx src\components\AiScriptPage.tsx src\components\CoveragePage.tsx src\components\StreamingPage.tsx src\components\BroadcastSchedulePage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-DnnbzAVW.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Build masih menampilkan warning Vite dynamic/static import lama; bukan error dan tidak terkait perubahan batch ini.

### Koreksi 18 Mei 2026 - Global Inline UI Sweep Batch 14

- Fokus melanjutkan `docs/LANJUTAN_UI.md`: menyisir sisa inline style/global popup setelah batch halaman besar selesai.
- Perbaikan:
  - `ProfilePage` dipindahkan ke UI class-based untuk topbar, tab, hero profil, form akun, filter absensi, stat cards, daftar absensi, empty/loading state, dan link maps;
  - `Shell` dibersihkan dari inline style pada sidebar item, tombol notifikasi, badge, session user, prompt izin audio, dan badge bottom nav;
  - `SplashPage` tidak lagi memakai inline delay/keyframes lokal; animasi wave/equalizer dipindahkan ke CSS;
  - `LoginPage` tidak lagi memakai blok `<style>` lokal untuk logo/showcase dan wrapper logo mobile;
  - `Waveform` dipindahkan ke kelas bar/speed tetap agar tidak menyisakan inline style dinamis;
  - `DashboardPage` menu shortcut tidak lagi memakai inline CSS variable, diganti tone class;
  - `AttendanceReportPage` progress rasio memakai elemen `progress`, bukan width inline;
  - `App` loading fallback dan `AnnouncerProfilePage` cursor statis dipindahkan ke class CSS;
  - scan global `src` untuk `style=`, `<style>`, `alert()`, dan `confirm()` sudah bersih.
- Batasan:
  - tidak ada perubahan service, Firebase schema/rules, role/permission, audio context, algoritma jadwal, algoritma absensi, logic login, atau alur tukar jadwal;
  - alur resmi tukar jadwal tetap: pemohon -> penyiar pengganti setuju/tolak -> jika setuju jadwal langsung diperbarui, tanpa antrean admin.
- Verifikasi:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\App.tsx src\components\LoginPage.tsx src\components\Waveform.tsx src\components\AnnouncerProfilePage.tsx src\components\AttendanceReportPage.tsx src\components\DashboardPage.tsx src\components\Shell.tsx src\components\SplashPage.tsx src\components\ProfilePage.tsx src\components\LiveObPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-B-iEOwMK.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Build masih menampilkan warning Vite dynamic/static import lama; bukan error dan tidak terkait perubahan batch ini.

### Koreksi 18 Mei 2026 - Microinteraction & Skeleton Loading Batch 15

- Fokus melanjutkan `docs/LANJUTAN_UI.md`: refinement over decoration untuk feedback interaksi, aksesibilitas fokus, disabled state, reduced motion, dan loading experience.
- Perbaikan:
  - menambahkan token global `--focus-ring`, `--press-scale`, `--ease-out`, dan warna skeleton;
  - menambahkan focus ring konsisten untuk tombol, link, input, select, textarea, role button, dan elemen focusable;
  - menambahkan press feedback ringan pada tombol/link tanpa efek berlebihan;
  - disabled state global dibuat lebih jelas dan konsisten;
  - menambahkan reduced motion guard global untuk user yang memilih `prefers-reduced-motion`;
  - menambahkan utility skeleton `ui-skeleton`, `ui-skeleton-card`, `ui-skeleton-row`, dan `ui-skeleton-copy`;
  - loading daftar `UsersManagementPage`, `ScheduleSwapPage`, `ProfilePage`, dan `AttendanceReportPage` memakai skeleton ringan, bukan spinner-only;
  - ukuran skeleton disesuaikan agar tetap stabil di panel desktop/mobile.
- Batasan:
  - tidak ada perubahan service, Firebase schema/rules, role/permission, auth, schedule swap logic, query data, atau workflow produksi;
  - alur tukar jadwal tetap langsung: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.
- Verifikasi:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\UsersManagementPage.tsx src\components\ScheduleSwapPage.tsx src\components\ProfilePage.tsx src\components\AttendanceReportPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-BbmO8nDt.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Build masih menampilkan warning Vite dynamic/static import lama; bukan error dan tidak terkait perubahan batch ini.

### Koreksi 18 Mei 2026 - Menu Search & Quick Actions Batch 16

- Fokus melanjutkan `docs/LANJUTAN_UI.md` bagian Universal Search & Quick Action tanpa mengubah service atau workflow produksi.
- Perbaikan:
  - `MenuPage` memiliki pencarian cepat untuk fitur/menu berdasarkan label, grup, deskripsi, dan alias operasional seperti absen, jadwal, request, user, podcast, dan tukar jadwal;
  - hasil menu difilter per grup dan tetap menghormati permission/role existing;
  - empty state pencarian ditambahkan dengan bahasa manusia saat fitur tidak ditemukan;
  - quick actions kontekstual ditambahkan untuk fitur yang diizinkan user: absen, tukar jadwal, request, naskah, Live OB, dan liputan;
  - badge pending tukar jadwal tetap muncul pada quick action dan tile menu;
  - CSS menu search/quick action ditambahkan dengan responsif mobile dua kolom;
  - smoke test menu mobile diperluas untuk memvalidasi search, quick action, hasil filter, dan empty search state.
- Batasan:
  - tidak ada perubahan router, service, Firebase schema/rules, role/permission, auth, query data, atau flow produksi;
  - semua aksi tetap memakai `onNavigate` existing;
  - alur tukar jadwal tetap langsung: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.
- Verifikasi:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\MenuPage.tsx src\e2e\login.smoke.spec.ts` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-DSNqyDm_.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Build masih menampilkan warning Vite dynamic/static import lama; bukan error dan tidak terkait perubahan batch ini.

### Koreksi 18 Mei 2026 - Adaptive Dashboard Focus Batch 17

- Fokus melanjutkan `docs/LANJUTAN_UI.md` bagian Adaptive Operational UX, Smart Prioritization, dan One Screen One Focus.
- Perbaikan:
  - menambahkan panel `Fokus Operasional` di `DashboardPage` yang membaca konteks existing: jadwal user aktif, jadwal pribadi hari ini, status absensi hari ini, dan program berjalan;
  - mode dashboard sekarang memberi arahan ringan untuk `Persiapan siaran`, `Mode On-Air`, `Mode kerja aktif`, atau `Setelah siaran`;
  - panel menampilkan aksi berikutnya yang relevan lewat `onNavigate` existing: absen, request, absensi, atau profil;
  - visual tone panel berubah halus berdasarkan mode: prep, live, wrap, done;
  - CSS responsif ditambahkan agar panel tetap satu fokus di mobile dan tidak menambah overload dashboard.
- Batasan:
  - tidak ada perubahan service, Firebase schema/rules, role/permission, auth, query data, audio context, algoritma jadwal, atau workflow produksi;
  - semua aksi tetap memakai `onNavigate` existing;
  - alur tukar jadwal tetap langsung: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.
- Verifikasi:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-CxGcGf3l.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Build masih menampilkan warning Vite dynamic/static import lama; bukan error dan tidak terkait perubahan batch ini.

### Koreksi 18 Mei 2026 - Request Lagu Realtime Polish Batch 18

- Fokus melanjutkan `docs/LANJUTAN_UI.md` bagian Realtime Feeling, Loading Experience, dan Advanced Empty State pada modul Request Lagu.
- Perbaikan:
  - `SongRequestsPage` punya live strip ringkas untuk status antrean aktif/menunggu request;
  - live strip menampilkan request terbaru dan waktu masuk, plus tombol `Sinkronkan`;
  - kartu request menampilkan timestamp `Masuk HH.mm` dengan helper timestamp yang aman untuk Date/string/number dan objek Firestore-like;
  - loading tiap grup request menggunakan skeleton list, bukan hanya refresh icon;
  - empty state dan loading tetap per grup: Masuk sekarang, Siap diputar, Riwayat;
  - CSS live strip, timestamp, dan skeleton list ditambahkan dengan responsif mobile.
- Batasan:
  - tidak ada perubahan `songRequest.service`, status flow request, localStorage/Firestore schema, WhatsApp URL, auth, role/permission, atau workflow produksi;
  - aksi status tetap memakai `updateSongRequestStatus` existing.
- Verifikasi:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\SongRequestsPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-B_iW6vak.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Build masih menampilkan warning Vite dynamic/static import lama; bukan error dan tidak terkait perubahan batch ini.

### Koreksi 18 Mei 2026 - Penyiar Page Polish Batch 19

- Fokus melanjutkan polish halaman `Penyiar` sesuai `docs/LANJUTAN_UI.md`: scanability, quick search, empty state manusiawi, dan interaksi kartu yang jelas.
- Perbaikan:
  - halaman `Penyiar` kini memiliki pencarian cepat berdasarkan nama udara, nama lengkap, alias jadwal, hari, program, dan jam siaran;
  - panel kontrol ditambahkan untuk menampilkan roster aktif dan penyiar dengan slot terpadat tanpa mengubah sumber data;
  - kartu penyiar sekarang benar-benar membuka `Profil Penyiar` saat diklik, memakai callback navigasi existing;
  - kartu menampilkan jadwal pertama/slot berikutnya, status aktif, statistik hari/jam/slot, dan tombol visual `Lihat profil`;
  - empty state pencarian ditambahkan bila penyiar tidak ditemukan;
  - detail `Profil Penyiar` dipoles dengan badge frekuensi/status, ringkasan jadwal terdekat, chip hari siaran, dan slot dikelompokkan per hari;
  - CSS responsif ditambahkan untuk search, focus row, kartu, empty state, dan detail profil agar mobile tidak overflow.
- Batasan:
  - tidak ada perubahan service, Firebase schema/rules, role/permission, auth, query data, algoritma jadwal, atau workflow produksi;
  - alur tukar jadwal tetap langsung: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.
- Verifikasi:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\App.tsx src\components\AnnouncerProfilePage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap muncul sebagai warning, bukan error.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844 membuka `?page=announcers`, mengisi pencarian `Amar`, klik kartu `Buka profil Amar`, profil tampil, `scrollWidth=390`, `clientWidth=390`, dan tidak ada tombol tanpa label.

### Koreksi 18 Mei 2026 - Podcast Premium Polish Batch 20

- Fokus melanjutkan `docs/LANJUTAN_UI.md` bagian Advanced Media Feel, Loading Experience, Empty State, dan scanability pada halaman Podcast.
- Perbaikan:
  - `PodcastPage` punya panel ringkasan berisi jumlah episode/hasil pencarian, status feed, dan episode aktif;
  - status feed membedakan `Sinkronisasi feed`, `Feed terbaru`, dan `Fallback Spotify` tanpa mengubah loader/service;
  - loading feed memakai skeleton strip ringan sehingga daftar fallback tetap bisa dipakai sambil sinkronisasi berjalan;
  - player aktif menampilkan metadata tanggal/durasi atau fallback `SBL Podcast on Spotify`;
  - kartu episode pilihan dan episode lain menampilkan preview deskripsi agar lebih informatif;
  - empty state pencarian memiliki tombol `Kosongkan pencarian`;
  - CSS responsif ditambahkan untuk panel ringkasan, skeleton strip, metadata player, preview episode, dan empty state.
- Batasan:
  - tidak ada perubahan `podcast.service`, konfigurasi RSS/Spotify endpoint, embed URL, source URL, auth, role/permission, atau workflow produksi;
  - alur tukar jadwal tetap langsung: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.
- Verifikasi:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\PodcastPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap muncul sebagai warning, bukan error.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844 membuka `?page=podcast`, mencari `Guru`, memutar episode, mengetes empty search dan tombol `Kosongkan pencarian`, `scrollWidth=390`, `clientWidth=390`, dan tidak ada tombol tanpa label.

### Koreksi 18 Mei 2026 - Aduan Operational Polish Batch 21

- Fokus melanjutkan `docs/LANJUTAN_UI.md` bagian Smart Prioritization, Advanced Empty State, dan scanability pada halaman `Aduan & Saran`.
- Perbaikan:
  - menambahkan pencarian aduan berdasarkan pelapor, kategori, isi pesan, status, dan tanggal;
  - menambahkan filter status dan kategori tanpa mengubah sumber data atau service;
  - panel prioritas menampilkan jumlah aduan yang sedang terlihat, aduan yang butuh atensi, dan prioritas tindak lanjut berikutnya;
  - daftar aduan sekarang memakai hasil filter aktif, termasuk counter di header daftar;
  - empty state filter memiliki tombol `Reset filter`;
  - tiap tiket memiliki indikator progres `Baru -> Terverifikasi -> Diproses -> Selesai`;
  - CSS responsif ditambahkan untuk search, filter, focus row, progress tiket, dan tombol reset filter.
- Batasan:
  - tidak ada perubahan `complaint.service`, schema Firestore/localStorage, status flow aduan, role/permission, auth, atau workflow produksi;
  - aksi status tetap memakai `updateComplaintStatus` existing;
  - alur tukar jadwal tetap langsung: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.
- Verifikasi:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\ComplaintsPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap muncul sebagai warning, bukan error.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844 membuka `?page=complaints`, menguji pencarian kosong + `Reset filter`, submit laporan dummy, progress tiket tampil, `scrollWidth=390`, `clientWidth=390`, dan tidak ada tombol tanpa label.

### Koreksi 18 Mei 2026 - Profil Personalization Polish Batch 22

- Fokus melanjutkan `docs/LANJUTAN_UI.md` bagian Personalization, Role Personalization, dan scanability pada halaman `Profil Saya`.
- Perbaikan:
  - menambahkan panel `Kesiapan profil` dengan persentase kelengkapan data utama;
  - menambahkan ringkasan `Kontak operasional` dan `Akses akun` agar user cepat tahu status profil/role;
  - progress kelengkapan profil memakai elemen `progress` native, bukan inline width;
  - panel kesiapan responsif satu kolom di mobile;
  - memperbaiki kondisi simpan profil agar perubahan `airName` ikut tersimpan lewat `upsertUserProfile` existing.
- Batasan:
  - tidak ada perubahan `auth.service`, `userProfile.service`, Firestore schema/rules, role/permission, session flow, atau workflow produksi;
  - alur tukar jadwal tetap langsung: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.
- Verifikasi:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\ProfilePage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap muncul sebagai warning, bukan error.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844 membuka `?page=profile`, berpindah tab `Riwayat Absensi` dan `Informasi Akun`, panel kesiapan tampil 3 kartu, `scrollWidth=390`, `clientWidth=390`, dan tidak ada tombol tanpa label.

### Koreksi 18 Mei 2026 - Event Coverage Operational Polish Batch 23

- Fokus melanjutkan `docs/LANJUTAN_UI.md` bagian Adaptive Operational UX, Smart Prioritization, dan scanability pada halaman `Info Liputan`/Event.
- Perbaikan:
  - menambahkan filter status untuk tugas liputan tanpa membuat service baru;
  - pencarian diperluas agar mencakup judul, deskripsi, reporter, status, dan deadline;
  - ringkasan liputan menambahkan metrik `Hari ini`;
  - panel `Prioritas lapangan` menampilkan tugas yang paling perlu perhatian berdasarkan deadline dan status;
  - deadline dibuat human-friendly dan diberi state `today`/`overdue`;
  - empty state filter memiliki tombol `Reset filter`;
  - CSS responsif ditambahkan untuk command panel, filter, prioritas, deadline, dan empty state.
- Batasan:
  - tidak ada perubahan Google Drive upload, data mock liputan, Firestore schema/rules, auth, role/permission, atau workflow produksi;
  - halaman `CoveragePage` tetap belum menambah `coverage.service`;
  - alur tukar jadwal tetap langsung: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.
- Verifikasi:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\CoveragePage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap muncul sebagai warning, bukan error.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844 membuka `?page=coverage`, menguji pencarian kosong + `Reset filter`, mencari `UMKM`, summary 4 kartu dan prioritas tampil, `scrollWidth=390`, `clientWidth=390`, dan tidak ada tombol tanpa label.

### Koreksi 18 Mei 2026 - Live OB Readiness Polish Batch 24

- Fokus melanjutkan `docs/LANJUTAN_UI.md` bagian Adaptive Operational UX, On-Air readiness, dan Smart Prioritization pada halaman `Live / OB`.
- Perbaikan:
  - menambahkan panel kesiapan operasional Live/OB berisi progres checklist, status link siaran, dan event berikutnya;
  - progres checklist memakai elemen `progress` native, bukan inline width;
  - status link siaran membaca input YouTube/Discord yang sudah ada, tanpa mengubah payload event;
  - event berikutnya dihitung dari daftar event existing;
  - CSS responsif ditambahkan untuk readiness cards dan progress agar mobile satu kolom.
- Batasan:
  - tidak ada perubahan `liveOb.service`, schema `LiveEvent`, localStorage/Firestore flow, notifikasi WhatsApp, data checklist, atau logic pembuatan event;
  - alur tukar jadwal tetap langsung: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.
- Verifikasi:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\LiveObPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap muncul sebagai warning, bukan error.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844 membuka `?page=liveOb`, checklist ditoggle, link YouTube/Discord diisi, event dibuat, readiness 3 kartu dan rundown tampil, `scrollWidth=390`, `clientWidth=390`, dan tidak ada tombol tanpa label.

### Koreksi 18 Mei 2026 - Attendance Report Scanability Polish Batch 25

- Fokus melanjutkan `docs/LANJUTAN_UI.md` bagian scanability, smart prioritization, dan kenyamanan operator pada halaman `Rekap Absensi`.
- Perbaikan:
  - menambahkan pencarian rekap lintas nama, nama udara, email, role, status, tanggal, jam, alasan, dan catatan AI;
  - pencarian berlaku untuk daftar harian, izin/cuti, serta ringkasan staf tanpa mengubah query/service;
  - menambahkan panel fokus ringkasan berisi rasio tepat lokasi, jumlah catatan perlu atensi, dan status filter aktif;
  - catatan perlu atensi mengambil status existing seperti `needs_review`, `outside_radius`, `late`, `rejected`, izin, sakit, dan tugas luar;
  - empty state rekap memiliki tombol `Reset filter`;
  - CSS responsif ditambahkan untuk search field, focus cards, dan tombol reset agar mobile tetap satu kolom.
- Batasan:
  - tidak ada perubahan `attendance.service`, `userProfile.service`, Firestore schema/rules, role/permission, status absensi, validasi admin, atau workflow produksi;
  - export CSV tetap memakai hasil filter aktif existing;
  - alur tukar jadwal tetap langsung: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.
- Verifikasi:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\AttendanceReportPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap muncul sebagai warning, bukan error.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844 membuka `?page=attendanceReport`, menguji pencarian kosong + `Reset filter`, pindah tab `Harian`, pencarian `admin`, focus cards tampil 3, `scrollWidth=390`, `clientWidth=390`, dan tidak ada tombol tanpa label.

### Koreksi 18 Mei 2026 - Broadcast Schedule Operational Polish Batch 26

- Fokus melanjutkan `docs/LANJUTAN_UI.md` dan `docs/LANJUTAN_UI_2.md` bagian scanability, smart prioritization, dan operational intelligence pada halaman `Jadwal Siaran`.
- Perbaikan:
  - menambahkan pencarian jadwal berdasarkan program, penyiar, jam, deskripsi, status, dan program tentative;
  - menambahkan filter status jadwal: semua, sedang berjalan, reguler, tentative, pengganti, khusus, dan dibatalkan;
  - ringkasan tanggal sekarang menampilkan jumlah slot terlihat saat filter aktif;
  - menambahkan panel fokus jadwal berisi prioritas slot, slot user hari itu, dan jumlah slot tentative;
  - empty state filter memiliki tombol `Reset filter`;
  - tombol ikon tukar/edit jadwal diberi `aria-label` spesifik program;
  - memperbaiki urutan deklarasi `menuItems` di `DashboardPage` agar `recentMenuItems` tidak membaca variabel sebelum dideklarasikan.
- Batasan:
  - tidak ada perubahan service jadwal, Firestore schema/rules, role/permission, auth, query data, atau workflow produksi;
  - filter/pencarian hanya presentation layer dan tidak mengubah alur edit/tukar jadwal;
  - alur tukar jadwal tetap langsung: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.
- Verifikasi:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\BroadcastSchedulePage.tsx src\components\DashboardPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap muncul sebagai warning, bukan error.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844 mode test membuka `?page=schedule`, menguji pencarian kosong + `Reset filter`, `scrollWidth=390`, `clientWidth=390`, dan tidak ada tombol tanpa label.

### Koreksi 18 Mei 2026 - Dashboard Operational Briefing Batch 27

- Fokus melanjutkan `docs/LANJUTAN_UI_2.md` bagian operational intelligence, notification priority, actionable notification, dan context-aware dashboard.
- Perbaikan:
  - menambahkan panel `Operational Briefing` di `DashboardPage`;
  - briefing membagi prioritas menjadi `Critical`, `Important`, dan `Passive`;
  - item briefing dihitung dari konteks existing: slot on-air user, absensi hari ini, jadwal pribadi mendekat, role admin, permission AI, dan status streaming;
  - setiap item briefing memiliki aksi langsung ke halaman relevan seperti Request, Absensi, Jadwal, Rekap Absen, Naskah AI, atau Streaming;
  - styling briefing dibuat konsisten dengan design system dashboard dan responsif satu kolom di mobile.
- Batasan:
  - tidak ada perubahan service, Firebase schema/rules, role/permission, auth, query data, audio context, atau workflow produksi;
  - briefing hanya presentation layer dan memakai data dashboard yang sudah tersedia.
- Verifikasi:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap muncul sebagai warning, bukan error.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844 mode test membuka dashboard, `Operational Briefing` tampil, `scrollWidth=390`, `clientWidth=390`, dan tidak ada tombol tanpa label.

### Koreksi 18 Mei 2026 - Schedule Cross-Module Workflow Batch 28

- Fokus melanjutkan `docs/LANJUTAN_UI_2.md` bagian unified media workflow, cross-module continuity, dan program ecosystem.
- Perbaikan:
  - modal detail program di `BroadcastSchedulePage` sekarang memiliki aksi lanjutan program;
  - aksi lanjutan menghubungkan jadwal ke `Buat naskah`, `Request`, `Streaming`, dan `Live/OB`;
  - navigasi memakai router/page key existing dari `App`, tanpa route atau service baru;
  - modal detail program ditutup otomatis saat user memilih aksi lanjutan;
  - CSS workflow detail program dibuat responsif: empat kolom di desktop dan dua kolom di mobile.
- Batasan:
  - tidak ada perubahan service jadwal, AI, request lagu, streaming, Live/OB, Firestore schema/rules, role/permission, auth, atau workflow produksi;
  - perubahan hanya presentation/navigation layer.
- Verifikasi:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\App.tsx src\components\BroadcastSchedulePage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap muncul sebagai warning, bukan error.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844 mode test membuka `?page=schedule`, klik kartu jadwal, aksi workflow tampil, `scrollWidth=390`, `clientWidth=390`, tidak ada tombol tanpa label, dan tombol `Buat naskah` berpindah ke halaman naskah.

### Koreksi 18 Mei 2026 - Dashboard Live Context & Role-Aware Actions Batch 29

- Fokus melanjutkan `docs/LANJUTAN_UI_2.md` bagian Smart Dashboard, role personalization, dynamic quick actions, dan context-aware UI.
- Perbaikan:
  - konteks waktu dashboard sekarang refresh otomatis tiap 60 detik agar countdown/jadwal mendekat tidak stale saat halaman dibiarkan terbuka;
  - action board dashboard berubah berdasarkan role:
    - penyiar: request, naskah AI, jadwal, streaming;
    - admin/super admin: rekap absensi, kelola user, tukar jadwal, aduan;
    - reporter: liputan, absensi, jadwal, naskah AI jika diizinkan;
    - operator: streaming, Live/OB, request bila diizinkan, jadwal;
    - role umum/staf mendapat aksi aman sesuai permission;
  - action board tetap memfilter aksi berdasarkan permission/menu existing;
  - aksi lama yang generik diganti menjadi daftar `DashboardActionItem` agar prioritas role lebih mudah dikembangkan.
- Batasan:
  - tidak ada perubahan service, Firebase schema/rules, role/permission definition, auth, query data, audio context, atau workflow produksi;
  - perubahan hanya presentation-layer di `DashboardPage`.
- Verifikasi:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap muncul sebagai warning, bukan error.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844 mode test membuka dashboard admin, action board tampil 4 kartu role-aware (`Rekap absensi`, `Kelola user`, `Tukar jadwal`, `Tindak lanjut publik`), `scrollWidth=390`, `clientWidth=390`, dan tidak ada tombol tanpa label.

### Koreksi 18 Mei 2026 - Dashboard Realtime Request Brief Batch 30

- Fokus melanjutkan `docs/LANJUTAN_UI_2.md` bagian Smart Dashboard untuk penyiar/admin, realtime feeling, actionable notification, dan operational timeline.
- Perbaikan:
  - `DashboardPage` sekarang subscribe ke request lagu memakai `subscribeSongRequests` service existing;
  - menambahkan panel `Request Terkini` yang menampilkan request aktif terbaru, nama pendengar, waktu masuk, dan tombol langsung ke halaman Request;
  - panel menampilkan statistik kecil: request aktif, antrean, dan request yang diputar hari ini;
  - operational briefing dan timeline ikut membaca request terbaru saat ada request aktif;
  - CSS panel request dibuat responsif dan mobile satu kolom.
- Batasan:
  - tidak ada perubahan `songRequest.service`, status flow request, Firestore/localStorage schema, WhatsApp URL, auth, role/permission, atau workflow produksi;
  - perubahan hanya presentation-layer di dashboard dan memakai subscription existing.
- Verifikasi:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap muncul sebagai warning, bukan error.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844 mode test dengan localStorage request demo menampilkan `Request Terkini`, request `Lagu Semangat Pagi`, statistik `1,0,0`, `scrollWidth=390`, `clientWidth=390`, dan tidak ada tombol tanpa label.

### Koreksi 18 Mei 2026 - Dashboard Smart Panel Visual Fix Batch 31

- Fokus merespon audit visual dashboard mobile: panel `Aksi Cepat` dan `Aktivitas Terbaru` sempat tampil seperti tombol browser default abu-abu.
- Perbaikan:
  - menambahkan CSS khusus untuk `.dashboard-smart-panel`, `.dashboard-shortcut-grid`, `.dashboard-shortcut-card`, dan `.dashboard-shortcut-icon`;
  - menambahkan tone visual untuk shortcut request, absensi, jadwal, naskah AI, liputan, dan user;
  - menambahkan CSS khusus untuk `.dashboard-timeline-item`, dot status, dan `.dashboard-recent-strip`;
  - responsif mobile dibuat satu kolom dan recent strip dibuat grid dua kolom agar tidak berantakan;
  - menyimpan screenshot audit lokal di `tmp/dashboard-smart-panel-audit.png`.
- Batasan:
  - tidak ada perubahan logic dashboard, service, schema, role/permission, atau workflow produksi;
  - perubahan hanya CSS visual dashboard.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx` berhasil.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap muncul sebagai warning, bukan error.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - Simulasi mandiri Playwright mobile 390x844 mode test: `scrollWidth=390`, `clientWidth=390`, shortcut card memiliki `borderRadius=16px`, timeline memakai background panel, recent strip pill `borderRadius=999px`, 4 shortcut card tampil, 3 timeline item tampil, dan tidak ada tombol tanpa label.

### Koreksi 18 Mei 2026 - Dokumentasi Role & Screenshot Workflow Batch 32

- Fokus melanjutkan `docs/ARAHAN_BUAT_DOKUMENTASI.md` untuk dokumentasi lengkap RadioSBL App.
- Perbaikan:
  - menambahkan folder panduan role: `docs/user-guide`, `docs/admin-guide`, `docs/broadcaster-guide`, `docs/reporter-guide`, `docs/operator-guide`, dan `docs/developer-guide`;
  - menambahkan panduan Markdown untuk user umum, admin, penyiar, reporter, operator, dan developer internal;
  - menambahkan portal HTML dokumentasi di `docs/index.html`;
  - menambahkan script `npm run docs:screenshots` untuk mengambil screenshot Playwright otomatis;
  - screenshot dokumentasi dibuat ke `docs/screenshots` dengan sesi demo dan request dummy;
  - menambahkan README untuk `docs/assets` dan `docs/screenshots`.
- Perbaikan tambahan:
  - launcher screenshot menjalankan Vite langsung lewat binary Node/Vite dengan `--strictPort` agar proses dev server tidak tertinggal di Windows.
- Batasan:
  - tidak ada perubahan Firebase schema/rules, service, auth, role/permission, workflow produksi, atau data real;
  - screenshot memakai state demo lokal dan tidak memakai credential/user produksi.
- Verifikasi:
  - `node --check scripts/capture-docs-screenshots.mjs` berhasil.
  - `npm run docs:screenshots` berhasil dan menghasilkan screenshot dokumentasi di `docs/screenshots`.
  - `npm run typecheck` berhasil.

### Koreksi 18 Mei 2026 - Dashboard AI Operational Assistant Batch 33

- Fokus melanjutkan `docs/LANJUTAN_UI_2.md` bagian AI Operational Assistant, Smart Recommendation, dan Smart Summary.
- Perbaikan:
  - `DashboardPage` punya panel `AI Operational Assistant` untuk user yang memiliki permission `ai:use`;
  - panel menampilkan tiga insight operasional: ringkasan shift/on-air, rekomendasi cue naskah, dan tindak lanjut;
  - insight membaca data existing: jadwal user, program berjalan/berikutnya, absensi hari ini, request lagu aktif, dan request populer hari ini;
  - setiap insight punya aksi langsung ke halaman relevan seperti Jadwal, Request, Absensi, Rekap Absen, Profil, atau Naskah AI;
  - CSS panel assistant dibuat responsif dan mobile satu kolom.
- Batasan:
  - tidak ada pemanggilan AI eksternal baru, perubahan prompt backend, schema Firebase, service, role/permission, auth, atau workflow produksi;
  - panel hanya smart summary presentation-layer dari data dashboard existing.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx` berhasil.
  - Simulasi mandiri Playwright mobile 390x844 mode test: panel assistant tampil, 3 kartu insight tampil, `scrollWidth=390`, `clientWidth=390`, tidak ada tombol tanpa label, dan screenshot audit tersimpan di `tmp/dashboard-assistant-audit.png`.

### Koreksi 18 Mei 2026 - Program Ecosystem Detail Batch 34

- Fokus melanjutkan `docs/LANJUTAN_UI_2.md` bagian Program Ecosystem, Program Identity, dan Cross-Module Continuity.
- Perbaikan:
  - modal detail program di `BroadcastSchedulePage` ditingkatkan menjadi mini page program;
  - menambahkan statistik sederhana: durasi, frekuensi mingguan, jumlah tim penyiar, dan status slot;
  - menambahkan blok `Program Identity` dengan informasi program utama/tentative;
  - menambahkan chip kontinuitas workflow: Naskah, Request, Live, dan Arsip;
  - styling mobile dipadatkan agar seluruh workflow detail program terlihat di viewport 390x844 tanpa horizontal overflow.
- Batasan:
  - tidak ada perubahan service jadwal, schema/rules Firebase, role/permission, auth, edit jadwal, tukar jadwal, request, streaming, Live/OB, atau workflow produksi;
  - perubahan hanya presentation-layer dan kalkulasi statistik dari jadwal existing.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\BroadcastSchedulePage.tsx src\components\DashboardPage.tsx` berhasil.
  - Simulasi mandiri Playwright mobile 390x844 mode test membuka `?page=schedule`, klik kartu program, modal detail tampil, 4 statistik tampil, 4 chip kontinuitas tampil, 4 tombol workflow tampil, `scrollWidth=390`, `clientWidth=390`, workflow terlihat dalam modal, tidak ada tombol tanpa label, dan screenshot audit tersimpan di `tmp/program-detail-ecosystem-audit.png`.

### Koreksi 18 Mei 2026 - Program Brief Pinrang Berkabar Batch 35

- Fokus mengisi `docs/PINRANG_BERKABAR.md` yang masih kosong sebagai bagian dokumentasi program/newsroom.
- Perbaikan:
  - menambahkan program brief `Pinrang Berkabar` berisi fungsi, karakter program, role pengguna, workflow produksi, rundown 30 menit, template opening/headline/bridging/closing, checklist verifikasi berita, integrasi modul RadioSBL, prompt aman untuk Naskah AI, dan acceptance criteria;
  - menambahkan link `Pinrang Berkabar` di portal dokumentasi `docs/index.html`.
- Batasan:
  - tidak ada perubahan kode aplikasi, service, schema/rules Firebase, role/permission, auth, prompt backend, atau workflow produksi;
  - dokumen menekankan verifikasi berita dan larangan mengarang fakta.
- Verifikasi:
  - `rg -n "Pinrang Berkabar|PINRANG_BERKABAR" docs\index.html docs\PINRANG_BERKABAR.md` berhasil menemukan brief dan link portal.

### Koreksi 18 Mei 2026 - Video Pinrang Berkabar Batch 36

- Fokus melanjutkan `docs/PINRANG_BERKABAR.md` yang berisi arahan fitur video YouTube Pinrang Berkabar.
- Perbaikan:
  - melengkapi dokumen arahan dengan header halaman, empty/error state, fallback data, integrasi navigasi, dan acceptance criteria;
  - mengganti contoh API key nyata menjadi placeholder agar tidak mendorong hardcode credential di frontend;
  - menambahkan service `pinrangBerkabar.service` dengan urutan aman: proxy `VITE_PINRANG_BERKABAR_FEED_URL`, env `VITE_YOUTUBE_API_KEY` bila ada, lalu fallback playlist resmi;
  - menambahkan halaman `PinrangBerkabarPage` dengan hero, tombol `Coba lagi`, tombol `Buka playlist`, loading skeleton, card video 16:9, dan fallback playlist;
  - menambahkan page key/menu `pinrangBerkabar` ke route, sidebar desktop, dan Menu Lengkap grup Konten;
  - menambahkan style responsif untuk mobile satu kolom dan desktop grid.
- Batasan:
  - tidak ada perubahan Firebase schema/rules, auth, role/permission, absensi, jadwal, request lagu, podcast, streaming, atau AI naskah;
  - API key tidak di-hardcode dan fallback tidak mengarang judul video spesifik.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\App.tsx src\components\PinrangBerkabarPage.tsx src\components\MenuPage.tsx src\components\Shell.tsx src\data\radioData.ts src\lib\env.ts src\services\pinrangBerkabar.service.ts` berhasil.
  - Simulasi mandiri Playwright mobile 390x844 mode test membuka `?page=pinrangBerkabar`, judul tampil, fallback card tampil, link playlist tersedia, `scrollWidth=390`, `clientWidth=390`, tidak ada tombol tanpa label, dan screenshot audit tersimpan di `tmp/pinrang-berkabar-video-audit.png`.
  - Setelah `VITE_YOUTUBE_API_KEY` diset di `.env.local`, simulasi Playwright mobile mode test memuat 12 video dari YouTube API, sumber tampil `YouTube API`, link playlist tersedia, `scrollWidth=390`, `clientWidth=390`, tanpa console error, dan screenshot audit tersimpan di `tmp/pinrang-berkabar-youtube-api-audit.png`.
  - `rg -n "AIzaSyBuOovBzt|VITE_YOUTUBE_API_KEY=.*AIza" . --glob "!.env.local" --glob "!node_modules/**" --glob "!dist/**"` tidak menemukan key di file repo yang akan di-commit.

### Koreksi 18 Mei 2026 - Video Pinrang Berkabar Pagination Batch 37

- Fokus melanjutkan `docs/PINRANG_BERKABAR.md` bagian `pageToken`, pagination, dan scanability video.
- Perbaikan:
  - service `listPinrangBerkabarVideos` sekarang mengembalikan `videos`, `nextPageToken`, dan `source`;
  - proxy feed dan YouTube API mendukung `pageToken`;
  - halaman `PinrangBerkabarPage` menambahkan tombol `Muat lagi` untuk mengambil halaman video berikutnya;
  - menambahkan pencarian lokal untuk memfilter video yang sudah termuat berdasarkan judul, deskripsi, kanal, atau tanggal;
  - menambahkan empty state `Video tidak ditemukan` dan tombol `Reset pencarian`;
  - acceptance criteria dokumen diperbarui untuk pagination dan pencarian lokal.
- Batasan:
  - tidak ada perubahan Firebase schema/rules, auth, role/permission, modul lama, atau hardcode API key;
  - pencarian hanya memfilter video yang sudah termuat, tidak membuat query YouTube baru.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\PinrangBerkabarPage.tsx src\services\pinrangBerkabar.service.ts` berhasil.
  - Simulasi mandiri Playwright mobile 390x844 mode test dengan YouTube API: video awal 12, tombol `Muat lagi` tersedia, setelah klik menjadi 24 video, search kosong menampilkan empty state, `scrollWidth=390`, `clientWidth=390`, tidak ada tombol tanpa label, tanpa console error, dan screenshot audit tersimpan di `tmp/pinrang-berkabar-pagination-audit.png`.

### Koreksi 18 Mei 2026 - Dokumentasi Screenshot Pinrang Berkabar Batch 38

- Fokus melanjutkan dokumentasi fitur Video Pinrang Berkabar agar ikut masuk portal dokumentasi dan screenshot otomatis.
- Perbaikan:
  - `scripts/capture-docs-screenshots.mjs` sekarang mengambil `pinrang-berkabar-mobile.png`;
  - fungsi capture menunggu gambar selesai load/decode sebelum screenshot agar thumbnail YouTube tidak kosong;
  - `docs/user-guide/README.md` menambahkan bagian `Pinrang Berkabar`;
  - `docs/index.html` menambahkan screenshot Pinrang Berkabar di bagian screenshot utama;
  - screenshot baru tersimpan di `docs/screenshots/pinrang-berkabar-mobile.png`.
- Batasan:
  - tidak ada perubahan service runtime selain script dokumentasi;
  - screenshot tetap memakai sesi demo dan konfigurasi lokal yang aman dari commit.
- Verifikasi:
  - `node --check scripts/capture-docs-screenshots.mjs` berhasil.
  - `npm run docs:screenshots` berhasil menghasilkan ulang screenshot dokumentasi.
  - Inspeksi visual `docs/screenshots/pinrang-berkabar-mobile.png` menunjukkan thumbnail video sudah ter-render.

### Koreksi 18 Mei 2026 - Smoke Test Pinrang Berkabar Batch 39

- Fokus menambahkan guard e2e ringan untuk halaman video `Pinrang Berkabar`.
- Perbaikan:
  - menambahkan `src/e2e/pinrang-berkabar.smoke.spec.ts`;
  - test membuka `?page=pinrangBerkabar` dengan sesi demo admin;
  - memverifikasi judul, link playlist, input pencarian, kartu video/fallback, aksi `Muat lagi` bila tersedia, empty state pencarian, tombol reset, tidak ada horizontal overflow, dan tidak ada tombol tanpa label.
- Batasan:
  - test tidak memaksa data YouTube live selalu tersedia;
  - bila API/fetch tidak tersedia, fallback playlist tetap dianggap jalur valid.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\e2e\pinrang-berkabar.smoke.spec.ts src\components\Shell.tsx` berhasil.
  - `npx playwright test pinrang-berkabar.smoke.spec.ts` berhasil.

### Koreksi 18 Mei 2026 - Shell Connectivity Polish Batch 40

- Fokus melanjutkan `src/components/Shell.tsx` untuk memperjelas status online/offline global.
- Perbaikan:
  - status koneksi sidebar sekarang memakai ikon dan label `Sinkron aktif` / `Mode offline`;
  - menambahkan deskripsi singkat `Data studio tersambung` atau `Data lokal tetap bisa dibuka`;
  - menambahkan `role="status"` dan `aria-live="polite"` pada status koneksi;
  - menambahkan strip offline di area konten agar operator sadar beberapa data akan sinkron saat koneksi kembali.
- Batasan:
  - tidak ada perubahan routing, Firebase schema/rules, auth, role/permission, atau service data;
  - perubahan hanya presentation-layer Shell.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\Shell.tsx src\e2e\pinrang-berkabar.smoke.spec.ts` berhasil.
  - `npm run build` berhasil.

### Koreksi 18 Mei 2026 - Shell Navigation Continuity Batch 41

- Fokus melanjutkan `src/components/Shell.tsx` agar navigasi tetap natural ketika fitur bertambah tanpa menambah item bottom nav.
- Perbaikan:
  - memindahkan `Pinrang Berkabar` dari grup sidebar `Siaran` ke grup `Konten` sesuai arahan dokumentasi;
  - bottom nav sekarang menandai `Menu` sebagai active saat user berada di halaman yang tidak punya item bottom nav langsung;
  - menambahkan `aria-current="page"` untuk item sidebar/bottom nav yang benar-benar sedang aktif;
  - smoke test Pinrang Berkabar memastikan tombol `Menu` aktif di viewport mobile.
- Batasan:
  - tidak ada perubahan route, permission, Firebase schema/rules, auth, atau service data;
  - bottom nav tetap lima item utama dan tidak ditambah.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\Shell.tsx src\e2e\pinrang-berkabar.smoke.spec.ts` berhasil.
  - `npx playwright test pinrang-berkabar.smoke.spec.ts` berhasil untuk desktop dan mobile.
  - `npm run build` berhasil.

### Koreksi 18 Mei 2026 - Menu Recently Used Batch 42

- Fokus melanjutkan `docs/LANJUTAN_UI_2.md` bagian Smart Shortcut System, Recently Used, Session Continuity, dan Cognitive Load Reduction.
- Perbaikan:
  - `Shell` sekarang menyimpan halaman terakhir yang dibuka ke `radiosbl.recentPages:<userId>` secara global;
  - `MenuPage` membaca daftar halaman terakhir dipakai dari storage yang sama;
  - menambahkan panel `Terakhir dipakai` di Menu Lengkap untuk melanjutkan pekerjaan tanpa mencari ulang;
  - quick action dan tile menu memakai handler navigasi yang ikut memperbarui recent pages;
  - grup `Pinrang Berkabar` di Menu Lengkap disamakan dengan sidebar, yaitu masuk `Konten`;
  - smoke test Pinrang Berkabar memverifikasi recent panel muncul di mobile setelah membuka halaman Pinrang Berkabar lalu masuk Menu.
- Batasan:
  - tidak ada route baru, service baru, schema/rules Firebase, permission baru, atau perubahan business logic inti;
  - recent pages hanya local convenience dan tetap aman bila localStorage tidak tersedia.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\Shell.tsx src\components\MenuPage.tsx src\e2e\pinrang-berkabar.smoke.spec.ts` berhasil.
  - `npx playwright test pinrang-berkabar.smoke.spec.ts` berhasil untuk desktop dan mobile.
  - `npm run build` berhasil.

### Koreksi 18 Mei 2026 - Dashboard Calm Shortcut Batch 43

- Fokus melanjutkan `docs/LANJUTAN_UI_3.md` bagian masalah dashboard terlalu padat, terlalu banyak shortcut, dan semua fitur terasa sama penting.
- Perbaikan:
  - dashboard sekarang hanya menampilkan 4 shortcut utama secara default;
  - shortcut tambahan tetap tersedia melalui tombol expand `Tampilkan semua menu`;
  - menambahkan smoke test `src/e2e/dashboard-calm.smoke.spec.ts` untuk menjaga grid shortcut tetap 4 item secara default;
  - test juga memverifikasi tombol expand membuka lebih banyak menu, tidak ada horizontal overflow, dan tidak ada tombol ikon tanpa label.
- Batasan:
  - tidak ada perubahan route, permission, service, Firebase schema/rules, auth, atau business logic inti;
  - fitur tetap dapat diakses lewat expand dashboard dan Menu Lengkap.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx src\e2e\dashboard-calm.smoke.spec.ts` berhasil.
  - `npx playwright test dashboard-calm.smoke.spec.ts` berhasil untuk desktop dan mobile.
  - `npm run build` berhasil.
  - `npm run build` berhasil.

### Koreksi 18 Mei 2026 - Dashboard Briefing Priority Batch 45

- Fokus melanjutkan `docs/LANJUTAN_UI_3.md` bagian hierarchy visual belum jelas, semua fitur terasa sama penting, dan cognitive load tinggi.
- Perbaikan:
  - `Operational Briefing` sekarang menampilkan 1 kartu prioritas utama secara default;
  - prioritas pendukung dipindahkan ke disclosure `Prioritas lain`;
  - layout briefing dibuat lebih tenang: satu fokus utama, detail lain tetap satu tap;
  - smoke test dashboard memverifikasi hanya satu briefing card langsung tampil dan prioritas pendukung muncul setelah disclosure dibuka.
- Batasan:
  - tidak ada perubahan data, permission, service, route, Firebase schema/rules, auth, atau business logic inti;
  - semua aksi briefing lama tetap tersedia.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx src\e2e\dashboard-calm.smoke.spec.ts` berhasil.
  - `npx playwright test dashboard-calm.smoke.spec.ts` berhasil untuk desktop dan mobile.
  - `npm run build` berhasil.

### Koreksi 18 Mei 2026 - LANJUTAN UI 3 Completion Batch 46

- Fokus menuntaskan `docs/LANJUTAN_UI_3.md`, khususnya target `Pinrang Berkabar terasa profesional` dan `video diputar dalam aplikasi`.
- Perbaikan:
  - `PinrangBerkabarPage` sekarang memiliki player YouTube embed di dalam aplikasi;
  - kartu video berubah dari link langsung keluar menjadi tombol `Putar` yang memilih video di player halaman;
  - player fallback memakai embed playlist resmi bila feed/API belum tersedia;
  - detail `Now Playing`, deskripsi, dan link `Buka di YouTube` tetap tersedia;
  - styling player dibuat responsif untuk desktop dan mobile;
  - smoke test Pinrang Berkabar memverifikasi iframe player dan status `Now Playing`;
  - `docs/LANJUTAN_UI_3.md` ditambahkan bagian status implementasi tuntas.
- Batasan:
  - tidak ada API key hardcode, route baru, permission baru, Firebase schema/rules, auth, atau business logic inti;
  - link YouTube eksternal tetap dipertahankan sebagai fallback.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\PinrangBerkabarPage.tsx src\e2e\pinrang-berkabar.smoke.spec.ts` berhasil.
  - `npx playwright test pinrang-berkabar.smoke.spec.ts` berhasil untuk desktop dan mobile.
  - `npm run build` berhasil.
  - `npx eslint src\components\DashboardPage.tsx src\components\PinrangBerkabarPage.tsx src\e2e\dashboard-calm.smoke.spec.ts src\e2e\pinrang-berkabar.smoke.spec.ts` berhasil.
  - `npx playwright test dashboard-calm.smoke.spec.ts pinrang-berkabar.smoke.spec.ts` berhasil untuk desktop dan mobile.
  - `npm run build` berhasil.

### Koreksi 18 Mei 2026 - LANJUTAN UI 3 Docs Refresh Batch 47

- Fokus melanjutkan setelah `LANJUTAN_UI_3.md` tuntas agar portal dokumentasi dan screenshot mencerminkan hasil final.
- Perbaikan:
  - `docs/index.html` menambahkan kartu `LANJUTAN UI 3`;
  - `docs/user-guide/README.md` memperbarui bagian Pinrang Berkabar agar menyebut player video in-app;
  - screenshot dokumentasi diperbarui untuk dashboard mobile, dashboard desktop, dan Pinrang Berkabar mobile.
- Verifikasi:
  - `node --check scripts\capture-docs-screenshots.mjs` berhasil.
  - `npm run docs:screenshots` berhasil.
  - Cek file screenshot menunjukkan `dashboard-mobile.png`, `dashboard-desktop.png`, dan `pinrang-berkabar-mobile.png` terbarui.

### Koreksi 18 Mei 2026 - Pinrang Berkabar Identity Carousel Batch 48

- Fokus hasil baca ulang `docs/LANJUTAN_UI_3.md`, terutama bagian `/PinrangBerkabar.png`, hero section, dan `Video Lainnya`.
- Perbaikan:
  - hero Pinrang Berkabar sekarang memakai logo resmi `/PinrangBerkabar.png`;
  - daftar video setelah player diberi heading `Video Lainnya`;
  - daftar video terkait dibuat sebagai carousel horizontal responsif;
  - thumbnail kartu video memakai lazy loading;
  - smoke test Pinrang Berkabar memverifikasi logo resmi, player, `Now Playing`, heading `Video Lainnya`, dan carousel.
- Batasan:
  - tidak ada API key hardcode, route baru, permission baru, Firebase schema/rules, auth, atau perubahan service.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\PinrangBerkabarPage.tsx src\e2e\pinrang-berkabar.smoke.spec.ts` berhasil.
  - `npx playwright test pinrang-berkabar.smoke.spec.ts` berhasil untuk desktop dan mobile.
  - `npm run build` berhasil.

### Koreksi 18 Mei 2026 - LANJUTAN UI 3 Evaluation Batch 49

- Fokus evaluasi ulang `docs/LANJUTAN_UI_3.md` terhadap implementasi aktual.
- Temuan:
  - dashboard calm, progressive disclosure, Pinrang in-app player, related video carousel, Request Lagu card stack, dan bottom nav 5 item sudah tertutup;
  - gap yang masih jelas adalah sidebar desktop belum punya grup `Tim` sesuai dokumen.
- Perbaikan:
  - `Shell` memindahkan `Penyiar` dari grup `Siaran` ke grup baru `Tim`;
  - `MenuPage` juga menambahkan grup `Tim` agar navigasi lengkap konsisten;
  - `docs/LANJUTAN_UI_3.md` ditambahkan bagian `Hasil Evaluasi Ulang`.
- Batasan:
  - tidak ada perubahan route, permission, Firebase schema/rules, auth, service, atau business logic inti.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\Shell.tsx src\components\MenuPage.tsx src\e2e\login.smoke.spec.ts` berhasil.
  - `npx playwright test login.smoke.spec.ts` berhasil untuk desktop dan mobile.
  - `npm run build` berhasil.

### Koreksi 18 Mei 2026 - Copy Teknis Cleanup Batch 50

- Fokus mengevaluasi teks yang masih terasa demo atau instruksi teknis developer.
- Perbaikan:
  - `PinrangBerkabarPage` menghapus copy user-facing seperti `API key`, `frontend`, dan `Feed belum terhubung`;
  - label sumber video dibuat lebih human-friendly: `Feed resmi`, `YouTube resmi`, dan `Playlist resmi`;
  - konfirmasi logout dashboard tidak lagi menyebut `Sesi demo`;
  - `docs/user-guide/README.md` menghapus instruksi mode demo/test dan mengganti `Firebase` menjadi `konfigurasi sistem`;
  - `docs/index.html` mengurangi bahasa teknis seperti command screenshot di halaman utama;
  - `docs/LANJUTAN_UI_3.md` merapikan status evaluasi agar tidak berisi daftar command teknis sebagai instruksi utama.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\PinrangBerkabarPage.tsx src\components\DashboardPage.tsx` berhasil.
  - Pencarian ulang `mode demo|Sesi demo|API key|frontend|Feed belum|Firebase|npm run docs|akun/data demo|demo/test` pada UI utama dan docs pengguna tidak menemukan hasil.
  - `npm run build` berhasil.

### Koreksi 18 Mei 2026 - Dashboard Secondary Detail Disclosure Batch 44

- Fokus melanjutkan `docs/LANJUTAN_UI_3.md` bagian dashboard terlalu panjang, terlalu banyak card besar, dan cognitive load tinggi.
- Perbaikan:
  - panel `Jadwal Berikutnya` dan `Podcast Unggulan` dipindahkan ke disclosure `Detail siaran & arsip`;
  - disclosure tertutup secara default agar first view dashboard lebih ringan;
  - detail tetap bisa dibuka satu tap dari dashboard tanpa menghapus workflow lama;
  - styling disclosure dibuat compact dan konsisten dengan dashboard;
  - smoke test dashboard memverifikasi detail sekunder tersembunyi secara default dan tampil setelah disclosure dibuka.
- Batasan:
  - tidak ada perubahan data, route, permission, service, Firebase schema/rules, auth, atau business logic inti;
  - jadwal dan podcast tetap tersedia dari dashboard, menu, dan halaman masing-masing.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx src\e2e\dashboard-calm.smoke.spec.ts` berhasil.
  - `npx playwright test dashboard-calm.smoke.spec.ts` berhasil untuk desktop dan mobile.
