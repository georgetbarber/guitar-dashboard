import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { feedbackMarkdown, feedbackRefusal, mergeByUpdatedAt, newFeedbackNote, type FeedbackTarget } from "./notes";
import {
  DRAFT_BY_AGENT,
  effectiveReview,
  legacyActivityProvenance,
  newReviewMark,
  provenanceProblems,
  type AuthoredProvenance,
} from "./provenance";
import { DEFAULT_STATE, reducer } from "./store";
import { cloudProfile, mergeCloudSnapshot } from "./sync";
import { validateChecklistTick, validateFeedbackNote, validateReviewMark, validateState } from "./validation";
import { NOTE_LIMITS } from "./limits";
import { activateRestore, exportArchive, loadWorkspace, prepareRestore, setActiveWorkspace } from "./repository";
import { createEvidence } from "./learning";
import type { FeedbackNote, V8State } from "./types";

const target: FeedbackTarget = {
  contentId: "one-note-qa-episode",
  contentVersion: 1,
  contentTitle: "One-note question and answer (Unit 1)",
  location: "Step 2 · Practise it · section whole · 60 BPM · bar 2, count 3",
  showing: "Material one-note-question-answer v1; notes and count visible; not playing",
};
const at = new Date("2026-10-20T12:00:00.000Z");

function note(overrides: Partial<FeedbackNote> = {}): FeedbackNote {
  return { ...newFeedbackNote(target, "The answer lands late.", "wrong-music", "0.8.0", at), ...overrides };
}

describe("feedback notes are their own record", () => {
  it("captures the content, version, place and screen with the learner's words", () => {
    const created = note();
    expect(created).toMatchObject({
      contentId: "one-note-qa-episode",
      contentVersion: 1,
      location: target.location,
      showing: target.showing,
      text: "The answer lands late.",
      category: "wrong-music",
      createdAt: at.toISOString(),
      updatedAt: at.toISOString(),
      resolvedAt: null,
      appVersion: "0.8.0",
    });
    expect(created.localDate).toMatch(/^\d{4}-\d\d-\d\d$/);
    expect(() => validateFeedbackNote(created)).not.toThrow();
  });

  it("shortens only the automatic context, and refuses rather than cuts the learner's words", () => {
    const long = newFeedbackNote(
      { ...target, showing: "x".repeat(2000), contentTitle: "y".repeat(500) },
      "fine",
      undefined,
      "0.8.0",
      at,
    );
    expect(long.showing.length).toBe(NOTE_LIMITS.showing);
    expect(long.contentTitle.length).toBe(NOTE_LIMITS.contentTitle);
    expect(() => validateFeedbackNote(long)).not.toThrow();
    expect(feedbackRefusal(DEFAULT_STATE, "   ")).toMatch(/Write what is wrong/);
    expect(feedbackRefusal(DEFAULT_STATE, "z".repeat(NOTE_LIMITS.text + 1))).toMatch(/up to 4000/);
    const full: V8State = {
      ...DEFAULT_STATE,
      feedbackNotes: Array.from({ length: NOTE_LIMITS.notes }, (_, index) => note({ id: `note-${index}` })),
    };
    expect(feedbackRefusal(full, "One more")).toMatch(/nothing was discarded/);
    expect(feedbackRefusal(DEFAULT_STATE, "A real note")).toBeNull();
  });

  it("rejects malformed notes, ticks and marks", () => {
    expect(() => validateFeedbackNote({ ...note(), category: "angry" })).toThrow();
    expect(() => validateFeedbackNote({ ...note(), text: "" })).toThrow();
    expect(() => validateFeedbackNote({ ...note(), extra: true })).toThrow();
    expect(() => validateFeedbackNote({ ...note(), localDate: "20 October" })).toThrow();
    expect(() => validateChecklistTick({ id: "Bad Id", done: true, updatedAt: at.toISOString() })).toThrow();
    expect(() =>
      validateChecklistTick({ id: "laptop-backup-first", done: "yes", updatedAt: at.toISOString() }),
    ).toThrow();
    expect(() => validateReviewMark({ ...newReviewMark("lesson", 2, "George", at), id: "lesson@1" })).toThrow();
    expect(() => validateReviewMark(newReviewMark("lesson", 2, "  ", at))).toThrow();
    expect(() => validateReviewMark(newReviewMark("lesson", 2, "George", at))).not.toThrow();
  });

  it("never touches evidence, completion, the session plan or the profile's clock", () => {
    const evidence = createEvidence("unit-01-listen", ["ear:unit-01"], "recognition", "none", "successful", {});
    const start = reducer(
      { ...DEFAULT_STATE, settings: { ...DEFAULT_STATE.settings, diagnosticComplete: true } },
      { type: "recordActivity", activityId: "unit-01-listen", evidence },
    );
    let next = reducer(start, { type: "addFeedbackNote", note: note() });
    next = reducer(next, { type: "setFeedbackResolved", id: next.feedbackNotes![0].id, resolved: true });
    next = reducer(next, { type: "setChecklistTick", id: "laptop-backup-first", done: true });
    next = reducer(next, { type: "markContentChecked", mark: newReviewMark("one-note-qa-episode", 1, "George", at) });
    for (const key of [
      "evidence",
      "completedActivityIds",
      "sessionPlan",
      "sessionCursor",
      "updatedAt",
      "activeUnitId",
      "settings",
    ] as const) {
      expect(next[key]).toEqual(start[key]);
    }
    expect(cloudProfile(next)).toEqual(cloudProfile(start));
    expect(next.feedbackNotes).toHaveLength(1);
    expect(next.feedbackNotes![0].resolvedAt).toBeTruthy();
    expect(next.checklistTicks).toEqual([expect.objectContaining({ id: "laptop-backup-first", done: true })]);
    expect(next.reviewerName).toBe("George");
  });

  it("ignores a duplicated note delivery and reopens a dealt-with note", () => {
    const created = note();
    let state = reducer(DEFAULT_STATE, { type: "addFeedbackNote", note: created });
    state = reducer(state, { type: "addFeedbackNote", note: created });
    expect(state.feedbackNotes).toHaveLength(1);
    state = reducer(state, { type: "setFeedbackResolved", id: created.id, resolved: true });
    state = reducer(state, { type: "setFeedbackResolved", id: created.id, resolved: false });
    expect(state.feedbackNotes![0].resolvedAt).toBeNull();
    expect(state.feedbackNotes![0].text).toBe(created.text);
  });
});

