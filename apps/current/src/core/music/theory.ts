import type {
  Chord,
  ChordQuality,
  FunctionFamily,
  ModeId,
  PitchClass,
  Relationship,
  ScaleTone,
  TonalContext
} from "./types";

export const ROOTS = [
  ["C", 0], ["C#", 1], ["D", 2], ["Eb", 3], ["E", 4], ["F", 5],
  ["F#", 6], ["G", 7], ["Ab", 8], ["A", 9], ["Bb", 10], ["B", 11]
] as const;

export const MODES: Record<ModeId, {
  name: string;
  intervals: readonly number[];
  degrees: readonly string[];
  character: string;
}> = {
  major: {
    name: "Major",
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degrees: ["1", "2", "3", "4", "5", "6", "7"],
    character: "A major tonal centre with clear departure, dominant tension, and return."
  },
  minor: {
    name: "Natural minor",
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degrees: ["1", "2", "b3", "4", "5", "b6", "b7"],
    character: "A minor centre defined by b3, b6, and b7."
  },
  dorian: {
    name: "Dorian",
    intervals: [0, 2, 3, 5, 7, 9, 10],
    degrees: ["1", "2", "b3", "4", "5", "6", "b7"],
    character: "Minor colour with a brighter natural 6."
  },
  mixolydian: {
    name: "Mixolydian",
    intervals: [0, 2, 4, 5, 7, 9, 10],
    degrees: ["1", "2", "3", "4", "5", "6", "b7"],
    character: "Major colour with a relaxed b7 and no leading tone."
  },
  blues: {
    name: "Minor blues",
    intervals: [0, 3, 5, 6, 7, 10],
    degrees: ["1", "b3", "4", "b5", "5", "b7"],
    character: "The minor pentatonic (1, b3, 4, 5, b7) plus the b5 blue note: a six-note expressive collection built around minor colour."
  }
};

const SHARPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLATS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const NATURAL: Record<(typeof LETTERS)[number], number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const INTERVAL_LABELS = ["1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"];
const INTERVAL_NAMES = [
  "unison", "minor second", "major second", "minor third", "major third", "perfect fourth",
  "tritone", "perfect fifth", "minor sixth", "major sixth", "minor seventh", "major seventh"
];

const CHORDS: Record<ChordQuality, { intervals: readonly number[]; labels: readonly string[]; suffix: string }> = {
  major: { intervals: [0, 4, 7], labels: ["1", "3", "5"], suffix: "" },
  minor: { intervals: [0, 3, 7], labels: ["1", "b3", "5"], suffix: "m" },
  diminished: { intervals: [0, 3, 6], labels: ["1", "b3", "b5"], suffix: "dim" },
  dominant7: { intervals: [0, 4, 7, 10], labels: ["1", "3", "5", "b7"], suffix: "7" },
  major7: { intervals: [0, 4, 7, 11], labels: ["1", "3", "5", "7"], suffix: "maj7" },
  minor7: { intervals: [0, 3, 7, 10], labels: ["1", "b3", "5", "b7"], suffix: "m7" },
  "half-diminished7": { intervals: [0, 3, 6, 10], labels: ["1", "b3", "b5", "b7"], suffix: "m7b5" }
};

export function normalize(value: number): PitchClass {
  return ((value % 12) + 12) % 12 as PitchClass;
}

export function noteName(pitchClass: number, preferFlats = false): string {
  return (preferFlats ? FLATS : SHARPS)[normalize(pitchClass)];
}

function spellName(letter: (typeof LETTERS)[number], pitchClass: PitchClass): string {
  const upward = normalize(pitchClass - NATURAL[letter]);
  const accidental = upward > 6 ? upward - 12 : upward;
  return `${letter}${accidental > 0 ? "#".repeat(accidental) : "b".repeat(-accidental)}`;
}

/**
 * Scientific pitch name for a spelled note. The octave number belongs to the
 * letter, so B#3 and Cb4 sound as C4 and B3 — not what floor(midi / 12) gives.
 */
export function pitchWithOctave(name: string, midi: number): string {
  const accidentals = [...name.slice(1)].reduce((sum, mark) => sum + (mark === "#" ? 1 : mark === "b" ? -1 : 0), 0);
  return `${name}${Math.floor((midi - accidentals) / 12) - 1}`;
}

