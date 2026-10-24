import { useEffect, useState } from "react";
import { selectedLessonReadyOffline } from "../offlineReadiness";
/** Loaded on demand so the pack helper stays out of guest startup. */
const packs = () => import("../lessonPacks");
/** Fired by lessonPacks.ts when a pack is saved or repaired. */
const PACKS_CHANGED = "interval:lesson-packs";

type Readiness =
  | { kind: "checking" }
  | { kind: "unsupported" }
  | { kind: "shell-missing" }
  | { kind: "ready"; lessons: boolean }
  | { kind: "pack-missing" };

/**
 * Whether the selected unit opens offline on this device: the app shell, plus
 * its stage's lesson pack when the stage has full lessons. Nothing is called
 * ready until every file it needs is found saved.
 */
export function OfflineLessonStatus({ stage }: { stage: number }) {
  const [readiness, setReadiness] = useState<Readiness>({ kind: "checking" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (!("serviceWorker" in navigator) || !("caches" in window)) {
      setReadiness({ kind: "unsupported" });
      return;
    }
    let mounted = true;
    const check = async () => {
      const shell = await selectedLessonReadyOffline();
      const { packFiles, readManifest, stagePackSaved } = await packs();
      const manifest = await readManifest();
      const lessons = Boolean(manifest && packFiles(manifest, stage).length);
      const pack = lessons ? await stagePackSaved(stage, manifest) : true;
      if (!mounted) return;
      setReadiness(!shell ? { kind: "shell-missing" } : pack ? { kind: "ready", lessons } : { kind: "pack-missing" });
    };
    const refresh = () => void check();
    refresh();
    void navigator.serviceWorker.ready.then(refresh).catch(() => undefined);
    navigator.serviceWorker.addEventListener("controllerchange", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener(PACKS_CHANGED, refresh);
    return () => {
      mounted = false;
      navigator.serviceWorker.removeEventListener("controllerchange", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(PACKS_CHANGED, refresh);
    };
  }, [stage]);

  if (!import.meta.env.PROD) return null;
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await (await packs()).saveStagePack(stage);
    } catch {
      setError("The lessons could not be saved. Check the connection and try again.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="offline-unit-status" role="status">
      <p>
        {readiness.kind === "checking"
          ? "Checking offline access…"
          : readiness.kind === "unsupported"
            ? "Offline downloads are unavailable in this browser"
            : readiness.kind === "shell-missing"
              ? "Offline copy not ready yet · open this app while connected"
              : readiness.kind === "ready"
                ? readiness.lessons
                  ? "Ready offline on this device · activities, full lessons and built-in sounds"
                  : "Ready offline on this device · activities and built-in sounds"
                : `Activities ready offline · stage ${stage}'s full lessons are not saved on this device yet`}
      </p>
      {readiness.kind === "pack-missing" && (
        <button className="secondary-action" disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save this stage for offline"}
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
