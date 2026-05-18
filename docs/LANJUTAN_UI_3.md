````md
# RADIO SBL APP
# MASTER UI/UX REFINEMENT DOCUMENT
## Super App Dashboard, Operational UX, dan Pinrang Berkabar Experience
### Untuk VS/Codex Developer Team

---

# 1. TUJUAN DOKUMEN

Dokumen ini menjadi arahan utama untuk:
- refactor UI/UX,
- redesign dashboard,
- penyempurnaan mobile experience,
- peningkatan operational workflow,
- dan pengembangan experience Pinrang Berkabar
di dalam RadioSBL App.

Tujuan utama:
RadioSBL harus berkembang menjadi:

> “Operational Media Super App”

yang:
- modern,
- realtime,
- ringan,
- profesional,
- mobile-first,
- dan nyaman digunakan jangka panjang.

---

# 2. FILOSOFI BESAR RADIO SBL

RadioSBL bukan:
- admin panel biasa,
- dashboard template,
- atau website radio yang dijadikan aplikasi.

RadioSBL harus terasa seperti:
- command center siaran,
- media workflow platform,
- newsroom modern,
- operational super app.

---

# 3. MASALAH UTAMA UI/UX SAAT INI

Berdasarkan evaluasi dashboard dan struktur aplikasi saat ini:

## Masalah terbesar:
- terlalu banyak informasi tampil bersamaan,
- terlalu banyak card besar,
- hierarchy visual belum jelas,
- typography terlalu besar,
- terlalu banyak warna aktif,
- terlalu banyak shortcut,
- dashboard terlalu panjang,
- mobile terlalu padat,
- dan semua fitur terasa sama penting.

Akibatnya:
- cognitive load tinggi,
- user cepat lelah,
- sulit fokus,
- dan dashboard terasa berat.

---

# 4. TARGET EXPERIENCE

RadioSBL harus terasa:
- ringan,
- cepat,
- tenang,
- realtime,
- modern,
- dan powerful.

Target akhir:

