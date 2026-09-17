/**
 * WHEN IT IS SAFE TO APPLY A NEW BUILD.
 *
 * The previous arrangement had no notion of safety at all. The worker was built
 * with skipWaiting and clientsClaim, so a new build took control the moment it
 * finished installing, and install.ts reloaded the page on controllerchange.
 * A learner could therefore lose a recording in progress, an import part-way
 * through, or unsaved edits, with no warning and nothing to decline — and the
 * reload arrived from a background update check tied to window focus, so it was
 * most likely exactly when they came back to the tab.
 *
 * A new worker now installs and waits. The application holds the update off
 * while anything is genuinely in flight, and applies it at a boundary the
 * learner either chooses or reaches naturally.
 *
 * This module is deliberately free of service-worker and DOM types so the rules
 * about what counts as safe can be tested directly.
 */
const holds = new Map<symbol, string>();
const listeners = new Set<() => void>();

let ready = false;
let applying = false;
let apply: (() => void) | null = null;
let activationSent = false;

function applyIfSafe() {
  if (!ready || holds.size || !applying || activationSent || !apply) return;
  activationSent = true;
  apply();
}

function announce() {
  for (const listener of listeners) listener();
}

/**
 * Hold updates off while something is in flight. The reason is shown to the
 * learner, so it must read as an activity: "a recording is in progress".
 * Release in a cleanup path that always runs — a hold that is never released
 * blocks every future update.
 */
export function holdUpdates(reason: string): () => void {
  const token = Symbol(reason);
  holds.set(token, reason);
  announce();
  return () => {
    if (!holds.delete(token)) return;
    announce();
    // Reaching zero holds is itself a safe boundary: whatever was in flight has
    // finished, so a waiting update can go in without interrupting anything.
    // React cleans up old effects before installing their replacements. A
    // recording becoming a temporary take must not reload in that brief gap.
    // Recheck after the whole transition, and send activation at most once.
    queueMicrotask(applyIfSafe);
  };
}

export function updateHoldReasons(): string[] {
  return [...new Set(holds.values())];
}

export function updateReady(): boolean {
  return ready;
}

export function updateApplying(): boolean {
  return applying;
}

export function subscribeUpdates(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Called when a new build has installed and is waiting. `activate` hands control over. */
export function noteUpdateReady(activate: () => void) {
  ready = true;
  apply = activate;
  announce();
}

/**
 * Ask for the waiting update.
 *
 * With nothing in flight it goes in immediately. With something in flight it is
 * queued: `applying` becomes true, the interface says what it is waiting for,
 * and the last hold to be released applies it. Nothing here interrupts work.
 */
export function requestUpdate(): "applied" | "queued" | "unavailable" {
  if (!ready || !apply) return "unavailable";
  applying = true;
  announce();
  if (holds.size) return "queued";
  applyIfSafe();
  return "applied";
}

/** Stop waiting to apply a queued update. The update stays ready and can be asked for again. */
export function cancelQueuedUpdate() {
  if (!applying) return;
  applying = false;
  announce();
}

/** Test seam. Never called by the application. */
export function resetUpdateStateForTests() {
  holds.clear();
  listeners.clear();
  ready = false;
  applying = false;
  apply = null;
  activationSent = false;
}
