# Blueprint Implementasi Face Recognition RadioSBL

Versi: 1.0 Final Review
Status: Siap Implementasi Bertahap
Target Sistem: RadioSBL Attendance System
Metode: Face Recognition Browser Side (face-api.js)
Mode Awal: Observe Only

---

# LATAR BELAKANG

Sistem absensi RadioSBL saat ini sudah memiliki:

* Login User
* GPS Validation
* Radius Validation
* Selfie Verification
* AI Face Presence Validation
* Check In
* Check Out
* Attendance Reports
* Offline Sync

Namun ditemukan kelemahan:

AI hanya memastikan terdapat wajah yang jelas pada foto.

AI belum dapat memastikan bahwa wajah tersebut benar-benar milik akun yang sedang login.

Akibatnya:

* Orang lain masih berpotensi melakukan absensi menggunakan akun tertentu.
* Selfie yang valid belum tentu berasal dari pemilik akun.

Karena itu diperlukan lapisan tambahan berupa Face Recognition.

---

# TUJUAN

Face Recognition digunakan untuk menjawab:

"Apakah wajah pada selfie absensi cocok dengan profil wajah pengguna yang sedang login?"

Face Recognition TIDAK digunakan untuk:

* Menentukan jenis kelamin
* Menentukan usia
* Menentukan ras
* Menentukan suku
* Menentukan atribut pribadi lainnya

---

# PRINSIP IMPLEMENTASI

## Prinsip 1

Jangan merusak sistem absensi yang sudah berjalan.

GPS tetap menjadi validasi utama.

---

## Prinsip 2

Face Recognition adalah lapisan tambahan.

Bukan pengganti GPS.

---

## Prinsip 3

Tidak ada auto reject pada tahap awal.

Semua hasil meragukan masuk review admin.

---

## Prinsip 4

Harus tersedia rollback kapan saja.

Jika Face Recognition bermasalah:

```ts
attendanceConfig.faceRecognitionEnabled = false
```

Seluruh sistem absensi tetap berjalan normal.

---

# ARSITEKTUR BARU

## Arsitektur Saat Ini

Login
↓
GPS
↓
Selfie
↓
AI Validation
↓
Attendance Record

---

## Arsitektur Baru

Login
↓
GPS
↓
Selfie
↓
AI Quality Validation
↓
Face Recognition
↓
Attendance Record
↓
Admin Review (Jika Diperlukan)

---

# FASE IMPLEMENTASI

## FASE 1

Infrastructure

Target:

Menyiapkan fondasi tanpa mempengaruhi absensi.

---

### Install Library

```bash
npm install face-api.js
```

---

### Folder Model

```text
public/
└── models/
    └── face-api/
```

---

### Model Wajib

TinyFaceDetector

Digunakan untuk:

* Deteksi wajah

---

FaceLandmark68

Digunakan untuk:

* Landmark wajah

---

FaceRecognitionNet

Digunakan untuk:

* Face Descriptor
* Face Matching

---

# FASE 2

Enrollment System

---

## Tujuan

Membuat profil wajah resmi setiap user.

---

## Menu Baru

User Profile
↓
Profil Wajah

atau

Admin
↓
Kelola Profil Wajah

---

# STATUS PROFIL WAJAH

```ts
type FaceProfileStatus =
  | "not_enrolled"
  | "pending_review"
  | "active"
  | "needs_update"
  | "disabled";
```

---

# PERSYARATAN FOTO REFERENSI

Minimal:

5 foto

Komposisi:

1. Depan
2. Kiri
3. Kanan
4. Cahaya terang
5. Ekspresi natural

---

# VALIDASI FOTO REFERENSI

Wajib:

✓ 1 wajah

✓ Tidak blur

✓ Tidak gelap

✓ Tidak memakai filter

✓ Tidak menggunakan screenshot

✓ Tidak menggunakan foto dari layar HP lain

✓ Wajah minimal 60% area frame

---

# PENYIMPANAN DATA

JANGAN simpan descriptor di dokumen user utama.

SALAH:

```text
users/{userId}
```

BENAR:

```text
users/{userId}/faceProfiles/default
```

---

# STRUKTUR DATA

```ts
{
  enrolled: true,

  status: "active",

  model: "face-api.js",

  modelVersion: "1.0",

  descriptorCount: 5,

  descriptors: [],

  createdAt,

  updatedAt,

  approvedBy,

  approvedAt
}
```

---

# FIREBASE STORAGE

Foto referensi disimpan terpisah.

```text
face-profiles/
   {userId}/
```

Jangan gunakan URL publik.

