/**
 * SYNTHETIC, REALISTIC MICROPHONE INPUT FOR THE TEMPORARY PITCH CHECKS.
 *
 * Test support only: nothing in the app imports this module. It stands in for
 * a guitar in a room until George's real-input checks exist, so the detectors
 * can be tuned against more than clean sine waves. It models:
 *
 * - a plucked steel string: harmonics with stiffness (inharmonicity), pluck
 *   position, per-harmonic decay, an attack transient and a player's release;
 * - the room and phone: background noise at a chosen signal-to-noise ratio,
 *   mains hum, a small Schroeder reverb, automatic gain control that pumps,
 *   overload clipping and latency between the request and the first note;
 * - the capture loop in PitchCheck.tsx: an AnalyserNode window of 4096 samples
 *   read every ~90 ms (with timer jitter) from 300 ms after the microphone
 *   opens until the check's duration.
 *
 * Everything is seeded, so a scenario produces the same samples on every run.
 */
import type { TimedAudioFrame } from "./pitchAssessment";

export const SAMPLE_RATE = 48_000;
const FFT_SIZE = 4096;

export function midiHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** Park–Miller generator: deterministic, adequate for noise. */
export function seeded(seed: number): () => number {
  let state = Math.max(1, Math.floor(seed)) % 2_147_483_647;
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return state / 2_147_483_647;
  };
}

export interface PluckedNote {
  midi: number;
  /** When the string is struck, in ms from the microphone opening. */
  atMs: number;
  /** How long the player lets it ring before stopping it; Infinity lets it decay naturally. */
  holdMs: number;
  /** Tuning error of the instrument or a bent string, in cents. */
  detuneCents?: number;
  /** Seconds for the fundamental to fall by 1/e: ~1.2 acoustic, ~2.5 electric, ~0.12 palm-muted. */
  decaySeconds?: number;
  /** Peak level before room and gain, about 0.3 for an ordinary pluck. */
  level?: number;
  /** Fraction along the string where it is plucked; shapes the harmonics. */
  pluckPosition?: number;
  /** String stiffness coefficient B: plain steel strings sit near 1e-4. */
  inharmonicity?: number;
}

export interface RoomConditions {
  /** Signal-to-noise ratio of broadband background noise, in dB. Omit for a quiet room. */
  snrDb?: number;
  /** Mains hum level (50 Hz and harmonics) relative to the note's peak. */
  humLevel?: number;
  /** Reverberation mix from 0 (dry) to about 0.5 (a bright bathroom). */
  reverb?: number;
  /** Automatic gain control that lifts quiet input and pulls back after an attack. */
  autoGain?: boolean;
  /** Gain applied before the converter; values above about 2.5 overload ordinary plucks. */
  inputGain?: number;
  seed?: number;
}

export interface CaptureOptions {
  durationMs: number;
  /** Timer interval of the capture loop. */
  intervalMs?: number;
  /** Largest random lateness of each timer callback. */
  jitterMs?: number;
  /** A stalled tab: one callback arrives this late. */
  stallMs?: number;
  seed?: number;
}

function renderNote(out: Float32Array, note: PluckedNote, random: () => number) {
  const f0 = midiHz(note.midi) * 2 ** ((note.detuneCents ?? 0) / 1200);
  const decay = note.decaySeconds ?? 1.4;
  const level = note.level ?? 0.3;
  const pluck = note.pluckPosition ?? 0.17;
  const stiffness = note.inharmonicity ?? 1e-4;
  const start = Math.round((note.atMs / 1000) * SAMPLE_RATE);
  const releaseAt = Number.isFinite(note.holdMs) ? start + Math.round((note.holdMs / 1000) * SAMPLE_RATE) : Infinity;
  const harmonics: { frequency: number; amplitude: number; decay: number; phase: number }[] = [];
  for (let n = 1; n <= 16; n += 1) {
    const frequency = n * f0 * Math.sqrt(1 + stiffness * n * n);
    if (frequency > 9_000) break;
    const amplitude = Math.abs(Math.sin(Math.PI * n * pluck)) / n ** 1.1;
    harmonics.push({ frequency, amplitude, decay: decay / (1 + 0.22 * (n - 1)), phase: random() * 2 * Math.PI });
  }
  const norm = harmonics.reduce((sum, item) => sum + item.amplitude, 0);
  const end = Math.min(
    out.length,
    Number.isFinite(releaseAt) ? releaseAt + Math.round(0.25 * SAMPLE_RATE) : out.length,
  );
  const first = Math.max(0, start);
  if (end <= first) return;
  const voice = new Float32Array(end - first);
  // Each harmonic is a decaying phasor advanced by one complex multiplication per
  // sample, which keeps a scenario fast enough to run hundreds in a test file.
  for (const harmonic of harmonics) {
    const step = (2 * Math.PI * harmonic.frequency) / SAMPLE_RATE;
    const damping = Math.exp(-1 / (harmonic.decay * SAMPLE_RATE));
    const cos = Math.cos(step) * damping;
    const sin = Math.sin(step) * damping;
    let re = (Math.cos(harmonic.phase) * harmonic.amplitude * level) / norm;
    let im = (Math.sin(harmonic.phase) * harmonic.amplitude * level) / norm;
    for (let index = 0; index < voice.length; index += 1) {
      voice[index] += im;
      const next = re * cos - im * sin;
      im = re * sin + im * cos;
      re = next;
    }
  }
  for (let index = 0; index < voice.length; index += 1) {
    const sample = first + index;
    const t = (sample - start) / SAMPLE_RATE;
    // A 4 ms rise, a 12 ms scrape of pick noise, and a quick damping once the player stops the string.
    let value = voice[index];
    if (t < 0.004) value *= t / 0.004;
    if (t < 0.012) value += (random() - 0.5) * level * 0.6 * (1 - t / 0.012);
    if (sample >= releaseAt) value *= Math.exp(-((sample - releaseAt) / SAMPLE_RATE) / 0.018);
    out[sample] += value;
  }
}

