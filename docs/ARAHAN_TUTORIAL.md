````md id="radiosbl-tutorial-system-guide"
# RADIO SBL APP
# MASTER TUTORIAL & USER GUIDE SYSTEM
## Panduan Lengkap Pembuatan Tutorial, Help Center & Dokumentasi Visual
### Untuk VS/Codex Developer Team

---

# DAFTAR ISI

1. Pendahuluan
2. Tujuan Sistem Tutorial
3. Filosofi Tutorial RadioSBL
4. Prinsip UX Tutorial
5. Struktur Help Center
6. Struktur User Guide
7. Tutorial Berdasarkan Role
8. Tutorial Berdasarkan Fitur
9. Tutorial Visual
10. Screenshot System
11. Auto Screenshot Workflow
12. Penulisan Tutorial
13. Interactive Tutorial
14. Inline Help System
15. Onboarding User Baru
16. FAQ System
17. Troubleshooting System
18. Video Tutorial
19. Documentation UX
20. Mobile Tutorial UX
21. Desktop Documentation UX
22. Searchable Documentation
23. Pedoman Media Siber Integration
24. Pinrang Berkabar Documentation
25. Tutorial Design System
26. Performance & Optimization
27. Safe Documentation Integration
28. Final Quality Checklist
29. Final Experience Goal

---

# 1. PENDAHULUAN

Dokumen ini menjadi panduan utama untuk membangun:
- tutorial sistem,
- user guide,
- help center,
- onboarding,
- FAQ,
- troubleshooting,
- dokumentasi visual,
- dan knowledge base RadioSBL App.

Tujuan:
membuat RadioSBL memiliki:
> modern integrated documentation ecosystem.

---

# 2. TUJUAN SISTEM TUTORIAL

Sistem tutorial harus membantu:
- user baru memahami aplikasi,
- user lama menyelesaikan masalah,
- admin mengurangi pertanyaan berulang,
- reporter memahami workflow,
- penyiar memahami operasional.

---

# 3. FILOSOFI TUTORIAL RADIOSBL

Tutorial bukan:
- PDF statis,
- blog tempelan,
- halaman HTML lama,
- atau dokumentasi random.

Tutorial harus terasa seperti:
- modern help center,
- operational knowledge base,
- interactive onboarding system.

Inspirasi:
- Notion Help
- Slack Help Center
- GitBook
- Linear Docs
- Discord Onboarding

---

# 4. PRINSIP UX TUTORIAL

Tutorial harus:
- ringan,
- mudah dipahami,
- visual,
- searchable,
- mobile friendly,
- tidak melelahkan.

---

# 4.1 Prinsip Penting

Gunakan:
- langkah singkat,
- screenshot jelas,
- section pendek,
- hierarchy jelas,
- bahasa manusia.

---

# 4.2 Hindari

- paragraph terlalu panjang,
- istilah teknis berlebihan,
- screenshot random,
- tampilan seperti dokumen lama.

---

# 5. STRUKTUR HELP CENTER

Tambahkan menu:

```txt id="tutorial-menu"
Tutorial & Bantuan
````

---

# 5.1 Struktur Utama

Isi:

* Panduan Cepat
* Tutorial Penyiar
* Tutorial Admin
* Tutorial Reporter
* FAQ
* Troubleshooting
* Video Tutorial
* Pedoman Media Siber

---

# 5.2 Layout Help Center

Gunakan:

* search bar,
* kategori card,
* recent tutorial,
* popular tutorial,
* quick access.

---

# 6. STRUKTUR USER GUIDE

Gunakan struktur modular.

---

# 6.1 Panduan Cepat

Isi:

* login
* absensi
* jadwal
* request lagu
* live monitoring

---

# 6.2 Panduan Lengkap

Pisahkan per fitur.

Contoh:

* Cara Absensi
* Cara Tukar Jadwal
* Cara Membuat Naskah
* Cara Monitoring Request
* Cara Upload Liputan

---

# 7. TUTORIAL BERDASARKAN ROLE

---

# 7.1 Penyiar

Isi:

* login
* absensi
* jadwal
* request lagu
* cue siaran
* AI naskah
* live tools

---

# 7.2 Admin

Isi:

* monitoring
* approval
* user management
* laporan
* jadwal operasional

---

# 7.3 Reporter

Isi:

* upload berita
* liputan
* media upload
* workflow newsroom

---

# 7.4 Operator

Isi:

* monitoring realtime
* request management
* studio monitoring
* operational tools

---

# 8. TUTORIAL BERDASARKAN FITUR

Setiap fitur utama wajib memiliki:

* tutorial,
* screenshot,
* troubleshooting,
* FAQ kecil.

---

# 8.1 Contoh Fitur

* Absensi
* Jadwal
* Request Lagu
* Monitoring
* AI Naskah
* Podcast
* Pinrang Berkabar
* Video
* Pengaduan
* Streaming

---

# 9. TUTORIAL VISUAL

Tutorial wajib:

* visual,
* step-by-step,
* modern.

---

# 9.1 Struktur Tutorial Ideal

Setiap tutorial:

1. Judul
2. Tujuan
3. Langkah
4. Screenshot
5. Tips
6. Troubleshooting
7. FAQ kecil

---

# 9.2 Contoh Struktur

```txt id="tutorial-structure"
Cara Melakukan Absensi

