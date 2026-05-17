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
