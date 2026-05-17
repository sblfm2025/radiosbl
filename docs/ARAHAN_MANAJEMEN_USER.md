# Arahan Pengembangan Halaman Manajemen User Smart — RadioSBL App

## Tujuan Utama

Halaman **Manajemen User** di RadioSBL jangan hanya menjadi halaman CRUD user biasa. Halaman ini harus dikembangkan menjadi **Smart User Management Center** yang mampu mengelola user, role, akses, aktivitas, performa, keamanan, dan keterlibatan operasional radio secara terpadu.

RadioSBL sudah memiliki fondasi user management seperti:
- daftar user
- role user
- status aktif/nonaktif
- profil user
- nomor WhatsApp
- air name / nama siaran
- reset password
- sinkronisasi data

Namun fitur tersebut perlu dikembangkan menjadi lebih lengkap, modern, dan sesuai kebutuhan operasional radio.

---

# 1. Struktur Halaman Utama

Gunakan sistem tab agar data tidak menumpuk.

```text
[Semua User]
[Penyiar]
[Operator]
[Reporter]
[Event Crew]
[Role & Permission]
[Activity Log]
[Active Session]
[Analytics]
[Approval]
```

---

# 2. Dashboard Ringkasan User

Tambahkan kartu statistik di bagian atas.

```text
Total User
User Aktif
User Nonaktif
Penyiar Aktif
Operator Aktif
Reporter Aktif
User Online
User ON AIR
User Live OB
User Belum Lengkap Profil
```

Tujuannya agar admin bisa melihat kondisi SDM RadioSBL secara cepat.

---

# 3. Tabel User Modern

Tabel utama harus menampilkan data penting secara ringkas.

| Foto | Nama | Air Name | Role | Divisi | Status | Online | Last Active | Aksi |
|---|---|---|---|---|---|---|---|---|

Contoh:

| Foto | Chendra | CHENDRA | Penyiar | Podcast | Aktif | ON AIR | 2 menit lalu | Detail |

---

# 4. Filter dan Search

Tambahkan filter:

```text
Role
Status aktif/nonaktif
Divisi
Penyiar
Operator
Reporter
Event Crew
Online/offline
ON AIR
Live OB
Profil belum lengkap
```

Search harus bisa berdasarkan:

```text
Nama
Air name
Email
Nomor WhatsApp
Role
Program
Divisi
```

---

# 5. Detail User Panel

Saat admin klik user, tampilkan **side panel / modal detail**.

## Informasi Dasar

```text
Foto profil
Nama lengkap
Air name / nama siaran
Email
Nomor WhatsApp
Role
Divisi
Status akun
Tanggal bergabung
```

## Informasi Operasional

```text
Program siaran
Jadwal siaran
Shift aktif
Status ON AIR
Status Live OB
Riwayat siaran
```

## Informasi Absensi

```text
Total hadir bulan ini
Total terlambat
Izin
Sakit
Cuti
Alpha
Luar radius
Skor disiplin
```

## Informasi Keamanan

```text
Last login
Device terakhir
IP terakhir
Browser
OS
Status sesi aktif
```

---

# 6. Role & Permission Management

Role jangan hanya dipakai sebagai label. Harus ada permission yang jelas.

## Role Ideal RadioSBL

```text
super_admin
admin
leader
announcer
reporter
operator
employee
public
```

## Permission Granular

Contoh permission:

| Permission | Super Admin | Admin | Leader | Penyiar | Reporter | Operator |
|---|---|---|---|---|---|---|
| Kelola user | Ya | Ya | Tidak | Tidak | Tidak | Tidak |
| Edit role | Ya | Terbatas | Tidak | Tidak | Tidak | Tidak |
| Lihat semua absensi | Ya | Ya | Ya | Tidak | Tidak | Tidak |
| Lihat absensi sendiri | Ya | Ya | Ya | Ya | Ya | Ya |
| Approve izin | Ya | Ya | Ya | Tidak | Tidak | Tidak |
| Kelola jadwal siaran | Ya | Ya | Ya | Tidak | Tidak | Tidak |
| Akses broadcast panel | Ya | Ya | Ya | Ya | Tidak | Ya |
| Kelola Live OB | Ya | Ya | Ya | Tidak | Ya | Ya |

---

# 7. Multi Role Support

Satu user sebaiknya bisa memiliki lebih dari satu peran.

Contoh:

```text
Chendra:
- Penyiar
- Operator
- Event Crew
```

