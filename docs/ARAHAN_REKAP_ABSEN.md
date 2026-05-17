# Arahan Pengembangan Rekap Absensi Modern RadioSBL

## Analisa Rekap Saat Ini

Tampilan rekap saat ini sudah cukup rapi secara visual, tetapi fitur absensi masih terlalu dasar dan belum memenuhi standar sistem absensi modern profesional.

### Kekurangan Utama
1. Data hanya menampilkan total sederhana:
   - Total absen
   - Tepat lokasi
   - Luar radius
   - Terlambat

2. Belum ada detail harian per pegawai.

3. Tidak ada interaksi saat klik data.

4. Tidak ada:
   - Foto selfie
   - Detail GPS
   - Jam masuk/pulang detail
   - Durasi kerja
   - Device info
   - Status validasi

5. Tidak ada fitur:
   - Izin
   - Sakit
   - Cuti
   - Dinas luar
   - Alpha
   - Belum checkout

6. Semua data ditampilkan dalam satu halaman sehingga sulit dianalisa jika data bertambah banyak.

7. Belum ada sistem audit atau deteksi anomali absensi.

8. Tabel “Daftar Kehadiran” belum menjadi pusat monitoring utama.

---

# Tujuan Pengembangan

Mengubah halaman Rekap Absensi menjadi:

- Dashboard monitoring realtime
- Pusat audit kehadiran
- Sistem analisa disiplin pegawai
- Sistem validasi GPS dan selfie
- Rekap profesional siap export
- Monitoring penyiar dan staf RadioSBL

---

# Struktur Halaman Baru

Gunakan sistem tab agar data lebih terorganisir.

## Tab Utama

```text
[Ringkasan]
[Harian]
[Penyiar / Staf]
[Lokasi & GPS]
[Izin / Sakit / Cuti]
[Anomali]
[Export]
```

---

# 1. TAB RINGKASAN

## KPI Cards

Tambahkan statistik berikut:

```text
Total Pegawai
Hadir Hari Ini
Tepat Waktu
Terlambat
Luar Radius
Belum Checkout
Izin
Sakit
Cuti
Alpha
```

## Tambahkan Grafik

### Grafik yang wajib:
- Grafik kehadiran mingguan
- Grafik keterlambatan
- Persentase kehadiran per role
- Top 5 pegawai paling disiplin
- Top 5 pegawai paling sering terlambat

---

# 2. TAB HARIAN

## Tabel Harian Modern

| Pegawai | Role | Shift | Check-in | Check-out | Durasi | Status | Lokasi | Verifikasi | Aksi |
|---|---|---|---|---|---|---|---|---|---|

## Contoh Data

| Chendra | Penyiar | Morning | 07:58 | 16:02 | 8j 4m | Tepat Waktu | Valid | Selfie + GPS | Detail |

---

# Status Badge Warna

```text
Hijau  = Tepat waktu
Kuning = Terlambat
Merah  = Alpha
Biru   = Remote / Dinas luar
Ungu   = Izin / Cuti / Sakit
Abu    = Belum checkout
Oranye = Luar radius
```

---

# Interaksi Saat Klik Data

Saat admin klik row atau tombol Detail, tampilkan modal atau side panel.

---

# DETAIL PANEL ABSENSI

## Informasi Dasar

```text
Nama
Role
Program / Divisi
Shift
Tanggal
Status
```

## Informasi Waktu

```text
Check-in
Check-out
Durasi kerja
Keterlambatan
Lembur
```

## Informasi Lokasi

```text
Lokasi check-in
Lokasi check-out
Jarak dari titik kantor
Status radius
Latitude
Longitude
```

## Informasi Verifikasi

```text
Foto selfie check-in
Foto selfie check-out
Validasi wajah
Fake GPS detection
```

## Informasi Device

```text
Device
Browser
IP Address
Operating System
```

---

# Tombol Aksi Pada Detail

```text
Lihat Map
Lihat Selfie
Tandai Bermasalah
Koreksi Data
Export Detail
```

---

# 3. DETAIL GPS

## Tambahkan Mini Map Interaktif

Map harus menampilkan:

```text
Titik lokasi pegawai
Radius kantor/studio
Jarak pegawai dari titik resmi
```

## Informasi GPS

