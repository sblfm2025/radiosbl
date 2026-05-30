# Audit Komponen Analytics — RADIO-SBL

> Dibuat pada 2026-05-31 oleh Claude Agent (`claude-opus-4-8`)
> Basis kode: commit 4eccba5 (`feat: implement listener analytics MVP`)

---

## 1. Tujuan

Dokumen ini mengaudit lima komponen analytics (`ActiveSessionsCard`, `ListenerMetricsCard`, `TopContentCard`, `RealTimeListenersCard`, `ListenerMapCard`) yang dihapus (status `D` pada git) pada branch `feature/listener-analytics-mvp`.

Tujuan audit: menilai kualitas kode, menemukan potensi bug, mengidentifikasi inkonsistensi UX/visual, dan menentukan apakah komponen ini siap di-restore atau memerlukan perbaikan sebelum di-merge ke `main`.

---

## 2. Daftar Komponen yang Diaudit

| # | Komponen | File Path (di commit 4eccba5) | Fungsi Utama |
|---|----------|-------------------------------|--------------|
| 1 | `ActiveSessionsCard` | `src/features/analytics/components/ActiveSessionsCard.tsx` | Menampilkan tabel sesi pendengar aktif (perangkat, program, mulai, durasi) |
| 2 | `ListenerMetricsCard` | `src/features/analytics/components/ListenerMetricsCard.tsx` | Grid 2×2 statistik: total pendengar unik, puncak, rata-rata durasi, total waktu dengar |
| 3 | `TopContentCard` | `src/features/analytics/components/TopContentCard.tsx` | Daftar konten terpopuler dengan ranking dan waktu dengar |
| 4 | `RealTimeListenersCard` | `src/features/analytics/components/RealTimeListenersCard.tsx` | Monitoring real-time: pendengar aktif (SVG ring), tren, puncak, status Icecast |
| 5 | `ListenerMapCard` | `src/features/analytics/components/ListenerMapCard.tsx` | Sebaran wilayah pendengar berdasarkan IP geolocation (kota/provinsi/negara) |

---

## 3. Temuan Per Komponen

### 3.1 ActiveSessionsCard

**Kualitas Keseluruhan: Cukup Baik**

| Aspek | Penilaian | Catatan |
|-------|-----------|---------|
| Struktur kode | Bersih, fungsional | Props interface jelas, hooks terpisah |
| Penanganan state | Benar | Loading, error, empty state tertangani |
| Aksesibilitas | Kurang | `<table>` tanpa `aria-label`, tidak ada `scope` pada `<th>` |
| Potensi bug | **Minor** | `formatDuration(0)` mengembalikan `"0s"` — konsisten, tapi `formatDuration(undefined)` akan crash karena `Math.floor(undefined / 60)` = `NaN` |

**Masalah:**

1. **`formatDuration` tidak defensive terhadap `undefined`.** Jika `session.duration` bernilai `undefined` atau `null`, `Math.floor(undefined / 60)` menghasilkan `NaN`. Output: `"NaNm NaNs"`.

2. **Hover handler langsung mutasi `style`.** Pola `onMouseOver`/`onMouseOut` yang mengubah `e.currentTarget.style.transform` langsung tidak scalable dan susah di-maintain. Sebaiknya gunakan CSS class atau state.

3. **`onClick={refresh}` pada root card.** Ini berarti klik di mana saja pada card (termasuk area tabel) akan trigger refresh. Mungkin bukan UX yang diinginkan — user mungkin ingin mem-select teks dalam tabel.

---

### 3.2 ListenerMetricsCard

**Kualitas Keseluruhan: Baik**

| Aspek | Penilaian | Catatan |
|-------|-----------|---------|
| Struktur kode | Bersih, prop-driven | `colorScheme` prop diterima tapi **tidak digunakan** |
| Penanganan state | Benar | Semua state tertangani |
| Format angka | Benar | `formatNumber` handle K/M suffix |
| Warna hardcode | **Inkonsistensi** | `var(--blue)`, `var(--yellow)`, `var(--green)`, `"purple"` campur aduk |

**Masalah:**

1. **Prop `colorScheme` tidak digunakan.** Diterima di interface dan destructuring, tapi tidak pernah direferensikan di JSX. Dead prop.

2. **Warna `"purple"` hardcode tanpa CSS variable.** Stat ke-4 menggunakan `color: "purple"` langsung, sementara stat lain memakai CSS variables (`var(--blue)`, `var(--yellow)`, `var(--green)`). Inkonsisten.

3. **`formatDuration(0)` mengembalikan `"0m"`.** Ini benar, tapi jika `metrics.totalDuration` bernilai `0` secara realistis, tampilan `"0m"` mungkin membingungkan. Pertimbangkan menampilkan `"-"` untuk nol.

---

### 3.3 TopContentCard

**Kualitas Keseluruhan: Cukup Baik**

