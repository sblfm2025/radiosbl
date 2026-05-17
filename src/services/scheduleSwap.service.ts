import {
  addDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  getDoc,
  onSnapshot,
  serverTimestamp,
  type Query
} from "firebase/firestore";
import { getFirebaseFirestore } from "../lib/firebase";
import {
  getScheduleSlotId,
  getWeeklySchedule,
  saveScheduleOverrideRemote
} from "./scheduleSlot.service";
import {
  buildWhatsAppDeepLink,
  sendWhatsAppNotification
} from "./whatsappNotification.service";
import { hasFirebaseConfig } from "../lib/env";
import { getDocument } from "./firestore.service";
import { announcers as localAnnouncers } from "../data/radioData";
import type { ScheduleSwapRequest, AppUser, BroadcastProgramSlot } from "../types/domain";

const COLLECTION_NAME = "schedule_swaps";
const LOCAL_SWAPS_KEY = "sbl_schedule_swaps";
const LOCAL_OVERRIDES_KEY = "sbl_schedule_swap_overrides";
const LOCAL_SWAPS_CHANGED_EVENT = "sbl_schedule_swaps_changed";

export type ScheduleSwapSubmissionResult = {
  id: string;
  notificationText: string;
  targetWhatsapp?: string;
  whatsappUrl?: string;
  whatsappDelivered: boolean;
  whatsappFallbackReason?: string;
};

type ScheduleSwapNotificationContext = {
  requester: Pick<AppUser, "displayName" | "airName">;
  targetAnnouncer?: Pick<AppUser, "id" | "displayName" | "airName" | "whatsapp"> | null;
  confirmationUrl?: string;
};

function shouldUseLocalSwapStore(): boolean {
  return import.meta.env.MODE === "test" || !hasFirebaseConfig();
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readLocalSwaps(): ScheduleSwapRequest[] {
  const storage = getLocalStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(LOCAL_SWAPS_KEY);
    return raw ? (JSON.parse(raw) as ScheduleSwapRequest[]) : [];
  } catch {
    return [];
  }
}

function writeLocalSwaps(swaps: ScheduleSwapRequest[]): void {
  const storage = getLocalStorage();
  if (!storage) return;
  storage.setItem(LOCAL_SWAPS_KEY, JSON.stringify(swaps));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LOCAL_SWAPS_CHANGED_EVENT));
  }
}

function rememberLocalOverride(payload: Record<string, unknown>): string {
  const storage = getLocalStorage();
  const id = `local-schedule-override-${Date.now()}`;
  if (!storage) return id;

  try {
    const raw = storage.getItem(LOCAL_OVERRIDES_KEY);
    const overrides = raw ? (JSON.parse(raw) as Record<string, unknown>[]) : [];
    storage.setItem(LOCAL_OVERRIDES_KEY, JSON.stringify([{ id, ...payload, createdAt: new Date().toISOString() }, ...overrides]));
  } catch {
    // localStorage can be unavailable in private mode; the UI should still continue.
  }

  return id;
}

function getCreatedAtTime(value: ScheduleSwapRequest["createdAt"]): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  const timestamp = value as unknown;
  if (
    timestamp &&
    typeof timestamp === "object" &&
    "seconds" in timestamp &&
    typeof (timestamp as { seconds?: unknown }).seconds === "number"
  ) {
    return (timestamp as { seconds: number }).seconds * 1000;
  }

  return 0;
}

function sortByNewest(swaps: ScheduleSwapRequest[]): ScheduleSwapRequest[] {
  return [...swaps].sort((a, b) => getCreatedAtTime(b.createdAt) - getCreatedAtTime(a.createdAt));
}

function mergeSwapResults(swaps: ScheduleSwapRequest[]): ScheduleSwapRequest[] {
  const byId = new Map<string, ScheduleSwapRequest>();
  swaps.forEach((swap) => {
    byId.set(swap.id, swap);
  });
  return sortByNewest(Array.from(byId.values()));
}

function normalizeSwapDate(value?: string): string {
  const normalized = value?.trim();
  if (!normalized || !/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error("Tanggal tukar jadwal wajib diisi dengan format YYYY-MM-DD.");
  }

  return normalized;
}

