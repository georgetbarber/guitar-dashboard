import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, writeBatch } from "firebase/firestore";
import { getMetadata, ref, uploadBytes } from "firebase/storage";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { commitIsolating, type PendingWrite, type Withheld } from "../src/v8/sync";

let environment: RulesTestEnvironment;

const profile = {
  schemaVersion: 1,
  activeUnitId: "unit-01",
  completedActivityIds: [],
  settings: {
    instrument: "electric",
    dailyMinutes: 25,
    tonicName: "C",
    mode: "major",
    theme: "light",
    reducedMotion: false,
    diagnosticComplete: true,
    startingBaseline: "repair"
  },
  settingsUpdatedAt: "2026-08-13T12:00:00.000Z",
  lastReflection: "",
  deletedSketchIds: {},
  updatedAt: "2026-08-13T12:00:00.000Z"
};

const evidence = {
  id: "evidence-1",
  competencyId: "ear:unit-01",
  source: "recognition",
  assistance: "none",
  context: { instrument: "electric" },
  outcome: "successful",
  occurredAt: "2026-08-13T12:00:00.000Z",
  activityId: "unit-01-listen"
};

const sketch = {
  id: "sketch-1",
  name: "Rules test sketch",
  intention: "Check that legitimate composition work remains available.",
  tags: ["test"],
  tempo: 72,
  metre: "4/4",
  key: "C",
  mode: "major",
  chords: [],
  melody: [],
  rhythmPattern: "",
  bassMovement: "",
  sections: [],
  notes: "",
  ambiguityNotes: "",
  takes: [],
  revisions: [],
  reflections: [],
  status: "capture",
  createdAt: "2026-08-13T12:00:00.000Z",
  updatedAt: "2026-08-13T12:00:00.000Z",
  fieldUpdatedAt: { name: "2026-08-13T12:00:00.000Z" }
};

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: "demo-guitar-academy",
    firestore: { rules: readFileSync(resolve("firestore.rules"), "utf8") },
    storage: { rules: readFileSync(resolve("storage.rules"), "utf8") }
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
  await environment.clearStorage();
});

afterAll(async () => environment.cleanup());

