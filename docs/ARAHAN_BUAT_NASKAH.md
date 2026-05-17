# Arahan Pengembangan Halaman “Buat Naskah” — RadioSBL
## Smart Broadcast Script Studio (Responsive Desktop-First Experience)

# Tujuan Pengembangan

Halaman “Buat Naskah” saat ini sudah memiliki fondasi yang baik:
- AI Generator
- Integrasi jadwal siaran
- Tone/gaya siaran
- Penyimpanan draft
- Integrasi Gemini AI

Namun fitur saat ini masih berada di level:
```text
AI Draft Generator
```

Target pengembangan berikutnya adalah mengubah halaman ini menjadi:

```text
Smart Broadcast Script Studio
```

yang berfungsi sebagai:
- pusat produksi naskah radio,
- studio editor siaran,
- AI-assisted script workspace,
- teleprompter broadcast,
- dan arsip produksi konten RadioSBL.

---

# Konsep Pengembangan

## Ubah dari:
```text
Textarea AI sederhana
```

## Menjadi:
```text
Interactive Broadcast Script Workspace
```

---

# Struktur Halaman Baru

Gunakan struktur tab agar scalable.

```text
[Generator AI]
[Draft Saya]
[Review]
[Siap Siaran]
[Live Script]
[Template]
[Arsip]
```

---

# Responsive Strategy

# MOBILE
Versi mobile harus:
- ringan,
- cepat,
- fokus pada editing dasar,
- dan cocok untuk penyiar lapangan.

# DESKTOP
Versi desktop menjadi:
```text
Full Broadcast Production Studio
```

dengan fitur lengkap.

---

# Fitur yang WAJIB di Desktop

## Desktop Exclusive Features

Karena terlalu kompleks untuk mobile:

```text
Realtime collaboration
Multi panel editor
Version history
Script analytics
Dual preview mode
Teleprompter advanced
Drag & drop segment
AI multi-tools
Split editor layout
Activity timeline
```

---

# MOBILE EXPERIENCE

# Fokus Mobile

Mobile digunakan untuk:
- quick editing
- generate cepat
- review naskah
- teleprompter sederhana
- save draft
- ON AIR quick mode

---

# MOBILE TIDAK PERLU MENAMPILKAN

```text
Realtime collaboration detail
Version compare
Complex analytics
Large activity logs
Dual editor layout
Advanced AI toolbox
Multi-column layout
Heavy broadcast dashboard
```

---

# DESKTOP LAYOUT IDEAL

Gunakan layout 3 panel.

---

# Panel Kiri — Script Navigation

Isi:
```text
Daftar draft
Kategori naskah
Template
Status naskah
Search
Filter
```

---

# Panel Tengah — Main Editor

Isi:
```text
Editor utama
AI generation
Formatting tools
Cue markers
Timestamp
```

---

# Panel Kanan — Smart Assistant

Isi:
```text
AI tools
Script analytics
Duration estimate
Rewrite tools
Program info
Announcer info
Broadcast notes
```

---

# 1. TAB GENERATOR AI

## Fitur Saat Ini Yang Dipertahankan

```text
Pilih program siaran
Pilih tone
Pilih durasi
Instruksi tambahan
Generate AI
```

---

# Tambahan Baru

## Template Type

Tambahkan kategori:

```text
Opening
Podcast
Berita
Breaking News
Iklan
Promo
Live Report
Closing
Voice Over
```

---

# AI Rewrite Tools

Tambahkan tombol:

```text
Buat lebih formal
Buat lebih santai
Buat lebih singkat
Buat lebih energik
Buat gaya anak muda
Buat lebih profesional
```

---

# AI Summary

AI bisa:
```text
Meringkas script
Mengubah menjadi rundown
Mengubah menjadi cue point
```

---

# Auto Duration Estimate

Tambahkan:
```text
Estimasi baca:
3 menit 42 detik
```

---

# Smart Metadata

Tampilkan:
```text
Jumlah kata
Estimasi durasi
Tone
Kategori
Program
Penyiar
```

---

# 2. SMART SCRIPT EDITOR

Gunakan editor modern.

---

# Wajib Mendukung

```text
Bold
Italic
Heading
Highlight
Bullet
Timestamp
Cue Marker
Segment Divider
```

---

# Auto Save

Auto save setiap beberapa detik.

Tampilkan:
```text
Draft tersimpan otomatis
```

---

# Cue Marker

Contoh:
```text
[CUE LAGU]
[CUE IKLAN]
[CUE NEWS]
[CLOSING]
```

---

# Segment Divider

Contoh:
```text
=== OPENING ===
=== BERITA ===
=== INTERAKSI ===
=== CLOSING ===
```

---

# 3. TELEPROMPTER MODE

Ini fitur paling penting untuk RadioSBL.

