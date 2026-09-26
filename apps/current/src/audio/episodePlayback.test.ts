import { afterEach, describe, expect, it, vi } from "vitest";
import { ONE_NOTE_ANSWER_SHIFT, ONE_NOTE_QUESTION_ANSWER } from "../v8/pilotEpisode";
import {
  playbackCues,
  startEpisodePlayback,
  stopEpisodePlayback,
  type EpisodePlaybackOptions,
} from "./episodePlayback";

const options: EpisodePlaybackOptions = { tempo: 60, section: "whole", mode: "reference", loop: false, pulse: true };

describe("exact episode playback", () => {
  afterEach(() => {
    stopEpisodePlayback();
    vi.unstubAllGlobals();
  });

  it("schedules the authored attacks and deliberate silences from one score", () => {
    const attacks = (material: typeof ONE_NOTE_QUESTION_ANSWER, pass = 0, settings = options) =>
      playbackCues(material, settings, pass)
        .filter((cue) => cue.kind === "note")
        .map((cue) => cue.atBeat);
    expect(attacks(ONE_NOTE_QUESTION_ANSWER)).toEqual([0, 2, 4, 5, 7]);
    expect(attacks(ONE_NOTE_ANSWER_SHIFT)).toEqual([0, 2, 4, 6, 7]);
    expect(attacks(ONE_NOTE_QUESTION_ANSWER, 1, { ...options, mode: "guided" })).toEqual([]);
    expect(playbackCues(ONE_NOTE_QUESTION_ANSWER, { ...options, mode: "unaided" }, 0)).toEqual([]);
    expect(attacks(ONE_NOTE_QUESTION_ANSWER, 0, { ...options, range: { fromBeat: 0, toBeat: 2 } })).toEqual([0]);
  });

  it("anchors count-in and notes to the audio clock, and immediately stops a replaced player", async () => {
    const starts: Array<{ at: number; type: string }> = [];
    const stops: Array<ReturnType<typeof vi.fn>> = [];
    const intervals: Array<() => void> = [];
    class FakeAudioContext {
      static instance: FakeAudioContext;
      currentTime = 10;
      destination = {};
      resume = vi.fn(async () => undefined);
      constructor() {
        FakeAudioContext.instance = this;
      }
      createOscillator() {
        const stop = vi.fn();
        stops.push(stop);
        const source = {
          type: "",
          frequency: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: (at: number) => starts.push({ at, type: source.type }),
          stop,
          onended: null,
        };
        return source;
      }
      createGain() {
        return { gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() };
      }
    }
    vi.stubGlobal("AudioContext", FakeAudioContext);
    vi.stubGlobal("window", {
      setInterval: (fn: () => void) => {
        intervals.push(fn);
        return intervals.length;
      },
      clearInterval: vi.fn(),
      requestAnimationFrame: vi.fn(() => 1),
      cancelAnimationFrame: vi.fn(),
      clearTimeout: vi.fn(),
    });
    const firstStop = await startEpisodePlayback(ONE_NOTE_QUESTION_ANSWER, options, vi.fn(), vi.fn());
    expect(starts).toEqual([10.08, 11.08, 12.08, 13.08].map((at) => ({ at, type: "square" })));
    FakeAudioContext.instance.currentTime = 13.9;
    intervals[0]();
    expect(starts.filter((item) => item.type === "triangle").map((item) => item.at)).toEqual([
      14.08, 16.08, 18.08, 19.08, 21.08,
    ]);
    const secondStop = await startEpisodePlayback(ONE_NOTE_QUESTION_ANSWER, options, vi.fn(), vi.fn());
    expect(stops.slice(0, 17).every((stop) => stop.mock.calls.length > 0)).toBe(true);
    expect(starts.slice(17, 21)).toEqual([13.98, 14.98, 15.98, 16.98].map((at) => ({ at, type: "square" })));
    firstStop();
    secondStop();
    expect(stops.slice(17, 21).every((stop) => stop.mock.calls.length > 0)).toBe(true);
  });
});
