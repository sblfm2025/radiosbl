Berikut dokumen panduan teknis siap diserahkan ke developer:

````md
# Panduan Teknis Integrasi RadioSBL App dengan Website WordPress Elementor

## 1. Tujuan Integrasi

Integrasi ini bertujuan menghubungkan RadioSBL App dengan website resmi berbasis WordPress Elementor tanpa mengganggu ekosistem data yang sudah ada.

Prinsip utama:

- RadioSBL App tetap menjadi pusat data utama.
- WordPress Elementor hanya menjadi tampilan publik.
- Semua komunikasi data melalui Public API.
- WordPress tidak boleh mengakses Firebase/database RadioSBL secara langsung.
- Data internal seperti absensi, user, role, draft naskah, izin/cuti/sakit, dan audit log tidak boleh dibuka ke website publik.

---

## 2. Arsitektur Sistem

Struktur integrasi yang disarankan:

```text
RadioSBL App / Firebase
        ↓
Backend API RadioSBL
        ↓
Public API Layer
        ↓
Plugin WordPress RadioSBL Connector
        ↓
Shortcode / Elementor Widget
        ↓
Website Resmi SBL
````

Alur data:

```text
Admin/Penyiar mengelola data di RadioSBL App
        ↓
Data tersimpan di database utama RadioSBL
        ↓
Backend menyediakan Public API
        ↓
Website WordPress mengambil data via API
        ↓
