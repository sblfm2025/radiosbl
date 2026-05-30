# Tahap 2 - Engagement Pendengar

## Tujuan
Meningkatkan interaksi pendengar dengan studio tanpa membuat chat bebas yang sulit dimoderasi.

## Fitur Tahap Ini

1. Request lagu berstatus.
2. Salam udara/dedikasi.
3. Polling siaran.
4. Inbox studio untuk operator.

## Prinsip Implementasi

- Jangan hapus fitur request lagu lama sebelum migrasi aman.
- Jika ada request lama, tetap tampil.
- Semua pesan pendengar harus masuk antrian/moderasi.
- Tidak ada pesan yang langsung tayang publik tanpa approval.
- Jangan aktifkan live chat bebas pada tahap ini.

## Struktur File

```txt
src/features/engagement/components/RequestSongFormV2.tsx
src/features/engagement/components/DedicationForm.tsx
src/features/engagement/components/StudioInboxPanel.tsx
src/features/engagement/components/PollWidget.tsx
src/features/engagement/pages/StudioInboxPage.tsx
src/features/engagement/services/requestSongStatus.service.ts
src/features/engagement/services/dedication.service.ts
src/features/engagement/services/poll.service.ts
```

## 1. Request Lagu Berstatus

### Status

```txt
submitted
read
queued
played
rejected
archived
```

### Firestore Collection Baru

```txt
songRequestsV2/{requestId}
```

Field:

```ts
{
  requestId: string;
  senderName?: string;
  songTitle: string;
  artistName?: string;
  message?: string;
  targetProgramId?: string;
  targetProgramTitle?: string;
  status: 'submitted' | 'read' | 'queued' | 'played' | 'rejected' | 'archived';
  statusNote?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  readAt?: Timestamp;
  playedAt?: Timestamp;
  rejectedAt?: Timestamp;
  handledBy?: string;
}
```

### UI Pendengar

Setelah submit tampilkan:

```txt
Request terkirim. Operator akan memeriksa sebelum diputar.
```

Jika user punya ID tracking, tampilkan status.

### UI Operator

Inbox dengan tab:

- Baru.
- Dibaca.
- Antrian.
- Diputar.
- Ditolak.
- Arsip.

Aksi operator:

- Tandai dibaca.
- Masukkan antrian.
- Tandai diputar.
- Tolak dengan alasan.
- Arsipkan.

## 2. Salam Udara / Dedikasi

### Collection

```txt
dedications/{dedicationId}
```

Field:

```ts
{
  dedicationId: string;
  senderName?: string;
  recipientName?: string;
  message: string;
  targetProgramId?: string;
  targetProgramTitle?: string;
  isAnonymous: boolean;
  status: 'submitted' | 'approved' | 'readOnAir' | 'rejected' | 'archived';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  handledBy?: string;
  statusNote?: string;
}
```

### Validasi

- Pesan maksimal 300 karakter.
- Nama maksimal 60 karakter.
- Blokir teks kosong.
- Jangan tampilkan otomatis sebelum approval.

## 3. Polling Siaran

### Collection

```txt
broadcastPolls/{pollId}
broadcastPolls/{pollId}/votes/{voteId}
```

Poll field:

```ts
{
  pollId: string;
  title: string;
  description?: string;
  options: Array<{ id: string; label: string }>;
  status: 'draft' | 'active' | 'closed';
  targetProgramId?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  closedAt?: Timestamp;
}
```

Vote field:

```ts
{
  voteId: string;
  optionId: string;
  anonymousSessionId?: string;
  userId?: string;
  createdAt: Timestamp;
}
```

### Aturan

- Satu user/session satu vote per poll.
- Poll draft tidak tampil publik.
- Poll closed hanya tampil hasil.

## 4. Studio Inbox

Buat halaman admin/operator:

```txt
/admin/studio-inbox
```

Tampilkan kartu ringkas:

- Request lagu baru.
- Salam udara baru.
- Poll aktif.
- Request/antrian yang belum diproses.

## Role Akses

- Admin: semua akses.
- Operator: baca dan proses request/salam.
- Penyiar: baca antrian dan tandai sudah dibaca on-air jika diizinkan.
- User biasa: submit saja.

## Testing Tahap 2

```bash
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Manual:

- [ ] Request lama tetap bisa diakses.
- [ ] Request V2 bisa submit.
- [ ] Status request bisa berubah.
- [ ] User biasa tidak bisa mengubah status.
- [ ] Operator bisa proses request.
- [ ] Salam udara masuk moderasi.
- [ ] Pesan tidak tampil publik sebelum approval.
- [ ] Poll aktif bisa divote.
- [ ] Satu user/session tidak bisa vote berkali-kali.
- [ ] Studio Inbox mobile rapi.

## Rollback

Matikan flag:

```ts
listenerEngagement: false
```

Jangan hapus data request lama.
