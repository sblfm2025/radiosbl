# Panduan Analytics Pendengar — Radio SBL

Dokumen ini menjelaskan cara membaca dan memahami data di dashboard **Analytics Pendengar** Radio SBL secara tepat dan proporsional.

---

## 1. Apa Itu "Estimasi Pendengar Aktif dari Aplikasi"?

Angka ini adalah **estimasi jumlah sesi streaming yang aktif** dalam aplikasi web Radio SBL dalam 90 detik terakhir.

**Penting untuk dipahami:**
- Ini bukan jumlah pendengar radio keseluruhan (FM, web player eksternal, dll).
- Ini hanya mencakup pendengar yang menggunakan **aplikasi web Radio SBL** dan sedang aktif memutar.
- Satu orang bisa memiliki lebih dari satu sesi jika membuka dari beberapa tab/perangkat.

**Apa yang menyebabkan angka berubah?**
- Naik: Ada pendengar baru yang menekan play.
- Turun: Pendengar menutup tab, mematikan audio, atau tidak ada aktivitas selama >90 detik.

---

## 2. Perbedaan Data Aplikasi vs Data Server Streaming

| | Aplikasi Web | Server Streaming |
|---|---|---|
| **Sumber data** | Sesi di browser/PWA | Log koneksi server |
| **Akurasi** | Estimasi (bisa lebih rendah) | Lebih akurat |
| **Cakupan** | Hanya pengguna aplikasi | Semua pendengar |
| **Tersedia di** | Dashboard Analytics | Laporan server terpisah |

Saat ini, dashboard Analytics Radio SBL hanya menampilkan data dari aplikasi web. Data server streaming (jika menggunakan AzuraCast, IcecastHQ, dll.) dapat dikonsultasikan secara terpisah dengan tim teknis.

---

## 3. Membaca Device Breakdown

Kartu **Perangkat** menampilkan pembagian sesi berdasarkan jenis perangkat:

- 📱 **Mobile** — pendengar via smartphone.
- 💻 **Desktop** — pendengar via komputer/laptop.
- 📟 **Tablet** — pendengar via tablet.
- ❓ **Unknown** — perangkat tidak terdeteksi (jarang terjadi).

Persentase menunjukkan proporsi dari total sesi yang tercatat. Data ini berguna untuk mengetahui platform apa yang paling banyak digunakan pendengar.

---

## 4. Membaca Program Performance

Kartu **Performa Program** menampilkan program mana yang paling sering diputar dan berapa lama rata-rata durasi dengarnya.

**Cara membacanya:**
- **Jumlah Sesi** — berapa kali program tersebut diputar.
- **Rata-rata Durasi** — estimasi durasi dengar rata-rata per sesi.

Program dengan durasi rata-rata tinggi menunjukkan pendengar betah menyimak program tersebut — indikator kualitas konten yang baik.

---

## 5. Membaca Distribusi Jam Aktif

Bar chart **Jam Aktif Pendengar** menampilkan 24 kolom jam (00:00–23:00).

- **Kolom tinggi** = banyak sesi dimulai pada jam tersebut.
- **Bar berwarna kuning/emas** = jam paling ramai (peak hour).

Informasi jam ramai berguna untuk:
- Menentukan jadwal program unggulan.
- Menjadwalkan konten premium di jam-jam aktif.
- Evaluasi ulang program di jam-jam sepi.

---

## 6. Membaca Log Error Streaming

Kartu **Error Streaming** menampilkan laporan kendala teknis yang tercatat otomatis oleh aplikasi:

- **Jenis Error** — network error, audio error, timeout, dll.
- **Jumlah Kejadian** — berapa kali error tersebut terjadi.
- **Waktu Terakhir** — kapan terakhir terjadi.

Log ini berguna untuk mendeteksi masalah teknis streaming yang perlu ditangani oleh tim IT.

---

## 7. Batasan Akurasi Data

| Aspek | Keterbatasan |
|---|---|
| **Pendengar aktif** | Bisa under-counted jika pendengar tidak membuka aplikasi |
| **Durasi dengar** | Estimasi berdasarkan heartbeat 60 detik, bukan hitungan tepat |
| **Lokasi** | Hanya tersedia jika pendengar memberi izin lokasi |
| **Program** | Hanya tercatat jika ada data program aktif saat play |

Data yang akurat 100% hanya bisa diperoleh dari server streaming yang terhubung langsung.

---

## 8. Privasi dan Lokasi Pendengar

Jika pendengar memberikan izin lokasi di browser:
- Latitude dan longitude disimpan secara anonim (tanpa nama pendengar).
- Data lokasi hanya dapat diakses oleh Admin berwenang.
- Pendengar dapat menolak izin lokasi — streaming tetap berjalan normal.
- Data lokasi presisi direkomendasikan untuk disimpan maksimal 30 hari.

Lihat [Kebijakan Privasi Aplikasi](../PANDUAN_ADMIN_FITUR_PRO.md) untuk informasi lengkap.
