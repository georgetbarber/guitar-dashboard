import { useContext, useEffect, useRef, type ReactNode } from "react";
import { DialogNoticesContext, useNoticeHost } from "./NoticeHost";

/**
 * A native modal dialog: the browser keeps focus inside it and makes the rest
 * of the page inert. Escape and (optionally) a backdrop press are *requests*
 * to close. The owner decides, so a dialog with work in progress can refuse.
 *
 * Browsers may close a dialog without a cancel event — Chromium does on a
 * repeated Escape with no user activation in between — so an unrequested
 * close reopens it and is treated as one more request.
 */
export function Modal({ children, className, labelledBy, onRequestClose, closeOnBackdrop = false }: {
  children: ReactNode;
  className: string;
  labelledBy: string;
  onRequestClose: () => void;
  closeOnBackdrop?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const notices = useContext(DialogNoticesContext);
  const showsNotices = useNoticeHost(notices !== null && notices !== undefined);
  const requestRef = useRef(onRequestClose);
  useEffect(() => { requestRef.current = onRequestClose; }, [onRequestClose]);

  useEffect(() => {
    const dialog = dialogRef.current!;
    const trigger = document.activeElement;
    let unmounting = false;
    // Browsers otherwise focus the first focusable descendant, which can be a
    // scrolling container rather than a control.
    const focusInitial = () => (dialog.querySelector<HTMLElement>("[data-autofocus]") ?? dialog).focus({ preventScroll: true });
    const cancel = (event: Event) => { event.preventDefault(); requestRef.current(); };
    const closed = () => {
      // A close queued by an earlier cleanup (React StrictMode remounts) can
      // arrive after the dialog has been shown again; it is not a request.
      if (unmounting || dialog.open) return;
      dialog.showModal();
      focusInitial();
      requestRef.current();
    };
    dialog.addEventListener("cancel", cancel);
    dialog.addEventListener("close", closed);
    dialog.showModal();
    focusInitial();
    return () => {
      unmounting = true;
      dialog.removeEventListener("cancel", cancel);
      dialog.removeEventListener("close", closed);
      if (dialog.open) dialog.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  return <dialog
    ref={dialogRef}
    className={`app-dialog ${className}`}
    aria-labelledby={labelledBy}
    tabIndex={-1}
    onMouseDown={closeOnBackdrop ? (event) => {
      if (event.target !== event.currentTarget) return;
      // Otherwise the press moves focus after the trigger has been refocused.
      event.preventDefault();
      requestRef.current();
    } : undefined}
  >
    {showsNotices && <div className="dialog-notices">{notices}</div>}
    {children}
  </dialog>;
}
