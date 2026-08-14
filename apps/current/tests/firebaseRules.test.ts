import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { getMetadata, ref, uploadBytes } from "firebase/storage";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

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
    await assertSucceeds(deleteDoc(doc(database, "users/learner-a/evidence/evidence-1")));
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
