import { useEffect, useMemo, useState } from "react";
import { RadioTower, ShieldCheck } from "lucide-react";
import type { DashboardSnapshot } from "../../data/mockRepository";
import type { AuthSession } from "../../services/auth.service";
import type { ProgramRecordingRule } from "../../types/domain";
import { ProgramRecordingRuleForm } from "../../components/radioboss/ProgramRecordingRuleForm";
import { ProgramRecordingRuleList } from "../../components/radioboss/ProgramRecordingRuleList";
import {
  buildDefaultRecordingRule,
  subscribeProgramRecordingRules,
  upsertProgramRecordingRule
} from "../../services/radioboss/recordingRules.service";

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

export default function ProgramRecordingRulesPage({ data, session }: ProgramRecordingRulesPageProps) {
  const [rules, setRules] = useState<ProgramRecordingRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<ProgramRecordingRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const programs = useMemo(() => getPrograms(data), [data]);
  const enabledCount = rules.filter((rule) => rule.recordingEnabled).length;
  const autoStartCount = rules.filter((rule) => rule.recordingEnabled && rule.autoStart).length;

  useEffect(() => subscribeProgramRecordingRules(setRules), []);

  async function handleSubmit(rule: ProgramRecordingRule) {
    setSaving(true);
    setMessage("");

    try {
      await upsertProgramRecordingRule(rule.programId, rule, { uid: session?.user.id });
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
          <h1>Program Recording Rules</h1>
          <p>Atur program mana yang boleh direkam otomatis. Default tetap aman: recording tidak aktif sampai rule dinyalakan.</p>
        </div>
        <button type="button" className="radioboss-secondary-action" onClick={handleCreateDefault}>
          <RadioTower size={17} />
          Rule baru
        </button>
      </section>

      <section className="radioboss-stat-grid" aria-label="Ringkasan rule rekaman">
        <article>
          <ShieldCheck size={18} />
          <span>Program tersedia</span>
          <strong>{programs.length}</strong>
        </article>
        <article>
          <ShieldCheck size={18} />
          <span>Recording enabled</span>
          <strong>{enabledCount}</strong>
        </article>
        <article>
          <ShieldCheck size={18} />
          <span>Auto start aktif</span>
          <strong>{autoStartCount}</strong>
        </article>
      </section>

      {message && <div className="radioboss-page-message">{message}</div>}

      <section className="radioboss-page-grid">
        <article className="radioboss-page-card">
          <div className="radioboss-card-head">
            <strong>Form rule rekaman</strong>
            <small>Jangan aktifkan auto recording massal tanpa verifikasi absensi dan gateway.</small>
          </div>
          <ProgramRecordingRuleForm
            programs={programs}
            selectedRule={selectedRule}
            saving={saving}
            onSubmit={handleSubmit}
          />
        </article>

        <article className="radioboss-page-card">
          <div className="radioboss-card-head">
            <strong>Rule tersimpan</strong>
            <small>Pilih rule untuk diedit.</small>
          </div>
          <ProgramRecordingRuleList rules={rules} onSelect={setSelectedRule} />
        </article>
      </section>
    </main>
  );
}
