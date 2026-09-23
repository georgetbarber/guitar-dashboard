import { readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";

const dist = new URL("../dist/", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL(".vite/manifest.json", dist), "utf8"));
const worker = readFileSync(new URL("sw.js", dist), "utf8");
const list = worker.match(/precacheAndRoute\(\[(.*?)\],/s)?.[1];
if (!list) throw new Error("Could not read the built service worker's precache list.");
const urls = [...list.matchAll(/url:"([^"]+)"/g)].map((match) => match[1]);
const unique = new Set(urls);
if (unique.size !== urls.length) throw new Error("The offline shell contains duplicate precache entries.");

const shellFile =
  /^(?:index\.html|registerSW\.js|manifest\.webmanifest|assets\/[^/]+\.(?:js|css|woff2)|fonts\/[^/]+-OFL\.txt|guitar-academy-icon(?:-192|-512)?\.(?:png|svg))$/;
for (const url of urls) {
  if (!shellFile.test(url)) throw new Error(`Unexpected file in automatic offline shell: ${url}`);
}
for (const chunk of Object.values(manifest)) {
  if (!unique.has(chunk.file)) throw new Error(`Built application asset is unavailable offline: ${chunk.file}`);
}
for (const required of [
  "index.html",
  "manifest.webmanifest",
  "guitar-academy-icon-192.png",
  "guitar-academy-icon-512.png",
]) {
  if (!unique.has(required)) throw new Error(`Offline shell is missing ${required}`);
}

const entry = Object.values(manifest).find((chunk) => chunk.isEntry);
if (!entry) throw new Error("The production bundle has no entry.");
const seen = new Set();
const visit = (file) => {
  if (seen.has(file)) return;
  seen.add(file);
  const chunk = Object.values(manifest).find((candidate) => candidate.file === file);
  for (const imported of chunk?.imports ?? []) visit(manifest[imported].file);
};
visit(entry.file);
const size = (url) => statSync(new URL(url, dist)).size;
const compressed = (url) => gzipSync(readFileSync(new URL(url, dist))).length;
const startupBytes = [...seen].reduce((sum, url) => sum + size(url), 0);
const cacheBytes = urls.reduce((sum, url) => sum + size(url), 0);
const cacheGzipBytes = urls.reduce((sum, url) => sum + compressed(url), 0);
if (startupBytes > 420 * 1024) throw new Error(`Guest entry graph grew to ${(startupBytes / 1024).toFixed(1)} KiB.`);
if (cacheBytes > 1280 * 1024) throw new Error(`Offline shell grew to ${(cacheBytes / 1024).toFixed(1)} KiB.`);

console.log(`Guest entry graph: ${(startupBytes / 1024).toFixed(1)} KiB uncompressed JavaScript.`);
console.log(
  `Offline shell: ${urls.length} files, ${(cacheBytes / 1024).toFixed(1)} KiB raw; ${(cacheGzipBytes / 1024).toFixed(1)} KiB summed gzip estimates.`,
);
console.log("All built app assets, including account code, are in the offline shell; lesson media is excluded.");
