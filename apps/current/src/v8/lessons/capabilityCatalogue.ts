/**
 * THE CAPABILITY CATALOGUE FOR THE WHOLE COURSE.
 *
 * Copied from docs/CURRICULUM_MAP.md §11, which tests/curriculumMap.test.ts
 * keeps identical. Every lesson may use only its own unit's capabilities and
 * every capstone only its own, so ids stay stable and meaningful. Once a lesson
 * using an id has shipped, the id is never renamed or reused (map §4).
 *
 * Imported by the lesson validator only, so it travels in the lesson packs.
 */
import type { CapabilityAction } from "../capabilities";

export interface CatalogueEntry {
  id: string;
  action: CapabilityAction;
}

/** Unit order → its capabilities. */
export const UNIT_CAPABILITIES: Readonly<Record<number, readonly CatalogueEntry[]>> = {
  1: [
    { id: "pilot.listen.question-answer", action: "listening" },
    { id: "pilot.name.attack-rest", action: "naming" },
    { id: "pilot.locate.open-high-e", action: "locating" },
    { id: "pulse.quarter-note.steady", action: "timing" },
    { id: "sound.release.to-rest", action: "playing" },
    { id: "phrase.question-answer.one-note", action: "playing" },
  ],
  2: [
    { id: "ear.sustain.compare", action: "listening" },
    { id: "sound.release.choose", action: "playing" },
    { id: "sound.palm-mute.chug", action: "playing" },
  ],
  3: [
    { id: "pulse.backbeat.accent", action: "timing" },
    { id: "fingerstyle.thumb.root-pulse", action: "playing" },
    { id: "fretboard.roots.g-em-c-d.locate", action: "locating" },
  ],
  4: [
    { id: "rhythm.eighths.count", action: "timing" },
    { id: "strum.constant-motion", action: "playing" },
    { id: "strum.scratch.mute", action: "playing" },
  ],
  5: [
    { id: "ear.rest-pattern.recognise", action: "listening" },
    { id: "rhythm.rest.place", action: "timing" },
    { id: "sound.stab.staccato", action: "playing" },
  ],
  6: [
    { id: "harmony.common-tone.hear", action: "listening" },
    { id: "chord.c-am.change", action: "playing" },
    { id: "rhythm.chord-change.pulse", action: "timing" },
  ],
  7: [
    { id: "fretboard.open-strings.locate", action: "locating" },
    { id: "ear.unison.beating", action: "listening" },
    { id: "tune.fifth-fret.unison", action: "playing" },
  ],
  8: [
    { id: "fretboard.octave.locate", action: "locating" },
    { id: "ear.octave.same-name", action: "listening" },
    { id: "play.octaves.muted-string", action: "playing" },
  ],
  9: [
    { id: "fretboard.root-fifth.locate", action: "locating" },
    { id: "ear.fifth.hear", action: "listening" },
    { id: "chord.power.change", action: "playing" },
  ],
  10: [
    { id: "ear.third.compare", action: "listening" },
    { id: "interval.third.locate", action: "locating" },
    { id: "fretboard.one-string.locate", action: "locating" },
  ],
  11: [
    { id: "fretboard.gb-boundary.adjust", action: "locating" },
    { id: "play.double-stop.thirds", action: "playing" },
    { id: "play.sixths.string-skip", action: "playing" },
  ],
  12: [
    { id: "fretboard.transpose.new-root", action: "locating" },
    { id: "ear.same-riff.new-key", action: "listening" },
    { id: "play.riff.transposed", action: "playing" },
  ],
  13: [
    { id: "ear.tonic.return", action: "listening" },
    { id: "degree.home-away.name", action: "naming" },
    { id: "play.melody.over-drone", action: "playing" },
  ],
  14: [
    { id: "fretboard.major-pentatonic.locate", action: "locating" },
    { id: "degree.character.name", action: "naming" },
    { id: "ear.degree.identify", action: "listening" },
  ],
  15: [
    { id: "phrase.motif.play", action: "playing" },
    { id: "rhythm.motif.identity", action: "timing" },
    { id: "ear.motif.variation", action: "listening" },
  ],
  16: [
    { id: "ear.ending.settled-open", action: "listening" },
    { id: "degree.landing.name", action: "naming" },
    { id: "phrase.target.degree", action: "playing" },
    { id: "chord.g-c-d.strum", action: "playing" },
  ],
  17: [
    { id: "fretboard.minor-pentatonic.open-e", action: "locating" },
    { id: "ear.call.imitate", action: "listening" },
    { id: "phrase.answer.play", action: "playing" },
    { id: "play.minor-third.curl", action: "playing" },
  ],
  18: [
    { id: "ear.melody.find", action: "listening" },
    { id: "fretboard.melody.by-ear", action: "locating" },
    { id: "rhythm.waltz.three", action: "timing" },
  ],
  19: [
    { id: "chord.triad.top-strings", action: "locating" },
    { id: "chord-tone.role.name", action: "naming" },
    { id: "ear.triad.major-minor", action: "listening" },
    { id: "play.triad.hammer-on", action: "playing" },
  ],
  20: [
    { id: "chord.inversion.locate", action: "locating" },
    { id: "chord.inversion.nearest", action: "playing" },
    { id: "ear.top-note.compare", action: "listening" },
  ],
  21: [
    { id: "ear.held-tone.hear", action: "listening" },
    { id: "fingerstyle.waltz-arpeggio", action: "playing" },
    { id: "harmony.common-tone.hold", action: "playing" },
  ],
  22: [
    { id: "ear.bass-melody.separate", action: "listening" },
    { id: "fingerstyle.alternating-bass", action: "playing" },
    { id: "fingerstyle.pinch", action: "playing" },
  ],
  23: [
    { id: "play.sixths.slide-target", action: "playing" },
    { id: "chord-tone.landing.name", action: "naming" },
    { id: "ear.landing.consonant", action: "listening" },
  ],
  24: [
    { id: "harmony.melody-in-chord.name", action: "naming" },
    { id: "ear.harmony.supports", action: "listening" },
    { id: "play.melody-with-triads", action: "playing" },
  ],
  25: [
    { id: "play.riff.pentatonic", action: "playing" },
    { id: "play.legato.hammer-pull", action: "playing" },
    { id: "rhythm.riff.lock", action: "timing" },
  ],
  26: [
    { id: "strum.sixteenths.constant", action: "playing" },
    { id: "rhythm.sixteenth.syncopation", action: "timing" },
    { id: "sound.accent-ghost", action: "playing" },
  ],
  27: [
    { id: "play.bend.to-target", action: "playing" },
    { id: "ear.bend.in-tune", action: "listening" },
    { id: "play.vibrato.steady", action: "playing" },
    { id: "sound.legato-staccato.contrast", action: "playing" },
  ],
  28: [
    { id: "phrase.riff.develop", action: "playing" },
    { id: "ear.variation.identity", action: "listening" },
    { id: "rhythm.displacement", action: "timing" },
  ],
  29: [
    { id: "rhythm.shuffle.triplet", action: "timing" },
    { id: "ear.twelve-bar.place", action: "listening" },
    { id: "play.improvise.constraint", action: "playing" },
    { id: "play.boogie.shuffle", action: "playing" },
  ],
  30: [
    { id: "ear.feel.identify", action: "listening" },
    { id: "feel.difference.name", action: "naming" },
    { id: "rhythm.feel.switch", action: "timing" },
  ],
  31: [
    { id: "ear.function.hear", action: "listening" },
    { id: "harmony.roman.i-iv-v.name", action: "naming" },
    { id: "play.bass-walk.connect", action: "playing" },
  ],
  32: [
    { id: "chord.barre.e-shape", action: "playing" },
    { id: "chord.barre.a-shape", action: "playing" },
    { id: "ear.loop.start-point", action: "listening" },
  ],
  33: [
    { id: "chord.dominant7.open", action: "playing" },
    { id: "ear.major-minor-blues.hear", action: "listening" },
    { id: "play.pentatonic.major-over-i7", action: "playing" },
  ],
  34: [
    { id: "ear.mode.characteristic", action: "listening" },
    { id: "mode.degree.name", action: "naming" },
    { id: "play.modal-vamp", action: "playing" },
  ],
  35: [
    { id: "ear.borrowed-iv.hear", action: "listening" },
    { id: "harmony.changing-note.name", action: "naming" },
    { id: "chord.f-fm.small-shape", action: "playing" },
  ],
  36: [
    { id: "play.chromatic-approach.slide", action: "playing" },
    { id: "ear.approach.resolve", action: "listening" },
    { id: "phrase.passing-tone", action: "playing" },
  ],
  37: [
    { id: "ear.harmonic-rhythm.pace", action: "listening" },
    { id: "harmonic-rhythm.name", action: "naming" },
    { id: "rhythm.chord-rate.change", action: "timing" },
  ],
  38: [
    { id: "ear.tension.curve", action: "listening" },
    { id: "play.tension.build-release", action: "playing" },
    { id: "rhythm.stop-time", action: "timing" },
  ],
  39: [
    { id: "ear.motif-family.identity", action: "listening" },
    { id: "phrase.motif.develop", action: "playing" },
    { id: "form.repetition.name", action: "naming" },
  ],
  40: [
    { id: "form.sections.contrast.name", action: "naming" },
    { id: "fingerstyle.dsus-hammer-pull", action: "playing" },
    { id: "ear.section.contrast", action: "listening" },
  ],
  41: [
    { id: "ear.bass-line.reframe", action: "listening" },
    { id: "fingerstyle.thumb.bass-line", action: "playing" },
    { id: "harmony.slash-chord.name", action: "naming" },
  ],
  42: [
    { id: "ear.texture.register", action: "listening" },
    { id: "play.part.fill-vs-rhythm", action: "playing" },
    { id: "arrangement.choice.name", action: "naming" },
  ],
  43: [
    { id: "ear.rhythm-first.transcribe", action: "listening" },
    { id: "fretboard.phrase.by-ear", action: "locating" },
    { id: "fingerprint.name", action: "naming" },
  ],
  44: [
    { id: "ear.transformation.identity", action: "listening" },
    { id: "play.transformed-phrase", action: "playing" },
    { id: "transformation.dimension.name", action: "naming" },
  ],
  45: [
    { id: "harmony.reharmonise.name", action: "naming" },
    { id: "ear.reharmonisation.compare", action: "listening" },
    { id: "play.reharmonised-melody", action: "playing" },
  ],
  46: [
    { id: "ear.before-after.compare", action: "listening" },
    { id: "revision.change.name", action: "naming" },
    { id: "play.revised-take", action: "playing" },
  ],
  47: [
    { id: "play.original.complete", action: "playing" },
    { id: "form.original.name", action: "naming" },
    { id: "rhythm.original.steady", action: "timing" },
  ],
  48: [
    { id: "ear.self-evidence.review", action: "listening" },
    { id: "plan.next-cycle.name", action: "naming" },
    { id: "play.favourite.revisit", action: "playing" },
  ],
};

/** One playing capability per stage capstone, stage 1 first. */
export const CAPSTONE_CAPABILITIES: readonly string[] = [
  "piece.front-step.one-finger",
  "piece.low-road.riff",
  "piece.lantern.melody",
  "piece.porch-light.travis",
  "piece.night-market.groove",
  "piece.front-step.full",
  "piece.tide-table.own",
  "piece.own-tune.finish",
];