function getConfirmationUrl(swapId?: string): string {
  const fallbackUrl = "https://radiosbl.web.app/?page=scheduleSwap";

  if (typeof window === "undefined") {
    return swapId ? `${fallbackUrl}&swapId=${encodeURIComponent(swapId)}` : fallbackUrl;
  }

  try {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("page", "scheduleSwap");
    if (swapId) {
      url.searchParams.set("swapId", swapId);
    }
    return url.toString();
  } catch {
    return swapId ? `${fallbackUrl}&swapId=${encodeURIComponent(swapId)}` : fallbackUrl;
  }
}

function inferWhatsappFromTarget(
  targetAnnouncerId: string,
  targetAnnouncer?: Pick<AppUser, "id" | "whatsapp"> | null
): string | undefined {
  const explicit = targetAnnouncer?.whatsapp?.trim();
  if (explicit) return explicit;

  const candidate = targetAnnouncer?.id || targetAnnouncerId;
  const normalized = candidate.startsWith("wa-") ? candidate.slice(3) : candidate;
  const digits = normalized.replace(/\D/g, "");
  return digits.length >= 9 ? digits : undefined;
}

function formatSwapScheduleLabel(scheduleId: string): string {
  const [day, time, program] = scheduleId.split("|");
  return [day, time, program].filter(Boolean).join(" - ");
}

function buildSwapWhatsAppText(
  payload: Omit<ScheduleSwapRequest, "id" | "status" | "createdAt" | "updatedAt">,
  context: ScheduleSwapNotificationContext,
  confirmationUrl: string
): string {
  const requesterName = context.requester.airName || context.requester.displayName || "Rekan penyiar";

  return [
    "Permintaan tukar jadwal Radio SBL",
    `Dari: ${requesterName}`,
    `Tanggal: ${normalizeSwapDate(payload.targetDate)}`,
    `Jadwal: ${formatSwapScheduleLabel(payload.scheduleId)}`,
    `Alasan: ${payload.reason}`,
    "",
    "Silakan buka link ini untuk menyetujui atau menolak:",
    confirmationUrl
  ].join("\n");
}

function isRecoverableFirebaseError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const maybeError = err as { code?: unknown; message?: unknown };
  const code = typeof maybeError.code === "string" ? maybeError.code : "";
  const message = typeof maybeError.message === "string" ? maybeError.message.toLowerCase() : "";

  return (
    code === "permission-denied" ||
    code === "unavailable" ||
    message.includes("missing or insufficient permissions") ||
    message.includes("failed to get document") ||
    message.includes("offline")
  );
}

function createLocalSwapRequest(
  payload: Omit<ScheduleSwapRequest, "id" | "status" | "createdAt" | "updatedAt">
): string {
  const id = `local-schedule-swap-${Date.now()}`;
  const nextRequest: ScheduleSwapRequest = {
    ...payload,
    id,
    status: "pending_target",
    createdAt: new Date().toISOString()
  };
  writeLocalSwaps([nextRequest, ...readLocalSwaps()]);
  return id;
}

function normalizeAlias(value?: string | null): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized || undefined;
}

function normalizeWhatsappAlias(value?: string | null): string | undefined {
  const digits = value?.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("62")) return `0${digits.slice(2)}`;
  if (digits.startsWith("0")) return digits;
  return `0${digits}`;
}

function buildUserAliases(userOrId: Pick<AppUser, "id" | "displayName" | "airName" | "announcerNames" | "employeeId" | "whatsapp"> | string): string[] {
  const aliases = new Set<string>();
  const add = (value?: string | null) => {
    const trimmed = value?.trim();
    if (!trimmed) return;
    aliases.add(trimmed);
    aliases.add(trimmed.toLowerCase());
  };

  if (typeof userOrId === "string") {
    add(userOrId);
    const wa = userOrId.startsWith("wa-") ? userOrId.slice(3) : userOrId;
    const normalizedWa = normalizeWhatsappAlias(wa);
    if (normalizedWa) {
      add(normalizedWa);
      add(`wa-${normalizedWa}`);
    }
  } else {
    add(userOrId.id);
    add(userOrId.displayName);
    add(userOrId.airName);
    add(userOrId.employeeId);
    add(userOrId.whatsapp);
    const normalizedWa = normalizeWhatsappAlias(userOrId.whatsapp);
    if (normalizedWa) {
      add(normalizedWa);
      add(`wa-${normalizedWa}`);
    }
    userOrId.announcerNames?.forEach(add);
  }

  for (const profile of localAnnouncers) {
    const localAliases = [
      profile.id,
      `wa-${profile.id}`,
      profile.airName,
      profile.fullName,
      ...profile.scheduleNames
    ].map((value) => normalizeAlias(value)).filter(Boolean);

    if (localAliases.some((alias) => alias && aliases.has(alias))) {
      localAliases.forEach((alias) => {
        if (alias) aliases.add(alias);
      });
    }
  }

  return Array.from(aliases);
}

