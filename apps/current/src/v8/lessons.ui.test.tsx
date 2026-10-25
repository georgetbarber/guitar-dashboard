// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DEFAULT_STATE, V8StoreProvider, useV8Store } from "./store";
import * as repository from "./repository";
import * as player from "../audio/scorePlayer";
import { LessonPlayer } from "./components/LessonPlayer";
import { ScoreView } from "./components/score/ScoreView";
import { LESSON_CATALOG } from "./lessons/catalog";
import { COMMON_TONE_LESSON } from "./lessons/stage1";
import { THIRD_COLOUR_LESSON } from "./lessons/stage2";
import { FEELS_LESSON } from "./lessons/stage5";
import { scoreById } from "./lessons/format";
import { validateState } from "./validation";
import { localDateAt } from "./dates";
import { activityById } from "./curriculum";
import { recordLessonAnswer } from "./lessonProgress";
import type { V8State } from "./types";

vi.mock("./repository", async (original) => ({
  ...(await original<typeof import("./repository")>()),
  loadWorkspace: vi.fn(),
  savePersistedState: vi.fn(),
  discardIncompleteStaging: vi.fn(),
}));
vi.mock("./cloudFacade", () => ({
  useCloudSync: () => ({
    configured: false,
    user: null,
    status: "local-only",
    message: "Local only.",
    signOut: vi.fn(),
  }),
}));
vi.mock("../audio/scorePlayer", async (original) => ({
  ...(await original<typeof import("../audio/scorePlayer")>()),
  startScorePlayback: vi.fn(),
  stopScorePlayback: vi.fn(),
}));

/** Stands in for the learner adding a chord to their latest sketch in Create. */
function AddChord() {
  const { state, dispatch } = useV8Store();
  const sketch = state.sketches.at(-1);
  return (
    <button
      onClick={() =>
        sketch &&
        dispatch({
          type: "updateSketch",
          sketch: { ...sketch, chords: [{ id: "chord-test", symbol: "G", beats: 4, voicing: [3, 0, 0, 0, 2, 3] }] },
        })
      }
    >
      Add a chord in Create
    </button>
  );
}

function Probe() {
  const { state } = useV8Store();
  return (
    <output data-testid="state">
      {JSON.stringify({
        cursors: state.lessonCursors ?? [],
        attempts: state.lessonAttempts ?? [],
        evidence: state.evidence,
        completed: state.completedActivityIds,
        sketches: state.sketches,
        activeSketchId: state.activeSketchId,
        route: state.route,
      })}
    </output>
  );
}
const probe = () => JSON.parse(screen.getByTestId("state").textContent ?? "{}");
const entry = (id: string) => LESSON_CATALOG.find((item) => item.id === id)!;

