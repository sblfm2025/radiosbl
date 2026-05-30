import { Heart } from "lucide-react";
import { useProgramFavorite } from "../hooks/useProgramFavorite";
import "../styles/listening.css";

type FavoriteProgramButtonProps = {
  userId?: string;
  programId: string;
  programTitle: string;
  programPoster?: string;
};

export function FavoriteProgramButton({ userId, programId, programTitle, programPoster }: FavoriteProgramButtonProps) {
  const { isFavorite, loading, toggleFavorite } = useProgramFavorite(userId, programId, programTitle, programPoster);

  if (!userId) {
    return (
      <button
        type="button"
        className="fav-program-btn loading"
        title="Masuk untuk menambahkan program favorit"
        disabled
        aria-label="Program Favorit (Masuk dahulu)"
      >
        <Heart size={20} />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`fav-program-btn ${isFavorite ? "is-favorite" : ""} ${loading ? "loading" : ""}`}
      onClick={toggleFavorite}
      disabled={loading}
      title={isFavorite ? "Hapus dari Program Favorit" : "Tambah ke Program Favorit"}
      aria-label={isFavorite ? "Hapus dari Program Favorit" : "Tambah ke Program Favorit"}
    >
      <Heart size={20} fill={isFavorite ? "#ef4444" : "none"} />
    </button>
  );
}
