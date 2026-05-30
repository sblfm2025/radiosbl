import { doc, setDoc, updateDoc, collection, onSnapshot, serverTimestamp, query, orderBy, limit } from "firebase/firestore";
import { getFirebaseFirestore } from "../../../lib/firebase";
import { hasFirebaseConfig } from "../../../lib/env";

export type SongRequestV2 = {
  requestId: string;
  senderName?: string;
  songTitle: string;
  artistName?: string;
  message?: string;
  targetProgramId?: string;
  targetProgramTitle?: string;
  status: 'submitted' | 'read' | 'queued' | 'played' | 'rejected' | 'archived';
  statusNote?: string;
  createdAt: any;
  updatedAt: any;
  readAt?: any;
  playedAt?: any;
  rejectedAt?: any;
  handledBy?: string;
};

const isTestOrNoFirebase = () => {
  return import.meta.env.MODE === "test" || !hasFirebaseConfig();
};

const getLocalRequests = (): SongRequestV2[] => {
  const data = localStorage.getItem("song_requests_v2");
  return data ? JSON.parse(data) : [];
};

const saveLocalRequests = (requests: SongRequestV2[]) => {
  localStorage.setItem("song_requests_v2", JSON.stringify(requests));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("song_requests_v2_changed"));
  }
};

export async function submitSongRequestV2(payload: {
  senderName?: string;
  songTitle: string;
  artistName?: string;
  message?: string;
  targetProgramId?: string;
  targetProgramTitle?: string;
}): Promise<SongRequestV2> {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newRequest: SongRequestV2 = {
    requestId,
    ...payload,
    status: 'submitted',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isTestOrNoFirebase()) {
    const list = getLocalRequests();
    list.unshift(newRequest);
    saveLocalRequests(list);
    return newRequest;
  }

  try {
    const db = getFirebaseFirestore();
    const docRef = doc(db, "songRequestsV2", requestId);
    await setDoc(docRef, {
      ...newRequest,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return newRequest;
  } catch (error) {
    console.warn("[requestSongStatus.service] submitSongRequestV2 failed", error);
    throw error;
  }
}

export async function updateSongRequestStatus(
  requestId: string,
  status: SongRequestV2['status'],
  statusNote?: string,
  handledBy?: string
): Promise<void> {
  const updatePayload: any = {
    status,
    statusNote: statusNote || null,
    updatedAt: isTestOrNoFirebase() ? new Date().toISOString() : serverTimestamp()
  };

  if (status === 'read') updatePayload.readAt = isTestOrNoFirebase() ? new Date().toISOString() : serverTimestamp();
  if (status === 'played') updatePayload.playedAt = isTestOrNoFirebase() ? new Date().toISOString() : serverTimestamp();
  if (status === 'rejected') updatePayload.rejectedAt = isTestOrNoFirebase() ? new Date().toISOString() : serverTimestamp();
  if (handledBy) updatePayload.handledBy = handledBy;

  if (isTestOrNoFirebase()) {
    const list = getLocalRequests();
    const index = list.findIndex(r => r.requestId === requestId);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatePayload };
      saveLocalRequests(list);
    }
    return;
  }

  try {
    const db = getFirebaseFirestore();
    const docRef = doc(db, "songRequestsV2", requestId);
    await updateDoc(docRef, updatePayload);
  } catch (error) {
    console.warn("[requestSongStatus.service] updateSongRequestStatus failed", error);
    throw error;
  }
}

export function subscribeSongRequestsV2(callback: (requests: SongRequestV2[]) => void) {
  if (isTestOrNoFirebase()) {
    const trigger = () => {
      callback(getLocalRequests());
    };
    trigger();
    if (typeof window !== "undefined") {
      window.addEventListener("song_requests_v2_changed", trigger);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("song_requests_v2_changed", trigger);
      }
    };
  }

  try {
    const db = getFirebaseFirestore();
    const colRef = collection(db, "songRequestsV2");
    const q = query(colRef, orderBy("createdAt", "desc"), limit(100));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          requestId: doc.id,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          readAt: data.readAt?.toDate?.() || data.readAt || null,
          playedAt: data.playedAt?.toDate?.() || data.playedAt || null,
          rejectedAt: data.rejectedAt?.toDate?.() || data.rejectedAt || null
        } as SongRequestV2;
      });
      callback(list);
    }, (error) => {
      console.warn("[requestSongStatus.service] subscribeSongRequestsV2 error", error);
    });
  } catch (error) {
    console.warn("[requestSongStatus.service] subscribeSongRequestsV2 failed to start", error);
    return () => {};
  }
}