---

# Saat klik “Mode Siaran”

Editor berubah menjadi:
```text
Broadcast Teleprompter
```

---

# Fitur Teleprompter

```text
Font besar
Dark mode
Auto scroll
Speed control
Current line highlight
Next cue preview
Fullscreen
```

---

# Mobile Teleprompter

Mobile cukup:
```text
Fullscreen
Scroll sederhana
Large font
Dark mode
```

---

# Desktop Teleprompter Advanced

Desktop bisa:
```text
Dual monitor support
Cue sidebar
Timer
Segment indicator
Live broadcast notes
```

---

# 4. DRAFT MANAGEMENT

Tambahkan tab:

```text
Draft Saya
Review
Ready
Archived
```

---

# Status Script

```text
Draft
Review
Approved
Ready To Broadcast
Live
Archived
```

---

# Workflow

```text
Draft
→ Review
→ Approved
→ Ready
→ ON AIR
→ Archive
```

---

# 5. REVIEW & APPROVAL SYSTEM

Tambahkan approval workflow.

---

# Reviewer Bisa

```text
Comment
Approve
Reject
Request revision
```

---

# Inline Comment

Contoh:
```text
Bagian opening terlalu panjang.
```

---

# 6. VERSION HISTORY

Desktop only.

---

# Fitur

```text
Riwayat revisi
Rollback versi
Compare changes
Siapa yang edit
Kapan edit
```

---

# 7. REALTIME COLLABORATION

Desktop priority.

---

# Fitur

```text
Multi editor
Live cursor
Realtime update
Editor presence
```

---

# Contoh

```text
Chendra sedang mengetik...
```

---

# 8. SCRIPT ANALYTICS

Desktop only.

---

# Analitik

```text
Jumlah kata
Estimasi durasi
Tone analysis
Readability
Keyword frequency
Segment balance
```

---

# AI Insight

Contoh:
```text
Opening terlalu panjang.
Script terlalu formal untuk target anak muda.
```

---

# 9. MEDIA ATTACHMENT

Script bisa attach:
```text
Audio
Backsound
Sponsor audio
Cue music
Gambar
Dokumen
```

---

# 10. PROGRAM INTEGRATION

Script harus otomatis terhubung dengan:
- jadwal siaran
- penyiar
- program radio
- event
- live OB

---

# Contoh Metadata

```text
Program:
Podcast SBL

Penyiar:
Chendra

Jadwal:
08:00 - 10:00
```

---

# 11. SEARCH & FILTER

Search berdasarkan:
```text
Judul
Program
Penyiar
Kategori
Isi script
```

---

# Filter

```text
Draft
Approved
Live
Archived
Podcast
Berita
Promo
```

---

# 12. EXPORT

Support:
```text
PDF
DOCX
TXT
Print Mode
```

---

# 13. AI SAFETY

Pastikan AI:
```text
Tidak mengarang berita palsu
Tidak mengulang metadata
Tidak membuat intro AI generic
Tidak keluar konteks RadioSBL
```

---

# Gunakan Existing Prompt System

Pertahankan struktur prompt:
```text
Opening
Bridge
Cue
Closing
```

karena sudah cukup bagus.

---

# 14. MOBILE UI RECOMMENDATION

# Mobile Layout

Gunakan:
```text
Single column
Bottom actions
Quick generate
Quick edit
Quick teleprompter
```

---

# Mobile Fokus

```text
Generate cepat
Edit cepat
ON AIR mode
```

---

# 15. DESKTOP UI RECOMMENDATION

# Desktop Layout

Gunakan:
```text
3-column workspace
Resizable panel
Multi-panel editor
Sidebar navigation
```

---

# Desktop Experience

Desktop harus terasa seperti:
```text
Broadcast production software
```

bukan textarea biasa.

---

# 16. PRIORITAS IMPLEMENTASI

# PRIORITAS 1 (WAJIB)

```text
Draft tabs
Status workflow
Modern editor
Auto save
Teleprompter mode
Template category
Search & filter
```

---

# PRIORITAS 2

```text
AI rewrite tools
Review & approval
Export
Analytics
Media attachment
```

---

# PRIORITAS 3

```text
Realtime collaboration
Version history
Advanced teleprompter
AI insight
Dual screen mode
```

---

# TARGET AKHIR

Halaman “Buat Naskah” RadioSBL harus berkembang menjadi:

```text
Smart Broadcast Script Studio
```

yang:
- membantu penyiar,
- mempercepat produksi konten,
- mempermudah siaran,
- mendukung live broadcast,
- mendukung podcast,
- dan menjadi pusat produksi naskah modern RadioSBL.

Bukan sekadar:
```text
AI textarea generator
```

tetapi:
```text
Broadcast Content Production Platform
```