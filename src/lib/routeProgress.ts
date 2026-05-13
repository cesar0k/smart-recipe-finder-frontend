/**
 * Imperative top-of-page progress bar.
 *
 * Lives outside React because clicking a `<Link>` to a lazy route in
 * React 18+ concurrent mode triggers a Suspense transition that pauses
 * `setState` updates — a React-driven indicator never paints on the
 * old page, only on the new one. This module appends a single `<div>`
 * to `document.body` and toggles inline styles directly.
 *
 * Scoped to route navigation only; in-page data fetches are covered
 * by per-page skeletons.
 *
 * Two busy signals:
 *   • `navActive`     — a click / pushState / popstate intent is in
 *                       flight. Cleared post-commit (or by watchdog).
 *   • `suspendTokens` — incremented while a Suspense fallback is
 *                       mounted for a lazy chunk that loaded in
 *                       response to a recent navigation.
 */

const SHOW_AFTER_MS = 300;
const MIN_VISIBLE_MS = 350;
const FINISH_FADE_MS = 300;
const SETTLE_GRACE_MS = 200;
// Hold `navActive` this long after pathname commits, in case a
// Suspense fallback takes over the busy state.
const NAV_POST_COMMIT_GRACE_MS = 80;
// Absolute safety cap so a leaked nav token can't trap the bar forever.
const NAV_HARD_WATCHDOG_MS = 30_000;
// If the URL doesn't change within this window after a click, the
// click was a no-op (carousel swipe, same-URL link, etc) — release.
const NAV_NOOP_WATCHDOG_MS = 250;
// Suspense fallbacks mounted within this window of `startNavigation`
// are treated as the navigated lazy chunk. Later fallbacks are
// in-page React 18 transitions — silent.
const SUSPENSE_ACK_WINDOW_MS = 600;

let root: HTMLDivElement | null = null;
let inner: HTMLDivElement | null = null;

type Phase = "idle" | "pending" | "running" | "finishing";
let phase: Phase = "idle";
let progress = 0;
let visibleAt = 0;

let showTimer: ReturnType<typeof setTimeout> | null = null;
let settleTimer: ReturnType<typeof setTimeout> | null = null;
let finishTimer: ReturnType<typeof setTimeout> | null = null;
let fadeTimer: ReturnType<typeof setTimeout> | null = null;
let creepInterval: ReturnType<typeof setInterval> | null = null;

let navActive = false;
let suspendTokens = 0;
// Wall-clock of the most recent `startNavigation`, gating which
// Suspense fallbacks count (see SUSPENSE_ACK_WINDOW_MS).
let lastStartNavAt = 0;
let navNoopTimer: ReturnType<typeof setTimeout> | null = null;
let navHardTimer: ReturnType<typeof setTimeout> | null = null;
let navReleaseTimer: ReturnType<typeof setTimeout> | null = null;

function ensureMounted() {
  if (root || typeof document === "undefined") return;
  root = document.createElement("div");
  root.setAttribute("aria-hidden", "true");
  root.className =
    "fixed top-0 left-0 right-0 z-50 h-[3px] bg-gray-100 pointer-events-none opacity-0";

  inner = document.createElement("div");
  inner.className = "h-full bg-black transition-[width] duration-200 ease-out";
  inner.style.width = "0%";

  root.appendChild(inner);
  document.body.appendChild(root);
}

function setVisible(visible: boolean) {
  if (!root) return;
  if (visible) {
    root.style.transition = "";
    root.style.opacity = "1";
  } else {
    root.style.transition = `opacity ${FINISH_FADE_MS}ms ease-out`;
    root.style.opacity = "0";
  }
}

function setProgress(next: number) {
  progress = next;
  if (inner) inner.style.width = `${next}%`;
}

function clearAnimationTimers() {
  if (showTimer) clearTimeout(showTimer);
  if (settleTimer) clearTimeout(settleTimer);
  if (finishTimer) clearTimeout(finishTimer);
  if (fadeTimer) clearTimeout(fadeTimer);
  if (creepInterval) clearInterval(creepInterval);
  showTimer = null;
  settleTimer = null;
  finishTimer = null;
  fadeTimer = null;
  creepInterval = null;
}

function clearNavTimers() {
  if (navNoopTimer) clearTimeout(navNoopTimer);
  if (navHardTimer) clearTimeout(navHardTimer);
  if (navReleaseTimer) clearTimeout(navReleaseTimer);
  navNoopTimer = null;
  navHardTimer = null;
  navReleaseTimer = null;
}

function enterPending() {
  ensureMounted();
  clearAnimationTimers();
  phase = "pending";
  setProgress(0);
  setVisible(false);
  showTimer = setTimeout(() => {
    if (phase !== "pending") return;
    phase = "running";
    visibleAt = Date.now();
    setVisible(true);
    creepInterval = setInterval(() => {
      setProgress(progress + (85 - progress) * 0.1);
    }, 200);
  }, SHOW_AFTER_MS);
}

function isBusy() {
  return navActive || suspendTokens > 0;
}

function tryFinish() {
  if (isBusy()) return;
  if (phase === "pending") {
    clearAnimationTimers();
    phase = "idle";
    setProgress(0);
    return;
  }
  if (phase !== "running" || settleTimer) return;
  settleTimer = setTimeout(() => {
    settleTimer = null;
    if (isBusy()) return;
    if (creepInterval) {
      clearInterval(creepInterval);
      creepInterval = null;
    }
    const visibleFor = Date.now() - visibleAt;
    const wait = Math.max(0, MIN_VISIBLE_MS - visibleFor);
    finishTimer = setTimeout(() => {
      phase = "finishing";
      setProgress(100);
      setVisible(false);
      fadeTimer = setTimeout(() => {
        if (isBusy()) return;
        phase = "idle";
        setProgress(0);
      }, FINISH_FADE_MS);
    }, wait);
  }, SETTLE_GRACE_MS);
}

