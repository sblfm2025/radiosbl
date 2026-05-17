# ARAHAN PENGEMBANGAN HALAMAN JADWAL SIARAN RADIOSBL

## Latar Belakang

Sistem Jadwal Siaran RadioSBL saat ini masih menggunakan konsep jadwal reguler mingguan statis yang terus berulang tanpa mempertimbangkan kalender aktual.

Model ini memiliki keterbatasan karena:

- tidak mendukung perubahan jadwal berdasarkan tanggal tertentu
- tidak mendukung event khusus
- tidak mendukung penggantian program sementara
- tidak mendukung pembatalan slot
- tidak mendukung aktivasi program tentative/opsional
- sulit digunakan untuk operasional radio yang dinamis

Selain itu, beberapa program saat ini menggunakan format:

```md
Program A / Program B
```

Format tersebut bukan berarti satu nama program, melainkan:

- program utama/default
- program alternatif/tentative/opsional

Jika program opsional tidak dipilih secara khusus, maka program default yang berjalan.

---

# TUJUAN PENGEMBANGAN

Membangun sistem Jadwal Siaran yang:

- berbasis kalender aktual
- tetap memiliki jadwal reguler mingguan sebagai template dasar
- mendukung override/perubahan jadwal
- mendukung program tentative
- mendukung event khusus
- fleksibel untuk kebutuhan operasional radio
- lebih modern dan profesional
- scalable untuk pengembangan jangka panjang

---

# KONSEP SISTEM BARU

## 1. Jadwal Reguler Mingguan

Jadwal reguler adalah template dasar yang berulang setiap minggu.

Contoh:

```md
Senin
08.00–10.00
Program: Salam Bumi Lasinrang
Penyiar: Andi
```

Jadwal ini bukan jadwal final, tetapi hanya default/fallback.

Jika tidak ada perubahan pada tanggal tertentu, maka sistem menggunakan jadwal reguler ini.

---

# 2. Jadwal Aktual Berdasarkan Kalender

Sistem harus menampilkan jadwal berdasarkan tanggal kalender.

Contoh:

```md
Tanggal: 17 Mei 2026
```

Saat user membuka tanggal tersebut:

1. sistem mengambil jadwal reguler sesuai hari
2. sistem mengecek apakah ada override/perubahan
3. jika ada override maka gunakan override
4. jika tidak ada override maka gunakan jadwal reguler

---

# 3. Override / Perubahan Jadwal

Admin harus dapat melakukan perubahan jadwal berdasarkan tanggal tertentu.

Perubahan dapat berupa:

- mengganti program
- mengganti penyiar
- membatalkan slot
- menambah slot baru
- mengubah jam siaran
- mengaktifkan program tentative
- membuat event khusus

---

# 4. Jenis Override

Gunakan tipe override berikut:

| Type | Fungsi |
|---|---|
| replace | mengganti slot reguler |
| add | menambah jadwal khusus |
| cancel | membatalkan slot |
| reschedule | mengubah jam slot |
| activate_optional | mengaktifkan program tentative |

---

# 5. Program Tentative / Opsional

Program dengan tanda garis miring `/` bukan satu nama program.

Contoh:

```md
Siaran Reguler / Podcast
```

Artinya:

| Jenis | Nilai |
|---|---|
| Program utama/default | Siaran Reguler |
| Program opsional | Podcast |

Jika tidak ada pengaturan khusus maka:

```md
Program aktif = Siaran Reguler
```

Podcast hanya aktif jika dipilih oleh admin pada tanggal tertentu.

---

# 6. Struktur Data Program

JANGAN menyimpan program seperti ini:

```json
{
  "program": "Siaran Reguler / Podcast"
}
```

Gunakan struktur seperti ini:

```json
{
  "defaultProgram": "Siaran Reguler",
  "optionalPrograms": [
    "Podcast"
  ]
}
```

---

# 7. Struktur Jadwal Reguler

Contoh ideal:

```json
{
  "id": "senin-0800",
  "day": "senin",
  "startTime": "08:00",
  "endTime": "10:00",
  "defaultProgram": "Salam Bumi Lasinrang",
  "optionalPrograms": [
    "Podcast"
  ],
  "defaultAnnouncerId": "announcer_01",
  "isActive": true
}
```

---

# 8. Struktur Override Jadwal

Contoh:

```json
{
  "id": "override_001",
  "date": "2026-05-17",
  "slotId": "senin-0800",
  "type": "replace",
  "newProgram": "Podcast",
  "newAnnouncerId": "announcer_05",
  "reason": "Episode podcast khusus",
  "createdBy": "admin_01",
  "createdAt": "timestamp"
}
```

---

