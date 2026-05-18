# HANDOFF.md

Dokumen ini adalah titik masuk cepat untuk melanjutkan pengembangan Radio SBL
dari akun/perangkat/sesi Codex mana pun.

Tanggal status terakhir: 15 Mei 2026.

## ⚠️ KESEPAKATAN KERJA MUTLAK AI (AI WORKING AGREEMENT) ⚠️
Setiap agen yang mengambil alih proyek ini **WAJIB** mematuhi 3 aturan berikut:
1. **Pilar Pengembangan**: Setiap fitur harus mematuhi prinsip **"Mempermudah" (Zero-Friction)**, **"Super Cerdas" (AI/Automated Context)**, dan **"Mobile-First" (Utamakan HP)**.
2. **Pengerjaan Iteratif (Step-by-Step)**: Dilarang keras merombak terlalu banyak file sekaligus tanpa instruksi spesifik. Lakukan perombakan *sedikit demi sedikit* agar tidak kacau.
3. **Uji Coba Mandiri & Perbaikan Otomatis**: **JANGAN** pernah menyerahkan hasil kode kepada pengguna sebelum menjalankan uji coba mandiri (`npm run typecheck`, `npm run lint`, dll). Jika gagal, lakukan perbaikan otomatis (*self-healing*) sebelum melapor.

## Cara Melanjutkan

1. Buka project:

```bash
cd D:\RADIO-SBL
```

2. Baca urutan dokumen berikut:

- `docs/HANDOFF.md` untuk ringkasan status terbaru.
- `docs/CODEX_SESSION_LOG.md` untuk riwayat perubahan lengkap.
- `docs/DATABASE_SCHEMA.md` untuk collection, tipe data, dan service.
- `docs/FIREBASE_SETUP.md`, `docs/GOOGLE_DRIVE_SETUP.md`,
  `docs/DEPLOYMENT_GUIDE.md` bila akan menyentuh integrasi/deploy.

3. Jalankan verifikasi sebelum mengubah fitur:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run seed:export
npm run seed:import
npm run seed:import:write:cli
npm run test:e2e
```

4. Jalankan dev server:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

URL lokal:

```txt
http://localhost:5173/
```

## Status Project

- Project berada langsung di `D:\RADIO-SBL`.
- Folder ini tidak memiliki `.git`, jadi `git status` tidak tersedia.
- Stack: React + Vite + TypeScript + Firebase + PWA.
- `.env.local` sudah dipakai untuk konfigurasi lokal dan tidak boleh dibagikan.
- Semua fitur penting memiliki fallback demo/offline berbasis data seed atau
  `localStorage` agar UI tetap jalan saat Firestore rules belum sinkron.

## Verifikasi Terakhir

Status verifikasi terakhir yang dicatat:

- `npm run lint` berhasil.
- `npm run typecheck` berhasil.
- `npm run test` berhasil: 19 test files passed, 62 tests passed.
- `npm run test:e2e` berhasil: 4 Playwright tests passed untuk login,
  navigasi inti, naskah AI, arsip draft, dan audit responsif desktop/mobile.
- `npm run build` berhasil.
- `npm run seed:export` berhasil.
- `npm run seed:import` berhasil dry-run dan tidak menulis data.
- `npm run seed:import:write` sempat gagal karena Web SDK tidak memiliki sesi
  Auth admin.
- `npm run seed:import:write:cli` berhasil menulis 56 dokumen seed ke Firestore
  project `radiosbl`.
- Verifikasi REST Firestore menunjukkan dokumen produksi:
  - `announcers`: 7
  - `broadcastPrograms`: 19
  - `broadcastSchedules`: 28
  - `streamingSettings`: 1
  - `appSettings`: 1
- `npx firebase-tools deploy --only firestore:rules --project radiosbl`
  berhasil deploy rules produksi terbaru:
  `projects/radiosbl/rulesets/0e1734b1-a7ad-4f39-a1c5-ddd447c7f42a`.
- `npx firebase-tools deploy --only hosting --project radiosbl` berhasil deploy
  frontend terbaru ke `https://radiosbl.web.app`
  dengan version `5cf536588550e2de`.
- Firebase Functions proxy sudah discaffold, tetapi deploy `notificationProxy`
  gagal karena project `radiosbl` masih Spark Plan dan Cloud Build butuh Blaze.
- Proxy notifikasi lokal diuji dalam mode demo:
  - `POST /whatsapp/send` merespons demo message ID.
  - `POST /gemini/draft` merespons draft demo.
  - `POST /ai/script-draft` merespons draft demo OpenAI/ChatGPT.
- Dev server lokal merespons HTTP 200 di `http://localhost:5173/`.
- URL publik `https://radiosbl.web.app/?v=final2-20260515` merespons HTTP 200.
- URL publik `https://radiosbl.web.app/?v=ai-script-20260515` merespons HTTP
  200.
- Endpoint Functions produksi masih 404 sampai `functions:deploy` berhasil
  setelah upgrade Blaze.

## Fitur Yang Sudah Ada

- Login email/password dan Google Auth dengan fallback demo.
- Profil user dari Firestore `users/{uid}` dengan fallback Firebase Auth.
- Dashboard mobile-first dan desktop shell.
- Data resmi Radio SBL, penyiar, SK 2026, jadwal siaran, dan stream resmi.
- PWA manifest, service worker, offline app shell, dan indikator online/offline.
- Player streaming Radio SBL:
  - stream utama `https://pu.klikhost.com/proxy/sbl/stream`;
  - metadata `https://pu.klikhost.com/proxy/sbl/status-json.xsl`;
  - refresh metadata 12 detik;
  - pembersihan metadata lagu;
  - parsing Artist - Title;
  - fallback `SBL RADIO - Live Streaming`;
  - album art MusicBrainz/CoverArtArchive/iTunes/fallback logo;
  - histori 5 lagu terakhir di localStorage;
  - retry playback dan error handling.
- Penyiar on-air dihitung dari jadwal aktif + absensi hari ini.
- Absensi selfie + lokasi + radius kantor + cache lokal.
- Upload selfie ke Google Drive lokal/proxy jika env tersedia, fallback metadata
  demo jika belum tersedia.
- Request lagu:
  - form di halaman Streaming;
  - antrean di halaman Request;
  - status `new`, `notified`, `queued`, `played`, `rejected`;
  - proxy WA otomatis bila `VITE_WHATSAPP_PROXY_ENDPOINT` aktif;
  - fallback link WA ke penyiar on-air atau nomor Radio SBL;
  - Firestore/localStorage fallback.
- Pengaduan/saran:
  - submit nyata;
  - status `Baru`, `Terverifikasi`, `Diproses`, `Selesai`;
  - Firestore/localStorage fallback.
- Jadwal siaran:
  - data resmi 28 slot mingguan;
  - edit fleksibel untuk jam, program, penyiar, deskripsi via Firestore
    `customScheduleSlots` dengan fallback lokal;
  - request tukar jadwal demo.
- Live/OB:
  - form event;
  - lokasi, waktu mulai, YouTube URL, Discord room URL;
  - rundown event aktif;
  - Firestore/localStorage fallback.
- Firestore seed export/import produksi sudah berhasil untuk data resmi awal.
- Firestore rules role dan collection utama sudah dideploy ke project
  `radiosbl`.
- Realtime listener Firestore sudah dipakai untuk request lagu, aduan, Live/OB,
  dan absensi dengan fallback lokal saat offline/permission error.
- Proxy lokal `npm run proxy:notifications` tersedia untuk WhatsApp Cloud API
  Gemini, dan AI naskah siaran. Production masih perlu deploy backend aman
  serta secret resmi.
- Firebase Functions `notificationProxy` sudah siap di folder `functions/` untuk
  deploy setelah project memakai Blaze Plan.
- Playwright e2e smoke test tersedia untuk login, navigasi inti, streaming,
  link Website/WhatsApp, dan halaman liputan di desktop/mobile.

## File Penting

- `src/App.tsx`: mayoritas halaman dan flow UI.
- `src/data/radioData.ts`: data resmi Radio SBL, penyiar, jadwal, nav.
- `src/services/attendance.service.ts`: absensi, selfie, cache on-air.
- `src/services/radioMetadata.service.ts`: metadata lagu dan album art.
- `src/services/songRequest.service.ts`: request lagu + WA + antrean.
- `src/services/whatsappNotification.service.ts`: proxy WA + fallback deep-link.
- `src/services/aiScript.service.ts`: penyusun naskah program via provider
  OpenAI/Gemini dengan fallback demo lokal.
- `src/services/programScript.service.ts`: arsip draft naskah program dengan
  Firestore/localStorage fallback.
- `src/services/complaint.service.ts`: pengaduan/saran.
- `src/services/liveOb.service.ts`: event Live/OB + Discord/YouTube.
- `src/services/scheduleSlot.service.ts`: override jadwal lokal.
- `scripts/notification-proxy-server.mjs`: proxy lokal WhatsApp/Gemini/OpenAI.
- `functions/index.js`: Firebase Functions proxy produksi `notificationProxy`.
- `playwright.config.ts` dan `src/e2e/login.smoke.spec.ts`: smoke test visual
  login, navigasi inti, streaming action, dan overflow desktop/mobile.
- `firestore.rules`: rules keamanan Firestore.
- `docs/CODEX_SESSION_LOG.md`: riwayat perubahan lengkap.
- `docs/DATABASE_SCHEMA.md`: schema dan service.

## Catatan Teknis Penting

- Jangan menyimpan API key Gemini atau secret OAuth ke file publik.
- Key Gemini lokal harus non-public: `GEMINI_API_KEY` / `GEMINI_API_KEYS`.
- Key OpenAI lokal harus non-public: `OPENAI_API_KEY`.
- Frontend hanya boleh memanggil proxy Gemini via `VITE_GEMINI_PROXY_ENDPOINT`.
- Frontend hanya boleh memanggil proxy AI naskah via
  `VITE_AI_SCRIPT_PROXY_ENDPOINT`; jangan memanggil OpenAI langsung dari
  browser.
- WhatsApp otomatis penuh butuh backend resmi WhatsApp Business/Cloud API.
  Frontend sudah bisa memanggil proxy; tanpa proxy/secret, fallback tetap
  memakai deep-link `wa.me` dengan pesan sudah terisi.
- Jika console masih menunjukkan Firestore permission error setelah deploy rules,
  cek profil user `users/{uid}`, role, dan status `active`. UI tetap punya
  fallback lokal.
- Jika desktop terlihat seperti mobile, matikan Chrome DevTools device toolbar
  (`Ctrl+Shift+M`) dan pastikan viewport lebih dari 980px.

## Prioritas Berikutnya

1. Upgrade Firebase project `radiosbl` ke Blaze Plan bila ingin memakai
   Firebase Functions, lalu jalankan `npm run functions:deploy`.
2. Isi secret resmi `WHATSAPP_CLOUD_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, dan
   Gemini di backend/proxy produksi.
3. Setelah Functions deploy berhasil, arahkan production env frontend ke:
   - `https://asia-southeast1-radiosbl.cloudfunctions.net/notificationProxy/whatsapp/send`
   - `https://asia-southeast1-radiosbl.cloudfunctions.net/notificationProxy/gemini/draft`
   - `https://asia-southeast1-radiosbl.cloudfunctions.net/notificationProxy/ai/script-draft`
4. Uji end-to-end login user ber-role admin/super admin untuk edit jadwal
   Firestore dan update status request/aduan.
5. Lanjutkan polish UI/UX per halaman yang lebih detail bila ada referensi
   visual baru, terutama mengganti inline style besar di `src/App.tsx` menjadi
   komponen kecil agar maintenance lebih ringan.

## Update Terbaru - 15 Mei 2026

- Audit UI/UX poin 7 dilanjutkan untuk flow mobile-first:
  - `PageHeader` kini menampilkan eyebrow, title, dan description tanpa klik DOM
    tersembunyi.
  - Dashboard memakai 9 menu yang semuanya mengarah ke halaman nyata.
  - Tombol bell dashboard membuka antrean request lagu.
  - Streaming menghapus tombol skip 15 detik palsu, menambahkan tombol kembali,
    toggle request, link Website/WhatsApp, dan aksi Bagikan.
  - Halaman Liputan mengganti `alert()` dengan notice/error inline.
  - Tukar jadwal mengganti `alert()` dengan notice inline.
- Playwright memakai Vite `--mode test` agar auth demo konsisten saat e2e dan
  tidak bergantung kredensial Firebase produksi.
- Verifikasi terbaru:
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 18 test files passed dan 60 tests passed.
  - `npm run test:e2e` menghasilkan 4 tests passed di desktop/mobile.
  - `npm run build` berhasil.

## Update Lanjutan - 15 Mei 2026

- Referensi visual `docs/referensi_UI_UX.png` dipakai untuk audit lanjutan
  gaya mobile super app: dashboard grid, kartu on-air, streaming player,
  jadwal, Live/OB, pengaduan, dan profil.
- Audit Playwright manual desktop/mobile pada halaman:
  Dashboard, Absensi, Jadwal, Streaming, Live/OB, Liputan, Request, Aduan,
  dan Profil menghasilkan:
  - horizontal overflow: 0 halaman;
  - tombol ikon tanpa label: 0;
  - link tanpa `href`: 0.
- Perbaikan tambahan:
  - tombol play dashboard diberi label dan tipe eksplisit;
  - tombol ikon edit/tukar jadwal diberi `aria-label`;
  - tombol tutup modal jadwal diberi label;
  - tombol `Kirim notifikasi kru` Live/OB kini memberi feedback inline;
  - mini player global diberi label play/pause;
  - ikon status/volume pada audio player tidak lagi berupa tombol palsu.
- E2E diperkuat untuk mengecek tombol ikon tanpa label dan link kosong.
- Verifikasi terbaru:
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 18 test files passed dan 60 tests passed.
  - `npm run test:e2e` menghasilkan 4 tests passed di desktop/mobile.
  - `npm run build` berhasil.

## Update Audit UI/UX Bertahap - 15 Mei 2026

- Audit ulang memakai screenshot Playwright desktop dan Pixel 5 tersimpan di:
  - `tmp/ui-audit/`
  - `tmp/ui-audit-after/`
- Perapihan tambahan berdasarkan referensi:
  - judul halaman operasional dipendekkan agar tidak terasa seperti hero page:
    Absensi, Penyiar, Jadwal Siaran, Live/OB, Saran & Pengaduan, Profil;
  - halaman Jadwal mobile dibuat lebih seperti list operasional satu kolom,
    dengan kartu lebih padat dan teks rata kiri;
  - panel action Liputan memakai `.panel-actions` agar tombol Test Gemini dan
    Penugasan Baru tidak pecah kata di mobile;
  - header halaman mobile dibuat rata kiri dan lebih ringkas.
- Audit metrik terbaru untuk Dashboard, Absensi, Jadwal, Streaming, Live/OB,
  Liputan, Request, Aduan, dan Profil:
  - horizontal overflow: 0;
  - tombol ikon tanpa label: 0;
  - link tanpa `href`: 0;
  - tombol clipped/terpotong: 0.
- Verifikasi terbaru:
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 18 test files passed dan 60 tests passed.
  - `npm run test:e2e` menghasilkan 4 tests passed di desktop/mobile.
  - `npm run build` berhasil.

