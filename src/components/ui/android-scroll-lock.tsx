/**
 * AndroidScrollLock
 *
 * Android Chrome hides/shows the address bar based on page scroll position.
 * When a fixed modal (e.g. FilterSheet) is open and the user scrolls inside it,
 * Chrome interprets it as page scroll and shifts the viewport — causing #root
 * to visually move downward.
 *
 * The fix is the classic "scroll lock" pattern:
 *   1. On modal open:  record scrollY, then set #root { position:fixed; top:-scrollY }
 *   2. On modal close: restore position:static and window.scrollTo(0, savedScrollY)
 *
 * This is exactly what react-remove-scroll does for iOS, but it skips it for
 * Android Chrome. We replicate it by watching the body[data-scroll-locked]
 * attribute that Radix/react-remove-scroll sets.
 *
 * Only active on narrow viewports (< 768 px) where the BottomNav and address
 * bar resizing are relevant.
 */
import { useEffect } from "react";

export function AndroidScrollLock() {
  useEffect(() => {
    // Only needed on narrow (mobile) viewports
    if (window.innerWidth >= 768) return;

    // react-remove-scroll (used internally by Radix Dialog/Sheet/AlertDialog)
    // already applies the equivalent `position: fixed; top: -scrollY` trick
    // on iOS Safari. If we ALSO do it on #root we end up with two competing
    // fixed-position layers — body and #root — and the page visibly jumps to
    // the top when the modal opens (and the iOS address bar pops back in).
    // Skip iOS entirely; this hook is here purely to fill the Android-Chrome
    // gap that react-remove-scroll explicitly opts out of.
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      // iPadOS 13+ reports itself as Mac with touch — distinguish from desktop.
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS) return;

    const root = document.getElementById("root");
    if (!root) return;

    let savedScrollY = 0;

    const lock = () => {
      if (window.innerWidth >= 768) return;
      savedScrollY = window.scrollY;
      root.style.position = "fixed";
      root.style.top = `-${savedScrollY}px`;
      root.style.left = "0";
      root.style.right = "0";
      root.style.width = "100%";
      root.style.overflow = "hidden";
    };

    const unlock = () => {
      root.style.position = "";
      root.style.top = "";
      root.style.left = "";
      root.style.right = "";
      root.style.width = "";
      root.style.overflow = "";
      window.scrollTo({ top: savedScrollY, behavior: "instant" });
    };

    // Only lock for ACTUAL modal overlays — not for Radix Select /
    // DropdownMenu, which also set body[data-scroll-locked] but whose short
    // popup doesn't need (and is broken by) a #root position:fixed freeze.
    const hasModalOverlay = () =>
      !!document.querySelector(
        '[data-slot="dialog-overlay"],[data-slot="sheet-overlay"],[data-slot="alert-dialog-overlay"]'
      );

    let locked = false;
    const sync = () => {
      const shouldLock = document.body.hasAttribute("data-scroll-locked") && hasModalOverlay();
      if (shouldLock && !locked) {
        locked = true;
        lock();
      } else if (!shouldLock && locked) {
        locked = false;
        unlock();
      }
    };

    // Watch both the body attribute AND added/removed overlay nodes, since the
    // overlay may mount a frame after the attribute flips.
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-scroll-locked"],
      childList: true,
      subtree: true,
    });

    sync();

    return () => {
      observer.disconnect();
      if (locked) unlock();
    };
  }, []);

  return null;
}
