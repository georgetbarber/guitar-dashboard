import { createContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

/*
 * WHERE THE APP'S URGENT NOTICES ARE SHOWN.
 *
 * Save failures, an unreadable workspace, a paused restore and a waiting update
 * normally sit at the top of the page. A modal dialog covers the page and makes
 * it inert, so while one is open those notices could be neither seen nor used —
 * and the activity player, where learners spend most of their time, is a
 * full-screen dialog. The notices therefore move into the open dialog, and are
 * rendered in exactly one place at a time so an alert is announced once and
 * its update hold is not duplicated.
 */
const hosts: symbol[] = [];
const listeners = new Set<() => void>();
const announce = () => { for (const listener of listeners) listener(); };
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

/** The notices a dialog should show. Supplied once by the application shell. */
export const DialogNoticesContext = createContext<ReactNode>(null);

/** Register a dialog able to show the notices; true while it is the one that should. */
export function useNoticeHost(canHost: boolean): boolean {
  const [token] = useState(() => Symbol("notice-host"));
  useEffect(() => {
    if (!canHost) return;
    hosts.push(token);
    announce();
    return () => {
      const index = hosts.indexOf(token);
      if (index >= 0) hosts.splice(index, 1);
      announce();
    };
  }, [canHost, token]);
  return useSyncExternalStore(subscribe, () => hosts.at(-1) === token, () => false);
}

/** Page-level notices step aside while a dialog is showing them. */
export function PageNotices({ children }: { children: ReactNode }) {
  const hosted = useSyncExternalStore(subscribe, () => hosts.length > 0, () => false);
  return hosted ? null : <>{children}</>;
}
