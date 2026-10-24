/** Shown when a lesson-pack file (a lesson or piece player) cannot load, usually offline before its stage was saved. */
export function LessonPackMissing({ onClose }: { onClose?: () => void }) {
  return (
    <section className="pilot-episode" aria-labelledby="activity-title">
      <header className="activity-header">
        <button className="icon-button" onClick={onClose} aria-label="Close lesson" data-autofocus>←</button>
        <div>
          <h1 id="activity-title">This lesson isn’t saved on this device yet</h1>
          <p className="pilot-notice" role="alert">Reconnect to the internet, then reload Interval to open it. To use it offline next time, choose “Save this stage for offline” in the Course map while you are connected.</p>
          <button className="secondary-action" onClick={() => location.reload()}>Reload Interval</button>
        </div>
      </header>
    </section>
  );
}