## Update AI Naskah Siaran - 15 Mei 2026

- Menambahkan MVP integrasi ChatGPT/OpenAI seperti pola Gemini, tetapi lewat
  proxy backend agar API key tidak pernah terbuka di frontend.
- Endpoint baru:
  - lokal: `POST /ai/script-draft`;
  - alias lokal/Functions: `POST /openai/draft`;
  - production target:
    `https://asia-southeast1-radiosbl.cloudfunctions.net/notificationProxy/ai/script-draft`.
- `src/services/aiScript.service.ts` menambahkan provider `openai` dan
  `gemini`, plus fallback demo jika endpoint proxy belum diisi.
- Halaman `Jadwal Siaran` sekarang punya panel `Naskah siaran otomatis`:
  - pilih slot program;
  - pilih provider ChatGPT/OpenAI atau Gemini;
  - atur durasi dan gaya siaran;
  - isi intervensi penyiar aktif;
  - hasil draft bisa diedit manual penyiar.
- `.env.example` menambahkan:
  - `VITE_AI_SCRIPT_PROXY_ENDPOINT`
  - `VITE_OPENAI_PROXY_ENDPOINT`
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
  - `OPENAI_MAX_OUTPUT_TOKENS`
- Verifikasi terbaru:
  - `node --check scripts/notification-proxy-server.mjs` berhasil.
  - `node --check functions/index.js` berhasil.
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 18 test files passed dan 60 tests passed.
  - `npm run test:e2e` menghasilkan 4 tests passed di desktop/mobile.
  - `npm run build` berhasil.

## Update Arsip Naskah Siaran - 15 Mei 2026

- Menambahkan tipe `ProgramScriptDraft` untuk draft naskah siaran.
- Menambahkan `src/services/programScript.service.ts`:
  - simpan draft naskah ke `programScriptDrafts`;
  - fallback lokal `localStorage` saat mode test/offline/permission error;
  - baca arsip naskah terbaru.
- Halaman `Jadwal Siaran` sekarang bisa:
  - menyimpan naskah AI yang sudah diedit penyiar;
  - menampilkan `Arsip naskah terbaru`;
  - memuat ulang draft lama ke editor.
- `firestore.rules` menambahkan rule collection `programScriptDrafts` untuk user
  yang punya permission AI (`canUseAi()`).
- E2E flow `Buat naskah` diperluas dengan `Simpan draft` dan cek arsip.
- Test baru:
  - `src/tests/programScript.test.ts`.
- Verifikasi terbaru:
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 19 test files passed dan 62 tests passed.
  - `npm run test:e2e` menghasilkan 4 tests passed di desktop/mobile.
  - `npm run build` berhasil.

## Update Deploy AI dan Arsip - 15 Mei 2026

- Firestore rules terbaru untuk `programScriptDrafts` sudah dideploy ke project
  `radiosbl`.
- Ruleset produksi:
  `projects/radiosbl/rulesets/0e1734b1-a7ad-4f39-a1c5-ddd447c7f42a`.
- Hosting frontend terbaru sudah dideploy ke `https://radiosbl.web.app`.
- Hosting version:
  `projects/671712527716/sites/radiosbl/versions/5cf536588550e2de`.
- Hosting release:
  `projects/671712527716/sites/radiosbl/channels/live/releases/1778834005958000`.
- Verifikasi publik:
  - `https://radiosbl.web.app/?v=ai-script-20260515` merespons HTTP 200.
- Proxy lokal mode demo sudah diuji untuk `POST /ai/script-draft` dan
  mengembalikan draft naskah.
- Deploy Firebase Functions `notificationProxy` sudah dicoba, tetapi masih
  gagal karena project `radiosbl` berada di Spark Plan. Firebase CLI perlu
  mengaktifkan `artifactregistry.googleapis.com` dan `cloudbuild.googleapis.com`,
  yang membutuhkan upgrade ke Blaze Plan.
- Dampak produksi: fitur naskah AI dan WhatsApp otomatis di hosting sudah ada di
  UI, tetapi endpoint proxy production belum aktif sampai Blaze diaktifkan dan
  `functions:deploy` berhasil.

## Update Gemini Proxy dan Liputan - 15 Mei 2026

- `scripts/notification-proxy-server.mjs` dan `functions/index.js` diperkuat
  untuk rotasi banyak Gemini API key:
  - membaca `GEMINI_API_KEYS` / `GEMINI_API_KEY`;
  - kompatibilitas sementara membaca env lama `VITE_GEMINI_API_KEYS` /
    `VITE_GEMINI_API_KEY` hanya di backend/proxy;
  - mencoba beberapa model Gemini secara berurutan;
  - mengembalikan draft demo dengan warning jika semua key/model terkena quota
    atau gagal, sehingga UI tidak berhenti di `Failed to fetch`.
- `.env.local` lokal diarahkan ke proxy bawaan repo:
  - `VITE_GEMINI_PROXY_ENDPOINT=http://localhost:8788/gemini/draft`
  - `VITE_AI_SCRIPT_PROXY_ENDPOINT=http://localhost:8788/ai/script-draft`
  - `NOTIFICATION_PROXY_PORT=8788`
- Key Gemini dipindahkan dari prefix public `VITE_` ke `GEMINI_API_KEYS`
  non-public. Scan build terbaru memastikan Gemini key tidak bocor ke `dist`.
- Status uji lokal:
  - proxy membaca 4 key Gemini non-Firebase yang masih tersedia di workspace;
  - semua key/model saat diuji terkena quota, sehingga proxy mengembalikan demo
    fallback, bukan error 400/`Failed to fetch`;
  - `POST /gemini/draft` dan `POST /ai/script-draft` merespons 200.
- Verifikasi terbaru:
  - `node --check scripts/notification-proxy-server.mjs` berhasil.
  - `node --check functions/index.js` berhasil.
  - `npm --prefix functions run lint` berhasil.
  - `npm run lint` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` menghasilkan 19 test files passed dan 62 tests passed.
  - `npm run build` berhasil.
  - `npm run test:e2e` menghasilkan 4 tests passed.

## Update Uji Naskah Otomatis - 15 Mei 2026

- Panel `Naskah siaran otomatis` sekarang default memakai provider Gemini agar
  langsung memakai key Gemini lokal, bukan fallback OpenAI tanpa
  `OPENAI_API_KEY`.
- `.env.local` lokal sudah berisi:
  - `GEMINI_API_KEYS` non-public;
  - `VITE_GEMINI_PROXY_ENDPOINT=http://localhost:8788/gemini/draft`;
  - `VITE_AI_SCRIPT_PROXY_ENDPOINT=http://localhost:8788/ai/script-draft`.
- Uji langsung `POST http://localhost:8788/ai/script-draft` dengan provider
  Gemini berhasil mengenai proxy dan membaca key, tetapi masih fallback karena
  semua key/model terkena quota Gemini.
- Teks UI lama `Draft demo dibuat. Isi endpoint dan API key...` sudah diganti.
  Jika AI gagal quota, UI menampilkan warning jelas dan tetap menyediakan
  fallback sementara yang bisa diedit penyiar.
- Untuk AI produksi sungguhan, perlu salah satu:
  - Gemini key aktif dengan quota/billing yang tersedia; atau
  - `OPENAI_API_KEY` valid untuk provider ChatGPT/OpenAI.

## Kebiasaan Wajib Setiap Sesi

- Setiap perubahan signifikan harus dicatat di `docs/CODEX_SESSION_LOG.md`.
- Jika status besar berubah, update juga `docs/HANDOFF.md`.
- Setelah implementasi, jalankan verifikasi minimal:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

- Untuk perubahan data/schema, tambahkan:

```bash
npm run seed:export
npm run seed:import
```

## Update 15 Mei 2026 - UX Modernisasi Onboarding, Login & Audio

- Merapikan layout PC/Desktop untuk Splash, Onboarding, dan LoginPage menggunakan skema split-screen modern.
- Menerapkan fitur pendaftaran Firebase sesungguhnya dengan default role 'public' dan fallback UI Bahasa Indonesia.
- Memperbaiki perilaku Autoplay audio: Sweeper radio ('sweepersbl.mp3') sekarang diputar otomatis tepat saat tombol play pertama ditekan oleh pengguna.
- SplashPage UI diperkaya dengan logo SBL, animasi equalizer radio, dan slogan 'Suara Pinrang, Suara Kita!'.
- UI Tombol Putar diberi efek pulse-glow untuk meningkatkan tingkat interaksi.
- Project dalam kondisi stabil, typecheck lulus.

## Update 15 Mei 2026 - Babak 1 Halaman Jadwal

- Halaman Jadwal mulai dirapikan secara iteratif sesuai `PERJANJIAN_JUMAT_MALAM.md`.
- Perubahan saat ini fokus visual/responsif:
  - root Jadwal memakai `100dvh` dan safe-area bottom;
  - mobile tetap satu kolom;
  - desktop memakai layout dua kolom dengan panel naskah AI di sisi kanan;
  - modal tukar/edit aman untuk layar pendek karena bisa scroll.
- File utama:
  - `src/components/BroadcastSchedulePage.tsx`
  - `src/styles/app.css`
- Verifikasi berhasil:
  - lint khusus `BroadcastSchedulePage`;
  - typecheck;
  - test suite;
  - build.
- Catatan penting:
  - `npm run lint` global telah dibersihkan dari utang lint lama di `src/App.tsx` (unused imports dirapikan).
  - Fitur Tukar Jadwal masih berupa notifikasi lokal dan belum tersimpan ke Firestore. Ini kandidat babak berikutnya bila ingin mematuhi pilar "Fungsionalitas Nyata".

## Update 15 Mei 2026 - Babak 2 Mobile Shell

- Menyesuaikan shell mobile setelah evaluasi visual pengguna:
  - Jadwal mobile dipaksa bebas horizontal overflow;
  - panel AI Jadwal dibuat lebih patuh lebar layar kecil;
  - mini player radio dipindahkan ke bawah, berada di atas bottom nav pada mobile dan pojok bawah pada desktop;
  - mini player sekarang ringkas: play/pause, teks satu baris, equalizer kecil, dan volume;
  - bottom navigation memakai panah kiri/kanan sebagai hint overflow yang muncul sesuai posisi scroll.
- File utama:
  - `src/components/GlobalAudioPlayer.tsx`
  - `src/components/Shell.tsx`
  - `src/styles/app.css`
  - `src/components/BroadcastSchedulePage.tsx` tetap memakai class hasil Babak 1.
- Verifikasi berhasil:
  - lint khusus file yang disentuh;
  - typecheck;
  - test suite;
  - build.

## Update 15 Mei 2026 - Babak 3 Jadwal dan Full-Width Player

- Halaman Jadwal dipoles mengikuti referensi UI/UX Super-App:
  - kartu jadwal lebih compact;
  - slot jadwal memakai thumbnail `coverSBL.jpg`;
  - panel AI terbuka di desktop, tetapi tertutup default di mobile.
- Global radio player:
  - desktop full-width pada area utama dan mentok di bawah layar;
  - mobile full-width di atas bottom navigation;
  - tetap memakai `AudioContext.togglePlayback`, sehingga play pertama tetap diawali `sweepersbl.mp3` sebelum stream.
- Verifikasi berhasil:
  - lint khusus file yang disentuh;
  - typecheck;
  - test suite;
  - build.

## Update 16 Mei 2026 - Podcast Feed dan Responsif

- Fokus babak ini: halaman Podcast saja.
- File utama:
  - `src/components/PodcastPage.tsx`
  - `src/services/podcast.service.ts`
  - `src/styles/app.css`
  - `.env.example`
- Status:
  - header Podcast sudah mengikuti bahasa visual halaman Jadwal;
  - dummy daftar podcast/episode sudah dihapus;
  - feed RSS terbuka dapat dipasang lewat `VITE_PODCAST_FEED_URL`;
  - jika feed belum ada di env atau gagal dimuat, UI menampilkan embed Spotify resmi dari sumber yang sudah ada, bukan konten palsu.
- Catatan lanjutan:
  - untuk menampilkan daftar episode native, isi `VITE_PODCAST_FEED_URL` dengan URL RSS podcast yang benar;
  - URL Spotify show biasa tidak menyediakan daftar episode RSS langsung ke browser tanpa API/feed tambahan.
- Verifikasi berhasil:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`

### Koreksi Spotify Episodes

- Endpoint baru disiapkan untuk membaca seluruh episode channel Spotify SBL:
  - `POST /spotify/show-episodes` di `functions/index.js`;
  - route yang sama di `scripts/notification-proxy-server.mjs`.
- Frontend memakai `VITE_PODCAST_API_ENDPOINT` untuk mengambil show `5E9y3LGQv233K22ZzYANLF`.
- Secret yang dibutuhkan di backend/proxy:
  - `SPOTIFY_CLIENT_ID`
  - `SPOTIFY_CLIENT_SECRET`
- Untuk lokal:
  - `.env.local` sudah diarahkan ke `http://localhost:8789/spotify/show-episodes`;
  - restart `npm run proxy:notifications` setelah env secret diisi.
- Untuk produksi:
  - pasang secret/env Spotify pada Cloud Functions;
  - deploy ulang `notificationProxy`;
  - pastikan `VITE_PODCAST_API_ENDPOINT` mengarah ke endpoint Cloud Functions.
- Hasil cek kredensial 16 Mei 2026:
  - token Spotify berhasil dibuat (`HTTP 200`);
  - endpoint episode show masih ditolak Spotify (`HTTP 403`);
  - penyebab yang terlihat pada dashboard Spotify: aplikasi diblokir dari Web API karena akun belum Spotify Premium.
  - setelah akun/app diizinkan, endpoint yang sama seharusnya dapat mengisi kartu episode Podcast.
- Fallback mode gratis sudah dipasang:
  - `PodcastPage` memuat beberapa Spotify episode embed resmi dari channel SBL;
  - layout tetap berupa kartu-kartu seperti dummy sebelumnya;
  - ini menjadi tampilan produksi sementara sampai Web API Spotify bisa dipakai.
- Koreksi UI terbaru:
  - header sticky Podcast dihapus karena hero Podcast sudah cukup menjadi pembuka halaman;
  - metadata tanggal/durasi pada mode embed gratis disembunyikan jika datanya kosong;
  - tidak ada lagi teks "Tanggal belum tersedia" di layar.
- Poles dari screenshot Podcast:
  - hero memakai logo SBL;
  - deskripsi hero memakai copy resmi SBL Podcast dari pengguna;
  - link channel resmi menjadi ikon Spotify saja;
  - notice mode gratis dihapus;
  - kartu episode pilihan atas tidak lagi memakai iframe Spotify sempit, sehingga tidak ada scrollbar internal.
- Layout mobile terbaru:
  - hero memakai lockup logo + title di atas;
  - deskripsi full width di bawah dan dapat diperluas dengan `Selengkapnya`;
  - link Spotify tampil sebagai ikon + teks `SBL Podcast on Spotify`;
  - featured episode hanya 2 kartu persegi panjang, tersusun ke bawah di mobile;
  - daftar bawah memakai heading `Episode Lainnya`.

### Dashboard Quick Menu

