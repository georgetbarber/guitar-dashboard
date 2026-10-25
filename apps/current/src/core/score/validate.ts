/**
 * WHAT A SCORE MUST GET RIGHT BEFORE ANYONE HEARS OR READS IT.
 *
 * Structure (every voice fills every bar exactly), theory (spellings, degree
 * labels, chord symbols against the frets), technique notation (a hammer-on
 * needs a lower note on the same string first) and physical simultaneity (one
 * string cannot sound two notes) are all checked here. Playability heuristics
 * live in playability.ts. A score with any problem is not shippable content.
 */
import { analyseVoicing, parseChordSymbol } from "../music/chordSymbols";
import { buildScale, createContext, intervalLabel, MODES, normalize, spelledPitchClass } from "../music/theory";
import type { ModeId } from "../music/types";
import { FEELS, metreInfo, METRE_IDS, FEEL_IDS } from "./time";
import type { Fretted, NoteEvent, Score, ScoreEvent, ScoreProblem, StringNumber, StrumEvent, Voicing } from "./types";

export const STANDARD_OPEN_MIDI: Readonly<Record<StringNumber, number>> = { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 };
export const MAX_FRET = 22;

export function positionMidi(position: Pick<Fretted, "string" | "fret">): number {
  return STANDARD_OPEN_MIDI[position.string] + position.fret;
}

export function totalTicks(score: Pick<Score, "bars" | "metre">): number {
  return score.bars * metreInfo(score.metre).ticksPerBar;
}

/** Sounding positions of a voicing, low string first. */
export function voicingPositions(voicing: Voicing): Fretted[] {
  return voicing.frets
    .map((fret, index) => ({ string: (6 - index) as StringNumber, fret }))
    .filter((position): position is Fretted => position.fret !== null);
}

/** The strings an event uses, whether it sounds a pitch or is a dead scratch. */
export function eventStrings(event: ScoreEvent, score: Pick<Score, "voicings">): StringNumber[] {
  if (event.kind === "rest") return [];
  if (event.kind === "note") return event.notes.map((note) => note.string);
  const range = event.strings ?? { from: 1 as StringNumber, to: 6 as StringNumber };
  const inRange = (string: number) => string >= range.from && string <= range.to;
  const voicing = event.chord ? score.voicings.find((item) => item.id === event.chord) : undefined;
  if (!voicing) return ([1, 2, 3, 4, 5, 6] as StringNumber[]).filter(inRange);
  return voicingPositions(voicing)
    .map((position) => position.string)
    .filter(inRange);
}

/** Fretted positions a strum sounds, low string first. Dead scratches sound none. */
export function strumPositions(event: StrumEvent, score: Pick<Score, "voicings">): Fretted[] {
  if (event.art?.dead || !event.chord) return [];
  const voicing = score.voicings.find((item) => item.id === event.chord);
  if (!voicing) return [];
  const strings = new Set(eventStrings(event, score));
  return voicingPositions(voicing).filter((position) => strings.has(position.string));
}

/** The spelling a note is shown with: its own, or the key's for a diatonic pitch. */
export function noteSpelling(note: Fretted, key: Score["key"]): string | null {
  if (note.spell) return note.spell;
  const pitch = normalize(positionMidi(note));
  return buildScale(createContext(key.tonic, key.mode)).find((tone) => tone.pitchClass === pitch)?.name ?? null;
}

/** Degree label of a pitch relative to the key's tonic: the mode's own label if diatonic. */
export function degreeLabel(midi: number, key: Score["key"]): string {
  const context = createContext(key.tonic, key.mode);
  const pitch = normalize(midi);
  return (
    buildScale(context).find((tone) => tone.pitchClass === pitch)?.degreeLabel ?? intervalLabel(pitch - context.tonic)
  );
}

const ID = /^[a-z0-9][a-z0-9-]{1,79}$/;

