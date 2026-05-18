# ARAHAN TAMBAHAN FITUR VIDEO YOUTUBE
## RadioSBL App — Video Pinrang Berkabar
### Untuk Developer VS/Codex

---

# 1. Tujuan Fitur

Tambahkan fitur khusus untuk menampilkan video-video terbaru dari playlist YouTube resmi **Pinrang Berkabar** di aplikasi RadioSBL.

Playlist sumber:

`https://youtube.com/playlist?list=PLFv9iRIehC6xWCtxh_tJRbGiVJN5Hb61V`

Playlist ID:

`PLFv9iRIehC6xWCtxh_tJRbGiVJN5Hb61V`

Fitur ini harus tampil rapi, modern, mobile-first, dan konsisten dengan tema UI/UX RadioSBL.

---

# 2. Prinsip Penting

Fitur ini harus bersifat tambahan.

Jangan mengubah:
- alur data lama,
- struktur Firebase yang sudah ada,
- auth,
- role,
- absensi,
- jadwal,
- request lagu,
- podcast,
- streaming,
- AI naskah.

Fitur ini hanya menambahkan modul baru:
- Video
- Pinrang Berkabar
- YouTube Playlist Feed

---

# 3. Catatan Keamanan API Key

JANGAN hardcode API key YouTube di frontend.

Gunakan salah satu pendekatan aman:

## Opsi Terbaik
Gunakan Firebase Cloud Functions / backend proxy.

Frontend memanggil:

`/api/youtube/pinrang-berkabar`

Backend yang memanggil YouTube Data API.

## Opsi Minimal
Gunakan environment variable.

`VITE_YOUTUBE_API_KEY=ISI_DENGAN_API_KEY_YANG_SUDAH_DIRESTRICT`

Tetapi untuk produksi tetap wajib:
- restrict API key berdasarkan HTTP referrer,
- batasi hanya untuk YouTube Data API v3,
- aktifkan quota protection,
- jangan commit `.env` ke GitHub.

---

# 4. Struktur Menu

Tambahkan menu baru:

## Mobile
Masukkan ke:
- Menu Lengkap
  - Video
  - Pinrang Berkabar

Jangan menambah terlalu banyak item di bottom navigation.

## Desktop
Masukkan ke grup:
- Konten
  - Podcast
  - Video Radio SBL
  - Pinrang Berkabar

---

# 5. Halaman Baru

Buat halaman:

`Video Pinrang Berkabar`

Route contoh:

`/videos/pinrang-berkabar`

atau:

`/pinrang-berkabar/videos`

Pilih route yang paling sesuai dengan struktur routing RadioSBL saat ini.

---

# 6. Data yang Diambil dari YouTube

Ambil data dari playlist YouTube menggunakan YouTube Data API v3.

Endpoint utama:

`playlistItems`

Parameter:
- `part=snippet,contentDetails`
- `playlistId=PLFv9iRIehC6xWCtxh_tJRbGiVJN5Hb61V`
- `maxResults=12`
- `pageToken` untuk pagination

Data yang dibutuhkan:
- videoId
- title
- description
- thumbnails
- publishedAt
- channelTitle
- position

Opsional endpoint tambahan:

`videos`

Untuk mengambil:
- duration
- viewCount
- likeCount
- statistics
- contentDetails

---

# 7. Tampilan UI Mobile

Gunakan layout card vertikal.

Setiap card video berisi:
- thumbnail 16:9,
- badge “Pinrang Berkabar”,
- judul video,
- tanggal upload,
- channel/source,
- tombol “Tonton”,
- icon YouTube/video.

Jangan gunakan tabel.

Prioritaskan:
- card ringkas,
- font tidak terlalu besar,
- thumbnail jelas,
- spacing nyaman,
- nyaman disentuh satu tangan.

---

# 8. Tampilan UI Desktop

Gunakan grid responsif:

- mobile: 1 kolom
- tablet: 2 kolom
- desktop: 3 kolom
- wide desktop: 4 kolom jika masih nyaman

Setiap card tetap konsisten dengan design system RadioSBL.

---

# 9. Header Halaman

Header halaman harus informatif dan menarik.

Contoh struktur:

```txt
Pinrang Berkabar
Video terbaru dari kanal YouTube Radio SBL.
Ikuti kabar terbaru seputar Pinrang dalam format video.

```

Tambahkan elemen:
- ringkasan jumlah video yang sedang tampil;
- tombol `Buka playlist`;
- indikator sumber data: Proxy, YouTube API, atau fallback playlist;
- pesan ringan jika koneksi/API gagal.

---

# 10. Empty State dan Error State

Jika data belum tersedia:
- tampilkan skeleton/loading card;
- tampilkan fallback card menuju playlist resmi;
- jangan membuat UI kosong.

Jika API gagal:
- jangan tampilkan error teknis mentah;
- tampilkan pesan:

```txt
Video belum bisa dimuat. Buka playlist YouTube untuk menonton langsung.
```

Tetap sediakan tombol:
- `Buka Playlist`
- `Coba Lagi`

---

# 11. Fallback Data

Fallback tidak boleh mengarang judul video spesifik.

Fallback cukup berupa:
- card playlist resmi;
- deskripsi umum;
- thumbnail atau logo Radio SBL;
- link ke playlist.

---

# 12. Integrasi Navigasi

Tambahkan page key baru:

`pinrangBerkabar`

Menu:
- `Menu Lengkap > Konten > Pinrang Berkabar`
- `Sidebar Desktop > Konten > Pinrang Berkabar`

Bottom navigation tetap 5 item:
- Beranda
- Jadwal
- Absensi
- Request
- Menu

---

# 13. Acceptance Criteria

Fitur dianggap selesai jika:
- halaman `Pinrang Berkabar` bisa dibuka dari menu lengkap dan sidebar desktop;
- playlist ID tidak ditulis berulang di komponen UI;
- API key tidak di-hardcode;
- mobile tidak overflow horizontal;
- card video memakai thumbnail 16:9;
- tombol `Tonton` membuka YouTube di tab baru;
- tombol `Muat lagi` memakai `nextPageToken` untuk mengambil halaman video berikutnya;
- pencarian lokal bisa memfilter video yang sudah termuat;
- jika API gagal, user tetap bisa membuka playlist resmi;
- tidak ada perubahan destruktif pada modul lama.
