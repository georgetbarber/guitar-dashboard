import { buildChords, buildScale, createContext } from "../core/music/theory";
import { CURRICULUM } from "./curriculum";
import type { FreePlayPreview, V8State } from "./types";

export type FreePlayMode = "chord" | "riff" | "degree" | "groove";

export interface FreePlayPrompt {
  id: string;
  mode: FreePlayMode;
  title: string;
  instruction: string;
  relationship: string;
  hint: string;
  displayTokens: string[];
  physicalCue: string;
  variation: string;
  stretch: boolean;
  preview: FreePlayPreview;
}

export type FreePlayFocus = FreePlayMode | "mix";

export const FREE_PLAY_MODE_INFO: Record<FreePlayMode, { label: string; invitation: string; minimumLevel: number; unlock: string }> = {
  groove: { label: "Groove keeper", invitation: "Hold a pulse, place silence and make time feel good.", minimumLevel: 1, unlock: "Ready from your first clear sound" },
  riff: { label: "Riff echo", invitation: "Copy a tiny fingerprint, move it and change one thing.", minimumLevel: 1, unlock: "Ready with one comfortable note" },
  degree: { label: "Degree hunt", invitation: "Hear a role, then find it somewhere else on the neck.", minimumLevel: 8, unlock: "Opens after octave relationships" },
  chord: { label: "Chord roulette", invitation: "Move through functions and listen to individual voices.", minimumLevel: 19, unlock: "Opens when triads are relationships" }
};

interface PromptSeed {
  minLevel: number;
  mode: FreePlayMode;
  title: string;
  build: (state: V8State) => Omit<FreePlayPrompt, "id" | "mode" | "title" | "stretch">;
}

const baselineLevel: Record<V8State["settings"]["startingBaseline"], number> = {
  repair: 1,
  some: 3,
  secure: 7
};

export function freePlayAbilityLevel(state: V8State): number {
  let level = baselineLevel[state.settings.startingBaseline];
  const completed = new Set(state.completedActivityIds);
  const evidencedUnits = new Set(state.evidence
    .filter((item) => item.outcome === "successful")
    .map((item) => item.competencyId.split(":").at(-1)));
  for (const unit of CURRICULUM) {
    if (unit.activities.some((activity) => completed.has(activity.id)) || evidencedUnits.has(unit.id)) {
      level = Math.max(level, unit.order);
    }
  }
  return level;
}

function tonalContext(state: V8State) {
  return createContext(state.settings.tonicName, state.settings.mode);
}

function chordPrompt(degrees: number[], instruction: (symbols: string[], romans: string[]) => string, relationship: string): PromptSeed["build"] {
  return (state) => {
    const chords = buildChords(tonalContext(state));
    const selected = degrees.map((degree) => chords.find((chord) => chord.degree === degree) ?? chords[(degree - 1) % chords.length]);
    return {
      instruction: instruction(selected.map((chord) => chord.symbol), selected.map((chord) => chord.roman)),
      relationship,
      hint: `The chord names in ${state.settings.tonicName} ${state.settings.mode} are ${selected.map((chord) => chord.symbol).join(" → ")}. Keep any comfortable voicings; listen to the direction between them.`,
      displayTokens: selected.map((chord) => chord.roman),
      physicalCue: "Choose the nearest comfortable voicings. Let fingers that play a shared tone stay close to the string.",
      variation: "Keep the harmonic functions but change the rhythm: make one chord arrive earlier and compare the direction.",
      preview: { kind: "chords", pitches: selected.map((chord) => chord.tones.map((tone) => tone.pitchClass)) }
    };
  };
}

function degreePrompt(degree: number, action: string, relationship: string): PromptSeed["build"] {
  return (state) => {
    const context = tonalContext(state);
    const scale = buildScale(context);
    const tone = scale[(degree - 1) % scale.length];
    return {
      instruction: `${action} Find ${tone.degreeLabel} on any string, predict its pull relative to ${context.tonicName}, then play it and return to 1.`,
      relationship,
      hint: `${tone.degreeLabel} is ${tone.name}. First find ${context.tonicName}, then use the ${tone.intervalName} relationship rather than searching for an isolated note name.`,
      displayTokens: ["1", tone.degreeLabel, "1"],
      physicalCue: "Keep the tonic under one finger or in your mind while the other finger measures the interval shape.",
      variation: `Find the same ${tone.degreeLabel} on a different string set. The pitch role stays; the hand geometry changes.`,
      preview: { kind: "degree", tonic: context.tonic, target: tone.pitchClass }
    };
  };
}