describe("Firestore tenant rules", () => {
  it("isolates a rules-refused sketch so another valid sketch still uploads", async () => {
    const database = environment.authenticatedContext("learner-a").firestore();
    const valid = doc(database, "users/learner-a/sketches/valid");
    const refused = doc(database, "users/learner-a/sketches/refused");
    const writes: PendingWrite<ReturnType<typeof writeBatch>>[] = [
      { kind: "sketch", id: "valid", apply: (batch) => batch.set(valid, { ...sketch, id: "valid" }), alone: () => setDoc(valid, { ...sketch, id: "valid" }) },
      { kind: "sketch", id: "refused", apply: (batch) => batch.set(refused, { ...sketch, id: "refused", unexpected: true }), alone: () => setDoc(refused, { ...sketch, id: "refused", unexpected: true }) },
    ];
    const withheld: Withheld[] = [];
    await commitIsolating(writes, () => writeBatch(database), withheld);
    expect((await getDoc(valid)).exists()).toBe(true);
    expect((await getDoc(refused)).exists()).toBe(false);
    expect(withheld).toEqual([expect.objectContaining({ id: "refused", kind: "sketch" })]);
  });

  it("allows a valid owner profile and append-only evidence", async () => {
    const database = environment.authenticatedContext("learner-a").firestore();
    await assertSucceeds(setDoc(doc(database, "users/learner-a"), profile));
    await assertSucceeds(setDoc(doc(database, "users/learner-a/evidence/evidence-1"), evidence));
  });

  it("denies anonymous, cross-user, malformed and unknown-collection access", async () => {
    const anonymous = environment.unauthenticatedContext().firestore();
    const learnerA = environment.authenticatedContext("learner-a").firestore();
    const learnerB = environment.authenticatedContext("learner-b").firestore();
    await assertFails(getDoc(doc(anonymous, "users/learner-a")));
    await assertFails(getDoc(doc(learnerB, "users/learner-a")));
    await assertFails(setDoc(doc(learnerA, "users/learner-a"), { ...profile, unexpected: true }));
    await assertFails(setDoc(doc(learnerA, "users/learner-a/anything/record-1"), { value: "unbounded" }));
  });

  it("does not permit evidence mutation after creation", async () => {
    const database = environment.authenticatedContext("learner-a").firestore();
    await assertSucceeds(setDoc(doc(database, "users/learner-a/evidence/evidence-1"), evidence));
    await assertFails(setDoc(doc(database, "users/learner-a/evidence/evidence-1"), { ...evidence, outcome: "retry" }));
    // Delete stays available for erasing an account's history on request. It is
    // a deliberate, whole-history operation, never a way to amend one record.
    await assertSucceeds(deleteDoc(doc(database, "users/learner-a/evidence/evidence-1")));
  });

  it("accepts a learner-local date while rejecting malformed dates", async () => {
    const database = environment.authenticatedContext("learner-a").firestore();
    await assertSucceeds(setDoc(doc(database, "users/learner-a/evidence/local-date"), {
      ...evidence, id: "local-date", localDate: "2026-09-28"
    }));
    await assertFails(setDoc(doc(database, "users/learner-a/evidence/bad-date"), {
      ...evidence, id: "bad-date", localDate: "28 September 2026"
    }));
  });

  it("takes a correction as a new retraction record rather than an edit", async () => {
    const database = environment.authenticatedContext("learner-a").firestore();
    await assertSucceeds(setDoc(doc(database, "users/learner-a/evidence/evidence-1"), evidence));
    await assertSucceeds(setDoc(doc(database, "users/learner-a/evidence/evidence-2"), {
      ...evidence,
      id: "evidence-2",
      method: "self-reported",
      retracts: "evidence-1"
    }));
    // Both halves survive: that is what makes the correction auditable.
    await assertSucceeds(getDoc(doc(database, "users/learner-a/evidence/evidence-1")));
  });

  it("accepts an observation that names how it was established, and only honestly", async () => {
    const database = environment.authenticatedContext("learner-a").firestore();
    await assertSucceeds(setDoc(doc(database, "users/learner-a/evidence/evidence-3"), {
      ...evidence, id: "evidence-3", method: "self-reported", artifactId: "sketch-1"
    }));
    // Nothing in the app measures a performance, so nothing may claim to.
    await assertFails(setDoc(doc(database, "users/learner-a/evidence/evidence-4"), {
      ...evidence, id: "evidence-4", method: "measured"
    }));
  });

  it("keeps exact-answer evidence distinct from self-reports at the cloud boundary", async () => {
    const database = environment.authenticatedContext("learner-a").firestore();
    const checked = {
      ...evidence, id: "checked-1", competencyId: "knowledge.interval",
      activityId: "concept-check:interval-1", source: "recognition",
      context: { key: "C", mode: "major" }, method: "exact-answer",
      checkId: "interval-1", contentVersion: 1, response: "major third"
    };
    await assertSucceeds(setDoc(doc(database, "users/learner-a/evidence/checked-1"), checked));
    const noVersion: Record<string, unknown> = { ...checked, id: "checked-no-version" };
    delete noVersion.contentVersion;
    await assertFails(setDoc(doc(database, "users/learner-a/evidence/checked-no-version"), {
      ...noVersion
    }));
    await assertFails(setDoc(doc(database, "users/learner-a/evidence/fake-self-report"), {
      ...checked, id: "fake-self-report", method: "self-reported"
    }));
  });

  it("still accepts a record written before those fields existed", async () => {
    const database = environment.authenticatedContext("learner-a").firestore();
    await assertSucceeds(setDoc(doc(database, "users/learner-a/evidence/evidence-5"), { ...evidence, id: "evidence-5" }));
  });

  it("allows a bounded composition sketch and rejects an oversized one", async () => {
    const database = environment.authenticatedContext("learner-a").firestore();
    await assertSucceeds(setDoc(doc(database, "users/learner-a/sketches/sketch-1"), sketch));
    await assertFails(setDoc(doc(database, "users/learner-a/sketches/sketch-2"), {
      ...sketch,
      id: "sketch-2",
      notes: "x".repeat(200_001)
    }));
  });
});

