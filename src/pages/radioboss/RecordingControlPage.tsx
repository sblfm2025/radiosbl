import { useEffect, useMemo, useState } from "react";
import { RadioTower, Settings2 } from "lucide-react";
import { RecordingManualActions } from "../../components/radioboss/RecordingManualActions";
import { RecordingStatusCard } from "../../components/radioboss/RecordingStatusCard";
import { useCurrentBroadcastSlot } from "../../hooks/useCurrentBroadcastSlot";
import { getScheduleSlotId } from "../../services/scheduleSlot.service";
import type { AuthSession } from "../../services/auth.service";
import type { ProgramRecording, ProgramRecordingRule, RadiobossCommand } from "../../types/domain";
import { canUser } from "../../utils/rbac";
import {
  resolveGatewayOnline,
  resolveRadioBossOnline,
  subscribeGatewayHeartbeat,
  subscribeRadioBossStatus,
  type RadioBossGatewayHeartbeat,
  type RadioBossStatus
} from "../../services/radioboss/radiobossStatus.service";
import {
  buildDefaultRecordingRule,
  getProgramRecordingRuleId,
  subscribeProgramRecordingRules
} from "../../services/radioboss/recordingRules.service";
import { isRecordableBroadcastSlot } from "../../services/radioboss/recordingAutomation.service";
import {
  subscribeActiveProgramRecording
} from "../../services/radioboss/programRecordings.service";
import {
  createRetryCommand,
  createStopRecordingCommand,
  subscribeRecentRadiobossCommands
} from "../../services/radioboss/radiobossCommands.service";

type RecordingControlPageProps = {
  session: AuthSession | null;
  onNavigate?: (page: "recordingRules") => void;
};

function getRequester(session: AuthSession | null) {
  return {
    requestedBy: session?.user.id ?? "unknown",
    requestedByName: session?.user.displayName || session?.user.email || "Operator Radio SBL"
  };
}

function isRetryableCommandForCurrentView({
  command,
  scheduleId,
  activeRecordingId,
  isRecordableSlot
}: {
  command: RadiobossCommand;
  scheduleId: string;
  activeRecordingId?: string | null;
  isRecordableSlot: boolean;
}) {
  if (command.status !== "failed" && command.status !== "retryable") return false;
  if (command.attempts >= command.maxAttempts) return false;

  if (command.type === "START_RECORDING") {
    return isRecordableSlot && command.payload?.scheduleId === scheduleId;
  }

  if (command.type === "STOP_RECORDING") {
    return Boolean(activeRecordingId && command.payload?.recordingId === activeRecordingId);
  }

  return false;
}

