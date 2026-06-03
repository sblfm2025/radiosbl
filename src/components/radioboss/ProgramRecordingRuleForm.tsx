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
  selectedRule,
  saving,
  onSubmit
}: ProgramRecordingRuleFormProps) {
  const firstProgram = programs[0] ?? "Program Radio SBL";
  const [rule, setRule] = useState<ProgramRecordingRule>(() => selectedRule ?? buildDefaultRecordingRule(firstProgram));
  const programOptions = useMemo(() => Array.from(new Set(programs)).sort(), [programs]);

  useEffect(() => {
    setRule(selectedRule ?? buildDefaultRecordingRule(firstProgram));
  }, [firstProgram, selectedRule]);

  function updateRule(patch: Partial<ProgramRecordingRule>) {
    setRule((current) => ({ ...current, ...patch }));
  }

  function handleProgramChange(programName: string) {
    const nextDefault = buildDefaultRecordingRule(programName);
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
      storageRootKey: current.storageRootKey
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
          folderSlug: rule.folderSlug || slugifyRecordingValue(rule.programName)
        });
      }}
    >
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
