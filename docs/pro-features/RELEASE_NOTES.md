# Release Notes — Radio SBL Pro Features

**Versi**: 2.0 Pro  
**Tanggal Rilis**: 31 Mei 2026  
**Status**: Stable  

---

## Ringkasan

Radio SBL Pro Features adalah paket fitur profesional yang ditambahkan secara bertahap (Tahap 1–7) ke aplikasi Radio SBL tanpa mengganggu fitur utama yang sudah berjalan: streaming, jadwal siaran, absensi, AI naskah, dan manajemen pengguna.

Semua fitur baru bersifat **modular**, **fail-safe**, dan dapat dinonaktifkan melalui **feature flag** di `src/config/featureFlags.ts`.

---

## Fitur yang Ditambahkan

### 🎧 Tahap 1 — Listening Experience

- **Sleep Timer** — Penghitung mundur untuk mematikan streaming otomatis.
- **Enhanced Now On Air Card** — Tampilan program aktif yang lebih informatif dengan animasi on-air.
- **Favorite Program** — Pendengar dapat menyimpan program favorit.
- **Mini Player Badge** — Indikator status live di mini player.

### 💬 Tahap 2 — Engagement Pendengar

- **Request Lagu V2** — Request lagu dengan sistem status bertahap (submitted → read → queued → played/rejected).
- **Studio Inbox** — Panel operator terpadu untuk memproses request dan salam.
- **Salam Udara (Dedikasi)** — Fitur pesan/salam dari pendengar ke pendengar lain.
- **Polling Program** — Polling interaktif dengan voting real-time.

### 🎙️ Tahap 3 — Content Hub (Podcast & Video)

- **Episode Podcast** — Manajemen episode podcast per program dengan upload audio.
- **Halaman Podcast** — Halaman publik daftar podcast beserta playback dan resume.
- **Video Hub (SBL TV)** — Manajemen dan tampilan konten video program.
- **Pinrang Berkabar Feed** — Feed berita manual untuk mendukung rubrik lokal.

### 📋 Tahap 4 — Broadcast Workflow

- **Rundown Siaran** — Kerangka acara terstruktur dengan urutan segmen dan durasi.
- **Checklist Pra-Siaran** — Daftar periksa kesiapan teknis sebelum on-air.
- **Log Siaran** — Laporan harian siaran setelah off-air.
- **Handover Shift** — Catatan serah terima antar shift penyiar/operator.
- **Script Board** — Papan naskah digital untuk penyiar.

### 📊 Tahap 5 — Listener Analytics & Error Tracking

- **Session Tracking** — Pencatatan sesi streaming anonim (device, browser, program aktif).
- **Heartbeat** — Update otomatis setiap 60 detik untuk estimasi pendengar aktif.
- **GPS Consent** — Permintaan izin lokasi eksplisit dari pengguna.
- **Location Capture** — Simpan latitude/longitude jika izin diberikan.
- **Streaming Error Tracking** — Log otomatis kendala teknis pemutaran audio.
- **Dashboard Analytics** — Tampilan estimasi pendengar aktif, perangkat, performa program, jam aktif, dan error streaming.
- **HourlyActivityChart** — Grafik distribusi 24 jam aktivitas pendengar.

### 🔐 Tahap 6 — Security, Role, Audit Log & Approval

- **Role Guards** — Kebijakan izin granular per aksi sensitif berdasarkan role.
- **Audit Log** — Pencatatan otomatis semua aksi sensitif (rundown, request lagu, episode) ke Firestore dengan fallback localStorage.
- **Approval Workflow** — Sistem antrean persetujuan untuk tindakan yang memerlukan otorisasi Admin.
- **Halaman Log Audit** — Dashboard riwayat aktivitas keamanan dengan filter pencarian.
- **Halaman Antrean Persetujuan** — Panel admin untuk menyetujui/menolak pengajuan sensitif dengan tab Pending dan Riwayat.

### ✨ Tahap 7 — Polish UI, Dokumentasi & Release

- **securityAudit.css** — Style sheet khusus untuk halaman audit dan approval (badge berwarna, tabel rapi, tab navigasi, empty state).
- **Refactor AuditLogTable** — Tabel audit dengan badge tindakan berwarna ekspresif dan responsive.
- **Refactor ApprovalCard** — Kartu approval dengan badge status berwarna dan tombol aksi yang jelas.
- **5 Dokumen Panduan** — Panduan Admin, Operator, Penyiar, Analytics, dan Release Notes.

---

## Statistik Pengujian

| Metrik | Hasil |
|---|---|
| Unit test | **110/110 lulus** (23 file test) |
| TypeScript typecheck | ✅ 0 error |
| Production build | ✅ Berhasil (6.13 detik) |
| Komponen baru | 20+ komponen |
| Service baru | 10+ service |
| File dokumentasi | 7 dokumen |

---

## Cara Rollback

Jika fitur tertentu bermasalah setelah deployment, nonaktifkan feature flag yang sesuai:

```ts
// src/config/featureFlags.ts
export const featureFlags = {
  listeningEnhancements: true,
  listenerEngagement: true,
  contentHub: true,
  broadcastWorkflow: true,
  listenerAnalytics: false,  // ← matikan jika analytics bermasalah
  securityAuditLog: false,   // ← matikan jika audit bermasalah
};
```

Deploy ulang aplikasi setelah mengubah flag. Tidak ada data yang akan terhapus.

---

## Fitur yang Belum Diimplementasikan (Roadmap Berikutnya)

- [ ] Notifikasi push ke pendengar (memerlukan Firebase Cloud Messaging).
- [ ] Reverse geocoding lokasi pendengar (kota/kecamatan).
- [ ] Export analytics ke CSV/PDF.
- [ ] Integrasi data pendengar dari server streaming (AzuraCast API).
- [ ] Auto-delete lokasi presisi setelah 30 hari (Cloud Functions).
- [ ] Multi-stasiun support.

---

## Catatan Migrasi

- Semua collection Firestore baru menggunakan nama yang tidak bertabrakan dengan data lama.
- Tidak ada schema collection lama yang diubah.
- Pengguna yang sudah terdaftar tidak perlu melakukan tindakan apapun.