```txt
Powerful but effortless.
Complex system with simple experience.
````

---

# 5. STRATEGI BESAR PENGERJAAN

PENTING:
Jangan melakukan rebuild total.

Jangan merusak:

* struktur data dan integrasi existing,
* auth,
* alur absensi,
* alur jadwal,
* alur request lagu,
* workflow produksi.

Fokus:

* visual layer,
* navigation layer,
* interaction layer,
* operational experience layer.

---

# 6. DASHBOARD REFACTOR TOTAL

## Dashboard Saat Ini

Dashboard saat ini:

* terlalu panjang,
* terlalu padat,
* terlalu banyak section,
* dan belum memiliki hierarchy yang jelas.

Dashboard terasa seperti:

> semua fitur ingin tampil sekaligus.

---

# 7. FILOSOFI DASHBOARD BARU

Dashboard bukan:

* launcher semua fitur,
* tempat semua statistik,
* tempat semua card.

Dashboard harus:

> membantu user fokus pada aktivitas paling penting saat ini.

Dashboard harus menjawab:

```txt
Apa yang perlu saya lakukan sekarang?
```

---

# 8. SUPER APP DASHBOARD STRUCTURE

---

# 8.1 HERO HEADER

Header harus:

* clean,
* ringan,
* premium,
* tidak terlalu tinggi.

Isi:

* greeting,
* avatar kecil,
* status hari ini,
* notif icon.

---

## Contoh

```txt
Selamat Siang, Fajar Bakri
Siaran Anda dimulai pukul 13:00
```

---

# 8.2 FEATURED LIVE CARD

Card utama dashboard.

Hanya satu featured card utama.

Isi:

* program berjalan,
* status live,
* studio,
* penyiar,
* tombol play/live.

Gunakan:

* gradient ringan,
* hierarchy kuat,
* visual premium.

---

# 8.3 PRIORITY SECTION

Section:
“Yang Perlu Diprioritaskan”

Tetapi:
ubah menjadi compact operational list.

---

## Jangan gunakan:

* card tinggi,
* warna terlalu aktif,
* border tebal.

---

## Gunakan:

* row compact,
* icon kecil,
* quick action kecil,
* metadata ringan.

---

# 8.4 QUICK ACTION

Quick action saat ini terlalu besar.

Refactor menjadi:

* compact icon grid,
* 4–6 action utama,
* icon lebih kecil,
* spacing lebih rapi.

---

## Action utama:

* Absen
* Jadwal
* Request
* Naskah
* Monitoring
* Live

Sisanya masuk:
Menu Lengkap.

---

# 8.5 ACTIVITY TIMELINE

Aktivitas terbaru harus:

* lebih realtime,
* lebih clean,
* lebih subtle.

Gunakan:

* timeline compact,
* timestamp ringan,
* divider tipis.

---

# 8.6 CONTENT CAROUSEL

Pisahkan:

* Podcast
* Video
* Pinrang Berkabar

Gunakan:

* carousel horizontal,
* compact media card,
* thumbnail dominan.

---

# 9. PROGRESSIVE DISCLOSURE

Dashboard terlalu banyak menampilkan semua hal.

Gunakan:

* expand/collapse,
* lihat semua,
* section preview,
* tab kecil.

---

## Contoh:

Dashboard hanya tampil:

* 3 aktivitas terbaru.

Tombol:

```txt
Lihat Semua
```

---

# 10. TYPOGRAPHY SYSTEM

Masalah saat ini:

* font terlalu besar,
* terlalu banyak bold,
* hierarchy belum matang.

---

# 10.1 Typography Mobile

* Page title: 20–21px
* Section title: 16–17px
* Card title: 15px
* Body: 14px
* Caption/meta: 12px

---

# 10.2 Typography Rules

Gunakan:

* semibold untuk heading,
* regular untuk body,
* medium untuk metadata penting.

Jangan:

* semua bold,
* semua title besar.

---

# 10.3 Readability

Gunakan:

* line-height nyaman,
* spacing antar section,
* paragraph pendek.

---

# 11. VISUAL CALMNESS

Dashboard harus lebih tenang.

---

# 11.1 Warna

Gunakan warna hanya untuk:

* live,
* warning,
* success,
* critical.

Sisanya:

* neutral,
* subtle,
* calm.

---

# 11.2 Shadow

Gunakan:

* soft shadow,
* border ringan,
* layering halus.

Jangan:

* glowing,
* shadow berat,
* border keras.

---

# 11.3 Badge

Badge hanya untuk:

* live,
* pending,
* urgent,
* status penting.

---

# 12. CARD SYSTEM

Saat ini terlalu banyak jenis card.

---

# 12.1 Semua Card Harus Konsisten

* radius sama,
* padding sama,
* spacing sama,
* hierarchy sama.

---

# 12.2 Hindari Card Tinggi

Gunakan:

* compact operational card.

---

# 12.3 Featured Card

Gunakan hanya untuk:

* live,
* video utama,
* alert utama.

---

# 13. MOBILE-FIRST EXPERIENCE

Target utama:
Android portrait.

---

# 13.1 Mobile UX

Harus:

* one-hand friendly,
* cepat discan,
* cepat disentuh,
* minim tap.

---

# 13.2 Bottom Navigation

Maksimal:
5 item.

Rekomendasi:

1. Beranda
2. Jadwal
3. Absensi
4. Request
5. Menu

---

# 13.3 Menu Lengkap

Masukkan:

* Podcast
* Video
* Pinrang Berkabar
* Buat Naskah
* Pengaduan
* Monitoring
* Liputan
* User
* Pengaturan

---

# 14. TABLET EXPERIENCE

Tablet bukan:

* HP diperbesar,
* desktop diperkecil.

---

# 14.1 Tablet Layout

Gunakan:

* split layout,
* dual panel,
* adaptive grid.

---

# 14.2 Tablet Productivity

Tablet harus terasa:

* produktif,
* multitasking,
* nyaman monitoring.

---

# 15. DESKTOP EXPERIENCE

Desktop fokus:

* monitoring,
* administrasi,
* laporan,
* multitasking.

---

# 15.1 Sidebar Desktop

Kelompok menu:

* Operasional
* Siaran
* Konten
* Tim
* Administrasi
* Sistem

---

# 16. REQUEST LAGU UX

Request lagu harus terasa:

* realtime,
* hidup,
* operasional.

---

# 16.1 Gunakan Compact Realtime Card

Isi:

* nama,
* lagu,
* pesan,
* waktu,
* quick action.

---

# 16.2 Hindari Tabel di Mobile

Gunakan:

* card stack,
* swipe action,
* quick action.

---

# 17. PINRANG BERKABAR EXPERIENCE

Gunakan:
`/PinrangBerkabar.png`

sebagai identitas resmi.

---

# 17.1 PINRANG BERKABAR HARUS TERASA SEPERTI:

* mini newsroom,
* kanal berita video,
* media portal modern,
* bagian premium RadioSBL.

---

# 17.2 HERO SECTION

Tambahkan:

* logo Pinrang Berkabar,
* subtitle,
* tombol YouTube,
* featured video.

---

## Contoh

```txt
Pinrang Berkabar
Video berita dan informasi terbaru dari Radio SBL.
```

---

# 17.3 FEATURED VIDEO

Video terbaru tampil dominan.

Isi:

* thumbnail besar,
* judul,
* tanggal,
* tombol tonton,
* badge terbaru.

---

# 17.4 VIDEO GRID

Gunakan:

* mobile: 1 kolom
* tablet: 2 kolom
* desktop: 3 kolom

---

# 17.5 VIDEO PLAYER

Video harus diputar:

* di dalam aplikasi,
* menggunakan embedded player responsive.

Jangan memaksa user keluar aplikasi.

---

# 17.6 RELATED VIDEO

Tambahkan:

```txt
Video Lainnya
```

Gunakan:

* carousel horizontal,
* compact video card.

---

# 17.7 VISUAL STYLE

Pinrang Berkabar harus:

* lebih clean,
* lebih newsroom,
* lebih media-centric.

---

# 18. EMPTY STATE & ERROR UX

Gunakan bahasa manusia.

---

# 18.1 Empty State

```txt
Belum ada video terbaru.
```

---

# 18.2 Error State

```txt
Data belum dapat dimuat.
Coba beberapa saat lagi.
```

---

# 19. LOADING EXPERIENCE

Gunakan:

* skeleton,
* shimmer ringan,
* progressive loading.

Jangan:

* spinner fullscreen besar.

---

# 20. MICROINTERACTION

Tambahkan:

* hover ringan,
* tap feedback,
* smooth transition,
* skeleton animation.

Jangan:

* animasi ramai,
* motion berlebihan.

---

# 21. PERFORMANCE UX

Dashboard harus terasa cepat.

---

# 21.1 Lazy Loading

Gunakan lazy loading untuk:

* gambar,
* video,
* iframe,
* carousel,
* media asset.

---

# 21.2 Render Prioritas

Render:

* visible content terlebih dahulu.

---

# 22. OPERATIONAL CALMNESS

Walaupun fitur banyak:
dashboard harus tetap terasa:

* tenang,
* fokus,
* tidak melelahkan.

---

# 22.1 One Screen One Focus

Setiap layar:

* hanya punya 1 fokus utama.

---

# 22.2 Kurangi Distraksi

Saat on-air:

* tampilkan hanya informasi penting.

---

# 23. ACCESSIBILITY

Pastikan:

* readable outdoor,
* touch target aman,
* contrast cukup,
* icon jelas.

---

# 24. DESIGN GOVERNANCE

Semua halaman baru wajib mengikuti:

* typography system,
* spacing system,
* card system,
* motion system,
* icon system,
* color system.

Tidak boleh:

* style random,
* layout random,
* ukuran random.

---

# 25. FINAL QUALITY CHECKLIST

Tahap dianggap berhasil jika:

* dashboard lebih pendek
* hierarchy jelas
* font nyaman
* warna lebih tenang
* quick action lebih compact
* featured card lebih premium
* aktivitas lebih realtime
* mobile lebih ringan
* tablet lebih nyaman
* desktop tetap kuat
* Pinrang Berkabar terasa profesional
* video diputar dalam aplikasi
* loading lebih modern
* UI lebih premium
* aplikasi terasa matang
* user baru tidak bingung
* user lama tetap familiar

---

# 26. TARGET AKHIR

RadioSBL harus terasa seperti:

* super app operasional media,
* digital newsroom,
* command center siaran,
* media workflow platform modern.

Pinrang Berkabar harus terasa seperti:

* kanal video berita resmi,
* mini media portal,
* dan newsroom digital modern.

---

# 27. PESAN FINAL UNTUK VS/CODEX

Jangan membuat aplikasi:

* semakin ramai,
* semakin penuh,
* semakin kompleks.

Fokus:

* clarity,
* calmness,
* hierarchy,
* operational intelligence,
* dan premium feel.

Target akhir:

```txt
A modern operational media super app
with calm, intelligent, and realtime experience.
```

```
```

---

# 28. STATUS IMPLEMENTASI CODEX

Status: tuntas untuk scope dokumen ini.

Implementasi utama:

* dashboard dibuat lebih tenang dengan 4 shortcut utama default;
* menu tambahan tetap tersedia lewat expand dan Menu Lengkap;
* `Operational Briefing` difokuskan ke 1 prioritas utama;
* prioritas pendukung dipindahkan ke disclosure `Prioritas lain`;
* detail sekunder dashboard (`Jadwal Berikutnya` dan `Podcast Unggulan`) dipindahkan ke disclosure `Detail siaran & arsip`;
* Pinrang Berkabar memiliki player YouTube embed di dalam aplikasi;
* Pinrang Berkabar memakai identitas resmi `/PinrangBerkabar.png` di hero;
* kartu video Pinrang Berkabar memilih video untuk diputar di halaman;
* daftar terkait Pinrang Berkabar memakai carousel `Video Lainnya`;
* link YouTube tetap tersedia sebagai opsi cadangan/opsi luar;
* uji tampilan dashboard calm dan Pinrang Berkabar menjaga perilaku mobile/desktop.

Verifikasi lokal sudah dilakukan untuk:

* konsistensi tipe data;
* kualitas kode;
* uji tampilan dashboard dan Pinrang Berkabar di mobile/desktop;
* build produksi.

---

# 29. HASIL EVALUASI ULANG

Evaluasi ulang terhadap dokumen ini menunjukkan:

* Dashboard calm sudah sesuai: shortcut utama dibatasi, briefing memiliki satu prioritas utama, dan detail sekunder memakai progressive disclosure.
* Pinrang Berkabar sudah sesuai: memakai identitas resmi, player in-app, carousel `Video Lainnya`, loading skeleton, empty state, dan opsi playlist resmi.
* Request Lagu sudah sesuai arah mobile: card stack, live strip, ringkasan realtime, status, waktu, dan quick action.
* Bottom navigation tetap maksimal 5 item.
* Sidebar desktop diselaraskan dengan grup dokumen: `Operasional`, `Siaran`, `Konten`, `Tim`, `Administrasi`, dan `Sistem`.
* Copy user-facing dibersihkan dari istilah demo dan konfigurasi teknis.
* Teks teknis hanya digunakan di catatan internal, bukan sebagai instruksi utama untuk pengguna umum.

Catatan sisa:

* Pengalaman tablet bisa terus dipoles di tahap berikutnya bila ada arahan khusus, tetapi layout saat ini sudah memakai grid/adaptive layout dan tidak merusak mobile/desktop.
