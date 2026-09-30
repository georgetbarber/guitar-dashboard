import { estimateFramePitch } from "./pitchAssessment";
import type { TimedAudioFrame } from "./pitchAssessment";

export type NoteSequenceEstimate =
  | { status: "uncertain"; reason: "quiet" | "clipped" | "unclear" | "unstable" | "interrupted" | "not-separated" }
  | { status: "estimated"; notes: { midi: number; frequencyHz: number; centsFromTarget: number }[] };

/** A short signal check for distinct pitched sounds. Silence separates notes; a pitch change alone does not. */
export function assessNoteSequence(
  frames: readonly TimedAudioFrame[],
  sampleRate: number,
  targets: readonly number[],
): NoteSequenceEstimate {
  if (targets.length < 2 || targets.length > 3 || frames.length < 18 || frames.at(-1)!.atMs - frames[0].atMs < 1_600)
    return { status: "uncertain", reason: "interrupted" };
  for (let index = 1; index < frames.length; index += 1) {
    const gap = frames[index].atMs - frames[index - 1].atMs;
    if (gap <= 0 || gap > 350) return { status: "uncertain", reason: "interrupted" };
  }

  const segments: TimedAudioFrame[][] = [];
  let current: TimedAudioFrame[] = [];
  let silence = 0;
  let clipped = 0;
  let voiced = 0;
  for (const frame of frames) {
    let power = 0;
    let peak = 0;
    for (const sample of frame.samples) {
      power += sample * sample;
      peak = Math.max(peak, Math.abs(sample));
    }
    const rms = Math.sqrt(power / frame.samples.length);
    if (peak >= 0.985 || rms > 0.7) {
      clipped += 1;
      continue;
    }
    if (rms < 0.008) {
      silence += 1;
      continue;
    }
    voiced += 1;
    if (silence >= 2 && current.length) {
      segments.push(current);
      current = [];
    }
    silence = 0;
    current.push(frame);
  }
  if (current.length) segments.push(current);
  if (clipped > 1) return { status: "uncertain", reason: "clipped" };
  if (voiced < targets.length * 4) return { status: "uncertain", reason: "quiet" };
  if (segments.length !== targets.length || segments.some((segment) => segment.length < 4))
    return { status: "uncertain", reason: "not-separated" };

  const notes: Extract<NoteSequenceEstimate, { status: "estimated" }>["notes"] = [];
  for (let index = 0; index < segments.length; index += 1) {
    // Reuse the conservative frame estimator for each clearly separated sound.
    // Samples remain temporary in memory and are never returned.
    const segment = segments[index];
    const estimate = estimateSegment(segment, sampleRate, targets[index]);
    if (estimate.status === "uncertain") return estimate;
    notes.push(estimate.note);
  }
  return { status: "estimated", notes };
}

type SegmentEstimate =
  | { status: "uncertain"; reason: "unclear" | "unstable" }
  | { status: "estimated"; note: { midi: number; frequencyHz: number; centsFromTarget: number } };

function estimateSegment(segment: readonly TimedAudioFrame[], sampleRate: number, targetMidi: number): SegmentEstimate {
  const pitches: number[] = [];
  for (const frame of segment) {
    const pitch = estimateFramePitch(frame.samples, sampleRate);
    if (pitch !== null) pitches.push(pitch.frequencyHz);
  }
  if (pitches.length < Math.max(3, Math.ceil(segment.length * 0.7))) return { status: "uncertain", reason: "unclear" };
  const sorted = [...pitches].sort((a, b) => a - b);
  const frequencyHz = sorted[Math.floor(sorted.length / 2)];
  const cents = pitches.map((pitch) => 1_200 * Math.log2(pitch / frequencyHz));
  if (Math.max(...cents) - Math.min(...cents) > 80) return { status: "uncertain", reason: "unstable" };
  const targetHz = 440 * 2 ** ((targetMidi - 69) / 12);
  return {
    status: "estimated",
    note: {
      frequencyHz: Math.round(frequencyHz * 10) / 10,
      midi: Math.round(69 + 12 * Math.log2(frequencyHz / 440)),
      centsFromTarget: Math.round(1_200 * Math.log2(frequencyHz / targetHz)),
    },
  };
}
