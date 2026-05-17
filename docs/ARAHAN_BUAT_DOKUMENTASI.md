# ARAHAN MEMBUAT DOKUMENTASI & TUTORIAL LENGKAP RADIOSBL APP

## Tujuan

Buat dokumentasi lengkap RadioSBL App untuk:
- user baru
- penyiar
- admin
- reporter
- operator
- developer internal

Dokumentasi harus mudah dibaca, lengkap, dan memiliki contoh tangkapan layar.

## Format Output

Buat folder:

/docs
  /user-guide
  /admin-guide
  /broadcaster-guide
  /reporter-guide
  /operator-guide
  /screenshots
  /assets

Format utama:
- Markdown `.md`
- atau MDX jika akan dibuat dokumentasi interaktif

## Isi Dokumentasi

Minimal mencakup:

1. Pengenalan RadioSBL App
2. Cara login
3. Struktur menu
4. Dashboard
5. Absensi
6. Jadwal siaran
7. Request lagu
8. Buat naskah AI
9. Streaming
10. Podcast
11. Liputan/OB
12. Pengaduan
13. Manajemen user
14. Tukar jadwal
15. Laporan absensi
16. Profil pengguna
17. FAQ
18. Troubleshooting

## Dokumentasi Per Role

Buat panduan terpisah:

### Penyiar
- login
- melihat jadwal
- absen
- membaca request lagu
- membuat naskah
- tukar jadwal
- laporan aktivitas

### Admin
- monitoring dashboard
- kelola user
- kelola jadwal
- validasi absensi
- melihat laporan
- approval

### Reporter
- melihat tugas
- upload liputan
- membuat draft
- mengirim dokumentasi

### Operator
- monitoring siaran
- request lagu
- live tools
- koordinasi jadwal

## Screenshot

Buat screenshot untuk:
- login
- dashboard mobile
- dashboard desktop
- absensi
- jadwal
- request lagu
- buat naskah
- manajemen user
- profil
- menu mobile
- menu desktop

Gunakan nama file konsisten:

/docs/screenshots/login-mobile.png
/docs/screenshots/dashboard-mobile.png
/docs/screenshots/dashboard-desktop.png
/docs/screenshots/attendance-mobile.png
/docs/screenshots/schedule-mobile.png
/docs/screenshots/song-request-mobile.png

## Screenshot Otomatis

Jika memungkinkan, gunakan Playwright untuk mengambil screenshot otomatis.

Buat script:

npm run docs:screenshots

Script harus:
- membuka aplikasi lokal
- login dengan akun demo
- masuk ke halaman utama
- mengambil screenshot mobile
- mengambil screenshot desktop
- menyimpan ke folder docs/screenshots

## Catatan Keamanan

Jangan gunakan data user asli.

Gunakan:
- akun demo
- data dummy
- nama dummy
- jadwal dummy
- request dummy

Blur atau sembunyikan:
- email asli
- nomor telepon
- data pribadi
- token
- credential
- konfigurasi Firebase sensitif

## Struktur Tutorial

Setiap halaman dokumentasi gunakan format:

# Nama Fitur

## Fungsi
Jelaskan fitur ini untuk apa.

## Siapa yang Menggunakan
Contoh:
- Penyiar
- Admin
- Reporter

## Cara Mengakses
Jelaskan menu atau route.

## Langkah Penggunaan
1. Buka menu ...
2. Pilih ...
3. Tekan ...
4. Simpan ...

## Contoh Screenshot
![Contoh](../screenshots/nama-file.png)

## Catatan Penting
Jelaskan batasan atau hal yang perlu diperhatikan.

## Troubleshooting
Masalah umum dan solusinya.

## FAQ
Pertanyaan yang sering muncul.

## Acceptance Criteria

Dokumentasi dianggap selesai jika:
- semua fitur utama terdokumentasi
- screenshot tersedia
- panduan role tersedia
- user baru bisa belajar tanpa dibimbing langsung
- admin bisa memahami workflow
- developer internal bisa memahami struktur fitur
- tidak ada data sensitif masuk dokumentasi