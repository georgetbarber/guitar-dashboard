import { ONE_NOTE_QUESTION_ANSWER, PILOT_EPISODE } from "./pilotEpisode";
import type { PilotListeningReview, PilotReviewFocus, V8State } from "./types";

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
