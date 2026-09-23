import { readFileSync, statSync } from "node:fs";

const dist = new URL("../dist/", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL(".vite/manifest.json", dist), "utf8"));
const entry = Object.entries(manifest).find(([, chunk]) => chunk.isEntry);
if (!entry) throw new Error("The production bundle has no application entry.");

function staticGraph(start) {
  const seen = new Set();
  const visit = (key) => {
    if (seen.has(key)) return;
    const chunk = manifest[key];
    if (!chunk) throw new Error(`Missing bundle manifest entry: ${key}`);
    seen.add(key);
    for (const dependency of chunk.imports ?? []) visit(dependency);
  };
  visit(start);
  return seen;
}

const startup = staticGraph(entry[0]);
const startupFiles = [...startup].map((key) => manifest[key].file);
if (startupFiles.some((file) => /\/(?:cloud|firebase)-[^/]+\.js$/.test(file))) {
  throw new Error("Guest startup statically imports account or Firebase code.");
}

const cloudEntry = (manifest[entry[0]].dynamicImports ?? []).find((key) => manifest[key]?.src === "src/v8/cloud.tsx");
if (!cloudEntry) throw new Error("The account runtime is not behind a dynamic import.");
const accountFiles = [...staticGraph(cloudEntry)].map((key) => manifest[key].file);
if (!accountFiles.some((file) => /\/firebase-[^/]+\.js$/.test(file))) {
  throw new Error("The account runtime does not include the expected Firebase chunk.");
}

const startupBytes = startupFiles.reduce((sum, file) => sum + statSync(new URL(file, dist)).size, 0);
console.log(
  `Guest entry graph: ${startupFiles.length} JavaScript files, ${(startupBytes / 1024).toFixed(1)} KiB before compression.`,
);
console.log(`Account code is deferred: ${manifest[cloudEntry].file} and its Firebase dependency.`);
