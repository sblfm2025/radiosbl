import { useEffect, useMemo, useState } from "react";
import { RadioTower, ShieldCheck } from "lucide-react";
import type { DashboardSnapshot } from "../../data/mockRepository";
import type { AuthSession } from "../../services/auth.service";
import type { ProgramRecordingRule } from "../../types/domain";
import { ProgramRecordingRuleForm } from "../../components/radioboss/ProgramRecordingRuleForm";
import { ProgramRecordingRuleList } from "../../components/radioboss/ProgramRecordingRuleList";
import {
  buildDefaultRecordingRule,
  getRecordingRuleDocumentId,
  subscribeProgramRecordingRules,
  upsertProgramRecordingRule
} from "../../services/radioboss/recordingRules.service";
import { isRecordableBroadcastSlot } from "../../services/radioboss/recordingAutomation.service";
import { getScheduleSlotId } from "../../services/scheduleSlot.service";

type ProgramRecordingRulesPageProps = {
  data: DashboardSnapshot;
  session: AuthSession | null;
};

function getPrograms(data: DashboardSnapshot): string[] {
  const names = data.weeklySchedule
    .filter(isRecordableBroadcastSlot)
    .map((slot) => slot.program);

  return Array.from(new Set(names.filter(Boolean))).sort();
}

function getScheduleOptions(data: DashboardSnapshot) {
  return data.weeklySchedule
    .filter((slot) => Boolean(slot.program && slot.time && slot.day))
    .filter(isRecordableBroadcastSlot)
    .map((slot) => ({
      id: getScheduleSlotId(slot),
      label: `${slot.day}, ${slot.time.replace(/ WITA/g, "")} - ${slot.program}`,
      programName: slot.program
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export default function ProgramRecordingRulesPage({ data, session }: ProgramRecordingRulesPageProps) {
  const [rules, setRules] = useState<ProgramRecordingRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<ProgramRecordingRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const programs = useMemo(() => getPrograms(data), [data]);
  const scheduleOptions = useMemo(() => getScheduleOptions(data), [data]);
  const recordableProgramNames = useMemo(() => new Set(programs), [programs]);
  const recordableScheduleIds = useMemo(
    () => new Set(scheduleOptions.map((option) => option.id)),
    [scheduleOptions]
  );
  const visibleRules = useMemo(
    () => rules.filter((rule) => (
      rule.scheduleId
        ? recordableScheduleIds.has(rule.scheduleId)
        : recordableProgramNames.has(rule.programName)
    )),
    [recordableProgramNames, recordableScheduleIds, rules]
  );
  const enabledCount = visibleRules.filter((rule) => rule.recordingEnabled).length;
  const autoStartCount = visibleRules.filter((rule) => rule.recordingEnabled && rule.autoStart).length;

  useEffect(() => subscribeProgramRecordingRules(setRules), []);

  useEffect(() => {
    if (visibleRules.length === 0) {
      setSelectedRule(null);
      return;
    }

    if (selectedRule) {
      if (!selectedRule.id && recordableProgramNames.has(selectedRule.programName)) {
        return;
      }
      const stillVisible = visibleRules.some((rule) => (
        rule.id === selectedRule.id ||
        (rule.scheduleId && rule.scheduleId === selectedRule.scheduleId) ||
        (!rule.scheduleId && rule.programName === selectedRule.programName)
      ));
      if (stillVisible) return;
    }

    const firstProgramRule = visibleRules.find((rule) => rule.programName === programs[0] && !rule.scheduleId);
    setSelectedRule(firstProgramRule ?? visibleRules[0]);
  }, [programs, recordableProgramNames, selectedRule, visibleRules]);

  async function handleSubmit(rule: ProgramRecordingRule) {
    setSaving(true);
    setMessage("");

    try {
      const ruleId = getRecordingRuleDocumentId(rule);
      await upsertProgramRecordingRule(ruleId, rule, { uid: session?.user.id });
      setSelectedRule({ ...rule, id: ruleId });
      setMessage("Rule rekaman berhasil disimpan.");
    } catch (error) {
      console.warn("[ProgramRecordingRulesPage] Gagal menyimpan aturan rekaman", error);
      setMessage("Gagal menyimpan rule. Periksa akses admin/operator dan koneksi Firestore.");
    } finally {
      setSaving(false);
    }
  }

  function handleCreateDefault() {
    const programName = programs[0] ?? "Program Radio SBL";
    setSelectedRule(buildDefaultRecordingRule(programName));
  }

  return (
    <main className="radioboss-page">
      <section className="radioboss-page-hero">
        <div>
          <p className="eyebrow">Integrasi RadioBOSS</p>
          <h1>Pengaturan Rekaman Lanjutan</h1>
          <p>Opsional untuk admin. Rekaman harian tetap otomatis dari absen masuk dan berhenti dari absen pulang.</p>
        </div>
        <button type="button" className="radioboss-secondary-action" onClick={handleCreateDefault}>
          <RadioTower size={17} />
          Rule khusus
        </button>
      </section>

      <section className="radioboss-stat-grid" aria-label="Ringkasan aturan rekaman">
        <article>
          <ShieldCheck size={18} />
          <span>Program tersedia</span>
          <strong>{programs.length}</strong>
        </article>
        <article>
          <ShieldCheck size={18} />
          <span>Rekaman aktif</span>
          <strong>{enabledCount}</strong>
        </article>
        <article>
          <ShieldCheck size={18} />
          <span>Mulai otomatis</span>
          <strong>{autoStartCount}</strong>
        </article>
      </section>

      {message && <div className="radioboss-page-message">{message}</div>}

      <section className="radioboss-page-grid">
        <article className="radioboss-page-card">
          <div className="radioboss-card-head">
            <strong>Pengaturan rekaman</strong>
            <small>Dipakai hanya jika ada program yang perlu dikecualikan, folder diubah, atau format file disesuaikan.</small>
          </div>
          <ProgramRecordingRuleForm
            programs={programs}
            scheduleOptions={scheduleOptions}
            existingRules={visibleRules}
            selectedRule={selectedRule}
            saving={saving}
            onSubmit={handleSubmit}
          />
        </article>

        <article className="radioboss-page-card">
          <div className="radioboss-card-head">
            <strong>Aturan tersimpan</strong>
            <small>Daftar ini hanya menampilkan slot penyiar yang bisa direkam.</small>
          </div>
          <ProgramRecordingRuleList rules={visibleRules} onSelect={setSelectedRule} />
        </article>
      </section>
    </main>
  );
}
