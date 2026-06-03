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
    description: "Jika mati, program ini tidak akan direkam otomatis."
  },
  {
    key: "requireAttendance",
    label: "Wajib penyiar absen",
    description: "Gateway menunggu absensi penyiar sebelum mulai rekaman."
  },
  {
    key: "autoStart",
    label: "Mulai otomatis",
    description: "Rekaman dimulai sendiri saat jadwal program masuk."
  },
  {
    key: "autoStop",
    label: "Berhenti otomatis",
    description: "Rekaman dihentikan sendiri saat jadwal program selesai."
  },
  {
    key: "allowManualOverride",
    label: "Izinkan kontrol manual",
    description: "Operator tetap bisa start/stop manual saat dibutuhkan."
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
              ? `${rule.programName} akan ${rule.autoStart ? "mulai otomatis" : "menunggu start manual"}${rule.requireAttendance ? " setelah penyiar absen" : " tanpa syarat absensi"} dan ${rule.autoStop ? "berhenti otomatis" : "berhenti manual"}.`
              : "Aktifkan rekaman program jika program ini memang perlu direkam oleh Studio Gateway."}
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
          Pilih semua jadwal jika aturan ini berlaku untuk seluruh program dengan nama yang sama.
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
        <small className="radioboss-field-help">Nama program akan dipakai untuk folder dan identitas rekaman.</small>
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
          <span>Toleransi mulai</span>
          <input
            type="number"
            min="0"
            value={rule.startGraceMinutes}
            onChange={(event) => updateRule({ startGraceMinutes: toNumber(event.target.value, 15) })}
          />
          <small className="radioboss-field-help">Menit setelah jadwal mulai. Contoh 15: masih boleh mulai otomatis sampai 15 menit terlambat.</small>
        </label>
        <label>
          <span>Toleransi berhenti</span>
          <input
            type="number"
            min="0"
            value={rule.stopGraceMinutes}
            onChange={(event) => updateRule({ stopGraceMinutes: toNumber(event.target.value, 10) })}
          />
          <small className="radioboss-field-help">Menit tambahan setelah jadwal selesai sebelum stop otomatis dianggap perlu.</small>
        </label>
        <label>
          <span>Batas rekaman molor</span>
          <input
            type="number"
            min="1"
            value={rule.maxOverrunMinutes}
            onChange={(event) => updateRule({ maxOverrunMinutes: toNumber(event.target.value, 30) })}
          />
          <small className="radioboss-field-help">Pengaman agar rekaman tidak berjalan terlalu lama jika ada masalah.</small>
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
