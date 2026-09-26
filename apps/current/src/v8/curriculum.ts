import type { ActivityDefinition, ActivityKind, CompetencyStrand, CurriculumUnit, EvidenceSource, MicroStudy } from "./types";
import { PILOT_EPISODE, validatePilotEpisode } from "./pilotEpisode";

interface UnitSeed {
  title: string;
  focus: string;
  outcome: string;
  strands: CompetencyStrand[];
  study: [string, number, MicroStudy["metre"], string, string[]];
  earTargets: number[];
  overrides?: Partial<Record<ActivityKind, Partial<Pick<ActivityDefinition, "title" | "instruction" | "action" | "observable" | "prompt" | "hint" | "reveal">>>>;
}

interface StageSeed {
  title: string;
  purpose: string;
  units: UnitSeed[];
}

const SOUND_ACTION_OVERRIDE = {
  "sing-predict": {
    title: "Predict the sound of your action",
    instruction: "Before playing, describe (aloud or internally) how the note will start, sustain and stop. Then play and compare reality with the prediction."
  },
} satisfies NonNullable<UnitSeed["overrides"]>;

const BASELINE_OVERRIDE = {
  ...SOUND_ACTION_OVERRIDE,
  rhythm: {
    title: "Play a one-note question and answer",
    instruction: "Use the open high E string for two bars. Play the question on counts 1 and 3; answer on counts 1, 2 and 4. Stop the string on each rest while your internal count continues.",
    action: "Count four beats aloud before starting. Play the question, then the answer at 60 BPM. On every rest, lightly touch the high E string with your picking hand to stop it. Tap only after trying both bars.",
    observable: "your question notes land on 1 and 3, your answer notes land on 1, 2 and 4, and each rest is silent without losing the pulse.",
    prompt: "Question: play, rest, play, rest. Answer: play, play, rest, play. One open high E throughout.",
    hint: "Loop the question bar alone: play on 1 and 3, keep counting through 2 and 4. Then add the answer bar.",
    reveal: "Question: 1 play, 2 mute, 3 play, 4 mute. Answer: 1 play, 2 play, 3 mute, 4 play. Every sound ends when the following count begins."
  }
} satisfies NonNullable<UnitSeed["overrides"]>;

const FEEL_OVERRIDE = {
  "sing-predict": {
    title: "Predict the feel",
    instruction: "Before playing, count or sketch the pattern and predict where the emphasis will land. Then play and compare."
  }
} satisfies NonNullable<UnitSeed["overrides"]>;

const CHECKING_OVERRIDE = {
  "sing-predict": {
    title: "Predict before checking",
    instruction: "Commit to a specific expectation — what you will hear, keep or change — before listening back or looking at the reference."
  }
} satisfies NonNullable<UnitSeed["overrides"]>;

