/**
 * A PLUCKED STRING, NOT A BEEP.
 *
 * Karplus–Strong synthesis: a burst of shaped noise circulates in a delay
 * line one period long, losing a little brightness on every pass, as a real
 * string loses its upper harmonics first. A first-order all-pass filter
 * supplies the fractional part of the period so high notes stay in tune, and
 * a comb on the excitation stands in for where the pick strikes the string.
 *
 * Each string has its own voice (wound strings are darker and ring longer);
 * palm-muted notes are damped and dull; a dead note is a short, pitchless
 * scratch. Rendering is deterministic for a given input, so tests can measure
 * the tuning and decay of exactly what a learner hears.
 */

export type PluckKind = "pluck" | "muted" | "dead";

export interface PluckSpec {
  midi: number;
  /** Seconds of sound to render, before the caller damps it. */
  seconds: number;
  kind: PluckKind;
  string: 1 | 2 | 3 | 4 | 5 | 6;
  /** 0 to 1. Harder plucks are brighter as well as louder. */
  velocity: number;
}

/** Per-string character, high E first: decay time (s, at the open string) and excitation brightness. */
const STRING_VOICE = [
  { t60: 2.6, brightness: 0.82 },
  { t60: 3.0, brightness: 0.78 },
  { t60: 3.4, brightness: 0.7 },
  { t60: 4.0, brightness: 0.6 },
  { t60: 4.6, brightness: 0.55 },
  { t60: 5.2, brightness: 0.5 },
] as const;

export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** A small deterministic generator, so a rendered note is identical every time. */
function noise(seed: number): () => number {
  let state = (seed * 2654435761) >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) / 4294967296) * 2 - 1;
  };
}

export function renderPluck(spec: PluckSpec, sampleRate: number): Float32Array {
  const length = Math.max(1, Math.round(spec.seconds * sampleRate));
  const output = new Float32Array(length);
  const voice = STRING_VOICE[spec.string - 1];
  const random = noise(Math.round(spec.midi * 131 + spec.string * 17 + spec.velocity * 997));
  const velocity = Math.min(1, Math.max(0.05, spec.velocity));

  if (spec.kind === "dead") {
    // A scratch: filtered noise with a very fast decay and only a hint of the string's register.
    let low = 0;
    let band = 0;
    const lowCoefficient = Math.min(0.5, (2 * Math.PI * 1800) / sampleRate);
    const bandCoefficient = Math.min(0.5, (2 * Math.PI * 160) / sampleRate);
    for (let index = 0; index < length; index++) {
      const envelope = Math.exp(-index / (0.012 * sampleRate));
      low += lowCoefficient * (random() - low);
      band += bandCoefficient * (low - band);
      output[index] = (low - band) * envelope * velocity * 1.6;
    }
    return output;
  }

  const frequency = midiToHz(spec.midi);
  const period = sampleRate / frequency;
  // The averaging loss filter delays half a sample; the all-pass supplies the rest of the fraction.
  const delay = Math.max(2, Math.floor(period - 0.5 - 0.1));
  const fraction = period - 0.5 - delay;
  const allpass = (1 - fraction) / (1 + fraction);

  const muted = spec.kind === "muted";
  const t60 = muted ? 0.22 : voice.t60 * Math.max(0.45, Math.min(1.4, 330 / frequency) ** 0.35);
  const loss = 0.001 ** (1 / (t60 * frequency));
  const brightness = (muted ? 0.28 : voice.brightness) * (0.55 + 0.45 * velocity);

  // Excitation: one period of noise, low-passed by brightness, with a pick-position comb.
  const line = new Float32Array(delay);
  let smooth = 0;
  for (let index = 0; index < delay; index++) {
    smooth += brightness * (random() - smooth);
    line[index] = smooth;
  }
  const pick = Math.max(1, Math.round(delay * 0.13));
  for (let index = delay - 1; index >= pick; index--) line[index] -= line[index - pick];
  let mean = 0;
  for (const value of line) mean += value;
  mean /= delay;
  let peak = 0;
  for (let index = 0; index < delay; index++) {
    line[index] -= mean;
    peak = Math.max(peak, Math.abs(line[index]));
  }
  const scale = peak > 0 ? 1 / peak : 0;
  for (let index = 0; index < delay; index++) line[index] *= scale;

  let pointer = 0;
  let previous = 0;
  let allpassIn = 0;
  let allpassOut = 0;
  for (let index = 0; index < length; index++) {
    const current = line[pointer];
    const averaged = loss * 0.5 * (current + previous);
    previous = current;
    const shifted = allpass * averaged + allpassIn - allpass * allpassOut;
    allpassIn = averaged;
    allpassOut = shifted;
    line[pointer] = shifted;
    output[index] = current;
    pointer = pointer + 1 === delay ? 0 : pointer + 1;
  }

  // Gentle onset and end, so scheduling never clicks.
  const fadeIn = Math.min(length, Math.round(0.0015 * sampleRate));
  for (let index = 0; index < fadeIn; index++) output[index] *= index / fadeIn;
  const fadeOut = Math.min(length, Math.round(0.01 * sampleRate));
  for (let index = 0; index < fadeOut; index++) output[length - 1 - index] *= index / fadeOut;
  const gain = 0.42 * velocity;
  for (let index = 0; index < length; index++) output[index] *= gain;
  return output;
}

/** Root-mean-square level of a slice, for decay tests and level matching. */
export function rms(samples: Float32Array, from = 0, to = samples.length): number {
  let sum = 0;
  for (let index = from; index < to; index++) sum += samples[index] ** 2;
  return Math.sqrt(sum / Math.max(1, to - from));
}
