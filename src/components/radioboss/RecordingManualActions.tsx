import { Play, RotateCcw, SkipForward, Square } from "lucide-react";
import type { RadiobossCommand } from "../../types/domain";

type RecordingManualActionsProps = {
  canStart: boolean;
  canStop: boolean;
  canSkip: boolean;
  retryCommand: RadiobossCommand | null;
  busy: boolean;
  disabledReason: string;
  onStart: () => void;
  onStop: () => void;
  onSkip: () => void;
  onRetry: (command: RadiobossCommand) => void;
};

export function RecordingManualActions({
  canStart,
  canStop,
  canSkip,
  retryCommand,
  busy,
  disabledReason,
  onStart,
  onStop,
  onSkip,
  onRetry
}: RecordingManualActionsProps) {
  return (
    <section className="radioboss-page-card recording-actions-card">
      <div className="radioboss-card-head">
        <strong>Aksi manual</strong>
        <small>{disabledReason || "Aksi akan masuk antrean command dan dieksekusi Studio Gateway."}</small>
      </div>

      <div className="recording-action-grid">
        <button type="button" onClick={onStart} disabled={!canStart || busy}>
          <Play size={17} />
          Mulai Rekam Program Ini
        </button>
        <button type="button" className="danger" onClick={onStop} disabled={!canStop || busy}>
          <Square size={17} />
          Stop Rekaman
        </button>
        <button type="button" onClick={onSkip} disabled={!canSkip || busy}>
          <SkipForward size={17} />
          Tandai Tidak Perlu Direkam
        </button>
        <button
          type="button"
          onClick={() => retryCommand && onRetry(retryCommand)}
          disabled={!retryCommand || busy}
        >
          <RotateCcw size={17} />
          Retry Command
        </button>
      </div>

      {retryCommand && (
        <div className="recording-retry-note">
          Command terakhir: <strong>{retryCommand.type}</strong> - {retryCommand.errorMessageSafe || retryCommand.errorCode || retryCommand.status}
        </div>
      )}
    </section>
  );
}
