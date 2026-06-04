# ARAHAN TEKNIS UPGRADE INTEGRASI RADIOBOSS — RADIO SBL

## Konteks Utama

Repository terkait:

1. Aplikasi Radio SBL:
   - https://github.com/sblfm2025/radiosbl
   - Berperan sebagai pusat operasional, dashboard, approval, monitoring, dan input command.
   - Tidak boleh memanggil API RadioBOSS langsung dari browser.

2. Studio Gateway:
   - https://github.com/sblfm2025/studio-gateway
   - Berjalan di PC studio.
   - Berperan sebagai jembatan aman antara Firestore dan RadioBOSS localhost API.
   - Hanya Studio Gateway yang boleh berkomunikasi dengan RadioBOSS API lokal.

Arsitektur wajib:

Aplikasi Radio SBL
   ↓
Firebase / Firestore
   ↓
Studio Gateway di PC Studio
   ↓
RadioBOSS localhost API

JANGAN mengubah arsitektur ini menjadi:

Aplikasi Radio SBL
   ↓
RadioBOSS API langsung

Itu dilarang karena tidak aman dan akan mengekspos RadioBOSS ke browser/internet.

---

# BAGIAN A — PRINSIP KEAMANAN WAJIB

## A.1 Larangan keras

Jangan pernah melakukan hal berikut:

- Jangan panggil `http://127.0.0.1:9001` dari frontend.
- Jangan panggil IP LAN PC studio dari browser.
- Jangan simpan password RadioBOSS di frontend.
- Jangan simpan password RadioBOSS di Firestore.
- Jangan membuat fitur raw command bebas dari frontend.
- Jangan membuat auto-play request lagu langsung dari pendengar.
- Jangan membuka port RadioBOSS ke internet.
- Jangan melakukan refactor besar yang merusak fitur radiosbl yang sudah berjalan.

## A.2 Prinsip command aman

Frontend hanya boleh membuat dokumen command di Firestore.

Contoh:

