import { shouldUseLocalFallback } from "../../../lib/env";
import type { ListenerStreamingError } from "../../../types/domain";
import {
  createDocument,
  listDocuments,
  subscribeDocuments
} from "../../../services/firestore.service";
import { orderBy, limit, type Unsubscribe } from "firebase/firestore";

const ERRORS_LOCAL_KEY = "radiosbl_streaming_errors";
const STREAMING_ERRORS_READ_LIMIT = 100;

function timestampToMs(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? 0 : value.getTime();
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
  }
  return 0;
}

function normalizeStreamingError(error: ListenerStreamingError): ListenerStreamingError {
  const createdMs = timestampToMs(error.createdAt);
  return {
    ...error,
    id: error.id || `err-${createdMs || Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    event: error.event || "unknown",
    message: error.message || "Sumber stream tidak didukung browser.",
    browser: error.browser || "Browser",
    os: error.os || "OS",
    programTitle: error.programTitle || "Live Radio",
    createdAt: createdMs ? new Date(createdMs).toISOString() : new Date().toISOString()
  };
}

function sortStreamingErrors(errors: ListenerStreamingError[]): ListenerStreamingError[] {
  return [...errors]
    .map(normalizeStreamingError)
    .sort((a, b) => timestampToMs(b.createdAt) - timestampToMs(a.createdAt));
}

function getSafeLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readLocalErrors(): ListenerStreamingError[] {
  const storage = getSafeLocalStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(ERRORS_LOCAL_KEY);
    return raw ? sortStreamingErrors(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

function writeLocalErrors(errors: ListenerStreamingError[]) {
  const storage = getSafeLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(ERRORS_LOCAL_KEY, JSON.stringify(errors.slice(0, 30)));
  } catch (err) {
    console.warn("Gagal menyimpan log error streaming lokal:", err);
  }
}

export async function trackStreamingError(
  input: Omit<ListenerStreamingError, "id" | "createdAt">
): Promise<ListenerStreamingError> {
  const now = new Date().toISOString();
  const errorItem: ListenerStreamingError = {
    ...input,
    id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now
  };

  const list = readLocalErrors();
  writeLocalErrors([errorItem, ...list]);

  if (shouldUseLocalFallback()) {
    return errorItem;
  }

  try {
    const id = await createDocument("listenerStreamingErrors", {
      sessionId: errorItem.sessionId || "",
      event: errorItem.event,
      message: errorItem.message || "",
      programId: errorItem.programId || "",
      programTitle: errorItem.programTitle || "",
      deviceType: errorItem.deviceType || "",
      browser: errorItem.browser || "",
      os: errorItem.os || "",
      createdAt: now
    });
    return { ...errorItem, id };
  } catch (err) {
    console.warn("Gagal mencatat trackStreamingError ke Firestore:", err);
    return errorItem;
  }
}

export async function listStreamingErrors(): Promise<ListenerStreamingError[]> {
  if (shouldUseLocalFallback()) {
    return sortStreamingErrors(readLocalErrors());
  }

  try {
    const docs = await listDocuments<ListenerStreamingError>("listenerStreamingErrors", [
      orderBy("createdAt", "desc"),
      limit(STREAMING_ERRORS_READ_LIMIT)
    ]);
    return sortStreamingErrors(docs);
  } catch {
    return sortStreamingErrors(readLocalErrors());
  }
}

export function subscribeStreamingErrors(
  onNext: (errors: ListenerStreamingError[]) => void
): Unsubscribe {
  if (shouldUseLocalFallback()) {
    const checkAndTrigger = () => {
      onNext(sortStreamingErrors(readLocalErrors()));
    };
    checkAndTrigger();
    window.addEventListener("storage", checkAndTrigger);
    return () => window.removeEventListener("storage", checkAndTrigger);
  }

  try {
    return subscribeDocuments<ListenerStreamingError>(
      "listenerStreamingErrors",
      (docs) => {
        onNext(sortStreamingErrors(docs));
      },
      () => {
        onNext(sortStreamingErrors(readLocalErrors()));
      },
      [orderBy("createdAt", "desc"), limit(STREAMING_ERRORS_READ_LIMIT)]
    );
  } catch {
    const checkAndTrigger = () => {
      onNext(sortStreamingErrors(readLocalErrors()));
    };
    checkAndTrigger();
    return () => {};
  }
}