Ini penting karena di radio, satu orang sering memegang beberapa tugas.

---

# 8. Activity Log User

Setiap aktivitas penting harus tercatat.

Contoh log:

```text
07:58 Login
08:00 Check-in
08:02 Buka Broadcast Panel
08:03 ON AIR
10:01 OFF AIR
10:05 Upload konten
16:02 Check-out
```

Activity log harus bisa difilter berdasarkan:
- user
- tanggal
- aktivitas
- role
- modul aplikasi

---

# 9. Active Session Management

Tambahkan halaman sesi aktif.

| User | Device | Lokasi | Login Time | Status | Aksi |
|---|---|---|---|---|---|

Aksi admin:

```text
Logout paksa
Block device
Tandai mencurigakan
Reset password
```

---

# 10. Status Realtime User

Tambahkan badge status realtime:

```text
🟢 Online
🎙 ON AIR
📍 Live OB
🟡 Idle
⚫ Offline
🔴 Suspended
```

Ini sangat cocok untuk RadioSBL karena admin perlu tahu siapa yang sedang aktif secara operasional.

---

# 11. User Analytics

Tambahkan analytics per user.

## Untuk Penyiar

```text
Jumlah siaran bulan ini
Total jam siaran
Program yang dibawakan
Kehadiran
Keterlambatan
Rating kedisiplinan
```

## Untuk Reporter

```text
Jumlah liputan
Live OB yang diikuti
Event yang dilaporkan
Status keaktifan
```

## Untuk Operator

```text
Jumlah sesi teknis
Jam operasional studio
Riwayat broadcast panel
```

---

# 12. Smart Alerts

Tambahkan notifikasi otomatis:

```text
User belum login lebih dari 30 hari
Penyiar belum check-in sebelum jadwal siaran
User sering terlambat
User login dari device baru
User aktif tapi belum punya role
Profil user belum lengkap
Nomor WhatsApp belum diisi
```

---

# 13. Approval Center

Tambahkan tab approval untuk:

```text
User baru menunggu verifikasi
Perubahan role
Permintaan reset password
Pengajuan izin/sakit/cuti
Pengajuan tukar jadwal
```

Format tabel:

| Nama | Jenis Pengajuan | Tanggal | Status | Aksi |
|---|---|---|---|---|

Aksi:

```text
Approve
Reject
Minta revisi
```

---

# 14. Import dan Export

Tambahkan fitur:

```text
Import user dari Excel
Export user ke Excel
Export data penyiar
Export data role
Export activity log
Export user nonaktif
```

---

# 15. Profil Khusus Penyiar

Karena RadioSBL adalah aplikasi radio, user dengan role penyiar harus punya data khusus.

```text
Air name
Program siaran
Jadwal tetap
Kategori siaran
Bio penyiar
Foto penyiar
Social media
Voice intro
Status aktif siaran
```

---

# 16. Keamanan User

Tambahkan fitur keamanan:

```text
Reset password oleh admin
Force logout
Suspend akun
Aktifkan/nonaktifkan akun
Deteksi login mencurigakan
Riwayat login
Device recognition
Two-factor authentication opsional
```

---

# 17. UI/UX yang Disarankan

Gunakan pola modern:

```text
Summary cards di atas
Tab navigation
Search dan filter
Data table interaktif
Side panel detail
Badge status warna
Action dropdown
Pagination
Sticky table header
Mobile friendly
```

---

# 18. Prioritas Implementasi

## Prioritas 1 — Wajib

```text
Tab Semua User
Detail user panel
Role & permission
Filter dan search
Status aktif/nonaktif
Activity log dasar
Reset password
Suspend user
```

## Prioritas 2 — Penting

```text
Realtime status
Active session
User analytics
Approval center
Multi role
Export user
```

## Prioritas 3 — Advanced

```text
Smart alert
Suspicious login detection
AI user behavior insight
2FA
Device blocking
Performance ranking
```

---

# Target Akhir

Halaman Manajemen User RadioSBL harus berkembang dari:

```text
CRUD user sederhana
```

menjadi:

```text
Smart Operational User Management Center
```

yang mampu mengelola:

```text
User
Role
Permission
Penyiar
Operator
Reporter
Event crew
Absensi
Aktivitas
Keamanan
Performa
Operasional siaran
```

Dengan pengembangan ini, RadioSBL akan menjadi lebih siap sebagai platform operasional radio modern, bukan hanya aplikasi admin biasa.