export function validateScore(score: Score): ScoreProblem[] {
  const problems: ScoreProblem[] = [];
  const add = (code: string, message: string, eventId?: string) =>
    problems.push({ code, message, ...(eventId ? { eventId } : {}) });

  // Header
  if (score.format !== 2) add("format", "Score format must be 2.");
  if (!ID.test(score.id)) add("id", `Score id "${score.id}" must be lower-case letters, digits and hyphens.`);
  if (!Number.isInteger(score.version) || score.version < 1)
    add("version", "Score version must be a positive integer.");
  if (!score.title.trim()) add("title", "Score needs a title.");
  const provenance = score.provenance;
  if (!provenance?.author?.trim()) add("provenance", "Score provenance needs an author.");
  else if (provenance.reviewStatus === "draft" && (provenance.reviewer || provenance.reviewedAt))
    add("provenance", "A draft cannot name a reviewer or review date.");
  else if (
    provenance.reviewStatus !== "draft" &&
    (!provenance.reviewer.trim() || !Number.isFinite(Date.parse(provenance.reviewedAt ?? "")))
  )
    add("provenance", "Reviewed content needs a named reviewer and a review date.");
  if (score.tuning !== "standard") add("tuning", "Only standard tuning is supported.");
  if (spelledPitchClass(score.key.tonic) === null || !(score.key.mode in MODES))
    add("key", `Unknown key ${score.key.tonic} ${score.key.mode}.`);
  if (!METRE_IDS.includes(score.metre)) {
    add("metre", `Unsupported metre ${score.metre}.`);
    return problems;
  }
  if (!FEEL_IDS.includes(score.feel)) add("feel", `Unknown feel ${score.feel}.`);
  else if (FEELS[score.feel].unit !== null && metreInfo(score.metre).compound)
    add("feel", "Swing and shuffle feels apply to simple metres; write compound time directly.");
  if (!Number.isInteger(score.bars) || score.bars < 1 || score.bars > 32) add("bars", "A score has 1 to 32 bars.");
  const { minimum, default: standard, maximum } = score.tempo;
  if (
    ![minimum, standard, maximum].every(Number.isInteger) ||
    !(minimum >= 30 && minimum <= standard && standard <= maximum && maximum <= 240)
  )
    add("tempo", "Tempo range must be whole BPM with 30 ≤ minimum ≤ default ≤ maximum ≤ 240.");

  const info = metreInfo(score.metre);
  const total = totalTicks(score);

  // Voices
  const voiceIds = new Set<string>();
  for (const voice of score.voices) {
    if (!voice.id || voiceIds.has(voice.id)) add("voice", `Duplicate or empty voice id "${voice.id}".`);
    if (!voice.label.trim()) add("voice", `Voice "${voice.id}" needs a label.`);
    voiceIds.add(voice.id);
  }
  if (!score.voices.length) add("voice", "A score needs at least one voice.");

  // Voicings
  const voicings = new Map<string, Voicing>();
  for (const voicing of score.voicings) {
    if (!voicing.id || voicings.has(voicing.id)) add("voicing", `Duplicate or empty voicing id "${voicing.id}".`);
    voicings.set(voicing.id, voicing);
    problems.push(
      ...voicingProblems(voicing).map((message) => ({ code: "voicing", message: `${voicing.id}: ${message}` })),
    );
  }

  // Events: identity, timing, tiling
  const eventIds = new Set<string>();
  const byVoice = new Map<string, ScoreEvent[]>();
  for (const event of score.events) {
    if (!event.id || eventIds.has(event.id)) add("event", `Duplicate or empty event id "${event.id}".`, event.id);
    eventIds.add(event.id);
    if (!voiceIds.has(event.voice)) add("event", `Event ${event.id} names unknown voice "${event.voice}".`, event.id);
    if (!Number.isInteger(event.at) || !Number.isInteger(event.dur) || event.at < 0 || event.dur <= 0)
      add("timing", `Event ${event.id} needs a whole-tick start and a positive length.`, event.id);
    else if (event.at % 4 !== 0 || event.dur % 4 !== 0)
      add("timing", `Event ${event.id} is finer than a sixteenth-note triplet.`, event.id);
    else if (Math.floor(event.at / info.ticksPerBar) !== Math.floor((event.at + event.dur - 1) / info.ticksPerBar))
      add("timing", `Event ${event.id} crosses a bar line; split it and tie the second part.`, event.id);
    byVoice.set(event.voice, [...(byVoice.get(event.voice) ?? []), event]);
  }
  for (const voice of score.voices) {
    const events = [...(byVoice.get(voice.id) ?? [])].sort((a, b) => a.at - b.at);
    let next = 0;
    for (const event of events) {
      if (event.at !== next) add("tiling", `Voice "${voice.id}" has a gap or overlap at ${event.id}.`, event.id);
      next = event.at + event.dur;
    }
    if (next !== total) add("tiling", `Voice "${voice.id}" ends at tick ${next}, expected ${total}.`);
    // A beat is either divided in twos or in threes, never both in one voice.
    const beats = new Map<number, number[]>();
    for (const event of events) {
      const beat = Math.floor(event.at / info.beatTicks);
      beats.set(beat, [...(beats.get(beat) ?? []), event.at % info.beatTicks, (event.at + event.dur) % info.beatTicks]);
    }
    for (const [beat, offsets] of beats) {
      const duple = offsets.every((offset) => offset % 12 === 0);
      const triple = offsets.every((offset) => offset % 8 === 0);
      if (!duple && !triple)
        add(
          "rhythm",
          `Voice "${voice.id}" mixes duplets and triplets inside beat ${(beat % info.beatsPerBar) + 1} of bar ${Math.floor(beat / info.beatsPerBar) + 1}.`,
        );
    }
    for (const [index, event] of events.entries())
      problems.push(...eventProblems(event, events[index - 1], score, voicings));
  }

  // One string cannot sound two notes at once, whichever voices ask for it.
  const sounding = score.events.filter((event) => event.kind !== "rest");
  for (let a = 0; a < sounding.length; a++)
    for (let b = a + 1; b < sounding.length; b++) {
      const first = sounding[a];
      const second = sounding[b];
      if (first.voice === second.voice) continue;
      if (first.at >= second.at + second.dur || second.at >= first.at + first.dur) continue;
      const shared = eventStrings(first, score).filter((string) => eventStrings(second, score).includes(string));
      if (shared.length)
        add(
          "string-clash",
          `String ${shared[0]} is needed by ${first.id} and ${second.id} at the same time.`,
          second.id,
        );
    }

  // Sections
  let sectionNext = 0;
  const sectionIds = new Set<string>();
  for (const section of score.sections) {
    if (!section.id || sectionIds.has(section.id)) add("section", `Duplicate or empty section id "${section.id}".`);
    sectionIds.add(section.id);
    if (!section.label.trim()) add("section", `Section "${section.id}" needs a label.`);
    if (section.from !== sectionNext || section.to <= section.from || section.to > total)
      add("section", `Sections do not join at "${section.id}".`);
    if (section.from % info.beatTicks !== 0 || section.to % info.beatTicks !== 0)
      add("section", `Section "${section.id}" must start and end on a beat.`);
    sectionNext = section.to;
  }
  if (sectionNext !== total) add("section", "Sections do not cover the whole score.");

  // Harmony
  let lastMark = -1;
  for (const mark of score.harmony ?? []) {
    if (!parseChordSymbol(mark.symbol)) add("harmony", `Unknown chord symbol "${mark.symbol}" in the harmony line.`);
    if (mark.at <= lastMark || mark.at < 0 || mark.at >= total)
      add("harmony", `Harmony change at tick ${mark.at} is out of order.`);
    lastMark = mark.at;
  }
  if (score.harmony?.length && score.harmony[0].at !== 0)
    add("harmony", "The harmony line must start at the beginning.");

  // Voicings must be played; exceptions must be specific and explained.
  for (const voicing of score.voicings)
    if (!score.events.some((event) => event.kind === "strum" && event.chord === voicing.id))
      add("voicing", `${voicing.id}: declared but never played.`);
  if (
    score.derivedFrom &&
    (!ID.test(score.derivedFrom.id) || score.derivedFrom.version < 1 || !score.derivedFrom.changed.length)
  )
    add("derived", "A derived score names its original, version and what changed.");
  for (const exception of score.exceptions ?? []) {
    if (exception.reason.trim().length < 12)
      add("exception", `The ${exception.rule} exception needs a teaching reason.`);
    for (const id of exception.events ?? [])
      if (!eventIds.has(id)) add("exception", `The ${exception.rule} exception names unknown event ${id}.`);
  }
  return problems;
}