function buildRuleReadableAliases(user: Pick<AppUser, "id" | "displayName" | "airName" | "announcerNames" | "employeeId" | "whatsapp">): string[] {
  const aliases = new Set<string>();
  const add = (value?: string | null) => {
    const trimmed = value?.trim();
    if (trimmed) aliases.add(trimmed);
  };

  add(user.id);
  add(user.displayName);
  add(user.airName);
  user.announcerNames?.forEach(add);
  add(user.employeeId);
  add(user.whatsapp);
  if (user.whatsapp) {
    add(`wa-${user.whatsapp}`);
  }

  return Array.from(aliases);
}

export function getScheduleSwapAliasesForUser(
  user: Pick<AppUser, "id" | "displayName" | "airName" | "announcerNames" | "employeeId" | "whatsapp"> | string
): string[] {
  return buildUserAliases(user);
}

export function getScheduleSwapQueryAliasesForUser(
  user: Pick<AppUser, "id" | "displayName" | "airName" | "announcerNames" | "employeeId" | "whatsapp">
): string[] {
  return buildRuleReadableAliases(user);
}

function decorateSwapPayload(
  payload: Omit<ScheduleSwapRequest, "id" | "status" | "createdAt" | "updatedAt">
): Omit<ScheduleSwapRequest, "id" | "status" | "createdAt" | "updatedAt"> {
  return {
    ...payload,
    targetDate: normalizeSwapDate(payload.targetDate),
    requesterAliases: payload.requesterAliases?.length ? payload.requesterAliases : buildUserAliases(payload.requesterId),
    targetAnnouncerAliases: payload.targetAnnouncerAliases?.length
      ? payload.targetAnnouncerAliases
      : buildUserAliases(payload.targetAnnouncerId)
  };
}

function matchesUserAliases(swap: ScheduleSwapRequest, aliases: string[]): boolean {
  const normalizedAliases = new Set(aliases.map(normalizeAlias).filter(Boolean));
  const hasAny = (values?: string[]) => values?.some((value) => {
    const normalized = normalizeAlias(value);
    return normalized ? normalizedAliases.has(normalized) : false;
  }) ?? false;

  const requesterId = normalizeAlias(swap.requesterId);
  const targetId = normalizeAlias(swap.targetAnnouncerId);
  return (
    hasAny(swap.requesterAliases) ||
    hasAny(swap.targetAnnouncerAliases) ||
    (requesterId ? normalizedAliases.has(requesterId) : false) ||
    (targetId ? normalizedAliases.has(targetId) : false)
  );
}

function isRequesterSwap(swap: ScheduleSwapRequest, aliases: string[]): boolean {
  const normalizedAliases = new Set(aliases.map(normalizeAlias).filter(Boolean));
  const requesterId = normalizeAlias(swap.requesterId);
  return (
    (requesterId ? normalizedAliases.has(requesterId) : false) ||
    swap.requesterAliases?.some((alias) => {
      const normalized = normalizeAlias(alias);
      return normalized ? normalizedAliases.has(normalized) : false;
    }) === true
  );
}

function isTargetSwap(swap: ScheduleSwapRequest, aliases: string[]): boolean {
  const normalizedAliases = new Set(aliases.map(normalizeAlias).filter(Boolean));
  const targetId = normalizeAlias(swap.targetAnnouncerId);
  return (
    (targetId ? normalizedAliases.has(targetId) : false) ||
    swap.targetAnnouncerAliases?.some((alias) => {
      const normalized = normalizeAlias(alias);
      return normalized ? normalizedAliases.has(normalized) : false;
    }) === true
  );
}

