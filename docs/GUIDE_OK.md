````md id="radiosbl-master-uix-guide"
# RADIO SBL APP
# MASTER UI/UX, DASHBOARD, DOCUMENTATION & ECOSYSTEM GUIDE
## Operational Media Super App Refinement
### Untuk VS/Codex Developer Team

---

# DAFTAR ISI

1. Pendahuluan
2. Filosofi Besar RadioSBL
3. Prinsip Refactor Aman (Non-Destructive)
4. Evaluasi Kondisi UI/UX Saat Ini
5. Target Experience
6. Super App Dashboard
7. Mobile-First UX
8. Tablet & Desktop UX
9. Navigation System
10. Typography System
11. Visual Calmness
12. Card System
13. Operational UX
14. Request Lagu Experience
15. Pinrang Berkabar Experience
16. YouTube Video Integration
17. Embedded Video Experience
18. Tutorial & Help Center
19. Pedoman Media Siber
20. Documentation System
21. Screenshot & Tutorial Automation
22. Onboarding & Inline Help
23. Empty State & Error UX
24. Loading Experience
25. Performance UX
26. Accessibility
27. Design Governance
28. Feature Flag & Safe Deployment
29. Final Quality Checklist
30. Final Experience Goal

---

# 1. PENDAHULUAN

Dokumen ini menjadi panduan utama pengembangan:
- UI/UX refinement,
- dashboard modernization,
- documentation system,
- tutorial experience,
- help center,
- Pinrang Berkabar,
- newsroom video,
- dan seluruh ecosystem experience RadioSBL App.

Tujuan utama:
RadioSBL harus berkembang menjadi:

> Operational Media Super App

yang:
- modern,
- realtime,
- profesional,
- mobile-first,
- ringan,
- dan nyaman digunakan jangka panjang.

---

# 2. FILOSOFI BESAR RADIOSBL

RadioSBL bukan:
- admin panel biasa,
- dashboard template,
- atau website radio lama.

RadioSBL harus terasa seperti:
- command center siaran,
- digital newsroom,
- media workflow platform,
- operational super app.

---

# 3. PRINSIP REFACTOR AMAN (NON-DESTRUCTIVE)

## PRIORITAS PALING TINGGI

Semua proses:
- redesign,
- refactor UI/UX,
- dashboard refinement,
- tutorial,
- help center,
- Pinrang Berkabar,
- video integration,
- dan fitur tambahan lainnya

WAJIB dilakukan:

> TANPA MERUSAK EKOSISTEM DATA YANG SUDAH BERJALAN.

---

# 3.1 HAL YANG TIDAK BOLEH DIRUSAK

WAJIB menjaga:
- Firebase structure
- collection existing
- auth existing
- role existing
- request existing
- absensi existing
- jadwal existing
- AI naskah existing
- podcast existing
- operational workflow existing
- realtime listener existing

---

# 3.2 FILOSOFI IMPLEMENTASI

Ini bukan:
- rebuild total,
- rewrite total,
- migrasi besar,
- penggantian core backend.

Ini adalah:

> EXPERIENCE REFINEMENT LAYER

Yang berubah:
- visual layer,
- navigation layer,
- interaction layer,
- hierarchy layer,
- presentation layer.

Bukan:
- business logic inti.

---

# 3.3 STRATEGI REFACTOR

Gunakan prinsip:

