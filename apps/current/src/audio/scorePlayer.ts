/**
 * PLAYING A SCORE ON THE AUDIO CLOCK.
 *
 * Every sound and click is scheduled against AudioContext.currentTime a short
 * way ahead, and the playhead reads that same clock, so what is highlighted is
 * what is sounding. Count-in, looping, tempo and stop are supported; starting
 * this player stops any other music in the tab (transport.ts).
 *
 * Modes, matching the lesson steps:
 *   reference   the model, with an optional click
 *   guided      model, then a "your turn" pass with only the click, alternating
 *   count-only  the click alone, for playing beside the count
 *   unaided     one count-in, then silence while the learner plays
 *
 * Accompaniment parts (other guitars in a piece) sound in every pass, model
 * or your turn, a little quieter than the model: the learner plays along.
 */
import { performScore, pulses, secondsAt, tickAt, type Sound } from "../core/score/perform";
import { ensembleProblems } from "../core/score/ensemble";
import { metreInfo } from "../core/score/time";
import type { Score } from "../core/score/types";
import { stopAudio } from "./engine";
import { renderPluck } from "./pluck";
import { releaseTransport, replaceTransport } from "./transport";

export type ScorePlaybackMode = "reference" | "guided" | "count-only" | "unaided";

export interface ScorePlaybackOptions {
  tempo: number;
  fromTick: number;
  toTick: number;
  mode: ScorePlaybackMode;
  loop: boolean;
  /** One bar of clicks before the music. */
  countIn: boolean;
  /** Clicks under the model in reference mode. */
  click: boolean;
  /** Other parts of the piece, played in every pass so the learner plays along. */
  accompaniment?: readonly Score[];
}

export interface ScorePlaybackProgress {
  phase: "count-in" | "reference" | "your-turn";
  /** Notated tick under the playhead, or null during the count-in. */
  tick: number | null;
  /** 1-based count within the bar. */
  count: number;
  pass: number;
}

const LOOKAHEAD = 0.35;
const INTERVAL_MS = 50;
const RELEASE = 0.04;
/** Accompaniment sits a little under the learner's part. */
const ACCOMPANIMENT_LEVEL = 0.75;

let shared: AudioContext | null = null;
let bus: AudioNode | null = null;
let currentStop: (() => void) | null = null;
let generation = 0;
const bufferCache = new Map<string, AudioBuffer>();

function context(): AudioContext {
  shared ??= new AudioContext();
  return shared;
}

/** A shared output with a little body resonance and a limiter, so a six-string strum never clips. */
function output(audio: AudioContext): AudioNode {
  if (bus) return bus;
  const master = audio.createGain();
  master.gain.value = 0.9;
  const body = audio.createBiquadFilter();
  body.type = "peaking";
  body.frequency.value = 110;
  body.Q.value = 1.1;
  body.gain.value = 3;
  const air = audio.createBiquadFilter();
  air.type = "highshelf";
  air.frequency.value = 4200;
  air.gain.value = -5;
  const limiter = audio.createDynamicsCompressor();
  limiter.threshold.value = -10;
  limiter.ratio.value = 6;
  master.connect(body);
  body.connect(air);
  air.connect(limiter);
  limiter.connect(audio.destination);
  bus = master;
  return bus;
}

function bufferFor(audio: AudioContext, sound: Sound): AudioBuffer {
  const seconds = Math.min(6, Math.ceil((sound.duration + 0.3) * 4) / 4);
  const velocity = Math.round(sound.velocity * 8) / 8;
  const key = `${sound.midi}|${sound.kind}|${sound.string}|${velocity}|${seconds}|${audio.sampleRate}`;
  const cached = bufferCache.get(key);
  if (cached) {
    bufferCache.delete(key);
    bufferCache.set(key, cached);
    return cached;
  }
  const samples = renderPluck(
    { midi: sound.midi, seconds, kind: sound.kind, string: sound.string, velocity },
    audio.sampleRate,
  );
  const buffer = audio.createBuffer(1, samples.length, audio.sampleRate);
  buffer.getChannelData(0).set(samples);
  bufferCache.set(key, buffer);
  if (bufferCache.size > 96) bufferCache.delete(bufferCache.keys().next().value!);
  return buffer;
}