beforeEach(() => {
  vi.resetAllMocks();
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  vi.mocked(repository.loadWorkspace).mockResolvedValue({ status: "ok", state: structuredClone(DEFAULT_STATE) });
  vi.mocked(repository.savePersistedState).mockResolvedValue("indexeddb");
  vi.mocked(repository.discardIncompleteStaging).mockResolvedValue(0);
  vi.mocked(player.startScorePlayback).mockResolvedValue(() => undefined);
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("score views", () => {
  it("show the exact frets, counts and positions, and hide every answer-bearing label for a check", () => {
    const score = scoreById(THIRD_COLOUR_LESSON, "third-colour-e-minor-major");
    const { unmount } = render(<ScoreView score={score} />);
    const bar1 = screen.getByRole("region", { name: /^Bar 1, Minor third/ });
    expect(bar1.getAttribute("aria-label")).toBe(
      "Bar 1, Minor third. 1: high E string open (E); 2: high E string fret 3 (G); 3: high E string open (E); 4: rest.",
    );
    expect(
      screen.getByRole("img", {
        name: /Positions in this study: high E open \(E\); high E fret 3 \(G\); high E fret 4 \(G#\)/,
      }),
    ).toBeTruthy();
    unmount();
    render(<ScoreView score={score} conceal />);
    expect(screen.getByRole("figure", { name: "Score: hidden during this check" })).toBeTruthy();
    expect(screen.getByText("Key hidden", { exact: false })).toBeTruthy();
    expect(screen.queryByText("G#")).toBeNull();
    expect(screen.getByRole("region", { name: /^Bar 1\./ }).getAttribute("aria-label")).toBe(
      "Bar 1. 1: a note; 2: a note; 3: a note; 4: rest.",
    );
  });

  it("draw chord shapes from the voicing and mark the one sounding", () => {
    const score = scoreById(COMMON_TONE_LESSON, "common-tone-c-am");
    render(<ScoreView score={score} activeTick={200} />);
    expect(
      screen.getByRole("img", {
        name: "Am chord shape: low E not played; A open; D fret 2, middle finger; G fret 2, ring finger; B fret 1, index finger; high E open.",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("img", {
        name: /^Sounding now: A open \(A\); D fret 2 \(E\); G fret 2 \(A\); B fret 1 \(C\); high E open \(E\)/,
      }),
    ).toBeTruthy();
  });
});

describe("the lesson player", () => {
  it("keeps the same hooks in the same order from its first render, before a lesson position exists", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <V8StoreProvider>
        <LessonPlayer entry={entry("lesson-unit-09-power-chords")} />
      </V8StoreProvider>,
    );
    expect(await screen.findByRole("heading", { name: "Root and fifth, anywhere" })).toBeTruthy();
    expect(
      errors.mock.calls.map((call) => String(call[0])).filter((text) => /order of Hooks|more hooks/.test(text)),
    ).toEqual([]);
    errors.mockRestore();
  });

  it("runs learn, practise, a repair and the unaided check, recording a self-report against the unit's activity", async () => {
    const user = userEvent.setup();
    render(
      <V8StoreProvider>
        <LessonPlayer entry={entry("lesson-unit-06-common-tone")} />
        <Probe />
      </V8StoreProvider>,
    );
    expect(await screen.findByRole("heading", { name: "Keep what stays: C to Am" })).toBeTruthy();
    expect(screen.getByText("Not yet checked on a guitar")).toBeTruthy();
    expect(screen.getByText(/Only the ring finger moves/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Hear the exact music" }));
    expect(vi.mocked(player.startScorePlayback).mock.calls[0][1]).toMatchObject({
      tempo: 60,
      mode: "reference",
      fromTick: 0,
      toTick: 384,
      countIn: true,
    });

    await user.click(screen.getByRole("button", { name: "2 · Practise it" }));
    await user.click(screen.getByRole("button", { name: "Two counts each" }));
    expect(screen.getByText(/twice as often/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "The change stops my pulse." }));
    expect(screen.getByRole("heading", { name: "The change stops my pulse." })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Count in and play" }));
    expect(vi.mocked(player.startScorePlayback).mock.calls.at(-1)![1]).toMatchObject({
      tempo: 40,
      fromTick: 144,
      toTick: 240,
    });
    await user.click(screen.getByRole("button", { name: "Return to the whole study →" }));

    await user.click(screen.getByRole("button", { name: "3 · Try unaided" }));
    expect(screen.getByRole("figure", { name: "Score: hidden during this check" })).toBeTruthy();
    expect(screen.queryByRole("img", { name: /chord shape/ })).toBeNull();
    expect((screen.getByRole("button", { name: "4 · Move it" }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "I played it without the app sound" }));
    await user.type(screen.getByLabelText(/One concrete observation/), "The Am landed on count one both times.");
    await user.click(screen.getByRole("button", { name: "I could do it" }));

    const state = probe();
    expect(state.attempts).toEqual([
      expect.objectContaining({
        lessonId: "lesson-unit-06-common-tone",
        kind: "first-check",
        scoreId: "common-tone-c-am-two-count",
        assistance: "none",
        method: "self-reported",
        outcome: "successful",
      }),
    ]);
    expect(
      state.evidence.map((item: { activityId: string; method: string }) => [item.activityId, item.method]),
    ).toContainEqual(["unit-06-rhythm", "self-reported"]);
    expect((screen.getByRole("button", { name: "4 · Move it" }) as HTMLButtonElement).disabled).toBe(false);
    expect(() =>
      validateState({ ...DEFAULT_STATE, lessonCursors: state.cursors, lessonAttempts: state.attempts }),
    ).not.toThrow();
  });

  it("records a revealed check as assisted and a transfer against the unit's transfer activity", async () => {
    const user = userEvent.setup();
    const seeded: V8State = {
      ...structuredClone(DEFAULT_STATE),
      lessonAttempts: [
        {
          id: "lesson-attempt-seed",
          cursorId: "c",
          lessonId: THIRD_COLOUR_LESSON.id,
          lessonVersion: 1,
          scoreId: "third-colour-e-major-minor",
          scoreVersion: 1,
          kind: "first-check",
          assistance: "none",
          method: "self-reported",
          tempo: 66,
          outcome: "successful",
          observation: "Both thirds landed.",
          occurredAt: "2026-10-01T10:00:00.000Z",
          localDate: "2026-10-01",
        },
      ],
    };
    vi.mocked(repository.loadWorkspace).mockResolvedValue({ status: "ok", state: seeded });
    render(
      <V8StoreProvider>
        <LessonPlayer entry={entry("lesson-unit-10-third-colour")} />
        <Probe />
      </V8StoreProvider>,
    );
    await screen.findByRole("heading", { name: "One fret changes the third" });
    // A first success from an earlier day makes the recall check available.
    expect((screen.getByRole("button", { name: "6 · Return later" }) as HTMLButtonElement).disabled).toBe(false);
    await user.click(screen.getByRole("button", { name: "4 · Move it" }));
    expect(screen.getByText(/Start on F at high-E fret 1/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Show the notes to help me" }));
    expect(screen.getByRole("figure", { name: "Score: Find the thirds again from F" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "I played it without the app sound" }));
    await user.type(screen.getByLabelText(/One concrete observation/), "Found A flat at fret four after F.");
    await user.click(screen.getByRole("button", { name: "Partly there" }));
    const state = probe();
    expect(state.attempts.at(-1)).toMatchObject({
      kind: "transfer-check",
      assistance: "reveal",
      outcome: "partial",
      scoreId: "third-colour-f-minor-major",
    });
    expect(state.evidence.at(-1)).toMatchObject({
      activityId: "unit-10-transfer",
      source: "transfer",
      assistance: "reveal",
    });
  });

  it("makes an editable copy in Create without an origin record older versions would refuse", async () => {
    const user = userEvent.setup();
    const seeded: V8State = {
      ...structuredClone(DEFAULT_STATE),
      lessonAttempts: [
        {
          id: "lesson-attempt-seed",
          cursorId: "c",
          lessonId: COMMON_TONE_LESSON.id,
          lessonVersion: 1,
          scoreId: "common-tone-c-am-two-count",
          scoreVersion: 1,
          kind: "first-check",
          assistance: "none",
          method: "self-reported",
          tempo: 60,
          outcome: "successful",
          observation: "Changes landed.",
          occurredAt: new Date().toISOString(),
          localDate: localDateAt(new Date()),
        },
      ],
    };
    vi.mocked(repository.loadWorkspace).mockResolvedValue({ status: "ok", state: seeded });
    render(
      <V8StoreProvider>
        <LessonPlayer entry={entry("lesson-unit-06-common-tone")} />
        <Probe />
      </V8StoreProvider>,
    );
    await screen.findByRole("heading", { name: "Keep what stays: C to Am" });
    expect((screen.getByRole("button", { name: "6 · Return later" }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "5 · Make it yours" }));
    await user.click(screen.getByRole("button", { name: "Make an editable copy in Create →" }));
    const [sketch] = probe().sketches;
    expect(sketch).toMatchObject({ name: "Keep what stays: C to Am", key: "C", mode: "major", tempo: 60 });
    expect(sketch.origin).toBeUndefined();
    expect(sketch.notes).toContain("score common-tone-c-am version 1");
    expect(
      sketch.chords.map((chord: { symbol: string; beats: number; voicing: (number | null)[] }) => [
        chord.symbol,
        chord.beats,
        chord.voicing,
      ]),
    ).toEqual([
      ["C", 4, [0, 1, 0, 2, 3, null]],
      ["Am", 4, [0, 1, 2, 2, 0, null]],
    ]);
    expect(probe().route).toBe("create");
  });

  it("names and plays the second guitar a lesson study is accompanied by", async () => {
    const user = userEvent.setup();
    render(
      <V8StoreProvider>
        <LessonPlayer entry={entry("lesson-unit-13-home")} />
      </V8StoreProvider>,
    );
    await screen.findByRole("heading", { name: "Where home is" });
    expect(screen.getByText("While you play, a synthesised second guitar plays: A low G held under you.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Hear the exact music" }));
    const [lead, options] = vi.mocked(player.startScorePlayback).mock.calls[0];
    expect([lead.id, options.accompaniment?.map((item) => item.id)]).toEqual(["home-degrees-g", ["home-low-g-drone"]]);
    // During a hidden check the accompaniment is not named, since its title could give the answer away.
    await user.click(screen.getByRole("button", { name: "3 · Try unaided" }));
    expect(screen.getByText("While you play, a synthesised second guitar plays along.")).toBeTruthy();
    expect(screen.queryByText(/A low G held under you/)).toBeNull();
  });

  it("runs a making check: the tune stays visible, Create opens with it, and the report links what was made", async () => {
    const user = userEvent.setup();
    render(
      <V8StoreProvider>
        <LessonPlayer entry={entry("lesson-unit-24-harmonise")} />
        <AddChord />
        <Probe />
      </V8StoreProvider>,
    );
    await screen.findByRole("heading", { name: "Chords under a tune" });
    await user.click(screen.getByRole("button", { name: "3 · Try unaided" }));
    expect(screen.queryByRole("figure", { name: "Score: hidden during this check" })).toBeNull();
    expect(screen.getByRole("figure", { name: "Score: Lantern's tune" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "I played it without the app sound" })).toBeNull();
    await user.type(screen.getByLabelText(/One concrete observation/), "Em under bar five, for the colour.");
    const report = screen.getByRole("button", { name: "I could do it" }) as HTMLButtonElement;
    expect(report.disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "Make my version in Create →" }));
    expect(screen.getByText("Record or clear your observation before opening Create.")).toBeTruthy();
    await user.clear(screen.getByLabelText(/One concrete observation/));
    await user.click(screen.getByRole("button", { name: "Make my version in Create →" }));
    const [sketch] = probe().sketches;
    expect(sketch).toMatchObject({ name: "Chords under a tune: my version", chords: [], tempo: 72 });
    expect(sketch.melody.length).toBeGreaterThan(0);
    expect(probe().route).toBe("create");
    expect(screen.getByText(/has nothing of yours in it yet. Add your chords in Create/)).toBeTruthy();
    // Opening it again reopens the same version, never a second copy.
    await user.click(screen.getByRole("button", { name: "Open my version in Create again →" }));
    expect(probe().sketches).toHaveLength(1);
    expect(probe().activeSketchId).toBe(sketch.id);

    await user.click(screen.getByRole("button", { name: "Add a chord in Create" }));
    expect(
      screen.getByText("Your version: “Chords under a tune: my version”, 1 chord. Report on it below."),
    ).toBeTruthy();
    await user.type(screen.getByLabelText(/One concrete observation/), "Em under bar five, for the colour.");
    await user.click(screen.getByRole("button", { name: "I could do it" }));
    const state = probe();
    expect(state.attempts).toEqual([
      expect.objectContaining({ kind: "first-check", scoreId: "harmonise-lantern-tune", artifactId: sketch.id }),
    ]);
    expect(state.evidence.at(-1)).toMatchObject({ activityId: "unit-24-creative", artifactId: sketch.id });
    expect(() =>
      validateState({
        ...DEFAULT_STATE,
        sketches: state.sketches,
        lessonCursors: state.cursors,
        lessonAttempts: state.attempts,
      }),
    ).not.toThrow();
    // A lesson attempt's link to what was made is validated like any other id.
    expect(() =>
      validateState({
        ...DEFAULT_STATE,
        lessonAttempts: state.attempts.map((attempt: object) => ({ ...attempt, artifactId: "sketch/elsewhere" })),
      }),
    ).toThrow(/artifactId/);
  });

  it("runs a listening check: hidden examples in a shuffled order, marked at once, recorded together when the set ends", async () => {
    const user = userEvent.setup();
    // 0.999 keeps the first run in authored order; 0 reorders the second run.
    const random = vi.spyOn(Math, "random").mockReturnValue(0.999);
    render(
      <V8StoreProvider>
        <LessonPlayer entry={entry("lesson-unit-30-feels")} />
        <Probe />
      </V8StoreProvider>,
    );
    await screen.findByRole("heading", { name: "Three feels, one motif" });
    await user.click(screen.getByRole("button", { name: "3 · Try unaided" }));
    expect(screen.getByRole("heading", { name: "Name what you hear" })).toBeTruthy();
    expect(screen.queryByRole("figure", { name: /^Score/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "I played it without the app sound" })).toBeNull();
    const questions = FEELS_LESSON.listening!.questions;
    const unit30 = (item: { activityId: string }) => item.activityId === "unit-30-listen-compare";

    /** Answer one run; `wrong` names the shown positions to answer wrongly. Returns the order heard. */
    const answerRun = async (wrong: number[]) => {
      const heard: string[] = [];
      const before = probe().evidence.filter(unit30).length;
      for (let index = 0; index < questions.length; index++) {
        expect(screen.getByText(`Example ${index + 1} of 4`)).toBeTruthy();
        const check = screen.getByRole("button", { name: "Check my answer" }) as HTMLButtonElement;
        expect(check.disabled).toBe(true);
        expect(check.getAttribute("aria-describedby")).toBeTruthy();
        await user.click(screen.getByRole("button", { name: `Hear example ${index + 1}` }));
        const [played, options] = vi.mocked(player.startScorePlayback).mock.calls.at(-1)!;
        const question = questions.find((item) => item.scoreId === played.id)!;
        expect([options.mode, options.tempo]).toEqual(["reference", 60]);
        heard.push(question.id);
        const response = wrong.includes(index)
          ? question.choices.find((item) => item !== question.answer)!
          : question.answer;
        await user.click(screen.getByRole("radio", { name: response }));
        await user.click(screen.getByRole("button", { name: "Check my answer" }));
        expect(
          screen.getByText(response === question.answer ? "Right." : `Not this time: it was ${question.answer}.`),
        ).toBeTruthy();
        expect(screen.getByText(question.explanation, { exact: false })).toBeTruthy();
        if (index < 3) {
          // Nothing is recorded until the set is finished.
          expect(probe().evidence.filter(unit30)).toHaveLength(before);
          await user.click(screen.getByRole("button", { name: "Next example →" }));
        }
      }
      return heard;
    };

    const first = await answerRun([1]);
    expect(first).toEqual(questions.map((question) => question.id));
    expect(screen.getByText(/You named 3 of 4 correctly\. The app marked each answer/)).toBeTruthy();
    let state = probe();
    expect(state.attempts).toEqual([
      expect.objectContaining({
        kind: "first-check",
        method: "self-reported",
        checkedAnswers: { right: 3, total: 4 },
        outcome: "partial",
        assistance: "none",
        tempo: 60,
      }),
    ]);
    let answered = state.evidence.filter(unit30);
    expect(new Set(answered.map((item: { checkId: string }) => item.checkId)).size).toBe(4);
    expect(new Set(answered.map((item: { occurredAt: string }) => item.occurredAt)).size).toBe(1);
    expect(
      answered.every(
        (item: { method: string; assistance: string }) => item.method === "exact-answer" && item.assistance === "none",
      ),
    ).toBe(true);
    const firstCount = answered.length;
    // Three right answers in a partial set do not complete the activity.
    expect(state.completed).not.toContain("unit-30-listen-compare");

    // A second run after the answers were shown is practice with help, in a new order.
    random.mockReturnValue(0);
    await user.click(screen.getByRole("button", { name: "Try the set again (in a new order, as practice)" }));
    expect(screen.getByText(/You have seen these answers today/)).toBeTruthy();
    const second = await answerRun([]);
    expect(second).not.toEqual(first);
    expect(screen.getByText(/having seen the answers earlier today.*recorded as practice with help/)).toBeTruthy();
    state = probe();
    expect(state.attempts.at(-1)).toEqual(
      expect.objectContaining({ outcome: "successful", assistance: "hint", checkedAnswers: { right: 4, total: 4 } }),
    );
    answered = state.evidence.filter(unit30);
    expect(answered.slice(firstCount).every((item: { assistance: string }) => item.assistance === "hint")).toBe(true);
    expect(state.completed).toContain("unit-30-listen-compare");
    expect(() =>
      validateState({
        ...DEFAULT_STATE,
        evidence: state.evidence,
        lessonCursors: state.cursors,
        lessonAttempts: state.attempts,
      }),
    ).not.toThrow();
    random.mockRestore();
  });

  it("starts a listening check reloaded after today's answers as practice with help", async () => {
    const user = userEvent.setup();
    const question = FEELS_LESSON.listening!.questions[0];
    const seen = recordLessonAnswer(
      FEELS_LESSON,
      question,
      question.answer,
      false,
      activityById("unit-30-listen-compare")!,
    );
    vi.mocked(repository.loadWorkspace).mockResolvedValue({
      status: "ok",
      state: { ...structuredClone(DEFAULT_STATE), evidence: seen },
    });
    render(
      <V8StoreProvider>
        <LessonPlayer entry={entry("lesson-unit-30-feels")} />
      </V8StoreProvider>,
    );
    await screen.findByRole("heading", { name: "Three feels, one motif" });
    await user.click(screen.getByRole("button", { name: "3 · Try unaided" }));
    expect(screen.getByText(/You have seen these answers today/)).toBeTruthy();
  });

  it("explains plainly when a lesson's files cannot load", async () => {
    render(
      <V8StoreProvider>
        <LessonPlayer entry={{ ...entry("lesson-unit-06-common-tone"), stage: 7 }} />
      </V8StoreProvider>,
    );
    expect((await screen.findByRole("alert")).textContent).toContain("Stage 7 has no lesson content.");
    expect(within(screen.getByRole("banner")).getByRole("button", { name: "Close lesson" })).toBeTruthy();
  });
});
