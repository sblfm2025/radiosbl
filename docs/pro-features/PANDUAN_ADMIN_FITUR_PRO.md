# Panduan Admin — Fitur Pro Radio SBL

Dokumen ini menjelaskan cara mengakses dan menggunakan semua fitur profesional baru yang ditambahkan pada aplikasi Radio SBL untuk Admin dan Pimpinan stasiun.

---

## 1. Akses Fitur Baru

Fitur profesional hanya dapat diakses oleh pengguna dengan role **Admin**, **Super Admin**, atau **Pimpinan (Leader)**. Menu-menu berikut akan muncul otomatis di sidebar navigasi setelah login:

| Menu | Grup | Deskripsi |
|---|---|---|
| 📊 Analytics Pendengar | Monitoring | Dashboard analitik listener real-time |
| 🛡️ Log Audit Keamanan | Administrasi | Riwayat semua aksi sensitif stasiun |
| ✅ Antrean Persetujuan | Administrasi | Otorisasi pengajuan dari operator/editor |

Jika menu tidak muncul, pastikan role akun sudah disetel dengan benar oleh Super Admin.

---

## 2. Melihat Analytics Pendengar

1. Klik **Analytics Pendengar** di sidebar.
2. Dashboard menampilkan:
   - **Estimasi Pendengar Aktif** — sesi aktif dalam 90 detik terakhir.
   - **Total Sesi Tercatat** — akumulasi semua pemutaran di aplikasi web.
   - **Perangkat** — breakdown Mobile / Desktop / Tablet.
   - **Performa Program** — program yang paling sering diputar beserta durasi rata-rata.
   - **Distribusi Jam Aktif** — bar chart 24 jam pendengar paling ramai.
   - **Log Error Streaming** — laporan kendala teknis streaming.
3. Klik **Segarkan Data Historis** untuk memuat ulang data sesi lama.

> ⚠️ **Catatan Penting**: Angka yang ditampilkan adalah *estimasi dari aplikasi web*, bukan jumlah pendengar siaran radio sebenarnya dari server streaming.

---

## 3. Melihat Log Audit Keamanan

1. Klik **Log Audit Keamanan** di sidebar (grup Administrasi).
2. Tabel menampilkan semua aksi sensitif yang dilakukan pengguna: pembuatan rundown, perubahan status request lagu, publikasi podcast/video, dan proses persetujuan.
3. Gunakan kolom **Cari** untuk filter berdasarkan nama aktor, tindakan, role, atau modul.
4. Badge tindakan berwarna sesuai jenis aksi:
   - 🟣 Ungu — aksi umum (buat, perbarui)
   - 🔴 Merah — hapus atau tolak
   - 🟢 Hijau — setujui atau publikasi

---

## 4. Mengelola Antrean Persetujuan

Operator atau Editor dapat mengajukan tindakan sensitif (seperti publikasi podcast atau notifikasi massal) yang memerlukan persetujuan Admin/Pimpinan.

**Langkah menyetujui pengajuan:**
1. Klik **Antrean Persetujuan** di sidebar.
2. Tab **Menunggu Persetujuan** menampilkan semua pengajuan yang aktif.
3. Baca detail payload pengajuan.
4. Ketik catatan review (opsional) di kolom input.
5. Klik **Setujui** untuk menyetujui, atau **Tolak** untuk menolak.
6. Status akan berubah dan log audit dibuat secara otomatis.

Tab **Riwayat Otorisasi** menampilkan semua pengajuan yang sudah diproses.

---

## 5. Cara Menonaktifkan Fitur (Rollback via Feature Flag)

Jika terjadi masalah pada fitur tertentu, Admin Teknis dapat menonaktifkannya tanpa perlu rollback kode:

Edit file `src/config/featureFlags.ts`:

```ts
export const featureFlags = {
  listeningEnhancements: true,   // Fitur Tahap 1
  listenerEngagement: true,      // Fitur Tahap 2
  contentHub: true,              // Fitur Tahap 3
  broadcastWorkflow: true,       // Fitur Tahap 4
  listenerAnalytics: false,      // ← Matikan fitur analytics
  securityAuditLog: false,       // ← Matikan fitur audit
};
```

Kemudian deploy ulang aplikasi. Fitur yang dimatikan akan hilang dari navigasi secara otomatis.

---

## 6. Kontak Dukungan Teknis

Jika ada masalah yang tidak dapat diselesaikan melalui feature flag, hubungi Developer Admin Radio SBL.