export const STAGES: StageSeed[] = [
  {
    title: "Sound and time",
    purpose: "Make deliberate, relaxed sounds that remain connected to an internal pulse.",
    units: [
      ["Your musical baseline", "diagnostic listening and control", "Discover what is already secure and choose repairs without judgement.", ["sound", "rhythm", "reflection"], ["One clear note", 60, "4/4", "quarter quarter quarter quarter", ["e|--0---0---0---0--|", "Count 1   2   3   4"]], [0], BASELINE_OVERRIDE],
      ["Clean beginnings and endings", "attack, sustain and release", "Control when a note begins, how it lives, and when it stops.", ["sound", "ear"], ["Four shapes of one note", 64, "4/4", "half half", ["B|--5-------5-------|", "Let ring   mute"]], [0], SOUND_ACTION_OVERRIDE],
      ["Pulse before speed", "steady quarter-note pulse", "Keep an even pulse while attention moves between both hands.", ["rhythm", "sound"], ["Pulse anchor", 66, "4/4", "quarter quarter quarter quarter", ["E|--0---0---0---0--|", "    >       >"]], [0], SOUND_ACTION_OVERRIDE],
      ["Subdivide the space", "eighth-note subdivision", "Feel the smaller grid inside the beat without rushing.", ["rhythm", "sound"], ["Two inside one", 62, "4/4", "eighth eighth eighth eighth eighth eighth eighth eighth", ["E|--0-0-0-0-0-0-0-0--|", "Count 1 + 2 + 3 + 4 +"]], [0], SOUND_ACTION_OVERRIDE],
      ["Silence is an action", "rests and muting", "Place silence as deliberately as sound.", ["rhythm", "sound", "composition"], ["Sound and space", 68, "4/4", "quarter rest quarter rest", ["A|--0---x---0---x--|", "Play mute play mute"]], [0], SOUND_ACTION_OVERRIDE],
      ["Change without losing time", "two-shape transitions", "Move between two comfortable shapes while the pulse continues.", ["rhythm", "harmony", "sound"], ["Two-shape loop", 60, "4/4", "half half", ["e|--0-------3-------|", "B|--1-------0-------|"]], [0, 7]]
    ].map(tuple)
  },
  {
    title: "Movable fretboard map",
    purpose: "Replace isolated memorisation with landmarks, octaves and portable interval geometry.",
    units: [
      ["Open-string compass", "open strings and unisons", "Recover any string from a small set of dependable landmarks.", ["fretboard", "ear"], ["Open compass", 68, "4/4", "quarter quarter quarter quarter", ["E A D G B E", "Low to high, then return"]], [5]],
      ["Octaves reveal the neck", "octave shapes", "Find the same pitch identity across registers and string sets.", ["fretboard", "ear"], ["Octave call", 70, "4/4", "quarter quarter half", ["A|--3-----------|", "G|------5-------|"]], [12]],
      ["Root and fifth skeleton", "perfect-fifth geometry", "Use roots and fifths as a movable structural frame.", ["fretboard", "melody"], ["Open frame", 76, "4/4", "eighth eighth quarter half", ["A|--3-------5---|", "D|------5-------|"]], [7]],
      ["Thirds change colour", "minor and major thirds", "Hear and feel the one-fret difference that changes chord and melodic colour.", ["fretboard", "ear", "harmony"], ["Colour switch", 66, "4/4", "half half", ["A|--7-----------|", "D|------5---6---|"]], [3, 4]],
      ["Crossing the B string", "tuning-boundary adjustment", "Transfer interval shapes accurately across the G–B boundary.", ["fretboard", "reflection"], ["Boundary crossing", 60, "4/4", "quarter quarter quarter quarter", ["G|--5-------7---|", "B|------5-------|"]], [4, 5]],
      ["Transpose without losing meaning", "movable structures", "Move a physical idea while preserving its interval identity.", ["fretboard", "ear", "composition"], ["Same shape, new home", 72, "4/4", "half half", ["A|--3---5---7---8--|", "Move; keep the relationship"]], [7, 12]]
    ].map(tuple)
  },
  {
    title: "Tonal hearing and melody",
    purpose: "Hear pitches as degrees around home and turn those relationships into phrases.",
    units: [
      ["Home and departure", "tonic versus tension", "Hear, sing and play departure from and return to tonic.", ["ear", "melody"], ["Leave and return", 64, "4/4", "quarter quarter quarter quarter", ["1   2   3   1", "home away colour home"]], [2, 4, 0]],
      ["Degrees have character", "scale-degree identity", "Recognise degrees through stability, colour and direction.", ["ear", "melody", "fretboard"], ["Degree ladder", 70, "4/4", "eighth eighth eighth eighth", ["1 2 3 4 | 5 4 3 2 | 1", "Sing before playing"]], [2, 4, 5, 7, 9, 11]],
      ["Make a motif", "short melodic identity", "Create a memorable idea by controlling contour and rhythm.", ["melody", "composition", "rhythm"], ["Three-note question", 76, "4/4", "eighth eighth quarter half", ["1 2 3 | 1 2 5", "Repeat, then change the ending"]], [2, 4, 7]],
      ["Phrase toward a destination", "melodic targeting", "Choose an ending degree and make the phrase point toward it.", ["melody", "ear", "harmony"], ["Two endings", 68, "4/4", "quarter quarter quarter half", ["3 2 1 | 3 2 5", "settled | open"]], [0, 7]],
      ["Answer what you hear", "call and response", "Imitate a phrase, then answer it without copying it.", ["ear", "melody", "reflection"], ["Call / answer", 72, "4/4", "eighth eighth quarter half", ["1 3 2 | 2 4 3", "same rhythm, new contour"]], [4, 2, 5]],
      ["Find a melody by ear", "ear-to-hand transcription", "Move from internal sound to guitar before using labels.", ["ear", "fretboard", "melody"], ["Hidden path", 60, "3/4", "quarter quarter quarter", ["? ? ? | ? ? 1", "sing, search, verify"]], [4, 7, 9, 5, 2]]
    ].map(tuple)
  },
  {
    title: "Triads and harmonic movement",
    purpose: "See chords as interval structures and connect them through individual moving voices.",
    units: [
      ["Triads are relationships", "root, third and fifth", "Build major and minor triads from interval content rather than shape names.", ["harmony", "fretboard", "ear"], ["Three-tone stack", 64, "4/4", "quarter quarter half", ["1   3   5", "arpeggiate, then block"]], [4, 7]],
      ["Inversions change perspective", "bass role and inversion", "Reorder the same chord tones and hear how the bass changes its character.", ["harmony", "fretboard"], ["Three views", 66, "3/4", "quarter quarter quarter", ["1-3-5 | 3-5-1 | 5-1-3", "same identity, new bass"]], [4, 7, 12]],
      ["Keep what can stay", "common-tone voice leading", "Connect chords by holding shared tones and moving only what must move.", ["harmony", "sound", "reflection"], ["One voice moves", 60, "4/4", "half half", ["I      vi", "listen for the held tone"]], [4, 9]],
      ["Hear each moving voice", "contrary and stepwise motion", "Treat a progression as several melodies moving together.", ["harmony", "ear", "melody"], ["Threads", 68, "4/4", "quarter quarter quarter quarter", ["top: 3 4 5 3", "bass: 1 4 5 1"]], [4, 5, 7]],
      ["Target the changing chord", "chord-tone phrasing", "Make a melodic line acknowledge harmony by choosing deliberate landing tones.", ["harmony", "melody", "ear"], ["Land with intent", 72, "4/4", "eighth eighth quarter half", ["I: 3 | IV: 3 | V: 3", "same role, changing notes"]], [4, 9, 11]],
      ["First harmonised phrase", "melody with supporting triads", "Create and save a phrase whose harmony supports its contour.", ["composition", "harmony", "melody"], ["Phrase with floor", 64, "4/4", "half half", ["melody: 3 2 | 1", "harmony: IV V | I"]], [4, 2, 0]]
    ].map(tuple)
  },
  {
    title: "Groove and musical language",
    purpose: "Make relationships feel musical through articulation, rhythmic identity and responsive phrasing.",
    units: [
      ["A riff is rhythm plus contour", "riff construction", "Build a recognisable guitar idea from a pulse, accents and a small pitch set.", ["rhythm", "melody", "composition"], ["Root-fifth engine", 88, "4/4", "eighth eighth rest eighth", ["E|--0-0-x-7-0---|", "accent the return"]], [7]],
      ["Syncopation creates lift", "off-beat accents", "Feel and control notes that lean across the beat.", ["rhythm", "sound"], ["Across the beat", 76, "4/4", "rest eighth rest eighth rest eighth quarter tie", ["Count 1 + 2 + 3 + 4 +", "Play   +   +   4"]], [0], FEEL_OVERRIDE],
      ["Articulation changes meaning", "legato, staccato and accents", "Play identical pitches with contrasting articulation and describe the effect.", ["sound", "melody", "reflection"], ["Same notes, new voice", 72, "4/4", "quarter quarter quarter quarter", ["5-7-5-3", "connected | clipped | accented"]], [0], FEEL_OVERRIDE],
      ["Develop an idea", "repetition and variation", "Preserve enough identity for recognition while changing one dimension.", ["composition", "melody", "rhythm"], ["A, A, A'", 80, "4/4", "eighth eighth quarter half", ["1-2-3 | 1-2-3 | 1-2-5", "change only the ending"]], [2, 4, 7]],
      ["Improvise with constraints", "limited-note improvisation", "Use restriction to develop rhythm, phrasing and intention.", ["melody", "ear", "reflection"], ["Three-note freedom", 76, "4/4", "free over pulse", ["Use 1, b3 and 4", "leave one beat of silence · these live inside the minor pentatonic"]], [3, 5]],
      ["Compare musical dialects", "stylistic transformation", "Transform one idea through groove and articulation without treating style as a rulebook. Swing plays pairs of eighths long-short instead of evenly; the notation looks identical, the feel differs.", ["rhythm", "composition", "reflection"], ["One motif, three feels", 84, "4/4", "straight swing syncopated", ["same pitches", "change time and touch"]], [0], FEEL_OVERRIDE]
    ].map(tuple)
  },
  {
    title: "Functional and modal harmony",
    purpose: "Use tonal function as a reference while learning when and why to step outside it.",
    units: [
      ["Departure, tension, return", "I–IV–V function", "Hear chords as states around home rather than a memorised sequence.", ["harmony", "ear"], ["Functional arc", 68, "4/4", "whole whole whole whole", ["I | IV | V | I", "home expand tension return"]], [5, 7, 0]],
      ["Loops tell different stories", "harmonic rotation and emphasis", "Change where a loop begins and which chord feels structurally important.", ["harmony", "composition"], ["Rotating axis", 74, "4/4", "whole whole whole whole", ["I V vi IV", "then vi IV I V"]], [9, 5]],
      ["Blues bends the categories", "dominant colour and blues ambiguity", "Hear major/minor mixture and dominant colour without forcing one classical explanation. On guitar the b3 and b5 are often bent slightly sharp toward 3 and 5 — the colour lives between the frets.", ["harmony", "ear", "melody"], ["Blue conversation", 76, "4/4", "whole whole whole whole", ["I7 | IV7 | I7 | V7", "b3 against major"]], [3, 4, 10]],
      ["Modes keep a different light", "Dorian and Mixolydian colour", "Hold tonic steady while a characteristic degree changes the field.", ["harmony", "ear", "melody"], ["Modal window", 72, "4/4", "half half", ["Dorian: i IV", "Mixolydian: I bVII"]], [9, 10]],
      ["Borrow colour deliberately", "modal interchange", "Replace one diatonic chord with a parallel-mode colour and compare its emotional direction. In minor keys the most common borrowing is the raised leading tone: V or V7 in place of v.", ["harmony", "composition", "reflection"], ["Borrowed shadow", 66, "4/4", "whole whole whole whole", ["I | IV | iv | I", "one note changes the light"]], [9, 8]],
      ["Outside is not wrong", "chromatic approaches and non-functional motion", "Use chromatic movement as an intentional connection, colour or refusal to resolve.", ["harmony", "melody", "composition"], ["Side-step", 70, "4/4", "quarter quarter half", ["target from one fret below", "hear intention before label"]], [1, 11]]
    ].map(tuple)
  },
  {
    title: "Composition and form",
    purpose: "Shape motifs, harmony, rhythm and texture into coherent sections with an intentional journey.",
    units: [
      ["Harmonic rhythm shapes pace", "chord duration", "Change emotional pace by controlling when harmony moves.", ["composition", "rhythm", "harmony"], ["Slow then quick", 68, "4/4", "whole half half", ["I | IV V | I", "same chords, new pacing"]], [0], FEEL_OVERRIDE],
      ["Build and release tension", "tension curve", "Plan a section through relative stability, density, register and expectation.", ["composition", "harmony", "reflection"], ["Four-bar arc", 72, "4/4", "whole whole whole whole", ["stable → moving → tense → release", "draw before playing"]], [7, 11, 0]],
      ["Repetition earns contrast", "motif development", "Balance familiarity and surprise across several statements.", ["composition", "melody", "rhythm"], ["Motif family", 76, "4/4", "eighth eighth quarter half", ["A | A | A' | B", "retain one fingerprint"]], [2, 4]],
      ["Create an A/B form", "section contrast", "Write two related sections that differ clearly in at least two musical dimensions.", ["composition", "harmony", "rhythm"], ["Two rooms", 70, "4/4", "section A section B", ["A: low + sparse", "B: high + active"]], [0], FEEL_OVERRIDE],
      ["Bass movement reframes harmony", "bass line and inversion", "Use bass direction to connect or destabilise a progression.", ["composition", "harmony", "melody"], ["Bass thread", 66, "4/4", "half half", ["C B A G", "hear line before chord labels"]], [11, 9, 7]],
      ["Arrange the guitar part", "register, texture and space", "Choose where, how densely and how forcefully the guitar speaks.", ["composition", "sound", "reflection"], ["Texture map", 72, "4/4", "sparse dense sparse dense", ["single notes | triads", "low | high"]], [0], FEEL_OVERRIDE]
    ].map(tuple)
  },
  {
    title: "Personal voice",
    purpose: "Learn from music, make deliberate choices, revise honestly and finish work that sounds like you.",
    units: [
      ["Transcribe a fingerprint", "short self-directed transcription", "Capture rhythm, contour and articulation from a chosen sound before analysing it.", ["ear", "reflection", "melody"], ["Listen deeper", 70, "4/4", "unknown", ["rhythm first", "contour next", "exact notes last"]], [0], CHECKING_OVERRIDE],
      ["Transform what you learned", "ethical vocabulary transformation", "Change context, contour and rhythm until an influence becomes new material.", ["composition", "reflection", "melody"], ["Source to seed", 76, "4/4", "original transformed", ["keep one relationship", "change three dimensions"]], [0], CHECKING_OVERRIDE],
      ["Reharmonise one melody", "multiple harmonic readings", "Support the same melodic identity with contrasting harmonic meanings.", ["harmony", "composition", "ear"], ["One line, two worlds", 68, "4/4", "whole whole", ["melody stays", "bass and chord roles change"]], [4, 9], CHECKING_OVERRIDE],
      ["Revise with intention", "comparative listening", "Use recorded evidence to choose one meaningful revision rather than endlessly adding material.", ["reflection", "composition", "sound"], ["Before / after", 72, "4/4", "record compare revise", ["name the intention", "change one thing"]], [0], CHECKING_OVERRIDE],
      ["Finish a complete original", "multi-section project", "Complete, record and reflect on a coherent personal piece.", ["composition", "reflection", "sound", "rhythm"], ["Personal piece", 72, "4/4", "A B A' ending", ["motif", "groove", "harmony", "shape"]], [0], CHECKING_OVERRIDE],
      ["Design your next path", "independent practice", "Use evidence, curiosity and creative goals to plan the next cycle of learning.", ["reflection", "composition"], ["Next horizon", 60, "4/4", "listen choose plan", ["keep", "develop", "explore"]], [0], CHECKING_OVERRIDE]
    ].map(tuple)
  }
];

