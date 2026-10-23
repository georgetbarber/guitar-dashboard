/**
 * MUSICAL TIME FOR AUTHORED SCORES.
 *
 * Positions and durations are whole ticks: 48 to a quarter note, so eighths
 * (24), sixteenths (12), eighth-note triplets (16), quarter triplets (32) and
 * sixteenth triplets (8) are all exact. Nothing accumulates floating-point
 * drift, and "does this bar add up" is an integer question.
 *
 * Feel is a performance transform applied at playback, not a different
 * notation: swung eighths are written as eighths, as on a real chart.
 */
export const TICKS_PER_QUARTER = 48;

export const DURATION = {
  whole: 192,
  dottedHalf: 144,
  half: 96,
  dottedQuarter: 72,
  quarter: 48,
  quarterTriplet: 32,
  dottedEighth: 36,
  eighth: 24,
  eighthTriplet: 16,
  sixteenth: 12,
  sixteenthTriplet: 8,
} as const;

export type MetreId = "2/4" | "3/4" | "4/4" | "6/8" | "12/8";

export interface MetreInfo {
  id: MetreId;
  /** The felt beat the count and tempo refer to: a quarter, or a dotted quarter in compound time. */
  beatTicks: number;
  beatsPerBar: number;
  ticksPerBar: number;
  compound: boolean;
}

const METRES: Record<MetreId, MetreInfo> = {
  "2/4": { id: "2/4", beatTicks: 48, beatsPerBar: 2, ticksPerBar: 96, compound: false },
  "3/4": { id: "3/4", beatTicks: 48, beatsPerBar: 3, ticksPerBar: 144, compound: false },
  "4/4": { id: "4/4", beatTicks: 48, beatsPerBar: 4, ticksPerBar: 192, compound: false },
  "6/8": { id: "6/8", beatTicks: 72, beatsPerBar: 2, ticksPerBar: 144, compound: true },
  "12/8": { id: "12/8", beatTicks: 72, beatsPerBar: 4, ticksPerBar: 288, compound: true },
};

export const METRE_IDS = Object.keys(METRES) as MetreId[];

export function metreInfo(metre: MetreId): MetreInfo {
  const info = METRES[metre];
  if (!info) throw new Error(`Unsupported metre ${metre}.`);
  return info;
}

/**
 * Feels a learner can hear as different, with fixed, documented ratios.
 * The ratio is the share of each swung pair that the first note takes:
 * 0.5 would be straight; 2/3 is the triplet long–short of a blues shuffle.
 */
export const FEELS = {
  straight: { label: "Straight", unit: null, ratio: 0.5 },
  "swing-8": { label: "Swing eighths", unit: 24, ratio: 0.62 },
  "shuffle-8": { label: "Shuffle", unit: 24, ratio: 2 / 3 },
  "swing-16": { label: "Swung sixteenths", unit: 12, ratio: 0.58 },
} as const;

export type FeelId = keyof typeof FEELS;
export const FEEL_IDS = Object.keys(FEELS) as FeelId[];

/**
 * Where a notated tick is actually played. Within each swung pair the first
 * half is stretched and the second compressed; pair boundaries never move, so
 * beats stay on the click.
 */
export function performedTick(tick: number, feel: FeelId): number {
  const { unit, ratio } = FEELS[feel];
  if (unit === null) return tick;
  const pair = unit * 2;
  const start = Math.floor(tick / pair) * pair;
  const within = tick - start;
  return within <= unit
    ? start + (within / unit) * ratio * pair
    : start + ratio * pair + ((within - unit) / unit) * (1 - ratio) * pair;
}

/** The inverse of performedTick, so a moving playhead can find its place in the written score. */
export function notatedTick(performed: number, feel: FeelId): number {
  const { unit, ratio } = FEELS[feel];
  if (unit === null) return performed;
  const pair = unit * 2;
  const start = Math.floor(performed / pair) * pair;
  const within = performed - start;
  const split = ratio * pair;
  return within <= split
    ? start + (within / split) * unit
    : start + unit + ((within - split) / ((1 - ratio) * pair)) * unit;
}

export function ticksToSeconds(ticks: number, tempo: number, metre: MetreId): number {
  return (ticks / metreInfo(metre).beatTicks) * (60 / tempo);
}

export function secondsToTicks(seconds: number, tempo: number, metre: MetreId): number {
  return (seconds * tempo * metreInfo(metre).beatTicks) / 60;
}

/** Bar (1-based) and count (1-based) for a notated tick, for labels and feedback notes. */
export function barAndCount(tick: number, metre: MetreId): { bar: number; count: number } {
  const info = metreInfo(metre);
  return {
    bar: Math.floor(tick / info.ticksPerBar) + 1,
    count: Math.floor((tick % info.ticksPerBar) / info.beatTicks) + 1,
  };
}