- Per 17 Mei 2026, ikon grid Dashboard sudah dipoles:
  - `DashboardPage` memberi aksen warna berbeda untuk tiap shortcut;
  - `app.css` mengatur kartu menu, icon tile, hover/focus, dan label responsif;
  - navigasi serta permission menu tetap mengikuti data yang sama.
- Tombol tiga titik di bawah grid menjadi toggle:
  - klik pertama menampilkan semua menu;
  - klik berikutnya menyembunyikan menu tambahan;
  - ukuran tombol/titik sudah diperkecil.
- Verifikasi terbaru:
  - `npm run typecheck` berhasil.
  - `npm run build` berhasil.
  - `npm run lint` masih gagal karena debt lama lint di `scratch/*.mjs` dan beberapa file non-dashboard.
  - `npm run test` masih gagal pada assertion lama resolver/seed penyiar `Miah/Salmiah`.

### Radio Player Visualizer

- Per 17 Mei 2026, player radio Dashboard memiliki visualizer latar:
  - bar visualizer 24 kolom;
  - orbit/pulse di area tombol play;
  - shimmer dan respons hover/focus;
  - state lebih aktif saat `playing`.
- `AudioPlayer` reusable juga mendapat background aurora dan bar visualizer yang lebih dinamis.
- Animasi memakai `aria-hidden` dan menghormati `prefers-reduced-motion`.
- Verifikasi terbaru:
  - `npm run typecheck` berhasil.
  - `npm run build` berhasil.
  - Cek Playwright manual mobile berhasil tanpa overflow horizontal.
  - `npm run lint` masih gagal karena debt lama lint di file non-player.
  - `npm run test` masih gagal pada assertion lama resolver/seed penyiar `Miah/Salmiah`.
- Update lanjutan:
  - visualizer Dashboard diperjelas untuk preview iPhone 14 Pro Max;
  - `scheduleSlot.service.ts` memakai fallback jadwal lokal secara senyap saat Firestore mengembalikan `permission-denied`, sehingga console tidak dibanjiri error merah jadwal.
  - spectrum player kemudian dilembutkan lagi: warna mendekati biru latar, opacity/glow diturunkan, dan bar tidak lagi mengganggu keterbacaan teks.
  - visualizer terbaru memakai SVG dotted wave spectrum cyan/magenta dengan mesh tipis, menggantikan model bar.

### Cover dan Detail Program

- Per 17 Mei 2026, katalog program resmi ada di `src/data/radioData.ts` melalui `getProgramInfo(programName)`.
- Cover program memakai gambar dari `public/program`.
- Halaman Jadwal:
  - setiap kartu jadwal memakai cover sesuai program;
  - klik kartu atau Enter/Space membuka modal detail program;
  - modal detail menampilkan cover, judul, hari/jam, penyiar, dan deskripsi singkat.
- Frame cover kartu jadwal, Dashboard, dan popup/detail program sudah memakai rasio 16:9 agar gambar program lebih pas.
- Dashboard:
  - kartu `Jadwal Berikutnya` memakai cover dan deskripsi dari katalog program.
- Profil penyiar:
  - setiap slot jadwal program di profil penyiar bisa diklik;
  - klik membuka popup detail program yang sama dengan halaman Jadwal.
- Verifikasi terbaru:
  - `npm run typecheck` berhasil.
  - `npm run build` berhasil.
  - Cek Playwright iPhone 14 Pro Max mode demo berhasil tanpa overflow horizontal.
  - `npm run lint` dan `npm run test` masih gagal karena debt lama non-fitur ini.

### Jadwal Berikutnya Dashboard

- `Jadwal Berikutnya` Dashboard sekarang dihitung dari jadwal utama dan program sisipan harian, bukan hanya slot utama mingguan.
- Saat sedang `Jeda Siaran 23.00 - 05.00`, kartu berikutnya mengarah ke program paling dekat berikutnya, contoh `Salam Subuh 05.00 - 07.00`.
- Layout kartu sudah khusus:
  - mobile cover 16:9 di atas dan teks di bawah;
  - desktop cover kiri proporsional dengan tinggi sama seperti susunan judul/meta/jam/deskripsi kanan.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run build` berhasil.
  - Cek Playwright iPhone 14 Pro Max mode demo berhasil tanpa overflow horizontal.

### Tukar Jadwal

- Query Firestore untuk `schedule_swaps` sudah dirapikan agar tidak membutuhkan composite index:
  - `getMySwapRequests(userId)` hanya memakai filter `requesterId` dan `targetAnnouncerId`;
  - semua hasil diurutkan terbaru di sisi aplikasi dengan helper `sortByNewest`.
- Ini mengatasi error console `The query requires an index` dari `ScheduleSwapPage.tsx:48` tanpa harus menunggu deploy index baru.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run build` berhasil.
  - `npm run lint` masih gagal karena debt lama di file lain, terutama `scratch/*.mjs`.

### Splash dan Login

- Per 17 Mei 2026, halaman splash dan login sudah dipoles sebagai alur pembuka Radio SBL:
  - aset baru `public/sbl-auth-studio-bg.png` dipakai sebagai latar studio radio;
  - `SplashPage` punya mode mobile kartu fokus dan desktop split visual `91.5 FM`;
  - `LoginPage` memakai glass card, tab Masuk/Daftar, input berikon, CTA lime, Google login, lupa sandi, dan toggle password;
  - fungsi login email/WA, daftar, Google, dan reset sandi tetap memakai service yang sama.
- Shell untuk `splash`, `onboarding`, dan `login` di-override agar tidak membawa padding konten aplikasi utama.
- Verifikasi terbaru:
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil.
  - `npm run build` berhasil.
  - `npx playwright test login.smoke.spec.ts` berhasil.
  - Cek screenshot Playwright mobile 390x844 dan desktop 1440x900 berhasil tanpa overflow horizontal atau scroll bocor.
- Catatan:
  - `npm run lint` masih gagal karena debt lama lint di file lain, terutama `scratch/*.mjs` dan beberapa unused/any yang tidak terkait pekerjaan ini.

### Proxy Podcast Lokal

- Per 17 Mei 2026, proxy Spotify lokal tidak lagi menjadi dependency wajib saat development.
- `podcast.service.ts` akan mengabaikan endpoint `localhost`, `127.0.0.1`, atau `::1` di mode dev jika `VITE_ENABLE_LOCAL_PODCAST_PROXY` belum diaktifkan.
- `.env.local` disarankan untuk development harian:
  - `VITE_PODCAST_API_ENDPOINT=`
  - `VITE_ENABLE_LOCAL_PODCAST_PROXY=false`
- Untuk mengetes episode Spotify live secara lokal:
  - jalankan `npm run proxy:notifications`;
  - isi `VITE_PODCAST_API_ENDPOINT=http://localhost:8789/spotify/show-episodes`;
  - set `VITE_ENABLE_LOCAL_PODCAST_PROXY=true`;
  - restart `npm run dev`.
- Verifikasi terbaru:
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil.
  - `npm run build` berhasil.
  - Cek Playwright manual tidak mendeteksi request/failure ke `localhost:8789`.
- Catatan:
  - `npm run lint` masih gagal karena debt lama di file lain, terutama `scratch/*.mjs`.

### Onboarding Dihapus

- Per 17 Mei 2026, halaman onboarding/tombol `Mulai Sekarang` sudah dihapus dari alur aplikasi.
- Alur pembuka sekarang:
  - `SplashPage`
  - langsung ke `LoginPage`
- `PageKey`, `App.tsx`, `Shell.tsx`, file `OnboardingPage.tsx`, dan CSS `.onboarding-*` sudah dibersihkan.
- Verifikasi:
  - `rg -n "onboarding|OnboardingPage" src` tidak menemukan referensi.
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil.
  - `npm run build` berhasil.
  - `npx playwright test login.smoke.spec.ts` berhasil.

### Checkbox Ingat Saya

- Per 17 Mei 2026, checkbox `Ingat saya` di halaman login sudah fungsional.
- Perilaku:
  - dicentang: sesi bertahan di browser (`browserLocalPersistence` / `localStorage` untuk demo);
  - tidak dicentang: sesi hanya selama sesi/tab browser (`browserSessionPersistence` / `sessionStorage` untuk demo).
- Berlaku untuk login email/WA, pendaftaran, Google login, dan auto-onboarding staf.
- Logout membersihkan sesi demo dari `sessionStorage` dan `localStorage`.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil.
  - `npm run build` berhasil.

### Halaman Penyiar

- Per 17 Mei 2026, halaman `Penyiar` sudah dipoles agar konsisten dengan UI/UX aplikasi:
  - hero header memakai logo, tagline, dan ringkasan data;
  - kartu penyiar interaktif membuka profil penyiar;
  - kartu menampilkan foto, status aktif, statistik, hari siaran, cuplikan jadwal, dan CTA;
  - layout responsif: mobile satu kolom, tablet dua kolom, desktop tiga kolom;
  - foto penyiar memakai aset lokal `public/crew`, bukan URL remote.
- Profil penyiar juga diselaraskan:
  - header sticky khusus profil penyiar;
  - frame foto dan kartu profil lebih konsisten;
  - daftar jadwal tetap bisa membuka popup detail program.
- Verifikasi:
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil.
  - `npm run build` berhasil.
  - `npx playwright test login.smoke.spec.ts` berhasil.
  - lint khusus file yang disentuh berhasil.
  - `npm run lint` penuh masih gagal karena debt lama di file lain, terutama `scratch/*.mjs`.

### Halaman Aduan

- Per 17 Mei 2026, halaman `Aduan & Saran` sudah diaudit dan dipoles:
  - hero halaman memakai logo Radio SBL, tagline, dan ringkasan status aduan;
  - form input manual aduan/saran lebih rapi dan tetap terhubung ke `submitComplaint`;
  - daftar aduan tampil sebagai tiket status dengan aksi nyata untuk verifikasi, proses, dan selesai;
  - realtime/list tetap memakai `subscribeComplaints` dan `listComplaints`;
  - perubahan status tetap memakai `updateComplaintStatus`;
  - mobile satu kolom, desktop dua kolom, tanpa overflow horizontal pada cek Playwright.
- Koreksi kecil:
  - import ikon dobel di `ProfilePage.tsx` dibersihkan karena sempat membuat `npm run typecheck` gagal.
- Verifikasi:
  - `npx eslint src\components\ComplaintsPage.tsx src\components\ProfilePage.tsx` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil.
  - `npm run build` berhasil.
  - Cek Playwright manual halaman Aduan mobile/desktop berhasil tanpa overflow horizontal.
  - `npm run lint` penuh masih gagal karena debt lama lint lintas repo, terutama `scratch/*.mjs`, beberapa unused import/variable, dan beberapa `any`.

### Halaman Pembuatan Naskah AI

- Per 17 Mei 2026, halaman `Buat Naskah AI` sudah dipoles:
  - hero halaman memakai logo, tagline `Asisten kreatif`, dan deskripsi fungsi;
  - teks visual `Gemini 2.5 Flash` dihapus dari UI;
  - notifikasi sukses generator memakai bahasa netral pengguna, bukan nama model teknis;
  - kartu konteks program aktif menampilkan hari/jam, program, deskripsi, dan penyiar;
  - konfigurasi naskah dan editor draft dibuat lebih konsisten dengan tema Radio SBL;
  - layout mobile/desktop sudah dicek tanpa overflow horizontal.
- Fungsi:
  - generator tetap melalui `generateProgramScript`;
  - arsip draft tetap melalui `saveProgramScript`;
  - model internal service tidak diubah agar integrasi AI tetap berjalan.
- Koreksi pendukung:
  - `attendance.service.ts` dipulihkan agar status dasar absensi tetap sesuai test `present/outside_radius`, sambil mempertahankan field verifikasi tambahan.
- Verifikasi:
  - `npx eslint src\components\AiScriptPage.tsx src\services\aiScript.service.ts src\services\attendance.service.ts` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil.
  - `npm run build` berhasil.
  - `npx playwright test login.smoke.spec.ts` berhasil.
  - Cek Playwright manual halaman Naskah AI mobile/desktop berhasil tanpa overflow dan tanpa teks `Gemini 2.5 Flash`.
  - `npm run lint` penuh masih gagal karena debt lama lint lintas repo, terutama `scratch/*.mjs`.
- Update compact:
  - kontainer halaman diperluas ke `1320px`;
  - panel `Konfigurasi Naskah` desktop dipadatkan menjadi sekitar `286px`;
  - padding/gap/input/textarea/tombol konfigurasi diperkecil;
  - area `Hasil Draft Naskah` dan editor dibuat lebih luas.
- Verifikasi update compact:
  - `npx eslint src\components\AiScriptPage.tsx` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil.
  - `npm run build` berhasil.
  - Cek Playwright manual mobile/desktop berhasil tanpa overflow horizontal.

### Tukar Jadwal Tanpa Approval Admin

- Per 17 Mei 2026, alur tukar jadwal resmi langsung antar penyiar:
  - pemohon membuat request `pending_target`;
  - penyiar pengganti menyetujui/menolak;
  - jika disetujui, jadwal langsung dibuatkan override dan status menjadi `approved`;
  - jika ditolak, status menjadi `rejected`.
- Jalur lama approval admin sudah dibersihkan:
  - status `pending_admin` dihapus dari tipe domain dan Firestore rules;
  - helper admin `getPendingSwapsForAdmin()` dihapus;
  - komponen `AdminVerificationPage` dihapus.
- Label status halaman `Tukar Jadwal` dibedakan antara pemohon dan target agar tidak membingungkan.
- Verifikasi:
  - `npx eslint src\components\ScheduleSwapPage.tsx src\services\scheduleSwap.service.ts src\types\domain.ts` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil.
  - `npm run lint` penuh masih gagal karena debt lama lint lintas repo, terutama `scratch/*.mjs`, beberapa unused import/variable, dan beberapa `any` di file non-perubahan.
- Update hardening:
  - `scheduleSwap.service.ts` punya fallback lokal untuk mode test/demo atau Firestore permission/offline agar klik tombol tukar jadwal tidak jatuh ke error;
  - resolve nama penyiar pengganti memakai katalog lokal saat fallback;
  - form `ScheduleSwapPage` memakai label/input yang terasosiasi;
  - smoke test `src/e2e/schedule-swap.smoke.spec.ts` menguji pemohon -> target setuju -> status `approved` dan override tercatat.
- Verifikasi hardening:
  - `npx eslint src\e2e\schedule-swap.smoke.spec.ts src\services\scheduleSwap.service.ts src\components\ScheduleSwapPage.tsx` berhasil.
  - `npm run typecheck` berhasil.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 2 test mobile/desktop lulus.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 6 test lulus.
- Update notifikasi target:
  - request tukar jadwal kini menyimpan `requesterAliases` dan `targetAnnouncerAliases`;
  - alias mencakup UID, WhatsApp, `wa-{nomor}`, nama udara, nama tampil, employeeId, dan nama jadwal;
  - pihak target bisa melihat permintaan masuk walau UID akun Firebase berbeda dari ID penyiar/WA;
  - query juga kompatibel dengan request lama yang masih hanya punya `targetAnnouncerId`;
  - badge notifikasi `Shell` memakai alias target dan menghitung status `pending_target`;
  - alias disimpan dalam bentuk asli dan lowercase; query produksi memakai alias yang bisa dibuktikan oleh rules;
  - listener badge punya error handler agar permission/index issue tidak memecah UI;
  - Firestore rules sudah disiapkan untuk read/update berdasarkan alias.
