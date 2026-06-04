import { doc, setDoc, updateDoc, collection, onSnapshot, serverTimestamp, query, orderBy, limit, where } from "firebase/firestore";
import { getFirebaseFirestore } from "../../../lib/firebase";
import { hasFirebaseConfig } from "../../../lib/env";
import type { TimestampLike } from "../../../types/domain";

export type VideoItem = {
  videoId: string;
  title: string;
  description?: string;
  source: 'youtube' | 'facebook' | 'external';
  embedUrl: string;
  thumbnailUrl?: string;
  programId?: string;
  programTitle?: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt: TimestampLike | null;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
};

const isTestOrNoFirebase = () => {
  return import.meta.env.MODE === "test" || !hasFirebaseConfig();
};

const getLocalVideos = (): VideoItem[] => {
  const data = localStorage.getItem("video_items");
  return data ? JSON.parse(data) : [];
};

const saveLocalVideos = (videos: VideoItem[]) => {
  localStorage.setItem("video_items", JSON.stringify(videos));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("video_items_changed"));
  }
};

export async function submitVideoItem(payload: Omit<VideoItem, 'videoId' | 'createdAt' | 'updatedAt' | 'publishedAt'>): Promise<VideoItem> {
  const videoId = `vid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const newVideo: VideoItem = {
    videoId,
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: payload.status === 'published' ? new Date().toISOString() : null
  };

  if (isTestOrNoFirebase()) {
    const list = getLocalVideos();
    list.unshift(newVideo);
    saveLocalVideos(list);
    return newVideo;
  }

  try {
    const db = getFirebaseFirestore();
    const docRef = doc(db, "videoItems", videoId);
    await setDoc(docRef, {
      ...newVideo,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      publishedAt: payload.status === 'published' ? serverTimestamp() : null
    });
    return newVideo;
  } catch (error) {
    console.warn("[videoHub.service] submitVideoItem failed", error);
    throw error;
  }
}

export async function updateVideoItem(
  videoId: string,
  payload: Partial<Omit<VideoItem, 'videoId' | 'createdAt'>>
): Promise<void> {
  const updatePayload: Record<string, unknown> = {
    ...payload,
    updatedAt: isTestOrNoFirebase() ? new Date().toISOString() : serverTimestamp()
  };

  if (payload.status === 'published') {
    updatePayload.publishedAt = isTestOrNoFirebase() ? new Date().toISOString() : serverTimestamp();
  }

  if (isTestOrNoFirebase()) {
    const list = getLocalVideos();
    const index = list.findIndex(v => v.videoId === videoId);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatePayload };
      saveLocalVideos(list);
    }
    return;
  }

  try {
    const db = getFirebaseFirestore();
    const docRef = doc(db, "videoItems", videoId);
    await updateDoc(docRef, updatePayload);
  } catch (error) {
    console.warn("[videoHub.service] updateVideoItem failed", error);
    throw error;
  }
}

export function subscribeVideoItems(callback: (videos: VideoItem[]) => void) {
  if (isTestOrNoFirebase()) {
    const trigger = () => {
      callback(getLocalVideos());
    };
    trigger();
    if (typeof window !== "undefined") {
      window.addEventListener("video_items_changed", trigger);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("video_items_changed", trigger);
      }
    };
  }

  try {
    const db = getFirebaseFirestore();
    const colRef = collection(db, "videoItems");
    const q = query(colRef, orderBy("createdAt", "desc"), limit(100));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          videoId: doc.id,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          publishedAt: data.publishedAt?.toDate?.() || data.publishedAt || null
        } as VideoItem;
      });
      callback(list);
    }, (error) => {
      console.warn("[videoHub.service] subscribeVideoItems error", error);
    });
  } catch (error) {
    console.warn("[videoHub.service] subscribeVideoItems failed to start", error);
    return () => {};
  }
}

export function subscribeActiveVideoItems(callback: (videos: VideoItem[]) => void) {
  if (isTestOrNoFirebase()) {
    const trigger = () => {
      const active = getLocalVideos().filter(v => v.status === 'published');
      callback(active);
    };
    trigger();
    if (typeof window !== "undefined") {
      window.addEventListener("video_items_changed", trigger);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("video_items_changed", trigger);
      }
    };
  }

  try {
    const db = getFirebaseFirestore();
    const colRef = collection(db, "videoItems");
    const q = query(colRef, where("status", "==", "published"), orderBy("publishedAt", "desc"), limit(50));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          videoId: doc.id,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          publishedAt: data.publishedAt?.toDate?.() || data.publishedAt || null
        } as VideoItem;
      });
      callback(list);
    }, (error) => {
      console.warn("[videoHub.service] subscribeActiveVideoItems error", error);
    });
  } catch (error) {
    console.warn("[videoHub.service] subscribeActiveVideoItems failed to start", error);
    return () => {};
  }
}
