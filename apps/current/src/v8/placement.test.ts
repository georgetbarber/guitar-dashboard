import { describe, expect, it } from "vitest";
import { CONCEPT_CHECKS, PLACEMENT_CHECKS, checkedAnswerIsValid, recordConceptAnswer } from "./conceptChecks";
import { placementCheck, placementResults, placementSuggestion, recordPlacementReport } from "./placement";
import { retractObservations } from "./learning";
import { validateEvidence } from "./validation";

const at = (day: number) => new Date(`2026-09-${day}T10:00:00.000Z`);

describe("optional starting-point sampling", () => {
  it("uses reviewed sounding and fretboard relationships without exposing the answer before submission", () => {
    expect(PLACEMENT_CHECKS.map((item) => item.id)).toEqual([
      "placement-ear-1",
      "placement-ear-2",
      "placement-fretboard-1",
      "placement-fretboard-2",
    ]);
    expect(PLACEMENT_CHECKS.map((item) => item.answer)).toEqual(["wider", "narrower", "5", "1"]);
    expect(PLACEMENT_CHECKS[0].audioPairs).toEqual([
      [60, 63],
      [60, 64],
    ]);
    expect(PLACEMENT_CHECKS[1].audioPairs).toEqual([
      [62, 66],
      [62, 65],
    ]);
    for (const item of PLACEMENT_CHECKS) {
      expect(item.choices).toContain(item.answer);
      expect(item.question).not.toContain(item.answer);
      expect(item.hint).not.toContain(item.answer);
      const answer = recordConceptAnswer(item, item.answer, false, at(29));
      expect(checkedAnswerIsValid(answer)).toBe(true);
      expect(() => validateEvidence(answer)).not.toThrow();
    }
    const wrong = recordConceptAnswer(PLACEMENT_CHECKS[0], "narrower", false, at(29));
    expect(() => validateEvidence({ ...wrong, outcome: "successful" })).toThrow();
  });

  it("keeps physical reports separate from checked answers and does not infer the guitar used", () => {
    const pulse = recordPlacementReport("pulse", true, at(29));
    const sound = recordPlacementReport("sound", false, at(29));
    expect(pulse).toMatchObject({
      method: "self-reported",
      source: "performance",
      assistance: "guided",
      context: { tempo: 100 },
    });
    expect(sound).toMatchObject({ method: "self-reported", outcome: "retry", context: {} });
    expect(() => validateEvidence(pulse)).not.toThrow();
    expect(() => validateEvidence(sound)).not.toThrow();
    expect(placementResults([pulse, sound])).toMatchObject({
      pulse: "reported-yes",
      sound: "reported-not-yet",
      ear: "not-sampled",
      fretboard: "not-sampled",
      chord: "not-sampled",
    });
    expect(placementSuggestion([pulse, sound]).baseline).toBe("repair");
    const correctedPulse = recordPlacementReport("pulse", false, at(29));
    expect(placementResults([pulse, correctedPulse]).pulse).toBe("reported-not-yet");
  });

  it("offers a cautious starting suggestion, with a separate repair for a missed concept", () => {
    const pulse = recordPlacementReport("pulse", true, at(29));
    const sound = recordPlacementReport("sound", true, at(29));
    const ear = recordConceptAnswer(PLACEMENT_CHECKS[0], "narrower", false, at(29));
    const chord = recordConceptAnswer(
      CONCEPT_CHECKS.find((item) => item.kind === "chord-tone")!,
      "major third",
      false,
      at(29),
    );
    const evidence = [pulse, sound, ear, chord];
    const suggestion = placementSuggestion(evidence);
    expect(suggestion.baseline).toBe("some");
    expect(suggestion.reason).toMatch(/reported/);
    expect(suggestion.nextActions).toEqual(
      expect.arrayContaining([expect.stringMatching(/^Ear:/), expect.stringMatching(/^Chord:/)]),
    );
    expect(placementResults(evidence).ear).toBe("checked-retry");
    expect(placementResults(evidence).chord).toBe("checked-correct");
    expect(placementCheck("ear", evidence).id).toBe("placement-ear-2");
    expect(placementCheck("fretboard", evidence).id).toBe("placement-fretboard-1");
    expect(placementCheck("chord", evidence).id).toBe("chord-tone-2");
    expect(placementSuggestion([...evidence, ...retractObservations([sound])]).baseline).toBe("repair");
  });
});
