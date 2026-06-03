import { useEffect, useMemo, useState } from "react";
import { RadioTower } from "lucide-react";
import { RecordingManualActions } from "../../components/radioboss/RecordingManualActions";
import { RecordingStatusCard } from "../../components/radioboss/RecordingStatusCard";
import { useCurrentBroadcastSlot } from "../../hooks/useCurrentBroadcastSlot";
import { getScheduleSlotId } from "../../services/scheduleSlot.service";
import { parseTimeRangeMinutes } from "../../utils/scheduleClock";
import { resolveAnnouncerFromSlot } from "../../utils/announcerResolver";
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
import {
  subscribeActiveProgramRecording
} from "../../services/radioboss/programRecordings.service";
import {
  createMarkRecordingSkippedCommand,
  createRetryCommand,
  createStartRecordingCommand,
  createStopRecordingCommand,
  subscribeRecentRadiobossCommands
} from "../../services/radioboss/radiobossCommands.service";

type RecordingControlPageProps = {
  session: AuthSession | null;
};

const skipEligibleStatuses = new Set(["waiting_schedule", "waiting_attendance", "ready", "failed"]);

function getRequester(session: AuthSession | null) {
  return {
    requestedBy: session?.user.id ?? "unknown",
    requestedByName: session?.user.displayName || session?.user.email || "Operator Radio SBL"
  };
}

function buildPlannedRecordingWindow(timeRange: string, baseDate = new Date()) {
  const { start, end } = parseTimeRangeMinutes(timeRange);
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return {
      plannedStartAt: baseDate.toISOString(),
      plannedEndAt: baseDate.toISOString()
    };
  }

  const plannedStartAt = new Date(baseDate);
  plannedStartAt.setHours(Math.floor(start / 60), start % 60, 0, 0);

  const plannedEndAt = new Date(baseDate);
  plannedEndAt.setHours(Math.floor(end / 60), end % 60, 0, 0);
  if (end <= start) {
    plannedEndAt.setDate(plannedEndAt.getDate() + 1);
  }

  return {
    plannedStartAt: plannedStartAt.toISOString(),
    plannedEndAt: plannedEndAt.toISOString()
  };
}

export default function RecordingControlPage({ session }: RecordingControlPageProps) {
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
  const rule =
    rules.find((item) => item.scheduleId === scheduleId) ??
    rules.find((item) => item.programId === programId) ??
    buildDefaultRecordingRule(currentSlot.title);
  const radioBossOnline = resolveRadioBossOnline(status);
  const gatewayOnline = resolveGatewayOnline(status, heartbeat);
  const hasOperationalRole = canUser(session?.user.role, "radioboss:manage");
  const hasActiveRecording = recording?.status === "recording" || Boolean(status?.recordingActive);
  const isOffAir = currentSlot.type === "offair";
  const retryCommand = commands.find((command) => (
    (command.status === "failed" || command.status === "retryable")
    && command.attempts < command.maxAttempts
  )) ?? null;

  useEffect(() => subscribeRadioBossStatus(setStatus), []);
  useEffect(() => subscribeGatewayHeartbeat(status?.gatewayId || "studio-main", setHeartbeat), [status?.gatewayId]);
  useEffect(() => subscribeProgramRecordingRules(setRules), []);
  useEffect(() => subscribeActiveProgramRecording(scheduleId, setRecording), [scheduleId]);
  useEffect(() => subscribeRecentRadiobossCommands(setCommands), []);

  const canStart =
    !isOffAir
    && gatewayOnline
    && radioBossOnline
    && !hasActiveRecording
    && hasOperationalRole
    && (rule.recordingEnabled || rule.allowManualOverride);

  const canStop =
    hasActiveRecording
    && hasOperationalRole
    && gatewayOnline
    && Boolean(recording?.id || status?.activeRecordingId);

  const canSkip =
    !hasActiveRecording
    && hasOperationalRole
    && !isOffAir
    && (!recording || skipEligibleStatuses.has(recording.status));

  const disabledReason = [
    !hasOperationalRole ? "Akses hanya untuk admin/operator." : "",
    isOffAir ? "Tidak ada program penyiar terjadwal untuk direkam." : "",
    !gatewayOnline ? "Studio Gateway offline." : "",
    !radioBossOnline ? "RadioBOSS offline." : "",
    !rule.recordingEnabled && !rule.allowManualOverride ? "Rule program belum mengizinkan rekaman/manual override." : ""
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

  function handleStart() {
    const resolvedAnnouncer = resolveAnnouncerFromSlot(currentSlot.announcer);
    const plannedWindow = buildPlannedRecordingWindow(currentSlot.time);
    void runAction(
      () => createStartRecordingCommand({
        programId,
        scheduleId,
        programName: currentSlot.title,
        announcerId: resolvedAnnouncer?.id ?? currentSlot.announcer,
        announcerName: resolvedAnnouncer?.fullName ?? currentSlot.announcer,
        announcerAirName: resolvedAnnouncer?.airName ?? currentSlot.announcer,
        plannedStartAt: plannedWindow.plannedStartAt,
        plannedEndAt: plannedWindow.plannedEndAt,
        source: "manual_operator",
        ...getRequester(session)
      }),
      "Command mulai rekaman dibuat."
    );
  }

  function handleStop() {
    const recordingId = recording?.id ?? status?.activeRecordingId;
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

  function handleSkip() {
    const reason = window.prompt("Alasan aman untuk menandai tidak perlu direkam:", "manual_operator_skip");
    if (!reason) return;
    const plannedWindow = buildPlannedRecordingWindow(currentSlot.time);

    void runAction(
      () => createMarkRecordingSkippedCommand({
        recordingId: recording?.id ?? null,
        programId,
        scheduleId,
        plannedStartAt: plannedWindow.plannedStartAt,
        reason,
        ...getRequester(session)
      }),
      "Command skip rekaman dibuat."
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
          <h1>Recording Control Panel</h1>
          <p>Mulai, stop, skip, dan retry rekaman secara aman melalui Firestore command queue.</p>
        </div>
        <span className="radioboss-hero-icon" aria-hidden="true">
          <RadioTower size={24} />
        </span>
      </section>

      {message && <div className="radioboss-page-message">{message}</div>}

      <RecordingStatusCard
        currentSlot={currentSlot}
        scheduleId={scheduleId}
        recording={recording}
        rule={rule}
        status={status}
        heartbeat={heartbeat}
      />

      <RecordingManualActions
        canStart={canStart}
        canStop={canStop}
        canSkip={canSkip}
        retryCommand={retryCommand}
        busy={busy}
        disabledReason={disabledReason}
        onStart={handleStart}
        onStop={handleStop}
        onSkip={handleSkip}
        onRetry={handleRetry}
      />
    </main>
  );
}
