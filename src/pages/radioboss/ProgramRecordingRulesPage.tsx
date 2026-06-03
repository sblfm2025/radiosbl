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
import { getScheduleSlotId } from "../../services/scheduleSlot.service";

type ProgramRecordingRulesPageProps = {
  data: DashboardSnapshot;
  session: AuthSession | null;
};

function getPrograms(data: DashboardSnapshot): string[] {
  const names = [
    ...data.weeklySchedule.map((slot) => slot.program),
    ...data.insertPrograms.map((slot) => slot.program),
    ...data.programs.map((program) => program.title)
  ];

  return Array.from(new Set(names.filter(Boolean))).sort();
}

function getScheduleOptions(data: DashboardSnapshot) {
  return data.weeklySchedule
    .filter((slot) => Boolean(slot.program && slot.time && slot.day))
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
  const enabledCount = rules.filter((rule) => rule.recordingEnabled).length;
  const autoStartCount = rules.filter((rule) => rule.recordingEnabled && rule.autoStart).length;

  useEffect(() => subscribeProgramRecordingRules(setRules), []);

  async function handleSubmit(rule: ProgramRecordingRule) {
    setSaving(true);
    setMessage("");

    try {
      await upsertProgramRecordingRule(getRecordingRuleDocumentId(rule), rule, { uid: session?.user.id });
      setSelectedRule(rule);
      setMessage("Rule rekaman berhasil disimpan.");
    } catch {
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
          <h1>Aturan Rekaman Program</h1>
          <p>Tentukan program mana yang direkam otomatis, kapan mulai, kapan berhenti, dan apakah wajib menunggu absensi penyiar.</p>
        </div>
        <button type="button" className="radioboss-secondary-action" onClick={handleCreateDefault}>
          <RadioTower size={17} />
          Aturan baru
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
            <small>Untuk penggunaan harian, aktifkan rekaman otomatis hanya pada program yang memang perlu diarsipkan.</small>
          </div>
          <ProgramRecordingRuleForm
            programs={programs}
            scheduleOptions={scheduleOptions}
            selectedRule={selectedRule}
            saving={saving}
            onSubmit={handleSubmit}
          />
        </article>

        <article className="radioboss-page-card">
          <div className="radioboss-card-head">
            <strong>Aturan tersimpan</strong>
            <small>Pilih aturan untuk melihat atau mengubah pengaturannya.</small>
          </div>
          <ProgramRecordingRuleList rules={rules} onSelect={setSelectedRule} />
        </article>
      </section>
    </main>
  );
}