function riffPrompt(degrees: number[], count: string, relationship: string, bpm = 76): PromptSeed["build"] {
  return (state) => {
    const context = tonalContext(state);
    const scale = buildScale(context);
    const tones = degrees.map((degree) => scale[(degree - 1) % scale.length]);
    return {
      instruction: `Copy this one-bar riff: degrees ${tones.map((tone) => tone.degreeLabel).join(" – ")}. Count “${count}”, then move the same relationships to a different string set.`,
      relationship,
      hint: `In ${context.tonicName} ${state.settings.mode}, those degrees are ${tones.map((tone) => tone.name).join(" – ")}. Preserve the rhythm and interval shape when you move it.`,
      displayTokens: tones.map((tone) => tone.degreeLabel),
      physicalCue: "Use the smallest relaxed motion that preserves the interval shape. Release pressure during any space.",
      variation: "Keep the rhythm and opening intact; change only the final degree so the answer points somewhere new.",
      preview: { kind: "notes", pitches: tones.map((tone) => tone.pitchClass), bpm }
    };
  };
}

function groovePrompt(instruction: string, relationship: string, bpm: number, accents: boolean[], hint: string): PromptSeed["build"] {
  return () => ({
    instruction,
    relationship,
    hint,
    displayTokens: accents.map((accented, index) => accented ? (index === 0 ? "1" : "●") : "·"),
    physicalCue: "Let the picking hand keep travelling through the whole grid, including quiet beats and rests.",
    variation: "Move the accent to a different part of the grid without changing the spacing between attacks.",
    preview: { kind: "groove", bpm, accents }
  });
}

function oneNoteRiffPrompt(title: string, pattern: boolean[], instruction: string, relationship: string): PromptSeed {
  return {
    minLevel: 1,
    mode: "riff",
    title,
    build: (state) => ({
      instruction,
      relationship,
      hint: "Use one comfortable note or muted string. The identity comes from when you play and stop, so pitch choice cannot be wrong.",
      displayTokens: pattern.map((sounds, index) => sounds ? (index === 0 ? "1" : "●") : "·"),
      physicalCue: "Stay loose enough that the note can stop cleanly. Keep the hand moving through the silent spaces.",
      variation: "Repeat it three times, then change only the last sound or silence. Notice how little must change to create an answer.",
      preview: { kind: "notes", pitches: pattern.map((sounds) => sounds ? tonalContext(state).tonic : -1), bpm: 64 }
    })
  };
}

