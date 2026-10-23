/**
 * FORMAT 1 MATERIAL STILL LOADS.
 *
 * The Unit 1 pilot and the first Phase 6 drafts were written as format 1
 * (`MusicalMaterial`: one line in whole beats) and as a separate chord-draft
 * shape. Both convert to format 2 here without changing a pitch, a position,
 * a count or an id, so records that name them by id and version keep their
 * meaning. Tests compare the converted scores with the re-authored lessons.
 */
import { metreInfo, TICKS_PER_QUARTER } from "../core/score/time";
import { SCORE_FORMAT, type Provenance, type Score, type ScoreEvent, type StringNumber } from "../core/score/types";
import type { DraftChordStudy } from "./phase6Drafts";
import { AGENT_DRAFTED } from "./provenance";
import type { MusicalMaterial } from "./structuredMusic";

function ticks(beats: number, what: string): number {
  const value = beats * TICKS_PER_QUARTER;
  if (!Number.isInteger(value)) throw new Error(`${what} is not on the format 2 grid.`);
  return value;
}

function provenanceOf(review: MusicalMaterial["review"]): Provenance {
  return review.status === "draft"
    ? { author: AGENT_DRAFTED, reviewer: "", reviewStatus: "draft", reviewedAt: null }
    : { author: AGENT_DRAFTED, reviewer: review.reviewer, reviewStatus: "reviewed", reviewedAt: review.reviewedAt };
}

export function upgradeMaterial(material: MusicalMaterial): Score {
  const events: ScoreEvent[] = material.events.map((event) =>
    event.kind === "rest"
      ? {
          id: event.id,
          voice: "line",
          kind: "rest",
          at: ticks(event.atBeat, event.id),
          dur: ticks(event.beats, event.id),
        }
      : {
          id: event.id,
          voice: "line",
          kind: "note",
          at: ticks(event.atBeat, event.id),
          dur: ticks(event.beats, event.id),
          notes: [{ string: event.position.string as StringNumber, fret: event.position.fret, spell: event.spelling }],
          ...(event.articulation === "short" ? { art: { staccato: true } } : {}),
        },
  );
  return {
    format: SCORE_FORMAT,
    id: material.id,
    version: material.version,
    title: material.title,
    provenance: provenanceOf(material.review),
    tuning: "standard",
    key: { tonic: material.tonalCenter.name, mode: "major" },
    metre: "4/4",
    feel: "straight",
    bars: material.bars,
    tempo: { ...material.tempo },
    voices: [{ id: "line", label: "Line" }],
    voicings: [],
    sections: material.sections.map((section) => ({
      id: section.id,
      label: section.label,
      from: ticks(section.fromBeat, section.id),
      to: ticks(section.toBeat, section.id),
    })),
    events,
    ...(material.derivedFrom
      ? {
          derivedFrom: {
            id: material.derivedFrom.id,
            version: material.derivedFrom.version,
            changed: [material.derivedFrom.changedDimension],
          },
        }
      : {}),
  };
}

/** The chord draft carries a study and a two-count variation; each becomes its own score. */
export function upgradeChordDraft(study: DraftChordStudy, version: "study" | "two-count"): Score {
  const beatTicks = metreInfo("4/4").beatTicks;
  const events = version === "study" ? study.events : study.variation;
  return {
    format: SCORE_FORMAT,
    id: version === "study" ? study.id : `${study.id}-two-count`,
    version: study.version,
    title: version === "study" ? "Four counts each" : "Two counts each",
    provenance: provenanceOf(study.review),
    tuning: "standard",
    key: { tonic: study.tonalCenter.name, mode: study.tonalCenter.mode },
    metre: "4/4",
    feel: "straight",
    bars: study.bars,
    tempo: { ...study.tempo },
    voices: [{ id: "chords", label: "Chords" }],
    voicings: study.voicings.map((voicing) => ({
      id: voicing.id,
      symbol: voicing.id,
      frets: ([6, 5, 4, 3, 2, 1] as const).map(
        (string) => voicing.positions.find((position) => position.string === string)?.fret ?? null,
      ),
    })),
    sections: [{ id: "whole", label: "Whole study", from: 0, to: study.bars * 4 * beatTicks }],
    events: events.map((event) => ({
      id: event.id,
      voice: "chords",
      kind: "strum",
      at: event.atBeat * beatTicks,
      dur: event.beats * beatTicks,
      chord: event.chordId,
      direction: "down",
    })),
    ...(version === "two-count" ? { derivedFrom: { id: study.id, version: study.version, changed: ["rhythm"] } } : {}),
  };
}
