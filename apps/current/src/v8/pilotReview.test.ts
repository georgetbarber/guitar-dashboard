import { describe, expect, it } from "vitest";
import { ONE_NOTE_QUESTION_ANSWER, PILOT_EPISODE } from "./pilotEpisode";
import { latestPilotReview, practiceForPilotReview } from "./pilotReview";
import type { PilotListeningReview } from "./types";

const review: PilotListeningReview = {
  id: "review-one",
  episodeId: PILOT_EPISODE.id,
  episodeVersion: PILOT_EPISODE.version,
  materialId: ONE_NOTE_QUESTION_ANSWER.id,
  materialVersion: ONE_NOTE_QUESTION_ANSWER.version,
  takeCapturedAt: "2026-09-29T12:00:00.000Z",
  focus: "muting",
  intended: "Leave a clean rest.",
  noticed: "The last rest rang on.",
  nextChange: "Lift the picking hand at the final rest.",
  method: "self-reported",
  createdAt: "2026-09-29T12:05:00.000Z",
  localDate: "2026-09-29",
};

describe("a written review leads back to the same music", () => {
  it("uses the newest current-version review, ignoring unrelated or future material", () => {
    const newer = { ...review, id: "review-newer", createdAt: "2026-09-30T12:05:00.000Z" };
    const unrelated = {
      ...review,
      id: "review-other",
      materialVersion: review.materialVersion + 1,
      createdAt: "2026-10-01T12:05:00.000Z",
    };
    expect(latestPilotReview({ pilotReviews: [newer, unrelated, review] })?.id).toBe(newer.id);
    expect(latestPilotReview({ pilotReviews: [unrelated] })).toBeUndefined();
  });

  it("sends a muting focus to the authored release repair, then leaves other focuses as practice", () => {
    expect(practiceForPilotReview(review)).toMatchObject({
      step: "repair",
      repairId: "release",
      sectionId: "question",
      tempo: 50,
    });
    expect(practiceForPilotReview({ ...review, focus: "tone" })).toMatchObject({
      step: "practise",
      sectionId: "question",
      tempo: 50,
    });
    expect(practiceForPilotReview({ ...review, focus: "phrasing" })).toMatchObject({
      step: "practise",
      sectionId: "whole",
      tempo: 60,
    });
  });
});
