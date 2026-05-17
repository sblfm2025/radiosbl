# Panduan Hak Akses (Role-Based Access Control) Radio SBL

Dokumen ini adalah referensi resmi untuk memahami tingkatan wewenang dan hak akses (*Role*) yang berlaku di dalam "Super-App" Radio SBL. Pengaturan peran ini sangat krusial untuk menjaga integritas *database*, mencegah penghapusan data tanpa sengaja, dan menjaga privasi profil staf.

---

## 🛡️ Tingkat 1: Hak Akses Penuh (Root & Admin)

### 1. `super_admin` (Dewa Sistem)
**Fokus Utama:** Manajemen Tingkat Tinggi, Legalitas, & Penghapusan Data.
*   **Siapa saja:** Akun Master (`sblfm2025@gmail.com`) dan **Direktur Utama (Bapak Fajar Bakri)**.
*   **Wewenang Spesial:**
    *   Melihat, menambah, mengubah, dan **MENGHAPUS** akun user lain secara permanen.
    *   Mengubah halaman legalitas institusi (App Settings / Tentang Radio).
    *   Mereset seluruh *database* secara manual.

### 2. `admin` (Administrator IT)
**Fokus Utama:** Pengelola Jadwal & Konfigurasi Harian.
*   **Siapa saja:** Tim IT (Andi Azhar).
*   **Wewenang Spesial:**
    *   Bisa menambah, mengubah, dan merombak total **Jadwal Siaran Mingguan**.
    *   Menyetujui secara paksa (Mengesahkan) rekaman absensi jika terjadi kendala.
    *   Membatalkan / Mereset permintaan *Tukar Jadwal* antar penyiar.

---

## 👁️ Tingkat 2: Pengawasan & Liputan (Manajemen)

### 3. `leader` (Pemantau VIP)
**Fokus Utama:** Monitoring dan Evaluasi Kinerja (Baca Semua Data).
*   **Siapa saja:** Dewan Pengawas, Sekretaris Diskominfo, dan Kabid Humas.
*   **Wewenang Spesial:**
    *   Memiliki akses "Mata Elang" untuk **membaca seluruh rekaman absensi** karyawan tanpa terkecuali.
    *   Memantau laporan wartawan lapangan dan pengaduan (Request Lagu) masyarakat.
    *   **Fitur Keamanan:** Mereka tidak dibekali dengan tombol "Edit/Hapus Jadwal", sehingga sangat aman digunakan tanpa rasa takut tak sengaja merusak jadwal.

### 4. `reporter` (Wartawan / Liputan Lapangan)
**Fokus Utama:** Penyetoran Berita.
*   **Siapa saja:** Staf Liputan (Muhammad Saleh).
*   **Wewenang Spesial:**
    *   Memiliki menu khusus di layarnya untuk membuat, mengedit, dan mengunggah **Laporan Liputan** dari lapangan untuk disetorkan ke meja direksi.
    *   Hanya bisa melihat/memverifikasi absensinya sendiri.

---

## 🎙️ Tingkat 3: Siaran & Operasional

### 5. `announcer` (Penyiar Udara)
**Fokus Utama:** Pelaksanaan Siaran & Penggunaan AI.
*   **Siapa saja:** Semua Penyiar (Amar, Sul, Rena, Riska, Ria, Miah).
*   **Wewenang Spesial:**
    *   Memiliki menu eksklusif untuk melihat **Jadwal Pribadi** mereka.
    *   Dapat menggunakan fitur **AI Script Generation** (Naskah Cerdas) untuk membuat materi siarannya.
    *   Berhak mengajukan permohonan **Tukar Jadwal (Schedule Swap)** dengan penyiar lain.
    *   Hanya bisa melihat rekap absensinya sendiri.

### 6. `operator` (Teknisi / Engineer Studio)
**Fokus Utama:** Kendali Mesin dan Tautan Suara.
*   **Siapa saja:** Teknisi / Engineer (Muhammad Chendra).
*   **Wewenang Spesial:**
    *   Mengatur tombol *Play/Stop* dan konfigurasi tautan *Live Streaming* (Icecast/RadioBoss).
    *   Mengatur koneksi ke YouTube Live atau Discord Room.
    *   Mengelola antrean Lagu yang direquest oleh pendengar.

---

## 💼 Tingkat 4: Dasar (General)

### 7. `employee` (Staf Umum / Administrasi Umum)
**Fokus Utama:** Kehadiran Murni.
*   **Siapa saja:** Tim Keuangan (Fauziah) dan Manajemen Umum (Mursalim).
*   **Wewenang Spesial:**
    *   Hanya diwajibkan untuk masuk, melakukan absensi (Self-attendance), dan keluar. 
    *   Layar mereka paling bersih, karena fitur penjadwalan dan operasi mesin otomatis disembunyikan agar mereka tidak bingung.

### 8. `public` (Tamu Anonim)
**Fokus Utama:** Pendengar SBL.
*   **Siapa saja:** Pendengar luar yang tidak terdaftar di sistem.
*   **Wewenang Spesial:**
    *   Sistem secara cerdas menolak akses mereka ke *Dashboard*. Mereka hanya disajikan tampilan *landing page*, jadwal acara publik, dan form *Request Lagu*.

---
> **Catatan Teknis untuk Pengembang:**
> Semua validasi (*Read, Create, Update, Delete*) aturan Role ini dikendalikan berlapis. Pertama melalui *Frontend (UI)* di `src/utils/rbac.ts`, dan lapis kedua (inti) ada di *Backend Security Rules* dalam file `firestore.rules`. Kombinasi keduanya membuat peretasan lintas divisi mustahil dilakukan.
