import { doc, setDoc, updateDoc, collection, onSnapshot, serverTimestamp, query, orderBy, limit, where } from "firebase/firestore";
import { getFirebaseFirestore } from "../../../lib/firebase";
import { hasFirebaseConfig } from "../../../lib/env";
import type { TimestampLike } from "../../../types/domain";

export type DedicationItem = {
  dedicationId: string;
  senderName?: string;
  recipientName?: string;
  message: string;
  targetProgramId?: string;
  targetProgramTitle?: string;
  isAnonymous: boolean;
  status: 'submitted' | 'approved' | 'readOnAir' | 'rejected' | 'archived';
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  handledBy?: string;
  statusNote?: string;
};

const isTestOrNoFirebase = () => {
  return import.meta.env.MODE === "test" || !hasFirebaseConfig();
};

const getLocalDedications = (): DedicationItem[] => {
  const data = localStorage.getItem("dedications");
  return data ? JSON.parse(data) : [];
};

const saveLocalDedications = (items: DedicationItem[]) => {
  localStorage.setItem("dedications", JSON.stringify(items));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("dedications_changed"));
  }
};

export async function submitDedication(payload: {
  senderName?: string;
  recipientName?: string;
  message: string;
  targetProgramId?: string;
  targetProgramTitle?: string;
  isAnonymous: boolean;
}): Promise<DedicationItem> {
  const dedicationId = `ded-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newItem: DedicationItem = {
    dedicationId,
    ...payload,
    status: 'submitted',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isTestOrNoFirebase()) {
    const list = getLocalDedications();
    list.unshift(newItem);
    saveLocalDedications(list);
    return newItem;
  }

  try {
    const db = getFirebaseFirestore();
    const docRef = doc(db, "dedications", dedicationId);
    await setDoc(docRef, {
      ...newItem,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return newItem;
  } catch (error) {
    console.warn("[dedication.service] submitDedication failed", error);
    throw error;
  }
}

export async function updateDedicationStatus(
  dedicationId: string,
  status: DedicationItem['status'],
  statusNote?: string,
  handledBy?: string
): Promise<void> {
  const updatePayload: Record<string, unknown> = {
    status,
    statusNote: statusNote || null,
    updatedAt: isTestOrNoFirebase() ? new Date().toISOString() : serverTimestamp()
  };

  if (handledBy) updatePayload.handledBy = handledBy;

  if (isTestOrNoFirebase()) {
    const list = getLocalDedications();
    const index = list.findIndex(d => d.dedicationId === dedicationId);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatePayload };
      saveLocalDedications(list);
    }
    return;
  }

  try {
    const db = getFirebaseFirestore();
    const docRef = doc(db, "dedications", dedicationId);
    await updateDoc(docRef, updatePayload);
  } catch (error) {
    console.warn("[dedication.service] updateDedicationStatus failed", error);
    throw error;
  }
}

export function subscribeDedications(callback: (items: DedicationItem[]) => void) {
  if (isTestOrNoFirebase()) {
    const trigger = () => {
      callback(getLocalDedications());
    };
    trigger();
    if (typeof window !== "undefined") {
      window.addEventListener("dedications_changed", trigger);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("dedications_changed", trigger);
      }
    };
  }

  try {
    const db = getFirebaseFirestore();
    const colRef = collection(db, "dedications");
    const q = query(colRef, orderBy("createdAt", "desc"), limit(100));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          dedicationId: doc.id,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        } as DedicationItem;
      });
      callback(list);
    }, (error) => {
      console.warn("[dedication.service] subscribeDedications error", error);
    });
  } catch (error) {
    console.warn("[dedication.service] subscribeDedications failed to start", error);
    return () => {};
  }
}

export function subscribeApprovedDedications(callback: (items: DedicationItem[]) => void) {
  if (isTestOrNoFirebase()) {
    const trigger = () => {
      const list = getLocalDedications().filter(d => d.status === 'approved' || d.status === 'readOnAir');
      callback(list);
    };
    trigger();
    if (typeof window !== "undefined") {
      window.addEventListener("dedications_changed", trigger);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("dedications_changed", trigger);
      }
    };
  }

  try {
    const db = getFirebaseFirestore();
    const colRef = collection(db, "dedications");
    const q = query(
      colRef,
      where("status", "in", ["approved", "readOnAir"]),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          dedicationId: doc.id,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        } as DedicationItem;
      });
      callback(list);
    }, (error) => {
      console.warn("[dedication.service] subscribeApprovedDedications error", error);
    });
  } catch (error) {
    console.warn("[dedication.service] subscribeApprovedDedications failed to start", error);
    return () => {};
  }
}