| Aspek | Penilaian | Catatan |
|-------|-----------|---------|
| Struktur kode | Bersih | Konversi time range jelas |
| Prop `showListeningTime` | Benar | Feature toggle yang berguna |
| Prop `colorScheme` | **Tidak digunakan** | Sama seperti di ListenerMetricsCard |
| Ranking visual | Menarik | Rank 1/2/3 punya warna berbeda |

**Masalah:**

1. **Prop `colorScheme` tidak digunakan.** Sama seperti di `ListenerMetricsCard` — diterima tapi tidak diterapkan.

2. **Konversi `MetricsTimeRange` ke `TopContentTimeRange` fragile.** Fungsi `getTopContentTimeRange` hanya meng-cover 3 enum value. Jika enum bertambah, konversi ini diam-diam fallback ke `TODAY` tanpa warning.

3. **Hover handler pada bar item.** Sama seperti komponen lain — inline style mutation. Selain itu, efek hover "background: var(--soft)" pada bar sangat halus dan mungkin tidak terlihat di beberapa monitor.

---

### 3.4 RealTimeListenersCard

**Kualitas Keseluruhan: Baik, dengan Perhatian**

| Aspek | Penilaian | Catatan |
|-------|-----------|---------|
| Visual design | Menarik | SVG ring chart, grid layout |
| Integrasi Icecast | Benar | `useGlobalAudio()` untuk metadata Icecast |
| Koneksi state | Benar | `isConnected`, error, reconnect |
| Waktu relatif | Benar | `formatLastUpdate` relative time |

**Masalah:**

1. **SVG circle strokeDasharray di-hardcode ke `238`.** Nilai `238` ≈ `2 * π * 38` (circumference dari r=38). Ini benar secara matematis, tapi sebaiknya dihitung secara dinamis agar tidak magic number.

2. **Pembagi `peakListeners || 1` berisiko division by zero.** Sudah ditangani dengan `|| 1`, tapi jika `peakListeners` = `0` dan `currentListeners` > 0, bar akan terisi penuh (100%), yang mungkin misleading.

3. **`refreshInterval` default 30 detik.** Untuk "real-time", 30 detik cukup lambat. Pertimbangkan 10 detik atau menggunakan WebSocket/Firestore real-time listener.

4. **`metadata.listeners` dan `metadata.isOnline` dari `useGlobalAudio()`.** Ada potensi konflik data antara analytics service dan Icecast metadata. Jika keduanya menampilkan jumlah pendengar yang berbeda, user akan bingung. Perlu disatukan atau diberi label jelas.

5. **Prop `colorScheme` tidak digunakan.** Sama seperti komponen lain.

---

### 3.5 ListenerMapCard

**Kualitas Keseluruhan: Baik, Komponen Paling Kompleks**

| Aspek | Penilaian | Catatan |
|-------|-----------|---------|
| Fitur tab view | Menarik | 3 mode: kota, provinsi, negara |
| Bar chart visual | Efektif | Normalisasi bar width, rank badge |
| Shimmer loading | Profesional | Skeleton loader yang smooth |
| Data fetching | Perlu perhatian | Manual fetch tanpa abort controller modern |

**Masalah:**

1. **`useEffect` cleanup menggunakan flag `cancelled`, bukan `AbortController`.** Pola `cancelled = true` adalah legacy. Untuk `fetch` API modern, `AbortController` lebih tepat karena bisa membatalkan request jaringan secara nyata, bukan hanya mengabaikan response.

2. **Error di-catch dan di-silent.** `.catch(() => { if (!cancelled) setLoading(false); })` — error ditelan tanpa ditampilkan ke user. Sebaiknya ada error state.

3. **Fungsi `getMaxCount` di-render body.** Didefinisikan di dalam komponen, jadi akan di-recreate setiap render. Untuk performa, sebaiknya di-wrap dengan `useMemo` atau dipindahkan keluar.

4. **`getFlagEmoji` import dari geolocation service.** Jika `countryCode` undefined/null, fungsi ini mungkin crash atau mengembalikan string kosong. Perlu defensive check.

5. **CSS `@keyframes shimmer` di-embed via `<style>` tag.** Ini akan menambahkan `<style>` ke DOM setiap kali komponen mount. Jika komponen mount/unmount berkali-kali, akan ada duplikasi. Sebaiknya pindahkan ke CSS file global atau gunakan CSS-in-JS yang lebih baik.

6. **Props `maxCities` digunakan untuk semua mode (kota, provinsi, negara).** Nama prop misleading — sebaiknya `maxItems` atau `maxRows`.

---

## 4. Masalah Lintas Komponen (Cross-Cutting)

### 4.1 Pola Hover yang Tidak Maintainable

Semua komponen kecuali `ListenerMapCard` menggunakan pola ini:

```tsx
onMouseOver={(e) => {
  e.currentTarget.style.transform = "translateY(-2px)";
  e.currentTarget.style.boxShadow = "...";
}}
onMouseOut={(e) => {
  e.currentTarget.style.transform = "translateY(0)";
  e.currentTarget.style.boxShadow = "...";
}}
```