export function intervalLabel(semitones: number): string {
  return INTERVAL_LABELS[normalize(semitones)];
}

export function intervalName(semitones: number): string {
  return INTERVAL_NAMES[normalize(semitones)];
}

export function displayRelationshipLabel(label: string): string {
  return label.replaceAll("b", "♭").replaceAll("#", "♯");
}

export function chordToneDisplayLabel(label: string): string {
  const display = displayRelationshipLabel(label);
  const names: Record<string, string> = {
    "1": "root",
    "2": "2nd",
    "3": "3rd",
    "4": "4th",
    "5": "5th",
    "6": "6th",
    "7": "7th"
  };
  return names[display] ?? display;
}

const TONIC_ALIASES: Record<string, PitchClass> = {
  "C#": 1, "Db": 1,
  "D#": 3, "Eb": 3,
  "F#": 6, "Gb": 6,
  "G#": 8, "Ab": 8,
  "A#": 10, "Bb": 10
};

export function createContext(tonicName = "C", mode: ModeId = "major"): TonalContext {
  const root = ROOTS.find(([name]) => name === tonicName);
  if (root) return { tonicName: root[0], tonic: root[1] as PitchClass, mode };
  const aliased = TONIC_ALIASES[tonicName];
  if (aliased !== undefined) return { tonicName, tonic: aliased, mode };
  return { tonicName: ROOTS[0][0], tonic: ROOTS[0][1] as PitchClass, mode };
}

export function buildScale(context: TonalContext): ScaleTone[] {
  const mode = MODES[context.mode];
  const tonicLetter = LETTERS.indexOf(context.tonicName[0] as (typeof LETTERS)[number]);
  return mode.intervals.map((interval, index) => ({
    pitchClass: normalize(context.tonic + interval),
    name: spellName(
      LETTERS[
        (tonicLetter + Number(mode.degrees[index].match(/\d/)?.[0] ?? index + 1) - 1) %
        LETTERS.length
      ],
      normalize(context.tonic + interval)
    ),
    degree: index + 1,
    degreeLabel: mode.degrees[index],
    interval,
    intervalName: intervalName(interval)
  }));
}

function chordQuality(intervals: readonly number[]): ChordQuality {
  const found = Object.entries(CHORDS).find(([, formula]) =>
    formula.intervals.length === intervals.length &&
    formula.intervals.every((interval, index) => interval === intervals[index])
  );
  if (!found) throw new Error(`Unsupported chord formula: ${intervals.join(",")}`);
  return found[0] as ChordQuality;
}