Data tampil di halaman Elementor
```

---

## 3. Pembagian Peran Sistem

### RadioSBL App

Berfungsi sebagai:

* pusat operasional radio,
* manajemen jadwal siaran,
* manajemen podcast,
* manajemen berita Pinrang Berkabar,
* manajemen penyiar,
* request lagu,
* dashboard admin,
* pusat validasi data.

### WordPress Elementor

Berfungsi sebagai:

* website publik,
* landing page resmi,
* etalase informasi,
* halaman promosi,
* halaman jadwal publik,
* halaman podcast,
* halaman berita,
* halaman profil penyiar,
* form request lagu publik.

---

## 4. Data yang Boleh Dibuka ke Website

Data publik yang boleh diakses WordPress:

* live status siaran,
* jadwal siaran hari ini,
* jadwal mingguan,
* daftar program acara,
* podcast terbaru,
* berita Pinrang Berkabar yang sudah publish,
* profil penyiar publik,
* form request lagu.

---

## 5. Data yang Tidak Boleh Dibuka

Data berikut tidak boleh diakses dari WordPress:

* data absensi,
* data user internal,
* role admin,
* draft naskah,
* data izin/cuti/sakit,
* audit log,
* token Firebase,
* service account,
* credential database,
* konfigurasi backend,
* data pribadi yang tidak untuk publik.

---

## 6. Struktur Endpoint Public API

Gunakan prefix khusus:

```text
/api/public/
```

Endpoint yang disarankan:

```text
GET  /api/public/live-status
GET  /api/public/schedules/today
GET  /api/public/schedules/week
GET  /api/public/programs
GET  /api/public/podcasts/latest
GET  /api/public/news/latest
GET  /api/public/news/{slug}
GET  /api/public/announcers
POST /api/public/song-requests
```

---

## 7. Endpoint Live Status

### Endpoint

```text
GET /api/public/live-status
```

### Fungsi

Menampilkan status siaran yang sedang berlangsung.

### Contoh Response

```json
{
  "status": "on_air",
  "program": "Aga Kareba",
  "announcer": "Penyiar SBL",
  "start_time": "09:00",
  "end_time": "11:00",
  "stream_url": "https://stream.radiosbl.id/live",
  "updated_at": "2026-05-18T09:30:00+08:00"
}
```

### Catatan Logika

Prioritas status live:

```text
manual override admin
↓
jadwal khusus tanggal tertentu
↓
jadwal perubahan
↓
jadwal reguler mingguan
↓
fallback offline/default
```

Jika tidak ada siaran aktif, response:

```json
{
  "status": "offline",
  "message": "Belum ada siaran aktif",
  "stream_url": "https://stream.radiosbl.id/live"
}
```

---

## 8. Endpoint Jadwal Hari Ini

### Endpoint

```text
GET /api/public/schedules/today
```

### Fungsi

Menampilkan jadwal siaran berdasarkan tanggal hari ini.

### Contoh Response

```json
[
  {
    "time": "06:00 - 08:00",
    "program": "Salam Bumi Lasinrang",
    "announcer": "Penyiar A",
    "status": "completed"
  },
  {
    "time": "09:00 - 11:00",
    "program": "Aga Kareba",
    "announcer": "Penyiar B",
    "status": "on_air"
  },
  {
    "time": "13:00 - 15:00",
    "program": "Info Seputar Pinrang",
    "announcer": "Penyiar C",
    "status": "upcoming"
  }
]
```

### Status Jadwal

Gunakan status:

```text
completed
on_air
upcoming
cancelled
changed
tentative
```

---

## 9. Endpoint Jadwal Mingguan

### Endpoint

```text
GET /api/public/schedules/week
```

### Fungsi

Menampilkan jadwal selama 7 hari.

### Logika Jadwal

Prioritas pengambilan data:

```text
1. Jadwal khusus berdasarkan tanggal
2. Jadwal perubahan/manual
3. Jadwal reguler mingguan
4. Jadwal tentative jika diaktifkan
```

Jika ada program dengan format nama menggunakan garis miring:

```text
Program Reguler / Program Tentative
```

Maka:

* nama pertama adalah program reguler,
* nama setelah garis miring adalah program opsional,
* program tentative hanya tampil jika statusnya aktif.

---

## 10. Endpoint Program Acara

### Endpoint

```text
GET /api/public/programs
```

### Contoh Response

```json
[
  {
    "name": "Aga Kareba",
    "slug": "aga-kareba",
    "description": "Program informasi dan hiburan khas Radio SBL.",
    "thumbnail": "https://...",
    "category": "Informasi",
    "is_active": true
  }
]
```

---

## 11. Endpoint Podcast

### Endpoint

```text
GET /api/public/podcasts/latest
```

### Contoh Response

```json
[
  {
    "title": "Podcast SBL Edisi Pinrang Hari Ini",
    "slug": "podcast-sbl-edisi-pinrang-hari-ini",
    "thumbnail": "https://...",
    "audio_url": "https://...",
    "duration": "24:15",
    "published_at": "2026-05-18",
    "host": "Radio SBL"
  }
]
```

Hanya tampilkan podcast dengan status:

```text
published
```

---

## 12. Endpoint Berita Pinrang Berkabar

### Endpoint

```text
GET /api/public/news/latest
GET /api/public/news/{slug}
```

### Contoh Response List

```json
[
  {
    "title": "Judul Berita Pinrang",
    "slug": "judul-berita-pinrang",
    "thumbnail": "https://...",
    "excerpt": "Ringkasan berita...",
    "category": "Pinrang Berkabar",
    "author": "Redaksi SBL",
    "published_at": "2026-05-18"
  }
]
```

### Contoh Response Detail

```json
{
  "title": "Judul Berita Pinrang",
  "slug": "judul-berita-pinrang",
  "thumbnail": "https://...",
  "content": "<p>Isi berita...</p>",
  "category": "Pinrang Berkabar",
  "author": "Redaksi SBL",
  "published_at": "2026-05-18"
}
```

Catatan:

* hanya berita publish yang tampil,
* draft tidak boleh tampil,
* berita terjadwal hanya tampil setelah waktu publish.

---

## 13. Endpoint Profil Penyiar

### Endpoint

```text
GET /api/public/announcers
```

### Contoh Response

```json
[
  {
    "name": "Penyiar SBL",
    "photo": "https://...",
    "bio": "Penyiar Radio SBL FM Pinrang.",
    "programs": ["Aga Kareba", "Salam Bumi Lasinrang"],
    "social_media": {
      "instagram": "https://instagram.com/..."
    }
  }
]
```

---

## 14. Endpoint Request Lagu

### Endpoint

```text
POST /api/public/song-requests
```

### Payload

```json
{
  "name": "Andi",
  "phone": "08xxxx",
  "song_title": "Judul Lagu",
  "artist": "Nama Penyanyi",
  "message": "Salam untuk teman-teman"
}
```

### Response Berhasil

```json
{
  "success": true,
  "message": "Request lagu berhasil dikirim",
  "request_id": "REQ-20260518-001"
}
```

### Status Internal Request

Setelah masuk dashboard RadioSBL, gunakan status:

```text
new
reviewed
queued
played
rejected
spam
```

---

## 15. Keamanan API

### Untuk GET Endpoint

Gunakan:

* CORS terbatas ke domain website resmi,
* cache,
* rate limit,
* validasi response,
* tidak menampilkan data sensitif.

Contoh domain yang diizinkan:

```text
https://sbl.pinrangkab.go.id
https://www.sbl.pinrangkab.go.id
```

### Untuk POST Endpoint

Wajib gunakan:

* rate limit,
* reCAPTCHA,
* validasi nomor HP,
* sanitasi input,
* filter kata kasar,
* anti-spam,
* API key terbatas,
* logging request.

Header yang bisa digunakan:

```http
x-radiosbl-client: wordpress-public
x-radiosbl-key: PUBLIC_LIMITED_KEY
```

---

## 16. Jangan Hubungkan WordPress Langsung ke Firebase

Hindari alur ini:

```text
WordPress → Firebase langsung
```

Gunakan alur ini:

```text
WordPress → Public API RadioSBL → Backend RadioSBL → Database
```

Alasannya:

* lebih aman,
* mudah divalidasi,
* mudah diaudit,
* tidak merusak struktur database,
* tidak membocorkan credential,
* lebih mudah dikembangkan ke depan.

---

## 17. Plugin WordPress RadioSBL Connector

Buat plugin khusus bernama:

```text
RadioSBL Connector
```

### Fungsi Plugin

Plugin bertugas untuk:

* menyimpan URL API RadioSBL,
* menyimpan public API key,
* membuat shortcode,
* mengambil data API,
* mengatur cache,
* menampilkan fallback jika API gagal,
* menyediakan form request lagu,
* menyediakan tampilan card yang responsif.

---

## 18. Shortcode yang Harus Dibuat

Shortcode minimal:

```text
[radiosbl_live_status]
[radiosbl_today_schedule]
[radiosbl_week_schedule]
[radiosbl_programs]
[radiosbl_latest_podcast]
[radiosbl_latest_news]
[radiosbl_announcers]
[radiosbl_song_request_form]
```

---

## 19. Contoh Struktur Plugin WordPress

```text
radiosbl-connector/
│
├── radiosbl-connector.php
├── includes/
│   ├── api-client.php
│   ├── shortcodes.php
│   ├── admin-settings.php
│   └── helpers.php
│
├── assets/
│   ├── css/
│   │   └── radiosbl-public.css
│   └── js/
│       └── radiosbl-public.js
│
└── templates/
    ├── live-status.php
    ├── today-schedule.php
    ├── week-schedule.php
    ├── podcast-card.php
    ├── news-card.php
    ├── announcer-card.php
    └── song-request-form.php
