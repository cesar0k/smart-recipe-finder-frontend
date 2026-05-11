/**
 * Tears down the cold-start splash (defined in `index.html`).
 * Idempotent within a page lifecycle. Adds `splash--leaving` to
 * trigger the fade + scale-down, then removes the element after the
 * transition.
 */

const LEAVE_DURATION_MS = 500;

let dismissed = false;

export function dismissSplash(): void {
  if (dismissed) return;
  dismissed = true;
  // Drop the splash-scoped scrollbar gutter so Radix UI's body-scroll-lock
  // (Dialog / DropdownMenu / Sheet) doesn't double-pad the body.
  document.documentElement.removeAttribute("data-splash-active");
  const el = document.getElementById("splash");
  if (!el) return;
  el.classList.add("splash--leaving");
  setTimeout(() => {
    el.parentNode?.removeChild(el);
  }, LEAVE_DURATION_MS);
}
