import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import {
  GoogleAuthProvider,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  setDoc,
  writeBatch,
  type Firestore,
  type Unsubscribe
} from "firebase/firestore";
import { deleteObject, getBlob, getStorage, ref, uploadBytes } from "firebase/storage";
import { accountWorkspaceId, eraseAllDeviceData, loadBlob, workspaceExists, workspaceHasLearningData } from "./repository";
import { acceptEvidence, acceptProfile, acceptSketches, cloudProfile, commitIsolating, describeRejected, describeWithheld, screenEvidence, screenProfile, screenSketch } from "./sync";
import type { CloudProfile, PendingWrite, Withheld } from "./sync";
import type { RecordedTake, Sketch, V8State } from "./types";
import { useV8Store } from "./store";
import { firebaseConfig, CLOUD_CONFIGURED, RECORDING_SHARING } from "./cloudConfig";
import { writeCloudSessionHint } from "./cloudSessionHint";

export { CLOUD_CONFIGURED, APP_CHECK_CONFIGURED, RECORDING_SHARING } from "./cloudConfig";

const app = CLOUD_CONFIGURED ? (getApps()[0] ?? initializeApp(firebaseConfig)) : null;
if (app && firebaseConfig.appCheckSiteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(firebaseConfig.appCheckSiteKey),
    isTokenAutoRefreshEnabled: true
  });
}
const auth = app ? getAuth(app) : null;
const database = app ? getFirestore(app) : null;
/*
 * Sharing a finished take needs a provisioned Cloud Storage bucket, which the
 * live project does not have (new default buckets require the Blaze plan). A
 * configured bucket name is not evidence that the bucket exists, so sharing is
 * an explicit opt-in: set VITE_RECORDING_SHARING=enabled once Storage is set up
 * and its rules are deployed. Until then no sharing control is offered.
 */
const recordingStorage = app && firebaseConfig.storageBucket && RECORDING_SHARING ? getStorage(app) : null;

/** Called from a second user gesture after the account SDK has finished loading. */
export async function beginPreparedSignIn(): Promise<void> {
  if (!auth) throw new Error("Sync across devices is not set up in this copy of Guitar Academy.");
  await signInWithPopup(auth, new GoogleAuthProvider());
  writeCloudSessionHint("account");
}

export type SyncStatus = "local-only" | "signed-out" | "account-choice" | "restore-hold" | "syncing" | "synced" | "offline" | "error";

export interface CloudValue {
  configured: boolean;
  signInReady: boolean;
  /** True only when this build opted in to Storage-backed take sharing. */
  sharingAvailable: boolean;
  user: User | null;
  status: SyncStatus;
  message: string;
  accountChoice: { email: string } | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  connectDeviceHistory: () => Promise<void>;
  useSeparateAccountHistory: () => Promise<void>;
  eraseDeviceData: () => Promise<void>;
  uploadFinishedTake: (sketchId: string, takeId: string) => Promise<void>;
  removeUploadedTake: (sketchId: string, takeId: string) => Promise<void>;
  uploadedTakeBlob: (take: RecordedTake) => Promise<Blob | null>;
  deleteUploadedTakes: (sketch: Sketch) => Promise<void>;
}

const CloudContext = createContext<CloudValue | null>(null);

interface SyncCache {
  profileUpdatedAt: string;
  profileSignature: string;
  evidenceIds: Set<string>;
  sketchVersions: Map<string, string>;
  deletionVersions: Map<string, string>;
}

function emptyCache(): SyncCache {
  return { profileUpdatedAt: "", profileSignature: "", evidenceIds: new Set(), sketchVersions: new Map(), deletionVersions: new Map() };
}

function profileSignature(profile: CloudProfile): string {
  return JSON.stringify(profile);
}