```

---

## 20. Halaman Setting Plugin

Tambahkan menu di WordPress Admin:

```text
Settings → RadioSBL Connector
```

Field setting:

```text
API Base URL
Public API Key
Cache Duration
Enable Debug Mode
Enable reCAPTCHA
reCAPTCHA Site Key
reCAPTCHA Secret Key
```

Contoh API Base URL:

```text
https://app.radiosbl.id/api/public
```

---

## 21. Cache WordPress

Gunakan WordPress transient.

Rekomendasi cache:

```text
Live status: 15–30 detik
Jadwal hari ini: 1–5 menit
Jadwal mingguan: 10–30 menit
Podcast terbaru: 10–30 menit
Berita terbaru: 5–15 menit
Profil penyiar: 1–6 jam
Program acara: 1–6 jam
```

Contoh nama transient:

```text
radiosbl_live_status
radiosbl_today_schedule
radiosbl_week_schedule
radiosbl_latest_podcast
radiosbl_latest_news
radiosbl_announcers
```

---

## 22. Fallback Tampilan

Jika API gagal, tampilkan pesan yang ramah.

### Live Status

```text
Status siaran belum tersedia. Silakan dengarkan live streaming Radio SBL FM.
```

### Jadwal

```text
Jadwal siaran sedang diperbarui.
```

### Podcast

```text
Podcast terbaru belum tersedia.
```

### Berita

```text
Berita terbaru belum tersedia.
```

### Request Lagu

```text
Form request lagu belum tersedia. Silakan coba beberapa saat lagi.
```

---

## 23. Integrasi dengan Elementor

Cara penggunaan:

```text
1. Buka halaman WordPress
2. Edit with Elementor
3. Tambahkan widget Shortcode
4. Masukkan shortcode RadioSBL
5. Simpan halaman
```

Contoh halaman homepage:

```text
[radiosbl_live_status]
[radiosbl_today_schedule]
[radiosbl_latest_podcast]
[radiosbl_latest_news]
```

Contoh halaman jadwal:

```text
[radiosbl_today_schedule]
[radiosbl_week_schedule]
```

Contoh halaman request lagu:

```text
[radiosbl_song_request_form]
```

---

## 24. Tampilan Responsif

Plugin harus responsif untuk:

```text
desktop
tablet
mobile
```

Aturan UI:

* card tidak terlalu padat,
* jadwal mobile menggunakan vertical list,
* desktop bisa menggunakan grid/table,
* tombol mudah ditekan di mobile,
* teks tidak terlalu kecil,
* loading state harus jelas,
* error state harus ramah.

---

## 25. Validasi Form Request Lagu

Field minimal:

```text
Nama
Nomor HP
Judul Lagu
Penyanyi
Pesan / Salam
```

Validasi:

```text
Nama wajib
Judul lagu wajib
Nomor HP opsional tapi divalidasi jika diisi
Pesan maksimal 300 karakter
Tidak boleh mengirim terlalu sering
Wajib lolos reCAPTCHA
```

Anti-spam:

```text
batasi IP yang sama
batasi nomor HP yang sama
deteksi pesan duplikat
filter kata kasar
honeypot field
```

---

## 26. Logging

Backend RadioSBL perlu mencatat:

```text
request timestamp
IP address
user agent
endpoint
status response
error message jika ada
```

Khusus request lagu:

```text
nama pengirim
judul lagu
status moderasi
sumber: wordpress
waktu masuk
```

---

## 27. Testing API

Developer wajib menguji:

```text
GET live-status berhasil
GET jadwal hari ini berhasil
GET jadwal mingguan berhasil
GET podcast terbaru berhasil
GET berita terbaru berhasil
GET profil penyiar berhasil
POST request lagu berhasil
data internal tidak terbuka
CORS hanya domain resmi
cache berjalan
fallback tampil saat API error
```

---

## 28. Testing WordPress

Uji di WordPress:

```text
shortcode tampil di Elementor
layout tidak rusak
data API tampil benar
cache bekerja
form request lagu bisa submit
pesan sukses tampil
pesan error tampil
mobile responsive
tidak ada error console
tidak memperlambat loading halaman
```

---

## 29. Testing Keamanan

Uji keamanan minimal:

```text
API key tidak tampil di frontend jika bersifat rahasia
Firebase credential tidak ada di WordPress
POST request lagu tidak bisa spam
input HTML/script disanitasi
CORS tidak terbuka untuk semua domain
endpoint admin tidak bisa diakses publik
draft berita tidak tampil
data absensi tidak tampil
data user internal tidak tampil
```

---

## 30. Tahapan Implementasi

### Tahap 1 — Fondasi

Kerjakan:

```text
Public API Layer
Live Status
Jadwal Hari Ini
Jadwal Mingguan
Plugin WordPress dasar
Shortcode dasar
```

### Tahap 2 — Konten Publik

Tambahkan:

```text
Program Acara
Podcast Terbaru
Berita Pinrang Berkabar
Profil Penyiar
```

### Tahap 3 — Interaksi Publik

Tambahkan:

```text
Form Request Lagu
Moderasi request
Anti-spam
reCAPTCHA
Status request
```

### Tahap 4 — Penyempurnaan

Tambahkan:

```text
Elementor widget native
Cache manager
Dashboard statistik integrasi
Fallback advanced
Skeleton loading
Design system khusus RadioSBL
```

---

## 31. Checklist Serah Terima

Sebelum dinyatakan selesai, pastikan:

```text
[ ] API public tersedia
[ ] API tidak membuka data internal
[ ] Plugin WordPress aktif
[ ] Setting plugin tersedia
[ ] Shortcode berjalan
[ ] Live status tampil
[ ] Jadwal hari ini tampil
[ ] Jadwal mingguan tampil
[ ] Podcast tampil
[ ] Berita tampil
[ ] Profil penyiar tampil
[ ] Request lagu berhasil masuk dashboard
[ ] Cache berjalan
[ ] Fallback berjalan
[ ] Tampilan mobile rapi
[ ] CORS aman
[ ] Rate limit aktif
[ ] reCAPTCHA aktif untuk form
[ ] Tidak ada credential bocor
```

---

## 32. Catatan Penting

Integrasi ini harus menjaga RadioSBL App sebagai pusat data utama.

Jangan membuat WordPress menjadi tempat input utama untuk data operasional radio.

WordPress hanya boleh:

```text
membaca data publik
menampilkan data publik
mengirim request publik melalui endpoint resmi
```

RadioSBL App tetap menangani:

```text
validasi
moderasi
penyimpanan
approval
manajemen data
audit log
```

---

## 33. Kesimpulan Teknis

Model integrasi terbaik:

```text
Public API RadioSBL + Plugin WordPress RadioSBL Connector + Shortcode Elementor
```

Keuntungan:

* aman,
* rapi,
* mudah dikembangkan,
* tidak mengganggu database utama,
* mudah digunakan editor WordPress,
* cocok untuk Elementor,
* mendukung website publik yang dinamis,
* menjaga RadioSBL App tetap sebagai pusat operasional.

```
```
