# ARAHAN REDESIGN UI/UX RADIOSBL APP
## Fokus: Mobile-first, profesional, konsisten, ramah user baru, tanpa merusak data dan alur data lama

## 1. Tujuan Utama

Lakukan UX/UI refactor pada RadioSBL App agar terasa seperti aplikasi besar modern: rapi, ringan, konsisten, mudah dipahami user baru, nyaman di mobile, tetap aman digunakan di desktop.

Penting: ini bukan rebuild sistem.

Jangan mengubah:
- struktur data Firebase
- algoritma absensi
- alur autentikasi
- query data utama
- service existing
- business logic jadwal
- business logic request lagu
- business logic user/role
- integrasi Google Drive
- integrasi AI naskah
- struktur data produksi

Yang boleh diubah:
- layout
- navigasi
- komponen UI
- typography
- spacing
- icon
- visual hierarchy
- responsive behavior
- susunan menu
- pengalaman onboarding
- penggunaan logo/gambar/aset
- empty state/loading state/error state
- mobile/tablet/desktop presentation layer

RadioSBL saat ini sudah memiliki banyak modul penting seperti dashboard operasional, absensi berbasis lokasi, jadwal siaran, profil penyiar, streaming, liputan/OB, pengaduan, AI naskah, dan manajemen pengguna. Jadi fokus pekerjaan adalah merapikan experience, bukan menambah kerumitan fitur.

---

## 2. Prinsip Besar

Gunakan prinsip:

“Complex system, simple surface.”

Artinya:
- sistem boleh kompleks,
- fitur boleh banyak,
- tetapi tampilan awal harus sederhana,
- user baru tidak boleh merasa kewalahan.

RadioSBL harus terasa seperti:
- aplikasi operasional radio modern,
- bukan admin panel generik,
- bukan website desktop yang dipaksa ke mobile,
- bukan kumpulan halaman dengan gaya berbeda-beda.

---

## 3. Larangan Keras

Developer tidak boleh:
- menghapus collection/data existing
- mengganti nama field data existing
- mengubah struktur service tanpa alasan kuat
- mengubah rule auth/role tanpa review
- mengubah flow absensi produksi
- mengubah flow jadwal produksi
- mengubah flow request lagu produksi
- membuat ulang modul dari nol jika bisa dibungkus ulang dengan UI baru
- mencampur style baru dan lama tanpa design system

Setiap perubahan harus backward-compatible.

---

## 4. Strategi Pengerjaan Aman

Gunakan pendekatan bertahap:

### Tahap 1 — Audit UI existing
Inventaris semua halaman:
- Dashboard
- Absensi
- Jadwal Siaran
- Request Lagu
- Streaming
- Podcast
- Liputan
- OB
- Buat Naskah AI
- Profil Penyiar
- Manajemen User
- Tukar Jadwal
- Laporan Absensi
- Pengaduan
- Profil

Catat:
- ukuran font
- spacing
- jenis card
- jenis tombol
- icon
- warna
- layout mobile
- layout tablet
- layout desktop

### Tahap 2 — Buat Design System
Buat standar global:
- typography
- spacing
- button
- card
- badge
- form
- modal
- bottom sheet
- tab
- list item
- empty state
- loading state
- error state

### Tahap 3 — Refactor layout shell
Rapikan:
- struktur header
- bottom navigation
- sidebar desktop
- menu mobile
- menu tablet
- profile menu

### Tahap 4 — Refactor halaman prioritas
Mulai dari:
1. Dashboard
2. Absensi
3. Jadwal Siaran
4. Request Lagu
5. Buat Naskah AI
6. Manajemen User

### Tahap 5 — QA lintas device
Uji di:
- Android kecil
- Android besar
- Samsung Internet
- Chrome Android
- Xiaomi/Realme/Oppo/Vivo browser
- iPad/tablet
- desktop 1366px
- desktop besar
- mode landscape

---

## 5. Design System RadioSBL

### 5.1 Typography

Masalah saat ini: ukuran font terasa terlalu besar dan tidak konsisten.

Gunakan hierarchy yang lebih tenang:

