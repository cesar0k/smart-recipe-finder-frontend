import { useCallback, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { readMyFavorites } from "@/api/favorites/favorites";
import type { Recipe } from "@/api/model";

const PAGE_SIZE = 12;

/** Infinite-scroll feed of the current user's favorited recipes. */
export function useMyFavorites() {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["/api/v1/favorites/"] as const,
    queryFn: ({ pageParam = 0 }) =>
      readMyFavorites({ skip: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return lastPageParam + PAGE_SIZE;
    },
  });

  const recipes: Recipe[] = data ? data.pages.flat() : [];

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { rootMargin: "200px" }
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  return {
    recipes,
    isLoading,
    isError,
    error,
    isEmpty: !isLoading && !isError && recipes.length === 0,
    sentinelRef,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
  };
}
