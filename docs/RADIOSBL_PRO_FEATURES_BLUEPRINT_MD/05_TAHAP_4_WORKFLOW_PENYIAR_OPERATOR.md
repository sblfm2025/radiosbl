# Tahap 4 - Workflow Penyiar dan Operator

## Tujuan
Membuat aplikasi Radio SBL lebih kuat sebagai sistem kerja internal studio: penyiar lebih siap, operator lebih rapi, dan riwayat siaran terdokumentasi.

## Fitur Tahap Ini

1. Rundown siaran digital.
2. Checklist pra-siaran.
3. Log siaran harian.
4. Handover shift.
5. Script board terhubung AI naskah.

## Prinsip Implementasi

- Jangan mengubah AI naskah lama secara langsung.
- Jangan memaksa semua program punya rundown.
- Workflow harus membantu, bukan menambah beban.
- Semua form harus mobile-friendly.
- Default status draft, bukan langsung final.

## Struktur File

```txt
src/features/broadcastWorkflow/pages/RundownPage.tsx
src/features/broadcastWorkflow/pages/BroadcastLogPage.tsx
src/features/broadcastWorkflow/pages/HandoverPage.tsx
src/features/broadcastWorkflow/components/RundownEditor.tsx
src/features/broadcastWorkflow/components/PreBroadcastChecklist.tsx
src/features/broadcastWorkflow/components/BroadcastLogForm.tsx
src/features/broadcastWorkflow/components/HandoverCard.tsx
src/features/broadcastWorkflow/components/ScriptBoard.tsx
src/features/broadcastWorkflow/services/rundown.service.ts
src/features/broadcastWorkflow/services/broadcastLog.service.ts
src/features/broadcastWorkflow/services/handover.service.ts
```

## 1. Rundown Siaran Digital

### Collection

```txt
broadcastRundowns/{rundownId}
```

Field:

```ts
{
  rundownId: string;
  programId: string;
  programTitle: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  hostIds: string[];
  operatorId?: string;
  status: 'draft' | 'ready' | 'onAir' | 'completed' | 'archived';
  segments: Array<{
    id: string;
    order: number;
    title: string;
    type: 'opening' | 'talk' | 'music' | 'news' | 'ads' | 'psa' | 'interview' | 'closing' | 'other';
    plannedDurationMinutes?: number;
    notes?: string;
    scriptId?: string;
  }>;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### UI

Rundown editor:

- Tambah segmen.
- Ubah urutan segmen.
- Pilih tipe segmen.
- Tambah catatan.
- Link ke naskah AI jika ada.
- Tombol “Tandai Siap Siar”.

## 2. Checklist Pra-Siaran

### Collection

```txt
preBroadcastChecklists/{checklistId}
```

Field:

```ts
{
  checklistId: string;
  programId: string;
  programTitle: string;
  date: string;
  items: Array<{
    id: string;
    label: string;
    checked: boolean;
    checkedBy?: string;
    checkedAt?: Timestamp;
  }>;
  status: 'draft' | 'ready' | 'issue_found';
  issueNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Default Checklist

- Mic ready.
- Mixer ready.
- Stream ready.
- Playlist ready.
- Rundown ready.
- Naskah ready.
- WhatsApp studio ready.
- Recorder ready.
- Operator ready.
- Penyiar ready.

## 3. Log Siaran Harian

### Collection

```txt
broadcastLogs/{logId}
```

Field:

```ts
{
  logId: string;
  programId: string;
  programTitle: string;
  date: string;
  actualStartTime?: string;
  actualEndTime?: string;
  hostIds: string[];
  operatorId?: string;
  topics: string[];
  songsPlayed?: Array<{ title: string; artist?: string }>;
  guestNames?: string[];
  technicalIssues?: string;
  publicFeedbackSummary?: string;
  documentationLinks?: string[];
  status: 'draft' | 'submitted' | 'reviewed' | 'archived';
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### UI

Form harus singkat:

- Program.
- Tanggal.
- Jam aktual.
- Topik.
- Kendala teknis.
- Catatan penting.
- Link dokumentasi.

Jangan terlalu banyak field wajib.

## 4. Handover Shift

### Collection

```txt
shiftHandovers/{handoverId}
```

Field:

```ts
{
  handoverId: string;
  date: string;
  fromUserId: string;
  toUserId?: string;
  shiftLabel?: string;
  notes: string;
  pendingRequests?: string[];
  technicalNotes?: string;
  priority: 'low' | 'normal' | 'high';
  status: 'open' | 'acknowledged' | 'resolved';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  acknowledgedBy?: string;
  acknowledgedAt?: Timestamp;
}
```

## 5. Script Board

Jangan ubah AI generator lama. Tambahkan layar daftar naskah:

- Draft.
- Siap siar.
- Sudah dipakai.
- Arsip.

Jika naskah AI lama punya collection sendiri, jangan migrasi otomatis. Buat adapter read-only dulu.

## Role Akses

- Admin: semua.
- Penyiar: buat/edit rundown miliknya, isi log, baca handover.
- Operator: checklist, log teknis, handover.
- Viewer pimpinan: baca log dan summary saja.

## Testing Tahap 4

```bash
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Manual:

- [ ] Jadwal siaran lama tetap tampil.
- [ ] AI naskah lama tetap generate.
- [ ] Rundown bisa dibuat.
- [ ] Checklist bisa dicentang.
- [ ] Log siaran bisa disimpan.
- [ ] Handover bisa dibuat dan acknowledged.
- [ ] User biasa tidak bisa mengakses workflow internal.
- [ ] Mobile form tidak terlalu panjang dan tidak terpotong.

## Rollback

Matikan flag:

```ts
broadcastWorkflow: false
```