function scheduleSound(audio: AudioContext, sound: Sound, start: number, nodes: Set<AudioScheduledSourceNode>) {
  const source = audio.createBufferSource();
  source.buffer = bufferFor(audio, sound);
  const at = start + sound.time;
  // Glides move the ringing string's pitch: hammer-ons, pull-offs, slides and bends.
  source.detune.setValueAtTime(0, at);
  let held = 0;
  for (const glide of sound.glides) {
    const cents = (glide.to - sound.midi) * 100;
    source.detune.setValueAtTime(held, Math.max(at, start + glide.at));
    if (glide.time <= 0.01) source.detune.setValueAtTime(cents, Math.max(at, start + glide.at + glide.time));
    else source.detune.linearRampToValueAtTime(cents, Math.max(at, start + glide.at + glide.time));
    held = cents;
  }
  const envelope = audio.createGain();
  const end = at + sound.duration;
  envelope.gain.setValueAtTime(1, at);
  envelope.gain.setTargetAtTime(0, end, RELEASE / 3);
  source.connect(envelope);
  envelope.connect(output(audio));
  if (sound.vibratoFrom !== undefined && sound.vibratoFrom < sound.time + sound.duration) {
    const wobble = audio.createOscillator();
    const depth = audio.createGain();
    wobble.frequency.value = 5.5;
    depth.gain.setValueAtTime(0, start + sound.vibratoFrom);
    depth.gain.linearRampToValueAtTime(28, start + sound.vibratoFrom + 0.15);
    wobble.connect(depth);
    depth.connect(source.detune);
    wobble.start(start + sound.vibratoFrom);
    wobble.stop(end + RELEASE * 2);
    nodes.add(wobble);
    wobble.onended = () => nodes.delete(wobble);
  }
  source.start(at);
  source.stop(end + RELEASE * 3);
  nodes.add(source);
  source.onended = () => nodes.delete(source);
}

function scheduleClick(
  audio: AudioContext,
  at: number,
  accented: boolean,
  quiet: boolean,
  nodes: Set<AudioScheduledSourceNode>,
) {
  const tick = audio.createOscillator();
  const envelope = audio.createGain();
  tick.type = "triangle";
  tick.frequency.setValueAtTime(accented ? 1660 : 1250, at);
  const level = (accented ? 0.16 : 0.1) * (quiet ? 0.55 : 1);
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.exponentialRampToValueAtTime(level, at + 0.002);
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
  tick.connect(envelope);
  envelope.connect(audio.destination);
  tick.start(at);
  tick.stop(at + 0.06);
  nodes.add(tick);
  tick.onended = () => nodes.delete(tick);
}

/** Test seam: forget the shared context so each test can supply its own fake. */
export function forgetScoreAudio(): void {
  stopScorePlayback();
  shared = null;
  bus = null;
  bufferCache.clear();
}

export function stopScorePlayback(): void {
  generation++;
  currentStop?.();
}

/** Which passes sound the model, and which are the learner's turn. */
export function passPlan(mode: ScorePlaybackMode, pass: number): { model: boolean; click: boolean; yourTurn: boolean } {
  if (mode === "reference") return { model: true, click: true, yourTurn: false };
  if (mode === "guided")
    return pass % 2 === 0
      ? { model: true, click: true, yourTurn: false }
      : { model: false, click: true, yourTurn: true };
  if (mode === "count-only") return { model: false, click: true, yourTurn: true };
  return { model: false, click: false, yourTurn: true };
}

