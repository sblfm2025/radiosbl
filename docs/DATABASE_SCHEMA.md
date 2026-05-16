# DATABASE_SCHEMA.md

## Collections

- users
- employees
- announcers
- attendanceRecords
- broadcastPrograms
- broadcastSchedules
- customScheduleSlots
- scheduleSwapRequests
- coverageAssignments
- coverageReports
- liveEvents
- obChecklists
- youtubeLives
- discordRooms
- streamingSettings
- songRequests
- complaints
- driveFiles
- notifications
- aiLogs
- activityLogs
- appSettings

## users

```ts
{
  id: string // Firebase Auth uid
  email: string
  displayName: string
  role: 'super_admin' | 'admin' | 'leader' | 'announcer' | 'reporter' | 'operator' | 'employee' | 'public'
  employeeId?: string
  photoUrl?: string
  whatsapp?: string
  active: boolean
}
```

## driveFiles

```ts
{
  id: string
  driveFileId: string
  name: string
  mimeType: string
  size: number
  webViewLink: string
  module: string
  ownerId: string
  createdAt: Timestamp
}
```

## attendanceRecords

```ts
{
  id: string
  userId: string
  displayName?: string
  airName?: string
  checkInAt: Timestamp
  checkOutAt?: Timestamp
  latitude: number
  longitude: number
  selfieDriveFileId: string
  status: 'present' | 'late' | 'outside_radius'
}
```

## announcers

```ts
{
  id: string
  fullName: string
  airName: string
  scheduleNames: string[]
  photoUrl?: string
  whatsapp?: string
  decreeOrder: number
  active: boolean
  totalDays: number
  totalHours: number
  note?: string
}
```

## songRequests

```ts
{
  id: string
  requesterName: string
  requesterWhatsapp?: string
  artist?: string
  title: string
  message?: string
  announcerName?: string
  announcerWhatsapp?: string
  status: 'new' | 'notified' | 'queued' | 'played' | 'rejected'
  notificationText: string
  whatsappUrl?: string
  notificationDelivered?: boolean // runtime only, tidak wajib disimpan
  createdAt: Timestamp
}
```

## broadcastPrograms

```ts
{
  id: string
  title: string
  description: string
  defaultDurationMinutes: number
  category: 'main' | 'insert' | 'playlist'
  active: boolean
}
```

## broadcastSchedules

```ts
{
  id: string
  programId: string
  announcerId?: string
  announcerIds: string[]
  externalPic: string[]
  day: string
  timeLabel: string
  startsAt: string
  endsAt: string
  status: 'draft' | 'ready' | 'live' | 'completed' | 'cancelled'
}
```

## customScheduleSlots

```ts
{
  id: string // sourceDay + sourceTime
  day: string
  time: string
  program: string
  description: string
  announcer: string
  sourceDay: string
  sourceTime: string
}
```

## streamingSettings

```ts
{
  id: 'main'
  stationName: string
  frequency: string
  streamUrl: string
  website: string
  phone: string
  socialHandle: string
}
```

## complaints

```ts
{
  id: string
  reporterName: string
  category: 'Teknis' | 'Program' | 'Informasi Publik' | 'Lainnya'
  message: string
  status: 'Baru' | 'Terverifikasi' | 'Diproses' | 'Selesai'
  createdAt: Timestamp
}
```

## liveEvents

```ts
{
  id: string
  title: string
  location: string
  startsAt: Timestamp
  youtubeUrl?: string
  discordRoomUrl?: string
  crewIds: string[]
  status: 'draft' | 'ready' | 'live' | 'completed'
}
```

## appSettings

```ts
{
  id: 'main'
  legalName: string
  directorName: string
  directorPosition: string
  decreeNumber: string
  decreeDate: string
  address: string
  postalCode: string
}
```

## Seed Export dan Import

```bash
npm run seed:export
npm run seed:import
npm run seed:import:write
npm run seed:import:write:cli
```

- `npm run seed:export` membuat `tmp/firestore-seed.json` dari data resmi jadwal
  dan SK penyiar 2026.
- `npm run seed:import` membaca file seed dan menampilkan rencana import tanpa
  menulis data ke Firestore.
- `npm run seed:import:write` menulis dokumen ke Firestore dengan ID deterministik
  dan mode merge.
- `npm run seed:import:write:cli` menulis seed memakai Firestore REST API dan
  access token Firebase CLI yang sedang login.

Import menggunakan environment Firebase `VITE_FIREBASE_*` yang sama dengan app.
Karena script memakai Firebase Web SDK, mode tulis tetap mengikuti Firestore
Rules project terkait.

Jika rules produksi menolak `seed:import:write` karena script Web SDK belum
login sebagai user admin, gunakan `seed:import:write:cli` dari mesin yang sudah
`firebase login`. Jalur CLI REST memakai IAM Firebase CLI, bukan session Auth
frontend.

## Service CRUD Awal

- `src/services/announcer.service.ts`
  - `listAnnouncers()`
  - `saveAnnouncer(announcer)`
- `src/services/schedule.service.ts`
  - `listPrograms()`
  - `listSchedules()`
  - `saveProgram(program)`
  - `saveSchedule(schedule)`
  - `requestScheduleSwap(payload)`