function tuple(value: unknown[]): UnitSeed {
  const [title, focus, outcome, strands, study, earTargets, overrides] = value as [string, string, string, CompetencyStrand[], UnitSeed["study"], number[], UnitSeed["overrides"]?];
  return { title, focus, outcome, strands, study, earTargets, overrides };
}

// Each template carries a concept sentence (instruction), a concrete "do this now" step (action)
// and a specific "you've succeeded when" criterion (doneWhen). action/doneWhen are second-person
// and self-contained so a first-time user knows exactly what to do and when the task is finished.
const ACTIVITY_TEMPLATE: Array<[ActivityKind, EvidenceSource, number, string, string, string, string]> = [
  ["listen-compare", "recognition", 3, "Hear the relationship", "Listen twice: first for overall character, then for what changes against the reference.",
    "Tap “Hear reference and target”, listen twice, then say out loud what changes between the two sounds.",
    "you can describe, in your own words, how the target sound differs from the reference."],
  ["sing-predict", "production", 3, "Predict before playback", "Sing or hum the target before hearing it, then compare without judging the first attempt.",
    "Sing or hum your prediction out loud first, then tap to hear it and compare the two.",
    "you made a prediction out loud before listening, and can say how close it was."],
  ["technique", "performance", 5, "Put it under the hands", "Play slowly enough to control attack, release, muting and unnecessary tension.",
    "Play the study slowly on the guitar, then tap “Play the task now” once you’ve made a controlled attempt.",
    "you played it with a controlled attack and clean release, without unnecessary tension."],
  ["rhythm", "performance", 5, "Place it in time", "Count aloud, internalise the subdivision, then play while the pulse continues through rests.",
    "Count the beat out loud, play the pattern in time, then tap “Play the task now”.",
    "you kept a steady pulse through the whole pattern, including the rests."],
  ["relationship", "recognition", 4, "Name what stays constant", "Describe the root, interval, degree, chord role or time relationship that makes the example transferable.",
    "Play or hear the example, then name the one thing — root, interval, degree or chord role — that stays constant.",
    "you can name the relationship that lets this example move to another key or position."],
  ["variation", "production", 5, "Change one dimension", "Keep one musical identity constant and change exactly one of pitch, rhythm, register, articulation or harmony.",
    "Play the original, then play it again changing exactly one thing (pitch, rhythm, register, articulation or harmony), and tap “Play the task now”.",
    "you changed exactly one dimension while the original idea stayed recognisable."],
  ["creative", "creation", 5, "Make a small musical object", "Create two to four bars that use the relationship for an audible purpose, not merely as an example.",
    "Open a new sketch, make two to four bars that use the idea, then come back and describe what you made.",
    "you saved a two-to-four-bar sketch that uses the idea for a real musical purpose."],
  ["transfer", "transfer", 5, "Move it somewhere new", "Apply the idea in a different key, neck region, tempo or instrument context.",
    "Play the idea again in a new key, neck region or tempo, then tap “Play the task now”.",
    "the idea still sounds like itself in the new context."],
  ["reflection", "reflection", 2, "Listen back and decide", "Name what became more controllable, what remains uncertain and one choice worth keeping.",
    "In the box below, write one thing that improved, one thing still uncertain, and one choice to keep. Then save.",
    "you’ve written a specific observation and a concrete next action."]
];

