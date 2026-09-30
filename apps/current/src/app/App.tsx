import { lazy, Suspense, useRef, useState } from "react";
import { V8StoreProvider, useV8Store } from "../v8/store";
import { playMidi } from "../audio/engine";
import { CloudSyncProvider, useCloudSync } from "../v8/cloudFacade";
import type { RouteId } from "../v8/types";
import { ActivityPlayer } from "../v8/components/ActivityPlayer";
import { SettingsPanel } from "../v8/components/SettingsPanel";
import { Modal } from "../v8/components/Modal";
import { DialogNoticesContext, PageNotices } from "../v8/components/NoticeHost";
import { AppNotices, SaveIndicator } from "../v8/components/SaveStatus";
import { PlacementSampler } from "../v8/components/PlacementSampler";
import { Today } from "../v8/features/Today";
import { Path } from "../v8/features/Path";
import { Practice } from "../v8/features/Practice";
const Play = lazy(() => import("../v8/features/Play").then((module) => ({ default: module.Play })));
const Create = lazy(() => import("../v8/features/Create").then((module) => ({ default: module.Create })));
const Explore = lazy(() => import("../v8/features/Explore").then((module) => ({ default: module.Explore })));

const LEARN_ROUTES: RouteId[] = ["today", "path", "practice"];

const NAV: Array<{ id: string; route: RouteId; label: string; symbol: string; purpose: string; activeRoutes: RouteId[] }> = [
  { id: "learn", route: "today", label: "Learn", symbol: "↗", purpose: "Continue your course", activeRoutes: LEARN_ROUTES },
  { id: "play", route: "play", label: "Play", symbol: "◉", purpose: "Follow a prompt and flow", activeRoutes: ["play"] },
  { id: "create", route: "create", label: "Create", symbol: "✦", purpose: "Turn choices into music", activeRoutes: ["create"] },
  { id: "explore", route: "explore", label: "Explore", symbol: "⌁", purpose: "Follow relationships", activeRoutes: ["explore"] }
];

const LEARN_VIEWS: Array<{ route: RouteId; label: string; purpose: string }> = [
  { route: "today", label: "Continue", purpose: "Your next guided session" },
  { route: "path", label: "Course map", purpose: "Your place in the curriculum" },
  { route: "practice", label: "Strengthen", purpose: "Focused review from evidence" }
];

export function App() {
  return <V8StoreProvider><CloudSyncProvider><V8Application /></CloudSyncProvider></V8StoreProvider>;
}

