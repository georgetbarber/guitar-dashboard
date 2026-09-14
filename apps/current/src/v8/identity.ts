/**
 * STABLE IDENTITY FOR LEARNER-CREATED RECORDS.
 *
 * These IDs are Firestore document keys, the key of a stored recording blob and
 * the join between the local state and both. A collision therefore does not
 * merely confuse a list — one record silently overwrites another, in the cloud
 * and on the device, with no error anywhere.
 *
 * The previous `${kind}-${Date.now()}` form collides whenever two records of the
 * same kind are created inside one millisecond. That is not hypothetical: every
 * transformation button in Create writes a revision and updates the sketch in
 * one click, and the sketch ID additionally mixed in `sketches.length`, so
 * deleting a sketch and creating another returned the index to a value already
 * used and reproduced a whole ID exactly.
 *
 * Generate the ID once per user action and reuse it when retrying that action's
 * writes, so a retry updates its own record rather than creating a second one.
 */
export function newId(kind: string): string {
  return `${kind}-${randomToken()}`;
}

function randomToken(): string {
  const source = globalThis.crypto as Crypto | undefined;
  if (source?.randomUUID) return source.randomUUID();
  /*
   * randomUUID is restricted to secure contexts, which excludes the dev server
   * reached over a LAN address — the exact route used to test on a phone.
   * getRandomValues carries no such restriction and is equally unpredictable,
   * so falling back to it costs nothing but the formatting.
   */
  if (source?.getRandomValues) {
    const bytes = source.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  /*
   * No Web Crypto at all. Two independent Math.random draws alongside the clock
   * are far weaker, but they are only reached where the alternative is throwing
   * while the learner is trying to save an idea.
   */
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`;
}