| Data | Isi |
|---|---|
| Latitude | -3.xxxxxx |
| Longitude | 119.xxxxxx |
| Radius | 50 meter |
| Status | Dalam Radius / Luar Radius |

## Warning Jika Bermasalah

```text
Pegawai melakukan absensi di luar radius yang ditentukan.
```

---

# 4. DETAIL SELFIE

## Selfie Verification

Tambahkan:

```text
Preview selfie check-in
Preview selfie check-out
Waktu pengambilan foto
Status validasi wajah
```

Walaupun face recognition belum aktif, struktur datanya harus sudah disiapkan.

---

# 5. TAB PENYIAR / STAF

## Rekap Bulanan Pegawai

| Nama | Role | Hadir | Telat | Izin | Sakit | Cuti | Alpha | Luar Radius | Skor |
|---|---|---|---|---|---|---|---|---|---|

## Saat Nama Diklik

Tampilkan:
- Riwayat absensi bulanan
- Statistik keterlambatan
- Grafik kehadiran
- Riwayat lokasi
- Riwayat shift

---

# 6. TAB IZIN / SAKIT / CUTI

## Approval Management

| Nama | Jenis | Tanggal | Durasi | Lampiran | Alasan | Status | Aksi |
|---|---|---|---|---|---|---|---|

## Aksi Admin

```text
Approve
Reject
Minta revisi
Lihat lampiran
```

## Status

```text
Pending
Disetujui
Ditolak
```

---

# 7. TAB ANOMALI

## Deteksi Absensi Bermasalah

Contoh:
- Luar radius
- Sering terlambat
- Belum checkout
- Tidak upload selfie
- Fake GPS
- Device berubah-ubah
- Lokasi mencurigakan

## Tabel Anomali

| Pegawai | Jenis Anomali | Tanggal | Risiko | Keterangan | Aksi |
|---|---|---|---|---|---|

---

# 8. TAB EXPORT

## Jenis Export

```text
Export Excel Harian
Export Excel Bulanan
Export PDF Rekap
Export per Pegawai
Export per Role
Export Izin/Sakit/Cuti
```

## Data Dalam Export

```text
Nama
Role
Tanggal
Jam masuk
Jam pulang
Durasi kerja
Status
Keterlambatan
Lokasi
Radius
Izin/sakit/cuti
Catatan admin
```

---

# 9. FILTER DAN SEARCH

## Filter Yang Wajib

```text
Tanggal
Bulan
Role
Nama Pegawai
Status
Shift
Lokasi
Dalam Radius / Luar Radius
Terlambat / Tepat Waktu
Belum Checkout
```

## Search Cepat

Search berdasarkan:
- Nama
- Program
- Lokasi
- Device
- Status

---

# 10. REKOMENDASI UI/UX

## Struktur Layout

```text
Card summary di atas
Filter section
Tab navigation
Interactive data table
Detail modal / side panel
```

---

# Fitur UI Modern

```text
Sticky table header
Pagination
Sortable column
Realtime update
Expandable row
Search realtime
Badge warna status
```

---

# Optimasi Jika Data Banyak

Gunakan:

```text
Server-side filtering
Pagination
Lazy loading
Virtualized table
```

---

# 11. FITUR KHUSUS UNTUK RADIOSBL

## Monitoring Penyiar

Tambahkan:
- Status ON AIR
- Status siaran aktif
- Program siaran
- Durasi siaran
- Shift penyiar

---

# Integrasi Program

| Program | Penyiar | Jadwal | Status |
|---|---|---|---|
| Podcast SBL | Chendra | 08:00 | Live |

---

# Reminder Otomatis

Contoh:

```text
Penyiar Morning Show belum check-in.
```

---

# Kesimpulan

Halaman Rekap Absensi harus berkembang dari sekadar tabel sederhana menjadi:

- Dashboard monitoring realtime
- Sistem audit kehadiran
- Monitoring GPS
- Monitoring selfie
- Analisa disiplin pegawai
- Approval izin/sakit/cuti
- Sistem export profesional
- Monitoring penyiar dan operasional RadioSBL

## Target Akhir

Menjadikan Rekap Absensi sebagai pusat kontrol operasional kehadiran seluruh staf dan penyiar RadioSBL.