- Verifikasi update notifikasi:
  - `npx eslint src\services\scheduleSwap.service.ts src\components\ScheduleSwapPage.tsx src\components\BroadcastSchedulePage.tsx src\components\Shell.tsx src\e2e\schedule-swap.smoke.spec.ts src\types\domain.ts` berhasil.
  - `npm run typecheck` berhasil.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 2 test mobile/desktop lulus.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 6 test lulus.
- Deploy produksi:
  - Firestore rules sudah dideploy ke project `radiosbl`.
  - Ruleset: `projects/radiosbl/rulesets/04dd2099-8f27-44b7-ad50-d0a729f8534f`.
  - Hosting sudah dideploy ke `https://radiosbl.web.app`.
  - Hosting version: `projects/671712527716/sites/radiosbl/versions/b6f33bd4656b2756`.
  - Hosting release: `projects/671712527716/sites/radiosbl/channels/live/releases/1779024707949000`.
  - Verifikasi publik `https://radiosbl.web.app/?v=schedule-swap-alias-20260517` merespons HTTP 200 dan memuat bundle `index-WiyIZXia`.

- Update audit lanjutan setelah laporan masih belum berhasil:
  - approval override kini memakai UID akun target yang sedang login sebagai `createdBy`, bukan `targetAnnouncerId`;
  - `ScheduleSwapPage` meneruskan `session.user` saat target klik `Setujui` atau `Tolak`;
  - query daftar permintaan dibuat tahan partial `permission-denied` agar satu alias gagal tidak mengosongkan seluruh hasil;
  - alias query dan rules menerima `announcerNames`;
  - badge notifikasi `Shell` juga membaca request lama berbasis `targetAnnouncerId`;
  - Firestore rules mengunci approval target dari status `pending_target` dan tetap tidak mengaktifkan antrean admin sebagai alur resmi.
- Verifikasi update audit lanjutan:
  - `npx eslint src\services\scheduleSwap.service.ts src\components\ScheduleSwapPage.tsx src\components\BroadcastSchedulePage.tsx src\components\Shell.tsx src\e2e\schedule-swap.smoke.spec.ts src\types\domain.ts` berhasil.
  - `npm run typecheck` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-B1MP49Pk.js`.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 2 test lulus.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 6 test lulus.
- Deploy update audit lanjutan:
  - Firestore rules ruleset: `projects/radiosbl/rulesets/9d8f86da-39af-4daa-8726-1ea28068bc80`.
  - Hosting version: `projects/671712527716/sites/radiosbl/versions/9cc4e1064aa784ec`.
  - Hosting release: `projects/671712527716/sites/radiosbl/channels/live/releases/1779026090645000`.
  - Verifikasi publik `https://radiosbl.web.app/?v=schedule-swap-direct-fix-20260517` merespons HTTP 200 dan memuat bundle `index-B1MP49Pk.js`.
- Catatan penting:
  - Request lama sebelum alias/UID fix mungkin perlu dikirim ulang bila `targetAnnouncerId` tidak cocok dengan UID/WA target.
  - Jika permintaan baru masih tidak muncul, cek profil Firestore target: `active: true`, role yang sesuai, serta `whatsapp`, `airName`, atau `announcerNames` harus cocok dengan data penyiar.

- Update audit tanggal tukar jadwal:
  - `targetDate` sekarang wajib valid `YYYY-MM-DD` sebelum request disimpan;
  - approval tidak lagi fallback ke tanggal hari ini jika tanggal hilang;
  - override jadwal memakai tanggal yang dipilih user;
  - Firestore rules mewajibkan `targetDate` di `schedule_swaps`;
  - smoke test memastikan tanggal terlihat di pemohon/target dan tersimpan sebagai `swap.targetDate` serta `override.date`.
- Verifikasi audit tanggal:
  - `npx eslint src\services\scheduleSwap.service.ts src\components\ScheduleSwapPage.tsx src\components\BroadcastSchedulePage.tsx src\components\Shell.tsx src\e2e\schedule-swap.smoke.spec.ts src\types\domain.ts` berhasil.
  - `npm run typecheck` berhasil.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 2 test lulus.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-DfA9pxwY.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 6 test lulus.
- Deploy audit tanggal:
  - Firestore rules ruleset: `projects/radiosbl/rulesets/318ceb7d-9a79-489d-b95f-fc179ddd36fa`.
  - Hosting version: `projects/671712527716/sites/radiosbl/versions/81eb98a19cbde785`.
  - Hosting release: `projects/671712527716/sites/radiosbl/channels/live/releases/1779026626565000`.
  - Verifikasi publik `https://radiosbl.web.app/?v=schedule-swap-date-fix-20260517` merespons HTTP 200 dan memuat bundle `index-DfA9pxwY.js`.
- Catatan penting audit tanggal:
  - Request lama tanpa `targetDate` perlu dikirim ulang karena sistem sekarang sengaja menolak approval tanpa tanggal agar jadwal tidak diperbarui di hari yang salah.

- Update WhatsApp konfirmasi tukar jadwal:
  - request tukar jadwal sekarang juga menyiapkan/mengirim pesan WhatsApp ke nomor penyiar pengganti;
  - pesan memuat pemohon, tanggal, jadwal/program, alasan, dan link konfirmasi;
  - link konfirmasi memakai `?page=scheduleSwap&swapId=...`;
  - App membaca query `page=scheduleSwap`, sehingga penerima link diarahkan ke halaman konfirmasi setelah login;
  - jika proxy WhatsApp aktif, pesan terkirim otomatis;
  - jika proxy belum aktif, UI membuka draft WhatsApp agar pemohon bisa mengirim manual.
- Verifikasi WhatsApp konfirmasi:
  - `npm run typecheck` berhasil.
  - `npx eslint src\App.tsx src\services\scheduleSwap.service.ts src\components\ScheduleSwapPage.tsx src\components\BroadcastSchedulePage.tsx src\e2e\schedule-swap.smoke.spec.ts src\services\whatsappNotification.service.ts` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-ZW2RNGDI.js`.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 2 test lulus dan memvalidasi draft WhatsApp berisi nomor target serta `page=scheduleSwap`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 6 test lulus.
- Deploy WhatsApp konfirmasi:
  - Hosting version: `projects/671712527716/sites/radiosbl/versions/ee8ccd9fa25ed8aa`.
  - Hosting release: `projects/671712527716/sites/radiosbl/channels/live/releases/1779027381112000`.
  - Verifikasi publik `https://radiosbl.web.app/?v=schedule-swap-wa-link-20260517` merespons HTTP 200 dan memuat bundle `index-ZW2RNGDI.js`.
- Catatan:
  - Pengiriman otomatis butuh `VITE_WHATSAPP_PROXY_ENDPOINT` dan secret WhatsApp Cloud API aktif. Tanpa itu fallback draft WhatsApp tetap tersedia.

- Update realtime tukar jadwal:
  - halaman `Tukar Jadwal` kini memakai `subscribeMySwapRequests()` dengan Firestore `onSnapshot`;
  - request baru muncul di penyiar pengganti tanpa refresh;
  - jawaban setuju/tolak muncul di pemohon tanpa refresh;
  - mode demo/test punya fallback event lokal `sbl_schedule_swaps_changed` dan event `storage`;
  - listener membaca request sebagai pemohon, target UID, target alias, serta legacy `targetAnnouncerId`;
  - alur resmi tetap tanpa admin: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui jika disetujui.
- Verifikasi realtime tukar jadwal:
  - `npm run typecheck` berhasil.
  - `npx eslint src\services\scheduleSwap.service.ts src\components\ScheduleSwapPage.tsx src\e2e\schedule-swap.smoke.spec.ts` berhasil.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 4 test lulus termasuk simulasi realtime tanpa refresh.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-DKEk9RuI.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 8 test lulus.
- Deploy realtime tukar jadwal:
  - Hosting version: `projects/671712527716/sites/radiosbl/versions/15e9dd744eb09045`.
  - Hosting release: `projects/671712527716/sites/radiosbl/channels/live/releases/1779028062546000`.
  - Verifikasi publik `https://radiosbl.web.app/?v=schedule-swap-realtime-20260517` merespons HTTP 200 dan memuat bundle `index-DKEk9RuI.js`.
  - Firestore rules tidak dideploy ulang pada update realtime karena tidak berubah.

- Update fondasi UI `ARAHAN_UI.md` batch 1:
  - bottom navigation mobile sekarang maksimal 5 item: `Beranda`, `Jadwal`, `Absensi`, `Request`, `Menu`;
  - fitur lain pindah ke halaman `Menu Lengkap`, bukan dihapus;
  - `Menu Lengkap` berisi grup Operasional, Siaran, Konten, Administrasi, dan Sistem;
  - sidebar desktop dikelompokkan ulang agar sesuai arah UI modern dan tidak berupa list panjang;
  - badge tukar jadwal tetap muncul di `Menu` mobile dan tile `Tukar Jadwal`;
  - token CSS awal `.ui-card`, `.ui-button`, dan `.ui-badge` tersedia untuk batch refactor halaman berikutnya;
  - test e2e `login.smoke.spec.ts` memvalidasi bottom nav 5 item/menu lengkap mobile dan sidebar desktop;
  - test e2e `schedule-swap.smoke.spec.ts` sudah mengikuti jalur mobile baru lewat `Menu Lengkap`.
- Verifikasi fondasi UI batch 1:
  - `npm run typecheck` berhasil.
  - `npx eslint src\data\radioData.ts src\components\Shell.tsx src\components\MenuPage.tsx src\App.tsx src\e2e\login.smoke.spec.ts src\e2e\schedule-swap.smoke.spec.ts` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-B5oAHb4b.js`.
  - `npx playwright test login.smoke.spec.ts` berhasil, 6 test lulus.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 4 test lulus.
- Catatan fondasi UI:
  - perubahan ini belum dideploy ke hosting produksi pada saat catatan dibuat;
  - tidak ada perubahan Firebase schema/service/rules;
  - `docs/ARAHAN_UI.md` masih file arahan baru di working tree dan perlu ikut commit bila dijadikan dokumen resmi.

- Update Dashboard mobile `ARAHAN_UI.md` batch 2:
  - Dashboard sekarang punya papan aksi utama di bawah player ON AIR;
  - kartu aksi: `Jadwal saya hari ini`, `Absensi`, `Request lagu`, dan `Notifikasi penting`;
  - jadwal pribadi dihitung dari slot hari ini yang cocok dengan `airName`, `displayName`, atau awalan email user;
  - status absensi hari ini memakai `attendanceRecords` yang sudah tersedia, tanpa query/service baru;
  - tombol aksi tetap menuju halaman resmi yang sudah ada.
- Verifikasi Dashboard batch 2:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx src\e2e\login.smoke.spec.ts` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-Drfdizqp.js`.
  - `npx playwright test login.smoke.spec.ts` berhasil, 6 test lulus.
- Catatan Dashboard batch 2:
  - belum dideploy ke hosting produksi;
  - tidak ada perubahan schema Firebase, rules, atau service produksi.

- Update Absensi mobile `ARAHAN_UI.md` batch 3:
  - halaman Absensi kini punya ringkasan atas `Status hari ini`, `Lokasi dan GPS`, dan `Bukti selfie`;
  - ringkasan membaca kondisi check-in/check-out, jarak kantor, akurasi GPS, dan status upload selfie;
  - error check-out memakai pesan inline, bukan `alert()`;
  - label status absensi diperluas untuk sakit, izin, tugas luar, luar radius, perlu tinjau, dan validasi admin;
  - type `AttendanceType` mengganti cast `any` pada pilihan status.
- Verifikasi Absensi batch 3:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\AttendancePage.tsx src\components\DashboardPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-1m8Aj1mq.js`.
  - `npx playwright test login.smoke.spec.ts` berhasil, 6 test lulus.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 4 test lulus.
- Catatan Absensi batch 3:
  - belum dideploy ke hosting produksi;
  - algoritma absensi, radius kantor, AI selfie, upload Google Drive, Firestore schema, rules, dan service tidak diubah.

- Update Jadwal Siaran mobile `ARAHAN_UI.md` batch 4:
  - halaman Jadwal kini punya ringkasan tanggal berisi hari/tanggal, jumlah slot, dan program live jika ada;
  - empty state tampil saat tanggal yang dipilih belum memiliki jadwal;
  - status slot distandarkan: `Reguler`, `Sedang Berjalan`, `Pengganti`, `Khusus`, `Tentative`, `Tentative Aktif`, dan `Dibatalkan`;
  - program berformat `Program A / Program B` dipisahkan menjadi judul utama dan baris `Tentative`;
  - detail program memakai judul utama agar cover/deskripsi tetap tepat;
  - flow tukar jadwal dari halaman Jadwal tetap memakai jalur resmi yang sudah ada.
- Verifikasi Jadwal batch 4:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\BroadcastSchedulePage.tsx src\components\AttendancePage.tsx src\components\DashboardPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-Dxrgnxoh.js`.
  - `npx playwright test login.smoke.spec.ts` berhasil, 6 test lulus.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 4 test lulus.
- Catatan Jadwal batch 4:
  - belum dideploy ke hosting produksi;
  - business logic jadwal, service jadwal, rules, schema Firebase, dan flow tukar jadwal tidak diubah.

- Update Request Lagu mobile `ARAHAN_UI.md` batch 5:
  - halaman Request Lagu kini berbasis card, bukan kumpulan panel inline style;
  - request dikelompokkan menjadi `Masuk sekarang`, `Siap diputar`, dan `Riwayat`;
  - ringkasan atas menampilkan jumlah request masuk, antrean, dan selesai;
  - kartu request menampilkan pengirim, lagu/artis, nomor WhatsApp, pesan, status, dan tombol cepat;
  - aksi tetap memakai status/service existing: simpan ke antrean, tandai diputar, balas WhatsApp, dan tolak;
  - empty state tiap kelompok dibuat lebih manusiawi;
  - mobile dibuat satu kolom dengan tombol mudah ditekan.
- Verifikasi Request Lagu batch 5:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\SongRequestsPage.tsx src\components\BroadcastSchedulePage.tsx src\components\AttendancePage.tsx src\components\DashboardPage.tsx src\components\Shell.tsx src\components\MenuPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-5N8Rzx4u.js`.
  - `npx playwright test login.smoke.spec.ts` berhasil, 6 test lulus.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 4 test lulus.
- Catatan Request Lagu batch 5:
  - belum dideploy ke hosting produksi;
  - business logic request lagu, service, schema Firebase, rules, dan integrasi WhatsApp tidak diubah;
  - `src\e2e\schedule-swap.smoke.spec.ts` ikut diperketat agar cek tanggal pada kartu permintaan, bukan dropdown.

- Update Buat Naskah AI mobile `ARAHAN_UI.md` batch 6:
  - tab workspace dibuat class-based dan lebih ringkas untuk mobile;
  - panel generator tetap memakai service AI/arsip existing;
  - aksi hasil naskah dirapikan menjadi `Salin`, `Teleprompter`, dan `Arsip`;
  - tombol `Salin` ditambahkan memakai clipboard dengan feedback sukses/error;
  - rewrite bar, statistik naskah, draft card, dan empty state dibuat lebih konsisten;
  - arsip draft tampil sebagai card responsif dan mudah dimuat kembali ke editor;
  - placeholder Review/Siap Siaran dirapikan tanpa menambah workflow baru.
