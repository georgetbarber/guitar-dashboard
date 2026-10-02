// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { THIRD_COLOUR_DRAFT, THIRD_COLOUR_TRANSFER_DRAFT } from "../phase6Drafts";
import { ONE_NOTE_QUESTION_ANSWER } from "../pilotEpisode";
import { PilotStudy } from "./PilotStudy";

afterEach(cleanup);

describe("structured guitar study display", () => {
  it("keeps the current open-E lesson's exact score and position", () => {
    const { container } = render(<PilotStudy material={ONE_NOTE_QUESTION_ANSWER} activeBeat={0} />);
    expect(container.querySelectorAll(".pilot-counts strong")).toHaveLength(8);
    expect(container.querySelector(".pilot-counts strong")?.textContent).toBe("Play E");
    expect(container.textContent).toContain("High E string, open (E4) · 60 BPM · 4/4");
    expect(container.querySelector(".pilot-guitar.is-sounding")?.textContent).toContain("Play this open string now");
  });

  it("shows the selected third and its actual fret, then hides answer-bearing labels in an unaided check", () => {
    const { container, rerender } = render(<PilotStudy material={THIRD_COLOUR_DRAFT} activeBeat={5} />);
    expect([...container.querySelectorAll(".pilot-counts strong")].map((node) => node.textContent)).toEqual([
      "Play E",
      "Play G",
      "Play E",
      "Rest",
      "Play E",
      "Play G#",
      "Play E",
      "Rest",
    ]);
    expect(container.querySelector(".pilot-guitar")?.textContent).toContain("Play string 1 at fret 4 now");
    expect(container.querySelector(".pilot-string-row .target")?.textContent).toBe("4");
    expect(screen.getByRole("img", { name: /Major third tablature: string 1, open, string 1, fret 4/ })).toBeTruthy();

    rerender(<PilotStudy material={THIRD_COLOUR_DRAFT} activeBeat={5} conceal />);
    expect(container.textContent).not.toContain("Minor third");
    expect(container.textContent).not.toContain("Major third");
    expect(container.textContent).not.toContain("Play G#");
    expect(container.textContent).not.toContain("fret 4");
    expect(container.querySelector(".pilot-fretboard")).toBeNull();
    expect(screen.getByRole("img", { name: "Example 2 tablature hidden during the check" })).toBeTruthy();
  });

  it("shows only the requested section or repair range", () => {
    const { container, rerender } = render(<PilotStudy material={THIRD_COLOUR_DRAFT} sectionId="major" />);
    expect(container.querySelectorAll(".pilot-bar")).toHaveLength(1);
    expect(container.querySelector(".pilot-bar")?.textContent).toContain("Play G#");
    rerender(<PilotStudy material={THIRD_COLOUR_DRAFT} range={{ fromBeat: 0, toBeat: 2 }} />);
    expect(container.querySelectorAll(".pilot-bar")).toHaveLength(1);
    expect(container.querySelectorAll(".pilot-counts strong")).toHaveLength(2);
  });

  it("shows the changed-root third score, then hides its answer during the check", () => {
    const { container, rerender } = render(<PilotStudy material={THIRD_COLOUR_TRANSFER_DRAFT} activeBeat={5} />);
    expect([...container.querySelectorAll(".pilot-counts strong")].map((node) => node.textContent)).toEqual([
      "Play F", "Play Ab", "Play F", "Rest", "Play F", "Play A", "Play F", "Rest",
    ]);
    expect(container.querySelector(".pilot-guitar")?.textContent).toContain("Play string 1 at fret 5 now");
    rerender(<PilotStudy material={THIRD_COLOUR_TRANSFER_DRAFT} activeBeat={5} conceal />);
    expect(container.textContent).not.toContain("Play A");
    expect(container.textContent).not.toContain("fret 5");
    expect(container.querySelector(".pilot-fretboard")).toBeNull();
  });
});