- Page title mobile: 20–22px
- Section title: 16–18px
- Card title: 15–16px
- Body text: 14–15px
- Caption/meta: 12–13px
- Badge text: 11–12px
- Button text: 14–15px

Jangan semua teks dibuat bold.

Gunakan:
- title: semibold
- body: regular
- metadata: medium/regular
- badge: medium

Line-height harus lega:
- title: 1.2–1.3
- body: 1.45–1.6
- caption: 1.3–1.4

### 5.2 Spacing

Gunakan spacing konsisten:
- page padding mobile: 16px
- page padding tablet: 24px
- page padding desktop: 32px
- card padding mobile: 14–16px
- card gap: 12–16px
- section gap: 20–28px

Jangan setiap halaman membuat padding sendiri.

### 5.3 Card

Semua card harus konsisten:
- radius sama
- border sama
- shadow halus
- padding sama
- struktur konten jelas

Card tidak boleh terlalu besar jika hanya berisi data kecil.

### 5.4 Button

Tipe tombol:
- Primary
- Secondary
- Ghost
- Danger
- Icon Button

Ukuran:
- mobile minimal tinggi 44px
- tombol utama boleh 48px
- icon button minimal 40px

Jangan membuat tombol dengan style berbeda di setiap halaman.

### 5.5 Badge Status

Standarkan badge:
- Live
- Aktif
- Pending
- Berhasil
- Gagal
- Warning
- Tentative
- Dibatalkan
- Pengganti

Jangan menggunakan terlalu banyak warna.

---

## 6. Navigasi Mobile

RadioSBL punya banyak modul. Jangan tampilkan semua sebagai menu utama.

Gunakan bottom navigation maksimal 5 item:

1. Beranda
2. Jadwal
3. Absensi
4. Request
5. Menu

Menu lain masuk ke halaman “Menu Lengkap”.

Isi Menu Lengkap:
- Streaming
- Podcast
- Buat Naskah
- Liputan
- OB
- Pengaduan
- Penyiar
- Tukar Jadwal
- Laporan
- User Management
- Pengaturan
- Profil

Untuk desktop:
- gunakan sidebar
- kelompokkan menu berdasarkan fungsi
- jangan hanya list panjang

Kelompok menu desktop:
- Operasional
- Siaran
- Konten
- Tim
- Administrasi
- Sistem

---

## 7. Role-Based Experience

Tampilan harus menyesuaikan role.

### Penyiar
Yang utama:
- jadwal saya hari ini
- absen
- request lagu
- naskah
- status on-air
- tukar jadwal

### Admin
Yang utama:
- penyiar belum absen
- approval pending
- jadwal bentrok
- manajemen user
- laporan absensi
- status sistem

### Reporter
Yang utama:
- tugas liputan
- upload dokumentasi
- draft berita
- agenda OB

### User publik/umum
Yang utama:
- streaming
- request lagu
- podcast
- pengaduan

Jangan semua role melihat beban menu yang sama.

---

## 8. Dashboard Baru

Dashboard mobile harus menjawab:

“Apa yang harus saya lakukan sekarang?”

Urutan dashboard mobile:

1. Status siaran sekarang
2. Jadwal saya hari ini
3. Tombol absen cepat
4. Request lagu terbaru
5. Program berikutnya
6. Notifikasi penting
7. Shortcut fitur

Hindari:
- statistik terlalu banyak
- card terlalu penuh
- grafik berat
- tabel di mobile

Dashboard desktop boleh lebih lengkap, tetapi tetap rapi.

---

## 9. Absensi Mobile

Absensi adalah fitur operasional utama.

Halaman absensi mobile harus sangat jelas:

- Status hari ini
- Tombol Absen Masuk
- Tombol Absen Pulang
- Status lokasi
- Akurasi GPS
- Status selfie jika diperlukan
- Riwayat absensi hari ini
- Tombol Ajukan Izin/Sakit/Cuti

Jangan menyembunyikan alasan gagal absen.

Jika gagal:
- jelaskan penyebab
- berikan solusi
- jangan hanya tampilkan error teknis

Contoh:
“Lokasi Anda di luar radius kantor.”
“GPS belum akurat. Coba tunggu beberapa detik.”

