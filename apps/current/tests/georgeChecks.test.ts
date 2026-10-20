import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CHECKS_DOC, checklistProblems, loadChecks, renderGeorgeChecks } from "../scripts/george-checks.mjs";

describe("George's checklist", () => {
  it("is well formed and curated", () => {
    expect(checklistProblems(loadChecks())).toEqual([]);
  });

  it("keeps docs/GEORGE_CHECKS.md generated from the same data the app shows", () => {
    expect(readFileSync(CHECKS_DOC, "utf8")).toBe(renderGeorgeChecks(loadChecks()));
  });

  it("never records a human check as passed in the document", () => {
    const doc = readFileSync(CHECKS_DOC, "utf8");
    const statuses = [...doc.matchAll(/\*\*Status:\*\* (.+)/g)].map((match) => match[1]);
    expect(statuses.length).toBe(loadChecks().items.length);
    expect(new Set(statuses)).toEqual(new Set(["needs George"]));
  });
});
