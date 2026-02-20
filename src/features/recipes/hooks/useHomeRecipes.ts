import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { readRecipes, useSearchRecipes } from "@/api/recipes/recipes";
import { useTranslation } from "react-i18next";
import type { Recipe } from "@/api/model";

const PAGE_SIZE = 12;

export function useHomeRecipes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();

  const queryFromUrl = searchParams.get("q") || "";
  const includeFromUrl =
    searchParams.get("include_ingredients")?.split(",").filter(Boolean) || [];
  const excludeFromUrl =
    searchParams.get("exclude_ingredients")?.split(",").filter(Boolean) || [];

  const [searchTerm, setSearchTerm] = useState(queryFromUrl);

  useEffect(() => {
    setSearchTerm(queryFromUrl);
  }, [queryFromUrl]);

  const isSearching = queryFromUrl.length > 0;

  const hasActiveFilters =
    includeFromUrl.length > 0 || excludeFromUrl.length > 0;

  const includeParam =
    includeFromUrl.length > 0 ? includeFromUrl.join(",") : undefined;
  const excludeParam =
    excludeFromUrl.length > 0 ? excludeFromUrl.join(",") : undefined;


  const {
    data: infiniteData,
    isLoading: isLoadingAll,
    isError: isErrorAll,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["/api/v1/recipes/", { includeParam, excludeParam }] as const,
    queryFn: ({ pageParam = 0 }) =>
      readRecipes({
        skip: pageParam,
        limit: PAGE_SIZE,
        include_ingredients: includeParam,
        exclude_ingredients: excludeParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return lastPageParam + PAGE_SIZE;
    },
    enabled: !isSearching,
  });

  const {
    data: searchResults,
    isLoading: isLoadingSearch,
    isError: isErrorSearch,
  } = useSearchRecipes(
    {
      q: queryFromUrl,
      include_ingredients: includeParam,
      exclude_ingredients: excludeParam,
    },
    { query: { enabled: isSearching } }
  );

  const allRecipes: Recipe[] = infiniteData
    ? infiniteData.pages.flat()
    : [];

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

  // --- ACTIONS ---
  const updateParams = (newParams: Record<string, string | undefined>) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
    });
    setSearchParams(nextParams);
  };

  const handleSearch = () => {
    updateParams({ q: searchTerm.trim() || undefined });
  };

  const handleClear = () => {
    setSearchTerm("");
    setSearchParams({});
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const setIncludeIngredients = (ingredients: string[]) => {
    updateParams({
      include_ingredients: ingredients.length
        ? ingredients.join(",")
        : undefined,
    });
  };

  const setExcludeIngredients = (ingredients: string[]) => {
    updateParams({
      exclude_ingredients: ingredients.length
        ? ingredients.join(",")
        : undefined,
    });
  };

  const resetFilters = () => {
    updateParams({
      include_ingredients: undefined,
      exclude_ingredients: undefined,
    });
  };

  // VIEW MODEL
  const recipes = isSearching ? searchResults : allRecipes;
  const isLoading = isSearching ? isLoadingSearch : isLoadingAll;
  const isError = isSearching ? isErrorSearch : isErrorAll;

  const getHeading = () => {
    if (isSearching) {
      if (isLoading)
        return t("searching_for", {
          query: queryFromUrl,
        });
      return t("search_results_for", {
        query: queryFromUrl,
      });
    }
    if (includeFromUrl.length > 0 || excludeFromUrl.length > 0) {
      return t("filtered_recipes");
    }
    return t("hero_title");
  };

  return {
    searchTerm,
    setSearchTerm,
    handleSearch,
    handleClear,
    onKeyDown,

    includeIngredients: includeFromUrl,
    excludeIngredients: excludeFromUrl,
    setIncludeIngredients,
    setExcludeIngredients,
    resetFilters,

    recipes,
    isLoading,
    isError,
    isEmpty: !isLoading && !isError && (!recipes || recipes.length === 0),
    isSearchView: isSearching,
    hasActiveFilters,
    submittedSearch: queryFromUrl,
    isSearching,
    heading: getHeading(),

    // Infinite scroll
    sentinelRef,
    isFetchingNextPage,
    hasNextPage: !isSearching && (hasNextPage ?? false),
  };
}