---

## 10. Jadwal Siaran

Jadwal tidak boleh terasa seperti tabel statis.

Gunakan model:
- Hari Ini
- Besok
- Minggu Ini
- Kalender

Setiap jadwal wajib memiliki status:
- Reguler
- Pengganti
- Tentative
- Dibatalkan
- Menunggu Konfirmasi
- Sedang Berjalan

Untuk program dengan nama setelah garis miring:
- tampilkan sebagai opsi tentative
- jangan dianggap jadwal utama otomatis
- berikan visual berbeda

Contoh:
Program utama: “Aga Kareba”
Opsional: “Info Terkini”
Badge: Tentative

---

## 11. Request Lagu

Request lagu harus terasa realtime dan mudah diproses.

Gunakan card, bukan tabel.

Isi card:
- nama pengirim
- lagu/artis
- pesan
- waktu masuk
- status
- tombol cepat

Aksi cepat:
- Tandai Diputar
- Simpan
- Tolak
- Balas
- Arsip

Di mobile, penyiar harus bisa memproses request dengan satu tangan.

---

## 12. Buat Naskah AI

Mobile jangan dibuat serumit desktop.

Mobile mode:
- pilih jenis naskah
- isi topik
- pilih durasi
- tombol buat naskah
- hasil
- tombol salin/simpan

Desktop mode:
- template lengkap
- arsip
- editor panjang
- opsi lanjutan
- export/copy

Jangan semua kontrol ditampilkan di mobile.

---

## 13. Manajemen User

Mobile untuk aksi cepat:
- lihat user
- aktif/nonaktif
- ubah role sederhana
- verifikasi
- reset akses

Desktop untuk:
- audit detail
- permission kompleks
- bulk action
- filter lanjutan

Jangan pakai tabel kompleks di mobile.

---

## 14. Icon Profesional

Gunakan satu sistem icon saja.

Saat ini RadioSBL sudah memakai lucide-react di beberapa bagian. Lanjutkan dengan gaya icon yang sama agar konsisten.

Aturan icon:
- stroke konsisten
- ukuran mobile 18–22px
- jangan campur outline dan solid secara acak
- icon harus membantu navigasi, bukan hiasan
- setiap menu utama wajib punya icon yang mudah dikenali

Mapping icon:
- Dashboard: home/grid
- Jadwal: calendar
- Absensi: map-pin/check
- Request: music/headphones
- Streaming: radio/waves
- Podcast: podcast
- Naskah: file-text/edit
- User: users
- Pengaduan: message-circle
- OB/Liputan: mic/camera/map
- Laporan: chart/bar

---

## 15. Penggunaan Logo dan Aset

RadioSBL sudah memiliki aset logo, cover utama, studio, galeri program, dan galeri kru. Gunakan ini sebagai identitas visual aplikasi, bukan sekadar gambar tempelan.

Gunakan logo:
- splash screen
- login
- header kecil
- empty state tertentu
- app icon/PWA

Gunakan cover program:
- kartu program
- halaman podcast
- jadwal siaran
- arsip konten

Gunakan foto kru:
- profil penyiar
- jadwal penyiar
- dashboard admin

Aturan:
- semua gambar harus punya aspect ratio konsisten
- jangan stretch gambar
- jangan crop wajah sembarangan
- gunakan fallback avatar jika gambar gagal
- optimalkan gambar agar tidak membuat mobile berat

---

## 16. Empty State, Loading State, Error State

Jangan tampilkan “No Data” polos.

Contoh empty state:
- “Belum ada request lagu masuk.”
- “Belum ada jadwal hari ini.”
- “Belum ada pengajuan tukar jadwal.”
- “Belum ada data absensi periode ini.”

Loading:
- gunakan skeleton
- jangan hanya spinner
- halaman penting harus terasa stabil

Error:
- gunakan bahasa manusia
- jangan tampilkan error mentah Firebase ke user biasa

---

## 17. Responsive dan Adaptive UX

Target utama:
- mobile portrait Android

Kemudian:
- mobile besar
- tablet
- desktop

