import { doc, setDoc, deleteDoc, getDoc, collection, onSnapshot, serverTimestamp } from "firebase/firestore";
import { getFirebaseFirestore } from "../../../lib/firebase";
import { hasFirebaseConfig } from "../../../lib/env";
import type { TimestampLike } from "../../../types/domain";

export type FavoriteProgramItem = {
  programId: string;
  programTitle: string;
  programPoster?: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
};

const isTestOrNoFirebase = () => {
  return import.meta.env.MODE === "test" || !hasFirebaseConfig();
};

const getLocalFavorites = (userId: string): Record<string, FavoriteProgramItem> => {
  const data = localStorage.getItem(`favorites_${userId}`);
  return data ? JSON.parse(data) : {};
};

const saveLocalFavorites = (userId: string, favorites: Record<string, FavoriteProgramItem>) => {
  localStorage.setItem(`favorites_${userId}`, JSON.stringify(favorites));
};

export async function toggleFavoriteProgram(userId: string, programId: string, programTitle: string, programPoster?: string): Promise<boolean> {
  if (isTestOrNoFirebase()) {
    const favorites = getLocalFavorites(userId);
    const isFav = !!favorites[programId];
    if (isFav) {
      delete favorites[programId];
    } else {
      favorites[programId] = {
        programId,
        programTitle,
        programPoster,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    saveLocalFavorites(userId, favorites);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(`favorites_changed_${userId}`));
    }
    return !isFav;
  }

  try {
    const db = getFirebaseFirestore();
    const docRef = doc(db, "userProgramFavorites", userId, "items", programId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await deleteDoc(docRef);
      return false; // Removed
    } else {
      await setDoc(docRef, {
        programId,
        programTitle,
        programPoster: programPoster || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return true; // Added
    }
  } catch (error) {
    console.warn("[programFavorite.service] toggleFavoriteProgram failed", error);
    throw error;
  }
}

export async function checkIsFavorite(userId: string, programId: string): Promise<boolean> {
  if (isTestOrNoFirebase()) {
    const favorites = getLocalFavorites(userId);
    return !!favorites[programId];
  }

  try {
    const db = getFirebaseFirestore();
    const docRef = doc(db, "userProgramFavorites", userId, "items", programId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.warn("[programFavorite.service] checkIsFavorite failed", error);
    return false;
  }
}

export function subscribeFavorites(userId: string, callback: (favorites: string[]) => void) {
  if (isTestOrNoFirebase()) {
    const triggerCallback = () => {
      const favorites = getLocalFavorites(userId);
      callback(Object.keys(favorites));
    };
    triggerCallback();
    if (typeof window !== "undefined") {
      window.addEventListener(`favorites_changed_${userId}`, triggerCallback);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(`favorites_changed_${userId}`, triggerCallback);
      }
    };
  }

  try {
    const db = getFirebaseFirestore();
    const colRef = collection(db, "userProgramFavorites", userId, "items");
    return onSnapshot(colRef, (snapshot) => {
      const ids = snapshot.docs.map((d) => d.id);
      callback(ids);
    }, (error) => {
      console.warn("[programFavorite.service] subscribeFavorites error", error);
    });
  } catch (error) {
    console.warn("[programFavorite.service] subscribeFavorites failed to start", error);
    return () => {};
  }
}
