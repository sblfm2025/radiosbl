import { RotateCcw, Square } from "lucide-react";
import type { RadiobossCommand } from "../../types/domain";

type RecordingManualActionsProps = {
  canStop: boolean;
  retryCommand: RadiobossCommand | null;
  busy: boolean;
  disabledReason: string;
  onStop: () => void;
  onRetry: (command: RadiobossCommand) => void;
};

export function RecordingManualActions({
  canStop,
  retryCommand,
  busy,
  disabledReason,
  onStop,
  onRetry
}: RecordingManualActionsProps) {
  const visibleActions = [
    canStop ? "stop" : "",
    retryCommand ? "retry" : ""
  ].filter(Boolean);

  return (
    <section className="radioboss-page-card recording-actions-card">
      <div className="radioboss-card-head">
        <strong>Intervensi manual</strong>
        <small>{disabledReason || "Auto recording mengikuti absensi penyiar. Gunakan aksi ini hanya saat perlu."}</small>
      </div>

      {visibleActions.length > 0 ? (
        <div className="recording-action-grid">
          {canStop && (
            <button type="button" className="danger" onClick={onStop} disabled={busy}>
              <Square size={17} />
              Stop Manual
            </button>
          )}
          {retryCommand && (
            <button
              type="button"
              onClick={() => onRetry(retryCommand)}
              disabled={busy}
            >
              <RotateCcw size={17} />
              Retry Command
            </button>
          )}
        </div>
      ) : (
        <div className="recording-action-empty">
          Tidak ada aksi manual yang diperlukan untuk slot ini.
        </div>
      )}

      {retryCommand && (
        <div className="recording-retry-note">
          Command terakhir: <strong>{retryCommand.type}</strong> - {retryCommand.errorMessageSafe || retryCommand.errorCode || retryCommand.status}
        </div>
      )}
    </section>
  );
}
