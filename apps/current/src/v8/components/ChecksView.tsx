import checklist from "../georgeChecks.json";
import { tickFor } from "../notes";
import { useV8Store } from "../store";
import type { RouteId } from "../types";

interface ChecklistItem {
  id: string;
  group: string;
  title: string;
  do: string;
  pass: string;
  link?: { route: string; label: string; lesson?: string };
}

const ROUTES: RouteId[] = ["today", "path", "practice", "play", "create", "explore"];

export function checklistProgress(ticks: Parameters<typeof tickFor>[0]): { done: number; total: number } {
  return { done: checklist.items.filter((item) => tickFor(ticks, item.id)).length, total: checklist.items.length };
}

/**
 * Settings › Things to check. The same data as docs/GEORGE_CHECKS.md, with
 * ticks kept on this device and synced. A tick is George's own record; it is
 * never evidence and agents never set it.
 */
export function ChecksView({ onBack, onGo }: { onBack: () => void; onGo: (route: RouteId) => void }) {
  const { state, dispatch } = useV8Store();
  const items = checklist.items as ChecklistItem[];
  const { done, total } = checklistProgress(state.checklistTicks);
  return (
    <section className="settings-subview" aria-labelledby="checks-view-title">
      <button className="text-action" onClick={onBack} data-autofocus>
        ← Back to settings
      </button>
      <h3 id="checks-view-title">Things to check</h3>
      <p>
        {done} of {total} ticked. Each takes a few minutes and needs a person: a guitar, the Pixel or a few days. Tick
        one when it passes; leave a “Something's wrong here” note when it does not.
      </p>
      {checklist.groups.map((group) => {
        const groupItems = items.filter((item) => item.group === group.id);
        if (!groupItems.length) return null;
        return (
          <section key={group.id} className="checks-group" aria-label={group.label}>
            <h4>{group.label}</h4>
            <ul>
              {groupItems.map((item) => {
                const ticked = tickFor(state.checklistTicks, item.id);
                return (
                  <li key={item.id} className={ticked ? "is-ticked" : ""}>
                    <label className="check-line">
                      <input
                        type="checkbox"
                        checked={ticked}
                        onChange={(event) =>
                          dispatch({ type: "setChecklistTick", id: item.id, done: event.target.checked })
                        }
                      />
                      <strong>{item.title}</strong>
                    </label>
                    <p>
                      <span className="checks-label">Do</span> {item.do}
                    </p>
                    <p>
                      <span className="checks-label">Pass</span> {item.pass}
                    </p>
                    {item.link && item.link.route !== "settings" && ROUTES.includes(item.link.route as RouteId) && (
                      <button className="text-action" onClick={() => onGo(item.link!.route as RouteId)}>
                        {item.link.label}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </section>
  );
}
