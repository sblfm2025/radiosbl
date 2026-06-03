import { useState, useEffect } from "react";
import { Radio, Clock, PlayCircle, XCircle, RefreshCw, MessageCircle, Inbox, CheckCircle2 } from "lucide-react";
import type { SongRequest } from "../types/domain";
import {
  listSongRequests,
  subscribeSongRequests,
  updateSongRequestStatus
} from "../services/songRequest.service";

type RequestGroup = "new" | "queued" | "done";

const groupMeta: Record<RequestGroup, { title: string; label: string; tone: string; empty: string }> = {
  new: {
    title: "Masuk sekarang",
    label: "Butuh diproses",
    tone: "danger",
    empty: "Belum ada request lagu masuk."
  },
  queued: {
    title: "Siap diputar",
    label: "Dalam antrean",
    tone: "primary",
    empty: "Antrean putar masih kosong."
  },
  done: {
    title: "Riwayat",
    label: "Selesai",
    tone: "muted",
    empty: "Belum ada request yang selesai diproses."
  }
};

function getSongTitle(request: SongRequest): string {
  return [request.artist, request.title].filter(Boolean).join(" - ");
}

function getStatusLabel(status: SongRequest["status"]): string {
  switch (status) {
    case "notified":
      return "Terkirim WA";
    case "queued":
      return "Antrean";
    case "matched":
      return "Cocok";
    case "needs_review":
      return "Review";
    case "sent_to_radioboss":
      return "Dikirim";
    case "expired":
      return "Kedaluwarsa";
    case "played":
      return "Diputar";
    case "rejected":
      return "Ditolak";
    default:
      return "Baru";
  }
}

function toDate(value: SongRequest["createdAt"] | { toDate?: () => Date; seconds?: number }): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (value && typeof value === "object") {
    if ("toDate" in value && typeof value.toDate === "function") {
      return value.toDate();
    }
    if ("seconds" in value && typeof value.seconds === "number") {
      return new Date(value.seconds * 1000);
    }
  }

  return null;
}