---

# FASE 3

Face Matching

---

# KAPAN DIJALANKAN

Bukan realtime.

Bukan video streaming.

Hanya setelah selfie berhasil diambil.

Alasan:

* lebih ringan
* hemat baterai
* cocok untuk HP lama

---

# ALUR

Ambil Selfie
↓
Deteksi Wajah
↓
Generate Descriptor
↓
Ambil Descriptor Referensi
↓
Bandingkan
↓
Simpan Hasil

---

# FACE DISTANCE

Gunakan:

```ts
faceapi.euclideanDistance()
```

---

# THRESHOLD AWAL

Jangan langsung dijadikan keputusan final.

Tahap awal hanya observasi.

---

Candidate Matched

```text
Distance <= 0.45
```

---

Candidate Review

```text
0.46 - 0.60
```

---

Candidate Mismatch

```text
> 0.60
```

---

# PENYIMPANAN HASIL

```ts
{
  faceRecognitionUsed: true,

  faceMatchDistance: 0.38,

  faceMatchStatus: "matched_candidate",

  faceRecognitionMode: "observe_only",

  faceRecognitionVersion: "v1"
}
```

---

# JANGAN SIMPAN

```ts
similarity = 1 - distance
```

Karena tidak representatif.

Simpan distance asli.

---

# FASE 4

Observe Only

---

Durasi:

1–2 Minggu

---

Tujuan:

Mengumpulkan data nyata.

---

Aturan:

Semua absensi tetap valid seperti sebelumnya.

Face Recognition hanya mencatat hasil.

Tidak mempengaruhi status absensi.

---

# FASE 5

Review Mode

---

Aktif setelah evaluasi observe only.

---

Aturan

Matched Candidate

↓

Normal

---

Review Candidate

↓

Needs Review

---

Mismatch Candidate

↓

Needs Review

---

Masih belum ada auto reject.

---

# FASE 6

Admin Dashboard

---

Tambah kolom baru:

Face Match

---

Badge

🟢 Cocok

🟡 Perlu Review

🔴 Tidak Cocok

⚪ Belum Enroll

---

# DETAIL ABSENSI

Tambahkan:

Face Distance

Model Version

Enrollment Status

Reference Count

Recognition Mode

---

# AKSI ADMIN

Approve

Reject

Minta Foto Ulang

Update Face Profile

Nonaktifkan Face Recognition

---

# FALLBACK SYSTEM

Jika model gagal:

```ts
{
  faceRecognitionUsed: false,

  faceRecognitionError:
    "MODEL_LOAD_FAILED"
}
```

Absensi tetap disimpan.

---

Jika browser tidak kompatibel:

```ts
{
  faceRecognitionUsed: false,

  faceRecognitionError:
    "BROWSER_NOT_SUPPORTED"
}
```

Absensi tetap disimpan.

---

# ANTI SPOOFING SEDERHANA

Tahap awal.

Belum menggunakan liveness detection penuh.

---

Minimal:

* kamera langsung
* tidak boleh upload file
* ambil 2 frame
* cek perubahan posisi wajah

Jika mencurigakan:

```ts
reviewStatus = "needs_review"
```

---

# FIRESTORE SECURITY

Descriptor hanya boleh dibaca:

* Pemilik akun
* Admin

---

Descriptor tidak boleh ditulis langsung oleh user.

---

Enrollment harus melalui:

* Admin
  atau
* Persetujuan Admin

---

# KONFIGURASI SISTEM

```ts
attendanceConfig = {
  faceRecognitionEnabled: true,

  faceRecognitionMode:
    "observe_only",

  faceRecognitionRequired:
    false,

  faceRecognitionVersion:
    "v1"
}
```

---

# KRITERIA GO LIVE

Minimal:

✓ 90% user sudah enrollment

✓ Observe Only berjalan 2 minggu

✓ Tidak ada crash mayor

✓ Tidak ada keluhan signifikan

✓ Threshold sudah diuji dengan data staf RadioSBL

Baru boleh masuk mode Review Required.

---

# KESIMPULAN

Face Recognition RadioSBL harus diterapkan secara bertahap.

Tahap pertama bukan meningkatkan keamanan secara agresif.

Tahap pertama adalah mengumpulkan data nyata dan memastikan sistem stabil.

Prinsip utama:

Jangan merusak alur absensi yang saat ini sudah berjalan baik.

Face Recognition berfungsi sebagai lapisan verifikasi tambahan yang membantu admin mengidentifikasi kemungkinan penyalahgunaan akun tanpa mengganggu operasional harian RadioSBL.
