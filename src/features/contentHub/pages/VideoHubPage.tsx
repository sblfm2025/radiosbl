import { useState, useEffect, useMemo } from "react";
import { subscribeActiveVideoItems, type VideoItem } from "../services/videoHub.service";
import { VideoCard } from "../components/VideoCard";
import { Video, Search, Tv } from "lucide-react";
import "../styles/contentHub.css";

const fallbackVideos: VideoItem[] = [
  {
    videoId: "fb-1",
    title: "Pinrang Berkabar | Cegah Dampak Abrasi, Tanggul Pantai Ujung Lero Mulai Dikerjakan",
    description: "Pemerintah Kabupaten Pinrang resmi memulai pengerjaan tanggul pantai Ujung Lero untuk mengantisipasi abrasi berkelanjutan dan melindungi permukiman warga pesisir.",
    source: "youtube",
    embedUrl: "https://www.youtube.com/embed/5H-P4BqD394",
    tags: ["pinrang-berkabar"],
    status: "published",
    publishedAt: "2026-05-20T08:00:00Z",
    createdAt: "2026-05-20T08:00:00Z",
    updatedAt: "2026-05-20T08:00:00Z"
  },
  {
    videoId: "fb-2",
    title: "SBL TV | Talkshow Bersama Bupati Pinrang Peringatan Hari Jadi Kabupaten",
    description: "Kanal siaran SBL TV menyiarkan talkshow interaktif khusus mengupas sejarah, capaian pembangunan, dan masa depan Kabupaten Pinrang bersama jajaran Forkopimda.",
    source: "youtube",
    embedUrl: "https://www.youtube.com/embed/rQ7Q65tV0vQ",
    tags: ["live-ob", "event"],
    status: "published",
    publishedAt: "2026-05-18T10:00:00Z",
    createdAt: "2026-05-18T10:00:00Z",
    updatedAt: "2026-05-18T10:00:00Z"
  }
];

export default function VideoHubPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    return subscribeActiveVideoItems((items) => {
      setVideos(items);
    });
  }, []);

  const videoList = videos.length > 0 ? videos : fallbackVideos;

  const categories = [
    { id: "all", label: "Semua Kategori" },
    { id: "pinrang-berkabar", label: "Pinrang Berkabar" },
    { id: "live-ob", label: "Liputan OB" },
    { id: "podcast", label: "Podcast Video" },
    { id: "event", label: "Event Live" }
  ];

  const filteredVideos = useMemo(() => {
    return videoList.filter(vid => {
      const matchQuery = `${vid.title} ${vid.description || ""} ${vid.tags.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase().trim());
      
      const matchCategory = selectedCategory === "all" ? true : vid.tags.includes(selectedCategory);
      return matchQuery && matchCategory;
    });
  }, [videoList, query, selectedCategory]);

  return (
    <div className="content-hub-page video-hub-page" data-testid="video-hub-page">
      <section className="content-hub-hero">
        <div className="content-hub-hero-icon video">
          <Tv size={64} />
        </div>
        <div>
          <p className="content-hub-eyebrow video">SBL TV</p>
          <h2>Video Hub & Live Streaming Visual</h2>
          <p>
            Tonton siaran tunda talkshow, dokumenter eksklusif Pinrang Berkabar, liputan outdoor broadcasting (OB) secara visual, serta rekaman liputan lapangan terkini.
          </p>
        </div>
      </section>

      <div className="content-hub-controls">
        <div className="video-categories">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`video-category-chip ${selectedCategory === cat.id ? "active" : ""}`}
              data-testid={`category-chip-${cat.id}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="content-hub-search">
          <Search size={18} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari video berdasarkan judul atau kata kunci..."
            aria-label="Cari video"
          />
        </div>
      </div>

      {filteredVideos.length === 0 ? (
        <div className="content-hub-empty">
          <Video size={48} />
          <h4>Video tidak ditemukan</h4>
          <p>Coba ganti kategori filter atau gunakan kata kunci pencarian lainnya.</p>
        </div>
      ) : (
        <div className="video-grid" data-testid="video-grid">
          {filteredVideos.map((vid) => (
            <VideoCard key={vid.videoId} video={vid} />
          ))}
        </div>
      )}
    </div>
  );
}
