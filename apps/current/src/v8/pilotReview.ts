import { ONE_NOTE_QUESTION_ANSWER, PILOT_EPISODE } from "./pilotEpisode";
import type { PilotCursor, PilotListeningReview, PilotReviewFocus, V8State } from "./types";

export const PILOT_REVIEW_FOCUSES: Record<PilotReviewFocus, { label: string; prompt: string }> = {
  phrasing: {
    label: "Phrasing",
    prompt: "Where did the answer feel connected to the question, or cut off too soon?",
  },
  muting: {
    label: "Muting and release",
    prompt: "At which rest did sound continue after you meant silence?",
  },
  tension: {
    label: "Physical ease",
    prompt: "What did your hand, arm or shoulders feel like? The recording cannot tell you this.",
  },
  tone: {
    label: "Tone and touch",
    prompt: "Which attack had the sound you wanted, and which sounded different?",
  },
  intention: {
    label: "Musical intention",
    prompt: "What effect were you aiming for, and did this take sound that way to you?",
  },
};

export const PILOT_REVIEW_FOCUS_IDS = Object.keys(PILOT_REVIEW_FOCUSES) as PilotReviewFocus[];

export function pilotReviews(state: Pick<V8State, "pilotReviews">): PilotListeningReview[] {
  return (state.pilotReviews ?? []).filter(
    (review) =>
      review.episodeId === PILOT_EPISODE.id &&
      review.episodeVersion === PILOT_EPISODE.version &&
      review.materialId === ONE_NOTE_QUESTION_ANSWER.id &&
      review.materialVersion === ONE_NOTE_QUESTION_ANSWER.version,
  );
}

export function latestPilotReview(state: Pick<V8State, "pilotReviews">): PilotListeningReview | undefined {
  return pilotReviews(state).reduce<PilotListeningReview | undefined>(
    (latest, review) => (!latest || review.createdAt > latest.createdAt ? review : latest),
    undefined,
  );
}

/** This is a suggested starting place from the learner's chosen focus, never audio analysis. */
export function practiceForPilotReview(review: PilotListeningReview): {
  step: PilotCursor["step"];
  sectionId: PilotCursor["sectionId"];
  repairId?: string;
  tempo: number;
  startingPlace: string;
} {
  switch (review.focus) {
    case "muting":
      return {
        step: "repair",
        sectionId: "question",
        repairId: "release",
        tempo: 50,
        startingPlace:
          "Rehearse the first sound and rest at 50 BPM, then apply the same release at the rest you noticed in both bars.",
      };
    case "tension":
      return {
        step: "practise",
        sectionId: "question",
        tempo: 50,
        startingPlace:
          "Start with the short question bar at 50 BPM. Stop if the movement feels uncomfortable, then return to both bars only when ready.",
      };
    case "tone":
      return {
        step: "practise",
        sectionId: "question",
        tempo: 50,
        startingPlace: "Try the change on the question bar at 50 BPM, then listen for it in both bars.",
      };
    case "phrasing":
      return {
        step: "practise",
        sectionId: "whole",
        tempo: 60,
        startingPlace:
          "Play the question and answer together at 60 BPM. Notice where the second bar responds to the first.",
      };
    case "intention":
      return {
        step: "practise",
        sectionId: "whole",
        tempo: 60,
        startingPlace:
          "Play both bars at 60 BPM with your chosen intention. If useful, make a fresh temporary take and listen for the effect you wanted.",
      };
  }
}
