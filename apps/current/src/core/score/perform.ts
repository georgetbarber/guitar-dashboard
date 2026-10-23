/**
 * FROM WRITTEN EVENTS TO TIMED SOUNDS.
 *
 * A pure function: the same score, tempo and range always give the same list
 * of string sounds, which the synthesiser schedules and the tests inspect.
 * Physical rules apply: a new attack on a string stops what that string was
 * sounding; a hammer-on, pull-off or slide changes the pitch of the string
 * already ringing rather than plucking again; a bend glides to its target.
 *
 * Tempo only reschedules events, so changing it never changes a pitch.
 */
import { metreInfo, notatedTick, performedTick } from "./time";
import type { Fretted, NoteEvent, Score, StringNumber, StrumEvent } from "./types";
import { positionMidi, strumPositions, totalTicks } from "./validate";

export interface Glide {
  /** Seconds from the start of the range. */
  at: number;
  /** Target pitch in MIDI semitones; fractional for a quarter-tone bend. */
  to: number;
  /** Seconds the glide takes. */
  time: number;
}

export interface Sound {
  eventId: string;
  voice: string;
  string: StringNumber;
  fret: number;
  /** Seconds from the start of the range. */
  time: number;
  /** Seconds until the string is damped. */
  duration: number;
  /** Starting pitch. */
  midi: number;
  velocity: number;
  kind: "pluck" | "muted" | "dead";
  glides: Glide[];
  /** Seconds from the start of the range at which vibrato begins. */
  vibratoFrom?: number;
}

export interface PerformOptions {
  tempo: number;
  fromTick?: number;
  toTick?: number;
}

const SPREAD = { tight: 0.006, normal: 0.012, slow: 0.025 } as const;
const LET_RING_TAIL = 1.5;
const DEAD_LENGTH = 0.05;

export function secondsAt(score: Pick<Score, "feel" | "metre">, tick: number, tempo: number): number {
  return (performedTick(tick, score.feel) / metreInfo(score.metre).beatTicks) * (60 / tempo);
}

/** Notated tick sounding `elapsed` seconds after `fromTick`, for a playhead. */
export function tickAt(score: Pick<Score, "feel" | "metre">, fromTick: number, elapsed: number, tempo: number): number {
  const performed = performedTick(fromTick, score.feel) + (elapsed * tempo * metreInfo(score.metre).beatTicks) / 60;
  return notatedTick(performed, score.feel);
}

function velocityFor(event: NoteEvent | StrumEvent): number {
  let velocity = 0.72;
  if (event.art?.accent) velocity = 1;
  if (event.art?.ghost) velocity = 0.32;
  if ((event.kind === "strum" ? event.direction : event.stroke) === "up") velocity *= 0.86;
  return velocity;
}

