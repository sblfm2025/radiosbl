import { useState, useEffect, useMemo } from "react";
import { subscribeActiveEpisodes, type ProgramEpisode } from "../services/episode.service";
import { EpisodeCard } from "../components/EpisodeCard";
import { EpisodePlayer } from "../components/EpisodePlayer";
import { Search, Headphones } from "lucide-react";
import { PodcastPage as PodcastPageLegacy } from "../../../components/PodcastPage";
import "../styles/contentHub.css";

export default function PodcastPage() {
  const [episodes, setEpisodes] = useState<ProgramEpisode[]>([]);
  const [query, setQuery] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [activeEpisode, setActiveEpisode] = useState<ProgramEpisode | null>(null);

  useEffect(() => {
    return subscribeActiveEpisodes((items) => {
      setEpisodes(items);
    });
  }, []);

  const programList = useMemo(() => {
    return Array.from(new Set(episodes.map(e => e.programTitle))).sort();
  }, [episodes]);

  const filteredEpisodes = useMemo(() => {
    return episodes.filter(ep => {
      const matchQuery = `${ep.title} ${ep.description || ""} ${ep.tags.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase().trim());
      const matchProgram = selectedProgram ? ep.programTitle === selectedProgram : true;
      return matchQuery && matchProgram;
    });
  }, [episodes, query, selectedProgram]);

  // Jika data dinamis Firestore kosong, render PodcastPageLegacy yang sudah stabil.
  if (episodes.length === 0) {
    return <PodcastPageLegacy />;
  }

  return (
    <div className="content-hub-page">
      <section className="content-hub-hero">
        <div className="content-hub-hero-icon audio">
          <Headphones size={64} />
        </div>
        <div>
          <p className="content-hub-eyebrow audio">Radio SBL</p>
          <h2>Kanal Podcast & Arsip Audio</h2>
          <p>
            Dengarkan kembali rekaman siaran favorit Anda, obrolan inspiratif, dan program unggulan dari studio Radio Suara Bumi Lasinrang kapan saja dan di mana saja.
          </p>
        </div>
      </section>

      <div className="content-hub-toolbar">
        <div className="content-hub-search">
          <Search size={18} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari episode podcast atau topik..."
            aria-label="Cari episode podcast"
          />
        </div>

        <select
          value={selectedProgram}
          onChange={(e) => setSelectedProgram(e.target.value)}
          className="content-hub-select"
        >
          <option value="">-- Semua Program Siaran --</option>
          {programList.map((p, idx) => (
            <option key={idx} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {filteredEpisodes.length === 0 ? (
        <div className="content-hub-empty">
          <Search size={48} />
          <h4>Tidak ada episode yang cocok</h4>
          <p>Coba gunakan kata kunci pencarian atau filter program siaran yang berbeda.</p>
        </div>
      ) : (
        <div className="podcast-list">
          {filteredEpisodes.map(ep => (
            <EpisodeCard
              key={ep.episodeId}
              episode={ep}
              onPlay={(episode) => setActiveEpisode(episode)}
              isPlaying={activeEpisode?.episodeId === ep.episodeId}
            />
          ))}
        </div>
      )}

      {activeEpisode && (
        <EpisodePlayer
          episode={activeEpisode}
          onClose={() => setActiveEpisode(null)}
        />
      )}
    </div>
  );
}