function formatRequestTime(value: SongRequest["createdAt"]): string {
  const date = toDate(value);
  if (!date) {
    return "Baru masuk";
  }

  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function SongRequestsPage() {
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  async function loadRequests() {
    setLoading(true);
    const nextRequests = await listSongRequests();
    setRequests(nextRequests);
    setLoading(false);
  }

  useEffect(() => {
    const unsubscribe = subscribeSongRequests((nextRequests) => {
      setRequests(nextRequests);
      setLoading(false);
    });

    void loadRequests();

    return () => unsubscribe();
  }, []);

  async function handleStatus(request: SongRequest, status: SongRequest["status"]) {
    const updated = await updateSongRequestStatus(request, status);
    setRequests((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    );
    setNotice(`Request "${updated.title}" diperbarui menjadi ${getStatusLabel(status)}.`);
    window.setTimeout(() => setNotice(""), 3000);
  }

  const groupedRequests = {
    new: requests.filter((request) => ["new", "notified", "matched", "needs_review"].includes(request.status)),
    queued: requests.filter((request) => request.status === "sent_to_radioboss" || request.status === "queued"),
    done: requests.filter((request) => ["played", "rejected", "expired"].includes(request.status))
  };
  const activeRequestCount = groupedRequests.new.length + groupedRequests.queued.length;
  const latestRequest = requests[0];
  const latestRequestLabel = latestRequest
    ? `${getSongTitle(latestRequest)} - ${formatRequestTime(latestRequest.createdAt)}`
    : "Belum ada request terbaru";

  const renderRequestCard = (request: SongRequest, group: RequestGroup) => (
    <article className={`song-request-card ${group}`} key={request.id}>
      <div className="song-request-icon">
        {group === "queued" ? <Clock size={20} /> : group === "done" ? <CheckCircle2 size={20} /> : <Radio size={20} />}
      </div>

      <div className="song-request-copy">
        <div className="song-request-title-row">
          <h3>{getSongTitle(request)}</h3>
          <span className={`song-request-status ${request.status}`}>{getStatusLabel(request.status)}</span>
        </div>
        <p>
          Dari <strong>{request.requesterName}</strong>
          {request.announcerName && <span> untuk {request.announcerName}</span>}
        </p>
        <time className="song-request-time" dateTime={toDate(request.createdAt)?.toISOString()}>
          Masuk {formatRequestTime(request.createdAt)}
        </time>
        {request.requesterWhatsapp && (
          <span className="song-request-whatsapp">
            <MessageCircle size={14} /> {request.requesterWhatsapp}
          </span>
        )}
        {request.message && (
          <blockquote>{request.message}</blockquote>
        )}

        <div className="song-request-actions">
          {group === "new" && (
            <button type="button" className="primary" onClick={() => handleStatus(request, "queued")}>
              <Clock size={16} /> Simpan ke antrean
            </button>
          )}
          {group === "queued" && (
            <button type="button" className="success" onClick={() => handleStatus(request, "played")}>
              <PlayCircle size={17} /> Tandai diputar
            </button>
          )}
          {request.whatsappUrl && (
            <a href={request.whatsappUrl} target="_blank" rel="noreferrer" aria-label={`Balas WhatsApp ${request.requesterName}`}>
              <MessageCircle size={17} /> Balas
            </a>
          )}
          {group !== "done" && (
            <button type="button" className="danger" onClick={() => handleStatus(request, "rejected")}>
              <XCircle size={17} /> Tolak
            </button>
          )}
        </div>
      </div>
    </article>
  );

  const renderGroup = (group: RequestGroup, items: SongRequest[]) => {
    const meta = groupMeta[group];
    const visibleItems = group === "done" ? items.slice(0, 5) : items;

    return (
      <section className="song-request-section" aria-label={meta.title}>
        <div className="song-request-section-head">
          <span className={`song-request-dot ${meta.tone}`} />
          <div>
            <h2>{meta.title}</h2>
            <p>{meta.label}</p>
          </div>
          <strong>{items.length}</strong>
        </div>

        {loading ? (
          <div className="song-request-skeleton-list" aria-label={`Memuat ${meta.title}`}>
            {Array.from({ length: 2 }).map((_, index) => (
              <div className="ui-skeleton-card" key={index}>
                <span className="ui-skeleton line short" />
                <span className="ui-skeleton line" />
                <span className="ui-skeleton line medium" />
              </div>
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="song-request-empty">
            <Inbox size={24} />
            <p>{meta.empty}</p>
          </div>
        ) : (
          <div className="song-request-list">
            {visibleItems.map((request) => renderRequestCard(request, group))}
          </div>
        )}
      </section>
    );
  };

  return (
    <main className="song-requests-page">
      <div className="schedule-page-header">
        <div className="song-requests-header">
          <div className="schedule-title-lockup">
            <img src="/LogoSBL.svg" alt="Radio SBL" />
            <div>
              <p className="eyebrow">Interaksi Pendengar</p>
              <h1>Request Lagu</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={loadRequests}
            className="song-request-refresh"
            aria-label="Muat ulang request lagu"
          >
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
        </div>
      </div>

      <div className="song-request-content">
        {notice && <p className="song-request-notice">{notice}</p>}

        <section className="song-request-live-strip" aria-label="Status realtime request lagu">
          <div>
            <span className={activeRequestCount > 0 ? "is-live" : ""} />
            <strong>{activeRequestCount > 0 ? "Antrean aktif" : "Menunggu request"}</strong>
            <small>{latestRequestLabel}</small>
          </div>
          <button type="button" onClick={loadRequests}>
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            Sinkronkan
          </button>
        </section>

        <section className="song-request-summary" aria-label="Ringkasan request lagu">
          <article>
            <small>Realtime</small>
            <strong>{groupedRequests.new.length}</strong>
            <span>Request masuk</span>
          </article>
          <article>
            <small>Antrean</small>
            <strong>{groupedRequests.queued.length}</strong>
            <span>Siap diputar</span>
          </article>
          <article>
            <small>Riwayat</small>
            <strong>{groupedRequests.done.length}</strong>
            <span>Selesai</span>
          </article>
        </section>

        <div className="song-request-stack">
          {renderGroup("new", groupedRequests.new)}
          {renderGroup("queued", groupedRequests.queued)}
          {renderGroup("done", groupedRequests.done)}
        </div>
      </div>
    </main>
  );
}