```js
await addDoc(collection(db, "radiobossCommands"), {
  type: "START_RECORDING",
  status: "pending",
  payload: {
    programId,
    scheduleId,
    announcerId
  },
  requestedBy: currentUser.uid,
  requestedByName: currentUser.displayName || currentUser.email,
  requestedAt: serverTimestamp()
});

Studio Gateway membaca command tersebut, memvalidasi, lalu mengeksekusi command yang sudah masuk allowlist.

Command allowlist awal:

const ALLOWED_COMMAND_TYPES = [
  "START_RECORDING",
  "STOP_RECORDING",
  "MARK_RECORDING_SKIPPED",
  "RETRY_COMMAND",
  "ADD_TRACK_TO_QUEUE",
  "MARK_REQUEST_PLAYED"
] as const;

Jangan ada struktur seperti ini:

{
  rawCommand: "streamarchive something"
}

Frontend tidak boleh mengirim raw command RadioBOSS.

BAGIAN B — TARGET FITUR DI APLIKASI RADIO SBL

Tambahkan modul/halaman berikut di aplikasi Radio SBL:

RadioBOSS Status Panel
Gateway Health Monitor
Recording Control Panel
Program Recording Rules
Recording History
Song Request Inspector
RadioBOSS Audit Log

Gunakan style UI yang konsisten dengan aplikasi Radio SBL yang sudah ada. Jangan membuat tampilan admin berat. Buat mobile-first, ringan, bersih, dan mudah dipakai operator radio.

BAGIAN C — FIRESTORE COLLECTION BARU

Pertahankan collection yang sudah ada dari Studio Gateway:

radiobossStatus/current
radiobossNowPlaying/current
radiobossGatewayHeartbeat/{gatewayId}
radiobossTrackHistory/{trackId}
radiobossAuditLogs/{logId}

Tambahkan collection baru berikut:

programRecordingRules/{programId}
programRecordings/{recordingId}
radiobossCommands/{commandId}
songRequests/{requestId}
musicLibraryIndex/{trackId}
songRequestMatches/{requestId}

Jangan mengganti total schema lama. Jika field baru dibutuhkan, tambahkan secara backward-compatible.

BAGIAN D — SCHEMA DETAIL
D.1 radiobossStatus/current

Gunakan data yang sudah ada dari Gateway. Jika field lama sudah ada seperti online, gatewayOnline, playerState, jangan dihapus.

Tambahkan field baru jika diperlukan:

{
  gatewayId: "studio-main",

  online: true,
  gatewayOnline: true,
  playerState: "playing",

  radioBossOnline: true,
  apiReachable: true,
  playbackState: "playing",

  recordingActive: false,
  activeRecordingId: null,

  lastSyncAt: Timestamp,
  lastHeartbeatAt: Timestamp,
  latencyMs: 120,

  lastError: null,
  updatedAt: Timestamp
}

Frontend boleh melakukan mapping:

const radioBossOnline = status.radioBossOnline ?? status.online ?? false;
const gatewayOnline = status.gatewayOnline ?? false;
const playbackState = status.playbackState ?? status.playerState ?? "unknown";
D.2 radiobossNowPlaying/current
{
  title: "Separuh Aku",
  artist: "Noah",
  rawTitle: "Noah - Separuh Aku",

  duration: 240,
  position: 120,
  progressPercent: 50,

  nextTitle: null,
  nextArtist: null,

  source: "radioboss",
  updatedAt: Timestamp
}
D.3 programRecordingRules/{programId}
{
  programId: "pinrang-berkabar",
  programName: "Pinrang Berkabar",

  recordingEnabled: true,
  requireAttendance: true,

  autoStart: true,
  autoStop: true,
  allowManualOverride: true,

  startGraceMinutes: 15,
  stopGraceMinutes: 10,
  maxOverrunMinutes: 30,
  minDurationMinutes: 5,

  folderSlug: "Pinrang_Berkabar",
  format: "mp3",

  storageRootKey: "RADIO_SBL_RECORDING_ROOT",

  createdAt: Timestamp,
  createdBy: "adminUid",
  updatedAt: Timestamp,
  updatedBy: "adminUid"
}

Makna:

recordingEnabled: program ini boleh direkam.
requireAttendance: rekaman otomatis hanya berjalan jika penyiar sudah absensi valid.
autoStart: Gateway boleh mulai rekaman otomatis.
autoStop: Gateway boleh stop otomatis setelah program selesai.
allowManualOverride: admin/operator boleh start/stop manual.
startGraceMinutes: toleransi absensi sebelum/sesudah program mulai.
stopGraceMinutes: toleransi setelah program selesai.
maxOverrunMinutes: pengaman agar rekaman tidak berjalan terlalu lama.
folderSlug: nama folder penyimpanan.
format: format rekaman, default mp3.
D.4 programRecordings/{recordingId}
{
  recordingId: "rec-2026-06-03-0800-pinrang-berkabar",

  programId: "pinrang-berkabar",
  programName: "Pinrang Berkabar",

  scheduleId: "schedule-2026-06-03-0800",

  announcerId: "amar",
  announcerName: "Amar",

  status: "recording",

  plannedStartAt: Timestamp,
  plannedStopAt: Timestamp,

  startedAt: Timestamp,
  stoppedAt: null,

  durationSeconds: null,

  fileName: "2026-06-03_08-00_Pinrang_Berkabar_Amar.mp3",
  filePath: "E:\\RadioSBL_REKAMAN\\2026\\06\\Pinrang_Berkabar\\2026-06-03_08-00_Pinrang_Berkabar_Amar.mp3",

  gatewayId: "studio-main",
  source: "radioboss_streamarchive",

  startCommandId: "cmd_xxx",
  stopCommandId: null,

  errorCode: null,
  errorMessageSafe: null,

  createdAt: Timestamp,
  updatedAt: Timestamp
}

Status yang wajib didukung:

type RecordingStatus =
  | "waiting_schedule"
  | "waiting_attendance"
  | "ready"
  | "recording"
  | "stopping"
  | "stopped"
  | "completed"
  | "failed"
  | "skipped_no_attendance"
  | "skipped_disabled"
  | "manual_override"
  | "gateway_offline"
  | "radioboss_offline";
D.5 radiobossCommands/{commandId}
{
  type: "START_RECORDING",
  status: "pending",

  payload: {
    programId: "pinrang-berkabar",
    scheduleId: "schedule-2026-06-03-0800",
    announcerId: "amar",
    recordingId: null,
    reason: "manual_admin_start"
  },

  requestedBy: "adminUid",
  requestedByName: "Admin Radio SBL",
  requestedAt: Timestamp,

  priority: "normal",

  dedupeKey: "START_RECORDING_schedule-2026-06-03-0800",

  attempts: 0,
  maxAttempts: 3,

  lockedBy: null,
  lockedAt: null,

  executedAt: null,
  gatewayId: null,

  result: null,

  errorCode: null,
  errorMessageSafe: null,

  createdAt: Timestamp,
  updatedAt: Timestamp
}

Status command:

type RadiobossCommandStatus =
  | "pending"
  | "locked"
  | "executing"
  | "success"
  | "failed"
  | "retryable"
  | "cancelled"
  | "expired";

Jenis command awal:

type RadiobossCommandType =
  | "START_RECORDING"
  | "STOP_RECORDING"
  | "MARK_RECORDING_SKIPPED"
  | "RETRY_COMMAND"
  | "ADD_TRACK_TO_QUEUE"
  | "MARK_REQUEST_PLAYED";
D.6 songRequests/{requestId}
{
  requestId: "req_xxx",

  title: "Komang",
  artist: "Raim Laode",
  requesterName: "Andi",
  message: "Untuk teman-teman di Pinrang",

  status: "new",

  matchStatus: "unmatched",
  matchedTrackId: null,
  matchedFilePath: null,
  confidence: 0,

  sentToRadioBossAt: null,
  queuedAt: null,
  playedAt: null,

  rejectedBy: null,
  rejectedAt: null,
  rejectReason: null,

  createdAt: Timestamp,
  updatedAt: Timestamp,
  expiresAt: Timestamp
}

Status request lagu:

type SongRequestStatus =
  | "new"
  | "matched"
  | "needs_review"
  | "sent_to_radioboss"
  | "queued"
  | "played"
  | "rejected"
  | "expired";

Match status:

type SongRequestMatchStatus =
  | "unmatched"
  | "matched"
  | "ambiguous"
  | "not_found";
BAGIAN E — HALAMAN RADIOBOSS STATUS PANEL
E.1 Lokasi fitur

Tambahkan panel ringkas di Dashboard aplikasi Radio SBL.

Jika sudah ada Dashboard utama, tambahkan komponen:

src/components/radioboss/RadioBossStatusPanel.jsx
src/components/radioboss/GatewayHealthBadge.jsx
src/components/radioboss/NowPlayingCard.jsx
src/services/radiobossStatus.service.js

Sesuaikan ekstensi .jsx / .tsx dengan struktur proyek yang ada.

E.2 Data yang ditampilkan

Dashboard wajib menampilkan:

RadioBOSS: Online / Offline
Studio Gateway: Online / Offline
Now Playing: Judul - Penyanyi
Program Aktif: Nama program + jam
Penyiar Aktif: Nama penyiar + status absensi
Rekaman: Tidak direkam / Siap rekam / Sedang direkam / Gagal / Selesai
Request lagu: Masuk / Cocok / Perlu Review / Dikirim / Diputar

Contoh UI:

Program Aktif:
Pinrang Berkabar
08.00 - 09.00

Penyiar:
Amar — sudah absensi 07.52

RadioBOSS:
Online

Gateway:
Online

Rekaman:
Sedang direkam

File:
2026-06-03_08-00_Pinrang_Berkabar_Amar.mp3
E.3 Komponen status

Gunakan badge ringkas:

Online: hijau
Offline: merah lembut
Warning: kuning
Recording: biru/merah indikator aktif
Failed: merah
Waiting: abu/kuning

Jangan tampilkan error teknis mentah ke operator. Gunakan errorMessageSafe.

BAGIAN F — SERVICE FIRESTORE DI APLIKASI RADIO SBL

Buat service khusus agar komponen UI tidak langsung penuh query Firestore.

Contoh file:

src/services/radioboss/radiobossStatus.service.js
src/services/radioboss/recordingRules.service.js
src/services/radioboss/programRecordings.service.js
src/services/radioboss/radiobossCommands.service.js
src/services/radioboss/songRequests.service.js
F.1 radiobossStatus.service.js

Fungsi minimal:

export function subscribeRadioBossStatus(callback) {}
export function subscribeNowPlaying(callback) {}
export function subscribeGatewayHeartbeat(gatewayId, callback) {}
F.2 recordingRules.service.js

Fungsi minimal:

export async function getProgramRecordingRule(programId) {}
export async function upsertProgramRecordingRule(programId, data) {}
export function subscribeProgramRecordingRules(callback) {}
F.3 programRecordings.service.js

Fungsi minimal:

export function subscribeActiveProgramRecording(scheduleId, callback) {}
export function subscribeRecordingHistory(filters, callback) {}
export async function markRecordingSkipped(recordingId, reason) {}
F.4 radiobossCommands.service.js

Fungsi minimal:

export async function createStartRecordingCommand({
  programId,
  scheduleId,
  announcerId,
  requestedBy,
  requestedByName
}) {}

export async function createStopRecordingCommand({
  recordingId,
  requestedBy,
  requestedByName
}) {}

export async function createRetryCommand({
  commandId,
  requestedBy,
  requestedByName
}) {}

export async function createAddTrackToQueueCommand({
  requestId,
  trackId,
  filePath,
  requestedBy,
  requestedByName
}) {}

Setiap command wajib punya:

type
status: "pending"
payload
requestedBy
requestedAt
dedupeKey
attempts: 0
maxAttempts: 3
createdAt
updatedAt
BAGIAN G — RECORDING CONTROL PANEL
G.1 Tujuan

Halaman ini dipakai admin/operator untuk melihat status rekaman program aktif dan melakukan aksi manual jika diperlukan.

Komponen:

src/pages/radioboss/RecordingControlPage.jsx
src/components/radioboss/RecordingStatusCard.jsx
src/components/radioboss/RecordingManualActions.jsx
G.2 Tombol yang wajib ada

Untuk admin/operator:

Mulai Rekam Program Ini
Stop Rekaman
Tandai Tidak Perlu Direkam
Retry Command
G.3 Aturan tombol

Tombol Mulai Rekam Program Ini aktif jika:

Ada program aktif.
Gateway online.
RadioBOSS online.
Tidak ada recording aktif untuk schedule tersebut.
User memiliki role admin/operator.
Rule program mengizinkan recording atau manual override.

Tombol Stop Rekaman aktif jika:

Ada programRecordings dengan status recording.
User role admin/operator.
Gateway online.

Tombol Tandai Tidak Perlu Direkam aktif jika:

Status masih waiting_schedule, waiting_attendance, ready, atau failed.
Belum ada recording aktif.

Tombol Retry Command aktif jika:

Ada command status failed atau retryable.
attempts < maxAttempts.
G.4 Jangan langsung menjalankan RadioBOSS

Setiap tombol hanya membuat dokumen di radiobossCommands.

BAGIAN H — PROGRAM RECORDING RULES PAGE
H.1 Tujuan

Halaman ini dipakai admin mengatur program mana yang boleh direkam otomatis.

File:

src/pages/radioboss/ProgramRecordingRulesPage.jsx
src/components/radioboss/ProgramRecordingRuleForm.jsx
src/components/radioboss/ProgramRecordingRuleList.jsx
H.2 Field form

Wajib ada:

Program
Recording Enabled
Require Attendance
Auto Start
Auto Stop
Allow Manual Override
Start Grace Minutes
Stop Grace Minutes
Max Overrun Minutes
Folder Slug
Format

Default:

{
  recordingEnabled: false,
  requireAttendance: true,
  autoStart: false,
  autoStop: true,
  allowManualOverride: true,
  startGraceMinutes: 15,
  stopGraceMinutes: 10,
  maxOverrunMinutes: 30,
  minDurationMinutes: 5,
  format: "mp3"
}

Jangan aktifkan semua program otomatis. Default harus aman: recordingEnabled: false.

BAGIAN I — RECORDING HISTORY PAGE
I.1 Tujuan

Menampilkan riwayat rekaman program.

File:

src/pages/radioboss/RecordingHistoryPage.jsx
src/components/radioboss/RecordingHistoryTable.jsx
src/components/radioboss/RecordingHistoryFilters.jsx
I.2 Filter

Minimal:

Tanggal
Program
Penyiar
Status
Gateway
I.3 Kolom tabel
Tanggal
Program
Penyiar
Jam mulai
Jam selesai
Durasi
Status
File
Gateway
Error aman
I.4 Catatan file rekaman

FilePath adalah path lokal PC studio. Jangan paksa frontend membuka file langsung kecuali nanti ada mekanisme upload/cloud storage.

Untuk tahap awal, tampilkan sebagai teks:

D:\RadioSBL_REKAMAN\2026\06\Pinrang_Berkabar\...

Tambahkan tombol Salin Path.

BAGIAN J - SONG REQUEST INSPECTOR
J.1 Prinsip utama

Request lagu diteruskan ke RadioBOSS tanpa proses approve wajib di aplikasi Radio SBL.

Jangan auto-play request pendengar.

Review atau eksekusi tetap dilakukan di RadioBOSS melalui daftar Song Requests. Studio Gateway hanya menjadi jembatan background/autostart yang mencocokkan file, memvalidasi path, meneruskan request, dan menulis audit log.

Alur:

Request masuk
-> status new
-> sistem/gateway cocokkan ke katalog
-> status matched / needs_review
-> jika matched confidence tinggi, command ADD_TRACK_TO_QUEUE dibuat otomatis
-> Gateway kirim action songrequest ke RadioBOSS
-> status sent_to_radioboss / queued
-> operator review/eksekusi di RadioBOSS
-> played jika sudah terdeteksi/ditandai diputar
J.2 Halaman
src/pages/radioboss/SongRequestReviewPage.jsx
src/components/radioboss/SongRequestQueue.jsx
src/components/radioboss/SongRequestCard.jsx
src/components/radioboss/SongRequestMatchPanel.jsx
J.3 Tombol inspeksi

Halaman aplikasi tidak menjadi langkah approve wajib. Tombol berikut hanya untuk inspeksi, override, atau troubleshooting:

Cocokkan ke Library
Kirim ulang ke RadioBOSS
Tandai Diputar
Tolak Request
Cari File Manual
J.4 Status handling
new: request baru masuk.
matched: sistem menemukan kandidat cocok.
sent_to_radioboss: command sudah dibuat untuk Gateway.
queued: lagu sudah masuk daftar Song Requests RadioBOSS.
played: sudah diputar.
rejected: ditolak.
expired: melewati batas waktu.
J.5 Jangan mengarang metadata

Jika title/artist tidak cocok dengan library, jangan memaksa.

Jika confidence rendah:

status = "needs_review";
matchStatus = "ambiguous";
BAGIAN K — GATEWAY HEALTH MONITOR
K.1 Tujuan

Menampilkan apakah Studio Gateway aktif.

Gunakan:

radiobossGatewayHeartbeat/{gatewayId}

UI status:

Online jika lastHeartbeatAt kurang dari 2x interval heartbeat.
Warning jika heartbeat telat.
Offline jika heartbeat tidak update.
K.2 Tampilan

Tampilkan:

Gateway ID
Status
Last Heartbeat
Versi Gateway jika tersedia
PC Studio jika tersedia
Error terakhir jika ada
BAGIAN L — RADIOBOSS AUDIT LOG
L.1 Tujuan

Menampilkan log operasional penting.

Gunakan:

radiobossAuditLogs

Tambahkan log baru untuk:

Command dibuat
Command dikunci Gateway
Command sukses
Command gagal
Recording mulai
Recording stop
Recording skipped
Request lagu dikirim ke queue
Gateway offline
RadioBOSS offline
L.2 Jangan tampilkan data sensitif

Audit log tidak boleh menampilkan:

Password RadioBOSS
Token Firebase
Raw stack trace penuh
Path rahasia di luar kebutuhan operasional

Gunakan errorMessageSafe.

BAGIAN M — UPGRADE STUDIO GATEWAY

Repository: studio-gateway.

Saat ini Gateway sudah membaca RadioBOSS dan menulis status ke Firestore. Jangan hilangkan fungsi monitoring yang sudah ada.

Tambahkan fitur command executor secara bertahap.

M.1 Struktur file baru

Tambahkan file:

src/commands/commandTypes.ts
src/commands/commandWorker.ts
src/commands/commandValidator.ts
src/commands/commandLock.ts
src/commands/safeCommandAllowlist.ts

src/recording/recordingManager.ts
src/recording/recordingRules.service.ts
src/recording/recordingFilename.ts
src/recording/recordingStatus.service.ts

src/radioboss/radiobossCommandClient.ts

src/schedule/scheduleReader.ts
src/attendance/attendanceReader.ts

src/songRequests/songRequestWorker.ts
src/songRequests/musicLibraryMatcher.ts

Jika struktur existing berbeda, sesuaikan, tetapi pisahkan tanggung jawabnya dengan jelas.

M.2 commandWorker.ts

Tugas:

Poll radiobossCommands dengan status pending atau retryable.
Ambil command tertua.
Lock command dengan transaction.
Validasi type.
Jalankan handler.
Update status command.
Tulis audit log.

Pseudo-flow:

async function processPendingCommands() {
  const commands = await getPendingCommands();

  for (const command of commands) {
    const locked = await tryLockCommand(command.id, gatewayId);
    if (!locked) continue;

    try {
      await markExecuting(command.id);

      const result = await executeAllowedCommand(command);

      await markSuccess(command.id, result);
      await writeAuditLog("command_success", command, result);
    } catch (error) {
      await markFailedOrRetryable(command.id, error);
      await writeAuditLog("command_failed", command, toSafeError(error));
    }
  }
}
M.3 Lock command

Command lock wajib agar dua Gateway tidak mengeksekusi command yang sama.

Field lock:

{
  status: "locked",
  lockedBy: "studio-main",
  lockedAt: Timestamp
}

Gunakan transaction Firestore:

Baca command.
Jika status bukan pending atau retryable, batal.
Jika lockedBy sudah ada dan belum timeout, batal.
Update status menjadi locked.
M.4 Handler START_RECORDING

Alur:

Validasi payload berisi programId dan scheduleId.
Cek RadioBOSS online.
Ambil recording rule.
Ambil jadwal.
Ambil absensi jika requireAttendance = true.
Buat atau update programRecordings.
Generate filename.
Jalankan RadioBOSS streamarchive.
Update programRecordings.status = recording.
Update radiobossStatus/current.recordingActive = true.

Command RadioBOSS yang digunakan:

streamarchive FILENAME

Atau jika ingin durasi tetap:

streamarchive DURATION FILENAME

Namun tahap awal gunakan start manual + stop terpisah agar lebih mudah dikontrol.

M.5 Handler STOP_RECORDING

Alur:

Validasi payload berisi recordingId.
Ambil programRecordings/{recordingId}.
Pastikan status recording.
Jalankan:
streamarchive off
Update status:
stopped
completed jika tidak ada error
Isi stoppedAt.
Hitung durationSeconds.
Update radiobossStatus/current.recordingActive = false.
M.6 Handler ADD_TRACK_TO_QUEUE

Tahap awal jangan auto-play.

Gunakan action RadioBOSS `songrequest` agar lagu masuk ke daftar Song Requests RadioBOSS untuk direview atau dieksekusi dari RadioBOSS.

Validasi filePath.
Pastikan file ada di PC studio.
Pastikan path berada di folder library yang diizinkan.
Jangan jalankan jika file tidak valid.
Update songRequests menjadi queued jika RadioBOSS mengembalikan OK.

Jangan membuat command yang langsung memotong siaran berjalan.

M.7 Safe path validation

Untuk rekaman:

Root folder wajib dari .env:
RADIO_SBL_RECORDING_ROOT=D:\RadioSBL_REKAMAN

Untuk music library:

RADIO_SBL_MUSIC_LIBRARY_ROOT=D:\RadioSBL_AUDIO

Gateway wajib memastikan file/folder hasil join tetap berada di root yang diizinkan.

Jangan izinkan path traversal:

..\..\Windows\System32
M.8 Filename rekaman

Buat helper:

buildRecordingFileName({
  date,
  startTime,
  programName,
  announcerName,
  format
})

Format:

YYYY-MM-DD_HH-mm_Program_Name_Announcer_Name.mp3

Contoh:

2026-06-03_08-00_Pinrang_Berkabar_Amar.mp3

Folder:

D:\RadioSBL_REKAMAN\2026\06\Pinrang_Berkabar\

Sanitasi nama:

Spasi menjadi underscore.
Hapus karakter Windows ilegal:
<
>
:
"
/
\
|
?
*
BAGIAN N — AUTO RECORDING MANAGER
N.1 Tujuan

Gateway otomatis memulai/stop rekaman berdasarkan:

Jadwal aktif
Rule program
Absensi masuk/pulang penyiar terjadwal
Status RadioBOSS online
Status Gateway aktif
N.2 Loop

Jalankan setiap 30–60 detik.

Pseudo-flow:

async function evaluateAutoRecording() {
  const now = new Date();

  const activeSchedules = await getSchedulesNearNow(now);

  for (const schedule of activeSchedules) {
    const rule = await getRecordingRule(schedule.programId);

    if (!rule?.recordingEnabled) {
      await markSkippedDisabled(schedule);
      continue;
    }

    if (!rule.autoStart) {
      await markReadyManual(schedule);
      continue;
    }

    const attendance = await findAttendanceForScheduledAnnouncer(schedule);

    if (rule.requireAttendance) {
      if (!isValidAttendanceForRecordingStart(attendance)) {
        await markWaitingAttendance(schedule);
        continue;
      }
    }

    if (!radioBossOnline) {
      await markRadioBossOffline(schedule);
      continue;
    }

    if (!hasActiveRecording(schedule.id)) {
      await createSystemStartRecordingCommand(schedule);
    }
  }

  await stopRecordingsFromAttendanceCheckout(now);
  await stopOverdueRecordingsAsFallback(now);
}
N.3 Kondisi start

Start otomatis hanya jika:

recordingEnabled = true
autoStart = true
Jadwal adalah program utama dengan penyiar SBL yang dikenali.
Check-in penyiar terjadwal ditemukan.
Waktu check-in berada pada tanggal lokal yang sama dan masih dalam batas startGraceMinutes dari programStart.
Jika requireAttendance = true, absensi valid ditemukan.
Tidak ada recording aktif untuk schedule itu.
RadioBOSS online.
Tidak ada command START_RECORDING pending untuk schedule yang sama.
N.4 Kondisi stop

Stop otomatis jika:

Recording status recording.
Penyiar terjadwal melakukan check-out pada record absensi yang memulai/menjaga recording.
Buat command STOP_RECORDING.

Fallback stop tetap wajib jika penyiar lupa check-out:

Waktu sekarang melewati programEnd + stopGraceMinutes.
Atau melewati programStart + durasi program + maxOverrunMinutes.
N.5 Absensi valid

Gateway membaca absensi dari collection aplikasi Radio SBL yang sudah ada.

Jika struktur absensi belum baku, buat adapter:

type NormalizedAttendance = {
  announcerId: string;
  announcerName: string;
  date: string;
  checkInAt: Date;
  status: "present" | "late" | "absent" | "permission" | "sick";
  validationStatus: "valid" | "invalid" | "pending";
  locationValid?: boolean;
  selfieValid?: boolean;
};

Valid jika:

Untuk schema aplikasi Radio SBL saat ini, `attendanceRecords` belum memiliki field `validationStatus`.
Gateway harus memakai adapter `attendanceReader.ts` dan tidak membaca kontrak contoh ini secara literal.

Mapping aman untuk Radio SBL:

```txt
Valid untuk start recording:
- record.userId cocok dengan UID/WhatsApp/airName/displayName penyiar terjadwal.
- record.checkInAt berada pada tanggal lokal yang sama dengan jadwal.
- record.status termasuk: "present", "late", atau "valid".
- record.checkOutAt belum terisi.
- record.status tidak termasuk: "rejected", "sick", "leave".
- Untuk status "outside_radius" atau "needs_review", jangan auto start kecuali admin/operator mengizinkan manual override.
```

Catatan penting:

```txt
- `checkOutAt` menandakan tugas/absensi penyiar selesai, tetapi tidak boleh langsung menjadi trigger STOP_RECORDING.
- Stop otomatis tetap berdasarkan programEnd + stopGraceMinutes atau maxOverrunMinutes.
- Jika recording sudah berjalan, perubahan `checkOutAt` tidak boleh mengubah dokumen attendanceRecords atau menghapus bukti absen.
- Jika Gateway ingin menampilkan "penyiar sudah pulang", tampilkan sebagai status informasi saja, bukan keputusan tunggal untuk stop recording.
```

Jika aplikasi memakai field berbeda, mapping di attendanceReader.ts, jangan ubah semua struktur absensi lama secara kasar.

BAGIAN O — FIRESTORE RULES

Tambahkan rules aman.

Prinsip:

Public user tidak boleh membuat radiobossCommands.
Hanya admin/operator/announcer tertentu yang boleh membuat command sesuai role.
Hanya Gateway service account yang boleh mengubah command menjadi success/failed.
Hanya Gateway service account yang boleh menulis radiobossStatus, radiobossNowPlaying, programRecordings hasil eksekusi.
Admin boleh mengelola programRecordingRules.
Request lagu boleh dibuat user sesuai kebijakan aplikasi, tetapi approval hanya admin/operator/penyiar.

Contoh konsep rules:

match /radiobossCommands/{commandId} {
  allow read: if isSignedIn() && hasOperationalAccess();

  allow create: if isSignedIn()
    && hasOperationalAccess()
    && request.resource.data.status == "pending"
    && request.resource.data.type in [
      "START_RECORDING",
      "STOP_RECORDING",
      "MARK_RECORDING_SKIPPED",
      "RETRY_COMMAND",
      "ADD_TRACK_TO_QUEUE",
      "MARK_REQUEST_PLAYED"
    ];

  allow update, delete: if false;
}

Catatan:

Service account Gateway menggunakan Firebase Admin SDK sehingga tidak dibatasi security rules. Tetap buat rules frontend ketat.

BAGIAN P — UI/UX KHUSUS RADIO SBL

Gunakan prinsip:

Mobile-first.
Operator harus bisa melihat status dalam 5 detik.
Tombol kritis jangan terlalu kecil.
Gunakan konfirmasi untuk Stop Rekaman dan Tolak Request.
Gunakan badge status yang mudah dibaca.
Jangan tampilkan terlalu banyak JSON mentah.
Error teknis tampil sebagai pesan manusiawi.

Contoh pesan:

Gateway offline:
"Studio Gateway tidak terhubung. Periksa aplikasi gateway di PC studio."
RadioBOSS offline:
"RadioBOSS tidak terdeteksi. Pastikan RadioBOSS berjalan dan API lokal aktif."
Absensi belum valid:
"Rekaman menunggu absensi penyiar yang valid."
Recording failed:
"Rekaman gagal dimulai. Silakan cek Gateway atau ulangi command."
BAGIAN Q — TESTING WAJIB
Q.1 Test frontend

Uji:

Dashboard tetap tampil saat Firestore data kosong.
Status RadioBOSS online/offline benar.
Gateway heartbeat telat ditampilkan offline.
Tombol manual tidak aktif jika role tidak sesuai.
Command yang dibuat memiliki schema lengkap.
Tidak ada fetch langsung ke RadioBOSS API dari frontend.

Cari di seluruh repo:

grep -R "127.0.0.1:9001" src
grep -R "localhost:9001" src
grep -R "radioboss" src

Pastikan tidak ada direct API call dari browser.

Q.2 Test Gateway

Uji:

Gateway tetap bisa polling now playing seperti sebelumnya.
Command pending bisa diproses.
Command invalid ditolak.
Command ganda tidak dieksekusi dua kali.
START_RECORDING membuat file name benar.
STOP_RECORDING mengubah status recording.
RadioBOSS offline menghasilkan radioboss_offline.
Gateway mati mengubah heartbeat offline.
Error tidak membocorkan password.
Q.3 Test skenario rekaman

Skenario 1:

Program recordingEnabled false.
Hasil: tidak direkam, status skipped_disabled.

Skenario 2:

Program recordingEnabled true.
requireAttendance true.
Penyiar belum absen.
Hasil: waiting_attendance.

Skenario 3:

Penyiar sudah absensi valid.
RadioBOSS online.
Hasil: ready lalu recording.

Skenario 4:

Recording berjalan.
Penyiar absen pulang.
Hasil: command STOP_RECORDING dibuat, status completed.

Skenario 4B:

Penyiar lupa absen pulang.
Program selesai + stopGraceMinutes atau melewati maxOverrunMinutes.
Hasil: command STOP_RECORDING dibuat sebagai fallback, status completed.

Skenario 5:

Admin klik Stop Rekaman.
Hasil: command STOP_RECORDING dibuat dan dieksekusi Gateway.
Q.4 Test request lagu

Skenario:

Request masuk status new.
Matching menemukan satu lagu confidence tinggi.
Status menjadi matched.
Command ADD_TRACK_TO_QUEUE dibuat otomatis.
Gateway memproses command.
Status menjadi sent_to_radioboss atau queued.

Jika confidence rendah:

Status needs_review.
Jangan kirim otomatis.
BAGIAN R — ACCEPTANCE CRITERIA

Upgrade dianggap berhasil jika:

Aplikasi Radio SBL bisa menampilkan RadioBOSS online/offline.
Aplikasi bisa menampilkan Studio Gateway online/offline.
Aplikasi bisa menampilkan Now Playing.
Admin bisa mengatur recording rules per program.
Admin bisa melihat recording history.
Admin bisa membuat command start/stop recording.
Gateway membaca command dan mengeksekusi aman.
Recording otomatis hanya berjalan jika rules dan absensi valid.
Request lagu masuk ke review queue.
Request lagu tidak auto-play.
Tidak ada panggilan RadioBOSS langsung dari browser.
Tidak ada password/token bocor di frontend.
Fitur lama aplikasi Radio SBL tidak rusak.
BAGIAN S — PRIORITAS EKSEKUSI

Kerjakan bertahap. Jangan semua sekaligus.

Tahap 1 — Monitoring UI

Di repo radiosbl:

Tambahkan RadioBOSS Status Panel.
Tambahkan Gateway Health Monitor.
Tambahkan Now Playing Card.
Tambahkan service Firestore status.
Jangan ubah Gateway dulu kecuali perlu field minor.
Tahap 2 — Recording Rules dan History

Di repo radiosbl:

Tambahkan programRecordingRules.
Tambahkan halaman pengaturan recording per program.
Tambahkan programRecordings.
Tambahkan halaman history.
Tahap 3 — Manual Command Queue

Di repo radiosbl:

Tambahkan tombol manual start/stop.
Tombol hanya membuat radiobossCommands.

Di repo studio-gateway:

Tambahkan command worker.
Tambahkan allowlist.
Tambahkan handler START_RECORDING dan STOP_RECORDING.
Tahap 4 — Auto Recording

Di repo studio-gateway:

Tambahkan recording manager.
Baca jadwal.
Baca absensi.
Baca recording rules.
Buat command otomatis jika semua valid.
Tahap 5 - Request Lagu Auto-Forward ke RadioBOSS

Di repo radiosbl:

Tambahkan Song Request Inspector.
Tambahkan status lengkap.
Tambahkan tombol inspeksi/override, bukan approve wajib.

Di repo studio-gateway:

Tambahkan matcher library.
Tambahkan handler ADD_TRACK_TO_QUEUE.
Jangan auto-play.
BAGIAN T — CATATAN FINAL UNTUK DEVELOPER

Jangan mengejar fitur kontrol penuh RadioBOSS dulu.

Fokus awal:

Monitoring stabil.
Command queue aman.
Manual recording aman.
Auto recording berbasis rules + absensi.
Request lagu auto-forward ke daftar Song Requests RadioBOSS.

Pertahankan prinsip:

Aplikasi Radio SBL = pusat operasional.
Firestore = jalur data dan command queue.
Studio Gateway = eksekutor aman.
RadioBOSS = mesin siaran lokal.

Jangan pernah membuat browser menjadi pengendali langsung RadioBOSS.


Catatan penting: istilah yang lebih tepat bukan “upgrade aplikasi RadioBoss”, tetapi **upgrade integrasi RadioBOSS pada ekosistem Radio SBL**. RadioBOSS tetap mesin siaran lokal; yang di-upgrade adalah **Aplikasi Radio SBL + Studio Gateway + Firestore command queue**.
::contentReference[oaicite:1]{index=1}
