import {
  analyzeCandidateInContext
} from "./chordDiscovery";
import type { ChordCandidate, ChordContextAnalysis } from "./chordDiscovery";
import {
  buildChordFromRoot,
  buildChords,
  buildScale,
  normalize
} from "./theory";
import type { Chord, TonalContext } from "./types";

export type ConnectionCategory = "diatonic" | "resolution" | "modal-rock" | "borrowed" | "blues";

export interface ChordConnection {
  id: string;
  chord: Chord;
  category: ConnectionCategory;
  label: string;
  reason: string;
  listenFor: string;
}

export interface ProgressionAnalysis {
  romanSequence: string;
  classifications: readonly ChordContextAnalysis[];
  summary: string;
  confidence: "clear" | "mixed" | "ambiguous";
}

function addUnique(
  suggestions: ChordConnection[],
  suggestion: ChordConnection,
  current: ChordCandidate
) {
  const sameAsCurrent = suggestion.chord.root === current.root &&
    suggestion.chord.quality === current.quality;
  if (sameAsCurrent) return;
  if (suggestions.some((item) =>
    item.chord.root === suggestion.chord.root &&
    item.chord.quality === suggestion.chord.quality
  )) return;
  suggestions.push(suggestion);
}

function diatonicConnection(chord: Chord, label: string, reason: string, listenFor: string): ChordConnection {
  return {
    id: `diatonic-${chord.id}`,
    chord,
    category: label === "Resolve home" ? "resolution" : "diatonic",
    label,
    reason,
    listenFor
  };
}

function commonTargets(degree: number): readonly number[] {
  if ([5, 7].includes(degree)) return [1, 6, 4];
  if ([2, 4].includes(degree)) return [5, 1, 6];
  if ([3, 6].includes(degree)) return [2, 4, 5];
  return [4, 6, 5];
}

export function suggestChordConnections(
  candidate: ChordCandidate,
  context: TonalContext,
  limit = 6
): ChordConnection[] {
  const suggestions: ChordConnection[] = [];
  const diatonic = buildChords(context);
  const scale = buildScale(context);
  const scaleRoot = scale.find((tone) => tone.pitchClass === candidate.root);
  const degree = scaleRoot?.degree ?? 0;
  const targets = degree ? commonTargets(degree) : [1, 4, 5];

  for (const targetDegree of targets) {
    const chord = diatonic.find((item) => item.degree === targetDegree);
    if (!chord) continue;
    const resolving = targetDegree === 1 && ([5, 7].includes(degree) || candidate.context.relationship !== "diatonic");
    addUnique(suggestions, diatonicConnection(
      chord,
      resolving ? "Resolve home" : targetDegree === 5 ? "Create direction" : "Stay in the key",
      resolving
        ? `${chord.roman} restores ${context.tonicName} as the tonal centre after ${candidate.context.roman}.`
        : `${chord.roman} is diatonic to ${context.tonicName} ${context.mode} and gives a practical next function.`,
      resolving
        ? "Listen for tension releasing into the tonic."
        : targetDegree === 5
          ? "Listen for stronger forward pull."
          : "Listen for shared tones and a change of harmonic colour."
    ), candidate);
  }

  if (candidate.context.relationship !== "diatonic") {
    const tonic = diatonic.find((chord) => chord.degree === 1);
    if (tonic) {
      addUnique(suggestions, diatonicConnection(
        tonic,
        "Test the resolution",
        `${candidate.context.roman} is context-dependent here. Moving to ${tonic.symbol} tests whether ${context.tonicName} still sounds like home.`,
        "A convincing arrival supports the current tonal-centre analysis; a weak arrival suggests another context may fit better."
      ), candidate);
    }
  }

  if (["major", "mixolydian"].includes(context.mode) && candidate.root === context.tonic) {
    const root = normalize(context.tonic + 10);
    const chord = buildChordFromRoot(
      context,
      root,
      "major",
      "bVII",
      "Modal return",
      `bVII is a common rock and Mixolydian colour beside ${context.tonicName}. It is outside the major scale but has a clear root relationship.`
    );
    addUnique(suggestions, {
      id: `modal-bVII-${context.tonicName}`,
      chord,
      category: "modal-rock",
      label: "Add rock / modal colour",
      reason: `Try ${chord.symbol} before returning to ${context.tonicName}.`,
      listenFor: "The lowered seventh removes leading-tone pull and creates a broader, less classical return."
    }, candidate);

    const ivRoot = normalize(context.tonic + 5);
    const iv = buildChordFromRoot(
      context,
      ivRoot,
      "minor",
      "iv",
      "Borrowed predominant",
      `Minor iv borrows the lowered sixth from the parallel minor and often moves expressively back to ${context.tonicName}.`
    );
    addUnique(suggestions, {
      id: `borrowed-iv-${context.tonicName}`,
      chord: iv,
      category: "borrowed",
      label: "Borrow from parallel minor",
      reason: `${iv.symbol} changes the diatonic IV into iv while keeping the same chord root.`,
      listenFor: "Hear the chromatic lowering of the third and its wistful pull back to tonic."
    }, candidate);
  }

  if (context.mode === "minor" && candidate.root === context.tonic) {
    const dominant = buildChordFromRoot(
      context,
      normalize(context.tonic + 7),
      "dominant7",
      "V7",
      "Borrowed dominant",
      "V7 raises the 7th degree to create a leading tone, borrowed from harmonic minor for a stronger return to i."
    );
    addUnique(suggestions, {
      id: `minor-dominant-${context.tonicName}`,
      chord: dominant,
      category: "borrowed",
      label: "Add a true dominant",
      reason: `${dominant.symbol} replaces the natural-minor v with a raised-leading-tone dominant.`,
      listenFor: "Compare v–i (gentle, modal) with V7–i (directed, classical)."
    }, candidate);
  }

  if (context.mode === "blues" || candidate.quality === "dominant7") {
    const bluesContext = { ...context, mode: "blues" as const };
    for (const chord of buildChords(bluesContext)) {
      addUnique(suggestions, {
        id: `blues-${chord.id}`,
        chord,
        category: "blues",
        label: "Use the blues form",
        reason: `${chord.roman} is one of the I7-IV7-V7 pillars around ${context.tonicName}.`,
        listenFor: "Dominant-seventh colour can function as stable blues colour as well as classical tension."
      }, candidate);
    }
  }

  return suggestions.slice(0, limit);
}

