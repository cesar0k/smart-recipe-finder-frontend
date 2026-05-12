/**
 * Tears down the splash.
 * Idempotent within a page lifecycle. Adds `splash--leaving` to
 * trigger the fade + scale-down, then removes the element after the
 * transition.
 */

const LEAVE_DURATION_MS = 500;

let dismissed = false;

export function dismissSplash(): void {
  if (dismissed) return;
  dismissed = true;
  const el = document.getElementById("splash");
  if (!el) return;
  el.classList.add("splash--leaving");
  setTimeout(() => {
    el.parentNode?.removeChild(el);
    document.documentElement.removeAttribute("data-splash-active");
  }, LEAVE_DURATION_MS);
}