**Rekomendasi:** Buat utility CSS class `.ui-card-hover` atau gunakan `:hover` pseudo-class di stylesheet. Inline style mutation tidak idiomatic React.

### 4.2 Prop `colorScheme` Dead di Mana-Mana

`ListenerMetricsCard`, `TopContentCard`, dan `RealTimeListenersCard` menerima `colorScheme` tapi tidak menggunakannya. Hapus atau implementasikan.

### 4.3 Format Bahasa Campuran

- UI text dalam Bahasa Indonesia (benar, karena target user radio Indonesia)
- Komentar kode dalam Bahasa Inggris
- Console log dan error message kemungkinan campuran

**Rekomendasi:** Konsisten — UI text selalu Bahasa Indonesia, kode dan komentar selalu Bahasa Inggris.

### 4.4 `formatDuration` Duplikasi

`ActiveSessionsCard`, `ListenerMetricsCard`, dan `TopContentCard` masing-masing mendefinisikan `formatDuration` sendiri dengan logika sedikit berbeda:

| Komponen | `formatDuration(0)` | Format menit | Format jam |
|----------|---------------------|--------------|------------|
| ActiveSessionsCard | `"0s"` | `Xm Xs` | Tidak handle jam |
| ListenerMetricsCard | `"0m"` | `Xm` | `Xj Xm` |
| TopContentCard | `"0m"` | `Xm` | `Xj Xm` |

**Rekomendasi:** Ekstrak ke utility function bersama di `utils/formatDuration.ts`.

### 4.5 Spinner Hardcode

Semua komponen mendefinisikan spinner inline:

```tsx
<div className="spinner-small" style={{ width: "40px", height: "40px", border: "3px solid var(--line)", borderTopColor: "var(--blue)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
```

**Rekomendasi:** Buat komponen `<Spinner size="sm" />` yang reusable.

---

## 5. Ringkasan Severity

| Severity | Jumlah | Contoh |
|----------|--------|--------|
| **Critical** | 0 | — |
| **High** | 2 | Silent error di ListenerMapCard; data conflict Icecast vs analytics |
| **Medium** | 5 | `colorScheme` dead prop (x3); `formatDuration` not defensive; shimmer style duplication |
| **Low** | 6 | Inline hover style; magic number 238; `maxCities` naming; `getMaxCount` re-creation; cross-import fragility |

---

## 6. Rekomendasi

### Jika ingin me-restore komponen ini:

1. **Perbaiki masalah High severity** sebelum merge ke `main`:
   - Tambahkan error state di `ListenerMapCard`
   - Labelkan dengan jelas perbedaan data Icecast vs analytics di `RealTimeListenersCard`

2. **Refactor common utilities:**
   - `formatDuration` → satu fungsi shared
   - `Spinner` → satu komponen shared
   - Hover effect → CSS class `.ui-card-interactive`

3. **Hapus atau implementasikan `colorScheme`** di ketiga komponen.

4. **Tambahkan unit test** minimal untuk:
   - `formatDuration` edge cases (0, undefined, null, sangat besar)
   - `formatNumber` edge cases
   - Props rendering (loading, error, empty, populated)

### Jika memilih menulis ulang:

Komponen ini sudah solid secara arsitektural. Menulis ulang hanya diperlukan jika ingin:
- Mengadopsi component library (shadcn/ui, dll)
- Mengubah dari inline styles ke Tailwind CSS
- Menambahkan testing storybook

---

## 7. Lampiran: Tree File Analytics

```
src/features/analytics/
├── components/
│   ├── ActiveSessionsCard.tsx      ← Audited (§3.1)
│   ├── AnalyticsDashboard.tsx      ← Not audited (orchestrator)
│   ├── ListenerMapCard.tsx         ← Audited (§3.5)
│   ├── ListenerMetricsCard.tsx     ← Audited (§3.2)
│   ├── LiveListenerCountCard.tsx   ← Not audited
│   ├── RealTimeListenersCard.tsx   ← Audited (§3.4)
│   ├── TopContentCard.tsx          ← Audited (§3.3)
│   └── index.ts
├── context/
│   └── ListenerAnalyticsContext.tsx
├── hooks/
│   ├── index.ts
│   ├── useActiveSessions.ts
│   ├── useListenerMetrics.ts
│   ├── useLiveListenerCount.ts
│   ├── useRealTimeListeners.ts
│   └── useTopContent.ts
├── services/
│   ├── analytics.service.ts
│   ├── analyticsCollection.service.ts
│   ├── geolocation.service.ts
│   ├── index.ts
│   └── listenerAnalytics.service.ts
├── types/
│   └── listenerAnalytics.types.ts
└── index.ts
```

---

*Dokumen ini dihasilkan sebagai bagian dari code review branch `feature/listener-analytics-mvp`.*