const PROMPTS: PromptSeed[] = [
  { minLevel: 1, mode: "groove", title: "Four steady sounds", build: groovePrompt("Choose one comfortable muted string. Play four even quarter notes with the guide, then keep the same pulse for four more without it.", "The hand follows a steady pulse; pitch is deliberately removed from the problem.", 60, [true, false, false, false], "Count 1, 2, 3, 4 aloud. Make every beginning and ending equally deliberate.") },
  { minLevel: 1, mode: "groove", title: "Begin, live, stop", build: groovePrompt("Play one note on each click. Let it live for half the beat, then stop it deliberately before the next click.", "Attack, sustain and release all sit inside the pulse; silence is an action, not an accident.", 56, [true, true, true, true], "Say ‘play, stop’ evenly inside every beat. Use the fretting finger or picking hand to end the sound cleanly.") },
  { minLevel: 1, mode: "groove", title: "Two volumes, one clock", build: groovePrompt("Alternate one gentle sound and one stronger sound without changing the tempo or tensing the hand.", "Dynamics change the shape of the phrase while the time grid remains stable.", 62, [false, true, false, true], "Think quiet–clear, not weak–forced. A small change in attack can make the contrast.") },
  oneNoteRiffPrompt("One-note fingerprint", [true, true, false, true], "Use one comfortable note: short, short, space, long. Repeat until the timing feels like an identity rather than an exercise.", "A riff can be recognisable through rhythm and articulation before it needs melodic range."),
  oneNoteRiffPrompt("Call and one-note answer", [true, false, true, true], "Play sound, space, sound, sound as a call. Answer with the same timing but a different attack: muted, open or accented.", "Call and response can preserve time while sound character supplies the contrast."),
  oneNoteRiffPrompt("Repeat, then turn", [true, true, true, false], "Play three even sounds and leave the fourth space open. Repeat twice; on the third pass, fill only that final space.", "Repetition creates expectation; one changed ending becomes meaningful because the rest stayed stable."),
  { minLevel: 3, mode: "groove", title: "Pulse while attention moves", build: groovePrompt("Hold an even quarter-note pulse while moving between two comfortable notes. The notes may change; the distance between attacks must not.", "Physical movement is placed inside an unchanged time grid.", 66, [true, false, false, false], "Make the move immediately after one note so the next beat has somewhere to land.") },
  { minLevel: 4, mode: "groove", title: "Two inside one", build: groovePrompt("Play even eighth notes on one muted string. Accent only the numbered beats and let every “and” sit exactly halfway.", "Subdivision reveals two equal spaces inside each beat.", 64, [true, false, true, false, true, false, true, false], "Count 1 and 2 and 3 and 4 and. The quiet clicks are not less important; they locate the midpoint.") },
  { minLevel: 5, mode: "groove", title: "Sound and chosen silence", build: groovePrompt("Play on beats 1 and 3; mute cleanly on beats 2 and 4. Keep the silent beats physically present.", "A rest occupies measured time just as a note does.", 68, [true, false, true, false], "Keep your counting and hand motion continuous through the rests.") },
  { minLevel: 8, mode: "degree", title: "Find home twice", build: degreePrompt(1, "Find the same home pitch in two registers.", "Octave positions preserve pitch identity while changing register and hand position.") },
  { minLevel: 9, mode: "degree", title: "Root and fifth", build: degreePrompt(5, "Find a fifth from the current root shape.", "The perfect fifth is a portable seven-semitone frame around the root.") },
  { minLevel: 10, mode: "degree", title: "Change the colour by one fret", build: degreePrompt(3, "Find the third, then lower it by one fret and compare.", "A one-semitone change from 3 to ♭3 changes the central major/minor colour.") },
  { minLevel: 14, mode: "degree", title: "A degree away from home", build: degreePrompt(2, "Sing the departure before touching the string.", "Scale degree 2 is heard and found as motion away from 1, not as an isolated note.") },
  { minLevel: 9, mode: "riff", title: "Root–fifth engine", build: riffPrompt([1, 1, 5, 1], "1 and 2 and 3, 4 and", "A stable root–fifth frame gets its identity from repetition and accent.", 76) },
  { minLevel: 15, mode: "riff", title: "Three-note question", build: riffPrompt([1, 2, 3, 1, 2, 5], "1 and 2, 3 and 4", "The repeated opening creates identity; the changed ending creates direction.", 72) },
  { minLevel: 17, mode: "riff", title: "Call, then answer", build: riffPrompt([1, 3, 2, 2, 4, 3], "1 and 2, 3 and 4", "The answer preserves rhythm while changing contour.", 72) },
  { minLevel: 25, mode: "riff", title: "Leave space in the engine", build: riffPrompt([1, 1, 5, 1], "1 and, rest, 3 and 4", "A riff is contour plus rhythmic identity; the rest is part of the fingerprint.", 88) },
  { minLevel: 19, mode: "chord", title: "Home in three tones", build: chordPrompt([1], (symbols, romans) => `Play ${romans[0]} (${symbols[0]}) as an arpeggio: root, third, fifth. Then play the same tones together.`, "A triad keeps one chord identity whether its tones arrive in sequence or together.") },
  { minLevel: 21, mode: "chord", title: "Keep what can stay", build: chordPrompt([1, 6], (symbols, romans) => `Move ${romans.join(" → ")} (${symbols.join(" → ")}). Find one shared tone and hold it while the other voices move.`, "Common-tone voice leading makes harmonic movement audible as individual moving and staying voices.") },
  { minLevel: 31, mode: "chord", title: "Departure and return", build: chordPrompt([1, 4, 5, 1], (symbols, romans) => `Loop ${romans.join(" – ")} (${symbols.join(" – ")}) without stopping. Name home, departure and tension as you hear them.`, "Roman numerals describe harmonic function relative to the current tonal centre.") }
];

export function availableFreePlayModes(state: V8State): FreePlayMode[] {
  const level = freePlayAbilityLevel(state);
  return (["groove", "riff", "degree", "chord"] as const).filter((mode) => PROMPTS.some((prompt) => prompt.mode === mode && prompt.minLevel <= level));
}

export function buildFreePlayPrompt(state: V8State, mode: FreePlayMode, index: number): FreePlayPrompt {
  const level = freePlayAbilityLevel(state);
  const stretch = index > 0 && index % 5 === 0;
  const learned = PROMPTS.filter((prompt) => prompt.mode === mode && prompt.minLevel <= level);
  const next = PROMPTS.find((prompt) => prompt.mode === mode && prompt.minLevel > level);
  const seed = stretch && next && next.minLevel <= level + 2
    ? next
    : learned[index % learned.length] ?? PROMPTS.find((prompt) => prompt.mode === "groove")!;
  return { id: `${mode}-${level}-${index}`, mode, title: seed.title, stretch: seed.minLevel > level, ...seed.build(state) };
}

export function buildFreePlaySequence(state: V8State, focus: FreePlayFocus, sessionNumber: number, length = 8): FreePlayPrompt[] {
  const modes = availableFreePlayModes(state);
  const chosen = focus === "mix" || !modes.includes(focus) ? modes : [focus];
  return Array.from({ length }, (_, index) => {
    const mode = chosen[(index + sessionNumber) % chosen.length] ?? "groove";
    return buildFreePlayPrompt(state, mode, sessionNumber * length + index + 1);
  });
}