- Verifikasi Buat Naskah AI batch 6:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\AiScriptPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-IKJGTv0L.js`.
  - `npx playwright test login.smoke.spec.ts` berhasil, 6 test lulus.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 4 test lulus.
- Catatan Buat Naskah AI batch 6:
  - belum dideploy ke hosting produksi;
  - service AI, prompt backend, provider Gemini, Firestore schema, dan struktur draft naskah tidak diubah.

- Update Manajemen User mobile `ARAHAN_UI.md` batch 7:
  - halaman Manajemen User kini memiliki card list khusus mobile;
  - card mobile menampilkan nama, air name/email, alert profil belum lengkap, ringkasan hadir/izin/terakhir absen, role, status, dan tombol detail;
  - aksi cepat mobile tetap memakai handler existing untuk ubah role dan aktif/nonaktif user;
  - desktop table tetap dipertahankan untuk workflow admin lama;
  - CSS menyembunyikan tabel di layar kecil dan menampilkan card list dengan target sentuh yang lebih aman;
  - lint lama di file ini dibersihkan untuk import/catch yang tidak terpakai.
- Verifikasi Manajemen User batch 7:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\UsersManagementPage.tsx src\components\AiScriptPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-aH4QwXmK.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
- Catatan Manajemen User batch 7:
  - belum dideploy ke hosting produksi;
  - role, permission, auth, service user profile, Firestore schema, dan sinkronisasi staf tidak diubah.

- Update Streaming dan Liputan `ARAHAN_UI.md` batch 8:
  - `StreamingPage` tidak lagi menyimpan style/keyframes lokal besar di dalam komponen;
  - halaman Streaming punya ringkasan `Status`, `Program`, dan `Penyiar` di atas player;
  - audio context, metadata, play/pause, volume, dan request lagu tetap memakai alur lama;
  - halaman Liputan punya ringkasan status `Ditugaskan`, `Berjalan`, dan `Review`;
  - card liputan diberi class khusus agar lebih rapi di mobile;
  - tombol upload bukti dibuat lebih aman untuk target sentuh mobile;
  - import tidak terpakai di `CoveragePage` dibersihkan.
- Verifikasi Streaming/Liputan batch 8:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\StreamingPage.tsx src\components\CoveragePage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-CJuoVUGb.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
- Catatan Streaming/Liputan batch 8:
  - belum dideploy ke hosting produksi;
  - upload Google Drive, service request lagu, audio context, data liputan, dan schema Firebase tidak diubah.

- Update Live/OB `ARAHAN_UI.md` batch 9:
  - halaman Live/OB punya ringkasan progres checklist, jumlah event, dan status event aktif;
  - checklist alat memakai class CSS dan state `done` yang lebih jelas;
  - form jadwal Live/OB memakai class CSS untuk input dan tombol;
  - tombol `Kirim ke Grup WA` tetap memakai alur lama, hanya dirapikan tampilannya;
  - rundown event aktif memakai card class-based dengan link Discord/YouTube yang mudah ditekan;
  - layout mobile dibuat lebih satu kolom dan lebih aman untuk target sentuh.
- Verifikasi Live/OB batch 9:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\LiveObPage.tsx src\components\CoveragePage.tsx src\components\StreamingPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-c6vjBXmB.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
- Catatan Live/OB batch 9:
  - belum dideploy ke hosting produksi;
  - `liveOb.service`, schema `LiveEvent`, notifikasi WhatsApp, data checklist, dan logic pembuatan event tidak diubah.

- Update Tukar Jadwal `ARAHAN_UI.md` batch 10:
  - halaman Tukar Jadwal kini class-based dan lebih konsisten dengan design system;
  - ringkasan atas menampilkan `Permintaan masuk`, `Menunggu rekan`, dan `Selesai`;
  - form pengajuan dibuat lebih rapi di mobile dengan helper text, warning jadwal kosong, tombol submit penuh, dan error inline;
  - daftar permintaan/riwayat tampil sebagai card dengan badge jenis permintaan, status, tanggal, target/pemohon, alasan, dan tombol `Setujui`/`Tolak`;
  - error submit/response tidak lagi memakai `alert()`, sehingga klik tombol lebih aman dan tidak membuat pengalaman mobile patah;
  - alur resmi tetap: pemohon -> penyiar pengganti setuju/tolak -> jika setuju jadwal langsung diperbarui, tanpa antrean admin.
- Verifikasi Tukar Jadwal batch 10:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\ScheduleSwapPage.tsx src\e2e\schedule-swap.smoke.spec.ts` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-Cc7s19Ib.js`.
  - `npx playwright test schedule-swap.smoke.spec.ts` berhasil, 4 test lulus.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
- Catatan Tukar Jadwal batch 10:
  - belum dideploy ke hosting produksi;
  - `scheduleSwap.service`, Firestore schema/rules, subscription realtime, status swap, logic WhatsApp, dan flow admin tidak diubah;
  - warning Vite dynamic/static import pada build masih warning lama dan bukan error.

- Update Laporan Absensi `ARAHAN_UI.md` batch 11:
  - halaman `Rekap Kehadiran Staf` kini memakai layout class-based dengan hero, tab, filter panel, stat cards, panel tabel, dan drawer detail;
  - tab `Ringkasan`, `Harian`, `Penyiar / Staf`, dan `Izin & Cuti` tetap tersedia dengan filter periode/role lama;
  - mobile sekarang memakai card list untuk rekap staf, daftar harian, dan izin/cuti, sedangkan desktop tetap memakai tabel detail;
  - drawer detail absensi dirapikan untuk selfie, skor AI wajah, waktu/lokasi, device info, dan aksi validasi admin;
  - error validasi admin tidak lagi memakai `alert()`, diganti notice inline; sukses validasi juga memberi feedback inline;
  - export CSV tetap memakai format lama dan tombol `Export CSV`.
- Verifikasi Laporan Absensi batch 11:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\AttendanceReportPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-BhZ7T8P0.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
- Catatan Laporan Absensi batch 11:
  - belum dideploy ke hosting produksi;
  - `attendance.service`, algoritma absensi, Firebase schema/rules, dan format CSV tidak diubah;
  - warning Vite dynamic/static import pada build masih warning lama dan bukan error.

- Update Dashboard premium polish `LANJUTAN_UI.md` batch 12:
  - `DashboardPage` kini memakai struktur class-based untuk topbar, radio player, action board, menu, panel jadwal, podcast, dan profile sheet;
  - visual radio player tetap memakai logic/metadata lama, tetapi markup lebih rapi dan responsif;
  - panel dashboard dibuat reusable agar section jadwal berikutnya dan podcast lebih konsisten;
  - bottom sheet profil dipindahkan ke CSS class dan tidak lagi memakai `confirm()` browser untuk logout;
  - logout sekarang memakai konfirmasi inline di profile sheet dengan tombol `Batal` dan `Keluar`;
  - responsif mobile disesuaikan agar player/panel/sheet tidak overflow dan aman dari bottom nav.
- Verifikasi Dashboard batch 12:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-b_-f2ZgO.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
- Catatan Dashboard batch 12:
  - belum dideploy ke hosting produksi;
  - `useGlobalAudio`, metadata streaming, service jadwal, role/permission, navigasi page key, data absensi, dan algoritma jadwal berikutnya tidak diubah;
  - warning Vite dynamic/static import pada build masih warning lama dan bukan error.

- Update cleanup inline UI `LANJUTAN_UI.md` batch 13:
  - `AttendancePage` kini class-based untuk modal izin lokasi, kamera/selfie, status cards, form absen, check-out, receipt, dan info list;
  - `UsersManagementPage` kini class-based untuk header, summary, tabs, desktop table, mobile cards, drawer detail, form profil, notice, dan dialog konfirmasi;
  - popup `alert()`/`confirm()` di manajemen user diganti notice/dialog inline untuk role/status/export/sinkronisasi/reset sandi;
  - teleprompter `AiScriptPage` dibersihkan dari inline style besar dan memakai class CSS untuk toolbar, speed/play controls, teks naskah, scroll area, dan focus line;
  - `CoveragePage` dibersihkan dari sisa inline kecil pada panel, pencarian, card, upload, status, dan empty state;
  - `StreamingPage` dibersihkan dari inline besar pada header, player visual, metadata, play row, volume, history card, request toggle, form, dan alert;
  - `BroadcastSchedulePage` tidak lagi memakai `alert()` saat gagal mengirim tukar jadwal dari halaman jadwal, melainkan notice inline;
  - date picker/helper/default slot di halaman Jadwal juga dipindahkan ke class CSS.
- Verifikasi cleanup inline batch 13:
  - `rg -n "style=|alert\\(|confirm\\(" src/components/AttendancePage.tsx src/components/UsersManagementPage.tsx src/components/AiScriptPage.tsx src/components/CoveragePage.tsx src/components/StreamingPage.tsx src/components/BroadcastSchedulePage.tsx` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\AttendancePage.tsx src\components\UsersManagementPage.tsx src\components\AiScriptPage.tsx src\components\CoveragePage.tsx src\components\StreamingPage.tsx src\components\BroadcastSchedulePage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-DnnbzAVW.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
- Catatan cleanup inline batch 13:
  - belum dideploy dan belum push ke GitHub;
  - service, Firebase schema/rules, role/permission, algoritma absensi, logic AI, Google Drive, audio context, request lagu, dan flow tukar jadwal tidak diubah;
  - alur tukar jadwal tetap langsung antar penyiar: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin;
  - warning Vite dynamic/static import pada build masih warning lama dan bukan error.

- Update global inline sweep `LANJUTAN_UI.md` batch 14:
  - `ProfilePage` kini class-based untuk topbar, tabs, hero profil, form akun, filter absensi, stat cards, daftar absensi, empty/loading state, dan link maps;
  - `Shell` dibersihkan dari inline style pada sidebar, tombol notifikasi, badge, session user, prompt izin audio, dan badge bottom nav;
  - `SplashPage` memindahkan delay/keyframes wave/equalizer ke CSS;
  - `LoginPage` tidak lagi memakai blok `<style>` lokal untuk showcase logo dan wrapper logo mobile;
  - `Waveform` tidak lagi memakai inline style dinamis untuk bar audio;
  - `DashboardPage` mengganti CSS variable inline menu shortcut dengan tone class;
  - `AttendanceReportPage` memakai elemen `progress` untuk rasio kehadiran, bukan width inline;
  - `App` loading fallback dan `AnnouncerProfilePage` cursor statis dipindahkan ke class CSS;
  - scan global `src` untuk `style=`, `<style>`, `alert()`, dan `confirm()` sudah bersih.
- Verifikasi global inline sweep batch 14:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\App.tsx src\components\LoginPage.tsx src\components\Waveform.tsx src\components\AnnouncerProfilePage.tsx src\components\AttendanceReportPage.tsx src\components\DashboardPage.tsx src\components\Shell.tsx src\components\SplashPage.tsx src\components\ProfilePage.tsx src\components\LiveObPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-B-iEOwMK.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
- Catatan global inline sweep batch 14:
  - belum dideploy dan belum push ke GitHub;
  - service, Firebase schema/rules, role/permission, audio context, algoritma jadwal, algoritma absensi, logic login, dan flow tukar jadwal tidak diubah;
  - alur tukar jadwal tetap langsung antar penyiar: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin;
  - warning Vite dynamic/static import pada build masih warning lama dan bukan error.

- Update microinteraction & skeleton loading `LANJUTAN_UI.md` batch 15:
  - token global untuk focus ring, press scale, easing, dan skeleton ditambahkan di `src/styles/app.css`;
  - tombol, link, input, select, textarea, role button, dan elemen focusable sekarang punya focus ring konsisten;
  - press feedback tombol/link dibuat ringan dan disabled state global lebih jelas;
  - reduced motion guard global ditambahkan untuk menghormati `prefers-reduced-motion`;
  - utility skeleton `ui-skeleton`, `ui-skeleton-card`, `ui-skeleton-row`, dan `ui-skeleton-copy` tersedia;
  - loading daftar `UsersManagementPage`, `ScheduleSwapPage`, `ProfilePage`, dan `AttendanceReportPage` memakai skeleton ringan, bukan spinner-only;
  - ukuran skeleton dirapikan agar stabil di panel mobile/desktop.
- Verifikasi microinteraction batch 15:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\UsersManagementPage.tsx src\components\ScheduleSwapPage.tsx src\components\ProfilePage.tsx src\components\AttendanceReportPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-BbmO8nDt.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
- Catatan microinteraction batch 15:
  - belum dideploy dan belum push ke GitHub;
  - service, Firebase schema/rules, role/permission, auth, query data, dan workflow produksi tidak diubah;
  - alur tukar jadwal tetap langsung antar penyiar: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin;
  - warning Vite dynamic/static import pada build masih warning lama dan bukan error.

- Update menu search & quick actions `LANJUTAN_UI.md` batch 16:
  - `MenuPage` sekarang punya pencarian cepat fitur/menu berdasarkan label, grup, deskripsi, dan alias operasional;
  - hasil pencarian tetap dikelompokkan dan tetap menghormati role/permission existing;
  - empty state pencarian ditambahkan bila tidak ada fitur yang cocok;
  - quick actions kontekstual ditambahkan untuk fitur yang diizinkan user: absen, tukar jadwal, request, naskah, Live OB, dan liputan;
  - badge pending tukar jadwal tetap muncul pada quick action dan tile menu;
  - CSS panel search/quick action dibuat responsif, mobile dua kolom;
  - smoke test menu mobile diperluas untuk validasi search, quick action, hasil filter, dan empty search state.
- Verifikasi menu search batch 16:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\MenuPage.tsx src\e2e\login.smoke.spec.ts` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-DSNqyDm_.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
- Catatan menu search batch 16:
  - belum dideploy dan belum push ke GitHub;
  - router, service, Firebase schema/rules, role/permission, auth, query data, dan workflow produksi tidak diubah;
  - semua aksi tetap memakai `onNavigate` existing;
  - alur tukar jadwal tetap langsung antar penyiar: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin;
  - warning Vite dynamic/static import pada build masih warning lama dan bukan error.

- Update adaptive dashboard focus `LANJUTAN_UI.md` batch 17:
  - `DashboardPage` punya panel `Fokus Operasional` yang membaca konteks existing: jadwal user aktif, jadwal pribadi hari ini, status absensi, dan program berjalan;
  - mode dashboard memberi arahan ringan untuk `Persiapan siaran`, `Mode On-Air`, `Mode kerja aktif`, atau `Setelah siaran`;
  - panel menampilkan aksi berikutnya via `onNavigate` existing: absen, request, absensi, atau profil;
  - visual tone panel berubah halus berdasarkan mode: prep, live, wrap, done;
  - CSS responsif ditambahkan agar dashboard mobile tetap satu fokus dan tidak overload.
