/**
 * A LESSON IS SHIPPABLE ONLY WHEN EVERY REQUIRED PART IS PRESENT AND TRUE.
 *
 * Checks the completeness contract (brief §4.3), every score's structure,
 * theory, playability and display/audio correspondence (§4.6), provenance,
 * and the continuity of cue fading and recall: support only ever fades, the
 * last step is unaided, recall comes on a later day at a tempo the score
 * allows, and the transfer really changes what it says it changes.
 */
import { correspondenceProblems } from "../../core/score/correspond";
import { playabilityProblems } from "../../core/score/playability";
import type { ChangedDimension, Score } from "../../core/score/types";
import { positionMidi, scoreErrors, strumPositions, totalTicks } from "../../core/score/validate";
import { metreInfo } from "../../core/score/time";
import { CURRICULUM } from "../curriculum";
import type { CueLevel, CuePhase, Lesson, VisibleTechnique } from "./format";

const PHASE_ORDER: Record<CuePhase, number> = { learn: 0, practise: 1, "try-unaided": 2 };
const SUPPORT: Record<CueLevel, number> = { full: 2, "count-only": 1, none: 0 };
const CAPABILITY = /^[a-z0-9-]+(?:\.[a-z0-9-]+){1,3}$/;
const LESSON_ID = /^lesson-[a-z0-9-]{3,80}$/;

const enough = (text: string | undefined, minimum = 12) => typeof text === "string" && text.trim().length >= minimum;

/** Techniques a score uses that a learner would need to see a hand do. */
export function visibleTechniques(score: Score): VisibleTechnique[] {
  const found = new Set<VisibleTechnique>();
  for (const event of score.events) {
    if (event.kind === "rest") continue;
    const art = event.art ?? {};
    if (art.bend) found.add("bends");
    if (art.vibrato) found.add("vibrato");
    if (art.palmMute || art.dead) found.add("muting");
    if (art.legato) found.add("legato");
    if (event.kind === "note" && event.notes.some((note) => note.pluck)) found.add("fingerpicking hand");
    if (event.kind === "strum" && event.dur < metreInfo(score.metre).beatTicks / 2) found.add("strumming hand");
  }
  return [...found];
}

function pitches(score: Score): string {
  return score.events
    .flatMap((event) =>
      event.kind === "note"
        ? event.notes.map(positionMidi)
        : event.kind === "strum"
          ? strumPositions(event, score).map(positionMidi)
          : [],
    )
    .join(",");
}

function onsets(score: Score): string {
  return score.events
    .filter((event) => event.kind !== "rest" && !event.art?.tie)
    .map((event) => `${event.voice}@${event.at}`)
    .join(",");
}

function articulations(score: Score): string {
  return score.events.map((event) => (event.kind === "rest" ? "" : JSON.stringify(event.art ?? {}))).join("|");
}

function positions(score: Score): string {
  return score.events
    .flatMap((event) =>
      event.kind === "note"
        ? event.notes.map((note) => `${note.string}:${note.fret}`)
        : event.kind === "strum"
          ? strumPositions(event, score).map((note) => `${note.string}:${note.fret}`)
          : [],
    )
    .join(",");
}

/** Whether `changed` really differs between two scores in the dimension a transfer claims. */
export function differsIn(dimension: ChangedDimension, a: Score, b: Score): boolean {
  switch (dimension) {
    case "pitch":
      return pitches(a) !== pitches(b);
    case "key":
      return a.key.tonic !== b.key.tonic || a.key.mode !== b.key.mode;
    case "position":
      return positions(a) !== positions(b);
    case "rhythm":
      return onsets(a) !== onsets(b) || a.metre !== b.metre;
    case "feel":
      return a.feel !== b.feel;
    case "articulation":
      return articulations(a) !== articulations(b);
    case "texture":
      return a.voices.length !== b.voices.length;
    case "harmony":
      return a.voicings.map((v) => v.symbol).join() !== b.voicings.map((v) => v.symbol).join();
  }
}

/** A study is distinct when its music differs, not merely its title. */
function musicOf(score: Score): string {
  return `${score.key.tonic} ${score.key.mode}|${score.metre}|${score.feel}|${pitches(score)}|${onsets(score)}|${articulations(score)}`;
}