export function scoreErrors(score: Score): string[] {
  return validateScore(score).map((problem) => `${score.id}: ${problem.message}`);
}

function voicingProblems(voicing: Voicing): string[] {
  const problems: string[] = [];
  if (voicing.frets.length !== 6) return ["needs six strings, low E to high E."];
  if (voicing.frets.some((fret) => fret !== null && (!Number.isInteger(fret) || fret < 0 || fret > MAX_FRET)))
    problems.push("has an invalid fret.");
  const positions = voicingPositions(voicing);
  if (positions.length < 2) problems.push("sounds fewer than two strings.");
  const parsed = parseChordSymbol(voicing.symbol);
  if (!parsed) return [...problems, `unknown chord symbol "${voicing.symbol}".`];
  const midis = positions.map(positionMidi);
  const analysis = analyseVoicing(parsed, midis);
  if (analysis.foreign.length) problems.push(`sounds notes that are not in ${voicing.symbol}.`);
  if (analysis.missing.length)
    problems.push(`leaves out ${analysis.missing.map((tone) => tone.label).join(", ")} of ${voicing.symbol}.`);
  if (parsed.bassPitchClass !== null) {
    if (normalize(Math.min(...midis)) !== parsed.bassPitchClass)
      problems.push(`the lowest note is not the slash bass.`);
  } else {
    const expected =
      analysis.bassLabel === "1"
        ? undefined
        : analysis.bassLabel === "3" || analysis.bassLabel === "b3"
          ? "first"
          : analysis.bassLabel === "5" || analysis.bassLabel === "b5" || analysis.bassLabel === "#5"
            ? "second"
            : "third";
    if (voicing.inversion !== expected)
      problems.push(
        expected
          ? `the bass is the ${analysis.bassLabel}, so the voicing must be declared a ${expected} inversion.`
          : "is declared an inversion but has the root in the bass.",
      );
  }
  if (voicing.fingers) {
    if (voicing.fingers.length !== 6) problems.push("fingering must name six strings.");
    else
      voicing.frets.forEach((fret, index) => {
        const finger = voicing.fingers![index];
        if ((fret === null || fret === 0) && finger !== null)
          problems.push(`string ${6 - index} has a finger but no fret.`);
        if (fret !== null && fret > 0 && finger === null)
          problems.push(`string ${6 - index} is fretted with no finger.`);
      });
  }
  if (voicing.barre) {
    const { fret, from, to, finger } = voicing.barre;
    const covered = positions.filter((position) => position.string >= from && position.string <= to);
    if (fret < 1 || from >= to || ![1, 2, 3, 4].includes(finger)) problems.push("has an invalid barre.");
    if (covered.some((position) => position.fret < fret)) problems.push("frets a note behind its barre.");
    if (covered.filter((position) => position.fret === fret).length < 2)
      problems.push("barre presses fewer than two strings.");
  }
  return problems;
}

