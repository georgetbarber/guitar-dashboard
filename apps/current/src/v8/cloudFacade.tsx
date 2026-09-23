import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CloudValue } from "./cloud";
import { CLOUD_CONFIGURED, RECORDING_SHARING, firebaseConfig } from "./cloudConfig";
import { readCloudSessionHint, writeCloudSessionHint } from "./cloudSessionHint";
import { eraseAllDeviceData, hasAccountWorkspace, workspaceHasLearningData } from "./repository";

type CloudModule = typeof import("./cloud");
let loadingModule: Promise<CloudModule> | null = null;

function loadCloudModule(): Promise<CloudModule> {
  if (!loadingModule) {
    loadingModule = import("./cloud").catch((error: unknown) => {
      loadingModule = null;
      throw error;
    });
  }
  return loadingModule;
}

const GuestContext = createContext<CloudValue | null>(null);

function ConnectedCloud({ module, children }: { module: CloudModule; children: ReactNode }) {
  const value = module.useCloudSync();
  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
}

export function CloudSyncProvider({ children }: { children: ReactNode }) {
  const [module, setModule] = useState<CloudModule | null>(null);
  const [readyModule, setReadyModule] = useState<CloudModule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    addEventListener("online", update);
    addEventListener("offline", update);
    return () => {
      removeEventListener("online", update);
      removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (!CLOUD_CONFIGURED) return;
    let active = true;
    const activate = () => {
      void loadCloudModule()
        .then((loaded) => {
          if (active) setModule(loaded);
        })
        .catch((cause: unknown) => {
          if (active) setError(cause instanceof Error ? cause.message : "Account sync could not be loaded.");
        });
    };
    const hint = readCloudSessionHint();
    if (hint === "account") activate();
    else if (hint === null) {
      void (async () => {
        const foundAccount = await hasAccountWorkspace();
        // A previous login may have no saved account workspace yet. Inspect
        // existing guest learning once before skipping auth on this device.
        const priorLearning = foundAccount ? false : await workspaceHasLearningData("anonymous");
        if (!active || readCloudSessionHint() !== null) return;
        if (foundAccount || priorLearning) activate();
        else writeCloudSessionHint("guest");
      })().catch(activate);
    }
    return () => {
      active = false;
    };
  }, []);

  if (module) {
    const Provider = module.CloudSyncProvider;
    return (
      <Provider>
        <ConnectedCloud module={module}>{children}</ConnectedCloud>
      </Provider>
    );
  }

  const unavailable = async () => {
    throw new Error("Sign in before using account sync.");
  };
  const value: CloudValue = {
    configured: CLOUD_CONFIGURED,
    signInReady: Boolean(readyModule),
    sharingAvailable: Boolean(CLOUD_CONFIGURED && firebaseConfig.storageBucket && RECORDING_SHARING),
    user: null,
    status: error ? "error" : !online ? "offline" : CLOUD_CONFIGURED ? "signed-out" : "local-only",
    message:
      error ||
      (!online
        ? "Working offline. Local lessons and saved work remain available on this device."
        : loading
          ? "Preparing Google sign-in…"
          : readyModule
            ? "Google sign-in is ready. Choose Open Google sign-in to continue."
            : CLOUD_CONFIGURED
              ? "Prepare Google sign-in to synchronise devices."
              : "Sync across devices is not set up in this copy of Guitar Academy. Your learning stays on this device; a complete backup moves it."),
    accountChoice: null,
    signIn: async () => {
      if (!CLOUD_CONFIGURED) throw new Error("Sync across devices is not set up in this copy of Guitar Academy.");
      if (readyModule) {
        try {
          await readyModule.beginPreparedSignIn();
          setModule(readyModule);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Google sign-in could not open.");
          throw cause;
        }
        return;
      }
      setLoading(true);
      setError("");
      try {
        const loaded = await loadCloudModule();
        // The next click supplies the user gesture that popup sign-in requires.
        setReadyModule(loaded);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Google sign-in could not open.");
        throw cause;
      } finally {
        setLoading(false);
      }
    },
    signOut: unavailable,
    connectDeviceHistory: unavailable,
    useSeparateAccountHistory: unavailable,
    eraseDeviceData: async () => {
      await eraseAllDeviceData();
      location.reload();
    },
    uploadFinishedTake: unavailable,
    removeUploadedTake: unavailable,
    uploadedTakeBlob: async () => null,
    deleteUploadedTakes: async (sketch) => {
      if (sketch.takes.some((take) => take.cloud))
        throw new Error("Sign in before deleting a sketch with shared takes.");
    },
  };
  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
}

export function useCloudSync(): CloudValue {
  const value = useContext(GuestContext);
  if (!value) throw new Error("useCloudSync must be used inside CloudSyncProvider");
  return value;
}
