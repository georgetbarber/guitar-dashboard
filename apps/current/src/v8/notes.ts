/**
 * GEORGE'S FEEDBACK LOOP: NOTES, CHECKLIST TICKS AND REVIEW MARKS.
 *
 * Three small record types that let agent-written lessons go live honestly:
 * a draft tag on unchecked content, a "Something's wrong here" note anyone can
 * leave from the lesson, a checklist of things only a person can verify, and a
 * "Mark as checked" overlay that moves a lesson from draft to reviewed without
 * editing the authored content.
 *
 * None of these is learning evidence. They never change completion, mastery,
 * readiness or the session plan.
 */
import { localDateAt } from "./dates";
import { newId } from "./identity";
import { NOTE_LIMITS } from "./limits";
import type { ChecklistTick, FeedbackCategory, FeedbackNote, V8State } from "./types";

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  "wrong-music": "Wrong note or chord",
  unplayable: "Unplayable",
  confusing: "Confusing",
  "too-hard": "Too hard",
  "too-easy": "Too easy",
  "sounds-bad": "Sounds bad",
  other: "Other",
};

/** What the screen hands the note dialog: the content and exactly where the learner was. */
export interface FeedbackTarget {
  contentId: string;
  contentVersion?: number;
  contentTitle: string;
  location?: string;
  showing: string;
}

function bounded(text: string, limit: number): string {
  // Only the automatic context is shortened; the learner's own words are refused, not cut.
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

export function newFeedbackNote(
  target: FeedbackTarget,
  text: string,
  category: FeedbackCategory | undefined,
  appVersion: string,
  now = new Date(),
): FeedbackNote {
  const at = now.toISOString();
  const note: FeedbackNote = {
    id: newId("note"),
    contentId: target.contentId,
    contentTitle: bounded(target.contentTitle, NOTE_LIMITS.contentTitle),
    showing: bounded(target.showing, NOTE_LIMITS.showing),
    text,
    createdAt: at,
    localDate: localDateAt(now),
    resolvedAt: null,
    updatedAt: at,
    appVersion: bounded(appVersion, NOTE_LIMITS.appVersion),
  };
  if (target.contentVersion !== undefined) note.contentVersion = target.contentVersion;
  if (target.location) note.location = bounded(target.location, NOTE_LIMITS.location);
  if (category) note.category = category;
  return note;
}

/** Why a note cannot be saved yet, or null. The learner keeps their text while this is shown. */
export function feedbackRefusal(state: V8State, text: string): string | null {
  if (!text.trim()) return "Write what is wrong before saving the note.";
  if (text.length > NOTE_LIMITS.text)
    return `Notes can be up to ${NOTE_LIMITS.text} characters; this one has ${text.length}. Split it into two notes.`;
  if ((state.feedbackNotes ?? []).length >= NOTE_LIMITS.notes) {
    return `This device already holds ${NOTE_LIMITS.notes} notes. Export them from Settings › Feedback and send them to an agent; nothing was discarded.`;
  }
  return null;
}

/** Newest write wins per id; a tie keeps the local copy. Used for all three collections. */
export function mergeByUpdatedAt<T extends { id: string; updatedAt: string }>(
  local: readonly T[] = [],
  remote: readonly T[] = [],
): T[] {
  const merged = new Map(local.map((item) => [item.id, item]));
  for (const item of remote) {
    const existing = merged.get(item.id);
    if (!existing || item.updatedAt > existing.updatedAt) merged.set(item.id, item);
  }
  return [...merged.values()];
}

export function sortNotes(notes: readonly FeedbackNote[]): FeedbackNote[] {
  return [...notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function tickFor(ticks: readonly ChecklistTick[] | undefined, id: string): boolean {
  return Boolean(ticks?.find((tick) => tick.id === id)?.done);
}

function quote(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join("\n");
}

/**
 * Notes as Markdown George can paste into an agent session. Open notes come
 * first; each carries enough context (content, version, place, screen) to act
 * on without the app.
 */
export function feedbackMarkdown(
  notes: readonly FeedbackNote[],
  options: { includeResolved: boolean; exportedAt?: Date; appVersion: string },
): string {
  const exportedAt = options.exportedAt ?? new Date();
  const ordered = sortNotes(notes);
  const open = ordered.filter((note) => !note.resolvedAt);
  const resolved = ordered.filter((note) => note.resolvedAt);
  const lines = [
    "# Interval feedback",
    "",
    `Exported ${exportedAt.toISOString()} from app version ${options.appVersion}. ${open.length} open, ${resolved.length} dealt with.`,
    "",
    "These are George's notes from inside the app. Triage them as the completion brief's section 9 describes: wrong music first, then unplayable and confusing, then difficulty.",
    "",
  ];
  const render = (note: FeedbackNote, index: number) => {
    const category = note.category ? FEEDBACK_CATEGORY_LABELS[note.category] : "Uncategorised";
    lines.push(`### ${index + 1}. ${category} — ${note.contentTitle}`, "");
    lines.push(
      `- **Content:** \`${note.contentId}\`${note.contentVersion !== undefined ? ` version ${note.contentVersion}` : ""}`,
    );
    if (note.location) lines.push(`- **Where:** ${note.location}`);
    lines.push(`- **Showing:** ${note.showing}`);
    lines.push(`- **Written:** ${note.localDate} (app ${note.appVersion ?? "unknown"}) · \`${note.id}\``);
    if (note.resolvedAt) lines.push(`- **Dealt with:** ${note.resolvedAt.slice(0, 10)}`);
    lines.push("", quote(note.text), "");
  };
  lines.push("## Open", "");
  if (!open.length) lines.push("No open notes.", "");
  open.forEach(render);
  if (options.includeResolved && resolved.length) {
    lines.push("## Dealt with", "");
    resolved.forEach(render);
  }
  return `${lines.join("\n").trimEnd()}\n`;
}