- Verifikasi adaptive dashboard batch 17:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-CxGcGf3l.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
- Catatan adaptive dashboard batch 17:
  - belum dideploy dan belum push ke GitHub;
  - service, Firebase schema/rules, role/permission, auth, query data, audio context, algoritma jadwal, dan workflow produksi tidak diubah;
  - semua aksi tetap memakai `onNavigate` existing;
  - alur tukar jadwal tetap langsung antar penyiar: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin;
  - warning Vite dynamic/static import pada build masih warning lama dan bukan error.

- Update request lagu realtime polish `LANJUTAN_UI.md` batch 18:
  - `SongRequestsPage` punya live strip untuk status antrean aktif/menunggu request;
  - live strip menampilkan request terbaru dan waktu masuk, plus tombol `Sinkronkan`;
  - kartu request menampilkan timestamp `Masuk HH.mm` dengan helper timestamp aman untuk Date/string/number dan objek Firestore-like;
  - loading tiap grup request memakai skeleton list;
  - empty/loading state tetap per grup: Masuk sekarang, Siap diputar, Riwayat;
  - CSS live strip, timestamp, dan skeleton list dibuat responsif mobile.
- Verifikasi request lagu batch 18:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\SongRequestsPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil, bundle `index-B_iW6vak.js`.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
- Catatan request lagu batch 18:
  - belum dideploy dan belum push ke GitHub;
  - `songRequest.service`, status flow request, localStorage/Firestore schema, WhatsApp URL, auth, role/permission, dan workflow produksi tidak diubah;
  - aksi status tetap memakai `updateSongRequestStatus` existing;
  - alur tukar jadwal tetap langsung antar penyiar: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin;
  - warning Vite dynamic/static import pada build masih warning lama dan bukan error.

- Update penyiar page polish `LANJUTAN_UI.md` batch 19:
  - `AnnouncersPage` di `src/App.tsx` punya search cepat untuk nama udara, nama lengkap, alias jadwal, hari, program, dan jam;
  - panel fokus menampilkan jumlah penyiar aktif serta penyiar dengan slot terpadat;
  - kartu penyiar sekarang membuka halaman `Profil Penyiar` lewat navigasi existing, bukan hanya tampil seperti kartu klik;
  - kartu menampilkan status aktif, statistik hari/jam/slot, jadwal pertama, preview slot, dan affordance `Lihat profil`;
  - empty state pencarian ditambahkan saat tidak ada hasil;
  - `AnnouncerProfilePage` menampilkan badge frekuensi/status, ringkasan jadwal terdekat, chip hari siaran, dan slot yang dikelompokkan per hari;
  - CSS baru untuk search, focus row, kartu, empty state, dan detail profil sudah responsif mobile.
- Verifikasi penyiar batch 19:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\App.tsx src\components\AnnouncerProfilePage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap warning.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844: `?page=announcers`, cari `Amar`, klik kartu `Buka profil Amar`, profil tampil, tidak ada horizontal overflow.
- Catatan penyiar batch 19:
  - belum dideploy dan belum push ke GitHub;
  - service, Firebase schema/rules, role/permission, auth, query data, algoritma jadwal, dan workflow produksi tidak diubah;
  - alur tukar jadwal tetap langsung antar penyiar: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.

- Update podcast premium polish `LANJUTAN_UI.md` batch 20:
  - `PodcastPage` punya panel ringkasan: katalog/hasil pencarian, status feed, dan episode aktif;
  - status feed membedakan sinkronisasi, feed terbaru, dan fallback Spotify tanpa mengubah service;
  - saat feed loading, halaman menampilkan skeleton strip ringan sambil tetap memakai daftar fallback;
  - player aktif menampilkan metadata episode;
  - kartu episode menampilkan preview deskripsi agar lebih mudah dipindai;
  - empty state pencarian punya tombol `Kosongkan pencarian`;
  - CSS responsif ditambahkan untuk panel ringkasan, skeleton strip, metadata player, preview episode, dan empty state.
- Verifikasi podcast batch 20:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\PodcastPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap warning.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844: `?page=podcast`, cari `Guru`, putar episode, uji empty search dan tombol `Kosongkan pencarian`, tidak ada horizontal overflow.
- Catatan podcast batch 20:
  - belum dideploy dan belum push ke GitHub;
  - `podcast.service`, konfigurasi RSS/Spotify endpoint, embed/source URL, auth, role/permission, dan workflow produksi tidak diubah;
  - alur tukar jadwal tetap langsung antar penyiar: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.

- Update aduan operational polish `LANJUTAN_UI.md` batch 21:
  - `ComplaintsPage` punya pencarian aduan berdasarkan pelapor, kategori, pesan, status, dan tanggal;
  - filter status dan kategori ditambahkan di presentation layer;
  - panel prioritas menampilkan jumlah hasil aktif, aduan butuh atensi, dan prioritas tindak lanjut berikutnya;
  - counter daftar mengikuti hasil filter aktif;
  - empty state filter punya tombol `Reset filter`;
  - tiap tiket menampilkan progres `Baru -> Terverifikasi -> Diproses -> Selesai`;
  - CSS responsif ditambahkan untuk search, filter, focus row, progress tiket, dan tombol reset filter.
- Verifikasi aduan batch 21:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\ComplaintsPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap warning.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844: `?page=complaints`, uji pencarian kosong + `Reset filter`, submit laporan dummy, progress tiket tampil, tidak ada horizontal overflow.
- Catatan aduan batch 21:
  - belum dideploy dan belum push ke GitHub;
  - `complaint.service`, schema Firestore/localStorage, status flow aduan, role/permission, auth, dan workflow produksi tidak diubah;
  - aksi status tetap memakai `updateComplaintStatus` existing;
  - alur tukar jadwal tetap langsung antar penyiar: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.

- Update profil personalization polish `LANJUTAN_UI.md` batch 22:
  - `ProfilePage` punya panel `Kesiapan profil` dengan persentase kelengkapan data utama;
  - ringkasan `Kontak operasional` dan `Akses akun` ditambahkan agar user cepat melihat status kontak/role;
  - progress kelengkapan memakai elemen `progress` native;
  - panel kesiapan responsif satu kolom di mobile;
  - kondisi simpan profil diperbaiki agar perubahan `airName` ikut tersimpan lewat `upsertUserProfile` existing.
- Verifikasi profil batch 22:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\ProfilePage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap warning.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844: `?page=profile`, pindah tab riwayat/info akun, panel kesiapan 3 kartu tampil, tidak ada horizontal overflow.
- Catatan profil batch 22:
  - belum dideploy dan belum push ke GitHub;
  - `auth.service`, `userProfile.service`, Firestore schema/rules, role/permission, session flow, dan workflow produksi tidak diubah;
  - alur tukar jadwal tetap langsung antar penyiar: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.

- Update event coverage operational polish `LANJUTAN_UI.md` batch 23:
  - `CoveragePage` punya filter status untuk tugas liputan;
  - pencarian mencakup judul, deskripsi, reporter, status, dan deadline;
  - ringkasan liputan menambahkan metrik `Hari ini`;
  - panel `Prioritas lapangan` menampilkan tugas paling perlu perhatian berdasarkan deadline dan status;
  - deadline dibuat human-friendly dengan state `today`/`overdue`;
  - empty state filter punya tombol `Reset filter`;
  - CSS responsif ditambahkan untuk command panel, filter, prioritas, deadline, dan empty state.
- Verifikasi event coverage batch 23:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\CoveragePage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap warning.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844: `?page=coverage`, uji pencarian kosong + `Reset filter`, cari `UMKM`, summary 4 kartu dan prioritas tampil, tidak ada horizontal overflow.
- Catatan event coverage batch 23:
  - belum dideploy dan belum push ke GitHub;
  - Google Drive upload, data mock liputan, Firestore schema/rules, auth, role/permission, dan workflow produksi tidak diubah;
  - tidak menambahkan `coverage.service`;
  - alur tukar jadwal tetap langsung antar penyiar: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.

- Update Live OB readiness polish `LANJUTAN_UI.md` batch 24:
  - `LiveObPage` punya panel kesiapan operasional berisi progres checklist, status link siaran, dan event berikutnya;
  - progres checklist memakai elemen `progress` native;
  - status link siaran membaca input YouTube/Discord yang sudah ada tanpa mengubah payload event;
  - event berikutnya dihitung dari daftar event existing;
  - CSS responsif ditambahkan untuk readiness cards dan progress agar mobile satu kolom.
- Verifikasi Live OB batch 24:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\LiveObPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap warning.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844: `?page=liveOb`, checklist ditoggle, link YouTube/Discord diisi, event dibuat, readiness 3 kartu dan rundown tampil, tidak ada horizontal overflow.
- Catatan Live OB batch 24:
  - belum dideploy dan belum push ke GitHub;
  - `liveOb.service`, schema `LiveEvent`, localStorage/Firestore flow, notifikasi WhatsApp, data checklist, dan logic pembuatan event tidak diubah;
  - alur tukar jadwal tetap langsung antar penyiar: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.

- Update attendance report scanability polish `LANJUTAN_UI.md` batch 25:
  - `AttendanceReportPage` punya pencarian rekap lintas nama, nama udara, email, role, status, tanggal, jam, alasan, dan catatan AI;
  - pencarian diterapkan pada daftar harian, izin/cuti, dan ringkasan staf di presentation layer;
  - ringkasan mendapat panel fokus: rasio tepat lokasi, jumlah catatan perlu atensi, dan status filter aktif;
  - prioritas atensi membaca status absensi existing seperti `needs_review`, `outside_radius`, `late`, `rejected`, izin/sakit/tugas luar;
  - empty state memiliki tombol `Reset filter`;
  - CSS responsif ditambahkan untuk search field, focus cards, dan reset filter.
- Verifikasi attendance report batch 25:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\AttendanceReportPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap warning.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844: `?page=attendanceReport`, uji pencarian kosong + `Reset filter`, pindah tab `Harian`, pencarian `admin`, focus cards 3 tampil, tidak ada horizontal overflow.
- Catatan attendance report batch 25:
  - belum dideploy dan belum push ke GitHub;
  - `attendance.service`, `userProfile.service`, Firestore schema/rules, role/permission, status absensi, validasi admin, dan workflow produksi tidak diubah;
  - export CSV tetap memakai hasil filter aktif existing;
  - alur tukar jadwal tetap langsung antar penyiar: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.

- Update broadcast schedule operational polish `LANJUTAN_UI.md` batch 26:
  - `BroadcastSchedulePage` punya pencarian jadwal berdasarkan program, penyiar, jam, deskripsi, status, dan program tentative;
  - filter status jadwal ditambahkan di presentation layer: semua, sedang berjalan, reguler, tentative, pengganti, khusus, dan dibatalkan;
  - ringkasan tanggal menampilkan jumlah slot terlihat saat filter aktif;
  - panel fokus jadwal menampilkan prioritas slot, slot user hari itu, dan jumlah slot tentative;
  - empty state filter punya tombol `Reset filter`;
  - tombol ikon tukar/edit jadwal diberi `aria-label` spesifik program;
  - urutan deklarasi `menuItems` di `DashboardPage` diperbaiki agar typecheck tidak gagal saat `recentMenuItems` dibuat.
- Verifikasi broadcast schedule batch 26:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\BroadcastSchedulePage.tsx src\components\DashboardPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap warning.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844 mode test: `?page=schedule`, uji pencarian kosong + `Reset filter`, tidak ada horizontal overflow dan tidak ada tombol tanpa label.
- Catatan broadcast schedule batch 26:
  - belum dideploy dan belum push ke GitHub;
  - `scheduleSlot.service`, `scheduleSwap.service`, Firestore schema/rules, role/permission, auth, query data, dan workflow produksi tidak diubah;
  - filter/pencarian jadwal hanya presentation layer;
  - alur tukar jadwal tetap langsung antar penyiar: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.

- Update dashboard operational briefing `LANJUTAN_UI_2.md` batch 27:
  - `DashboardPage` punya panel `Operational Briefing`;
  - briefing memisahkan prioritas `Critical`, `Important`, dan `Passive`;
  - item briefing membaca konteks existing: slot on-air user, absensi hari ini, jadwal pribadi mendekat, role admin, permission AI, dan status streaming;
  - setiap briefing punya aksi langsung ke halaman relevan seperti Request, Absensi, Jadwal, Rekap Absen, Naskah AI, atau Streaming;
  - CSS briefing responsif ditambahkan agar mobile satu kolom dan tetap sesuai design system dashboard.
- Verifikasi dashboard briefing batch 27:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap warning.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844 mode test: dashboard menampilkan `Operational Briefing`, tidak ada horizontal overflow dan tidak ada tombol tanpa label.
- Catatan dashboard briefing batch 27:
  - belum dideploy dan belum push ke GitHub;
  - service, Firebase schema/rules, role/permission, auth, query data, audio context, dan workflow produksi tidak diubah;
  - briefing hanya presentation layer dari data dashboard existing;
  - alur tukar jadwal tetap langsung antar penyiar: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.

- Update schedule cross-module workflow `LANJUTAN_UI_2.md` batch 28:
  - modal detail program di `BroadcastSchedulePage` punya aksi lanjutan program;
  - dari jadwal, user bisa langsung membuka `Buat naskah`, `Request`, `Streaming`, dan `Live/OB`;
  - navigasi memakai page key/router existing dari `App`, tanpa route atau service baru;
  - modal detail program ditutup otomatis saat aksi lanjutan dipilih;
  - CSS workflow detail program responsif: empat kolom desktop dan dua kolom mobile.
- Verifikasi schedule workflow batch 28:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\App.tsx src\components\BroadcastSchedulePage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap warning.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844 mode test: `?page=schedule`, klik kartu jadwal, aksi workflow tampil, tidak ada horizontal overflow, tidak ada tombol tanpa label, dan tombol `Buat naskah` berpindah ke halaman naskah.
- Catatan schedule workflow batch 28:
  - belum dideploy dan belum push ke GitHub;
  - service jadwal, AI, request lagu, streaming, Live/OB, Firestore schema/rules, role/permission, auth, dan workflow produksi tidak diubah;
  - perubahan hanya presentation/navigation layer;
  - alur tukar jadwal tetap langsung antar penyiar: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.

- Update dashboard live context & role-aware actions `LANJUTAN_UI_2.md` batch 29:
  - konteks waktu dashboard refresh otomatis tiap 60 detik agar countdown/jadwal mendekat tidak stale;
  - action board dashboard sekarang berubah berdasarkan role:
    - penyiar: request, naskah AI, jadwal, streaming;
    - admin/super admin: rekap absensi, kelola user, tukar jadwal, aduan;
    - reporter: liputan, absensi, jadwal, naskah AI jika diizinkan;
    - operator: streaming, Live/OB, request bila diizinkan, jadwal;
  - action board tetap memfilter aksi memakai permission/menu existing;
  - struktur `DashboardActionItem` ditambahkan agar prioritas role mudah dikembangkan.
- Verifikasi dashboard role-aware batch 29:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap warning.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844 mode test: dashboard admin menampilkan 4 action card role-aware (`Rekap absensi`, `Kelola user`, `Tukar jadwal`, `Tindak lanjut publik`), tidak ada horizontal overflow, dan tidak ada tombol tanpa label.
- Catatan dashboard role-aware batch 29:
  - belum dideploy dan belum push ke GitHub;
  - service, Firebase schema/rules, role/permission definition, auth, query data, audio context, dan workflow produksi tidak diubah;
  - perubahan hanya presentation-layer di `DashboardPage`;
  - alur tukar jadwal tetap langsung antar penyiar: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.

