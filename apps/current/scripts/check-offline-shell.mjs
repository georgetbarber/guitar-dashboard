import { existsSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";

const dist = new URL("../dist/", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL(".vite/manifest.json", dist), "utf8"));
const worker = readFileSync(new URL("sw.js", dist), "utf8");
const list = worker.match(/precacheAndRoute\(\[(.*?)\],/s)?.[1];
if (!list) throw new Error("Could not read the built service worker's precache list.");
const urls = [...list.matchAll(/url:"([^"]+)"/g)].map((match) => match[1]);
const unique = new Set(urls);
if (unique.size !== urls.length) throw new Error("The offline shell contains duplicate precache entries.");

const lessonFile = (file) => /^assets\/lesson-[^/]+$/.test(file);
const shellFile =
  /^(?:index\.html|registerSW\.js|manifest\.webmanifest|lesson-packs\.json|assets\/[^/]+\.(?:js|css|woff2)|fonts\/[^/]+-OFL\.txt|guitar-academy-icon(?:-192|-512)?\.(?:png|svg))$/;
for (const url of urls) {
  if (!shellFile.test(url)) throw new Error(`Unexpected file in automatic offline shell: ${url}`);
  if (lessonFile(url)) throw new Error(`A lesson pack file is in the automatic offline shell: ${url}`);
}
const chunks = Object.values(manifest);
for (const chunk of chunks) {
  if (lessonFile(chunk.file)) continue;
  if (!unique.has(chunk.file)) throw new Error(`Built application asset is unavailable offline: ${chunk.file}`);
  for (const css of chunk.css ?? [])
    if (!lessonFile(css) && !unique.has(css)) throw new Error(`Built stylesheet is unavailable offline: ${css}`);
}
for (const required of [
  "index.html",
  "manifest.webmanifest",
  "lesson-packs.json",
  "guitar-academy-icon-192.png",
  "guitar-academy-icon-512.png",
]) {
  if (!unique.has(required)) throw new Error(`Offline shell is missing ${required}`);
}

const byFile = new Map(chunks.map((chunk) => [chunk.file, chunk]));
const keyOf = (file) => Object.keys(manifest).find((key) => manifest[key].file === file);
/** Static imports only: what must be present before a chunk can run. */
const closure = (file, into = new Set()) => {
  if (into.has(file)) return into;
  into.add(file);
  const chunk = byFile.get(file);
  for (const imported of chunk?.imports ?? []) closure(manifest[imported].file, into);
  for (const css of chunk?.css ?? []) into.add(css);
  return into;
};

// The shell must never need a lesson file to start or to run anything it holds.
for (const chunk of chunks) {
  if (lessonFile(chunk.file)) continue;
  for (const file of closure(chunk.file))
    if (lessonFile(file)) throw new Error(`Shell file ${chunk.file} imports lesson pack file ${file} directly.`);
}

// Every lesson pack lists everything its stage's lessons, the lesson player and (stage 1) the pilot need.
const packs = JSON.parse(readFileSync(new URL("lesson-packs.json", dist), "utf8"));
if (packs.version !== 1 || typeof packs.stages !== "object") throw new Error("lesson-packs.json is malformed.");
const entryFor = (pattern) => chunks.find((chunk) => chunk.src && pattern.test(chunk.src));
const player = entryFor(/src\/v8\/components\/LessonPlayer\.tsx$/);
const pilot = entryFor(/src\/v8\/components\/PilotEpisodePlayer\.tsx$/);
if (!player || !lessonFile(player.file)) throw new Error("The lesson player is not built as a lesson pack file.");
if (!pilot || !lessonFile(pilot.file)) throw new Error("The pilot player is not built as a lesson pack file.");
const stageChunks = chunks.filter((chunk) => chunk.src && /src\/v8\/lessons\/stage\d+\.ts$/.test(chunk.src));
const packed = new Set();
const sizes = [];
for (const chunk of stageChunks) {
  const stage = chunk.src.match(/stage(\d+)\.ts$/)[1];
  const listed = new Set(packs.stages[stage] ?? []);
  const needed = [
    ...closure(chunk.file),
    ...closure(player.file),
    ...(stage === "1" ? closure(pilot.file) : []),
  ].filter(lessonFile);
  for (const file of needed) if (!listed.has(file)) throw new Error(`Stage ${stage}'s lesson pack is missing ${file}.`);
  for (const file of listed) {
    if (!existsSync(new URL(file, dist))) throw new Error(`Stage ${stage}'s lesson pack lists missing ${file}.`);
    packed.add(file);
  }
  sizes.push(
    `stage ${stage} ${([...listed].reduce((sum, file) => sum + statSync(new URL(file, dist)).size, 0) / 1024).toFixed(1)} KiB`,
  );
}
for (const chunk of chunks)
  for (const file of [chunk.file, ...(chunk.css ?? [])])
    if (lessonFile(file) && !packed.has(file)) throw new Error(`Lesson file ${file} belongs to no stage pack.`);
if (!keyOf(player.file)) throw new Error("Lesson player missing from the build manifest.");

const entry = chunks.find((chunk) => chunk.isEntry);
if (!entry) throw new Error("The production bundle has no entry.");
const seen = new Set();
const visit = (file) => {
  if (seen.has(file)) return;
  seen.add(file);
  const chunk = byFile.get(file);
  for (const imported of chunk?.imports ?? []) visit(manifest[imported].file);
};
visit(entry.file);
const size = (url) => statSync(new URL(url, dist)).size;
const compressed = (url) => gzipSync(readFileSync(new URL(url, dist))).length;
const startupBytes = [...seen].reduce((sum, url) => sum + size(url), 0);
const cacheBytes = urls.reduce((sum, url) => sum + size(url), 0);
const cacheGzipBytes = urls.reduce((sum, url) => sum + compressed(url), 0);
if (startupBytes > 420 * 1024) throw new Error(`Guest entry graph grew to ${(startupBytes / 1024).toFixed(1)} KiB.`);
// Review threshold. Lesson players, the music engine and lessons are outside the shell (decision A7).
if (cacheBytes > 1280 * 1024) throw new Error(`Offline shell grew to ${(cacheBytes / 1024).toFixed(1)} KiB.`);

console.log(`Guest entry graph: ${(startupBytes / 1024).toFixed(1)} KiB uncompressed JavaScript.`);
console.log(
  `Offline shell: ${urls.length} files, ${(cacheBytes / 1024).toFixed(1)} KiB raw; ${(cacheGzipBytes / 1024).toFixed(1)} KiB summed gzip estimates.`,
);
console.log(`Lesson packs, saved per stage: ${sizes.join("; ")}.`);
console.log("Every other built app asset, including account code, is in the offline shell; lesson media is excluded.");