function makeActivity(unitId: string, seed: UnitSeed, index: number, template: typeof ACTIVITY_TEMPLATE[number]): ActivityDefinition {
  const [kind, source, minutes, title, instruction, action, doneWhen] = template;
  const override = seed.overrides?.[kind];
  const tonicOnlyListening = kind === "listen-compare" && seed.earTargets.length === 1 && seed.earTargets[0] === 0;
  return {
    id: `${unitId}-${kind}`,
    unitId,
    kind,
    title: override?.title ?? (tonicOnlyListening ? "Hear and compare your attempts" : title),
    instruction: override?.instruction ?? (tonicOnlyListening
      ? `Hear the tonic reference, then play the micro-study twice and compare the control of its sound and timing. Focus on ${seed.focus}.`
      : `${instruction} Focus on ${seed.focus}.`),
    why: seed.outcome,
    minutes,
    competencyIds: seed.strands.map((strand) => `${strand}:${unitId}`),
    source,
    action: override?.action ?? (tonicOnlyListening
      ? "Tap “Hear the tonic reference”, play the micro-study twice, then name one specific difference between your two attempts."
      : action),
    observable: override?.observable ?? (tonicOnlyListening
      ? "you can name one specific change in sound or timing between your two attempts while keeping the tonic in mind."
      : doneWhen),
    prompt: override?.prompt ?? `${seed.study[0]}: ${seed.study[3]}. ${seed.study[4].join(" · ")}`,
    hint: override?.hint ?? `Reduce the tempo or material. Keep ${seed.focus} as the only problem you are solving.`,
    reveal: override?.reveal ?? `Reference: ${seed.study[4].join(" / ")}. The goal is to hear and control ${seed.focus}, not copy mechanically.`,
  };
}