```txt id="enhance-not-replace"
Enhance, not replace.
````

---

# 3.4 DILARANG

* mengganti struktur Firebase sembarangan
* menghapus field lama
* mengubah auth flow inti
* mengubah workflow existing tanpa migration plan
* rewrite seluruh sistem sekaligus

---

# 3.5 SAFE IMPLEMENTATION

Gunakan:

* wrapper UI approach
* component refactor
* modular enhancement
* feature flag
* staged rollout

---

# 3.6 FEATURE FLAG RECOMMENDATION

Gunakan:

```txt id="feature-flag"
enableNewDashboard
enablePinrangBerkabar
enableTutorialSystem
enableNewHelpCenter
```

Agar:

* aman testing,
* mudah rollback,
* tidak langsung mengganggu semua user.

---

# 4. EVALUASI KONDISI UI/UX SAAT INI

Masalah utama saat ini:

* dashboard terlalu panjang,
* terlalu banyak card besar,
* hierarchy visual belum matang,
* terlalu banyak warna aktif,
* typography terlalu besar,
* terlalu banyak shortcut,
* semua fitur terasa sama penting,
* mobile terlalu padat,
* dashboard terasa seperti launcher menu.

Akibatnya:

* cognitive load tinggi,
* user cepat lelah,
* sulit fokus,
* dan experience terasa berat.

---

# 5. TARGET EXPERIENCE

RadioSBL harus terasa:

* ringan,
* cepat,
* realtime,
* tenang,
* modern,
* profesional.

Target akhir:

```txt id="experience-goal"
Powerful but effortless.
Complex system with simple experience.
```

---

# 6. SUPER APP DASHBOARD

---

# 6.1 Filosofi Dashboard

Dashboard bukan:

* tempat semua fitur,
* launcher menu,
* kumpulan statistik.

Dashboard harus menjawab:

```txt id="dashboard-question"
Apa yang perlu saya lakukan sekarang?
```

---

# 6.2 Struktur Dashboard Mobile

Urutan:

1. Greeting
2. Status hari ini
3. Featured live card
4. Priority section
5. Quick action
6. Activity timeline
7. Content carousel

---

# 6.3 Hero Header

Header harus:

* clean,
* ringan,
* premium,
* tidak terlalu tinggi.

Isi:

* greeting,
* avatar,
* status hari ini,
* notif icon.

Contoh:

```txt id="hero-example"
Selamat Siang, Fajar Bakri
Siaran Anda dimulai pukul 13:00
```

---

# 6.4 Featured Live Card

Gunakan satu featured card utama.

Isi:

* program berjalan,
* penyiar,
* studio,
* jam,
* tombol live/play.

Gunakan:

* gradient ringan,
* visual premium,
* hierarchy kuat.

---

# 6.5 Priority Section

Section:
“Yang Perlu Diprioritaskan”

Harus:

* compact,
* mudah discan,
* tidak terlalu tinggi.

Gunakan:

* compact operational row,
* quick action kecil,
* metadata ringan.

---

# 6.6 Quick Action

Gunakan:

* compact icon grid,
* maksimal 4–6 action utama.

Action utama:

* Absen
* Jadwal
* Request
* Naskah
* Monitoring
* Live

Sisanya:
masuk Menu Lengkap.

---

# 6.7 Activity Timeline

Aktivitas terbaru:

* realtime,
* clean,
* subtle.

Gunakan:

* compact timeline,
* timestamp kecil,
* divider tipis.

---

# 7. MOBILE-FIRST UX

Target utama:
Android portrait.

---

# 7.1 Prinsip Mobile UX

UI harus:

* one-hand friendly,
* cepat discan,
* minim tap,
* minim noise.

---

# 7.2 Bottom Navigation

Maksimal:
5 item.

Rekomendasi:

1. Beranda
2. Jadwal
3. Absensi
4. Request
5. Menu

---

# 7.3 Menu Lengkap

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

# 8. TABLET & DESKTOP UX

---

# 8.1 Tablet UX

Tablet bukan:

* HP diperbesar,
* desktop diperkecil.

Gunakan:

* split layout,
* dual panel,
* adaptive grid.

---

# 8.2 Desktop UX

Desktop fokus:

* monitoring,
* administrasi,
* multitasking.

Gunakan:

* sidebar,
* multi-column,
* monitoring layout.

---

# 9. NAVIGATION SYSTEM

Navigasi harus:

* sederhana,
* konsisten,
* mudah dipahami.

---

# 9.1 Sidebar Desktop

Kelompokkan:

* Operasional
* Siaran
* Konten
* Tim
* Administrasi
* Sistem
* Bantuan & Informasi

---

# 10. TYPOGRAPHY SYSTEM

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

* shadow berat,
* glowing effect.

---

# 11.3 Badge

Badge hanya untuk:

* live,
* pending,
* urgent,
* status penting.

---

# 12. CARD SYSTEM

Semua card wajib:

* radius konsisten,
* spacing konsisten,
* hierarchy konsisten.

---

# 12.1 Featured Card

Gunakan hanya untuk:

* live,
* featured video,
* alert utama.

---

# 12.2 Compact Card

Gunakan compact card untuk:

* aktivitas,
* monitoring,
* quick action,
* operational list.

---

# 13. OPERATIONAL UX

Fokus:

* clarity,
* speed,
* calmness,
* operational intelligence.

---

# 13.1 One Screen One Focus

Setiap layar:

* hanya punya satu fokus utama.

---

# 13.2 Kurangi Distraksi

Saat on-air:

* tampilkan hanya informasi penting.

---

# 14. REQUEST LAGU EXPERIENCE

Request lagu harus terasa:

* realtime,
* hidup,
* operasional.

---

# 14.1 Compact Realtime Card

Isi:

* nama,
* lagu,
* pesan,
* waktu,
* quick action.

---

# 14.2 Hindari Tabel Mobile

Gunakan:

* card stack,
* swipe action,
* compact interaction.

---

# 15. PINRANG BERKABAR EXPERIENCE

Gunakan:
`/PinrangBerkabar.png`

sebagai identitas resmi.

---

# 15.1 Pinrang Berkabar Harus Terasa Seperti

* mini newsroom,
* kanal berita video,
* media portal modern,
* bagian premium RadioSBL.

---

# 15.2 Hero Section

Isi:

* logo Pinrang Berkabar,
* subtitle,
* featured video,
* tombol YouTube.

Contoh:

```txt id="pinrang-example"
Pinrang Berkabar
Video berita dan informasi terbaru dari Radio SBL.
```

---

# 15.3 Featured Video

Video terbaru tampil dominan.

Isi:

* thumbnail besar,
* judul,
* tanggal,
* badge terbaru,
* tombol tonton.

---

# 15.4 Video Grid

Gunakan:

* mobile: 1 kolom
* tablet: 2 kolom
* desktop: 3 kolom

---

# 16. YOUTUBE VIDEO INTEGRATION

Playlist sumber:

`PLFv9iRIehC6xWCtxh_tJRbGiVJN5Hb61V`

---

# 16.1 API SECURITY

Jangan hardcode API key di frontend.

Gunakan:

* Firebase Functions,
* backend proxy,
* environment variable aman.

---

# 16.2 Data yang Diambil

Gunakan:

* playlistItems
* videos endpoint

Ambil:

* title
* thumbnail
* publishedAt
* description
* duration
* statistics jika perlu.

---

# 17. EMBEDDED VIDEO EXPERIENCE

Video harus diputar:

* di dalam aplikasi,
* menggunakan embedded player responsive.

Jangan memaksa user keluar aplikasi.

---

# 17.1 Embedded Player

Gunakan:

* responsive iframe,
* lazy load,
* 16:9 ratio.

---

# 17.2 Related Video

Tambahkan:

```txt id="related-video"
Video Lainnya
```

Gunakan:

* carousel,
* compact video card.

---

# 18. TUTORIAL & HELP CENTER

Tambahkan menu:

## Tutorial

Isi:

* Panduan Cepat
* Tutorial Penyiar
* Tutorial Admin
* Tutorial Reporter
* FAQ
* Troubleshooting
* Video Tutorial

---

## Tentang RadioSBL

Isi:

* Tentang
* Versi
* Changelog
* Kebijakan Privasi
* Pedoman Media Siber

---

# 19. PEDOMAN MEDIA SIBER

Tambahkan halaman:

```txt id="pedoman-media"
Pedoman Media Siber
```

Referensi:
[https://sbl.pinrangkab.go.id/pedoman-media-siber/](https://sbl.pinrangkab.go.id/pedoman-media-siber/)

---

# 19.1 UX Pedoman

Gunakan:

* sticky TOC,
* typography nyaman,
* accordion section,
* reading progress,
* section highlight.

---

# 20. DOCUMENTATION SYSTEM

Dokumentasi harus:

* modern,
* searchable,
* visual,
* mobile friendly.

---

# 20.1 Dokumentasi Tidak Boleh Terasa Seperti

* PDF tempelan,
* blog lama,
* CMS berbeda.

Harus terasa:

> bagian natural dari RadioSBL.

---

# 20.2 Struktur Dokumentasi

```txt id="docs-structure"
/docs
  /tutorial
  /faq
  /troubleshooting
  /pedoman-media-siber
  /screenshots
