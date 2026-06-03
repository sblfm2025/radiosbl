import { useState, useEffect } from "react";
import { Radio, Clock, RefreshCw, MessageCircle, Inbox, CheckCircle2, Send } from "lucide-react";
import type { SongRequest } from "../types/domain";
import {
  listSongRequests,
  subscribeSongRequests
} from "../services/songRequest.service";

type RequestGroup = "received" | "sending" | "delivered" | "archive";

const groupMeta: Record<RequestGroup, { title: string; label: string; tone: string; empty: string }> = {
  received: {
    title: "Masuk",
    label: "Menunggu gateway",
    tone: "danger",
    empty: "Belum ada request lagu masuk."
  },
  sending: {
    title: "Proses kirim",
    label: "Command dibuat",
    tone: "warning",
    empty: "Belum ada request yang sedang dikirim."
  },
  delivered: {
    title: "Masuk RadioBOSS",
    label: "Sudah diterima",
    tone: "primary",
    empty: "Belum ada request yang diterima RadioBOSS."
  },
  archive: {
    title: "Arsip",
    label: "Riwayat lama",
    tone: "muted",
    empty: "Belum ada request yang masuk arsip."
  }
};

function getSongTitle(request: SongRequest): string {
  return [request.artist, request.title].filter(Boolean).join(" - ");
}

function getStatusLabel(status: SongRequest["status"]): string {
  switch (status) {
    case "pending_review":
      return "Masuk";
    case "notified":
      return "Masuk";
    case "queued":
      return "Masuk RadioBOSS";
    case "matched":
      return "Masuk";
    case "needs_review":
      return "Masuk";
    case "sent_to_radioboss":
      return "Proses kirim";
    case "expired":
      return "Arsip";
    case "played":
      return "Arsip";
    case "rejected":
      return "Arsip";
    default:
      return "Masuk";
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

  const groupedRequests: Record<RequestGroup, SongRequest[]> = {
    received: requests.filter((request) => ["new", "notified", "pending_review", "matched", "needs_review"].includes(request.status)),
    sending: requests.filter((request) => request.status === "sent_to_radioboss"),
    delivered: requests.filter((request) => request.status === "queued"),
    archive: requests.filter((request) => ["played", "rejected", "expired"].includes(request.status))
  };
  const activeRequestCount = groupedRequests.received.length + groupedRequests.sending.length + groupedRequests.delivered.length;
  const latestRequest = requests[0];
  const latestRequestLabel = latestRequest
    ? `${getSongTitle(latestRequest)} - ${formatRequestTime(latestRequest.createdAt)}`
    : "Belum ada request terbaru";

  const renderRequestCard = (request: SongRequest, group: RequestGroup) => (
    <article className={`song-request-card ${group}`} key={request.id}>
      <div className="song-request-icon">
        {group === "sending" && <Send size={20} />}
        {group === "delivered" && <Clock size={20} />}
        {group === "archive" && <CheckCircle2 size={20} />}
        {group === "received" && <Radio size={20} />}
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
        {(request.rawMessage || request.message || request.dedication) && (
          <blockquote>{request.rawMessage || request.message || request.dedication}</blockquote>
        )}
      </div>
    </article>
  );

  const renderGroup = (group: RequestGroup, items: SongRequest[]) => {
    const meta = groupMeta[group];
    const visibleItems = group === "archive" ? items.slice(0, 5) : items;

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
            <strong>{groupedRequests.received.length}</strong>
            <span>Masuk</span>
          </article>
          <article>
            <small>Gateway</small>
            <strong>{groupedRequests.sending.length}</strong>
            <span>Proses kirim</span>
          </article>
          <article>
            <small>RadioBOSS</small>
            <strong>{groupedRequests.delivered.length}</strong>
            <span>Masuk RadioBOSS</span>
          </article>
          <article>
            <small>Riwayat</small>
            <strong>{groupedRequests.archive.length}</strong>
            <span>Arsip</span>
          </article>
        </section>

        <div className="song-request-stack">
          {renderGroup("received", groupedRequests.received)}
          {renderGroup("sending", groupedRequests.sending)}
          {renderGroup("delivered", groupedRequests.delivered)}
          {renderGroup("archive", groupedRequests.archive)}
        </div>
      </div>
    </main>
  );
}
