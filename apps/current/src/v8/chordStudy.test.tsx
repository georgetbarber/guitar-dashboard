// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startVoicingProgression } from "../audio/engine";
import { sharedPositions, timedChords, voicingTab } from "./chordStudy";
import { startChordStudyPlayback } from "./chordStudyPlayback";
import { ChordStudy } from "./components/ChordStudy";
import { COMMON_TONE_CHANGE_DRAFT } from "./phase6Drafts";

vi.mock("../audio/engine", () => ({ startVoicingProgression: vi.fn(() => vi.fn()) }));

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("the unshipped C-to-Am chord study", () => {
  it("projects the exact guitar positions, sounding pitches and shared positions", () => {
    const events = timedChords(COMMON_TONE_CHANGE_DRAFT, "study");
    expect(events.map(({ atBeat, beats, chordId, midis }) => [atBeat, beats, chordId, midis])).toEqual([
      [0, 4, "C", [48, 52, 55, 60, 64]],
      [4, 4, "Am", [45, 52, 57, 60, 64]],
    ]);
    expect(events.map((event) => voicingTab(event.positions))).toEqual(["x32010", "x02210"]);
    expect(sharedPositions(COMMON_TONE_CHANGE_DRAFT)).toEqual([
      { string: 4, fret: 2 },
      { string: 2, fret: 1 },
      { string: 1, fret: 0 },
    ]);
    expect(
      timedChords(COMMON_TONE_CHANGE_DRAFT, "two-count").map((event) => [event.atBeat, event.beats, event.chordId]),
    ).toEqual([
      [0, 2, "C"],
      [2, 2, "Am"],
      [4, 2, "C"],
      [6, 2, "Am"],
    ]);
  });

  it("sends the same timed voicings to the existing audio engine", () => {
    startChordStudyPlayback(COMMON_TONE_CHANGE_DRAFT, "study", 60);
    expect(startVoicingProgression).toHaveBeenCalledWith(
      [
        [48, 52, 55, 60, 64],
        [45, 52, 57, 60, 64],
      ],
      60,
      undefined,
      [4, 4],
    );
    startChordStudyPlayback(COMMON_TONE_CHANGE_DRAFT, "two-count", 60);
    expect(startVoicingProgression).toHaveBeenLastCalledWith(
      [
        [48, 52, 55, 60, 64],
        [45, 52, 57, 60, 64],
        [48, 52, 55, 60, 64],
        [45, 52, 57, 60, 64],
      ],
      60,
      undefined,
      [2, 2, 2, 2],
    );
    expect(() => startChordStudyPlayback(COMMON_TONE_CHANGE_DRAFT, "study", 30)).toThrow(/Tempo/);
  });

  it("renders the chord score, can start its synth guide and conceals names and frets for a check", () => {
    const stop = vi.fn();
    vi.mocked(startVoicingProgression).mockImplementationOnce((_voicings, _tempo, onStep) => {
      onStep?.(0);
      return stop;
    });
    const { container, rerender } = render(<ChordStudy study={COMMON_TONE_CHANGE_DRAFT} />);
    expect(screen.getByText("C → Am common-tone change")).toBeTruthy();
    expect(screen.getByText(/Shared positions: D fret 2 · B fret 1 · high E open/)).toBeTruthy();
    expect(screen.getByRole("img", { name: "C voicing, low E to high E: x32010" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Hear the draft chord guide" }));
    expect(startVoicingProgression).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Stop guide" }));
    expect(stop).toHaveBeenCalledOnce();

    rerender(<ChordStudy study={COMMON_TONE_CHANGE_DRAFT} conceal />);
    expect(container.textContent).not.toContain("C → Am");
    expect(container.textContent).not.toContain("x32010");
    expect(container.textContent).not.toContain("D fret 2");
    expect(screen.getByRole("img", { name: "Change 1 fingering hidden" })).toBeTruthy();
  });
});
