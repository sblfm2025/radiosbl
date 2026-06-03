import { Settings2 } from "lucide-react";
import type { ProgramRecordingRule } from "../../types/domain";

type ProgramRecordingRuleListProps = {
  rules: ProgramRecordingRule[];
  onSelect: (rule: ProgramRecordingRule) => void;
};

export function ProgramRecordingRuleList({ rules, onSelect }: ProgramRecordingRuleListProps) {
  if (rules.length === 0) {
    return (
      <div className="radioboss-empty-state">
        <Settings2 size={26} />
        <strong>Belum ada rule tersimpan</strong>
        <p>Default tetap aman: program tidak direkam otomatis sampai admin mengaktifkan rule.</p>
      </div>
    );
  }

  return (
    <div className="radioboss-rule-list">
      {rules.map((rule) => (
        <button type="button" key={rule.programId} onClick={() => onSelect(rule)}>
          <span className={`radioboss-rule-dot${rule.recordingEnabled ? " is-enabled" : ""}`} />
          <span>
            <strong>{rule.programName}</strong>
            <small>
              {rule.recordingEnabled ? "Recording aktif" : "Recording nonaktif"} - {rule.autoStart ? "auto start" : "manual"} - {rule.format}
            </small>
          </span>
          <em>{rule.folderSlug}</em>
        </button>
      ))}
    </div>
  );
}