export function validateLesson(lesson: Lesson): string[] {
  const errors: string[] = [];
  const add = (message: string) => errors.push(`${lesson.id}: ${message}`);

  if (!LESSON_ID.test(lesson.id)) add("lesson ids start with lesson- and use lower-case letters, digits and hyphens.");
  if (!Number.isInteger(lesson.version) || lesson.version < 1) add("needs a positive whole version.");
  const p = lesson.provenance;
  if (!p?.author?.trim()) add("provenance needs an author.");
  else if (p.reviewStatus === "draft" && (p.reviewer || p.reviewedAt))
    add("a draft cannot name a reviewer or review date.");
  else if (p.reviewStatus !== "draft" && (!p.reviewer.trim() || !Number.isFinite(Date.parse(p.reviewedAt ?? ""))))
    add("reviewed content needs a named reviewer and a review date.");

  const unit = CURRICULUM.find((item) => item.id === lesson.unitId);
  if (!unit) add(`unknown unit ${lesson.unitId}.`);
  else {
    if (unit.stage !== lesson.stage) add(`${lesson.unitId} is in stage ${unit.stage}, not ${lesson.stage}.`);
    if (!unit.activities.some((activity) => activity.kind === lesson.activityKind))
      add(`${lesson.unitId} has no ${lesson.activityKind} activity to stand in for.`);
  }

  for (const [field, text] of [
    ["title", lesson.title],
    ["purpose", lesson.purpose],
    ["audible destination", lesson.destination],
    ["variable being changed", lesson.variable],
  ] as const)
    if (!enough(text, field === "title" ? 4 : 12)) add(`needs a ${field}.`);

  if (!lesson.capabilities.length) add("needs at least one capability.");
  const capabilityIds = new Set<string>();
  for (const capability of lesson.capabilities) {
    if (!CAPABILITY.test(capability.id) || capabilityIds.has(capability.id))
      add(`capability id "${capability.id}" is invalid or repeated.`);
    capabilityIds.add(capability.id);
    if (!enough(capability.title, 4) || !enough(capability.criterion))
      add(`capability ${capability.id} needs a title and criterion.`);
  }

  // Scores: each one shippable on its own.
  const scores = new Map<string, Score>();
  for (const score of lesson.scores) {
    if (scores.has(score.id)) add(`score ${score.id} appears twice.`);
    scores.set(score.id, score);
    errors.push(...scoreErrors(score).map((message) => `${lesson.id}: ${message}`));
    errors.push(...playabilityProblems(score).map((problem) => `${lesson.id}: ${problem.message}`));
    errors.push(...correspondenceProblems(score).map((problem) => `${lesson.id}: ${problem.message}`));
    if (
      score.provenance.author !== lesson.provenance.author ||
      score.provenance.reviewStatus !== lesson.provenance.reviewStatus
    )
      add(`score ${score.id} must share the lesson's author and review status.`);
    if (score.derivedFrom && !lesson.scores.some((other) => other.id === score.derivedFrom!.id))
      add(`score ${score.id} is derived from ${score.derivedFrom.id}, which this lesson does not include.`);
  }
  const used = new Set<string>();
  const need = (id: string, where: string) => {
    used.add(id);
    if (!scores.has(id)) add(`${where} names unknown score ${id}.`);
    return scores.get(id);
  };

  const demonstration = need(lesson.demonstration.scoreId, "the demonstration");
  if (!lesson.demonstration.handGuidance.length || lesson.demonstration.handGuidance.some((line) => !enough(line)))
    add("the demonstration needs written hand guidance.");
  const seen = new Set(lesson.scores.flatMap(visibleTechniques));
  for (const technique of seen)
    if (!lesson.demonstration.videoNeeded.includes(technique))
      add(`uses ${technique}, so it must show that a demonstration video is still needed.`);

  if (lesson.studies.length < 2) add("needs at least two studies.");
  const studyMusic = new Set<string>();
  for (const study of lesson.studies) {
    const score = need(study.scoreId, `study ${study.id}`);
    if (!enough(study.title, 4) || !enough(study.changes)) add(`study ${study.id} needs a title and what it changes.`);
    if (score) {
      if (studyMusic.has(musicOf(score))) add(`study ${study.id} is musically identical to an earlier study.`);
      studyMusic.add(musicOf(score));
    }
  }

  if (!lesson.successCriteria.length || lesson.successCriteria.some((line) => !enough(line)))
    add("needs honest, observable success criteria.");

  if (lesson.likelyErrors.length < 2) add("needs at least two likely errors with specific repairs.");
  for (const error of lesson.likelyErrors) {
    const score = need(error.scoreId, `likely error ${error.id}`);
    if (!enough(error.signal, 8) || !enough(error.repair, 20))
      add(`likely error ${error.id} needs a signal and a specific repair.`);
    if (score) {
      const beat = metreInfo(score.metre).beatTicks;
      if (
        !(error.from >= 0 && error.from < error.to && error.to <= totalTicks(score)) ||
        error.from % beat ||
        error.to % beat
      )
        add(`likely error ${error.id} loops an invalid span.`);
    }
  }

  if (lesson.cueFading.length < 3) add("needs a cue-fading sequence of at least three steps.");
  lesson.cueFading.forEach((step, index) => {
    need(step.scoreId, `cue step ${step.id}`);
    if (!enough(step.instruction)) add(`cue step ${step.id} needs an instruction.`);
    const before = lesson.cueFading[index - 1];
    if (before && (PHASE_ORDER[step.phase] < PHASE_ORDER[before.phase] || SUPPORT[step.cues] > SUPPORT[before.cues]))
      add(`cue step ${step.id} brings support back; cues may only fade.`);
  });
  if (lesson.cueFading[0]?.cues !== "full" || lesson.cueFading[0]?.phase !== "learn")
    add("cue fading starts fully supported.");
  const last = lesson.cueFading.at(-1);
  if (last?.cues !== "none" || last.phase !== "try-unaided") add("cue fading ends unaided.");

  const recall = need(lesson.retrieval.scoreId, "the retrieval task");
  if (!Number.isInteger(lesson.retrieval.afterDays) || lesson.retrieval.afterDays < 1)
    add("retrieval comes on a later day.");
  if (recall && (lesson.retrieval.tempo < recall.tempo.minimum || lesson.retrieval.tempo > recall.tempo.maximum))
    add("the retrieval tempo is outside its score's range.");
  if (!enough(lesson.retrieval.instruction)) add("the retrieval task needs an instruction.");

  const transfer = need(lesson.transfer.scoreId, "the transfer");
  if (!enough(lesson.transfer.instruction)) add("the transfer needs an instruction.");
  if (!lesson.transfer.changed.length) add("the transfer must say what it changes.");
  if (transfer && demonstration) {
    if (transfer.id === demonstration.id) add("the transfer must use a different score from the demonstration.");
    for (const dimension of lesson.transfer.changed)
      if (!differsIn(dimension, demonstration, transfer))
        add(`the transfer claims to change ${dimension} but does not.`);
  }

  if (!enough(lesson.performance.instruction)) add("needs a route into a performance or personal artefact.");
  if (lesson.performance.kind === "piece")
    add("repertoire pieces do not exist yet; route the performance through Create.");

  for (const score of lesson.scores) if (!used.has(score.id)) add(`score ${score.id} is never used.`);
  return errors;
}

