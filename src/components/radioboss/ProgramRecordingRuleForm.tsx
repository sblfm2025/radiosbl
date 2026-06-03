import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ProgramRecordingRule } from "../../types/domain";
import {
  buildDefaultRecordingRule,
  getProgramRecordingRuleId,
  slugifyRecordingValue
} from "../../services/radioboss/recordingRules.service";

type ProgramRecordingRuleFormProps = {
  programs: string[];
  scheduleOptions: Array<{
    id: string;
    label: string;
    programName: string;
  }>;
  selectedRule: ProgramRecordingRule | null;
  saving: boolean;
  onSubmit: (rule: ProgramRecordingRule) => void;
};

function toNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function ProgramRecordingRuleForm({
  programs,
  scheduleOptions,
  selectedRule,
  saving,
  onSubmit
}: ProgramRecordingRuleFormProps) {
  const firstProgram = programs[0] ?? "Program Radio SBL";
  const [rule, setRule] = useState<ProgramRecordingRule>(() => selectedRule ?? buildDefaultRecordingRule(firstProgram));
  const programOptions = useMemo(() => Array.from(new Set(programs)).sort(), [programs]);
  const [scope, setScope] = useState<"program" | "schedule">(() => selectedRule?.scheduleId ? "schedule" : "program");

  useEffect(() => {
    setRule(selectedRule ?? buildDefaultRecordingRule(firstProgram));
    setScope(selectedRule?.scheduleId ? "schedule" : "program");
  }, [firstProgram, selectedRule]);

  function updateRule(patch: Partial<ProgramRecordingRule>) {
    setRule((current) => ({ ...current, ...patch }));
  }

  function handleProgramChange(programName: string) {
    const nextDefault = buildDefaultRecordingRule(programName);
    const matchingSchedule = scope === "schedule"
      ? scheduleOptions.find((option) => option.programName === programName)
      : undefined;

    setRule((current) => ({
      ...nextDefault,
      recordingEnabled: current.recordingEnabled,
      requireAttendance: current.requireAttendance,
      autoStart: current.autoStart,
      autoStop: current.autoStop,
      allowManualOverride: current.allowManualOverride,
      startGraceMinutes: current.startGraceMinutes,
      stopGraceMinutes: current.stopGraceMinutes,
      maxOverrunMinutes: current.maxOverrunMinutes,
      minDurationMinutes: current.minDurationMinutes,
      format: current.format,
      storageRootKey: current.storageRootKey,
      scheduleId: matchingSchedule?.id
    }));
  }

  function handleScopeChange(nextScope: "program" | "schedule") {
    setScope(nextScope);
    setRule((current) => {
      if (nextScope === "program") {
        return { ...current, scheduleId: undefined };
      }

      const matchingSchedule = scheduleOptions.find((option) => option.programName === current.programName) ?? scheduleOptions[0];
      if (!matchingSchedule) {
        return current;
      }

      const nextDefault = buildDefaultRecordingRule(matchingSchedule.programName);
      return {
        ...current,
        programId: nextDefault.programId,
        programName: nextDefault.programName,
        folderSlug: current.folderSlug || nextDefault.folderSlug,
        scheduleId: matchingSchedule.id
      };
    });
  }

  function handleScheduleChange(scheduleId: string) {
    const selectedSchedule = scheduleOptions.find((option) => option.id === scheduleId);
    if (!selectedSchedule) return;

    const nextDefault = buildDefaultRecordingRule(selectedSchedule.programName);
    setRule((current) => ({
      ...current,
      programId: nextDefault.programId,
      programName: nextDefault.programName,
      folderSlug: current.folderSlug || nextDefault.folderSlug,
      scheduleId: selectedSchedule.id
    }));
  }

  return (
    <form
      className="radioboss-rule-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          ...rule,
          programId: rule.programId || getProgramRecordingRuleId(rule.programName),
          folderSlug: rule.folderSlug || slugifyRecordingValue(rule.programName),
          scheduleId: scope === "schedule" ? rule.scheduleId : undefined
        });
      }}
    >
      <label>
        <span>Cakupan Rule</span>
        <select value={scope} onChange={(event) => handleScopeChange(event.target.value as "program" | "schedule")}>
          <option value="program">Semua jadwal program</option>
          <option value="schedule">Slot jadwal tertentu</option>
        </select>
      </label>

      {scope === "schedule" && (
        <label>
          <span>Slot Jadwal</span>
          <select value={rule.scheduleId || ""} onChange={(event) => handleScheduleChange(event.target.value)}>
            {scheduleOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
      )}

      <label>
        <span>Program</span>
        <select value={rule.programName} onChange={(event) => handleProgramChange(event.target.value)}>
          {programOptions.map((program) => (
            <option key={program} value={program}>{program}</option>
          ))}
        </select>
      </label>

      <div className="radioboss-toggle-grid">
        {[
          ["recordingEnabled", "Recording Enabled"],
          ["requireAttendance", "Require Attendance"],
          ["autoStart", "Auto Start"],
          ["autoStop", "Auto Stop"],
          ["allowManualOverride", "Allow Manual Override"]
        ].map(([key, label]) => (
          <label key={key} className="radioboss-toggle-row">
            <input
              type="checkbox"
              checked={Boolean(rule[key as keyof ProgramRecordingRule])}
              onChange={(event) => updateRule({ [key]: event.target.checked } as Partial<ProgramRecordingRule>)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div className="radioboss-form-grid">
        <label>
          <span>Start Grace Minutes</span>
          <input
            type="number"
            min="0"
            value={rule.startGraceMinutes}
            onChange={(event) => updateRule({ startGraceMinutes: toNumber(event.target.value, 15) })}
          />
        </label>
        <label>
          <span>Stop Grace Minutes</span>
          <input
            type="number"
            min="0"
            value={rule.stopGraceMinutes}
            onChange={(event) => updateRule({ stopGraceMinutes: toNumber(event.target.value, 10) })}
          />
        </label>
        <label>
          <span>Max Overrun Minutes</span>
          <input
            type="number"
            min="1"
            value={rule.maxOverrunMinutes}
            onChange={(event) => updateRule({ maxOverrunMinutes: toNumber(event.target.value, 30) })}
          />
        </label>
        <label>
          <span>Folder Slug</span>
          <input
            value={rule.folderSlug}
            onChange={(event) => updateRule({ folderSlug: slugifyRecordingValue(event.target.value) })}
          />
        </label>
        <label>
          <span>Format</span>
          <select value={rule.format} onChange={(event) => updateRule({ format: event.target.value })}>
            <option value="mp3">mp3</option>
            <option value="wav">wav</option>
          </select>
        </label>
      </div>

      <button type="submit" className="radioboss-primary-action" disabled={saving}>
        <Save size={17} />
        {saving ? "Menyimpan..." : "Simpan Rule"}
      </button>
    </form>
  );
}
