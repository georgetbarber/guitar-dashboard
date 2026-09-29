/** The first microphone check estimates one sustained note, never timing or technique. */
export type PitchEstimate =
  | { status: "uncertain"; reason: "quiet" | "clipped" | "unclear" | "unstable" | "interrupted" }
  | {
      status: "stable";
      frequencyHz: number;
      midi: number;
      centsFromTarget: number;
      confidence: number;
      frames: number;
    };

export interface TimedAudioFrame {
  atMs: number;
  samples: Float32Array;
}

const LOWEST_HZ = 80;
const HIGHEST_HZ = 850;

function framePitch(samples: Float32Array, sampleRate: number): { frequencyHz: number; confidence: number } | null {
  if (samples.length < 2048 || sampleRate < 8_000) return null;
  // Half-rate analysis keeps this bounded on phones while retaining more than
  // enough samples for an open high E and its nearby mistakes.
  const signal = new Float32Array(Math.floor(samples.length / 2));
  let sum = 0;
  for (let index = 0; index < signal.length; index += 1) {
    signal[index] = (samples[index * 2] + samples[index * 2 + 1]) / 2;
    sum += signal[index];
  }
  const mean = sum / signal.length;
  for (let index = 0; index < signal.length; index += 1) signal[index] -= mean;
  const rate = sampleRate / 2;
  const minLag = Math.max(2, Math.floor(rate / HIGHEST_HZ));
  const maxLag = Math.min(Math.floor(rate / LOWEST_HZ), Math.floor(signal.length / 2));
  const count = signal.length - maxLag;
  const difference = new Float32Array(maxLag + 2);
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let error = 0;
    let energy = 0;
    for (let index = 0; index < count; index += 1) {
      const a = signal[index];
      const b = signal[index + lag];
      error += (a - b) ** 2;
      energy += a * a + b * b;
    }
    difference[lag] = energy > 0 ? error / energy : 1;
  }
  // Choose the first convincing period. A later, deeper minimum may be an
  // octave or a multiple of the true period; a weak minimum is not evidence.
  for (let lag = minLag + 1; lag < maxLag; lag += 1) {
    const score = difference[lag];
    if (score > 0.12 || score > difference[lag - 1] || score > difference[lag + 1]) continue;
    const left = difference[lag - 1];
    const right = difference[lag + 1];
    const denominator = left - 2 * score + right;
    const shift = Math.abs(denominator) > 1e-8 ? Math.max(-0.5, Math.min(0.5, (left - right) / (2 * denominator))) : 0;
    return { frequencyHz: rate / (lag + shift), confidence: 1 - score };
  }
  return null;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * Capture timestamps guard against a stalled tab or delayed input callback.
 * No frame, waveform or recording is retained after the caller receives this
 * small estimate. An unsuitable signal has no pitch outcome.
 */
export function assessSustainedPitch(
  frames: readonly TimedAudioFrame[],
  sampleRate: number,
  targetMidi: number,
): PitchEstimate {
  if (frames.length < 12 || frames.at(-1)!.atMs - frames[0].atMs < 1_100) {
    return { status: "uncertain", reason: "interrupted" };
  }
  for (let index = 1; index < frames.length; index += 1) {
    if (frames[index].atMs - frames[index - 1].atMs > 350 || frames[index].atMs <= frames[index - 1].atMs) {
      return { status: "uncertain", reason: "interrupted" };
    }
  }
  const frequencies: number[] = [];
  const confidences: number[] = [];
  let quiet = 0;
  let clipped = 0;
  for (const frame of frames) {
    let power = 0;
    let peak = 0;
    for (const sample of frame.samples) {
      power += sample * sample;
      peak = Math.max(peak, Math.abs(sample));
    }
    const rms = Math.sqrt(power / frame.samples.length);
    if (rms < 0.008) {
      quiet += 1;
      continue;
    }
    if (peak >= 0.985 || rms > 0.7) {
      clipped += 1;
      continue;
    }
    const estimate = framePitch(frame.samples, sampleRate);
    if (estimate) {
      frequencies.push(estimate.frequencyHz);
      confidences.push(estimate.confidence);
    }
  }
  if (quiet > frames.length / 2) return { status: "uncertain", reason: "quiet" };
  if (clipped > frames.length / 4) return { status: "uncertain", reason: "clipped" };
  if (frequencies.length < Math.max(8, Math.ceil(frames.length * 0.65))) {
    return { status: "uncertain", reason: "unclear" };
  }
  const frequencyHz = median(frequencies);
  const cents = frequencies.map((frequency) => 1_200 * Math.log2(frequency / frequencyHz));
  if (median(cents.map(Math.abs)) > 25 || Math.max(...cents) - Math.min(...cents) > 80) {
    return { status: "uncertain", reason: "unstable" };
  }
  const targetHz = 440 * 2 ** ((targetMidi - 69) / 12);
  return {
    status: "stable",
    frequencyHz: Math.round(frequencyHz * 10) / 10,
    midi: Math.round(69 + 12 * Math.log2(frequencyHz / 440)),
    centsFromTarget: Math.round(1_200 * Math.log2(frequencyHz / targetHz)),
    confidence: Math.round(median(confidences) * 100) / 100,
    frames: frequencies.length,
  };
}