- `src/services/scheduleSlot.service.ts`
  - `listCustomScheduleSlots()`
  - `listCustomScheduleSlotsRemote()`
  - `mergeScheduleSlots(officialSlots, customSlots?)`
  - `mergeScheduleSlotsRemote(officialSlots)`
  - `saveCustomScheduleSlot(slot, sourceSlot?)`
  - `saveCustomScheduleSlotRemote(slot, sourceSlot?)`
- `src/services/attendance.service.ts`
  - `buildAttendanceRecordDraft(input)`
  - `checkIn(input)`
  - `checkInWithSelfie(input)`
  - `listLocalAttendanceRecords()`
  - `listAttendanceRecords()`
- `src/services/onAir.service.ts`
  - `resolveOnAirAnnouncerFromAttendance(slot, records, now)`
- `src/services/songRequest.service.ts`
  - `createSongRequestDraft(input)`
  - `saveSongRequest(input)`
  - `submitSongRequest(input)`
  - `listLocalSongRequests()`
  - `listSongRequests()`
  - `subscribeSongRequests(onChange)`
  - `updateSongRequestStatus(request, status)`
- `src/services/whatsappNotification.service.ts`
  - `buildWhatsAppDeepLink(input)`
  - `sendWhatsAppNotification(input)`

Request lagu memakai Firestore collection `songRequests` saat Firebase aktif dan
fallback `localStorage` saat mode demo/test/offline. Firestore rules mengizinkan
create awal untuk status `new`/`notified`, read untuk user internal yang sudah
login, dan update status oleh super admin, admin, leader, announcer, atau
operator.

Halaman `Request` di aplikasi menampilkan antrean request baru, request siap
diputar, dan riwayat singkat. Penyiar/operator dapat mengubah status menjadi
`queued`, `played`, atau `rejected`; jika Firestore belum bisa diakses, status
tetap tersimpan di fallback lokal.

Jika `VITE_WHATSAPP_PROXY_ENDPOINT` aktif, submit request lagu mencoba mengirim
notifikasi melalui proxy WhatsApp. Jika proxy belum aktif atau gagal, aplikasi
tetap membuat deep-link `wa.me` sebagai fallback manual.
- `src/services/complaint.service.ts`
  - `createComplaintDraft(input)`
  - `submitComplaint(input)`
  - `listComplaints()`
  - `listLocalComplaints()`
  - `subscribeComplaints(onChange)`
  - `updateComplaintStatus(complaint, status)`

Pengaduan memakai Firestore collection `complaints` saat Firebase aktif dan
fallback `localStorage` saat mode demo/test/offline. Submit publik selalu
berstatus awal `Baru`, sementara status penanganan dapat dinaikkan menjadi
`Terverifikasi`, `Diproses`, atau `Selesai`.
- `src/services/liveOb.service.ts`
  - `buildLiveEventDraft(input)`
  - `createLiveEvent(payload)`
  - `createLiveEventFromDraft(input)`
  - `listLiveEvents()`
  - `listLocalLiveEvents()`
  - `subscribeLiveEvents(onChange)`

Event Live/OB memakai Firestore collection `liveEvents` saat Firebase aktif dan
fallback `localStorage` key `radio-sbl-live-events` saat mode demo/test/offline.
Form Live/OB menyimpan link Discord room dan YouTube Live agar kru dapat membuka
ruang reportase langsung dari rundown aplikasi.
- `src/services/googleDrive.service.ts`
  - `buildDriveFileDraft(request)`
  - `uploadToGoogleDrive(request)`
  - `uploadAttendanceSelfie(file, ownerId)`

Absensi juga menyediakan `subscribeAttendanceRecords(onChange)` untuk update
realtime Firestore dengan fallback cache lokal.

Saat Firebase env belum lengkap, service memakai data resmi dari seed lokal agar
mode demo/offline tetap berjalan. Saat env Firebase tersedia, service memakai
collection Firestore terkait.

Halaman Jadwal memiliki layer override untuk kebutuhan edit cepat super admin.
Override disimpan ke Firestore collection `customScheduleSlots` saat Firebase
aktif dan fallback ke `radio-sbl-custom-schedule-slots` di localStorage saat
offline/demo. Slot menyimpan `sourceDay/sourceTime` internal agar perubahan jam
tetap menimpa slot asal yang benar.

Untuk absensi, mode demo membuat metadata Google Drive deterministik dengan ID
`demo-attendance-{ownerId}-{namaFile}`. Endpoint upload nyata dapat dipasang lewat
`VITE_GOOGLE_DRIVE_UPLOAD_ENDPOINT`.

Setiap check-in selfie yang berhasil juga disimpan ke cache lokal
`radio-sbl-attendance-records`. Cache ini dipakai sebagai fallback saat Firestore
belum tersedia/menolak query dan agar status penyiar on-air bisa diperbarui cepat
di perangkat yang sama setelah check-in.

Integrasi Google Drive API lokal tersedia melalui:

- `npm run drive:auth` untuk membuat refresh token OAuth dari file
  `client_secret_*.json`.
- `npm run drive:server` untuk menjalankan endpoint
  `http://localhost:8787/upload`.

Secret OAuth dan refresh token hanya dibaca dari `.env.local`/`C:\tmp` dan tidak
boleh disimpan di repository.