1. Buka menu Absensi
2. Aktifkan lokasi
3. Tekan tombol Absen
4. Tunggu konfirmasi berhasil
```

---

# 10. SCREENSHOT SYSTEM

Gunakan screenshot berkualitas tinggi.

---

# 10.1 Screenshot Rules

Screenshot harus:

* rapi,
* konsisten,
* resolusi baik,
* tidak blur,
* tidak random crop.

---

# 10.2 Gunakan Highlight

Tambahkan:

* panah,
* highlight,
* numbering,
* focus area.

---

# 10.3 Device Frame

Opsional:
gunakan frame HP ringan untuk mobile tutorial.

---

# 11. AUTO SCREENSHOT WORKFLOW

Gunakan:

* Playwright
* Puppeteer
* Cypress

---

# 11.1 Workflow

Script otomatis:

* login
* buka halaman
* ambil screenshot
* simpan ke folder docs

---

# 11.2 Struktur Folder

```txt id="docs-folder"
/docs
  /tutorial
  /screenshots
  /faq
  /troubleshooting
```

---

# 12. PENULISAN TUTORIAL

Gunakan bahasa:

* ringan,
* profesional,
* mudah dipahami.

---

# 12.1 Hindari

* istilah teknis backend,
* error mentah,
* penjelasan terlalu panjang.

---

# 12.2 Gunakan

* langkah pendek,
* poin jelas,
* bahasa manusia.

---

# 13. INTERACTIVE TUTORIAL

Jika memungkinkan:
tambahkan tutorial interaktif.

---

# 13.1 Bentuk Interaktif

* highlight button
* guided tour
* onboarding flow
* tooltip walkthrough

---

# 13.2 Inspirasi

Gunakan style seperti:

* Notion
* Slack
* Discord
* Trello

---

# 14. INLINE HELP SYSTEM

Tambahkan:

```txt id="inline-help-icon"
?
```

di halaman penting.

---

# 14.1 Saat Ditekan

Muncul:

* quick tips,
* mini tutorial,
* bantuan cepat,
* link tutorial lengkap.

---

# 15. ONBOARDING USER BARU

Untuk user baru:

* tampilkan guided onboarding,
* highlight menu utama,
* jelaskan workflow dasar.

---

# 15.1 Onboarding Fokus

User baru harus memahami:

* dashboard
* absensi
* jadwal
* request lagu
* operasional dasar

---

# 16. FAQ SYSTEM

Tambahkan FAQ modern.

---

# 16.1 Contoh FAQ

* Kenapa absensi gagal?
* GPS tidak akurat?
* Jadwal tidak muncul?
* Video tidak tampil?
* Streaming tidak jalan?
* Cara tukar jadwal?

---

# 16.2 Layout FAQ

Gunakan:

* accordion,
* searchable,
* kategori.

---

# 17. TROUBLESHOOTING SYSTEM

Tambahkan halaman:

```txt id="troubleshooting-title"
Troubleshooting
```

---

# 17.1 Isi

* masalah umum
* penyebab
* solusi
* langkah cepat

---

# 17.2 Contoh

## GPS Tidak Akurat

Solusi:

* aktifkan lokasi presisi,
* restart browser,
* refresh aplikasi.

---

# 18. VIDEO TUTORIAL

Tambahkan:

* tutorial video,
* screen recording,
* walkthrough video.

---

# 18.1 Format

Gunakan:

* video pendek,
* fokus satu fitur,
* durasi singkat.

---

# 18.2 Penempatan

Masukkan:

* di Help Center,
* di halaman tutorial,
* dan inline help jika memungkinkan.

---

# 19. DOCUMENTATION UX

Dokumentasi wajib:

* modern,
* ringan,
* searchable,
* mobile friendly.

---

# 19.1 Jangan Terasa Seperti

* PDF lama,
* CMS berbeda,
* halaman eksternal.

Harus terasa:

> bagian natural dari RadioSBL.

---

# 19.2 Design System Wajib Konsisten

Gunakan:

* typography RadioSBL
* spacing RadioSBL
* card system RadioSBL
* icon system RadioSBL

---

# 20. MOBILE TUTORIAL UX

Tutorial mobile harus:

* nyaman dibaca,
* one-hand friendly,
* section pendek,
* tidak terlalu padat.

---

# 20.1 Gunakan

* collapsible section,
* compact card,
* image responsive.

---

# 21. DESKTOP DOCUMENTATION UX

Desktop:

* sidebar docs,
* sticky TOC,
* split layout,
* search documentation.

---

# 22. SEARCHABLE DOCUMENTATION

Tambahkan:

* pencarian tutorial,
* pencarian FAQ,
* pencarian troubleshooting.

---

# 22.1 Search Harus Bisa Mencari

* judul tutorial
* isi tutorial
* keyword masalah
* nama fitur

---

# 23. PEDOMAN MEDIA SIBER INTEGRATION

Tambahkan halaman:

```txt id="pedoman-title"
Pedoman Media Siber
```

Referensi:
[https://sbl.pinrangkab.go.id/pedoman-media-siber/](https://sbl.pinrangkab.go.id/pedoman-media-siber/)

---

# 23.1 UX Pedoman

Gunakan:

* sticky TOC
* accordion
* reading progress
* typography nyaman

---

# 24. PINRANG BERKABAR DOCUMENTATION

Gunakan:
`/PinrangBerkabar.png`

sebagai identitas newsroom section.

---

# 24.1 Tambahkan Tutorial

* upload video
* workflow newsroom
* media guideline
* etika media
* video management

---

# 25. TUTORIAL DESIGN SYSTEM

Semua tutorial wajib:

* clean,
* tenang,
* modern,
* premium.

---

# 25.1 Gunakan

* subtle shadow
* soft border
* readable typography
* spacing lega

---

# 25.2 Hindari

* warna berlebihan
* animasi ramai
* layout padat

---

# 26. PERFORMANCE & OPTIMIZATION

Tutorial system harus ringan.

---

# 26.1 Gunakan

* lazy image
* compressed screenshot
* lazy video embed

---

# 26.2 Hindari

* load semua iframe sekaligus
* image full size tanpa optimization

---

# 27. SAFE DOCUMENTATION INTEGRATION

Tutorial & docs:

* tidak boleh mengganggu workflow operasional,
* tidak boleh memperberat dashboard,
* harus modular.

---

# 27.1 Gunakan Lazy Route

Tutorial dimuat:

* saat dibutuhkan,
* bukan preload semua.

---

# 28. FINAL QUALITY CHECKLIST

Tahap dianggap berhasil jika:

* tutorial searchable
* screenshot konsisten
* mobile nyaman dibaca
* desktop terasa profesional
* onboarding tersedia
* FAQ tersedia
* troubleshooting tersedia
* inline help tersedia
* dokumentasi menyatu dengan RadioSBL
* Pinrang Berkabar terasa seperti newsroom modern
* UI tutorial premium
* sistem tetap ringan
* workflow existing tetap aman

---

# 29. FINAL EXPERIENCE GOAL

RadioSBL harus memiliki:

* integrated help center,
* intelligent onboarding,
* searchable documentation,
* visual tutorial system,
* dan newsroom knowledge base modern.

Target akhir:

```txt id="tutorial-final-goal"
A modern operational media platform
with integrated help center,
interactive tutorials,
and intelligent documentation ecosystem.
```

```
```