export function isIncomingScheduleSwap(
  swap: ScheduleSwapRequest,
  user: Pick<AppUser, "id" | "displayName" | "airName" | "announcerNames" | "employeeId" | "whatsapp"> | string
): boolean {
  const aliases = buildUserAliases(user);
  return isTargetSwap(swap, aliases) && !isRequesterSwap(swap, aliases);
}

function normalizeAnnouncerId(value: string): string {
  return value.trim().toLowerCase();
}

function findLocalAnnouncerName(targetAnnouncerId: string): string | undefined {
  const normalized = normalizeAnnouncerId(targetAnnouncerId);
  const candidate = localAnnouncers.find((profile) => {
    return (
      normalizeAnnouncerId(profile.id) === normalized ||
      normalizeAnnouncerId(`wa-${profile.id}`) === normalized ||
      normalizeAnnouncerId(profile.airName) === normalized ||
      normalizeAnnouncerId(profile.fullName) === normalized
    );
  });
  return candidate?.airName || candidate?.fullName;
}

async function getDocsRecoverable(q: Query) {
  try {
    return await getDocs(q);
  } catch (err) {
    if (isRecoverableFirebaseError(err)) {
      console.warn("Sebagian query tukar jadwal dilewati karena belum diizinkan rules.", err);
      return null;
    }

    throw err;
  }
}

async function resolveAnnouncerText(targetAnnouncerId: string): Promise<string | undefined> {
  if (shouldUseLocalSwapStore()) {
    return findLocalAnnouncerName(targetAnnouncerId);
  }

  try {
    const targetUser = await getDocument<AppUser>("users", targetAnnouncerId);
    if (targetUser?.airName) return targetUser.airName;
    if (targetUser?.displayName) return targetUser.displayName;
  } catch (err) {
    if (!isRecoverableFirebaseError(err)) {
      throw err;
    }
    console.warn("Nama penyiar pengganti memakai fallback lokal.", err);
  }

  return findLocalAnnouncerName(targetAnnouncerId);
}

/**
 * Mengajukan permintaan pertukaran jadwal baru.
 */
