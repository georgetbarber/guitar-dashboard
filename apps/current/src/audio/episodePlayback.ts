import type { MusicalMaterial } from "../v8/structuredMusic";
import { stopAudio } from "./engine";
import { releaseTransport, replaceTransport } from "./transport";

export type PlaybackMode = "reference" | "guided" | "unaided";
export type PlaybackSection = "whole" | "question" | "answer";
export interface EpisodePlaybackOptions {
  tempo: number;
  section: PlaybackSection;
  mode: PlaybackMode;
  loop: boolean;
  pulse: boolean;
  range?: { fromBeat: number; toBeat: number };
}
export interface PlaybackProgress {
  phase: "count-in" | "reference" | "your-turn";
  count: number;
  beat: number | null;
  pass: number;
}
export interface PlaybackCue {
  atBeat: number;
  kind: "click" | "note";
  midi?: number;
  durationBeats?: number;
  accented?: boolean;
}

/** Pure score expansion: the same events supply audio and the visible count grid. */
export function playbackCues(material: MusicalMaterial, options: EpisodePlaybackOptions, pass: number): PlaybackCue[] {
  const section =
    options.range ??
    (options.section === "whole"
      ? { fromBeat: 0, toBeat: material.bars * material.metre.numerator }
      : material.sections.find((item) => item.id === options.section));
  if (!section) throw new Error("Unknown section.");
  const beats = section.toBeat - section.fromBeat;
  const cues: PlaybackCue[] = [];
  const modelSounds = options.mode === "reference" || (options.mode === "guided" && pass % 2 === 0);
  for (let beat = 0; beat < beats; beat++) {
    if (options.pulse && options.mode !== "unaided")
      cues.push({ atBeat: beat, kind: "click", accented: beat % material.metre.numerator === 0 });
  }
  if (modelSounds)
    for (const event of material.events) {
      if (event.kind !== "note" || event.atBeat < section.fromBeat || event.atBeat >= section.toBeat) continue;
      cues.push({
        atBeat: event.atBeat - section.fromBeat,
        kind: "note",
        midi: event.midi,
        durationBeats: Math.min(event.beats, section.toBeat - event.atBeat),
      });
    }
  return cues;
}

let currentStop: (() => void) | null = null;
let startGeneration = 0;
let sharedContext: AudioContext | null = null;

function context(): AudioContext {
  sharedContext ??= new AudioContext();
  return sharedContext;
}

function oscillator(
  audio: AudioContext,
  start: number,
  duration: number,
  midi: number | null,
  accented: boolean,
): OscillatorNode {
  const source = audio.createOscillator();
  const envelope = audio.createGain();
  source.type = midi === null ? "square" : "triangle";
  source.frequency.setValueAtTime(midi === null ? (accented ? 1320 : 960) : 440 * 2 ** ((midi - 69) / 12), start);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(midi === null ? (accented ? 0.1 : 0.065) : 0.15, start + 0.01);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(envelope);
  envelope.connect(audio.destination);
  source.start(start);
  source.stop(start + duration + 0.02);
  return source;
}

export function stopEpisodePlayback(): void {
  startGeneration++;
  currentStop?.();
}

/** Sound is scheduled against AudioContext.currentTime; animation reads that same clock. */
export async function startEpisodePlayback(
  material: MusicalMaterial,
  options: EpisodePlaybackOptions,
  onProgress: (progress: PlaybackProgress) => void,
  onComplete: () => void,
  onInterrupted?: () => void,
): Promise<() => void> {
  stopEpisodePlayback();
  stopAudio();
  const generation = ++startGeneration;
  const audio = context();
  await audio.resume();
  if (generation !== startGeneration) return () => undefined;
  if (typeof document !== "undefined" && document.hidden)
    throw new Error("Return to this tab before starting playback.");

  const secondsPerBeat = 60 / options.tempo;
  const countInBeats = material.metre.numerator;
  const section =
    options.range ??
    (options.section === "whole"
      ? { fromBeat: 0, toBeat: material.bars * material.metre.numerator }
      : material.sections.find((item) => item.id === options.section));
  if (!section) throw new Error("Unknown section.");
  const cycleBeats = section.toBeat - section.fromBeat;
  const start = audio.currentTime + 0.08;
  const nodes = new Set<OscillatorNode>();
  let countInScheduled = false;
  let passToSchedule = 0;
  let timer = 0;
  let frame = 0;
  let stopped = false;
  const passes = options.loop ? Infinity : options.mode === "guided" ? 2 : 1;
  const queue = (cue: PlaybackCue, at: number) => {
    const duration = cue.kind === "click" ? 0.055 : Math.max(0.08, (cue.durationBeats ?? 1) * secondsPerBeat - 0.04);
    const node = oscillator(audio, at, duration, cue.kind === "note" ? cue.midi! : null, Boolean(cue.accented));
    nodes.add(node);
    node.onended = () => nodes.delete(node);
  };
  const schedule = () => {
    if (stopped) return;
    const horizon = audio.currentTime + 0.35;
    if (!countInScheduled) {
      for (let beat = 0; beat < countInBeats; beat++)
        queue({ atBeat: beat, kind: "click", accented: beat === 0 }, start + beat * secondsPerBeat);
      countInScheduled = true;
    }
    while (passToSchedule < passes) {
      const passStart = start + (countInBeats + passToSchedule * cycleBeats) * secondsPerBeat;
      if (passStart > horizon) break;
      for (const cue of playbackCues(material, options, passToSchedule))
        queue(cue, passStart + cue.atBeat * secondsPerBeat);
      passToSchedule++;
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
    if (currentStop === stop) currentStop = null;
  };
  const visibilityChanged = () => {
    if (document.hidden) {
      stop();
      onInterrupted?.();
    }
  };
  const externalStop = () => {
    stop();
    onInterrupted?.();
  };
  const animate = () => {
    if (stopped) return;
    const elapsed = (audio.currentTime - start) / secondsPerBeat;
    if (elapsed < countInBeats)
      onProgress({ phase: "count-in", count: Math.max(1, Math.floor(elapsed) + 1), beat: null, pass: 0 });
    else {
      const within = elapsed - countInBeats;
      const pass = Math.floor(within / cycleBeats);
      if (pass >= passes) {
        stop();
        onComplete();
        return;
      }
      const beat = Math.floor(within % cycleBeats);
      onProgress({
        phase: (options.mode === "guided" && pass % 2 === 1) || options.mode === "unaided" ? "your-turn" : "reference",
        count: (beat % material.metre.numerator) + 1,
        beat: section.fromBeat + beat,
        pass,
      });
    }
    frame = window.requestAnimationFrame(animate);
  };
  currentStop = stop;
  replaceTransport(externalStop);
  if (typeof document !== "undefined") document.addEventListener("visibilitychange", visibilityChanged);
  schedule();
  timer = window.setInterval(schedule, 50);
  frame = window.requestAnimationFrame(animate);
  return stop;
}