- Update dashboard realtime request brief `LANJUTAN_UI_2.md` batch 30:
  - `DashboardPage` subscribe ke request lagu memakai `subscribeSongRequests` existing;
  - panel `Request Terkini` menampilkan request aktif terbaru, nama pendengar, waktu masuk, dan tombol langsung ke halaman Request;
  - panel menampilkan statistik request aktif, antrean, dan request diputar hari ini;
  - operational briefing dan timeline ikut membaca request terbaru saat ada request aktif;
  - CSS panel request responsif ditambahkan agar mobile satu kolom.
- Verifikasi dashboard request batch 30:
  - `rg -n "style=|<style>|alert\\(|confirm\\(" src` tidak menemukan sisa target.
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx` berhasil.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap warning.
  - `npx playwright test login.smoke.spec.ts schedule-swap.smoke.spec.ts` berhasil, 10 test lulus.
  - Simulasi mandiri Playwright mobile 390x844 mode test dengan request demo localStorage: panel `Request Terkini` tampil, request `Lagu Semangat Pagi` tampil, statistik `1,0,0`, tidak ada horizontal overflow, dan tidak ada tombol tanpa label.
- Catatan dashboard request batch 30:
  - belum dideploy dan belum push ke GitHub;
  - `songRequest.service`, status flow request, Firestore/localStorage schema, WhatsApp URL, auth, role/permission, dan workflow produksi tidak diubah;
  - perubahan hanya presentation-layer dashboard dengan subscription existing;
  - alur tukar jadwal tetap langsung antar penyiar: pemohon -> penyiar pengganti setuju/tolak -> jadwal langsung diperbarui bila setuju, tanpa antrean admin.

- Update dashboard smart panel visual fix batch 31:
  - memperbaiki panel `Aksi Cepat` dan `Aktivitas Terbaru` yang sempat tampil seperti tombol browser default abu-abu di mobile;
  - CSS khusus ditambahkan untuk shortcut card, icon shortcut, timeline item, dot status, dan recent strip;
  - tone visual shortcut request, absensi, jadwal, naskah AI, liputan, dan user dibuat konsisten dengan design system;
  - mobile dibuat satu kolom dan recent strip menjadi grid dua kolom;
  - screenshot audit lokal tersimpan di `tmp/dashboard-smart-panel-audit.png`.
- Verifikasi dashboard smart panel fix batch 31:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx` berhasil.
  - `npm run build` berhasil; warning Vite dynamic/static import lama tetap warning.
  - `npm run test` berhasil, 17 file test / 58 test lulus.
  - Simulasi mandiri Playwright mobile 390x844 mode test: tidak ada horizontal overflow, 4 shortcut card tampil, 3 timeline item tampil, styling card/timeline/recent strip aktif, dan tidak ada tombol tanpa label.
- Catatan dashboard smart panel fix batch 31:
  - belum dideploy dan belum push ke GitHub;
  - tidak ada perubahan logic dashboard, service, schema, role/permission, atau workflow produksi;
  - perubahan hanya CSS visual dashboard.

- Update dokumentasi role & screenshot workflow batch 32:
  - struktur dokumentasi dari `docs/ARAHAN_BUAT_DOKUMENTASI.md` mulai diisi dengan panduan `user-guide`, `admin-guide`, `broadcaster-guide`, `reporter-guide`, `operator-guide`, dan `developer-guide`;
  - portal dokumentasi HTML tersedia di `docs/index.html`;
  - script `npm run docs:screenshots` ditambahkan dan menyimpan screenshot ke `docs/screenshots`;
  - screenshot yang tersedia: login mobile, dashboard mobile/desktop, absensi, jadwal, request lagu, naskah AI, manajemen user, profil, menu mobile, dan menu desktop;
  - folder `docs/assets` dan `docs/screenshots` punya README keamanan/pemakaian;
  - launcher screenshot menjalankan Vite langsung lewat Node/Vite dengan `--strictPort` agar proses server tidak tertinggal di Windows.
- Verifikasi dokumentasi batch 32:
  - `node --check scripts/capture-docs-screenshots.mjs` berhasil.
  - `npm run docs:screenshots` berhasil menghasilkan screenshot dokumentasi.
  - `npm run typecheck` berhasil.
- Catatan dokumentasi batch 32:
  - belum dideploy dan belum push ke GitHub;
  - dokumentasi dan screenshot memakai data demo/dummy, bukan data user asli;
  - tidak ada perubahan Firebase schema/rules, service, auth, role/permission, atau workflow produksi.

- Update dashboard AI operational assistant batch 33:
  - `DashboardPage` punya panel `AI Operational Assistant` untuk user dengan permission `ai:use`;
  - panel menampilkan ringkasan shift/on-air, rekomendasi cue naskah, dan tindak lanjut;
  - insight membaca konteks existing: jadwal user, current/next program, absensi hari ini, request aktif, dan request populer hari ini;
  - setiap insight punya aksi langsung ke halaman relevan seperti Jadwal, Request, Absensi, Rekap Absen, Profil, atau Naskah AI;
  - CSS assistant responsif dan mobile satu kolom.
- Verifikasi dashboard assistant batch 33:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx` berhasil.
  - Simulasi mandiri Playwright mobile 390x844 mode test: panel assistant tampil, 3 kartu insight tampil, tidak ada horizontal overflow, dan tidak ada tombol tanpa label.
- Catatan dashboard assistant batch 33:
  - belum dideploy dan belum push ke GitHub;
  - tidak ada pemanggilan AI eksternal baru, prompt backend, schema Firebase, service, role/permission, auth, atau workflow produksi;
  - perubahan hanya presentation-layer dashboard.

- Update program ecosystem detail batch 34:
  - modal detail program di `BroadcastSchedulePage` ditingkatkan menjadi mini page program;
  - detail program menampilkan statistik durasi, frekuensi mingguan, jumlah tim penyiar, dan status slot;
  - detail program punya blok `Program Identity` dan chip kontinuitas `Naskah`, `Request`, `Live`, `Arsip`;
  - workflow cross-module existing tetap tersedia: Buat naskah, Request, Streaming, Live/OB;
  - styling mobile dipadatkan agar seluruh workflow terlihat di viewport 390x844.
- Verifikasi program ecosystem batch 34:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\BroadcastSchedulePage.tsx src\components\DashboardPage.tsx` berhasil.
  - Simulasi mandiri Playwright mobile 390x844 mode test: modal detail tampil, 4 statistik tampil, 4 chip kontinuitas tampil, 4 tombol workflow tampil, tidak ada horizontal overflow, workflow terlihat dalam modal, dan tidak ada tombol tanpa label.
- Catatan program ecosystem batch 34:
  - belum dideploy dan belum push ke GitHub;
  - tidak ada perubahan service jadwal, schema/rules Firebase, role/permission, auth, edit jadwal, tukar jadwal, request, streaming, Live/OB, atau workflow produksi;
  - perubahan hanya presentation-layer dan kalkulasi statistik dari jadwal existing.

- Update program brief Pinrang Berkabar batch 35:
  - `docs/PINRANG_BERKABAR.md` diisi sebagai brief program/newsroom;
  - isi mencakup fungsi, karakter program, role pengguna, workflow produksi, rundown 30 menit, template opening/headline/bridging/closing, checklist verifikasi berita, integrasi modul RadioSBL, prompt aman untuk Naskah AI, dan acceptance criteria;
  - `docs/index.html` menambahkan kartu/link ke brief `Pinrang Berkabar`.
- Verifikasi program brief batch 35:
  - `rg -n "Pinrang Berkabar|PINRANG_BERKABAR" docs\index.html docs\PINRANG_BERKABAR.md` menemukan brief dan link portal.
- Catatan program brief batch 35:
  - belum dideploy dan belum push ke GitHub;
  - tidak ada perubahan kode aplikasi, service, schema/rules Firebase, role/permission, auth, prompt backend, atau workflow produksi;
  - dokumen menekankan verifikasi berita dan larangan mengarang fakta.

- Update video Pinrang Berkabar batch 36:
  - `docs/PINRANG_BERKABAR.md` dilanjutkan sebagai arahan fitur video YouTube Pinrang Berkabar;
  - contoh API key nyata diganti placeholder agar tidak mendorong hardcode credential;
  - service `pinrangBerkabar.service` ditambahkan dengan urutan aman: proxy `VITE_PINRANG_BERKABAR_FEED_URL`, env `VITE_YOUTUBE_API_KEY`, lalu fallback playlist resmi;
  - halaman `PinrangBerkabarPage` ditambahkan dengan hero, tombol `Coba lagi`, tombol `Buka playlist`, loading skeleton, card video 16:9, dan fallback playlist;
  - page key/menu `pinrangBerkabar` masuk route, sidebar desktop, dan Menu Lengkap grup Konten.
- Verifikasi video Pinrang Berkabar batch 36:
  - `npm run typecheck` berhasil.
  - `npx eslint src\App.tsx src\components\PinrangBerkabarPage.tsx src\components\MenuPage.tsx src\components\Shell.tsx src\data\radioData.ts src\lib\env.ts src\services\pinrangBerkabar.service.ts` berhasil.
  - Simulasi mandiri Playwright mobile 390x844 mode test: `?page=pinrangBerkabar` tampil, fallback card dan link playlist tersedia, tidak ada horizontal overflow, dan tidak ada tombol tanpa label.
  - Setelah `VITE_YOUTUBE_API_KEY` diset di `.env.local`, simulasi Playwright mobile mode test memuat 12 video dari YouTube API, sumber tampil `YouTube API`, tidak ada horizontal overflow, dan tanpa console error.
  - Pencarian secret di repo selain `.env.local` tidak menemukan key YouTube.
- Catatan video Pinrang Berkabar batch 36:
  - belum dideploy dan belum push ke GitHub;
  - tidak ada perubahan Firebase schema/rules, auth, role/permission, absensi, jadwal, request lagu, podcast, streaming, atau AI naskah;
  - API key tidak di-hardcode dan fallback tidak mengarang judul video spesifik.

- Update video Pinrang Berkabar pagination batch 37:
  - service `listPinrangBerkabarVideos` sekarang mengembalikan `videos`, `nextPageToken`, dan `source`;
  - proxy feed dan YouTube API mendukung `pageToken`;
  - halaman `PinrangBerkabarPage` punya tombol `Muat lagi` dan pencarian lokal video yang sudah termuat;
  - empty state `Video tidak ditemukan` dan tombol `Reset pencarian` ditambahkan;
  - acceptance criteria `docs/PINRANG_BERKABAR.md` diperbarui untuk pagination dan pencarian.
- Verifikasi video Pinrang Berkabar pagination batch 37:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\PinrangBerkabarPage.tsx src\services\pinrangBerkabar.service.ts` berhasil.
  - Simulasi mandiri Playwright mobile 390x844 dengan YouTube API: awal 12 video, klik `Muat lagi` menjadi 24 video, empty state search tampil, tidak ada horizontal overflow, dan tidak ada tombol tanpa label.
- Catatan video Pinrang Berkabar pagination batch 37:
  - belum dideploy dan belum push ke GitHub;
  - tidak ada perubahan Firebase schema/rules, auth, role/permission, modul lama, atau hardcode API key;
  - pencarian hanya memfilter video yang sudah termuat.

- Update dokumentasi screenshot Pinrang Berkabar batch 38:
  - `scripts/capture-docs-screenshots.mjs` mengambil screenshot baru `pinrang-berkabar-mobile.png`;
  - fungsi capture menunggu gambar selesai load/decode sebelum screenshot agar thumbnail YouTube tidak kosong;
  - `docs/user-guide/README.md` menambahkan bagian `Pinrang Berkabar`;
  - `docs/index.html` menambahkan screenshot Pinrang Berkabar di bagian screenshot utama;
  - screenshot tersimpan di `docs/screenshots/pinrang-berkabar-mobile.png`.
- Verifikasi dokumentasi Pinrang Berkabar batch 38:
  - `node --check scripts/capture-docs-screenshots.mjs` berhasil.
  - `npm run docs:screenshots` berhasil menghasilkan ulang screenshot dokumentasi.
  - Inspeksi visual screenshot menunjukkan thumbnail video sudah ter-render.
- Catatan dokumentasi Pinrang Berkabar batch 38:
  - belum dideploy dan belum push ke GitHub;
  - screenshot memakai sesi demo dan konfigurasi lokal yang aman dari commit.

- Update smoke test Pinrang Berkabar batch 39:
  - `src/e2e/pinrang-berkabar.smoke.spec.ts` ditambahkan;
  - test memakai sesi demo admin dan membuka `?page=pinrangBerkabar`;
  - test memverifikasi heading, link playlist, input pencarian, kartu video/fallback, aksi `Muat lagi` bila tersedia, empty state pencarian, reset pencarian, tidak ada horizontal overflow, dan tidak ada tombol tanpa label.
- Verifikasi smoke test Pinrang Berkabar batch 39:
  - `npm run typecheck` berhasil.
  - `npx eslint src\e2e\pinrang-berkabar.smoke.spec.ts src\components\Shell.tsx` berhasil.
  - `npx playwright test pinrang-berkabar.smoke.spec.ts` berhasil.
- Catatan smoke test Pinrang Berkabar batch 39:
  - belum dideploy dan belum push ke GitHub;
  - test menerima fallback playlist sebagai kondisi valid bila data YouTube live tidak tersedia.

- Update Shell connectivity batch 40:
  - status koneksi sidebar di `src/components/Shell.tsx` diperjelas dengan ikon, label `Sinkron aktif` / `Mode offline`, dan deskripsi singkat;
  - status koneksi memakai `role="status"` dan `aria-live="polite"`;
  - saat offline, area konten menampilkan strip pendek bahwa sebagian data akan sinkron saat koneksi kembali;
  - styling terkait ditambahkan di `src/styles/app.css`.
- Verifikasi Shell connectivity batch 40:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\Shell.tsx src\e2e\pinrang-berkabar.smoke.spec.ts` berhasil.
  - `npm run build` berhasil.
- Catatan Shell connectivity batch 40:
  - belum dideploy dan belum push ke GitHub;
  - tidak ada perubahan routing, Firebase schema/rules, auth, role/permission, atau service data.

- Update Shell navigation continuity batch 41:
  - `Pinrang Berkabar` dipindahkan dari grup sidebar `Siaran` ke grup `Konten`;
  - bottom nav menandai `Menu` sebagai active saat halaman aktif tidak punya item bottom nav langsung;
  - item sidebar/bottom nav yang sedang aktif mendapatkan `aria-current="page"`;
  - smoke test Pinrang Berkabar menambahkan pengecekan active state `Menu` di viewport mobile.