export const CURRICULUM: CurriculumUnit[] = STAGES.flatMap((stage, stageIndex) =>
  stage.units.map((seed, unitIndex) => {
    const order = stageIndex * 6 + unitIndex + 1;
    const id = `unit-${String(order).padStart(2, "0")}`;
    return {
      id,
      episodeId: order === 1 ? PILOT_EPISODE.id : undefined,
      stage: stageIndex + 1,
      order,
      title: seed.title,
      focus: seed.focus,
      outcome: seed.outcome,
      prerequisiteIds: order === 1 ? [] : [`unit-${String(order - 1).padStart(2, "0")}`],
      competencyIds: seed.strands.map((strand) => `${strand}:${id}`),
      microStudy: {
        title: seed.study[0], tempo: seed.study[1], metre: seed.study[2], rhythm: seed.study[3], tab: seed.study[4], purpose: seed.outcome,
        earTargets: seed.earTargets
      },
      activities: ACTIVITY_TEMPLATE.map((template, index) => makeActivity(id, seed, index, template))
    };
  })
);

export const ACTIVITIES = CURRICULUM.flatMap((unit) => unit.activities);

export function unitById(id: string): CurriculumUnit {
  return CURRICULUM.find((unit) => unit.id === id) ?? CURRICULUM[0];
}

