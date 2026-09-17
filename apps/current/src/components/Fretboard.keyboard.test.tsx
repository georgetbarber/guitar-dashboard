// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { buildScale, createContext } from "../core/music/theory";
import { STANDARD_GUITAR } from "../core/instrument/guitar";
import { Fretboard } from "./Fretboard";

const scale = buildScale(createContext("C", "major"));
afterEach(cleanup);

function tabbable(grid: HTMLElement) {
  return within(grid).getAllByRole("gridcell").filter((cell) => cell.tabIndex === 0);
}

describe("the fretboard is one keyboard stop with arrow-key movement (B14)", () => {
  it("puts exactly one position in the tab order, and Tab leaves the neck", async () => {
    render(<><button>Before</button><Fretboard scale={scale} onPosition={vi.fn()} /><button>After</button></>);
    const grid = screen.getByRole("grid");
    expect(within(grid).getAllByRole("gridcell")).toHaveLength(STANDARD_GUITAR.openMidi.length * (STANDARD_GUITAR.fretCount + 1));
    expect(tabbable(grid)).toHaveLength(1);
    await userEvent.click(screen.getByText("Before"));
    await userEvent.tab();
    expect(document.activeElement).toBe(tabbable(grid)[0]);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByText("After"));
  });

  it("moves by fret and string, stops at the edges, and jumps with Home and End", async () => {
    render(<Fretboard scale={scale} fretStart={0} fretEnd={5} onPosition={vi.fn()} />);
    const cell = (string: number, fret: number) => screen.getByRole("gridcell", { name: new RegExp(`^String ${string}, fret ${fret},`) });
    await userEvent.tab();
    expect(document.activeElement).toBe(cell(1, 0));
    await userEvent.keyboard("{ArrowLeft}{ArrowUp}");
    expect(document.activeElement).toBe(cell(1, 0));
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowDown}");
    expect(document.activeElement).toBe(cell(2, 2));
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(cell(2, 5));
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(cell(2, 5));
    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(cell(2, 0));
    await userEvent.keyboard("{Control>}{End}{/Control}");
    expect(document.activeElement).toBe(cell(6, 5));
    for (let step = 0; step < 8; step++) await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(cell(6, 5));
    expect(tabbable(screen.getByRole("grid"))).toEqual([cell(6, 5)]);
  });

  it("remembers the last position when focus returns, and selects with Enter or Space", async () => {
    const onPosition = vi.fn();
    render(<><Fretboard scale={scale} onPosition={onPosition} /><button>After</button></>);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowDown}{ArrowRight}{ArrowRight}{ArrowRight}");
    await userEvent.keyboard("{Enter}");
    expect(onPosition).toHaveBeenLastCalledWith(expect.objectContaining({ string: 1, fret: 3 }));
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByRole("gridcell", { name: /^String 2, fret 3,/ }));
    await userEvent.keyboard(" ");
    expect(onPosition).toHaveBeenCalledTimes(2);
  });

  it("announces string, fret, spelled pitch with octave and the relationship", () => {
    render(<Fretboard scale={buildScale(createContext("C#", "major"))} fretStart={0} fretEnd={1} selectedPitch={0} onPosition={vi.fn()} />);
    expect(screen.getByRole("gridcell", { name: "String 6, fret 1, E#2, Key 3" })).toBeTruthy();
    // B string, fret 1 sounds MIDI 60 and is spelled B# in C# major: B#3, not B#4.
    const bSharp = screen.getByRole("gridcell", { name: "String 2, fret 1, B#3, Key 7" });
    expect(bSharp.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("grid").getAttribute("aria-describedby")).toBe(screen.getByText(/Arrow keys move/).id);
  });

  it("does not promise selection on a read-only fretboard", () => {
    render(<Fretboard scale={scale} />);
    expect(screen.getByText(/Arrow keys move/).textContent).not.toMatch(/selects/);
  });
});
