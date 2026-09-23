import { useEffect, useState } from "react";
import { selectedLessonReadyOffline } from "../offlineReadiness";

export function OfflineLessonStatus() {
  const [ready, setReady] = useState<boolean | "unsupported" | null>(null);

  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (!("serviceWorker" in navigator) || !("caches" in window)) {
      setReady("unsupported");
      return;
    }
    let mounted = true;
    const check = () => {
      void selectedLessonReadyOffline().then((value) => {
        if (mounted) setReady(value);
      });
    };
    check();
    void navigator.serviceWorker.ready.then(check).catch(() => undefined);
    navigator.serviceWorker.addEventListener("controllerchange", check);
    window.addEventListener("focus", check);
    return () => {
      mounted = false;
      navigator.serviceWorker.removeEventListener("controllerchange", check);
      window.removeEventListener("focus", check);
    };
  }, []);

  if (!import.meta.env.PROD) return null;
  return (
    <p className="offline-unit-status" role="status">
      {ready === null
        ? "Checking offline access…"
        : ready === "unsupported"
          ? "Offline downloads are unavailable in this browser"
          : ready
            ? "Ready offline on this device · activities and built-in sounds"
            : "Offline copy not ready yet · open this app while connected"}
    </p>
  );
}