```

---

# 21. SCREENSHOT & TUTORIAL AUTOMATION

Gunakan:

* Playwright,
* Puppeteer,
* Cypress screenshot.

---

# 21.1 Auto Screenshot

Script:

* login,
* buka halaman,
* screenshot,
* simpan otomatis.

---

# 21.2 Screenshot Rules

Screenshot harus:

* rapi,
* konsisten,
* berkualitas tinggi,
* tidak random crop.

---

# 22. ONBOARDING & INLINE HELP

Tambahkan:

* onboarding user baru,
* inline help,
* walkthrough ringan.

---

# 22.1 Inline Help

Gunakan icon:

```txt id="inline-help"
?
```

Saat ditekan:

* tutorial singkat,
* tips,
* bantuan cepat.

---

# 23. EMPTY STATE & ERROR UX

Gunakan bahasa manusia.

---

# 23.1 Empty State

```txt id="empty-state"
Belum ada data terbaru.
```

---

# 23.2 Error State

```txt id="error-state"
Data belum dapat dimuat.
Coba beberapa saat lagi.
```

---

# 24. LOADING EXPERIENCE

Gunakan:

* skeleton,
* shimmer ringan,
* progressive loading.

Jangan:

* spinner fullscreen besar.

---

# 25. PERFORMANCE UX

Aplikasi harus terasa cepat.

---

# 25.1 Lazy Loading

Gunakan lazy loading untuk:

* gambar,
* video,
* iframe,
* carousel.

---

# 25.2 Render Prioritas

Render:

* visible content terlebih dahulu.

---

# 26. ACCESSIBILITY

Pastikan:

* readable outdoor,
* touch target aman,
* contrast cukup,
* icon jelas.

---

# 27. DESIGN GOVERNANCE

Semua halaman wajib mengikuti:

* typography system,
* spacing system,
* card system,
* icon system,
* motion system,
* color system.

Tidak boleh:

* style random,
* ukuran random,
* layout random.

---

# 28. SAFE DEPLOYMENT STRATEGY

Deploy dilakukan:

* modular,
* bertahap,
* incremental.

Jangan:

* redesign besar sekaligus.

---

# 28.1 Testing WAJIB

Test:

* Android
* tablet
* desktop
* Chrome
* Samsung Internet
* Edge

---

# 28.2 Operational Testing

Pastikan:

* absensi tetap jalan
* jadwal tetap sinkron
* request realtime tetap cepat
* monitoring tetap realtime
* AI naskah tetap aman
* auth tetap stabil

---

# 29. FINAL QUALITY CHECKLIST

Tahap dianggap berhasil jika:

* dashboard lebih fokus
* hierarchy jelas
* typography nyaman
* warna lebih tenang
* mobile lebih ringan
* tablet lebih nyaman
* desktop tetap kuat
* Pinrang Berkabar terasa profesional
* video diputar dalam aplikasi
* dokumentasi terasa modern
* tutorial searchable
* Pedoman Media Siber tersedia
* loading modern
* aplikasi terasa premium
* user baru tidak bingung
* user lama tetap familiar
* workflow existing tetap aman
* data existing tetap aman

---

# 30. FINAL EXPERIENCE GOAL

RadioSBL harus terasa seperti:

* operational media super app,
* digital newsroom,
* media workflow platform,
* command center siaran modern.

Dengan:

* UI konsisten,
* UX tenang,
* dokumentasi modern,
* operational intelligence,
* premium experience,
* dan ecosystem yang stabil tanpa merusak fondasi existing.

```
```
