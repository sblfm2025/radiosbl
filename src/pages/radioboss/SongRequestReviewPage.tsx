import { useEffect, useMemo, useState } from "react";
import { Inbox, ListChecks } from "lucide-react";
import { SongRequestQueue } from "../../components/radioboss/SongRequestQueue";
import type { AuthSession } from "../../services/auth.service";
import type { SongRequest } from "../../types/domain";
import { subscribeSongRequests, updateSongRequestStatus } from "../../services/songRequest.service";
import {
  markSongRequestPlayed,
  matchSongRequestToLibrary,
  rejectSongRequest,
  sendSongRequestToRadioBoss
} from "../../services/radioboss/songRequests.service";

type SongRequestReviewPageProps = {
  session: AuthSession | null;
};

const reviewStatuses = new Set<SongRequest["status"]>([
  "new",
  "notified",
  "pending_review",
  "matched",
  "needs_review",
  "sent_to_radioboss",
  "queued"
]);

export default function SongRequestReviewPage({ session }: SongRequestReviewPageProps) {
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => subscribeSongRequests(setRequests), []);

  const queue = useMemo(
    () => requests.filter((request) => reviewStatuses.has(request.status)),
    [requests]
  );
  const stats = {
    masuk: requests.filter((request) => request.status === "new" || request.status === "notified" || request.status === "pending_review").length,
    matched: requests.filter((request) => request.status === "matched").length,
    review: requests.filter((request) => request.status === "needs_review" || request.status === "pending_review").length,
    sent: requests.filter((request) => request.status === "sent_to_radioboss" || request.status === "queued").length,
    played: requests.filter((request) => request.status === "played").length
  };

  async function runAction(request: SongRequest, action: () => Promise<SongRequest>, message: string) {
    setBusyId(request.id);
    setNotice("");
    try {
      const updated = await action();
      setRequests((current) => current.map((item) => item.id === updated.id ? updated : item));
      setNotice(message);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Aksi request lagu gagal diproses.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="radioboss-page">
      <section className="radioboss-page-hero">
        <div>
          <p className="eyebrow">Integrasi RadioBOSS</p>
          <h1>Review Request Lagu</h1>
          <p>Request WhatsApp otomatis masuk ke Song Requests RadioBOSS lewat file dummy. Penyiar cukup memantau, menandai diputar, atau menolak bila tidak sesuai.</p>
        </div>
        <span className="radioboss-hero-icon" aria-hidden="true">
          <Inbox size={24} />
        </span>
      </section>

      {notice && <div className="radioboss-page-message">{notice}</div>}

      <section className="radioboss-stat-grid" aria-label="Ringkasan request lagu">
        <article><ListChecks size={18} /><span>Masuk</span><strong>{stats.masuk}</strong></article>
        <article><ListChecks size={18} /><span>Cocok</span><strong>{stats.matched}</strong></article>
        <article><ListChecks size={18} /><span>Review</span><strong>{stats.review}</strong></article>
        <article><ListChecks size={18} /><span>Dikirim</span><strong>{stats.sent}</strong></article>
        <article><ListChecks size={18} /><span>Diputar</span><strong>{stats.played}</strong></article>
      </section>

      <article className="radioboss-page-card">
        <div className="radioboss-card-head">
          <strong>Antrean request RadioBOSS</strong>
          <small>Item berstatus queued sudah dikirim ke RadioBOSS. Tandai diputar setelah penyiar mengeksekusi atau mengganti lagu di studio.</small>
        </div>
        <SongRequestQueue
          requests={queue}
          busy={Boolean(busyId)}
          onMatch={(request) => void runAction(request, () => matchSongRequestToLibrary(request), "Request sudah dicocokkan ke library.")}
          onSend={(request) => void runAction(request, () => sendSongRequestToRadioBoss(request, session), "Command ADD_TRACK_TO_QUEUE dibuat.")}
          onPlayed={(request) => void runAction(request, () => markSongRequestPlayed(request), "Request ditandai sudah diputar.")}
          onReject={(request) => {
            const reason = window.prompt("Alasan penolakan:", "Lagu belum tersedia atau tidak sesuai program");
            if (!reason) return;
            void runAction(request, () => rejectSongRequest(request, session, reason), "Request ditolak.");
          }}
          onManualFile={(request, trackId, filePath) => void runAction(
            request,
            () => updateSongRequestStatus(request, "needs_review", {
              matchStatus: "matched",
              matchedTrackId: trackId,
              matchedFilePath: filePath,
              confidence: 100
            }),
            "File manual dipasang ke request."
          )}
        />
      </article>
    </main>
  );
}
