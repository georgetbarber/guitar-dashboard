import { noteUpdateReady } from "./updates";

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: InstallPromptEvent | null = null;
const listeners = new Set<(prompt: InstallPromptEvent | null) => void>();
const standaloneQuery = "(display-mode: standalone)";

export function currentStandaloneMode() {
  if (typeof window === "undefined") return false;
  const iosStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return matchMedia(standaloneQuery).matches || iosStandalone;
}

export function subscribeStandaloneMode(listener: (standalone: boolean) => void) {
  if (typeof window === "undefined") return () => undefined;
  const media = matchMedia(standaloneQuery);
  const notify = () => listener(currentStandaloneMode());
  media.addEventListener("change", notify);
  addEventListener("focus", notify);
  addEventListener("pageshow", notify);
  return () => {
    media.removeEventListener("change", notify);
    removeEventListener("focus", notify);
    removeEventListener("pageshow", notify);
  };
}

if (typeof window !== "undefined") {
  if ("serviceWorker" in navigator) {
    let reloading = false;
    /*
     * Reload only for an update this tab asked for. A controllerchange can also
     * come from another tab applying the update, and reloading on that would
     * reintroduce exactly the interruption this phase removes — in the tab that
     * never consented, quite possibly mid-recording.
     */
    let requestedHere = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!requestedHere || reloading) return;
      reloading = true;
      location.reload();
    });

    const offerWaiting = (worker: ServiceWorker | null | undefined) => {
      if (!worker) return;
      noteUpdateReady(() => {
        requestedHere = true;
        // generateSW is built with skipWaiting false, so it hands over only when
        // asked. This message is that request.
        worker.postMessage({ type: "SKIP_WAITING" });
      });
    };

    void navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;
      offerWaiting(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          // A controller already present means this is an update rather than the
          // first install, which needs no offer and no reload.
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            offerWaiting(registration.waiting ?? installing);
          }
        });
      });
    }).catch(() => undefined);

    const checkForUpdate = () => {
      void navigator.serviceWorker.getRegistration()
        .then((registration) => registration?.update())
        .catch(() => undefined);
    };
    addEventListener("focus", checkForUpdate);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") checkForUpdate();
    });
  }
  addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as InstallPromptEvent;
    listeners.forEach((listener) => listener(deferredPrompt));
  });
  addEventListener("appinstalled", () => {
    deferredPrompt = null;
    listeners.forEach((listener) => listener(null));
  });
}

export function currentInstallPrompt() {
  return deferredPrompt;
}

export function subscribeInstallPrompt(listener: (prompt: InstallPromptEvent | null) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export async function showInstallPrompt() {
  if (!deferredPrompt) return "unavailable" as const;
  await deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  listeners.forEach((listener) => listener(null));
  return choice.outcome;
}