export default function RecordingControlPage({ session, onNavigate }: RecordingControlPageProps) {
  const currentSlot = useCurrentBroadcastSlot();
  const [status, setStatus] = useState<RadioBossStatus | null>(null);
  const [heartbeat, setHeartbeat] = useState<RadioBossGatewayHeartbeat | null>(null);
  const [rules, setRules] = useState<ProgramRecordingRule[]>([]);
  const [recording, setRecording] = useState<ProgramRecording | null>(null);
  const [commands, setCommands] = useState<RadiobossCommand[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const scheduleId = useMemo(() => getScheduleSlotId({
    day: currentSlot.day,
    time: currentSlot.time,
    program: currentSlot.title
  }), [currentSlot.day, currentSlot.time, currentSlot.title]);
  const programId = useMemo(() => getProgramRecordingRuleId(currentSlot.title), [currentSlot.title]);
  const isRecordableSlot = currentSlot.type === "main" && isRecordableBroadcastSlot({
    program: currentSlot.title,
    announcer: currentSlot.announcer
  });
  const rule = isRecordableSlot
    ? (
      rules.find((item) => item.scheduleId === scheduleId) ??
      rules.find((item) => item.programId === programId) ??
      buildDefaultRecordingRule(currentSlot.title)
    )
    : null;
  const radioBossOnline = resolveRadioBossOnline(status);
  const gatewayOnline = resolveGatewayOnline(status, heartbeat);
  const hasOperationalRole = canUser(session?.user.role, "radioboss:manage");
  const canManageRecordingSettings = canUser(session?.user.role, "schedule:manage");
  const hasActiveRecording = recording?.status === "recording" || Boolean(status?.recordingActive);
  const activeRecordingId = recording?.id ?? status?.activeRecordingId ?? null;
  const retryCommand = commands.find((command) => isRetryableCommandForCurrentView({
    command,
    scheduleId,
    activeRecordingId,
    isRecordableSlot
  })) ?? null;

  useEffect(() => subscribeRadioBossStatus(setStatus), []);
  useEffect(() => subscribeGatewayHeartbeat(status?.gatewayId || "studio-main", setHeartbeat), [status?.gatewayId]);
  useEffect(() => subscribeProgramRecordingRules(setRules), []);
  useEffect(() => subscribeActiveProgramRecording(scheduleId, setRecording), [scheduleId]);
  useEffect(() => subscribeRecentRadiobossCommands(setCommands), []);

  const canStop =
    hasActiveRecording
    && hasOperationalRole
    && gatewayOnline
    && Boolean(recording?.id || status?.activeRecordingId);

  const disabledReason = [
    !hasOperationalRole ? "Akses hanya untuk admin/operator." : "",
    !isRecordableSlot ? "Program ini bukan slot penyiar SBL terjadwal, jadi tidak direkam." : "",
    !gatewayOnline ? "Studio Gateway offline." : "",
    !radioBossOnline ? "RadioBOSS offline." : "",
    rule && !rule.allowManualOverride ? "Rule program belum mengizinkan stop manual." : ""
  ].filter(Boolean)[0] ?? "";

  async function runAction(action: () => Promise<string>, successMessage: string) {
    setBusy(true);
    setMessage("");
    try {
      const commandId = await action();
      setMessage(`${successMessage} Command ID: ${commandId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal membuat command RadioBOSS.");
    } finally {
      setBusy(false);
    }
  }

  function handleStop() {
    const recordingId = activeRecordingId;
    if (!recordingId) return;
    if (!window.confirm("Stop rekaman program ini? Command akan dikirim ke Studio Gateway.")) return;

    void runAction(
      () => createStopRecordingCommand({
        recordingId,
        ...getRequester(session)
      }),
      "Command stop rekaman dibuat."
    );
  }

  function handleRetry(command: RadiobossCommand) {
    void runAction(
      () => createRetryCommand({
        commandId: command.id,
        ...getRequester(session)
      }),
      "Command retry dibuat."
    );
  }

  return (
    <main className="radioboss-page">
      <section className="radioboss-page-hero">
        <div>
          <p className="eyebrow">Integrasi RadioBOSS</p>
          <h1>Kontrol Rekaman Siaran</h1>
          <p>Pantau auto recording berbasis absensi penyiar. Intervensi manual hanya dipakai saat diperlukan.</p>
        </div>
        {canManageRecordingSettings && onNavigate ? (
          <button type="button" className="radioboss-secondary-action" onClick={() => onNavigate("recordingRules")}>
            <Settings2 size={17} />
            Pengaturan Rekaman
          </button>
        ) : (
          <span className="radioboss-hero-icon" aria-hidden="true">
            <RadioTower size={24} />
          </span>
        )}
      </section>

      {message && <div className="radioboss-page-message">{message}</div>}

      <RecordingStatusCard
        currentSlot={currentSlot}
        scheduleId={scheduleId}
        recording={recording}
        rule={rule}
        recordable={isRecordableSlot}
        status={status}
        heartbeat={heartbeat}
      />

      <RecordingManualActions
        canStop={canStop}
        retryCommand={retryCommand}
        busy={busy}
        disabledReason={disabledReason}
        onStop={handleStop}
        onRetry={handleRetry}
      />
    </main>
  );
}
