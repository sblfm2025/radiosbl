import { doc, setDoc, updateDoc, collection, onSnapshot, serverTimestamp, query, orderBy, limit, where } from "firebase/firestore";
import { getFirebaseFirestore } from "../../../lib/firebase";
import { hasFirebaseConfig } from "../../../lib/env";
import { writeAuditLog } from "../../securityAudit/services/auditLog.service";

export type ProgramEpisode = {
  episodeId: string;
  title: string;
  slug: string;
  programId: string;
  programTitle: string;
  description?: string;
  hosts?: string[];
  operator?: string;
  tags: string[];
  audioUrl: string;
  audioStoragePath?: string;
  coverImageUrl?: string;
  durationSeconds?: number;
  publishedAt: any;
  status: 'draft' | 'published' | 'archived';
  createdBy: string;
  createdAt: any;
  updatedAt: any;
};

const isTestOrNoFirebase = () => {
  return import.meta.env.MODE === "test" || !hasFirebaseConfig();
};

const getLocalEpisodes = (): ProgramEpisode[] => {
  const data = localStorage.getItem("program_episodes");
  return data ? JSON.parse(data) : [];
};

const saveLocalEpisodes = (episodes: ProgramEpisode[]) => {
  localStorage.setItem("program_episodes", JSON.stringify(episodes));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("program_episodes_changed"));
  }
};

export async function submitEpisode(payload: Omit<ProgramEpisode, 'episodeId' | 'slug' | 'createdAt' | 'updatedAt' | 'publishedAt'>): Promise<ProgramEpisode> {
  const episodeId = `ep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const slug = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  const newEpisode: ProgramEpisode = {
    episodeId,
    slug,
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: payload.status === 'published' ? new Date().toISOString() : null
  };

  // Catat audit log pembuatan episode secara fail-safe
  void writeAuditLog({
    actorUserId: payload.createdBy,
    actorName: payload.createdBy,
    action: payload.status === 'published' ? "publish_episode" : "create_episode_draft",
    targetCollection: "programEpisodes",
    targetId: episodeId,
    after: { title: payload.title, programTitle: payload.programTitle, status: payload.status }
  });

  if (isTestOrNoFirebase()) {
    const list = getLocalEpisodes();
    list.unshift(newEpisode);
    saveLocalEpisodes(list);
    return newEpisode;
  }

  try {
    const db = getFirebaseFirestore();
    const docRef = doc(db, "programEpisodes", episodeId);
    await setDoc(docRef, {
      ...newEpisode,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      publishedAt: payload.status === 'published' ? serverTimestamp() : null
    });
    return newEpisode;
  } catch (error) {
    console.warn("[episode.service] submitEpisode failed", error);
    throw error;
  }
}

export async function updateEpisode(
  episodeId: string,
  payload: Partial<Omit<ProgramEpisode, 'episodeId' | 'createdAt'>>,
  actorUserId?: string
): Promise<void> {
  const updatePayload: any = {
    ...payload,
    updatedAt: isTestOrNoFirebase() ? new Date().toISOString() : serverTimestamp()
  };

  if (payload.title) {
    updatePayload.slug = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }

  if (payload.status === 'published') {
    updatePayload.publishedAt = isTestOrNoFirebase() ? new Date().toISOString() : serverTimestamp();
  }

  // Catat audit log saat episode diperbarui — terutama aksi publish/archive
  void writeAuditLog({
    actorUserId: actorUserId || payload.createdBy || "system",
    actorName: actorUserId || "System",
    action: payload.status === 'published' ? "publish_episode"
          : payload.status === 'archived' ? "archive_episode"
          : "update_episode",
    targetCollection: "programEpisodes",
    targetId: episodeId,
    after: { status: payload.status, title: payload.title } as any
  });

  if (isTestOrNoFirebase()) {
    const list = getLocalEpisodes();
    const index = list.findIndex(e => e.episodeId === episodeId);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatePayload };
      saveLocalEpisodes(list);
    }
    return;
  }

  try {
    const db = getFirebaseFirestore();
    const docRef = doc(db, "programEpisodes", episodeId);
    await updateDoc(docRef, updatePayload);
  } catch (error) {
    console.warn("[episode.service] updateEpisode failed", error);
    throw error;
  }
}

export function subscribeEpisodes(callback: (episodes: ProgramEpisode[]) => void) {
  if (isTestOrNoFirebase()) {
    const trigger = () => {
      callback(getLocalEpisodes());
    };
    trigger();
    if (typeof window !== "undefined") {
      window.addEventListener("program_episodes_changed", trigger);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("program_episodes_changed", trigger);
      }
    };
  }

  try {
    const db = getFirebaseFirestore();
    const colRef = collection(db, "programEpisodes");
    const q = query(colRef, orderBy("createdAt", "desc"), limit(100));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          episodeId: doc.id,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          publishedAt: data.publishedAt?.toDate?.() || data.publishedAt || null
        } as ProgramEpisode;
      });
      callback(list);
    }, (error) => {
      console.warn("[episode.service] subscribeEpisodes error", error);
    });
  } catch (error) {
    console.warn("[episode.service] subscribeEpisodes failed to start", error);
    return () => {};
  }
}

export function subscribeActiveEpisodes(callback: (episodes: ProgramEpisode[]) => void) {
  if (isTestOrNoFirebase()) {
    const trigger = () => {
      const active = getLocalEpisodes().filter(e => e.status === 'published');
      callback(active);
    };
    trigger();
    if (typeof window !== "undefined") {
      window.addEventListener("program_episodes_changed", trigger);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("program_episodes_changed", trigger);
      }
    };
  }

  try {
    const db = getFirebaseFirestore();
    const colRef = collection(db, "programEpisodes");
    const q = query(colRef, where("status", "==", "published"), orderBy("publishedAt", "desc"), limit(50));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          episodeId: doc.id,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          publishedAt: data.publishedAt?.toDate?.() || data.publishedAt || null
        } as ProgramEpisode;
      });
      callback(list);
    }, (error) => {
      console.warn("[episode.service] subscribeActiveEpisodes error", error);
    });
  } catch (error) {
    console.warn("[episode.service] subscribeActiveEpisodes failed to start", error);
    return () => {};
  }
}
