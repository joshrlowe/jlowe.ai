// The /world route sends 2D-only tiers (mode=2d / prefers-reduced-motion) back
// to "/" and shows a one-time sonner notice. On a COLD load the <Toaster/> is
// lazy (next/dynamic, ssr:false) and has not subscribed yet when the redirect
// fires — and sonner v2 publishes a toast to its current subscribers and never
// replays it to a late one, so emitting directly there is lost.
//
// So the redirect QUEUES the notice (a sessionStorage flag) and the Toaster
// emits it once it has actually mounted/subscribed. A window event covers the
// warm in-app-navigation case, where the Toaster is already mounted.

const KEY = "world:2d-notice";

/** Dispatched on `window` so an already-mounted Toaster can flush immediately. */
export const TWO_D_NOTICE_EVENT = "world:2d-notice";

/** Queue the 2D-fallback notice and signal any already-mounted Toaster. */
export function queueTwoDNotice(): void {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    // sessionStorage can throw (private mode / disabled). The notice is
    // best-effort — a failure just means no toast, never a broken redirect.
  }
  window.dispatchEvent(new Event(TWO_D_NOTICE_EVENT));
}

/** Consume the queued notice (clears it); true exactly once per queue. */
export function consumeTwoDNotice(): boolean {
  try {
    if (sessionStorage.getItem(KEY) === "1") {
      sessionStorage.removeItem(KEY);
      return true;
    }
  } catch {
    // ignore — see queueTwoDNotice
  }
  return false;
}
