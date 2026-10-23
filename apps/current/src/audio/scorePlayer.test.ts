import { afterEach, describe, expect, it, vi } from "vitest";
import { score } from "../core/score/build";
import { forgetScoreAudio, passPlan, startScorePlayback, type ScorePlaybackOptions } from "./scorePlayer";

const DRAFT = { author: "agent-drafted", reviewer: "", reviewStatus: "draft" as const, reviewedAt: null };

const study = score({
  id: "player-test",
  version: 1,
  title: "Player test",
  provenance: DRAFT,
  key: "A minor",
  metre: "4/4",
  bars: 1,
  tempo: [40, 60, 90],
  voices: { line: { label: "Line", text: "q 3:2 q 3:4[h] h r" } },
});

interface Started {
  kind: "buffer" | "oscillator";
  at: number;
  stop: ReturnType<typeof vi.fn>;
  detune?: { calls: Array<[string, number, number]> };
}

function fakeAudio() {
  const started: Started[] = [];
  const param = () => {
    const calls: Array<[string, number, number]> = [];
    return {
      value: 0,
      calls,
      setValueAtTime: (value: number, at: number) => calls.push(["set", value, at]),
      linearRampToValueAtTime: (value: number, at: number) => calls.push(["ramp", value, at]),
      exponentialRampToValueAtTime: (value: number, at: number) => calls.push(["exp", value, at]),
      setTargetAtTime: (value: number, at: number) => calls.push(["target", value, at]),
    };
  };
  const node = () => ({ connect: vi.fn() });
  const instances: { currentTime: number }[] = [];
  class FakeAudioContext {
    currentTime = 5;
    constructor() {
      instances.push(this);
    }
    sampleRate = 8000;
    destination = {};
    resume = vi.fn(async () => undefined);
    createGain() {
      return { ...node(), gain: param() };
    }
    createBiquadFilter() {
      return { ...node(), type: "", frequency: param(), Q: param(), gain: param() };
    }
    createDynamicsCompressor() {
      return { ...node(), threshold: param(), ratio: param() };
    }
    createBuffer(_channels: number, length: number) {
      const data = new Float32Array(length);
      return { getChannelData: () => data };
    }
    createBufferSource() {
      const detune = param();
      const entry: Started = { kind: "buffer", at: -1, stop: vi.fn(), detune };
      return {
        ...node(),
        buffer: null,
        detune,
        start: (at: number) => {
          entry.at = at;
          started.push(entry);
        },
        stop: entry.stop,
        onended: null,
      };
    }
    createOscillator() {
      const entry: Started = { kind: "oscillator", at: -1, stop: vi.fn() };
      return {
        ...node(),
        type: "",
        frequency: param(),
        start: (at: number) => {
          entry.at = at;
          started.push(entry);
        },
        stop: entry.stop,
        onended: null,
      };
    }
  }
  const intervals: Array<() => void> = [];
  vi.stubGlobal("AudioContext", FakeAudioContext);
  vi.stubGlobal("window", {
    setInterval: (fn: () => void) => intervals.push(fn),
    clearInterval: vi.fn(),
    requestAnimationFrame: vi.fn(() => 1),
    cancelAnimationFrame: vi.fn(),
    setTimeout: vi.fn(),
    clearTimeout: vi.fn(),
  });
  /** Move the audio clock on and let the scheduler look ahead again. */
  const advance = (to: number) => {
    for (const instance of instances) instance.currentTime = to;
    intervals.forEach((fn) => fn());
  };
  return { started, advance };
}

const options: ScorePlaybackOptions = {
  tempo: 60,
  fromTick: 0,
  toTick: 192,
  mode: "reference",
  loop: false,
  countIn: true,
  click: true,
};

describe("score playback on the audio clock", () => {
  afterEach(() => {
    forgetScoreAudio();
    vi.unstubAllGlobals();
  });

  it("plans which passes sound the model and which are the learner's turn", () => {
    expect([0, 1, 2].map((pass) => passPlan("guided", pass).model)).toEqual([true, false, true]);
    expect(passPlan("count-only", 0)).toEqual({ model: false, click: true, yourTurn: true });
    expect(passPlan("unaided", 0)).toEqual({ model: false, click: false, yourTurn: true });
  });

  it("counts in one bar, then starts each string sound at its exact time, with the hammer-on as a pitch change", async () => {
    const { started, advance } = fakeAudio();
    await startScorePlayback(study, options, vi.fn(), vi.fn());
    advance(8.9);
    const clicks = started.filter((entry) => entry.kind === "oscillator").map((entry) => entry.at);
    const strings = started.filter((entry) => entry.kind === "buffer");
    // Count-in at 5.1, 6.1, 7.1, 8.1; music from 9.1 with a click each beat.
    expect(clicks.slice(0, 5).map((at) => Number(at.toFixed(3)))).toEqual([5.1, 6.1, 7.1, 8.1, 9.1]);
    expect(strings.map((entry) => Number(entry.at.toFixed(3)))).toEqual([9.1]);
    expect(strings[0].detune?.calls).toContainEqual(["set", 200, expect.closeTo(10.108)]);
  });

  it("plays only the click on the learner's turn and nothing at all when unaided", async () => {
    const guided = fakeAudio();
    await startScorePlayback(study, { ...options, mode: "guided" }, vi.fn(), vi.fn());
    guided.advance(8.9);
    guided.advance(12.9);
    expect(guided.started.filter((entry) => entry.kind === "buffer")).toHaveLength(1);
    // The second pass is the learner's: four clicks from 13.1, no string sounds.
    expect(
      guided.started
        .filter((entry) => entry.kind === "oscillator" && entry.at >= 13)
        .map((entry) => Number(entry.at.toFixed(2))),
    ).toEqual([13.1, 14.1, 15.1, 16.1]);
    forgetScoreAudio();
    vi.unstubAllGlobals();
    const unaided = fakeAudio();
    await startScorePlayback(study, { ...options, mode: "unaided" }, vi.fn(), vi.fn());
    unaided.advance(8.9);
    expect(unaided.started.filter((entry) => entry.kind === "buffer")).toHaveLength(0);
    expect(
      unaided.started.filter((entry) => entry.kind === "oscillator").map((entry) => Number(entry.at.toFixed(2))),
    ).toEqual([5.1, 6.1, 7.1, 8.1]);
  });

  it("stops every scheduled sound, refuses a tempo outside the practice range, and lets a new player replace the old", async () => {
    const { started } = fakeAudio();
    const interrupted = vi.fn();
    const stop = await startScorePlayback(study, options, vi.fn(), vi.fn(), interrupted);
    stop();
    expect(started.every((entry) => entry.stop.mock.calls.length > 0)).toBe(true);
    await expect(startScorePlayback(study, { ...options, tempo: 120 }, vi.fn(), vi.fn())).rejects.toThrow(
      /practice range/,
    );
    await startScorePlayback(study, options, vi.fn(), vi.fn(), interrupted);
    await startScorePlayback(study, options, vi.fn(), vi.fn());
    expect(interrupted).toHaveBeenCalledTimes(1);
  });
});