describe("Markdown export for an agent session", () => {
  it("lists open notes with their full context and keeps dealt-with notes out unless asked", () => {
    const open = note({ id: "note-open" });
    const done = note({
      id: "note-done",
      text: "Fixed already\nsecond line",
      resolvedAt: "2026-10-21T09:00:00.000Z",
      createdAt: "2026-10-19T09:00:00.000Z",
    });
    const markdown = feedbackMarkdown([done, open], { includeResolved: false, appVersion: "0.8.0", exportedAt: at });
    expect(markdown).toContain("# Interval feedback");
    expect(markdown).toContain("1 open, 1 dealt with");
    expect(markdown).toContain("### 1. Wrong note or chord — One-note question and answer (Unit 1)");
    expect(markdown).toContain("- **Content:** `one-note-qa-episode` version 1");
    expect(markdown).toContain(`- **Where:** ${target.location}`);
    expect(markdown).toContain(`- **Showing:** ${target.showing}`);
    expect(markdown).toContain("> The answer lands late.");
    expect(markdown).not.toContain("Fixed already");
    const everything = feedbackMarkdown([done, open], { includeResolved: true, appVersion: "0.8.0", exportedAt: at });
    expect(everything).toContain("## Dealt with");
    expect(everything).toContain("> Fixed already\n> second line");
  });
});

describe("review status and the learner's check", () => {
  const pilot: AuthoredProvenance = { contentId: "one-note-qa-episode", contentVersion: 1, ...DRAFT_BY_AGENT };

  it("shows draft until George marks this exact version as checked", () => {
    expect(effectiveReview(pilot).status).toBe("draft");
    const mark = newReviewMark("one-note-qa-episode", 1, "George", at);
    expect(effectiveReview(pilot, [mark])).toMatchObject({
      status: "reviewed",
      reviewer: "George",
      fromLearnerMark: true,
    });
    expect(effectiveReview({ ...pilot, contentVersion: 2 }, [mark]).status).toBe("draft");
    expect(effectiveReview(pilot, [{ ...mark, withdrawn: true }]).status).toBe("draft");
  });

  it("keeps authored review data honest", () => {
    expect(provenanceProblems(DRAFT_BY_AGENT)).toEqual([]);
    expect(provenanceProblems({ ...DRAFT_BY_AGENT, reviewStatus: "reviewed" })).not.toEqual([]);
    expect(provenanceProblems({ ...DRAFT_BY_AGENT, reviewer: "Someone" })).not.toEqual([]);
    expect(
      provenanceProblems({
        author: "agent-drafted",
        reviewer: "George",
        reviewStatus: "reviewed",
        reviewedAt: "2026-10-21T00:00:00Z",
      }),
    ).toEqual([]);
    expect(legacyActivityProvenance({ id: "unit-03-rhythm" })).toMatchObject({
      contentId: "unit-03-rhythm",
      reviewStatus: "draft",
      author: "legacy-template",
    });
  });
});