export async function startScorePlayback(
  score: Score,
  options: ScorePlaybackOptions,
  onProgress: (progress: ScorePlaybackProgress) => void,
  onComplete: () => void,
  onInterrupted?: () => void,
): Promise<() => void> {
  stopScorePlayback();
  stopAudio();
  const mine = ++generation;
  const audio = context();
  await audio.resume();
  if (mine !== generation) return () => undefined;
  if (typeof document !== "undefined" && document.hidden)
    throw new Error("Return to this tab before starting playback.");
  if (!Number.isFinite(options.tempo) || options.tempo < score.tempo.minimum || options.tempo > score.tempo.maximum)
    throw new Error("Tempo is outside this study's practice range.");
  const accompaniment = options.accompaniment ?? [];
  const mismatched = ensembleProblems(score, accompaniment);
  if (mismatched.length) throw new Error(`These parts cannot play together: ${mismatched.join(" ")}`);

  const info = metreInfo(score.metre);
  const beatSeconds = 60 / options.tempo;
  const countInSeconds = options.countIn || options.mode === "unaided" ? info.beatsPerBar * beatSeconds : 0;
  const passSeconds =
    secondsAt(score, options.toTick, options.tempo) - secondsAt(score, options.fromTick, options.tempo);
  const sounds = performScore(score, { tempo: options.tempo, fromTick: options.fromTick, toTick: options.toTick });
  const backing = accompaniment.flatMap((part) =>
    performScore(part, { tempo: options.tempo, fromTick: options.fromTick, toTick: options.toTick }).map((sound) => ({
      ...sound,
      velocity: sound.velocity * ACCOMPANIMENT_LEVEL,
    })),
  );
  const clicks = pulses(score, { tempo: options.tempo, fromTick: options.fromTick, toTick: options.toTick });
  const passes = options.loop ? Infinity : options.mode === "guided" ? 2 : 1;
  const start = audio.currentTime + 0.1;
  const musicStart = start + countInSeconds;
  const nodes = new Set<AudioScheduledSourceNode>();
  let countInScheduled = false;
  let nextPass = 0;
  let timer = 0;
  let frame = 0;
  let stopped = false;

  const schedule = () => {
    if (stopped) return;
    const horizon = audio.currentTime + LOOKAHEAD;
    if (!countInScheduled) {
      for (let beat = 0; beat < Math.round(countInSeconds / beatSeconds); beat++)
        scheduleClick(audio, start + beat * beatSeconds, beat === 0, false, nodes);
      countInScheduled = true;
    }
    while (nextPass < passes) {
      const passStart = musicStart + nextPass * passSeconds;
      if (passStart > horizon) break;
      const plan = passPlan(options.mode, nextPass);
      if (plan.click && (options.click || options.mode !== "reference"))
        for (const pulse of clicks) scheduleClick(audio, passStart + pulse.time, pulse.accented, plan.model, nodes);
      if (plan.model) for (const sound of sounds) scheduleSound(audio, sound, passStart, nodes);
      for (const sound of backing) scheduleSound(audio, sound, passStart, nodes);
      nextPass++;
    }
  };
  const stop = () => {
    if (stopped) return;
    stopped = true;
    window.clearInterval(timer);
    window.cancelAnimationFrame(frame);
    for (const node of nodes)
      try {
        node.stop();
      } catch {
        /* Already ended. */
      }
    nodes.clear();
    if (typeof document !== "undefined") document.removeEventListener("visibilitychange", visibilityChanged);
    releaseTransport(externalStop);
    if (currentStop === externalStop) currentStop = null;
  };
  const externalStop = () => {
    stop();
    onInterrupted?.();
  };
  const visibilityChanged = () => {
    if (document.hidden) externalStop();
  };
  const animate = () => {
    if (stopped) return;
    const now = audio.currentTime;
    if (now < musicStart) {
      onProgress({
        phase: "count-in",
        tick: null,
        count: Math.max(1, Math.floor((now - start) / beatSeconds) + 1),
        pass: 0,
      });
    } else {
      const elapsed = now - musicStart;
      const pass = Math.floor(elapsed / passSeconds);
      if (pass >= passes) {
        stop();
        onComplete();
        return;
      }
      const tick = Math.min(
        options.toTick - 1,
        Math.max(options.fromTick, tickAt(score, options.fromTick, elapsed - pass * passSeconds, options.tempo)),
      );
      onProgress({
        phase: passPlan(options.mode, pass).yourTurn ? "your-turn" : "reference",
        tick,
        count: Math.floor((tick % info.ticksPerBar) / info.beatTicks) + 1,
        pass,
      });
    }
    frame = window.requestAnimationFrame(animate);
  };

  // Another start, or any other music in the tab, stops this one and tells its owner.
  currentStop = externalStop;
  replaceTransport(externalStop);
  if (typeof document !== "undefined") document.addEventListener("visibilitychange", visibilityChanged);
  schedule();
  timer = window.setInterval(schedule, INTERVAL_MS);
  frame = window.requestAnimationFrame(animate);
  return stop;
}
