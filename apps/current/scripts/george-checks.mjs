// Renders George's checklist (src/v8/georgeChecks.json) as docs/GEORGE_CHECKS.md.
// The JSON is the single source: the app renders the same items as "Things to check".
// Run `npm run docs:checks` after editing the JSON; tests/georgeChecks.test.ts fails if
// the Markdown is stale.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const CHECKS_JSON = fileURLToPath(new URL("../src/v8/georgeChecks.json", import.meta.url));
export const CHECKS_DOC = fileURLToPath(new URL("../../../docs/GEORGE_CHECKS.md", import.meta.url));
export const MAX_ITEMS = 40;

const ROUTE_LABELS = {
  today: "Learn › Continue",
  path: "Learn › Course map",
  practice: "Learn › Strengthen",
  play: "Play",
  create: "Create",
  explore: "Explore",
  settings: "Settings",
  checks: "Settings › Things to check",
  feedback: "Settings › Feedback",
};

export function checklistProblems(data) {
  const problems = [];
  const groups = new Set(data.groups.map((group) => group.id));
  const ids = new Set();
  if (data.items.length > MAX_ITEMS)
    problems.push(`${data.items.length} items exceeds the curated limit of ${MAX_ITEMS}`);
  for (const item of data.items) {
    if (ids.has(item.id)) problems.push(`duplicate id ${item.id}`);
    ids.add(item.id);
    if (!/^[a-z0-9-]{3,64}$/.test(item.id)) problems.push(`${item.id}: id must be lowercase words joined by hyphens`);
    if (!groups.has(item.group)) problems.push(`${item.id}: unknown group ${item.group}`);
    for (const field of ["title", "do", "pass", "source", "added"]) {
      if (typeof item[field] !== "string" || !item[field].trim()) problems.push(`${item.id}: missing ${field}`);
    }
    if (item.link && !(item.link.route in ROUTE_LABELS))
      problems.push(`${item.id}: unknown link route ${item.link.route}`);
  }
  return problems;
}

export function renderGeorgeChecks(data) {
  const lines = [
    "# George's checklist",
    "",
    "<!-- Generated from apps/current/src/v8/georgeChecks.json by `npm run docs:checks`. Edit the JSON, not this file. -->",
    "",
    "Things only a person with a guitar, the Pixel or a few days can check. Each takes",
    "minutes. Agents never mark these as passed: every item stays `needs George` here.",
    "Tick them in the app under **Settings › Things to check**, where the same list",
    "keeps your ticks on this device and in sync. Leave a “Something's wrong here”",
    "note if a check fails.",
    "",
    `${data.items.length} items, most valuable first within each group.`,
    "",
  ];
  for (const group of data.groups) {
    const items = data.items.filter((item) => item.group === group.id);
    if (!items.length) continue;
    lines.push(`## ${group.label}`, "");
    for (const item of items) {
      lines.push(`### ${item.title}`, "");
      lines.push(`- **Status:** needs George`);
      lines.push(`- **Do:** ${item.do}`);
      lines.push(`- **Pass:** ${item.pass}`);
      if (item.link)
        lines.push(`- **Where:** ${ROUTE_LABELS[item.link.route]}${item.link.lesson ? ` · ${item.link.lesson}` : ""}`);
      lines.push(`- **Why:** ${item.source}`);
      lines.push(`- **Added:** ${item.added} · \`${item.id}\``, "");
    }
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

export function loadChecks() {
  return JSON.parse(readFileSync(CHECKS_JSON, "utf8"));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const data = loadChecks();
  const problems = checklistProblems(data);
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  writeFileSync(CHECKS_DOC, renderGeorgeChecks(data));
  console.log(`Wrote ${data.items.length} checklist items to docs/GEORGE_CHECKS.md`);
}
