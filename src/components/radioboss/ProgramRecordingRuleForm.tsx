import { Save, ShieldCheck } from "lucide-react";
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
  existingRules: ProgramRecordingRule[];
  selectedRule: ProgramRecordingRule | null;
  saving: boolean;
  onSubmit: (rule: ProgramRecordingRule) => void;
};

function toNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const toggleOptions: Array<{
  key: keyof Pick<ProgramRecordingRule, "recordingEnabled" | "requireAttendance" | "autoStart" | "autoStop" | "allowManualOverride">;
  label: string;
  description: string;
}> = [
  {
    key: "recordingEnabled",
    label: "Aktifkan rekaman program",
    description: "Hanya aktifkan untuk program siaran yang punya penyiar terjadwal."
  },
  {
    key: "requireAttendance",
    label: "Wajib penyiar absen",
    description: "Gateway mulai rekaman hanya setelah penyiar jadwal ini absen masuk."
  },
  {
    key: "autoStart",
    label: "Mulai saat absen masuk",
    description: "Check-in penyiar menjadi pemicu start recording jika masih dalam batas jadwal."
  },
  {
    key: "autoStop",
    label: "Berhenti saat absen pulang",
    description: "Check-out penyiar menjadi pemicu stop recording, dengan batas molor sebagai pengaman."
  },
  {
    key: "allowManualOverride",
    label: "Izinkan stop manual",
    description: "Operator bisa menghentikan rekaman dari panel kontrol saat dibutuhkan."
  }
];

