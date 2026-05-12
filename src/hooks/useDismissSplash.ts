import { useEffect } from "react";
import { dismissSplash } from "@/lib/splash";

/**
 * Dismisses the cold-start splash on mount.
 */
export function useDismissSplash(): void {
  useEffect(() => {
    dismissSplash();
  }, []);
}