async function uploadChanges(database: Firestore, uid: string, state: V8State, cache: SyncCache): Promise<Withheld[]> {
  const withheld: Withheld[] = [];
  const profile = cloudProfile(state);
  const signature = profileSignature(profile);
  if (state.updatedAt >= cache.profileUpdatedAt && signature !== cache.profileSignature) {
    const refused = screenProfile(state, profile);
    if (refused) {
      // Not cached as sent, so a later edit that brings the profile back within
      // range uploads it rather than being skipped as unchanged.
      withheld.push(refused);
    } else {
      await setDoc(doc(database, "users", uid), profile);
      cache.profileUpdatedAt = profile.updatedAt;
      cache.profileSignature = signature;
    }
  }

  /*
   * Deletions run before the batch, not after it. A rejected batch throws out of
   * this function, and when the deletions were last they were simply skipped —
   * so a sketch the learner deleted on one device stayed in Firestore and was
   * re-materialised on the next by mergeCloudSnapshot. Removing a document the
   * learner has already deleted locally is safe to do first: the worst case is
   * that a later upload recreates it, which the deletion version guard prevents.
   */
  for (const [id, deletedAt] of Object.entries(state.deletedSketchIds)) {
    if ((cache.deletionVersions.get(id) ?? "") >= deletedAt) continue;
    await deleteDoc(doc(database, "users", uid, "sketches", id));
    cache.deletionVersions.set(id, deletedAt);
    cache.sketchVersions.delete(id);
  }

  const deleted = new Set(Object.keys(state.deletedSketchIds));
  const writes: Array<PendingWrite<ReturnType<typeof writeBatch>>> = [];
  const sent = { evidence: new Set<string>(), sketches: new Map<string, string>() };

  for (const evidence of state.evidence) {
    if (cache.evidenceIds.has(evidence.id)) continue;
    const refused = screenEvidence(evidence);
    if (refused) { withheld.push(refused); continue; }
    const reference = doc(database, "users", uid, "evidence", evidence.id);
    writes.push({
      kind: "evidence", id: evidence.id,
      apply: (batch) => batch.set(reference, evidence),
      alone: () => setDoc(reference, evidence)
    });
    sent.evidence.add(evidence.id);
  }

  for (const sketch of state.sketches) {
    if (deleted.has(sketch.id)) continue;
    const remoteVersion = cache.sketchVersions.get(sketch.id);
    if (remoteVersion && remoteVersion >= sketch.updatedAt) continue;
    const { document, withheld: refused } = screenSketch(sketch);
    if (refused) { withheld.push(refused); continue; }
    const reference = doc(database, "users", uid, "sketches", sketch.id);
    writes.push({
      kind: "sketch", id: sketch.id,
      apply: (batch) => batch.set(reference, document),
      alone: () => setDoc(reference, document)
    });
    sent.sketches.set(sketch.id, sketch.updatedAt);
  }

  await commitIsolating(writes, () => writeBatch(database), withheld);

  /*
   * Only what was actually accepted enters the cache. Marking a withheld record
   * as sent would hide it from every later upload, so a sketch that the learner
   * later trims back within range would never reach the cloud.
   */
  const refusedIds = new Set(withheld.map((item) => item.id));
  for (const id of sent.evidence) if (!refusedIds.has(id)) cache.evidenceIds.add(id);
  for (const [id, updatedAt] of sent.sketches) if (!refusedIds.has(id)) cache.sketchVersions.set(id, updatedAt);
  return withheld;
}

