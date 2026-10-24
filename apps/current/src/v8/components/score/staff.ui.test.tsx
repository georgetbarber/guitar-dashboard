// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScoreView } from "./ScoreView";
import { THIRD_COLOUR_LESSON } from "../../lessons/stage2";
import { SUNDAY_GLIDE_PIECE } from "../../pieces/library";
import { pieceScore } from "../../pieces/format";

const study = THIRD_COLOUR_LESSON.scores[0];

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("optional staff notation", () => {
  it("is off until chosen, then drawn for every bar and remembered on this device", async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(<ScoreView score={study} />);
    expect(container.querySelectorAll(".score-row--staff")).toHaveLength(0);
    await user.click(screen.getByRole("checkbox", { name: "Show staff notation (optional)" }));
    expect(container.querySelectorAll(".score-row--staff")).toHaveLength(study.bars);
    // Each attack has a notehead; the tab is still there.
    expect(container.querySelectorAll(".score-row--staff ellipse").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".score-row--string").length).toBe(study.bars * 6);
    unmount();
    const again = render(<ScoreView score={study} />);
    expect(again.container.querySelectorAll(".score-row--staff")).toHaveLength(study.bars);
  });

  it("dots dotted rests and keeps its drawings away from screen readers, which hear the bar descriptions", () => {
    localStorage.setItem("interval.score.staff", "1");
    // Sunday Glide's sixths rest for a dotted eighth after each slide-in.
    const { container } = render(<ScoreView score={pieceScore(SUNDAY_GLIDE_PIECE, "sunday-glide-sixths")} />);
    const staff = [...container.querySelectorAll(".score-row--staff svg")];
    expect(staff.length).toBeGreaterThan(0);
    expect(staff.every((svg) => svg.getAttribute("aria-hidden") === "true")).toBe(true);
    // One dot per dotted rest (one in each of the four bars).
    expect(container.querySelectorAll(".score-row--staff circle.staff-ink[r='1.4']")).toHaveLength(4);
  });

  it("is never offered during a hidden check, because it would show the answer", () => {
    localStorage.setItem("interval.score.staff", "1");
    const { container } = render(<ScoreView score={study} conceal />);
    expect(screen.queryByRole("checkbox", { name: /staff/ })).toBeNull();
    expect(container.querySelectorAll(".score-row--staff")).toHaveLength(0);
  });
});
