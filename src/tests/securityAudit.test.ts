import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  normalizeRole,
  getActionPolicy,
  hasDirectPermission
} from "../features/securityAudit/utils/roleGuards";
import {
  writeAuditLog,
  readLocalAuditLogs,
  writeLocalAuditLogs
} from "../features/securityAudit/services/auditLog.service";
import {
  createApprovalRequest,
  processApprovalRequest,
  readLocalApprovals
} from "../features/securityAudit/services/approval.service";
import type { SecurityAuditLog } from "../types/domain";

// ── Membuat in-memory localStorage ──────────────────────────────────────────

function createMemoryStorage(): Storage {
  let store: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    clear() {
      store = {};
    },
    getItem(key: string) {
      return store[key] ?? null;
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null;
    },
    removeItem(key: string) {
      delete store[key];
    },
    setItem(key: string, value: string) {
      store[key] = value;
    }
  };
}

// ── Suite Utama ──────────────────────────────────────────────────────────────

describe("Security Audit — Role Guards", () => {
  describe("normalizeRole()", () => {
    it("memetakan role 'admin' ke 'super_admin'", () => {
      expect(normalizeRole("admin")).toBe("super_admin");
    });

    it("memetakan role 'penyiar' ke 'announcer'", () => {
      expect(normalizeRole("penyiar")).toBe("announcer");
    });

    it("mengembalikan nilai asli jika role tidak dikenal", () => {
      expect(normalizeRole("unknown_role")).toBe("unknown_role");
    });
  });

  describe("getActionPolicy()", () => {
    it("super_admin boleh melakukan semua aksi tanpa persetujuan", () => {
      expect(getActionPolicy("admin", "manage_users")).toEqual({
        allowed: true,
        requiresApproval: false
      });
      expect(getActionPolicy("admin", "delete_analytics")).toEqual({
        allowed: true,
        requiresApproval: false
      });
    });

    it("leader tidak diizinkan mengelola user atau menghapus analytics", () => {
      expect(getActionPolicy("leader", "manage_users")).toEqual({
        allowed: false,
        requiresApproval: false
      });
      expect(getActionPolicy("leader", "delete_analytics")).toEqual({
        allowed: false,
        requiresApproval: false
      });
    });

    it("leader boleh melakukan aksi lain tanpa persetujuan", () => {
      expect(getActionPolicy("leader", "publish_content")).toEqual({
        allowed: true,
        requiresApproval: false
      });
    });

    it("operator perlu persetujuan untuk publish_content", () => {
      expect(getActionPolicy("operator", "publish_content")).toEqual({
        allowed: true,
        requiresApproval: true
      });
    });

    it("operator perlu persetujuan untuk send_notification", () => {
      expect(getActionPolicy("operator", "send_notification")).toEqual({
        allowed: true,
        requiresApproval: true
      });
    });

    it("operator boleh langsung mengelola request lagu tanpa persetujuan", () => {
      expect(getActionPolicy("operator", "manage_requests")).toEqual({
        allowed: true,
        requiresApproval: false
      });
    });

    it("penyiar boleh langsung mengelola dan mengarsipkan request lagu", () => {
      expect(getActionPolicy("penyiar", "manage_requests")).toEqual({
        allowed: true,
        requiresApproval: false
      });
      expect(getActionPolicy("penyiar", "archive_request")).toEqual({
        allowed: true,
        requiresApproval: false
      });
    });

    it("penyiar tidak diizinkan publish_content", () => {
      expect(getActionPolicy("penyiar", "publish_content")).toEqual({
        allowed: false,
        requiresApproval: false
      });
    });

    it("role tidak dikenal ditolak untuk semua aksi", () => {
      expect(getActionPolicy("pegawai_baru", "publish_content")).toEqual({
        allowed: false,
        requiresApproval: false
      });
    });
  });

  describe("hasDirectPermission()", () => {
    it("mengembalikan true jika diizinkan dan tidak butuh approval", () => {
      expect(hasDirectPermission("operator", "manage_requests")).toBe(true);
    });

    it("mengembalikan false jika memerlukan approval", () => {
      expect(hasDirectPermission("operator", "publish_content")).toBe(false);
    });

    it("mengembalikan false jika tidak diizinkan sama sekali", () => {
      expect(hasDirectPermission("penyiar", "manage_users")).toBe(false);
    });
  });
});

// ── Suite Audit Log ──────────────────────────────────────────────────────────