# 9. Alur Render Jadwal

Gunakan konsep:

```ts
actualSchedule = mergeWeeklyScheduleWithOverrides(date)
```

Contoh:

```ts
const weeklySchedule = getWeeklyScheduleByDay(date)

const overrides = getOverridesByDate(date)

const actualSchedule = applyOverrides(
  weeklySchedule,
  overrides
)
```

---

# 10. Prioritas Data Jadwal

Urutan prioritas:

```md
Override/Event Khusus
↓
Program Tentative yang diaktifkan
↓
Jadwal Reguler
```

---

# 11. Tampilan Halaman Jadwal

## Tampilan Utama

Halaman harus memiliki:

- kalender tanggal
- jadwal hari ini
- jadwal minggu ini
- jadwal berdasarkan tanggal pilihan
- indikator sedang siaran
- program berikutnya
- filter program
- filter penyiar
- pencarian jadwal

---

# 12. Label Jadwal

Gunakan label visual:

| Label | Fungsi |
|---|---|
| Reguler | jadwal default |
| Tentative | program opsional |
| Override | jadwal diganti |
| Khusus | event spesial |
| Dibatalkan | slot dibatalkan |
| Sedang Siaran | program aktif saat ini |

---

# 13. Contoh Tampilan Slot

## Jadwal Normal

```md
08.00–10.00
Siaran Reguler

Label:
- Reguler

Opsional:
- Podcast
```

---

## Jadwal Override

```md
08.00–10.00
Podcast

Label:
- Override

Default:
- Siaran Reguler
```

---

# 14. Tampilan Desktop

Versi desktop harus lebih lengkap.

Fitur desktop:

- kalender mingguan
- kalender bulanan
- drag and drop jadwal
- bulk edit
- audit log
- histori perubahan
- export PDF
- export gambar jadwal
- filter kompleks
- statistik program
- statistik penyiar

---

# 15. Tampilan Mobile

Versi mobile harus lebih ringan dan fokus.

Fitur mobile:

- jadwal hari ini
- jadwal tanggal pilihan
- sedang siaran
- detail program
- request tukar jadwal

Fitur berat desktop tidak perlu ditampilkan penuh di mobile.

---

# 16. Sistem Tukar Jadwal

Sistem tukar jadwal harus terintegrasi dengan kalender aktual.

Alur:

```md
Penyiar Request
↓
Penyiar Pengganti Menyetujui
↓
Admin Approve
↓
Override Jadwal Dibuat
↓
Jadwal Kalender Terupdate
```

---

# 17. Histori Perubahan

Semua perubahan wajib memiliki audit log.

Contoh:

```json
{
  "date": "2026-05-17",
  "slotId": "senin-0800",
  "type": "replace",
  "oldProgram": "Siaran Reguler",
  "newProgram": "Podcast",
  "changedBy": "admin_01",
  "reason": "Podcast spesial",
  "createdAt": "timestamp"
}
```

---

# 18. Validasi Sistem

Sistem harus memiliki validasi:

- penyiar tidak boleh bentrok jadwal
- jam tidak boleh overlap
- override tidak boleh duplikat
- slot cancel tidak boleh tayang
- program tentative tidak aktif otomatis
- jadwal event khusus memiliki prioritas tertinggi

---

# 19. Fitur Tambahan yang Direkomendasikan

## Sangat Direkomendasikan

- countdown program berikutnya
- auto highlight sedang siaran
- preview jadwal mingguan
- jadwal publik shareable
- export jadwal ke gambar
- integrasi notifikasi penyiar
- reminder sebelum siaran
- integrasi live streaming
- statistik durasi siaran

---

# 20. Catatan Penting untuk Developer

## Jangan Lagi Menggunakan Jadwal Mingguan Sebagai Jadwal Final

Jadwal mingguan hanya template dasar.

Yang tampil ke user harus:

```md
Jadwal Kalender Aktual
```

---

# 21. Arsitektur Ideal

Gunakan pemisahan:

| Collection | Fungsi |
|---|---|
| weeklySchedules | template reguler |
| scheduleOverrides | perubahan jadwal |
| specialEvents | event khusus |
| announcerSwaps | tukar jadwal |
| scheduleLogs | audit log |

---

# 22. Kesimpulan

Sistem Jadwal Siaran RadioSBL harus diubah menjadi:

```md
Kalender Siaran Dinamis
```

bukan hanya:

```md
Daftar Jadwal Mingguan
```

Konsep akhirnya:

```md
Jadwal Reguler
+
Kalender Aktual
+
Override
+
Program Tentative
+
Event Khusus
+
Audit Log
=
Sistem Jadwal Radio Profesional
```