/** Across lessons: ids and capability ids must be unique, and one activity has at most one lesson. */
export function validateLessonSet(lessons: readonly Lesson[]): string[] {
  const errors = lessons.flatMap(validateLesson);
  const ids = new Set<string>();
  const activities = new Set<string>();
  const capabilities = new Map<string, string>();
  const scoreIds = new Map<string, string>();
  for (const lesson of lessons) {
    if (ids.has(lesson.id)) errors.push(`${lesson.id}: appears twice.`);
    ids.add(lesson.id);
    const activity = `${lesson.unitId}-${lesson.activityKind}`;
    if (activities.has(activity)) errors.push(`${lesson.id}: ${activity} already has a lesson.`);
    activities.add(activity);
    for (const capability of lesson.capabilities) {
      const owner = capabilities.get(capability.id);
      if (owner && owner !== lesson.id)
        errors.push(`${lesson.id}: capability ${capability.id} is already defined by ${owner}.`);
      capabilities.set(capability.id, lesson.id);
    }
    for (const score of lesson.scores) {
      const owner = scoreIds.get(score.id);
      if (owner && owner !== lesson.id) errors.push(`${lesson.id}: score ${score.id} is already used by ${owner}.`);
      scoreIds.set(score.id, lesson.id);
    }
  }
  return errors;
}