export function ProgramRecordingRuleForm({
  programs,
  scheduleOptions,
  existingRules,
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

  function findExistingProgramRule(programName: string) {
    return existingRules.find((item) => item.programName === programName && !item.scheduleId);
  }

  function findExistingScheduleRule(scheduleId: string) {
    return existingRules.find((item) => item.scheduleId === scheduleId);
  }

  function handleProgramChange(programName: string) {
    const existingProgramRule = scope === "program" ? findExistingProgramRule(programName) : undefined;
    if (existingProgramRule) {
      setRule(existingProgramRule);
      return;
    }

    const nextDefault = buildDefaultRecordingRule(programName);
    const matchingSchedule = scope === "schedule"
      ? scheduleOptions.find((option) => option.programName === programName)
      : undefined;
    const existingScheduleRule = matchingSchedule ? findExistingScheduleRule(matchingSchedule.id) : undefined;

    if (existingScheduleRule) {
      setRule(existingScheduleRule);
      return;
    }

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
        const existingProgramRule = findExistingProgramRule(current.programName);
        return existingProgramRule ?? { ...current, scheduleId: undefined };
      }

      const matchingSchedule = scheduleOptions.find((option) => option.programName === current.programName) ?? scheduleOptions[0];
      if (!matchingSchedule) {
        return current;
      }
      const existingScheduleRule = findExistingScheduleRule(matchingSchedule.id);
      if (existingScheduleRule) {
        return existingScheduleRule;
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

    const existingScheduleRule = findExistingScheduleRule(scheduleId);
    if (existingScheduleRule) {
      setRule(existingScheduleRule);
      return;
    }

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
          ...(scope === "schedule" ? { scheduleId: rule.scheduleId } : {})
        });
      }}
    >
      <section className={`radioboss-rule-summary ${rule.recordingEnabled ? "is-enabled" : "is-disabled"}`}>
        <div className="radioboss-rule-summary-icon">
          <ShieldCheck size={20} />
        </div>
        <div>
          <strong>{rule.recordingEnabled ? "Rekaman otomatis siap diatur" : "Rekaman otomatis masih nonaktif"}</strong>
          <p>
            {rule.recordingEnabled
              ? `${rule.programName} akan ${rule.autoStart ? "mulai saat penyiar absen masuk" : "tidak memulai otomatis"}${rule.requireAttendance ? " dan wajib cocok dengan penyiar terjadwal" : " tanpa syarat absensi"}; ${rule.autoStop ? "berhenti saat penyiar absen pulang" : "berhenti manual"}.`
              : "Aktifkan hanya untuk program siaran berpemandu penyiar. Autoplaylist dan sisipan tanpa penyiar tidak perlu rule rekaman."}
          </p>
        </div>
      </section>

      <label>
        <span>Berlaku untuk</span>
        <select value={scope} onChange={(event) => handleScopeChange(event.target.value as "program" | "schedule")}>
          <option value="program">Semua jadwal program</option>
          <option value="schedule">Satu slot jadwal tertentu</option>
        </select>
        <small className="radioboss-field-help">
          Pilih slot tertentu jika program yang sama punya penyiar berbeda pada hari/jam lain.
        </small>
      </label>

      {scope === "schedule" && (
        <label>
          <span>Slot jadwal</span>
          <select value={rule.scheduleId || ""} onChange={(event) => handleScheduleChange(event.target.value)}>
            {scheduleOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
          <small className="radioboss-field-help">Gunakan ini jika hanya jam/hari tertentu yang perlu aturan khusus.</small>
        </label>
      )}

      <label>
        <span>Program</span>
        <select value={rule.programName} onChange={(event) => handleProgramChange(event.target.value)}>
          {programOptions.map((program) => (
            <option key={program} value={program}>{program}</option>
          ))}
        </select>
          <small className="radioboss-field-help">Pilihan hanya menampilkan program jadwal utama dengan penyiar SBL.</small>
      </label>

      <div className="radioboss-toggle-grid">
        {toggleOptions.map((option) => (
          <label key={option.key} className="radioboss-toggle-row">
            <input
              type="checkbox"
              checked={Boolean(rule[option.key])}
              onChange={(event) => updateRule({ [option.key]: event.target.checked } as Partial<ProgramRecordingRule>)}
            />
            <span>
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </span>
          </label>
        ))}
      </div>

      <div className="radioboss-form-grid">
        <label>
          <span>Batas tunggu absen masuk</span>
          <input
            type="number"
            min="0"
            value={rule.startGraceMinutes}
            onChange={(event) => updateRule({ startGraceMinutes: toNumber(event.target.value, 15) })}
          />
          <small className="radioboss-field-help">Menit dari jadwal mulai. Jika penyiar absen setelah batas ini, Gateway menunggu intervensi operator.</small>
        </label>
        <label>
          <span>Pengaman stop setelah jadwal</span>
          <input
            type="number"
            min="0"
            value={rule.stopGraceMinutes}
            onChange={(event) => updateRule({ stopGraceMinutes: toNumber(event.target.value, 10) })}
          />
          <small className="radioboss-field-help">Fallback jika penyiar lupa absen pulang. Normalnya stop terjadi saat check-out.</small>
        </label>
        <label>
          <span>Batas rekaman molor</span>
          <input
            type="number"
            min="1"
            value={rule.maxOverrunMinutes}
            onChange={(event) => updateRule({ maxOverrunMinutes: toNumber(event.target.value, 30) })}
          />
          <small className="radioboss-field-help">Batas keras agar rekaman tidak terus berjalan jika check-out atau stop command bermasalah.</small>
        </label>
        <label>
          <span>Nama folder rekaman</span>
          <input
            value={rule.folderSlug}
            onChange={(event) => updateRule({ folderSlug: slugifyRecordingValue(event.target.value) })}
          />
          <small className="radioboss-field-help">Dipakai sebagai folder program di root rekaman PC Studio.</small>
        </label>
        <label>
          <span>Format file</span>
          <select value={rule.format} onChange={(event) => updateRule({ format: event.target.value })}>
            <option value="mp3">mp3</option>
            <option value="wav">wav</option>
          </select>
          <small className="radioboss-field-help">MP3 lebih ringan. WAV lebih besar dan biasanya hanya untuk kebutuhan arsip kualitas tinggi.</small>
        </label>
      </div>

      <button type="submit" className="radioboss-primary-action" disabled={saving}>
        <Save size={17} />
        {saving ? "Menyimpan..." : "Simpan Aturan Rekaman"}
      </button>
    </form>
  );
}
