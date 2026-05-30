import { useState, useEffect, useCallback } from "react";
import { checkIsFavorite, toggleFavoriteProgram, subscribeFavorites } from "../services/programFavorite.service";

export function useProgramFavorite(userId: string | undefined, programId: string, programTitle: string, programPoster?: string) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !programId) {
      setIsFavorite(false);
      return;
    }

    let active = true;
    setLoading(true);
    checkIsFavorite(userId, programId)
      .then((fav) => {
        if (active) {
          setIsFavorite(fav);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [userId, programId]);

  useEffect(() => {
    if (!userId || !programId) return;

    const unsubscribe = subscribeFavorites(userId, (favIds) => {
      setIsFavorite(favIds.includes(programId));
    });

    return () => {
      unsubscribe();
    };
  }, [userId, programId]);

  const toggleFavorite = useCallback(async () => {
    if (!userId || !programId) return;

    setLoading(true);
    try {
      const nextStatus = await toggleFavoriteProgram(userId, programId, programTitle, programPoster);
      setIsFavorite(nextStatus);
    } catch (error) {
      console.warn("[useProgramFavorite] Failed to toggle favorite", error);
    } finally {
      setLoading(false);
    }
  }, [userId, programId, programTitle, programPoster]);

  return {
    isFavorite,
    loading,
    toggleFavorite
  };
}