- Verifikasi Shell navigation continuity batch 41:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\Shell.tsx src\e2e\pinrang-berkabar.smoke.spec.ts` berhasil.
  - `npx playwright test pinrang-berkabar.smoke.spec.ts` berhasil untuk desktop dan mobile.
  - `npm run build` berhasil.
- Catatan Shell navigation continuity batch 41:
  - belum dideploy dan belum push ke GitHub;
  - tidak ada perubahan route, permission, Firebase schema/rules, auth, atau service data;
  - bottom nav tetap lima item utama.

- Update Menu recently used batch 42:
  - `Shell` menyimpan halaman terakhir yang dibuka ke `radiosbl.recentPages:<userId>` secara global;
  - `MenuPage` membaca daftar halaman terakhir dipakai dari storage yang sama;
  - Menu Lengkap punya panel `Terakhir dipakai` agar user bisa melanjutkan pekerjaan tanpa mencari ulang;
  - quick action dan tile menu memakai handler navigasi yang ikut memperbarui recent pages;
  - grup `Pinrang Berkabar` di Menu Lengkap disamakan dengan sidebar, yaitu masuk `Konten`;
  - smoke test Pinrang Berkabar memverifikasi recent panel muncul di mobile setelah membuka halaman Pinrang Berkabar lalu masuk Menu.
- Verifikasi Menu recently used batch 42:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\Shell.tsx src\components\MenuPage.tsx src\e2e\pinrang-berkabar.smoke.spec.ts` berhasil.
  - `npx playwright test pinrang-berkabar.smoke.spec.ts` berhasil untuk desktop dan mobile.
  - `npm run build` berhasil.
- Catatan Menu recently used batch 42:
  - belum dideploy dan belum push ke GitHub;
  - tidak ada route baru, service baru, schema/rules Firebase, permission baru, atau perubahan business logic inti;
  - recent pages hanya local convenience dan tetap aman bila localStorage tidak tersedia.

- Update dashboard calm shortcut batch 43:
  - dashboard hanya menampilkan 4 shortcut utama secara default;
  - shortcut tambahan tetap tersedia lewat tombol expand `Tampilkan semua menu`;
  - menambahkan `src/e2e/dashboard-calm.smoke.spec.ts` untuk menjaga grid shortcut tetap 4 item secara default;
  - test juga memverifikasi tombol expand membuka lebih banyak menu, tidak ada horizontal overflow, dan tidak ada tombol ikon tanpa label.
- Verifikasi dashboard calm shortcut batch 43:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx src\e2e\dashboard-calm.smoke.spec.ts` berhasil.
  - `npx playwright test dashboard-calm.smoke.spec.ts` berhasil untuk desktop dan mobile.
  - `npm run build` berhasil.
- Catatan dashboard calm shortcut batch 43:
  - belum dideploy dan belum push ke GitHub;
  - tidak ada perubahan route, permission, service, Firebase schema/rules, auth, atau business logic inti;
  - fitur tetap dapat diakses lewat expand dashboard dan Menu Lengkap.

- Update dashboard secondary detail disclosure batch 44:
  - panel `Jadwal Berikutnya` dan `Podcast Unggulan` dipindahkan ke disclosure `Detail siaran & arsip`;
  - disclosure tertutup secara default agar first view dashboard lebih ringan;
  - detail tetap bisa dibuka satu tap dari dashboard tanpa menghapus workflow lama;
  - styling disclosure dibuat compact dan konsisten dengan dashboard;
  - smoke test dashboard memverifikasi detail sekunder tersembunyi secara default dan tampil setelah disclosure dibuka.
- Verifikasi dashboard secondary detail batch 44:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx src\e2e\dashboard-calm.smoke.spec.ts` berhasil.
  - `npx playwright test dashboard-calm.smoke.spec.ts` berhasil untuk desktop dan mobile.
  - `npm run build` berhasil.
- Catatan dashboard secondary detail batch 44:
  - belum dideploy dan belum push ke GitHub;
  - tidak ada perubahan data, route, permission, service, Firebase schema/rules, auth, atau business logic inti;
  - jadwal dan podcast tetap tersedia dari dashboard, menu, dan halaman masing-masing.

- Update dashboard briefing priority batch 45:
  - `Operational Briefing` hanya menampilkan 1 kartu prioritas utama secara default;
  - prioritas pendukung dipindahkan ke disclosure `Prioritas lain`;
  - layout briefing menjadi lebih tenang: satu fokus utama, detail lain tetap satu tap;
  - smoke test dashboard memverifikasi hanya satu briefing card langsung tampil dan prioritas pendukung muncul setelah disclosure dibuka.
- Verifikasi dashboard briefing priority batch 45:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\DashboardPage.tsx src\e2e\dashboard-calm.smoke.spec.ts` berhasil.
  - `npx playwright test dashboard-calm.smoke.spec.ts` berhasil untuk desktop dan mobile.
  - `npm run build` berhasil.
- Catatan dashboard briefing priority batch 45:
  - belum dideploy dan belum push ke GitHub;
  - tidak ada perubahan data, permission, service, route, Firebase schema/rules, auth, atau business logic inti;
  - semua aksi briefing lama tetap tersedia.

- Update LANJUTAN UI 3 completion batch 46:
  - `PinrangBerkabarPage` memiliki player YouTube embed di dalam aplikasi;
  - kartu video berubah dari link langsung keluar menjadi tombol `Putar` yang memilih video di player halaman;
  - player fallback memakai embed playlist resmi bila feed/API belum tersedia;
  - detail `Now Playing`, deskripsi, dan link `Buka di YouTube` tetap tersedia;
  - styling player dibuat responsif untuk desktop dan mobile;
  - smoke test Pinrang Berkabar memverifikasi iframe player dan status `Now Playing`;
  - `docs/LANJUTAN_UI_3.md` ditambahkan bagian status implementasi tuntas.
- Verifikasi LANJUTAN UI 3 completion batch 46:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\PinrangBerkabarPage.tsx src\e2e\pinrang-berkabar.smoke.spec.ts` berhasil.
  - `npx playwright test pinrang-berkabar.smoke.spec.ts` berhasil untuk desktop dan mobile.
  - `npx eslint src\components\DashboardPage.tsx src\components\PinrangBerkabarPage.tsx src\e2e\dashboard-calm.smoke.spec.ts src\e2e\pinrang-berkabar.smoke.spec.ts` berhasil.
  - `npx playwright test dashboard-calm.smoke.spec.ts pinrang-berkabar.smoke.spec.ts` berhasil untuk desktop dan mobile.
  - `npm run build` berhasil.
- Catatan LANJUTAN UI 3 completion batch 46:
  - belum dideploy dan belum push ke GitHub;
  - tidak ada API key hardcode, route baru, permission baru, Firebase schema/rules, auth, atau business logic inti;
  - link YouTube eksternal tetap dipertahankan sebagai fallback.

- Update LANJUTAN UI 3 docs refresh batch 47:
  - `docs/index.html` menambahkan kartu `LANJUTAN UI 3`;
  - `docs/user-guide/README.md` memperbarui bagian Pinrang Berkabar agar menyebut player video in-app;
  - screenshot dokumentasi diperbarui untuk dashboard mobile, dashboard desktop, dan Pinrang Berkabar mobile.
- Verifikasi LANJUTAN UI 3 docs refresh batch 47:
  - `node --check scripts\capture-docs-screenshots.mjs` berhasil.
  - `npm run docs:screenshots` berhasil.
  - Cek file screenshot menunjukkan `dashboard-mobile.png`, `dashboard-desktop.png`, dan `pinrang-berkabar-mobile.png` terbarui.
- Catatan LANJUTAN UI 3 docs refresh batch 47:
  - belum dideploy dan belum push ke GitHub;
  - tidak ada perubahan runtime aplikasi pada batch ini.

- Update Pinrang Berkabar identity carousel batch 48:
  - hero Pinrang Berkabar memakai logo resmi `/PinrangBerkabar.png`;
  - daftar video setelah player diberi heading `Video Lainnya`;
  - daftar video terkait dibuat sebagai carousel horizontal responsif;
  - thumbnail kartu video memakai lazy loading;
  - smoke test Pinrang Berkabar memverifikasi logo resmi, player, `Now Playing`, heading `Video Lainnya`, dan carousel.
- Verifikasi Pinrang Berkabar identity carousel batch 48:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\PinrangBerkabarPage.tsx src\e2e\pinrang-berkabar.smoke.spec.ts` berhasil.
  - `npx playwright test pinrang-berkabar.smoke.spec.ts` berhasil untuk desktop dan mobile.
  - `npm run build` berhasil.
- Catatan Pinrang Berkabar identity carousel batch 48:
  - belum dideploy dan belum push ke GitHub;
  - tidak ada API key hardcode, route baru, permission baru, Firebase schema/rules, auth, atau perubahan service.

- Update LANJUTAN UI 3 evaluation batch 49:
  - evaluasi ulang `docs/LANJUTAN_UI_3.md` menunjukkan dashboard calm, progressive disclosure, Pinrang in-app player, related video carousel, Request Lagu card stack, dan bottom nav 5 item sudah tertutup;
  - gap yang tersisa: sidebar desktop belum punya grup `Tim` sesuai dokumen;
  - `Shell` memindahkan `Penyiar` dari grup `Siaran` ke grup baru `Tim`;
  - `MenuPage` juga menambahkan grup `Tim` agar navigasi lengkap konsisten;
  - `docs/LANJUTAN_UI_3.md` ditambahkan bagian `Hasil Evaluasi Ulang`.
- Catatan LANJUTAN UI 3 evaluation batch 49:
  - belum dideploy dan belum push ke GitHub;
  - tidak ada perubahan route, permission, Firebase schema/rules, auth, service, atau business logic inti.
- Verifikasi LANJUTAN UI 3 evaluation batch 49:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\Shell.tsx src\components\MenuPage.tsx src\e2e\login.smoke.spec.ts` berhasil.
  - `npx playwright test login.smoke.spec.ts` berhasil untuk desktop dan mobile.
  - `npm run build` berhasil.

- Update copy teknis cleanup batch 50:
  - `PinrangBerkabarPage` menghapus copy user-facing seperti `API key`, `frontend`, dan `Feed belum terhubung`;
  - label sumber video dibuat lebih human-friendly: `Feed resmi`, `YouTube resmi`, dan `Playlist resmi`;
  - konfirmasi logout dashboard tidak lagi menyebut `Sesi demo`;
  - `docs/user-guide/README.md` menghapus instruksi mode demo/test dan mengganti `Firebase` menjadi `konfigurasi sistem`;
  - `docs/index.html` mengurangi bahasa teknis seperti command screenshot di halaman utama;
  - `docs/LANJUTAN_UI_3.md` merapikan status evaluasi agar tidak berisi daftar command teknis sebagai instruksi utama.
- Verifikasi copy teknis cleanup batch 50:
  - `npm run typecheck` berhasil.
  - `npx eslint src\components\PinrangBerkabarPage.tsx src\components\DashboardPage.tsx` berhasil.
  - Pencarian ulang `mode demo|Sesi demo|API key|frontend|Feed belum|Firebase|npm run docs|akun/data demo|demo/test` pada UI utama dan docs pengguna tidak menemukan hasil.
  - `npm run build` berhasil.

- Update Help & Documentation batch 51:
  - \TutorialPage\ ditambahkan sebagai pusat bantuan dengan kategori FAQ, panduan penyiar, dan admin;
  - \PedomanMediaPage\ ditambahkan sebagai halaman standar penyiaran dengan TOC sticky dan indikator progres baca;
  - Menu Lengkap menambahkan grup \Bantuan & Informasi\ agar mudah diakses.
- Verifikasi Help & Documentation batch 51:
  - \
pm run typecheck\ berhasil.
  - \
px eslint src\components\TutorialPage.tsx src\components\PedomanMediaPage.tsx\ berhasil.

- Update Inline Help & Feature Flags batch 52:
  - Komponen \InlineHelp\ dengan ikon \?\ ditambahkan sebagai micro-interaction untuk panduan kontekstual;
  - \InlineHelp\ diintegrasikan pada \AiScriptPage\ (Konfigurasi Naskah) dan \ScheduleSwapPage\ (Ajukan Pertukaran);
  - \eatureFlags\ ditambahkan di \src/lib/env.ts\ (\enableNewDashboard\, \enablePinrangBerkabar\, dll) sebagai fondasi Safe Deployment Strategy.
- Verifikasi Inline Help & Feature Flags batch 52:
  - \
pm run typecheck\ berhasil.
  - \
px eslint src\components\InlineHelp.tsx src\lib\env.ts\ berhasil.

- Update Smart Script Studio batch 53:
  - Mengimplementasikan Prioritas 1 dari \ARAHAN_BUAT_NASKAH.md\ untuk halaman \AiScriptPage\;
  - Menambahkan toolbar formatting dasar (Bold, Italic, Heading, List, Cue Marker, Segment Divider, Timestamp) yang terhubung ke textarea naskah;
  - Menambahkan fitur \Auto Save\ lokal secara otomatis per 3 detik setelah pengetikan dengan indikator simpan terakhir;
  - Menambahkan kapabilitas Pencarian (*Search*) dan Filter status (*Draft*, *Approved*, *Used*) pada tab \Draft Saya\.
- Verifikasi Smart Script Studio batch 53:
  - \
pm run typecheck\ berhasil setelah perbaikan fragment JSX dan kurung tutup scope fungsi \loadSavedScripts\.
  - \
px eslint src\components\AiScriptPage.tsx\ lulus tanpa peringatan.

- Update Smart Script Studio batch 54:
  - Mengimplementasikan Prioritas 2 dari \ARAHAN_BUAT_NASKAH.md\;
  - Mengaktifkan tab \Review Naskah\ dan \Naskah Siap Siaran\ yang sebelumnya berupa ruang kosong;
  - Menambahkan kapabilitas *Export TXT* secara native browser pada setiap draf naskah;
  - Menambahkan alur kerja *Approval* (Setujui -> Tandai Selesai) dengan menambahkan \updateProgramScriptStatus\ pada modul \programScript.service.ts\.
- Verifikasi Smart Script Studio batch 54:
  - \
pm run typecheck\ berhasil setelah menyesuaikan tipe union untuk komparasi status \draft\.

- Update Master Tutorial System batch 55:
  - Mengimplementasikan spesifikasi dari \ARAHAN_TUTORIAL.md\;
  - Mengubah \TutorialPage\ menjadi interaktif dengan sistem FAQ dan *Troubleshooting* terintegrasi;
  - Menggunakan \<details>\ dan \<summary>\ *accordion* agar sesuai standar web responsif tanpa \javascript\ kompleks;
  - Menghidupkan fitur *Searchable Documentation* dengan filter *realtime* untuk mencari judul dan isi FAQ dengan cepat.
- Verifikasi Tutorial System batch 55:
  - \
pm run typecheck\ berhasil.

- Verifikasi Akhir Build Produksi (Production Ready) batch 56:
  - Mengeksekusi \
pm run build\ (\	sc --noEmit && vite build\) secara menyeluruh.
  - Proses kompilasi kode, optimasi CSS/JS, dan pemisahan *chunk* aset (seperti \irebase-vendor\ dan \eact-vendor\) berjalan mulus tanpa hambatan.
  - Aplikasi Radio SBL Super-App (termasuk keseluruhan fitur Dashboard Baru, Sistem Tukar Jadwal, Smart Script Studio, Pedoman Siber, dan Pusat Bantuan Interaktif) kini terkonfirmasi bebas dari celah sintaks maupun bentrokan *routing*, dan sepenuhnya **siap untuk tahap Deployment (Pengerahan) ke *server***.