const note = {
  id: "note-1",
  contentId: "one-note-qa-episode",
  contentVersion: 1,
  contentTitle: "One-note question and answer",
  location: "Step: Practise · Bar 2",
  showing: "Practise step with the count visible",
  text: "The answer bar sounds a beat late.",
  category: "wrong-music",
  createdAt: "2026-10-20T12:00:00.000Z",
  localDate: "2026-10-20",
  resolvedAt: null,
  updatedAt: "2026-10-20T12:00:00.000Z",
  appVersion: "0.8.0"
};

const tick = { id: "guitar-unit-1-pilot", done: true, updatedAt: "2026-10-20T12:00:00.000Z" };

const mark = {
  id: "one-note-qa-episode@1",
  contentId: "one-note-qa-episode",
  contentVersion: 1,
  reviewer: "George",
  reviewedAt: "2026-10-20T12:00:00.000Z",
  withdrawn: false,
  updatedAt: "2026-10-20T12:00:00.000Z"
};

describe("Feedback notes, checklist ticks and review marks", () => {
  it("accepts a bounded note and lets only its dealt-with state change", async () => {
    const database = environment.authenticatedContext("learner-a").firestore();
    const reference = doc(database, "users/learner-a/feedback/note-1");
    await assertSucceeds(setDoc(reference, note));
    await assertSucceeds(setDoc(reference, { ...note, resolvedAt: "2026-10-21T09:00:00.000Z", updatedAt: "2026-10-21T09:00:00.000Z" }));
    await assertSucceeds(setDoc(reference, { ...note, resolvedAt: null, updatedAt: "2026-10-21T10:00:00.000Z" }));
    await assertFails(setDoc(reference, { ...note, text: "Rewritten after the fact.", updatedAt: "2026-10-21T11:00:00.000Z" }));
    await assertFails(setDoc(reference, { ...note, contentId: "another-lesson", updatedAt: "2026-10-21T11:00:00.000Z" }));
  });

  it("accepts a minimal note written without optional fields", async () => {
    const database = environment.authenticatedContext("learner-a").firestore();
    const minimal: Record<string, unknown> = { ...note, id: "note-2" };
    for (const key of ["contentVersion", "location", "category", "resolvedAt", "appVersion"]) delete minimal[key];
    await assertSucceeds(setDoc(doc(database, "users/learner-a/feedback/note-2"), minimal));
  });

  it("rejects malformed, oversized, mismatched and cross-user notes", async () => {
    const learnerA = environment.authenticatedContext("learner-a").firestore();
    const learnerB = environment.authenticatedContext("learner-b").firestore();
    await assertFails(setDoc(doc(learnerA, "users/learner-a/feedback/note-3"), { ...note, id: "note-3", text: "" }));
    await assertFails(setDoc(doc(learnerA, "users/learner-a/feedback/note-4"), { ...note, id: "note-4", text: "x".repeat(4001) }));
    await assertFails(setDoc(doc(learnerA, "users/learner-a/feedback/note-5"), { ...note, id: "note-5", category: "angry" }));
    await assertFails(setDoc(doc(learnerA, "users/learner-a/feedback/note-6"), { ...note, id: "note-6", localDate: "20 October" }));
    await assertFails(setDoc(doc(learnerA, "users/learner-a/feedback/note-7"), { ...note, id: "note-7", unexpected: true }));
    await assertFails(setDoc(doc(learnerA, "users/learner-a/feedback/note-8"), note));
    const missing: Record<string, unknown> = { ...note, id: "note-9" };
    delete missing.showing;
    await assertFails(setDoc(doc(learnerA, "users/learner-a/feedback/note-9"), missing));
    await assertFails(setDoc(doc(learnerB, "users/learner-a/feedback/note-1"), note));
    await assertSucceeds(setDoc(doc(learnerA, "users/learner-a/feedback/note-1"), note));
    await assertFails(getDoc(doc(learnerB, "users/learner-a/feedback/note-1")));
  });

  it("accepts checklist ticks and rejects malformed ones", async () => {
    const database = environment.authenticatedContext("learner-a").firestore();
    await assertSucceeds(setDoc(doc(database, "users/learner-a/checks/guitar-unit-1-pilot"), tick));
    await assertSucceeds(setDoc(doc(database, "users/learner-a/checks/guitar-unit-1-pilot"), { ...tick, done: false, updatedAt: "2026-10-21T09:00:00.000Z" }));
    await assertFails(setDoc(doc(database, "users/learner-a/checks/Not_Valid"), { ...tick, id: "Not_Valid" }));
    await assertFails(setDoc(doc(database, "users/learner-a/checks/other-item"), tick));
    await assertFails(setDoc(doc(database, "users/learner-a/checks/guitar-unit-1-pilot"), { ...tick, done: "yes" }));
    await assertFails(setDoc(doc(database, "users/learner-a/checks/guitar-unit-1-pilot"), { ...tick, note: "extra" }));
  });

  it("accepts a review mark only for its own content version", async () => {
    const database = environment.authenticatedContext("learner-a").firestore();
    const reference = doc(database, "users/learner-a/reviews/one-note-qa-episode@1");
    await assertSucceeds(setDoc(reference, mark));
    await assertSucceeds(setDoc(reference, { ...mark, withdrawn: true, updatedAt: "2026-10-21T09:00:00.000Z" }));
    await assertFails(setDoc(doc(database, "users/learner-a/reviews/one-note-qa-episode@2"), { ...mark, id: "one-note-qa-episode@2" }));
    await assertFails(setDoc(reference, { ...mark, reviewer: "" }));
    await assertFails(setDoc(reference, { ...mark, reviewStatus: "trialled" }));
  });

  it("leaves the profile document's shape unchanged, so older clients and rules still accept it", async () => {
    const database = environment.authenticatedContext("learner-a").firestore();
    await assertFails(setDoc(doc(database, "users/learner-a"), { ...profile, feedbackNotes: [note] }));
    await assertSucceeds(setDoc(doc(database, "users/learner-a"), profile));
  });
});

