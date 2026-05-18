import { useCallback, useRef } from "react";
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
  const minTimeFromUrl = searchParams.get("min_time")
    ? Number(searchParams.get("min_time"))
    : undefined;
  const maxTimeFromUrl = searchParams.get("max_time")
    ? Number(searchParams.get("max_time"))
    : undefined;
  const difficultyFromUrl =
    searchParams.get("difficulty")?.split(",").filter(Boolean) || [];
  const cuisineFromUrl =
    searchParams.get("cuisine")?.split(",").filter(Boolean) || [];
  const mealTypeFromUrl = searchParams.get("meal_type") || undefined;
  const hasCommentsFromUrl = searchParams.get("has_comments") === "true";
  const VALID_SORTS = ["newest", "popular", "top_rated", "most_favorited"] as const;
  type SortValue = typeof VALID_SORTS[number];
  const rawSort = searchParams.get("sort");
  const sortFromUrl: SortValue =
    VALID_SORTS.includes(rawSort as SortValue) ? (rawSort as SortValue) : "newest";

  const isSearching = queryFromUrl.length > 0;

  const hasActiveFilters =
    includeFromUrl.length > 0 ||
    excludeFromUrl.length > 0 ||
    minTimeFromUrl !== undefined ||
    maxTimeFromUrl !== undefined ||
    difficultyFromUrl.length > 0 ||
    cuisineFromUrl.length > 0 ||
    !!mealTypeFromUrl;

  const includeParam =
    includeFromUrl.length > 0 ? includeFromUrl.join(",") : undefined;
  const excludeParam =
    excludeFromUrl.length > 0 ? excludeFromUrl.join(",") : undefined;
  const difficultyParam =
    difficultyFromUrl.length > 0 ? difficultyFromUrl.join(",") : undefined;
  const cuisineParam =
    cuisineFromUrl.length > 0 ? cuisineFromUrl.join(",") : undefined;


  const {
    data: infiniteData,
    isLoading: isLoadingAll,
    isError: isErrorAll,
    error: errorAll,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "/api/v1/recipes/",
      {
        includeParam,
        excludeParam,
        minTimeFromUrl,
        maxTimeFromUrl,
        difficultyParam,
        cuisineParam,
        mealTypeFromUrl,
        sort: sortFromUrl,
      },
    ] as const,
    queryFn: ({ pageParam = 0 }) =>
      readRecipes({
        skip: pageParam,
        limit: PAGE_SIZE,
        include_ingredients: includeParam,
        exclude_ingredients: excludeParam,
        min_time: minTimeFromUrl,
        max_time: maxTimeFromUrl,
        difficulty: difficultyParam,
        cuisine: cuisineParam,
        sort: sortFromUrl,
        ...(mealTypeFromUrl ? { meal_type: mealTypeFromUrl } : {}),
        ...(hasCommentsFromUrl ? { has_comments: true } : {}),
      } as Parameters<typeof readRecipes>[0]),
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
    error: errorSearch,
  } = useSearchRecipes(
    {
      q: queryFromUrl,
      include_ingredients: includeParam,
      exclude_ingredients: excludeParam,
      min_time: minTimeFromUrl,
      max_time: maxTimeFromUrl,
      difficulty: difficultyParam,
      cuisine: cuisineParam,
      sort: sortFromUrl,
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

  /** Called by HomeSearchBlock when user submits search */
  const handleSearch = (term: string) => {
    updateParams({ q: term || undefined });
  };

  const handleClear = () => {
    setSearchParams({});
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

  const setMinTime = (val: number | undefined) => {
    updateParams({ min_time: val !== undefined ? String(val) : undefined });
  };

  const setMaxTime = (val: number | undefined) => {
    updateParams({ max_time: val !== undefined ? String(val) : undefined });
  };

  const setDifficulty = (vals: string[]) => {
    updateParams({ difficulty: vals.length ? vals.join(",") : undefined });
  };

  const setCuisine = (vals: string[]) => {
    updateParams({ cuisine: vals.length ? vals.join(",") : undefined });
  };

  const setSort = (next: "newest" | "popular" | "top_rated" | "most_favorited") => {
    // "newest" is the default — keep the URL clean by omitting it.
    updateParams({ sort: next === "newest" ? undefined : next });
  };

  const resetFilters = () => {
    updateParams({
      include_ingredients: undefined,
      exclude_ingredients: undefined,
      min_time: undefined,
      max_time: undefined,
      difficulty: undefined,
      cuisine: undefined,
    });
  };

  /** Apply all filter values at once (single URL update, no race conditions). */
  const applyAllFilters = (filters: {
    include: string[];
    exclude: string[];
    minTime: number | undefined;
    maxTime: number | undefined;
    difficulty: string[];
    cuisine: string[];
    hasComments?: boolean;
  }) => {
    updateParams({
      include_ingredients: filters.include.length ? filters.include.join(",") : undefined,
      exclude_ingredients: filters.exclude.length ? filters.exclude.join(",") : undefined,
      min_time: filters.minTime !== undefined ? String(filters.minTime) : undefined,
      max_time: filters.maxTime !== undefined ? String(filters.maxTime) : undefined,
      difficulty: filters.difficulty.length ? filters.difficulty.join(",") : undefined,
      cuisine: filters.cuisine.length ? filters.cuisine.join(",") : undefined,
      has_comments: filters.hasComments ? "true" : undefined,
    });
  };

  // VIEW MODEL
  const recipes = isSearching ? searchResults : allRecipes;
  const isLoading = isSearching ? isLoadingSearch : isLoadingAll;
  const isError = isSearching ? isErrorSearch : isErrorAll;
  const error = isSearching ? errorSearch : errorAll;

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
    if (mealTypeFromUrl) {
      // Show the human-readable category label passed alongside meal_type
      return searchParams.get("category_label") || mealTypeFromUrl;
    }
    if (hasActiveFilters) {
      return t("filtered_recipes");
    }
    return t("hero_title");
  };

  return {
    /** Pass to HomeSearchBlock.onSearch */
    handleSearch,
    /** Pass to HomeSearchBlock.onClear — also clears URL */
    handleClear,

    includeIngredients: includeFromUrl,
    excludeIngredients: excludeFromUrl,
    setIncludeIngredients,
    setExcludeIngredients,

    minTime: minTimeFromUrl,
    maxTime: maxTimeFromUrl,
    setMinTime,
    setMaxTime,
    selectedDifficulty: difficultyFromUrl,
    setDifficulty,
    selectedCuisine: cuisineFromUrl,
    setCuisine,

    sort: sortFromUrl,
    setSort,

    hasComments: hasCommentsFromUrl,

    resetFilters,
    applyAllFilters,

    recipes,
    isLoading,
    isError,
    error,
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
