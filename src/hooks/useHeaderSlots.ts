import { useEffect } from "react";
import type { ReactNode } from "react";
import { useHeaderSlotsSetter } from "@/components/layout/HeaderSlotsContext";

/**
 * Pages call this to publish their header slots into the shared static header.
 *
 * - Calling it AT ALL opts the page into showing the header (visible: true).
 * - Pages without a header simply never call this hook (default = hidden),
 *   so there is no flash of the header on auth/404 pages.
 *
 * Slots are republished whenever `deps` change, so a page can update its
 * rightContent when async state resolves (e.g. RecipePage's Edit/Delete menu
 * appearing once `canModify` is known). Pass the *primitive* triggers in deps
 * (booleans/ids/t), NOT the JSX nodes themselves — those are new objects every
 * render and would loop.
 *
 * On unmount the header resets to hidden, so the next page starts clean.
 */
export function useHeaderSlots(
  slots: { left?: ReactNode; right?: ReactNode },
  deps: ReadonlyArray<unknown> = []
) {
  const { setSlots, reset } = useHeaderSlotsSetter();

  // Publish on mount and whenever the page's primitive deps change.
  useEffect(() => {
    setSlots(slots);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Reset only on real unmount (stable dep) — not on every deps change, which
  // would briefly reset→republish and could flicker the header content.
  useEffect(() => {
    return () => reset();
  }, [reset]);
}