export async function createSwapRequest(payload: Omit<ScheduleSwapRequest, "id" | "status" | "createdAt" | "updatedAt">): Promise<string> {
  const nextPayload = decorateSwapPayload(payload);

  if (shouldUseLocalSwapStore()) {
    return createLocalSwapRequest(nextPayload);
  }

  try {
    const db = getFirebaseFirestore();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...nextPayload,
      status: "pending_target",
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (err) {
    if (isRecoverableFirebaseError(err)) {
      console.warn("Tukar jadwal memakai fallback lokal karena Firestore belum siap.", err);
      return createLocalSwapRequest(nextPayload);
    }
    throw err;
  }
}

export async function submitSwapRequest(
  payload: Omit<ScheduleSwapRequest, "id" | "status" | "createdAt" | "updatedAt">,
  context: ScheduleSwapNotificationContext
): Promise<ScheduleSwapSubmissionResult> {
  const nextPayload = decorateSwapPayload(payload);
  const targetWhatsapp = inferWhatsappFromTarget(nextPayload.targetAnnouncerId, context.targetAnnouncer);
  const preliminaryUrl = context.confirmationUrl || getConfirmationUrl();
  const preliminaryText = buildSwapWhatsAppText(nextPayload, context, preliminaryUrl);
  const id = await createSwapRequest(nextPayload);
  const confirmationUrl = context.confirmationUrl || getConfirmationUrl(id);
  const notificationText =
    confirmationUrl === preliminaryUrl
      ? preliminaryText
      : buildSwapWhatsAppText(nextPayload, context, confirmationUrl);
  const whatsappUrl = buildWhatsAppDeepLink({
    to: targetWhatsapp,
    text: notificationText
  });
  const notification = await sendWhatsAppNotification({
    to: targetWhatsapp,
    text: notificationText
  });

  return {
    id,
    notificationText,
    targetWhatsapp,
    whatsappUrl,
    whatsappDelivered: notification.delivered,
    whatsappFallbackReason: notification.fallbackReason
  };
}

/**
 * Mendapatkan daftar permintaan pertukaran untuk user tertentu (sebagai peminta atau target).
 */
export async function getMySwapRequests(user: AppUser | string): Promise<ScheduleSwapRequest[]> {
  const aliases = typeof user === "string" ? buildUserAliases(user) : buildUserAliases(user);
  const queryAliases = typeof user === "string" ? buildUserAliases(user) : buildRuleReadableAliases(user);
  const primaryId = typeof user === "string" ? user : user.id;

  if (shouldUseLocalSwapStore()) {
    return sortByNewest(readLocalSwaps().filter((swap) => matchesUserAliases(swap, aliases)));
  }

  try {
    const db = getFirebaseFirestore();
    const q = query(
      collection(db, COLLECTION_NAME),
      where("requesterId", "==", primaryId)
    );
    
    const q2 = query(
      collection(db, COLLECTION_NAME),
      where("targetAnnouncerId", "==", primaryId)
    );
    const aliasQueries = queryAliases.slice(0, 10).map((alias) =>
      getDocsRecoverable(query(collection(db, COLLECTION_NAME), where("targetAnnouncerAliases", "array-contains", alias)))
    );
    const legacyTargetQueries = queryAliases.slice(0, 10).map((alias) =>
      getDocsRecoverable(query(collection(db, COLLECTION_NAME), where("targetAnnouncerId", "==", alias)))
    );

    const [snap1, snap2, ...extraSnaps] = await Promise.all([
      getDocsRecoverable(q),
      getDocsRecoverable(q2),
      ...aliasQueries,
      ...legacyTargetQueries
    ]);
    
    const results: ScheduleSwapRequest[] = [];
    
    snap1?.forEach(doc => results.push({ id: doc.id, ...doc.data() } as ScheduleSwapRequest));
    snap2?.forEach(doc => {
      if (!results.find(r => r.id === doc.id)) {
        results.push({ id: doc.id, ...doc.data() } as ScheduleSwapRequest);
      }
    });
    extraSnaps.forEach((snap) => {
      snap?.forEach(doc => {
        if (!results.find(r => r.id === doc.id)) {
          results.push({ id: doc.id, ...doc.data() } as ScheduleSwapRequest);
        }
      });
    });

    return sortByNewest([
      ...results,
      ...readLocalSwaps().filter((swap) => matchesUserAliases(swap, aliases))
    ]);
  } catch (err) {
    if (isRecoverableFirebaseError(err)) {
      console.warn("Riwayat tukar jadwal memakai fallback lokal karena Firestore belum siap.", err);
      return sortByNewest(readLocalSwaps().filter((swap) => matchesUserAliases(swap, aliases)));
    }
    throw err;
  }
}

export function subscribeMySwapRequests(
  user: AppUser,
  onChange: (swaps: ScheduleSwapRequest[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const aliases = buildUserAliases(user);

  if (shouldUseLocalSwapStore()) {
    const emit = () => {
      onChange(sortByNewest(readLocalSwaps().filter((swap) => matchesUserAliases(swap, aliases))));
    };

    emit();
    window.addEventListener(LOCAL_SWAPS_CHANGED_EVENT, emit);
    window.addEventListener("storage", emit);

    return () => {
      window.removeEventListener(LOCAL_SWAPS_CHANGED_EVENT, emit);
      window.removeEventListener("storage", emit);
    };
  }

  const db = getFirebaseFirestore();
  const queryAliases = buildRuleReadableAliases(user).slice(0, 10);
  const snapshots = new Map<string, ScheduleSwapRequest>();
  const emit = () => {
    onChange(mergeSwapResults([
      ...Array.from(snapshots.values()),
      ...readLocalSwaps().filter((swap) => matchesUserAliases(swap, aliases))
    ]));
  };

  const queries: Query[] = [
    query(collection(db, COLLECTION_NAME), where("requesterId", "==", user.id)),
    query(collection(db, COLLECTION_NAME), where("targetAnnouncerId", "==", user.id)),
    ...queryAliases.map((alias) =>
      query(collection(db, COLLECTION_NAME), where("targetAnnouncerAliases", "array-contains", alias))
    ),
    ...queryAliases.map((alias) =>
      query(collection(db, COLLECTION_NAME), where("targetAnnouncerId", "==", alias))
    )
  ];

  const unsubscribers = queries.map((requestQuery) =>
    onSnapshot(
      requestQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "removed") {
            snapshots.delete(change.doc.id);
            return;
          }

          snapshots.set(change.doc.id, {
            id: change.doc.id,
            ...change.doc.data()
          } as ScheduleSwapRequest);
        });
        emit();
      },
      (error) => {
        if (isRecoverableFirebaseError(error)) {
          console.warn("Realtime tukar jadwal sebagian belum diizinkan rules.", error);
          emit();
          return;
        }

        onError?.(error);
      }
    )
  );

  void getMySwapRequests(user)
    .then(onChange)
    .catch((error) => onError?.(error));

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}

