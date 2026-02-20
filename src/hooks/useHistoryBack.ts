import { useEffect, useRef, useCallback } from "react";

/**
 * Syncs a dialog/modal open state with browser history.
 * When the dialog opens, pushes a history entry with the same URL.
 * When the user presses browser "Back", the dialog closes instead of navigating away.
 * When closed programmatically (X, overlay, submit), the extra history entry
 * remains but points to the same URL, so the next "Back" is harmless.
 */
export function useHistoryBack(
  open: boolean,
  onOpenChange: (open: boolean) => void
) {
  const pushedRef = useRef(false);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        window.history.pushState({ dialog: true }, "", window.location.href);
        pushedRef.current = true;
      } else {
        pushedRef.current = false;
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (!open) return;

    const onPopState = () => {
      if (pushedRef.current) {
        pushedRef.current = false;
        onOpenChange(false);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [open, onOpenChange]);

  return handleOpenChange;
}