export function activityById(id: string): ActivityDefinition | null {
  return ACTIVITIES.find((activity) => activity.id === id) ?? null;
}

export function validateCurriculum(): string[] {
  const errors: string[] = [];
  errors.push(...validatePilotEpisode());
  const ids = new Set(CURRICULUM.map((unit) => unit.id));
  const notationDurations: Record<string, number> = {
    whole: 4,
    "dotted-half": 3,
    half: 2,
    "dotted-quarter": 1.5,
    quarter: 1,
    eighth: 0.5,
    sixteenth: 0.25,
    rest: 1,
    tie: 0
  };
  if (CURRICULUM.length !== 48) errors.push(`Expected 48 core units, received ${CURRICULUM.length}.`);
  for (const unit of CURRICULUM) {
    if (unit.episodeId && (unit.episodeId !== PILOT_EPISODE.id || unit.id !== PILOT_EPISODE.unitId)) errors.push(`${unit.id} has an unknown episode link.`);
    if (unit.activities.length !== ACTIVITY_TEMPLATE.length) errors.push(`${unit.id} does not implement the activity contract.`);
    for (const prerequisite of unit.prerequisiteIds) if (!ids.has(prerequisite)) errors.push(`${unit.id} has missing prerequisite ${prerequisite}.`);
    const kinds = new Set(unit.activities.map((activity) => activity.kind));
    for (const required of ["technique", "rhythm", "creative", "transfer", "reflection"] as ActivityKind[]) {
      if (!kinds.has(required)) errors.push(`${unit.id} is missing ${required}.`);
    }
    const listenActivity = unit.activities.find((activity) => activity.kind === "listen-compare");
    if (unit.microStudy.earTargets?.length === 1 && unit.microStudy.earTargets[0] === 0
      && !listenActivity?.action.includes("Hear the tonic reference")) {
      errors.push(`${unit.id} tonic-only listening does not match its available playback action.`);
    }
    const rhythmTokens = unit.microStudy.rhythm.split(/\s+/);
    if (rhythmTokens.every((token) => token in notationDurations)) {
      if (rhythmTokens[0] === "tie") errors.push(`${unit.id} has a leading rhythm tie.`);
      const beatsPerBar = unit.microStudy.metre === "3/4" ? 3 : unit.microStudy.metre === "6/8" ? 6 : 4;
      const duration = rhythmTokens.reduce((total, token) => total + notationDurations[token], 0);
      // Four whole-note tokens are authored four-bar chord studies; other notated studies use the two-bar sanity bound.
      const maximum = beatsPerBar * (rhythmTokens.every((token) => token === "whole") ? 4 : 2);
      if (duration > maximum) errors.push(`${unit.id} rhythm exceeds the study sanity bound.`);
    }
  }
  return errors;
}