async function applySwapToSchedule(swap: ScheduleSwapRequest, approverId?: string): Promise<void> {
  const [day, time, program] = swap.scheduleId.split("|");
  if (!day || !time || !program) {
    throw new Error("Format scheduleId tidak valid untuk penerapan jadwal.");
  }

  const announcerText = await resolveAnnouncerText(swap.targetAnnouncerId);
  if (!announcerText) {
    throw new Error("Tidak dapat menemukan nama penyiar pengganti untuk targetAnnouncerId.");
  }

  const scheduleSlots = await getWeeklySchedule();
  const originalSlot = scheduleSlots.find((slot) => slot.day === day && slot.time === time && slot.program === program);
  const description = originalSlot?.description || "";
  const sourceAnnouncer = originalSlot?.announcer || "";

  const nextSlot: BroadcastProgramSlot = {
    day,
    time,
    program,
    description,
    announcer: announcerText
  };

  const originalSlotPayload: BroadcastProgramSlot = originalSlot || {
    day,
    time,
    program,
    description,
    announcer: sourceAnnouncer
  };

  const overridePayload = {
    date: normalizeSwapDate(swap.targetDate),
    slotId: originalSlot?.id || getScheduleSlotId(originalSlotPayload),
    type: "replace",
    newProgram: nextSlot.program,
    newAnnouncer: nextSlot.announcer,
    newTime: nextSlot.time,
    description: nextSlot.description,
    reason: swap.reason,
    sourceSwapId: swap.id,
    createdBy: approverId || swap.targetAnnouncerId
  } as const;

  if (shouldUseLocalSwapStore()) {
    rememberLocalOverride(overridePayload);
    return;
  }

  await saveScheduleOverrideRemote(overridePayload);
}

export async function updateSwapStatus(
  swapId: string,
  status: ScheduleSwapRequest["status"],
  actor?: Pick<AppUser, "id">
): Promise<void> {
  if (shouldUseLocalSwapStore()) {
    const swaps = readLocalSwaps();
    const swapData = swaps.find((swap) => swap.id === swapId);
    if (!swapData) {
      throw new Error("Swap request tidak ditemukan.");
    }

    if (status === "approved") {
      await applySwapToSchedule(swapData, actor?.id);
    }

    writeLocalSwaps(
      swaps.map((swap) =>
        swap.id === swapId ? { ...swap, status, updatedAt: new Date().toISOString() } : swap
      )
    );
    return;
  }

  try {
    const db = getFirebaseFirestore();
    const docRef = doc(db, COLLECTION_NAME, swapId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      throw new Error("Swap request tidak ditemukan.");
    }

    const swapData = { ...(snapshot.data() as ScheduleSwapRequest), id: snapshot.id } as ScheduleSwapRequest;

    if (status === "approved") {
      await applySwapToSchedule(swapData, actor?.id);
    }

    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    if (isRecoverableFirebaseError(err)) {
      const swaps = readLocalSwaps();
      const swapData = swaps.find((swap) => swap.id === swapId);
      if (!swapData) {
        throw new Error("Swap request tidak ditemukan.");
      }

      if (status === "approved") {
        await applySwapToSchedule(swapData);
      }

      writeLocalSwaps(
        swaps.map((swap) =>
          swap.id === swapId ? { ...swap, status, updatedAt: new Date().toISOString() } : swap
        )
      );
      return;
    }
    throw err;
  }
}