function V8Application() {
  const { state, dispatch, navigate, hydrated } = useV8Store();
  const cloud = useCloudSync();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const activityCloseRef = useRef<(() => void) | null>(null);
  const closeActivity = () => dispatch({ type: "openActivity", activityId: null });
  if (cloud.accountChoice) return <AccountWorkspaceChoice />;
  if (!hydrated) return <div className="loading-screen"><span>GA</span><p>Loading your learning path…</p></div>;
  if (!state.settings.diagnosticComplete) return <Diagnostic />;
  return (
    <DialogNoticesContext.Provider value={<AppNotices />}>
    <div className="v8-shell">
      <a className="skip-link" href="#main-content">Skip to learning content</a>
      <aside className="primary-sidebar">
        <button className="v8-brand" onClick={() => navigate("today")} aria-label="Guitar Academy, go to Learn"><span>GA</span><div><strong>Guitar Academy</strong><small>Musical freedom</small></div></button>
        <nav aria-label="Primary learning navigation">
          {NAV.map((item) => {
            const active = item.activeRoutes.includes(state.route);
            return <button className={active ? "is-active" : ""} aria-current={active ? "page" : undefined} onClick={() => navigate(item.route)} key={item.id}><i>{item.symbol}</i><div><strong>{item.label}</strong><small>{item.purpose}</small></div></button>;
          })}
        </nav>
        <div className="sidebar-context"><span>Current reference</span><strong>{state.settings.tonicName} {state.settings.mode}</strong><small>{state.settings.instrument} · {state.settings.dailyMinutes} min sessions</small><SaveIndicator /></div>
        <button className="settings-button" onClick={() => setSettingsOpen(true)}><span>⚙</span><div><strong>Settings and sync</strong><small>{cloud.user ? cloud.status : "Private backup and devices"}</small></div></button>
      </aside>
      {/* Phones: an in-flow bar, so nothing floats over the page's own controls, and the local save status stays visible. */}
      <header className="mobile-topbar">
        <button className="mobile-brand" onClick={() => navigate("today")} aria-label="Guitar Academy, go to Learn"><span aria-hidden="true">GA</span><strong>Guitar Academy</strong></button>
        <SaveIndicator />
        <button className="mobile-settings-button" onClick={() => setSettingsOpen(true)} aria-label="Open settings and data"><span aria-hidden="true">⚙</span><span className="mobile-settings-label">Settings</span></button>
      </header>
      <main id="main-content" tabIndex={-1}>
        <PageNotices><AppNotices /></PageNotices>
        {cloud.status === "offline" && <div className="offline-banner" role="status"><strong>Working offline.</strong> {cloud.user ? "Changes will synchronise to your other devices when you reconnect." : "Local lessons and saved work remain available on this device."} The save indicator shows whether this device kept your changes.</div>}
        {LEARN_ROUTES.includes(state.route) && <nav className="learn-tabs" aria-label="Learn views">
          {LEARN_VIEWS.map((item) => <button className={state.route === item.route ? "is-active" : ""} aria-current={state.route === item.route ? "page" : undefined} onClick={() => navigate(item.route)} key={item.route}><strong>{item.label}</strong><small>{item.purpose}</small></button>)}
        </nav>}
        {state.route === "today" && <Today />}
        {state.route === "path" && <Path />}
        {state.route === "practice" && <Practice />}
        <Suspense fallback={<section className="card" role="status">Opening this part of your workspace…</section>}>
          {state.route === "play" && <Play />}
          {state.route === "create" && <Create />}
          {state.route === "explore" && <Explore />}
        </Suspense>
      </main>
      <nav className="mobile-nav" aria-label="Mobile learning navigation">{NAV.map((item) => {
        const active = item.activeRoutes.includes(state.route);
        return <button className={active ? "is-active" : ""} aria-current={active ? "page" : undefined} onClick={() => navigate(item.route)} key={item.id}><i>{item.symbol}</i><span>{item.label}</span></button>;
      })}</nav>
      {/* Escape asks the player first: it keeps an unsaved reflection unless the learner uses Close activity. */}
      {state.activeActivityId && <Modal className="activity-overlay" labelledBy="activity-title" onRequestClose={() => (activityCloseRef.current ?? closeActivity)()}><ActivityPlayer key={state.activeActivityId} activityId={state.activeActivityId} onClose={closeActivity} requestCloseRef={activityCloseRef} /></Modal>}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
    </DialogNoticesContext.Provider>
  );
}

function AccountWorkspaceChoice() {
  const cloud = useCloudSync();
  const [busy, setBusy] = useState<"connect" | "separate" | "cancel" | null>(null);
  const [error, setError] = useState("");
  if (!cloud.accountChoice) return null;
  const run = async (choice: "connect" | "separate" | "cancel") => {
    setBusy(choice);
    setError("");
    try {
      if (choice === "connect") await cloud.connectDeviceHistory();
      else if (choice === "separate") await cloud.useSeparateAccountHistory();
      else await cloud.signOut();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The workspace choice could not be completed.");
      setBusy(null);
    }
  };
  return <main className="diagnostic"><div className="diagnostic-mark">GA <span>Private workspace check</span></div><div className="diagnostic-notices"><AppNotices /></div><div className="diagnostic-card"><section><span className="eyebrow">Before synchronising</span><h1>Which history belongs with {cloud.accountChoice.email}?</h1><p>This browser already has a guest learning history. Guitar Academy will never silently mix it into a different account.</p><div className="diagnostic-choices"><button disabled={Boolean(busy)} onClick={() => void run("connect")}><strong>{busy === "connect" ? "Connecting…" : "Move this device history into the account"}</strong><span>Use this when the guest progress and sketches are yours. The separate guest copy is removed from this device.</span></button><button disabled={Boolean(busy)} onClick={() => void run("separate")}><strong>{busy === "separate" ? "Opening…" : "Keep the account history separate"}</strong><span>Open a clean account workspace, or download its existing cloud history, without uploading anything from the guest workspace.</span></button></div>{error && <p className="configuration-note" role="alert">{error}</p>}</section><footer><div /><button className="text-action" disabled={Boolean(busy)} onClick={() => void run("cancel")}>{busy === "cancel" ? "Cancelling…" : "Cancel sign-in"}</button></footer></div></main>;
}

