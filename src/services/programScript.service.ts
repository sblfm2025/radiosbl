import { shouldUseLocalFallback } from "../lib/env";
import type { ProgramScriptDraft } from "../types/domain";
import { createDocument, listDocuments, updateDocument } from "./firestore.service";

const PROGRAM_SCRIPTS_KEY = "radio-sbl-program-script-drafts";
const MAX_LOCAL_SCRIPTS = 30;

export type ProgramScriptDraftInput = Omit<ProgramScriptDraft, "id" | "createdAt" | "updatedAt">;

function getSafeLocalStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readLocalProgramScripts(): ProgramScriptDraft[] {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(PROGRAM_SCRIPTS_KEY);
    return raw ? (JSON.parse(raw) as ProgramScriptDraft[]) : [];
  } catch {
    return [];
  }
}

function writeLocalProgramScripts(scripts: ProgramScriptDraft[]) {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return;
  }

  storage.setItem(PROGRAM_SCRIPTS_KEY, JSON.stringify(scripts.slice(0, MAX_LOCAL_SCRIPTS)));
}

export function updateLocalProgramScriptStatus(id: string, status: ProgramScriptDraft["status"]): void {
  const scripts = readLocalProgramScripts();
  const index = scripts.findIndex(s => s.id === id);
  if (index !== -1) {
    scripts[index] = { ...scripts[index], status, updatedAt: new Date().toISOString() };
    writeLocalProgramScripts(scripts);
  }
}

function createProgramScriptDraft(input: ProgramScriptDraftInput): ProgramScriptDraft {
  return {
    ...input,
    id: `program-script-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
}

function toFirestoreProgramScript(
  draft: ProgramScriptDraft
): Omit<ProgramScriptDraft, "id"> {
  return {
    programTitle: draft.programTitle,
    scheduleTime: draft.scheduleTime,
    day: draft.day,
    announcerName: draft.announcerName,
    description: draft.description,
    provider: draft.provider,
    tone: draft.tone,
    durationMinutes: draft.durationMinutes,
    ...(draft.intervention ? { intervention: draft.intervention } : {}),
    content: draft.content,
    status: draft.status,
    createdBy: draft.createdBy,
    createdByName: draft.createdByName,
    createdAt: draft.createdAt,
    ...(draft.updatedAt ? { updatedAt: draft.updatedAt } : {})
  };
}

export function saveLocalProgramScript(input: ProgramScriptDraftInput): ProgramScriptDraft {
  const draft = createProgramScriptDraft(input);
  writeLocalProgramScripts([draft, ...readLocalProgramScripts()]);
  return draft;
}

export function listLocalProgramScripts(): ProgramScriptDraft[] {
  return readLocalProgramScripts();
}

export async function saveProgramScript(input: ProgramScriptDraftInput): Promise<ProgramScriptDraft> {
  if (!input.content.trim()) {
    throw new Error("Isi naskah tidak boleh kosong.");
  }

  if (shouldUseLocalFallback()) {
    return saveLocalProgramScript(input);
  }

  const draft = createProgramScriptDraft(input);

  try {
    const id = await createDocument<Omit<ProgramScriptDraft, "id">>(
      "programScriptDrafts",
      toFirestoreProgramScript(draft)
    );

    return { ...draft, id };
  } catch {
    return saveLocalProgramScript(input);
  }
}

export async function listProgramScripts(): Promise<ProgramScriptDraft[]> {
  if (shouldUseLocalFallback()) {
    return listLocalProgramScripts();
  }

  try {
    return await listDocuments<ProgramScriptDraft>("programScriptDrafts");
  } catch {
    return listLocalProgramScripts();
  }
}

export async function updateProgramScriptStatus(id: string, status: ProgramScriptDraft["status"]): Promise<void> {
  if (shouldUseLocalFallback()) {
    updateLocalProgramScriptStatus(id, status);
    return;
  }

  try {
    await updateDocument("programScriptDrafts", id, { status, updatedAt: new Date().toISOString() });
  } catch {
    updateLocalProgramScriptStatus(id, status);
  }
}

