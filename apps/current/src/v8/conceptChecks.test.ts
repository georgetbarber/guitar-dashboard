import { describe, expect, it } from "vitest";
import {
  CONCEPT_CHECKS,
  CONCEPT_KINDS,
  checkedAnswerIsValid,
  conceptProgress,
  dueConceptKind,
  nextConceptCheck,
  recordConceptAnswer,
} from "./conceptChecks";
import { createEvidence, masteryFor, retractObservations, unitProgress } from "./learning";
import { DEFAULT_STATE } from "./store";
import { acceptEvidence, mergeCloudSnapshot, screenEvidence } from "./sync";
import { validateEvidence } from "./validation";

const check = (kind: (typeof CONCEPT_KINDS)[number], variant: number) =>
  CONCEPT_CHECKS.find((item) => item.kind === kind && item.id.endsWith(`-${variant}`))!;
const at = (day: number) => new Date(`2026-09-${String(day).padStart(2, "0")}T10:00:00.000Z`);

describe("exact relationship checks", () => {
  it("has two musically correct, answer-hidden examples for each relationship", () => {
    expect(CONCEPT_CHECKS).toHaveLength(8);
    expect(new Set(CONCEPT_CHECKS.map((item) => item.id)).size).toBe(8);
    for (const item of CONCEPT_CHECKS) {
      expect(item.choices).toContain(item.answer);
      expect(item.question).not.toContain(item.answer);
      expect(item.hint).not.toContain(item.answer);
    }
    expect(check("interval", 1).answer).toBe("major third");
    expect(check("interval", 2).answer).toBe("minor third");
    expect(check("degree", 1).answer).toBe("3");
    expect(check("degree", 2).answer).toBe("5");
    expect(check("chord-tone", 1).answer).toBe("major third");
    expect(check("chord-tone", 2).answer).toBe("minor third");
    expect(check("roman-numeral", 1).answer).toBe("IV");
    expect(check("roman-numeral", 2).answer).toBe("iv");
  });

  it("records a deterministic answer separately from a guitar self-report", () => {
    const item = check("interval", 1);
    const correct = recordConceptAnswer(item, item.answer, false, at(27));
    const wrong = recordConceptAnswer(item, "minor third", true, at(27));
    const played = createEvidence(
      "unit-01-rhythm",
      ["rhythm:unit-01"],
      "performance",
      "none",
      "successful",
      {},
      at(27).toISOString(),
    )[0];
    expect(correct).toMatchObject({
      method: "exact-answer",
      outcome: "successful",
      checkId: item.id,
      contentVersion: 1,
      assistance: "none",
    });
    expect(wrong).toMatchObject({ method: "exact-answer", outcome: "retry", assistance: "hint" });
    expect(played.method).toBe("self-reported");
    expect(checkedAnswerIsValid(correct)).toBe(true);
    expect(() => validateEvidence(correct)).not.toThrow();
    expect(screenEvidence(correct)).toBeNull();
    expect(masteryFor("rhythm:unit-01", [correct, played]).state).toBe("practising");
    expect(unitProgress({ ...DEFAULT_STATE, evidence: [correct] }, "unit-01")).toBe(0);
  });

  it("refuses a falsified answer or mismatched check metadata at intake", () => {
    const item = check("degree", 1);
    const correct = recordConceptAnswer(item, item.answer, false, at(27));
    expect(() => validateEvidence({ ...correct, response: "5" })).toThrow();
    expect(() => validateEvidence({ ...correct, context: { key: "D", mode: "major" } })).toThrow();
    expect(() => validateEvidence({ ...correct, contentVersion: 1, checkId: "unknown-check" })).toThrow();
    expect(() => validateEvidence({ ...correct, method: "self-reported" })).toThrow();
    expect(() => validateEvidence({ ...correct, method: "measured-pitch" })).toThrow();
    const screened = acceptEvidence([
      { id: correct.id, data: correct },
      { id: "bad", data: { ...correct, id: "bad", response: "5" } },
    ]);
    expect(screened.accepted).toHaveLength(1);
    expect(screened.rejected).toHaveLength(1);
  });

  it("retains future-version records without treating them as current checks", () => {
    const item = check("interval", 1);
    const future = { ...recordConceptAnswer(item, item.answer, false, at(27)), contentVersion: 2 };
    expect(() => validateEvidence(future)).not.toThrow();
    expect(() => validateEvidence({ ...future, context: {} })).toThrow();
    expect(conceptProgress("interval", [future]).correctUnaided).toBe(0);
    const old = createEvidence(
      "unit-01-rhythm",
      ["rhythm:unit-01"],
      "performance",
      "none",
      "successful",
      {},
      at(26).toISOString(),
    );
    const merged = mergeCloudSnapshot({ ...DEFAULT_STATE, evidence: old }, { evidence: [future] });
    expect(merged.evidence.map((item) => item.method)).toEqual(["self-reported", "exact-answer"]);
  });

  it("asks for a changed example later without erasing earlier correct work", () => {
    const first = recordConceptAnswer(check("interval", 1), check("interval", 1).answer, false, at(27));
    expect(nextConceptCheck("interval", [first]).id).toBe(check("interval", 2).id);
    expect(dueConceptKind([first], at(27))).toBeNull();
    expect(dueConceptKind([first], at(28))).toBe("interval");
    const assisted = recordConceptAnswer(check("interval", 2), check("interval", 2).answer, true, at(28));
    expect(conceptProgress("interval", [first, assisted]).recalled).toBe(false);
    expect(nextConceptCheck("interval", [first, assisted], at(28)).id).toBe(check("interval", 2).id);
    const later = recordConceptAnswer(check("interval", 2), check("interval", 2).answer, false, at(28));
    expect(conceptProgress("interval", [first, assisted, later]).recalled).toBe(true);
    expect(dueConceptKind([first, assisted, later], at(29))).toBeNull();
    const corrected = [...[first, later], ...retractObservations([later])];
    expect(conceptProgress("interval", corrected).recalled).toBe(false);
  });
});