Breakpoint minimal:
- small mobile
- normal mobile
- tablet
- desktop
- wide desktop

Jangan samakan tablet dengan desktop.

Mobile:
- satu kolom
- bottom nav
- card ringkas
- action besar

Tablet:
- dua kolom jika cukup
- side panel ringan
- card tidak terlalu melebar

Desktop:
- sidebar
- dashboard grid
- table boleh digunakan
- filter lengkap

---

## 18. Cross-Browser QA

Wajib uji:
- Chrome Android
- Samsung Internet
- Xiaomi Browser
- Oppo/Vivo/Realme browser jika memungkinkan
- Safari iOS
- Chrome Desktop
- Edge Desktop

Masalah yang harus dicek:
- bottom nav ketutup browser bar
- sticky header error
- modal kepotong
- keyboard menutup input
- overflow horizontal
- font terlalu besar
- card terlalu tinggi
- tombol sulit ditekan
- layout tablet kosong/aneh
- PWA display mode

---

## 19. Visual Tone

RadioSBL harus terasa:
- modern
- tenang
- broadcast/media
- profesional
- tidak kaku
- tidak terlalu ramai

Jangan:
- terlalu banyak warna
- terlalu banyak shadow
- terlalu banyak badge
- terlalu banyak animasi
- terlalu banyak card dalam satu layar

Gunakan branding secara halus.

---

## 20. Prinsip “Ramah User Baru”

User baru harus langsung paham:
- ini aplikasi apa
- saya login sebagai siapa
- saya harus melakukan apa
- menu utama ada di mana
- apa status saya hari ini

Tambahkan:
- greeting sederhana
- shortcut berdasarkan role
- onboarding ringan
- tooltip kecil untuk fitur penting
- label menu yang mudah dipahami

Hindari istilah teknis internal.

---

## 21. Prinsip “Aman untuk User Lama”

User lama tidak boleh merasa kehilangan fitur.

Caranya:
- jangan hapus fitur
- pindahkan fitur ke tempat lebih rapi
- tetap sediakan Menu Lengkap
- gunakan nama menu yang familiar
- jangan mengubah workflow utama secara drastis
- jika ada perubahan besar, berikan petunjuk visual

---

## 22. Prioritas Pengerjaan

### Prioritas 1
- Design system
- Typography
- Spacing
- Button
- Card
- Badge
- Layout shell
- Bottom navigation

### Prioritas 2
- Dashboard mobile
- Absensi mobile
- Jadwal mobile
- Request lagu mobile

### Prioritas 3
- Buat Naskah AI
- User management
- Streaming
- Podcast
- Liputan/OB

### Prioritas 4
- Desktop polish
- Tablet refinement
- Animasi ringan
- Empty/loading/error states

---

## 23. Checklist Acceptance

Pekerjaan dianggap berhasil jika:

- Tidak ada perubahan data produksi
- Tidak ada service utama yang rusak
- Login tetap berjalan
- Role tetap berjalan
- Absensi tetap berjalan
- Jadwal tetap berjalan
- Request lagu tetap berjalan
- UI mobile lebih ringan
- Font tidak terlalu besar
- Bottom nav jelas
- Menu lebih rapi
- Semua halaman terasa satu keluarga
- Tidak ada overflow horizontal
- Tablet tidak rusak
- Desktop tetap nyaman
- Logo/aset digunakan konsisten
- Icon konsisten
- Loading/error/empty state lebih manusiawi

---

## 24. Arahan Final untuk Developer

Tolong lakukan UX/UI refactor dengan sangat hati-hati.

Jangan memperlakukan ini sebagai rebuild aplikasi.

Perlakukan ini sebagai:
- visual system refactor
- navigation refactor
- responsive refactor
- experience refactor

Engine aplikasi tetap dipertahankan.

Data, service, dan alur produksi harus tetap aman.

Tujuan akhirnya:
RadioSBL terasa seperti aplikasi besar modern yang mudah digunakan user baru, nyaman untuk penyiar di mobile, tetap kuat untuk admin di desktop, dan memiliki identitas visual RadioSBL yang rapi, konsisten, serta profesional.