export function analyzeDiscoveredProgression(
  candidates: readonly ChordCandidate[],
  context: TonalContext
): ProgressionAnalysis {
  const classifications = candidates.map((candidate) =>
    analyzeCandidateInContext(candidate.root, candidate.quality, candidate.intervals, context)
  );
  const romanSequence = classifications.map((item) => item.roman).join(" → ");
  const nonDiatonic = classifications.filter((item) => item.relationship !== "diatonic");
  const chromatic = classifications.filter((item) => item.relationship === "chromatic");
  const resolvesHome = candidates.length > 1 && candidates[candidates.length - 1].root === context.tonic;
  const dominantToTonic = classifications.some((item, index) =>
    index < classifications.length - 1 &&
    /^V(?:7)?$/.test(item.roman) &&
    candidates[index + 1].root === context.tonic
  );
  const confidence: ProgressionAnalysis["confidence"] = chromatic.length
    ? "ambiguous"
    : nonDiatonic.length
      ? "mixed"
      : "clear";
  const summary = !candidates.length
    ? "Add at least one discovered or suggested chord to analyse the movement."
    : confidence === "clear"
      ? `All ${candidates.length} chords fit ${context.tonicName} ${context.mode} diatonically.${dominantToTonic ? " The progression contains a V-I resolution." : resolvesHome ? " It finishes on the tonic." : ""}`
      : confidence === "mixed"
        ? `${candidates.length - nonDiatonic.length} of ${candidates.length} chords are diatonic. The remaining ${nonDiatonic.length} are labelled as altered, borrowed, modal, or blues colour rather than forced into the key.`
        : `${chromatic.length} chord${chromatic.length === 1 ? "" : "s"} remain context-dependent. The Roman numerals show root relationships, not a claim of one certain function.`;
  return { romanSequence, classifications, summary, confidence };
}
