import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import { routeProgress } from "@/lib/routeProgress";

/**
 * React bridge to the imperative `routeProgress` controller — pings
 * `navigationCommitted()` when the URL (pathname + search) actually
 * changes. Tracking `search` too matters for in-page navigations like
 * the "Show all" category links and the filter sheet.
 */
export function RouteTransitionIndicator() {
  const { pathname, search } = useLocation();
  const key = pathname + search;
  const prevKey = useRef(key);

  useEffect(() => {
    if (key !== prevKey.current) {
      prevKey.current = key;
      routeProgress.navigationCommitted();
    }
  }, [key]);

  return null;
}

/** Rendered inside <Suspense fallback={…}> to keep the bar busy while a
 *  lazy chunk is downloading; the token is released on unmount. */
export function IndicatorSuspenseFallback() {
  useEffect(() => routeProgress.acquireSuspense(), []);
  return null;
}