function reconcile() {
  if (isBusy()) {
    if (settleTimer) {
      clearTimeout(settleTimer);
      settleTimer = null;
    }
    if (phase === "idle" || phase === "finishing") enterPending();
  } else {
    tryFinish();
  }
}

function releaseNav() {
  if (!navActive) return;
  navActive = false;
  clearNavTimers();
  reconcile();
}

export const routeProgress = {
  /**
   * Anchor click / popstate / programmatic navigate() detected.
   * Back-to-back calls visibly restart at 0% so a second click feels
   * registered.
   */
  startNavigation() {
    lastStartNavAt = Date.now();
    const wasRunning = phase === "running" || phase === "finishing";
    navActive = true;
    clearNavTimers();

    // Snapshot the live URL — `useLocation()` is paused during a
    // Suspense transition, so a slow lazy chunk can leave React's view
    // of the URL stale for seconds. We compare against `window.location`
    // directly to know when the navigation has actually happened.
    const startPath =
      typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
    navNoopTimer = setTimeout(() => {
      navNoopTimer = null;
      if (suspendTokens > 0) return;
      const currentPath =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "";
      // URL moved → real navigation, keep navActive alive until
      // `navigationCommitted` (or hard watchdog).
      if (currentPath !== startPath) return;
      releaseNav();
    }, NAV_NOOP_WATCHDOG_MS);

    navHardTimer = setTimeout(() => {
      navHardTimer = null;
      releaseNav();
    }, NAV_HARD_WATCHDOG_MS);

    if (wasRunning) {
      enterPending();
    } else {
      reconcile();
    }
  },

  /**
   * Pathname (or search) committed. Hold `navActive` for a grace
   * window so a Suspense fallback can claim the busy state before we
   * release.
   */
  navigationCommitted() {
    if (!navActive) return;
    if (navNoopTimer) {
      clearTimeout(navNoopTimer);
      navNoopTimer = null;
    }
    if (navReleaseTimer) clearTimeout(navReleaseTimer);
    navReleaseTimer = setTimeout(() => {
      navReleaseTimer = null;
      releaseNav();
    }, NAV_POST_COMMIT_GRACE_MS);
  },

  /**
   * Held while a Suspense fallback mounted for the lazy chunk of a
   * just-navigated route. Returns a release fn deferred by two RAFs so
   * the bar doesn't blink to idle between Suspense-end and the route's
   * paint. Fallbacks that mount without a recent `startNavigation`
   * (mid-page React 18 transitions) get a noop release and stay silent.
   */
  acquireSuspense(): () => void {
    if (Date.now() - lastStartNavAt > SUSPENSE_ACK_WINDOW_MS) {
      return () => {};
    }
    suspendTokens += 1;
    // Cancel the noop watchdog — a real lazy chunk is loading even if
    // the URL hasn't moved yet.
    if (navNoopTimer) {
      clearTimeout(navNoopTimer);
      navNoopTimer = null;
    }
    reconcile();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          suspendTokens = Math.max(0, suspendTokens - 1);
          reconcile();
        }),
      );
    };
  },
};

// ── Detect navigation intent ─────────────────────────────────────────────

// React Router calls replaceState during its initial hydration to normalise
// the URL. We ignore any history mutations that fire within this window so
// the progress bar doesn't show on a fresh page load.
const INIT_GRACE_MS = 500;
const _initAt = Date.now();
function _isPastInitGrace() {
  return Date.now() - _initAt > INIT_GRACE_MS;
}

function bindNavigationListeners() {
  if (typeof window === "undefined") return;
  const w = window as Window & { __routeProgressBound?: boolean };
  if (w.__routeProgressBound) return;
  w.__routeProgressBound = true;

  // Capture-phase anchor click — filter out modifier keys, new-tab
  // targets, cross-origin links, and same-URL no-ops.
  document.addEventListener(
    "click",
    (event) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target = event.target as Element | null;
      if (!target) return;
      const anchor = target.closest?.("a") as HTMLAnchorElement | null;
      if (!anchor || !anchor.href) return;
      if (anchor.target && anchor.target !== "_self") return;
      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search &&
          url.hash === window.location.hash
        ) {
          return;
        }
      } catch {
        return;
      }
      routeProgress.startNavigation();
    },
    true,
  );

  // Patch history methods so programmatic navigate() (e.g. dropdown
  // items without an <a>) is caught too.
  const w2 = window as Window & {
    __routeProgressHistoryPatched?: boolean;
  };
  if (!w2.__routeProgressHistoryPatched) {
    w2.__routeProgressHistoryPatched = true;
    const wrap = (key: "pushState" | "replaceState") => {
      const original = window.history[key].bind(window.history);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window.history[key] = ((...args: any[]) => {
        const targetUrl = args[2] as string | URL | null | undefined;
        let willChange = true;
        if (typeof targetUrl === "string" || targetUrl instanceof URL) {
          try {
            const url = new URL(String(targetUrl), window.location.href);
            willChange =
              url.pathname !== window.location.pathname ||
              url.search !== window.location.search;
          } catch {
            willChange = true;
          }
        }
        // Ignore history mutations during React Router's initial hydration.
        if (willChange && _isPastInitGrace()) routeProgress.startNavigation();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (original as any)(...args);
      }) as typeof window.history.pushState;
    };
    wrap("pushState");
    wrap("replaceState");
  }

  window.addEventListener("popstate", () => {
    if (_isPastInitGrace()) routeProgress.startNavigation();
  });
}

bindNavigationListeners();
