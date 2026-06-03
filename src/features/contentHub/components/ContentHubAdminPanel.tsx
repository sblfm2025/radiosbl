import { useState, useEffect } from "react";
import { submitEpisode, updateEpisode, subscribeEpisodes, type ProgramEpisode } from "../services/episode.service";
import { submitVideoItem, updateVideoItem, subscribeVideoItems, type VideoItem } from "../services/videoHub.service";
import { weeklyBroadcastSchedule } from "../../../data/radioData";
import "../styles/contentHub.css";

export function ContentHubAdminPanel() {
  const [activeSubTab, setActiveSubTab] = useState<"podcast" | "video">("podcast");
  
  const [episodes, setEpisodes] = useState<ProgramEpisode[]>([]);
  const [epTitle, setEpTitle] = useState("");
  const [epProgram, setEpProgram] = useState("");
  const [epDesc, setEpDesc] = useState("");
  const [epAudioUrl, setEpAudioUrl] = useState("");
  const [epCoverUrl, setEpCoverUrl] = useState("");
  const [epTags, setEpTags] = useState("");
  const [epStatus, setEpStatus] = useState<ProgramEpisode['status']>("published");
  const [epSubmitting, setEpSubmitting] = useState(false);
  const [epNotice, setEpNotice] = useState("");
  const [epError, setEpError] = useState("");

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [vidTitle, setVidTitle] = useState("");
  const [vidDesc, setVidDesc] = useState("");
  const [vidSource, setVidSource] = useState<VideoItem['source']>("youtube");
  const [vidEmbedUrl, setVidEmbedUrl] = useState("");
  const [vidTags, setVidTags] = useState("");
  const [vidStatus, setVidStatus] = useState<VideoItem['status']>("published");
  const [vidSubmitting, setVidSubmitting] = useState(false);
  const [vidNotice, setVidNotice] = useState("");
  const [vidError, setVidError] = useState("");

  const programOptions = Array.from(new Set(weeklyBroadcastSchedule.map(s => s.program))).sort();

  useEffect(() => {
    const unsubEpisodes = subscribeEpisodes(setEpisodes);
    const unsubVideos = subscribeVideoItems(setVideos);
    return () => {
      unsubEpisodes();
      unsubVideos();
    };
  }, []);

  const handleCreateEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    setEpError("");
    setEpNotice("");
    setEpSubmitting(true);

    try {
      const tagsArray = epTags.split(",").map(t => t.trim()).filter(Boolean);
      await submitEpisode({
        title: epTitle.trim(),
        programId: epProgram.replace(/\s+/g, '-').toLowerCase(),
        programTitle: epProgram,
        description: epDesc.trim() || undefined,
        audioUrl: epAudioUrl.trim(),
        coverImageUrl: epCoverUrl.trim() || undefined,
        tags: tagsArray,
        status: epStatus,
        createdBy: "Operator SBL",
        durationSeconds: 1200
      });

      setEpTitle("");
      setEpProgram("");
      setEpDesc("");
      setEpAudioUrl("");
      setEpCoverUrl("");
      setEpTags("");
      setEpNotice("Episode podcast berhasil ditambahkan!");
    } catch (err: any) {
      setEpError(err?.message || "Gagal menambahkan episode.");
    } finally {
      setEpSubmitting(false);
    }
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setVidError("");
    setVidNotice("");
    setVidSubmitting(true);

    try {
      const tagsArray = vidTags.split(",").map(t => t.trim()).filter(Boolean);
      
      let embedUrl = vidEmbedUrl.trim();
      if (embedUrl.includes("youtube.com/watch?v=")) {
        const videoId = new URL(embedUrl).searchParams.get("v");
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (embedUrl.includes("youtu.be/")) {
        const parts = embedUrl.split("/");
        const videoId = parts[parts.length - 1].split("?")[0];
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }

      await submitVideoItem({
        title: vidTitle.trim(),
        description: vidDesc.trim() || undefined,
        source: vidSource,
        embedUrl,
        tags: tagsArray,
        status: vidStatus
      });

      setVidTitle("");
      setVidDesc("");
      setVidSource("youtube");
      setVidEmbedUrl("");
      setVidTags("");
      setVidNotice("Video SBL TV berhasil ditambahkan!");
    } catch (err: any) {
      setVidError(err?.message || "Gagal menambahkan video.");
    } finally {
      setVidSubmitting(false);
    }
  };

  const handleUpdateEpisodeStatus = async (episodeId: string, status: ProgramEpisode['status']) => {
    try {
      await updateEpisode(episodeId, { status });
    } catch (err) {
      console.error("Gagal memperbarui status episode:", err);
    }
  };

  const handleUpdateVideoStatus = async (videoId: string, status: VideoItem['status']) => {
    try {
      await updateVideoItem(videoId, { status });
    } catch (err) {
      console.error("Gagal memperbarui status video:", err);
    }
  };

  return (
    <div className="content-hub-admin-panel" data-testid="content-hub-admin">
      <div className="studio-inbox-tabs" style={{ marginBottom: "16px" }}>
        <button
          className={`studio-inbox-tab ${activeSubTab === "podcast" ? "active" : ""}`}
          onClick={() => setActiveSubTab("podcast")}
          data-testid="tab-admin-podcast"
        >
          Kelola Podcast ({episodes.length})
        </button>
      </div>

      {activeSubTab === "podcast" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
          <div className="create-poll-card" style={{ background: "rgba(255, 255, 255, 0.01)" }}>
            <h3 style={{ fontSize: "1rem", color: "#10b981", marginBottom: "12px" }}>Tambah Episode Podcast</h3>
            <form onSubmit={handleCreateEpisode} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input
                  className="create-poll-input"
                  placeholder="Judul Episode"
                  value={epTitle}
                  onChange={(e) => setEpTitle(e.target.value)}
                  required
                  data-testid="input-episode-title"
                />
                <select
                  className="create-poll-input"
                  value={epProgram}
                  onChange={(e) => setEpProgram(e.target.value)}
                  required
                  data-testid="select-episode-program"
                  style={{ background: "#0a0f1d", color: "#fff" }}
                >
                  <option value="">-- Pilih Program Siaran --</option>
                  {programOptions.map((p, idx) => (
                    <option key={idx} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <textarea
                className="create-poll-input"
                placeholder="Deskripsi Singkat Episode (opsional)"
                value={epDesc}
                onChange={(e) => setEpDesc(e.target.value)}
                rows={2}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input
                  className="create-poll-input"
                  placeholder="URL File Audio (MP3/M4A)"
                  value={epAudioUrl}
                  onChange={(e) => setEpAudioUrl(e.target.value)}
                  required
                  data-testid="input-episode-audio-url"
                />
                <input
                  className="create-poll-input"
                  placeholder="URL Gambar Cover (opsional)"
                  value={epCoverUrl}
                  onChange={(e) => setEpCoverUrl(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input
                  className="create-poll-input"
                  placeholder="Tag (pisahkan dengan koma: bincang, edukasi)"
                  value={epTags}
                  onChange={(e) => setEpTags(e.target.value)}
                />
                <select
                  className="create-poll-input"
                  value={epStatus}
                  onChange={(e) => setEpStatus(e.target.value as any)}
                  style={{ background: "#0a0f1d", color: "#fff" }}
                >
                  <option value="published">Langsung Publikasikan (Published)</option>
                  <option value="draft">Simpan Sebagai Draft</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={epSubmitting}
                className="action-btn primary"
                style={{ width: "100%", marginTop: "6px" }}
                data-testid="btn-submit-episode"
              >
                {epSubmitting ? "Menyimpan..." : "Simpan Episode"}
              </button>

              {epError && <p className="streaming-request-alert error">{epError}</p>}
              {epNotice && <p className="streaming-request-alert success">{epNotice}</p>}
            </form>
          </div>

          <div className="create-poll-card">
            <h3 style={{ fontSize: "1rem", marginBottom: "12px" }}>Daftar Episode Podcast</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {episodes.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textAlign: "center" }}>
                  Belum ada episode podcast yang diunggah.
                </p>
              ) : (
                episodes.map(ep => (
                  <div
                    key={ep.episodeId}
                    style={{
                      padding: "10px",
                      background: "rgba(255,255,255,0.01)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                    data-testid={`admin-episode-card-${ep.episodeId}`}
                  >
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "#fff" }}>{ep.title}</strong>
                      <span style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                        Program: {ep.programTitle} | Status: <strong style={{ color: ep.status === 'published' ? '#10b981' : '#f59e0b' }}>{ep.status}</strong>
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      {ep.status === 'draft' && (
                        <button
                          onClick={() => handleUpdateEpisodeStatus(ep.episodeId, 'published')}
                          className="action-btn primary"
                          style={{ padding: "4px 8px", fontSize: "0.7rem" }}
                          data-testid={`btn-publish-ep-${ep.episodeId}`}
                        >
                          Publish
                        </button>
                      )}
                      {ep.status === 'published' && (
                        <button
                          onClick={() => handleUpdateEpisodeStatus(ep.episodeId, 'draft')}
                          className="action-btn"
                          style={{ padding: "4px 8px", fontSize: "0.7rem" }}
                          data-testid={`btn-draft-ep-${ep.episodeId}`}
                        >
                          Tarik ke Draft
                        </button>
                      )}
                      {ep.status !== 'archived' && (
                        <button
                          onClick={() => handleUpdateEpisodeStatus(ep.episodeId, 'archived')}
                          className="action-btn danger"
                          style={{ padding: "4px 8px", fontSize: "0.7rem" }}
                          data-testid={`btn-archive-ep-${ep.episodeId}`}
                        >
                          Arsip
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
          <div className="create-poll-card" style={{ background: "rgba(255, 255, 255, 0.01)" }}>
            <h3 style={{ fontSize: "1rem", color: "#10b981", marginBottom: "12px" }}>Tambah Video SBL TV</h3>
            <form onSubmit={handleCreateVideo} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input
                  className="create-poll-input"
                  placeholder="Judul Video"
                  value={vidTitle}
                  onChange={(e) => setVidTitle(e.target.value)}
                  required
                  data-testid="input-video-title"
                />
                <select
                  className="create-poll-input"
                  value={vidSource}
                  onChange={(e) => setVidSource(e.target.value as any)}
                  style={{ background: "#0a0f1d", color: "#fff" }}
                >
                  <option value="youtube">YouTube Video</option>
                  <option value="facebook">Facebook Video</option>
                  <option value="external">Eksternal Embed</option>
                </select>
              </div>

              <input
                className="create-poll-input"
                placeholder="URL Embed Video (Contoh: https://www.youtube.com/embed/VIDEO_ID)"
                value={vidEmbedUrl}
                onChange={(e) => setVidEmbedUrl(e.target.value)}
                required
                data-testid="input-video-embed-url"
              />

              <textarea
                className="create-poll-input"
                placeholder="Deskripsi Singkat Video (opsional)"
                value={vidDesc}
                onChange={(e) => setVidDesc(e.target.value)}
                rows={2}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input
                  className="create-poll-input"
                  placeholder="Tag (contoh: pinrang-berkabar, live-ob, event)"
                  value={vidTags}
                  onChange={(e) => setVidTags(e.target.value)}
                />
                <select
                  className="create-poll-input"
                  value={vidStatus}
                  onChange={(e) => setVidStatus(e.target.value as any)}
                  style={{ background: "#0a0f1d", color: "#fff" }}
                >
                  <option value="published">Langsung Publikasikan (Published)</option>
                  <option value="draft">Simpan Sebagai Draft</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={vidSubmitting}
                className="action-btn primary"
                style={{ width: "100%", marginTop: "6px" }}
                data-testid="btn-submit-video"
              >
                {vidSubmitting ? "Menyimpan..." : "Simpan Video"}
              </button>

              {vidError && <p className="streaming-request-alert error">{vidError}</p>}
              {vidNotice && <p className="streaming-request-alert success">{vidNotice}</p>}
            </form>
          </div>

          <div className="create-poll-card">
            <h3 style={{ fontSize: "1rem", marginBottom: "12px" }}>Daftar Video</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {videos.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textAlign: "center" }}>
                  Belum ada video yang diunggah.
                </p>
              ) : (
                videos.map(vid => (
                  <div
                    key={vid.videoId}
                    style={{
                      padding: "10px",
                      background: "rgba(255,255,255,0.01)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                    data-testid={`admin-video-card-${vid.videoId}`}
                  >
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "#fff" }}>{vid.title}</strong>
                      <span style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                        Sumber: {vid.source} | Tags: {vid.tags.join(", ")} | Status: <strong style={{ color: vid.status === 'published' ? '#10b981' : '#f59e0b' }}>{vid.status}</strong>
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      {vid.status === 'draft' && (
                        <button
                          onClick={() => handleUpdateVideoStatus(vid.videoId, 'published')}
                          className="action-btn primary"
                          style={{ padding: "4px 8px", fontSize: "0.7rem" }}
                          data-testid={`btn-publish-vid-${vid.videoId}`}
                        >
                          Publish
                        </button>
                      )}
                      {vid.status === 'published' && (
                        <button
                          onClick={() => handleUpdateVideoStatus(vid.videoId, 'draft')}
                          className="action-btn"
                          style={{ padding: "4px 8px", fontSize: "0.7rem" }}
                          data-testid={`btn-draft-vid-${vid.videoId}`}
                        >
                          Tarik ke Draft
                        </button>
                      )}
                      {vid.status !== 'archived' && (
                        <button
                          onClick={() => handleUpdateVideoStatus(vid.videoId, 'archived')}
                          className="action-btn danger"
                          style={{ padding: "4px 8px", fontSize: "0.7rem" }}
                          data-testid={`btn-archive-vid-${vid.videoId}`}
                        >
                          Arsip
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