export function performScore(score: Score, options: PerformOptions): Sound[] {
  const from = options.fromTick ?? 0;
  const to = options.toTick ?? totalTicks(score);
  const tempo = options.tempo;
  const origin = secondsAt(score, from, tempo);
  const time = (tick: number) => secondsAt(score, tick, tempo) - origin;
  const rangeEnd = time(to);

  const sounds: Sound[] = [];
  const ringing = new Map<StringNumber, Sound>();
  const letRing = new Set<Sound>();

  const cut = (string: StringNumber, at: number) => {
    const current = ringing.get(string);
    if (current && current.time + current.duration > at) current.duration = Math.max(0.01, at - current.time);
  };

  const events = score.events
    .filter((event): event is NoteEvent | StrumEvent => event.kind !== "rest" && event.at >= from && event.at < to)
    .sort((a, b) => a.at - b.at);

  for (const event of events) {
    const start = time(event.at) + (event.offsetMs ?? 0) / 1000;
    const end = time(Math.min(event.at + event.dur, to));
    const notated = Math.max(0.02, end - start);
    const art = event.art ?? {};

    if (art.tie) {
      const strings =
        event.kind === "note"
          ? event.notes.map((note) => note.string)
          : strumPositions(event, score).map((p) => p.string);
      for (const string of strings) {
        const sound = ringing.get(string);
        if (!sound) continue;
        if (!letRing.has(sound)) sound.duration = Math.max(sound.duration, end - sound.time - 0.015);
        if (event.kind === "note" && art.bend) bendGlides(sound, art.bend, start, notated);
        if (art.vibrato) sound.vibratoFrom ??= start + notated * 0.2;
      }
      continue;
    }

    if (event.kind === "note" && art.legato) {
      for (const note of event.notes) {
        const sound = ringing.get(note.string);
        if (!sound) continue;
        const target = positionMidi(note);
        const slide = art.legato === "slide" ? Math.min(0.12, Math.max(0.03, (start - sound.time) * 0.4)) : 0.008;
        sound.glides.push({ at: art.legato === "slide" ? start - slide : start, to: target, time: slide });
        sound.fret = note.fret;
        if (!letRing.has(sound)) sound.duration = Math.max(sound.duration, end - sound.time - 0.015);
        if (art.vibrato) sound.vibratoFrom = start + notated * 0.3;
        if (art.bend) bendGlides(sound, art.bend, start, notated);
      }
      continue;
    }

    const positions: Fretted[] =
      event.kind === "strum"
        ? art.dead
          ? deadStrings(event, score)
          : strumPositions(event, score)
        : event.notes.map((note) => note);
    const ordered =
      event.kind === "strum" && event.direction === "up"
        ? [...positions].sort((a, b) => a.string - b.string)
        : [...positions].sort((a, b) => b.string - a.string);
    const spread = event.kind === "strum" ? SPREAD[event.spread ?? "normal"] : 0;
    const velocity = velocityFor(event);
    ordered.forEach((position, index) => {
      const at = start + index * spread;
      cut(position.string, at);
      const kind: Sound["kind"] = art.dead ? "dead" : art.palmMute ? "muted" : "pluck";
      const midi = positionMidi(position);
      let duration = notated - 0.015 - index * spread;
      if (art.staccato) duration = Math.max(0.06, notated * 0.5);
      if (kind === "muted") duration = Math.min(duration, 0.35);
      if (kind === "dead") duration = DEAD_LENGTH;
      const sound: Sound = {
        eventId: event.id,
        voice: event.voice,
        string: position.string,
        fret: position.fret,
        time: at,
        duration: Math.max(0.03, duration),
        midi,
        velocity: event.kind === "strum" ? velocity * (0.82 + 0.18 * (index === 0 ? 1 : 0.6)) : velocity,
        kind,
        glides: [],
      };
      if (event.kind === "note" && art.slideIn) {
        sound.midi = midi + (art.slideIn === "below" ? -2 : 2);
        sound.glides.push({ at, to: midi, time: 0.07 });
      }
      if (event.kind === "note" && art.bend) bendGlides(sound, art.bend, at, notated);
      if (art.vibrato) sound.vibratoFrom = at + notated * 0.3;
      if (art.letRing && kind === "pluck") letRing.add(sound);
      sounds.push(sound);
      ringing.set(position.string, sound);
    });
  }

  // A let-ring note sustains until its string is struck again, or past the range end.
  const nextOnString = (sound: Sound) =>
    sounds
      .filter((other) => other.string === sound.string && other.time > sound.time)
      .reduce<number | null>(
        (earliest, other) => (earliest === null || other.time < earliest ? other.time : earliest),
        null,
      );
  for (const sound of letRing) {
    const next = nextOnString(sound);
    sound.duration = Math.max(sound.duration, (next ?? rangeEnd + LET_RING_TAIL) - sound.time);
  }
  // Re-apply string cuts now that let-ring lengths are final.
  for (const sound of sounds) {
    const next = nextOnString(sound);
    if (next !== null && sound.time + sound.duration > next) sound.duration = Math.max(0.01, next - sound.time);
  }
  return sounds.sort((a, b) => a.time - b.time || b.string - a.string);
}

function bendGlides(sound: Sound, bend: NonNullable<NoteEvent["art"]>["bend"], start: number, notated: number) {
  if (!bend) return;
  const base = sound.glides.length ? sound.glides[sound.glides.length - 1].to : sound.midi;
  const rise = Math.min(0.18, notated * 0.4);
  sound.glides.push({ at: start + Math.min(0.05, notated * 0.1), to: base + bend.semitones, time: rise });
  if (bend.release) sound.glides.push({ at: start + notated * 0.65, to: base, time: Math.min(0.15, notated * 0.25) });
}

function deadStrings(event: StrumEvent, score: Score): Fretted[] {
  const range = event.strings ?? { from: 1, to: 6 };
  const voicing = event.chord ? score.voicings.find((item) => item.id === event.chord) : undefined;
  return ([6, 5, 4, 3, 2, 1] as StringNumber[])
    .filter((string) => string >= range.from && string <= range.to)
    .map((string) => ({ string, fret: voicing?.frets[6 - string] ?? 0 }));
}

export interface Pulse {
  /** Seconds from the start of the range. */
  time: number;
  accented: boolean;
  /** 1-based count within the bar. */
  count: number;
}

/** The click: one per felt beat, accented on each bar's first beat. Beats are never swung. */
export function pulses(
  score: Pick<Score, "metre" | "feel">,
  options: PerformOptions & { fromTick: number; toTick: number },
): Pulse[] {
  const info = metreInfo(score.metre);
  const result: Pulse[] = [];
  const origin = secondsAt(score, options.fromTick, options.tempo);
  for (
    let tick = Math.ceil(options.fromTick / info.beatTicks) * info.beatTicks;
    tick < options.toTick;
    tick += info.beatTicks
  )
    result.push({
      time: secondsAt(score, tick, options.tempo) - origin,
      accented: tick % info.ticksPerBar === 0,
      count: Math.floor((tick % info.ticksPerBar) / info.beatTicks) + 1,
    });
  return result;
}
