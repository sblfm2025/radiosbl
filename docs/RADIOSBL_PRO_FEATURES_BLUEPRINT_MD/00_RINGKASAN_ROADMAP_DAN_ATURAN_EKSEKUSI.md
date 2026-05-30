# Radio SBL - Roadmap Fitur Profesional Radio/TV

## Tujuan
Dokumen ini adalah arahan teknis bertahap untuk menambahkan fitur profesional pada Aplikasi Radio SBL tanpa merusak tampilan premium, alur data stabil, dan fitur utama yang sudah berjalan.

## Fondasi Aplikasi Saat Ini
Aplikasi Radio SBL sudah memiliki modul penting:

- Dashboard operasional.
- Absensi staf.
- Jadwal siaran.
- Profil penyiar.
- Streaming audio, info siaran aktif, mini player, dan waveform.
- Liputan dan OB.
- Pengaduan publik.
- AI naskah siaran.
- Manajemen pengguna, role, hak akses, dan verifikasi admin.

Teknologi yang digunakan:

- React 19.
- Vite 7.
- TypeScript.
- Firebase Auth, Firestore, Storage, Hosting.
- Firebase Functions untuk proxy produksi.
- Google Drive API.
- Gemini/OpenAI proxy.
- Playwright dan Vitest.

## Prinsip Wajib Untuk Semua Tahap

1. Jangan mengubah UI premium yang sudah stabil.
2. Jangan mengganti tema, warna, font, layout global, navbar, atau mini player kecuali memang tertulis di dokumen tahap terkait.
3. Jangan mengubah schema collection lama.
4. Jangan rename field lama.
5. Jangan menghapus fitur lama.
6. Jangan mengubah alur absensi.
7. Jangan mengubah alur jadwal siaran.
8. Jangan mengubah alur request lagu lama sebelum ada migrasi aman.
9. Jangan mengubah alur AI naskah.
10. Jangan mengubah manajemen user dan role lama tanpa mapping kompatibilitas.
11. Semua fitur baru wajib dibuat modular.
12. Semua fitur baru wajib fail-safe.
13. Error fitur baru tidak boleh membuat streaming, dashboard, atau login rusak.
14. Semua perubahan wajib lewat branch baru.
15. Semua perubahan wajib punya backup commit.
16. Semua perubahan wajib lulus uji mandiri.

## Pola Branch Wajib

Untuk setiap tahap:

```bash
git status
git add .
git commit -m "backup: stable state before professional feature stage"
git checkout -b feature/radiosbl-pro-stage-XX
```

Ganti `XX` sesuai tahap:

- `01-listening-experience`
- `02-engagement`
- `03-content-hub`
- `04-broadcast-workflow`
- `05-analytics`
- `06-security-audit`
- `07-polish-release`

## Struktur Folder Rekomendasi

```txt
src/features/listening/
src/features/engagement/
src/features/contentHub/
src/features/broadcastWorkflow/
src/features/analytics/
src/features/securityAudit/
src/shared/components/
src/shared/hooks/
src/shared/utils/
docs/pro-features/
```

Jangan menumpuk fitur baru di file besar yang sudah ada.

## Urutan Eksekusi

1. Tahap 0 - Persiapan, backup, flag fitur, dan baseline test.
2. Tahap 1 - Listening Experience: sleep timer, enhanced now on air, favorite program, mini player state.
3. Tahap 2 - Engagement Pendengar: request lagu berstatus, salam udara, polling.
4. Tahap 3 - Podcast, arsip audio, Video Hub/SBL TV.
5. Tahap 4 - Workflow Penyiar/Operator: rundown, checklist pra-siaran, log siaran, handover shift.
6. Tahap 5 - Listener Analytics dan error streaming tracking.
7. Tahap 6 - Security, role refinement, audit log, approval.
8. Tahap 7 - Polish UI, dokumentasi, training, dan release checklist.

## Feature Flag Wajib

Semua fitur baru wajib bisa dimatikan dari config.

Contoh:

```ts
export const featureFlags = {
  listeningEnhancements: true,
  listenerEngagement: false,
  contentHub: false,
  broadcastWorkflow: false,
  listenerAnalytics: false,
  securityAuditLog: false,
};
```

Jika fitur bermasalah, cukup matikan flag tanpa rollback besar.

## Testing Global Wajib

Jalankan sebelum merge:

```bash
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Jika `npm run lint` masih punya lint debt pada file lama, jangan jadikan alasan untuk mengubah file lama secara besar-besaran. Perbaiki lint hanya pada file baru atau file yang memang disentuh.

## Checklist Regresi Global

Setiap tahap wajib memastikan:

- Login tetap berjalan.
- Dashboard utama tetap tampil.
- Streaming tetap play/pause.
- Mini player tetap sesuai aturan lama.
- Jadwal siaran tetap tampil.
- Absensi tetap berjalan.
- Request lagu lama tetap dapat dibuka.
- AI naskah tetap generate.
- Manajemen user tetap berjalan.
- Role admin/user tidak bocor.
- Mobile tidak horizontal scroll.
- Desktop tidak pecah layout.
- Firebase rules tidak membuka data sensitif.

## Definisi Selesai Per Tahap

Satu tahap dianggap selesai jika:

1. Semua file baru terpisah secara modular.
2. Tidak ada perubahan besar pada fitur lama.
3. Build production berhasil.
4. E2E utama berhasil.
5. Manual regression checklist selesai.
6. Dokumentasi tahap ditambahkan di `docs/pro-features/`.
7. Ada catatan rollback.
8. Ada screenshot sebelum/sesudah untuk halaman yang berubah.

## Larangan Umum

- Jangan membuat redesign total.
- Jangan mengganti navigasi utama tanpa kebutuhan jelas.
- Jangan langsung memasang banyak dependensi berat.
- Jangan menambah Cloud Functions tanpa konfirmasi biaya Blaze Plan.
- Jangan menyimpan data pribadi tanpa izin dan alasan teknis.
- Jangan memaksa lokasi/GPS untuk mendengar radio.
- Jangan menyebut analytics sebagai data pasti jika masih estimasi dari aplikasi.