function romanFor(degreeLabel: string, quality: ChordQuality): string {
  const match = degreeLabel.match(/^([b#]*)(\d)$/);
  const accidental = match?.[1] ?? "";
  const degree = Number(match?.[2] ?? 1);
  const base = ["I", "II", "III", "IV", "V", "VI", "VII"][degree - 1] ?? "I";
  if (quality === "diminished") return `${accidental}${base.toLowerCase()}°`;
  if (quality === "half-diminished7") return `${accidental}${base.toLowerCase()}ø7`;
  if (quality === "minor" || quality === "minor7") return `${accidental}${base.toLowerCase()}${quality === "minor7" ? "7" : ""}`;
  if (quality === "major7") return `${accidental}${base}maj7`;
  if (quality === "dominant7") return `${accidental}${base}7`;
  return `${accidental}${base}`;
}

function functionFor(mode: ModeId, degree: number): {
  family: FunctionFamily;
  label: string;
  explanation: string;
} {
  if (degree === 1) {
    return { family: "tonic", label: "Home", explanation: "Establishes the tonal centre and strongest point of rest." };
  }
  if (mode === "major") {
    if ([2, 4].includes(degree)) {
      return { family: "predominant", label: "Preparation", explanation: "Moves away from home and commonly prepares dominant harmony." };
    }
    if ([5, 7].includes(degree)) {
      return { family: "dominant", label: "Directed tension", explanation: "Contains tendency tones that point strongly back toward tonic." };
    }
    return { family: "tonic-colour", label: "Tonic colour", explanation: "Shares tones with tonic and extends its stable region." };
  }
  if (mode === "minor") {
    const functions = [
      null,
      { family: "predominant", label: "Minor preparation", explanation: "The diminished supertonic can prepare dominant harmony." },
      { family: "tonic-colour", label: "Relative-major colour", explanation: "Shares the natural-minor collection while shifting attention toward b3." },
      { family: "predominant", label: "Minor departure", explanation: "Moves away from tonic without creating a raised leading tone." },
      { family: "modal", label: "Modal dominant", explanation: "Natural minor's v lacks the raised leading tone, so its pull to i is gentler than V-i." },
      { family: "modal", label: "b6 colour", explanation: "Highlights the characteristic lowered sixth of natural minor." },
      { family: "modal", label: "Subtonic return", explanation: "bVII can return modally to i without classical leading-tone resolution." }
    ] as const;
    return functions[degree - 1] ?? { family: "modal", label: "Minor colour", explanation: "Its role depends on the surrounding minor-key motion." };
  }
  if (mode === "dorian") {
    if (degree === 4) return { family: "modal", label: "Characteristic IV", explanation: "Major IV exposes Dorian's natural sixth and confirms the modal colour." };
    if (degree === 7) return { family: "modal", label: "Subtonic return", explanation: "bVII returns to i without a leading tone." };
    return { family: "modal", label: "Dorian colour", explanation: `Expresses degree ${MODES.dorian.degrees[degree - 1]} around a minor home.` };
  }
  if (mode === "mixolydian") {
    if (degree === 7) return { family: "modal", label: "bVII return", explanation: "bVII-I is the characteristic Mixolydian return, distinct from V-I." };
    if (degree === 4) return { family: "predominant", label: "Modal departure", explanation: "IV moves away from I while preserving the Mixolydian collection." };
    return { family: "modal", label: "Mixolydian colour", explanation: `Expresses degree ${MODES.mixolydian.degrees[degree - 1]} without classical leading-tone pull.` };
  }
  return { family: "modal", label: "Blues colour", explanation: "Blues function depends on the I7-IV7-V7 form and phrase placement." };
}

export function buildChords(context: TonalContext, sevenths = false): Chord[] {
  if (context.mode === "blues") {
    const harmonicContext = { ...context, mode: "major" as const };
    return [
      buildChord(harmonicContext, 1, "dominant7", "I7", "Blues tonic"),
      buildChord(harmonicContext, 4, "dominant7", "IV7", "Blues subdominant"),
      buildChord(harmonicContext, 5, "dominant7", "V7", "Blues dominant")
    ].map((chord) => ({
      ...chord,
      id: `${context.tonicName}-blues-${chord.degree}`,
      explanation: `${chord.symbol} uses dominant-seventh colour inside the blues form; its function comes from its position around ${context.tonicName}.`
    }));
  }
  const scale = buildScale(context);
  return scale.map((root, rootIndex) => {
    const toneCount = sevenths ? 4 : 3;
    const chordTones = Array.from({ length: toneCount }, (_, stackIndex) =>
      scale[(rootIndex + stackIndex * 2) % scale.length]
    );
    const intervals = chordTones.map((tone) => normalize(tone.pitchClass - root.pitchClass));
    const quality = chordQuality(intervals);
    const formula = CHORDS[quality];
    const fn = functionFor(context.mode, rootIndex + 1);
    return {
      id: `${context.tonicName}-${context.mode}-${sevenths ? "7" : "3"}-${rootIndex + 1}`,
      degree: rootIndex + 1,
      degreeLabel: root.degreeLabel,
      root: root.pitchClass,
      rootName: root.name,
      quality,
      symbol: `${root.name}${formula.suffix}`,
      roman: romanFor(root.degreeLabel, quality),
      tones: chordTones.map((tone, index) => ({
        pitchClass: tone.pitchClass,
        name: tone.name,
        interval: intervals[index],
        intervalLabel: formula.labels[index] ?? intervalLabel(intervals[index])
      })),
      functionFamily: fn.family,
      functionLabel: fn.label,
      explanation: fn.explanation
    };
  });
}

export function buildChord(
  context: TonalContext,
  degree: number,
  quality: ChordQuality,
  roman?: string,
  label?: string
): Chord {
  const scale = buildScale(context);
  const root = scale[(degree - 1) % scale.length];
  const formula = CHORDS[quality];
  const fn = functionFor(context.mode, degree);
  const rootLetter = LETTERS.indexOf(root.name[0] as (typeof LETTERS)[number]);
  return {
    id: `${context.tonicName}-${context.mode}-${degree}-${quality}`,
    degree,
    degreeLabel: root.degreeLabel,
    root: root.pitchClass,
    rootName: root.name,
    quality,
    symbol: `${root.name}${formula.suffix}`,
    roman: roman ?? romanFor(root.degreeLabel, quality),
    tones: formula.intervals.map((interval, index) => ({
      pitchClass: normalize(root.pitchClass + interval),
      name: spellName(
        LETTERS[(rootLetter + index * 2) % LETTERS.length],
        normalize(root.pitchClass + interval)
      ),
      interval,
      intervalLabel: formula.labels[index]
    })),
    functionFamily: fn.family,
    functionLabel: label ?? fn.label,
    explanation: fn.explanation
  };
}

export function buildChordFromRoot(
  context: TonalContext,
  root: PitchClass,
  quality: ChordQuality,
  roman: string,
  functionLabel: string,
  explanation: string
): Chord {
  const scaleTone = buildScale(context).find((tone) => tone.pitchClass === root);
  const degreeLabel = scaleTone?.degreeLabel ?? intervalLabel(root - context.tonic);
  const degree = scaleTone?.degree ?? Number(degreeLabel.match(/\d/)?.[0] ?? 1);
  const formula = CHORDS[quality];
  const preferFlats = context.tonicName.includes("b") || degreeLabel.includes("b");
  const rootName = scaleTone?.name ?? noteName(root, preferFlats);
  const rootLetter = LETTERS.indexOf(rootName[0] as (typeof LETTERS)[number]);
  return {
    id: `${context.tonicName}-${context.mode}-${roman}-${quality}`,
    degree,
    degreeLabel,
    root,
    rootName,
    quality,
    symbol: `${rootName}${formula.suffix}`,
    roman,
    tones: formula.intervals.map((interval, index) => ({
      pitchClass: normalize(root + interval),
      name: spellName(
        LETTERS[(rootLetter + index * 2) % LETTERS.length],
        normalize(root + interval)
      ),
      interval,
      intervalLabel: formula.labels[index]
    })),
    functionFamily: "modal",
    functionLabel,
    explanation
  };
}

export function analyzeRelationship(context: TonalContext, pitchClass: PitchClass, chord: Chord): Relationship {
  const scaleTone = buildScale(context).find((tone) => tone.pitchClass === pitchClass) ?? null;
  const chordTone = chord.tones.find((tone) => tone.pitchClass === pitchClass) ?? null;
  const interval = normalize(pitchClass - context.tonic);
  const name = scaleTone?.name ?? chordTone?.name ?? noteName(pitchClass, context.tonicName.includes("b"));
  let tendency = "Its movement depends on the current chord and melodic direction.";
  if (chordTone?.intervalLabel === "b7") tendency = "As a chordal seventh, it commonly resolves downward by step.";
  else if (interval === 11) tendency = `As the leading tone, it strongly tends upward to ${context.tonicName}.`;
  else if (interval === 0) tendency = "It is the tonal anchor and strongest point of rest.";
  else if (interval === 5) tendency = "Degree 4 often moves down to 3 or up to 5.";

  const functionText = chordTone
    ? `Inside ${chord.symbol}, ${name} functions as chord tone ${chordTone.intervalLabel}.`
    : `Against ${chord.symbol}, ${name} is a non-chord tone whose meaning depends on its motion.`;
  return {
    pitchClass,
    noteName: name,
    tonicInterval: interval,
    tonicIntervalLabel: intervalLabel(interval),
    tonicIntervalName: intervalName(interval),
    scaleDegree: scaleTone,
    chordTone,
    functionText,
    tendency,
    summary: `${name} is ${intervalLabel(interval)} relative to ${context.tonicName}. ${
      scaleTone ? `It is scale degree ${scaleTone.degreeLabel}.` : "It is outside the active scale."
    } ${functionText}`
  };
}