export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const { state, dispatch, hydrated, workspaceId, workspaceIssue, switchWorkspace, restoreHold } = useV8Store();
  const [user, setUser] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SyncStatus>(CLOUD_CONFIGURED ? "signed-out" : "local-only");
  const [message, setMessage] = useState(CLOUD_CONFIGURED ? "Sign in to synchronise devices." : "Sync across devices is not set up in this copy of Guitar Academy. Your learning stays on this device; a complete backup moves it.");
  const [remoteReady, setRemoteReady] = useState(false);
  const [connectivityRevision, setConnectivityRevision] = useState(0);
  const cacheRef = useRef<SyncCache>(emptyCache());
  const uploadingRef = useRef(false);
  const queuedRef = useRef(false);
  const authRevisionRef = useRef(0);

  useEffect(() => {
    if (!auth) return;
    void getRedirectResult(auth).catch((error: unknown) => {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Google sign-in could not finish.");
    });
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      writeCloudSessionHint(nextUser ? "account" : "guest");
      const revision = ++authRevisionRef.current;
      setRemoteReady(false);
      cacheRef.current = emptyCache();
      void (async () => {
        if (!nextUser) {
          await switchWorkspace("anonymous");
          if (revision !== authRevisionRef.current) return;
          setPendingUser(null);
          setUser(null);
          setStatus("signed-out");
          setMessage("Sign in to synchronise devices. Guest history stays in its own workspace.");
          return;
        }

        const accountWorkspace = accountWorkspaceId(nextUser.uid);
        if (await workspaceExists(accountWorkspace)) {
          await switchWorkspace(accountWorkspace);
          if (revision !== authRevisionRef.current) return;
          setPendingUser(null);
          setUser(nextUser);
          setStatus("syncing");
          setMessage("Connecting your learning history…");
          return;
        }

        if (await workspaceHasLearningData("anonymous")) {
          if (revision !== authRevisionRef.current) return;
          setUser(null);
          setPendingUser(nextUser);
          setStatus("account-choice");
          setMessage("Choose whether this device's guest history belongs to the signed-in account.");
          return;
        }

        await switchWorkspace(accountWorkspace);
        if (revision !== authRevisionRef.current) return;
        setPendingUser(null);
        setUser(nextUser);
        setStatus("syncing");
        setMessage("Connecting your learning history…");
      })().catch((error: unknown) => {
        if (revision !== authRevisionRef.current) return;
        setUser(null);
        setPendingUser(null);
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "This device workspace could not be opened safely.");
      });
    });
    return unsubscribe;
  }, [switchWorkspace]);

  useEffect(() => {
    setRemoteReady(false);
    if (!database || !user || !hydrated || workspaceId !== accountWorkspaceId(user.uid) || workspaceIssue || restoreHold) return;
    let active = true;
    const loaded = new Set<string>();
    const subscriptions: Unsubscribe[] = [];
    /*
     * Counted per collection rather than summed, so a snapshot that re-delivers
     * the same bad document does not inflate the number the learner is shown.
     */
    const rejectedCounts = new Map<string, number>();
    const reportIntake = () => {
      const total = [...rejectedCounts.values()].reduce((sum, count) => sum + count, 0);
      if (!total) return false;
      setStatus("error");
      setMessage(describeRejected(total));
      return true;
    };
    const markLoaded = (part: string) => {
      loaded.add(part);
      if (loaded.size < 3) return;
      setRemoteReady(true);
      if (reportIntake()) return;
      setStatus(navigator.onLine ? "synced" : "offline");
      setMessage(navigator.onLine ? "Progress synchronises across signed-in devices." : "Working offline. Changes will synchronise when connected.");
    };
    subscriptions.push(onSnapshot(doc(database, "users", user.uid), (snapshot) => {
      if (!active) return;
      const { profile, reason } = acceptProfile(snapshot.exists() ? snapshot.data() : null);
      rejectedCounts.set("profile", reason ? 1 : 0);
      /*
       * A rejected profile leaves the cache signature empty, so the next upload
       * rewrites the account profile from this device's valid copy rather than
       * treating the unreadable one as current.
       */
      cacheRef.current.profileUpdatedAt = profile?.updatedAt ?? "";
      cacheRef.current.profileSignature = profile ? profileSignature(profile) : "";
      for (const [id, deletedAt] of Object.entries(profile?.deletedSketchIds ?? {})) cacheRef.current.deletionVersions.set(id, deletedAt);
      dispatch({ type: "mergeCloud", snapshot: { profile } });
      markLoaded("profile");
      if (loaded.size === 3) reportIntake();
    }, handleError));
    subscriptions.push(onSnapshot(collection(database, "users", user.uid, "evidence"), (snapshot) => {
      if (!active) return;
      const intake = acceptEvidence(snapshot.docs.map((item) => ({ id: item.id, data: item.data() })));
      rejectedCounts.set("evidence", intake.rejected.length);
      // Only accepted ids enter the cache, so a local copy of a rejected record is
      // uploaded again and repairs it rather than being skipped as already present.
      cacheRef.current.evidenceIds = new Set(intake.accepted.map((item) => item.id));
      dispatch({ type: "mergeCloud", snapshot: { evidence: intake.accepted } });
      markLoaded("evidence");
      if (loaded.size === 3) reportIntake();
    }, handleError));
    subscriptions.push(onSnapshot(collection(database, "users", user.uid, "sketches"), (snapshot) => {
      if (!active) return;
      const intake = acceptSketches(snapshot.docs.map((item) => ({ id: item.id, data: item.data() })));
      rejectedCounts.set("sketches", intake.rejected.length);
      cacheRef.current.sketchVersions = new Map(intake.accepted.map((sketch) => [sketch.id, sketch.updatedAt]));
      dispatch({ type: "mergeCloud", snapshot: { sketches: intake.accepted } });
      markLoaded("sketches");
      if (loaded.size === 3) reportIntake();
    }, handleError));
    function handleError(error: Error) {
      if (!active) return;
      setStatus("error");
      setMessage(error.message || "Cloud sync is unavailable. Local work remains safe.");
    }
    return () => { active = false; subscriptions.forEach((unsubscribe) => unsubscribe()); };
  }, [user?.uid, dispatch, hydrated, workspaceId, workspaceIssue, restoreHold]);

  useEffect(() => {
    const online = () => {
      setConnectivityRevision((value) => value + 1);
      if (user) { setStatus("syncing"); setMessage("Connection restored. Synchronising queued changes…"); }
    };
    const offline = () => { setStatus("offline"); setMessage("Working offline. Changes will synchronise when connected."); };
    addEventListener("online", online);
    addEventListener("offline", offline);
    return () => { removeEventListener("online", online); removeEventListener("offline", offline); };
  }, [user]);

  useEffect(() => {
    if (!database || !user || !hydrated || workspaceId !== accountWorkspaceId(user.uid)) return;
    if (workspaceIssue) {
      setStatus("error");
      setMessage("The saved workspace could not be read. Account sync is paused while you recover it.");
      return;
    }
    if (restoreHold) {
      setStatus("restore-hold");
      setMessage("Account sync is paused for this restored backup. Choose whether to merge it with your account.");
      return;
    }
    if (!remoteReady) return;
    if (!navigator.onLine) {
      setStatus("offline");
      setMessage("Saved offline; waiting for a connection.");
      return;
    }
    const timer = setTimeout(() => {
      if (uploadingRef.current) { queuedRef.current = true; return; }
      uploadingRef.current = true;
      setStatus(navigator.onLine ? "syncing" : "offline");
      void uploadChanges(database, user.uid, state, cacheRef.current)
        .then((withheld) => {
          if (withheld.length) {
            setStatus("error");
            setMessage(describeWithheld(withheld));
            return;
          }
          setStatus(navigator.onLine ? "synced" : "offline");
          setMessage(navigator.onLine ? "All progress is synchronised." : "Saved offline; waiting for a connection.");
        })
        .catch((error: unknown) => {
          setStatus(navigator.onLine ? "error" : "offline");
          setMessage(error instanceof Error ? error.message : "Sync failed. Local work remains safe.");
        })
        .finally(() => {
          uploadingRef.current = false;
          if (queuedRef.current) { queuedRef.current = false; setRemoteReady(false); setTimeout(() => setRemoteReady(true), 0); }
        });
    }, 650);
    return () => clearTimeout(timer);
  }, [state, user?.uid, hydrated, workspaceId, workspaceIssue, remoteReady, connectivityRevision, restoreHold]);

  const value = useMemo<CloudValue>(() => ({
    configured: CLOUD_CONFIGURED,
    signInReady: true,
    sharingAvailable: Boolean(recordingStorage),
    user,
    status,
    message,
    accountChoice: pendingUser ? { email: pendingUser.email ?? "the selected Google account" } : null,
    signIn: beginPreparedSignIn,
    signOut: async () => { if (auth) await firebaseSignOut(auth); writeCloudSessionHint("guest"); },
    connectDeviceHistory: async () => {
      if (!pendingUser) throw new Error("No account is waiting for a device-history choice.");
      const nextUser = pendingUser;
      await switchWorkspace(accountWorkspaceId(nextUser.uid), { moveAnonymousHistory: true });
      setPendingUser(null);
      setUser(nextUser);
      setStatus("syncing");
      setMessage("Connecting your learning history…");
    },
    useSeparateAccountHistory: async () => {
      if (!pendingUser) throw new Error("No account is waiting for a device-history choice.");
      const nextUser = pendingUser;
      await switchWorkspace(accountWorkspaceId(nextUser.uid));
      setPendingUser(null);
      setUser(nextUser);
      setStatus("syncing");
      setMessage("Connecting your account without the guest history…");
    },
    eraseDeviceData: async () => {
      if (auth) await firebaseSignOut(auth);
      await eraseAllDeviceData();
      location.reload();
    },
    uploadFinishedTake: async (sketchId, takeId) => {
      if (!user) throw new Error("Sign in before sharing a take.");
      if (!recordingStorage) throw new Error("Sharing recordings is not set up in this copy of Guitar Academy. The take remains on this device.");
      if (!navigator.onLine) throw new Error("Reconnect before sharing a take. The private device copy remains safe.");
      const sketch = state.sketches.find((item) => item.id === sketchId);
      if (!sketch || sketch.status !== "finished") throw new Error("Only a take from a finished project can be shared across devices.");
      const take = sketch.takes.find((item) => item.id === takeId);
      if (!take?.blobId) throw new Error("This device does not have that recording.");
      const blob = await loadBlob(take.blobId);
      if (!blob) throw new Error("The retained recording could not be found on this device.");
      if (blob.size > 50 * 1024 * 1024) throw new Error("This take is larger than the 50 MB sharing limit. It remains on this device.");
      if (blob.type && !blob.type.startsWith("audio/")) throw new Error("Only audio recordings can be shared.");
      const storagePath = `users/${user.uid}/finished-takes/${sketch.id}/${take.id}`;
      await uploadBytes(ref(recordingStorage, storagePath), blob, {
        contentType: blob.type || "audio/webm",
        customMetadata: { sketchId: sketch.id, takeId: take.id, explicitlySelected: "true" }
      });
      dispatch({
        type: "setTakeCloud", sketchId: sketch.id, takeId: take.id,
        cloud: { storagePath, contentType: blob.type || "audio/webm", bytes: blob.size, uploadedAt: new Date().toISOString() },
        note: "Explicitly shared from a finished project; the device copy remains available offline."
      });
    },
    removeUploadedTake: async (sketchId, takeId) => {
      if (!user || !recordingStorage) throw new Error("Sign in before removing a shared take.");
      const sketch = state.sketches.find((item) => item.id === sketchId);
      const take = sketch?.takes.find((item) => item.id === takeId);
      if (!sketch || !take?.cloud) return;
      try { await deleteObject(ref(recordingStorage, take.cloud.storagePath)); }
      catch (error) {
        if (!(error instanceof Error) || !("code" in error) || (error as Error & { code: string }).code !== "storage/object-not-found") throw error;
      }
      dispatch({ type: "setTakeCloud", sketchId: sketch.id, takeId: take.id, cloud: null, note: "Cross-device copy removed; any retained device copy remains private." });
    },
    uploadedTakeBlob: async (take) => {
      if (!user || !recordingStorage || !take.cloud) return null;
      if (!take.cloud.storagePath.startsWith(`users/${user.uid}/finished-takes/`)) return null;
      return getBlob(ref(recordingStorage, take.cloud.storagePath), 50 * 1024 * 1024);
    },
    deleteUploadedTakes: async (sketch) => {
      if (!sketch.takes.some((take) => take.cloud)) return;
      if (!user || !recordingStorage) throw new Error("Sign in and reconnect before deleting a sketch with shared takes.");
      await Promise.all(sketch.takes.flatMap((take) => take.cloud ? [deleteObject(ref(recordingStorage, take.cloud.storagePath)).catch((error: unknown) => {
        if (!(error instanceof Error) || !("code" in error) || (error as Error & { code: string }).code !== "storage/object-not-found") throw error;
      })] : []));
    }
  }), [user, pendingUser, status, message, state, switchWorkspace]);
  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>;
}

export function useCloudSync() {
  const value = useContext(CloudContext);
  if (!value) throw new Error("useCloudSync must be used inside CloudSyncProvider");
  return value;
}