describe("Security Audit — Audit Log Service", () => {
  const storage = createMemoryStorage();

  beforeEach(() => {
    vi.restoreAllMocks();
    storage.clear();
    vi.stubGlobal("window", {
      localStorage: storage,
      dispatchEvent: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    });
    vi.stubGlobal("localStorage", storage);
  });

  it("dapat menulis audit log dan membacanya kembali", async () => {
    const result = await writeAuditLog({
      actorUserId: "user-operator-1",
      actorName: "Budi Operator",
      actorRole: "operator",
      action: "publish_content",
      targetCollection: "episodes",
      targetId: "ep-12345",
      after: { title: "Episode Test" }
    });

    expect(result.id).toBeDefined();
    expect(result.action).toBe("publish_content");
    expect(result.actorUserId).toBe("user-operator-1");
    expect(result.createdAt).toBeDefined();

    const logs = readLocalAuditLogs();
    expect(logs.length).toBe(1);
    expect(logs[0]!.action).toBe("publish_content");
  });

  it("dapat menulis beberapa log dan mempertahankan urutan terbaru lebih dulu", async () => {
    await writeAuditLog({
      actorUserId: "user-1",
      action: "create_rundown",
      targetCollection: "broadcastRundowns",
      targetId: "rd-1"
    });

    await writeAuditLog({
      actorUserId: "user-2",
      action: "update_rundown",
      targetCollection: "broadcastRundowns",
      targetId: "rd-1"
    });

    const logs = readLocalAuditLogs();
    expect(logs.length).toBe(2);
    // Log terbaru harus ada di awal
    expect(logs[0]!.action).toBe("update_rundown");
    expect(logs[1]!.action).toBe("create_rundown");
  });

  it("tidak error saat auditLog gagal ditulis (fail-safe)", async () => {
    // Simulasikan localStorage.setItem melempar error
    const errStorage = createMemoryStorage();
    vi.stubGlobal("window", {
      localStorage: {
        ...errStorage,
        setItem: () => { throw new Error("Storage penuh!"); }
      },
      dispatchEvent: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    });

    // Tidak boleh throw error ke pemanggil
    await expect(writeAuditLog({
      actorUserId: "user-x",
      action: "delete_rundown",
      targetCollection: "broadcastRundowns",
      targetId: "rd-x"
    })).resolves.toBeDefined();
  });

  it("writeLocalAuditLogs membatasi penyimpanan maksimum 100 entri", () => {
    const banyakLog: SecurityAuditLog[] = Array.from({ length: 120 }, (_, i) => ({
      id: `audit-${i}`,
      actorUserId: `user-${i}`,
      action: "create_rundown",
      createdAt: new Date().toISOString()
    }));

    writeLocalAuditLogs(banyakLog);
    const dibaca = readLocalAuditLogs();
    expect(dibaca.length).toBeLessThanOrEqual(100);
  });
});

// ── Suite Approval Workflow ──────────────────────────────────────────────────

describe("Security Audit — Approval Workflow", () => {
  const storage = createMemoryStorage();

  beforeEach(() => {
    vi.restoreAllMocks();
    storage.clear();
    vi.stubGlobal("window", {
      localStorage: storage,
      dispatchEvent: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    });
    vi.stubGlobal("localStorage", storage);
  });

  it("dapat membuat approval request baru dengan status pending", async () => {
    const req = await createApprovalRequest({
      type: "public_content",
      title: "Publikasi Episode Talkshow Ramadan",
      payload: { episodeId: "ep-001", title: "Talkshow Ramadan" },
      requestedBy: "user-editor-1",
      requestedByName: "Siti Editor"
    });

    expect(req.status).toBe("pending");
    expect(req.id).toBeDefined();
    expect(req.type).toBe("public_content");

    const list = readLocalApprovals();
    expect(list.length).toBe(1);
    expect(list[0]!.requestedByName).toBe("Siti Editor");
  });

  it("dapat menyetujui approval request dan status berubah menjadi approved", async () => {
    const req = await createApprovalRequest({
      type: "notification",
      title: "Notifikasi Siaran Live",
      payload: { message: "Siaran live mulai pukul 08.00" },
      requestedBy: "user-operator-2",
      requestedByName: "Andi Operator"
    });

    await processApprovalRequest({
      approvalId: req.id,
      status: "approved",
      reviewerUserId: "user-leader-1",
      reviewerUserName: "Bapak Pimpinan",
      reviewerUserRole: "leader",
      reviewNote: "Disetujui. Segera laksanakan."
    });

    const list = readLocalApprovals();
    const updated = list.find((r) => r.id === req.id);
    expect(updated?.status).toBe("approved");
    expect(updated?.reviewedByName).toBe("Bapak Pimpinan");
    expect(updated?.reviewNote).toBe("Disetujui. Segera laksanakan.");
  });

  it("dapat menolak approval request dan status berubah menjadi rejected", async () => {
    const req = await createApprovalRequest({
      type: "public_content",
      title: "Konten yang Bermasalah",
      payload: { reason: "Konten perlu direvisi dahulu" },
      requestedBy: "user-editor-3",
      requestedByName: "Maya Editor"
    });

    await processApprovalRequest({
      approvalId: req.id,
      status: "rejected",
      reviewerUserId: "user-admin-1",
      reviewerUserName: "Admin Siaran",
      reviewerUserRole: "super_admin",
      reviewNote: "Belum memenuhi standar konten."
    });

    const list = readLocalApprovals();
    const updated = list.find((r) => r.id === req.id);
    expect(updated?.status).toBe("rejected");
    expect(updated?.reviewedBy).toBe("user-admin-1");
  });

  it("dapat membatalkan (cancel) approval request", async () => {
    const req = await createApprovalRequest({
      type: "public_content",
      title: "Episode yang Dibatalkan",
      payload: {},
      requestedBy: "user-editor-4",
      requestedByName: "Editor Baru"
    });

    await processApprovalRequest({
      approvalId: req.id,
      status: "cancelled",
      reviewerUserId: "user-editor-4",
      reviewerUserName: "Editor Baru",
      reviewerUserRole: "editor_konten"
    });

    const list = readLocalApprovals();
    const updated = list.find((r) => r.id === req.id);
    expect(updated?.status).toBe("cancelled");
  });

  it("membuat beberapa approval request dan mempertahankan semuanya", async () => {
    await createApprovalRequest({
      type: "public_content",
      title: "Request 1",
      payload: {},
      requestedBy: "user-a",
      requestedByName: "User A"
    });

    await createApprovalRequest({
      type: "notification",
      title: "Request 2",
      payload: {},
      requestedBy: "user-b",
      requestedByName: "User B"
    });

    const list = readLocalApprovals();
    expect(list.length).toBe(2);
  });
});