function Diagnostic() {
  const { state, dispatch } = useV8Store();
  const cloud = useCloudSync();
  const [step, setStep] = useState(0);
  const [baseline, setBaseline] = useState<"repair" | "some" | "secure">(state.settings.startingBaseline);
  const [soundChecked, setSoundChecked] = useState(false);
  const [soundError, setSoundError] = useState("");
  const testTone = () => {
    try { playMidi(60, 0, 0.5); playMidi(64, 0.35, 0.5); playMidi(67, 0.7, 0.7); setSoundChecked(true); setSoundError(""); }
    catch { setSoundChecked(false); setSoundError("Audio could not start on this device. Check its sound settings and try again."); }
  };
  const panels = [
    <section key="welcome"><span className="eyebrow">Welcome to Guitar Academy</span><h1>Build freedom from sound, time and relationships.</h1><p>This path will not make you memorise the guitar as disconnected facts. It will ask you to hear, predict, play, vary, create and transfer what you learn.</p><div className="diagnostic-promise"><span>48 connected units</span><span>Sessions sized to your time</span><span>{cloud.configured ? "Works offline, syncs when signed in" : "Works offline on this device"}</span></div><div className="diagnostic-soundcheck"><div><strong>First, a quick sound check</strong><span>{soundChecked ? "Sound played. If you heard three rising notes, your audio is ready. If not, check this device's volume." : "This app teaches largely by ear. Tap to play a short test — make sure your volume is up."}</span></div><button className={soundChecked ? "secondary-action" : "primary-action"} onClick={testTone}>{soundChecked ? "Play again" : "Play a test tone"}</button></div>{soundError && <small role="alert">{soundError}</small>}{cloud.configured && <div className="diagnostic-sync"><span>Already use Guitar Academy on another device?</span>{cloud.user ? <strong>{cloud.status === "synced" ? "Your learning history is connected." : cloud.message}</strong> : <button className="secondary-action" onClick={() => void cloud.signIn().catch(() => undefined)}>{cloud.signInReady ? "Open Google sign-in" : "Prepare Google sign-in"}</button>}{!cloud.user && <small role={cloud.status === "error" ? "alert" : "status"}>{cloud.message}</small>}</div>}</section>,
    <section key="instrument"><span className="eyebrow">Your physical context</span><h1>Which guitar are you holding most often?</h1><p>The core path is shared. Technique branches change where electric and acoustic instruments genuinely differ.</p><div className="diagnostic-choices"><button className={state.settings.instrument === "electric" ? "is-active" : ""} onClick={() => dispatch({ type: "updateSettings", settings: { instrument: "electric" } })}><strong>Electric</strong><span>Muting, pick control, bends and gain-aware touch</span></button><button className={state.settings.instrument === "acoustic" ? "is-active" : ""} onClick={() => dispatch({ type: "updateSettings", settings: { instrument: "acoustic" } })}><strong>Acoustic</strong><span>Balance, projection, strumming and fingerstyle touch</span></button></div></section>,
    <section key="baseline"><span className="eyebrow">Where would you like to start?</span><h1>Pick a starting point — you can move any time.</h1><p>New to guitar or unsure? Begin with one clean note. If you want more guidance, try the short optional sample below. Nothing here marks a skill mastered, and you can change your start later in the Course map.</p><div className="diagnostic-choices three">{[["repair", "Start from the beginning", "New, returning, or unsure. Begin with one clean note, timing and the basic fretboard — nothing assumed."], ["some", "Skip the basics", "Confident with clean notes and steady time. Start at pulse and subdivision."], ["secure", "Jump ahead", "Solid foundations already. Start at fretboard relationships, melody and harmony."]].map(([id, title, text]) => <button className={baseline === id ? "is-active" : ""} onClick={() => setBaseline(id as typeof baseline)} key={id}><strong>{title}</strong><span>{text}</span></button>)}</div><PlacementSampler selectedBaseline={baseline} onChoose={setBaseline} /></section>
  ];
  return <main className="diagnostic"><div className="diagnostic-mark">GA <span>Guitar Academy</span></div><div className="diagnostic-notices"><AppNotices /></div><div className="diagnostic-card">{panels[step]}<footer><div>{panels.map((_, index) => <i className={index <= step ? "is-active" : ""} key={index} />)}</div>{step > 0 && <button className="text-action" onClick={() => setStep(step - 1)}>Back</button>}<button className="primary-action" onClick={() => step < panels.length - 1 ? setStep(step + 1) : dispatch({ type: "updateSettings", settings: { diagnosticComplete: true, startingBaseline: baseline } })}>{step < panels.length - 1 ? "Continue" : "Start your path"}</button></footer></div></main>;
}
