/**
 * LESSON PACKS: COURSE CONTENT OFFLINE, ONE STAGE AT A TIME.
 *
 * The automatic offline shell holds the app and the learner's workspace. The
 * lesson players, the music engine and each stage's authored content are
 * built as `assets/lesson-*` files outside it (vite.config.ts), listed per
 * stage in `lesson-packs.json`, which the shell does precache. A stage's pack
 * is saved to its own cache:
 *
 *   - automatically for the stage the learner is working in, when online;
 *   - on request for any other stage ("Save this stage for offline");
 *   - again, for every stage saved before, as soon as an update is waiting,
 *     so applying it later does not lose offline lessons.
 *
 * A stage is ready offline only when every file of its pack is in that cache.
 * Opening a lesson online also caches what it loads.
 */
export const LESSON_CACHE = "interval-lessons";
const MANIFEST_URL = "/lesson-packs.json";
const READY_KEY = "interval.readyStages";

export interface PackManifest {
  version: 1;
  /** Stage number → the pack's files, as root-relative paths without a leading slash. */
  stages: Record<string, string[]>;
}

function isManifest(value: unknown): value is PackManifest {
  if (!value || typeof value !== "object") return false;
  const candidate = value as PackManifest;
  return (
    candidate.version === 1 &&
    typeof candidate.stages === "object" &&
    Object.values(candidate.stages).every(
      (files) =>
        Array.isArray(files) && files.every((file) => typeof file === "string" && /^assets\/lesson-[^/]+$/.test(file)),
    )
  );
}

export async function readManifest(fresh = false): Promise<PackManifest | null> {
  try {
    // The shell's copy describes the running build. A query string misses the
    // service worker's precache, so `fresh` reads the newly deployed build's list.
    const response = await fetch(
      fresh ? `${MANIFEST_URL}?build=${Date.now()}` : MANIFEST_URL,
      fresh ? { cache: "no-store" } : undefined,
    );
    if (!response.ok) return null;
    const value: unknown = await response.json();
    return isManifest(value) ? value : null;
  } catch {
    return null;
  }
}

function available(): boolean {
  return typeof window !== "undefined" && "caches" in window && "serviceWorker" in navigator;
}

export function packFiles(manifest: PackManifest, stage: number): string[] {
  return manifest.stages[String(stage)] ?? [];
}

/** True when the stage needs nothing beyond the shell, or every file of its pack is saved. */
export async function stagePackSaved(stage: number, manifest?: PackManifest | null): Promise<boolean> {
  if (!available()) return false;
  const current = manifest ?? (await readManifest());
  if (!current) return false;
  const files = packFiles(current, stage);
  if (!files.length) return true;
  try {
    const cache = await caches.open(LESSON_CACHE);
    // ignoreVary, as the service worker's lesson route does (vite.config.ts).
    const found = await Promise.all(
      files.map((file) => cache.match(new URL(`/${file}`, location.origin).href, { ignoreVary: true })),
    );
    return found.every((response) => response && isPackResponse(response));
  } catch {
    return false;
  }
}

export function rememberedStages(): number[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(READY_KEY) ?? "[]");
    return Array.isArray(value)
      ? value.filter((item): item is number => Number.isInteger(item) && item >= 1 && item <= 8)
      : [];
  } catch {
    return [];
  }
}

function remember(stage: number) {
  try {
    localStorage.setItem(READY_KEY, JSON.stringify([...new Set([...rememberedStages(), stage])].sort()));
  } catch {
    /* Without storage, the stage is still saved; it just is not refreshed on update. */
  }
}

/** Download and keep one stage's pack. Throws when offline or when the download fails part-way. */
export async function saveStagePack(stage: number, manifest?: PackManifest | null): Promise<void> {
  if (!available()) throw new Error("Offline downloads are unavailable in this browser.");
  const current = manifest ?? (await readManifest());
  if (!current) throw new Error("The list of lesson files could not be read.");
  const files = packFiles(current, stage);
  // Every file must arrive as code or styles before any is kept, so a broken
  // download (or a page served in place of a missing file) never looks complete.
  const responses = await Promise.all(
    files.map(async (file) => {
      const response = await fetch(`/${file}`, { cache: "no-store" });
      if (!response.ok || !isPackResponse(response)) throw new Error(`Lesson file ${file} did not download.`);
      return [new URL(`/${file}`, location.origin).href, response] as const;
    }),
  );
  const cache = await caches.open(LESSON_CACHE);
  await Promise.all(responses.map(([url, response]) => cache.put(url, response)));
  remember(stage);
  announce();
}

/** Readiness displays listen for this after a pack is saved or repaired (OfflineLessonStatus.tsx repeats the literal). */
export const PACKS_CHANGED = "interval:lesson-packs";
function announce() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PACKS_CHANGED));
}

/** A lesson file is JavaScript or CSS; the host answers a missing file with the app page instead. */
export function isPackResponse(response: Response): boolean {
  const type = response.headers.get("content-type") ?? "";
  return /javascript|css/.test(type);
}

/** Remove anything in the lesson cache that is not code or styles, so a bad entry cannot pass as saved. */
export async function discardBrokenPackFiles(): Promise<void> {
  if (!available()) return;
  try {
    const cache = await caches.open(LESSON_CACHE);
    for (const request of await cache.keys()) {
      const response = await cache.match(request);
      if (!response || !isPackResponse(response)) await cache.delete(request);
    }
    announce();
  } catch {
    /* Nothing to repair without cache access. */
  }
}

/** Drop pack files none of the given builds lists: older builds' lessons. */
export async function pruneLessonCache(...manifests: PackManifest[]): Promise<void> {
  if (!available()) return;
  const keep = new Set(
    manifests.flatMap((manifest) =>
      Object.values(manifest.stages).flatMap((files) => files.map((file) => new URL(`/${file}`, location.origin).href)),
    ),
  );
  try {
    const cache = await caches.open(LESSON_CACHE);
    for (const request of await cache.keys()) if (!keep.has(request.url)) await cache.delete(request);
  } catch {
    /* Pruning is housekeeping; failing leaves extra files, never missing ones. */
  }
}

/** On startup: keep the working stage's lessons offline and clear out old builds' files. */
export async function warmLessonPacks(stages: readonly number[]): Promise<void> {
  if (!available() || !navigator.onLine) return;
  const manifest = await readManifest();
  if (!manifest) return;
  for (const stage of new Set(stages))
    if (packFiles(manifest, stage).length && !(await stagePackSaved(stage, manifest)))
      await saveStagePack(stage, manifest).catch(() => undefined);
  // Keep the deployed build's files too: if an update is already waiting, its
  // packs were saved ahead of it (preparePacksForUpdate) and are needed once it applies.
  const deployed = await readManifest(true);
  await pruneLessonCache(...(deployed ? [manifest, deployed] : [manifest]));
}

/**
 * When a new build is waiting, fetch its file list from the network and save
 * its packs for every stage saved before, while still online.
 */
export async function preparePacksForUpdate(): Promise<void> {
  if (!available() || !navigator.onLine) return;
  const stages = rememberedStages();
  if (!stages.length) return;
  const next = await readManifest(true);
  if (!next) return;
  for (const stage of stages) await saveStagePack(stage, next).catch(() => undefined);
}