describe("Storage recording rules", () => {
  it("allows only the owner to upload and read an explicitly selected audio take", async () => {
    const ownerStorage = environment.authenticatedContext("learner-a").storage();
    const otherStorage = environment.authenticatedContext("learner-b").storage();
    const path = "users/learner-a/finished-takes/sketch-1/take-1";
    await assertSucceeds(uploadBytes(ref(ownerStorage, path), new Uint8Array([1, 2, 3]), {
      contentType: "audio/webm",
      customMetadata: { explicitlySelected: "true", sketchId: "sketch-1", takeId: "take-1" }
    }));
    await assertSucceeds(getMetadata(ref(ownerStorage, path)));
    await assertFails(getMetadata(ref(otherStorage, path)));
  });

  it("rejects anonymous, non-audio and unselected uploads", async () => {
    const anonymous = environment.unauthenticatedContext().storage();
    const owner = environment.authenticatedContext("learner-a").storage();
    const path = "users/learner-a/finished-takes/sketch-1/take-2";
    await assertFails(uploadBytes(ref(anonymous, path), new Uint8Array([1]), {
      contentType: "audio/webm",
      customMetadata: { explicitlySelected: "true" }
    }));
    await assertFails(uploadBytes(ref(owner, path), new Uint8Array([1]), {
      contentType: "text/plain",
      customMetadata: { explicitlySelected: "true" }
    }));
    await assertFails(uploadBytes(ref(owner, path), new Uint8Array([1]), { contentType: "audio/webm" }));
  });
});