/** Four parallel combs and two all-passes: enough to blur gaps and smear pitch like a small room. */
function applyReverb(signal: Float32Array, mix: number) {
  if (mix <= 0) return;
  const combDelays = [1557, 1617, 1491, 1422].map((samples) => Math.round((samples * SAMPLE_RATE) / 44_100));
  const wet = new Float32Array(signal.length);
  for (const delay of combDelays) {
    const buffer = new Float32Array(delay);
    let position = 0;
    for (let index = 0; index < signal.length; index += 1) {
      const output = buffer[position];
      buffer[position] = signal[index] + output * 0.78;
      wet[index] += output / combDelays.length;
      position = (position + 1) % delay;
    }
  }
  for (const delay of [225, 556]) {
    const buffer = new Float32Array(delay);
    let position = 0;
    for (let index = 0; index < wet.length; index += 1) {
      const delayed = buffer[position];
      const input = wet[index];
      const output = -input + delayed;
      buffer[position] = input + delayed * 0.5;
      wet[index] = output;
      position = (position + 1) % delay;
    }
  }
  for (let index = 0; index < signal.length; index += 1)
    signal[index] = signal[index] * (1 - mix) + wet[index] * mix * 2.2;
}

/** A phone's automatic gain: aims for a steady loudness, attacking in ~40 ms and releasing over ~600 ms. */
function applyAutoGain(signal: Float32Array) {
  let envelope = 0.02;
  let gain = 1;
  const attack = Math.exp(-1 / (0.04 * SAMPLE_RATE));
  const release = Math.exp(-1 / (0.6 * SAMPLE_RATE));
  for (let index = 0; index < signal.length; index += 1) {
    const level = Math.abs(signal[index]);
    envelope = level > envelope ? level + (envelope - level) * attack : level + (envelope - level) * release;
    const wanted = Math.min(8, 0.25 / Math.max(envelope, 0.004));
    gain += (wanted - gain) * (wanted < gain ? 0.002 : 0.00002);
    signal[index] *= gain;
  }
}

/** The whole microphone signal for one check: notes, room, phone processing and converter. */
export function renderInput(notes: readonly PluckedNote[], room: RoomConditions, durationMs: number): Float32Array {
  const random = seeded(room.seed ?? 7);
  const length = Math.round((durationMs / 1000) * SAMPLE_RATE) + FFT_SIZE;
  const signal = new Float32Array(length);
  for (const note of notes) renderNote(signal, note, random);
  applyReverb(signal, room.reverb ?? 0);
  const peak = notes.reduce((max, note) => Math.max(max, note.level ?? 0.3), 0) || 0.3;
  if (room.humLevel) {
    for (let index = 0; index < length; index += 1) {
      const t = index / SAMPLE_RATE;
      signal[index] +=
        peak *
        room.humLevel *
        (Math.sin(2 * Math.PI * 50 * t) +
          0.5 * Math.sin(2 * Math.PI * 100 * t) +
          0.3 * Math.sin(2 * Math.PI * 150 * t));
    }
  }
  if (room.snrDb !== undefined) {
    // Noise power is set against the loudest note's average power over its first half second.
    const noiseRms = (peak / Math.SQRT2 / 2) * 10 ** (-room.snrDb / 20);
    let pink = 0;
    for (let index = 0; index < length; index += 1) {
      const white = (random() - 0.5) * Math.sqrt(12);
      pink = 0.97 * pink + 0.03 * white * 4;
      signal[index] += noiseRms * (0.6 * white + 0.4 * pink);
    }
  } else {
    // A quiet room still has a faint floor.
    for (let index = 0; index < length; index += 1) signal[index] += (random() - 0.5) * 0.0008;
  }
  if (room.autoGain) applyAutoGain(signal);
  const gain = room.inputGain ?? 1;
  for (let index = 0; index < length; index += 1) signal[index] = Math.max(-1, Math.min(1, signal[index] * gain));
  return signal;
}

/** Reads the signal the way PitchCheck's timer reads its AnalyserNode. */
export function captureFrames(signal: Float32Array, options: CaptureOptions): TimedAudioFrame[] {
  const random = seeded(options.seed ?? 11);
  const interval = options.intervalMs ?? 90;
  const jitter = options.jitterMs ?? 12;
  const frames: TimedAudioFrame[] = [];
  let stalled = false;
  for (let tick = interval; ; tick += interval) {
    let now = tick + random() * jitter;
    if (options.stallMs && !stalled && now > options.durationMs / 2) {
      now += options.stallMs;
      tick += options.stallMs;
      stalled = true;
    }
    if (now >= options.durationMs + jitter) break;
    if (now < 300) continue;
    const end = Math.min(signal.length, Math.round((now / 1000) * SAMPLE_RATE));
    const samples = new Float32Array(FFT_SIZE);
    samples.set(signal.subarray(Math.max(0, end - FFT_SIZE), end), Math.max(0, FFT_SIZE - end));
    frames.push({ atMs: now, samples });
    if (now >= options.durationMs) break;
  }
  return frames;
}

/** Adds a second string ringing at the same time, as when a neighbour is brushed. */
export function withSecondString(notes: readonly PluckedNote[], midiOffset: number, level = 0.8): PluckedNote[] {
  return notes.flatMap((note) => [
    note,
    { ...note, midi: note.midi + midiOffset, level: (note.level ?? 0.3) * level, pluckPosition: 0.23 },
  ]);
}