function eventProblems(
  event: ScoreEvent,
  previous: ScoreEvent | undefined,
  score: Score,
  voicings: Map<string, Voicing>,
): ScoreProblem[] {
  const problems: ScoreProblem[] = [];
  const add = (code: string, message: string) => problems.push({ code, message, eventId: event.id });
  if (event.kind === "rest") return problems;
  const art = event.art ?? {};
  if (art.accent && art.ghost) add("articulation", `${event.id} cannot be both accented and ghosted.`);
  if (art.palmMute && art.letRing) add("articulation", `${event.id} cannot be palm-muted and let ring.`);
  if (art.staccato && art.letRing) add("articulation", `${event.id} cannot be staccato and let ring.`);
  if (art.dead && (art.bend || art.vibrato || art.legato || art.slideIn))
    add("articulation", `${event.id} is a dead note; it cannot bend, slide or sustain a pitch.`);
  if (event.offsetMs !== undefined && (!Number.isInteger(event.offsetMs) || Math.abs(event.offsetMs) > 40))
    add("timing", `${event.id} may be placed at most 40 ms early or late.`);

  const contiguous = previous && previous.kind !== "rest" && previous.at + previous.dur === event.at;
  if (art.tie) {
    if (!contiguous) add("tie", `${event.id} is tied, but nothing sounds just before it in this voice.`);
    else if (previous.kind !== event.kind) add("tie", `${event.id} ties to a different kind of event.`);
    else if (
      event.kind === "note" &&
      previous.kind === "note" &&
      (event.notes.length !== previous.notes.length ||
        event.notes.some((note) => !previous.notes.some((p) => p.string === note.string && p.fret === note.fret)))
    )
      add("tie", `${event.id} is tied but changes its notes.`);
    else if (event.kind === "strum" && previous.kind === "strum" && event.chord !== previous.chord)
      add("tie", `${event.id} is tied but changes chord.`);
    if (art.legato || art.slideIn || art.accent || art.ghost || art.dead)
      add("tie", `${event.id} is tied, so it has no attack to articulate.`);
  }

  if (event.kind === "strum") {
    if (!event.chord && !art.dead) add("strum", `${event.id} strums no chord.`);
    if (event.chord && !voicings.has(event.chord)) add("strum", `${event.id} strums unknown voicing "${event.chord}".`);
    if (event.strings && (event.strings.from > event.strings.to || event.strings.from < 1 || event.strings.to > 6))
      add("strum", `${event.id} has an invalid string range.`);
    if (event.chord && voicings.has(event.chord) && !art.dead && !strumPositions(event, score).length)
      add("strum", `${event.id}'s string range sounds none of ${event.chord}.`);
    if (art.legato || art.bend || art.slideIn)
      add("articulation", `${event.id}: legato, bends and slides belong on notes.`);
    return problems;
  }

  const note = event as NoteEvent;
  const strings = note.notes.map((item) => item.string);
  if (!note.notes.length || note.notes.length > 6 || new Set(strings).size !== strings.length)
    add("note", `${event.id} needs one to six notes on different strings.`);
  for (const position of note.notes) {
    if (
      !Number.isInteger(position.fret) ||
      position.fret < 0 ||
      position.fret > MAX_FRET ||
      ![1, 2, 3, 4, 5, 6].includes(position.string)
    ) {
      add("note", `${event.id} has an unplayable position.`);
      continue;
    }
    if (position.fret === 0 && position.finger) add("note", `${event.id}: an open string takes no fretting finger.`);
    const midi = positionMidi(position);
    const keyName = noteSpelling({ ...position, spell: undefined }, score.key);
    if (position.spell !== undefined && spelledPitchClass(position.spell) !== normalize(midi))
      add(
        "spelling",
        `${event.id}: ${position.spell} is not the pitch at string ${position.string} fret ${position.fret}.`,
      );
    else if (position.spell !== undefined && keyName !== null && keyName !== position.spell)
      add(
        "spelling",
        `${event.id}: in ${score.key.tonic} ${score.key.mode} this pitch is spelled ${keyName}, not ${position.spell}.`,
      );
    if (!art.dead && noteSpelling(position, score.key) === null)
      add(
        "spelling",
        `${event.id}: string ${position.string} fret ${position.fret} is outside ${score.key.tonic} ${score.key.mode}; give it a spelling.`,
      );
    if (position.degree !== undefined && position.degree !== degreeLabel(midi, score.key))
      add(
        "degree",
        `${event.id}: string ${position.string} fret ${position.fret} is ${degreeLabel(midi, score.key)}, not ${position.degree}.`,
      );
  }
  if (art.legato) {
    const before = contiguous && previous.kind === "note" ? previous.notes : [];
    for (const position of note.notes) {
      const from = before.find((item) => item.string === position.string);
      if (!from) add("legato", `${event.id}: a ${art.legato} needs the previous note on the same string.`);
      else if (art.legato === "hammer-on" && position.fret <= from.fret)
        add("legato", `${event.id}: a hammer-on must go to a higher fret.`);
      else if (art.legato === "pull-off" && position.fret >= from.fret)
        add("legato", `${event.id}: a pull-off must go to a lower fret.`);
      else if (art.legato === "slide" && (position.fret === from.fret || position.fret === 0 || from.fret === 0))
        add("legato", `${event.id}: a slide moves between two different fretted notes.`);
    }
  }
  if (
    art.slideIn &&
    note.notes.some((position) => (art.slideIn === "below" ? position.fret < 2 : position.fret > MAX_FRET - 2))
  )
    add("articulation", `${event.id}: there is no room to slide in from ${art.slideIn}.`);
  if (art.bend && (note.notes.length !== 1 || note.notes[0].fret < 1))
    add("articulation", `${event.id}: bends are written on one fretted note.`);
  if (art.vibrato && note.notes.some((position) => position.fret < 1))
    add("articulation", `${event.id}: vibrato needs a fretted note; an open string cannot be shaken.`);
  return problems;
}

/** Exposed for the lesson validator: which mode names exist. */
export const MODE_IDS = Object.keys(MODES) as ModeId[];
