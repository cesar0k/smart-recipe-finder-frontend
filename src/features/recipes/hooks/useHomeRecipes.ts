import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useReadRecipes, useSearchRecipes } from "@/api/recipes/recipes";

export function useHomeRecipes() {
  const [searchParams, setSearchParams] = useSearchParams();

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

  const includeParam =
    includeFromUrl.length > 0 ? includeFromUrl.join(",") : undefined;
  const excludeParam =
    excludeFromUrl.length > 0 ? excludeFromUrl.join(",") : undefined;

  const {
    data: allRecipes,
    isLoading: isLoadingAll,
    isError: isErrorAll,
  } = useReadRecipes(
    {
      limit: 100,
      skip: 0,
      include_ingredients: includeParam,
      exclude_ingredients: excludeParam,
    },
    { query: { enabled: !isSearching } }
  );

  // API: Search Recipes (with filters)
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
    // Clear URL
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

  // VIEW MODEL
  const recipes = isSearching ? searchResults : allRecipes;
  const isLoading = isSearching ? isLoadingSearch : isLoadingAll;
  const isError = isSearching ? isErrorSearch : isErrorAll;

  const getHeading = () => {
    if (isSearching) {
      if (isLoading) return `Searching for "${queryFromUrl}"...`;
      return `Results for "${queryFromUrl}"`;
    }
    if (includeFromUrl.length > 0 || excludeFromUrl.length > 0) {
      return "Filtered Recipes";
    }
    return "Find your dream meal";
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

    recipes,
    isLoading,
    isError,
    isEmpty: !isLoading && !isError && recipes?.length === 0,
    isSearchView: isSearching,
    submittedSearch: queryFromUrl,
    isSearching,
    heading: getHeading(),
  };
}
