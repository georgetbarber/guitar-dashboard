import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelQueuedUpdate,
  holdUpdates,
  noteUpdateReady,
  requestUpdate,
  resetUpdateStateForTests,
  subscribeUpdates,
  updateApplying,
  updateHoldReasons,
  updateReady
} from "./updates";

describe("an update never interrupts work in flight (B03)", () => {
  beforeEach(resetUpdateStateForTests);

  it("does nothing at all until a new build is actually waiting", () => {
    expect(updateReady()).toBe(false);
    expect(requestUpdate()).toBe("unavailable");
  });

  it("applies immediately when nothing is in flight", () => {
    const activate = vi.fn();
    noteUpdateReady(activate);
    expect(requestUpdate()).toBe("applied");
    expect(activate).toHaveBeenCalledOnce();
  });

  it("queues rather than interrupting a recording", () => {
    const activate = vi.fn();
    noteUpdateReady(activate);
    const release = holdUpdates("a recording in progress");

    expect(requestUpdate()).toBe("queued");
    // The whole point: asking for an update while recording must not apply it.
    expect(activate).not.toHaveBeenCalled();
    expect(updateApplying()).toBe(true);
    expect(updateHoldReasons()).toEqual(["a recording in progress"]);

    release();
    expect(activate).toHaveBeenCalledOnce();
  });

  it("waits for the last hold, not the first", () => {
    const activate = vi.fn();
    noteUpdateReady(activate);
    const releaseRecording = holdUpdates("a recording in progress");
    const releaseSave = holdUpdates("your work to finish saving");
    requestUpdate();

    releaseRecording();
    expect(activate).not.toHaveBeenCalled();
    releaseSave();
    expect(activate).toHaveBeenCalledOnce();
  });

  it("does not apply when a hold is released and no update was asked for", () => {
    const activate = vi.fn();
    noteUpdateReady(activate);
    holdUpdates("a recording in progress")();
    // Finishing a recording is not consent to reload the page.
    expect(activate).not.toHaveBeenCalled();
    expect(updateApplying()).toBe(false);
  });

  it("lets a queued update be called off, and asked for again later", () => {
    const activate = vi.fn();
    noteUpdateReady(activate);
    const release = holdUpdates("a backup you are restoring");
    requestUpdate();
    cancelQueuedUpdate();

    release();
    expect(activate).not.toHaveBeenCalled();
    expect(updateReady()).toBe(true);
    expect(requestUpdate()).toBe("applied");
    expect(activate).toHaveBeenCalledOnce();
  });

  it("ignores a hold released twice rather than double-applying", () => {
    const activate = vi.fn();
    noteUpdateReady(activate);
    const release = holdUpdates("a recording in progress");
    requestUpdate();
    release();
    release();
    expect(activate).toHaveBeenCalledOnce();
  });

  it("reports each distinct reason once, however many holds share it", () => {
    holdUpdates("your work to finish saving");
    holdUpdates("your work to finish saving");
    holdUpdates("a recording in progress");
    expect(updateHoldReasons()).toEqual(["your work to finish saving", "a recording in progress"]);
  });

  it("tells the interface whenever the answer would change", () => {
    const listener = vi.fn();
    subscribeUpdates(listener);
    noteUpdateReady(() => undefined);
    const release = holdUpdates("a recording in progress");
    requestUpdate();
    release();
    expect(listener.mock.calls.length).toBeGreaterThanOrEqual(4);
  });
});