describe("sync and mixed versions", () => {
  it("merges the newest copy of each record and leaves records alone when a snapshot omits them", () => {
    const local = note({ id: "shared", updatedAt: "2026-10-20T12:00:00.000Z" });
    const remoteNewer = { ...local, resolvedAt: "2026-10-21T09:00:00.000Z", updatedAt: "2026-10-21T09:00:00.000Z" };
    const remoteOnly = note({ id: "from-phone" });
    expect(mergeByUpdatedAt([local], [remoteNewer, remoteOnly]).map((item) => [item.id, item.resolvedAt])).toEqual([
      ["shared", "2026-10-21T09:00:00.000Z"],
      ["from-phone", null],
    ]);
    expect(mergeByUpdatedAt([remoteNewer], [local])[0].resolvedAt).toBe("2026-10-21T09:00:00.000Z");
    const state: V8State = {
      ...DEFAULT_STATE,
      feedbackNotes: [local],
      checklistTicks: [{ id: "laptop-backup-first", done: true, updatedAt: at.toISOString() }],
    };
    // A profile-only or evidence-only snapshot, as every older client produces, keeps them.
    const merged = mergeCloudSnapshot(state, { profile: null, evidence: [] });
    expect(merged.feedbackNotes).toEqual([local]);
    expect(merged.checklistTicks).toEqual(state.checklistTicks);
    expect(mergeCloudSnapshot(state, { feedback: [remoteNewer] }).feedbackNotes).toEqual([remoteNewer]);
  });

  it("reads an older workspace without these fields, and tolerates a newer one's unknown fields", () => {
    const older = structuredClone(DEFAULT_STATE) as Partial<V8State>;
    delete older.feedbackNotes;
    delete older.checklistTicks;
    delete older.reviewMarks;
    delete older.reviewerName;
    expect(() => validateState(older)).not.toThrow();
    const next = reducer(older as V8State, { type: "addFeedbackNote", note: note() });
    expect(next.feedbackNotes).toHaveLength(1);
    // A later build may add fields of its own; this build must not quarantine the workspace for that.
    expect(() => validateState({ ...next, futureRecords: [{ id: "x" }] })).not.toThrow();
  });

  it("keeps the cloud profile in exactly the shape older clients and rules accept", () => {
    const withNotes = reducer(DEFAULT_STATE, { type: "addFeedbackNote", note: note() });
    expect(Object.keys(cloudProfile(withNotes)).sort()).toEqual([
      "activeUnitId",
      "completedActivityIds",
      "deletedSketchIds",
      "lastReflection",
      "schemaVersion",
      "settings",
      "settingsUpdatedAt",
      "updatedAt",
    ]);
  });
});

describe("backups carry notes, ticks and marks", () => {
  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase("guitar-academy-v8");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    setActiveWorkspace("anonymous");
  });

  it("round-trips them through an exported archive and a staged restore", async () => {
    const state: V8State = {
      ...DEFAULT_STATE,
      feedbackNotes: [note({ id: "note-a" }), note({ id: "note-b", resolvedAt: "2026-10-21T09:00:00.000Z" })],
      checklistTicks: [{ id: "laptop-backup-first", done: true, updatedAt: at.toISOString() }],
      reviewMarks: [newReviewMark("one-note-qa-episode", 1, "George", at)],
      reviewerName: "George",
    };
    const archive = new File([await exportArchive(state)], "backup.guitar-academy");
    const preview = await prepareRestore(archive, "anonymous");
    await activateRestore(preview.operationId);
    const reopened = await loadWorkspace("anonymous");
    expect(reopened.status).toBe("ok");
    if (reopened.status !== "ok") return;
    expect(reopened.state.feedbackNotes).toEqual(state.feedbackNotes);
    expect(reopened.state.checklistTicks).toEqual(state.checklistTicks);
    expect(reopened.state.reviewMarks).toEqual(state.reviewMarks);
    expect(reopened.state.reviewerName).toBe("George");
  });

  it("still restores a backup written before these records existed", async () => {
    const older = structuredClone(DEFAULT_STATE) as Partial<V8State>;
    delete older.feedbackNotes;
    delete older.checklistTicks;
    delete older.reviewMarks;
    const archive = new File([await exportArchive(older as V8State)], "older.guitar-academy");
    const preview = await prepareRestore(archive, "anonymous");
    await activateRestore(preview.operationId);
    const reopened = await loadWorkspace("anonymous");
    expect(reopened.status).toBe("ok");
  });
});
