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

/*
 * Thresholds tuned on 20 October 2026 against the synthetic realistic-input set
 * in realisticInput.test.ts (plucked-string harmonics and inharmonicity, decay,
 * room noise, hum, reverb, automatic gain, clipping, latency, wrong strings and
 * extra attacks). They are provisional until George's real-input checks.
 */
/** A quiet-room frame is periodic at or below this normalised difference (the original threshold). */
export const STRICT_PERIODIC_SCORE = 0.12;
/** A noisy-room frame may be periodic up to this. Noise-only frames scored 0.58 or more. */
export const PERIODIC_SCORE = 0.25;
/** Below this RMS a frame carries no usable sound. A soft pluck at arm's length starts near 0.015. */
export const QUIET_RMS = 0.003;
/** At least this many periodic frames (about 0.7 s) before any pitch is named. */
export const MIN_PERIODIC_FRAMES = 8;

export function estimateFramePitch(samples: Float32Array, sampleRate: number): { frequencyHz: number; confidence: number } | null {
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
  const dips: number[] = [];
  for (let lag = minLag + 1; lag < maxLag; lag += 1) {
    const score = difference[lag];
    if (score <= difference[lag - 1] && score <= difference[lag + 1]) dips.push(lag);
  }
  // First pass: the earliest clearly periodic dip, as in a quiet room.
  let chosen = dips.find((lag) => difference[lag] <= STRICT_PERIODIC_SCORE);
  if (chosen === undefined) {
    // Second pass, for noisy rooms: the earliest dip nearly as deep as the
    // deepest. A shallower dip at half the period is the upper octave, which a
    // looser threshold alone would accept.
    const deepest = Math.min(...dips.map((lag) => difference[lag]), Infinity);
    if (deepest <= PERIODIC_SCORE) chosen = dips.find((lag) => difference[lag] <= deepest * 1.15 + 0.01);
  }
  if (chosen === undefined) return null;
  const lag = chosen;
  const score = difference[lag];
  const left = difference[lag - 1];
  const right = difference[lag + 1];
  const denominator = left - 2 * score + right;
  const shift = Math.abs(denominator) > 1e-8 ? Math.max(-0.5, Math.min(0.5, (left - right) / (2 * denominator))) : 0;
  return { frequencyHz: rate / (lag + shift), confidence: 1 - score };
}

/** In-place radix-2 FFT of a power-of-two length. */
function fft(real: Float64Array, imag: Float64Array) {
  const size = real.length;
  for (let index = 1, swap = 0; index < size; index += 1) {
    let bit = size >> 1;
    for (; swap & bit; bit >>= 1) swap ^= bit;
    swap ^= bit;
    if (index < swap) {
      [real[index], real[swap]] = [real[swap], real[index]];
      [imag[index], imag[swap]] = [imag[swap], imag[index]];
    }
  }
  for (let length = 2; length <= size; length <<= 1) {
    const angle = (-2 * Math.PI) / length;
    for (let start = 0; start < size; start += length) {
      for (let offset = 0; offset < length / 2; offset += 1) {
        const cos = Math.cos(angle * offset);
        const sin = Math.sin(angle * offset);
        const a = start + offset;
        const b = a + length / 2;
        const re = real[b] * cos - imag[b] * sin;
        const im = real[b] * sin + imag[b] * cos;
        real[b] = real[a] - re;
        imag[b] = imag[a] - im;
        real[a] += re;
        imag[a] += im;
      }
    }
  }
}

/**
 * Does this frame sound like one note at `frequencyHz`?
 *
 * Two checks a period search cannot make. Two strings ringing together can
 * share a low common period (E4 with B3 repeats at E2) that has no energy at
 * its own fundamental or second harmonic. Two strings a small interval apart
 * can produce a convincing period between them whose harmonics carry almost
 * none of the sound. A real note has energy at its first or second harmonic,
 * and most of the frame's energy sits on its harmonics.
 */
export function soundsLikeOneNote(samples: Float32Array, sampleRate: number, frequencyHz: number): boolean {
  const size = 1 << Math.floor(Math.log2(samples.length));
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let index = 0; index < size; index += 1) real[index] = samples[index] * (0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (size - 1)));
  fft(real, imag);
  const binHz = sampleRate / size;
  const power = (bin: number) => real[bin] * real[bin] + imag[bin] * imag[bin];
  const low = Math.max(1, Math.floor(60 / binHz));
  const high = Math.min(size / 2 - 1, Math.ceil(5_000 / binHz));
  let total = 0;
  for (let bin = low; bin <= high; bin += 1) total += power(bin);
  if (total <= 0) return false;
  const harmonicEnergy: number[] = [];
  const counted = new Set<number>();
  for (let harmonic = 1; harmonic * frequencyHz <= 5_000 && harmonic <= 12; harmonic += 1) {
    const centre = Math.round((harmonic * frequencyHz) / binHz);
    // Stiff strings sharpen upper harmonics a little, so allow a wider window above the fourth.
    const width = harmonic > 4 ? 3 : 2;
    let energy = 0;
    for (let bin = centre - width; bin <= centre + width; bin += 1) {
      if (bin < low || bin > high || counted.has(bin)) continue;
      counted.add(bin);
      energy += power(bin);
    }
    harmonicEnergy.push(energy);
  }
  const onHarmonics = harmonicEnergy.reduce((sum, value) => sum + value, 0);
  const fundamentalOrOctave = (harmonicEnergy[0] ?? 0) + (harmonicEnergy[1] ?? 0);
  return fundamentalOrOctave >= onHarmonics * 0.15 && onHarmonics >= total * 0.55;
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
    if (rms < QUIET_RMS) {
      quiet += 1;
      continue;
    }
    if (peak >= 0.985 || rms > 0.7) {
      clipped += 1;
      continue;
    }
    // A frame counts only if it has a period and sounds like one note at it.
    const estimate = estimateFramePitch(frame.samples, sampleRate);
    if (estimate && soundsLikeOneNote(frame.samples, sampleRate, estimate.frequencyHz)) {
      frequencies.push(estimate.frequencyHz);
      confidences.push(estimate.confidence);
    }
  }
  if (quiet > frames.length / 2) return { status: "uncertain", reason: "quiet" };
  if (clipped > frames.length / 4) return { status: "uncertain", reason: "clipped" };
  // A decaying string becomes unreadable in a noisy room, so the requirement is a
  // solid run of readable frames rather than a share of the whole window.
  if (frequencies.length < Math.max(MIN_PERIODIC_FRAMES, Math.ceil(frames.length * 0.4))) {
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
