/**
 * Returns a function that patches a single recipe across ALL TanStack Query
 * caches: detail page, flat lists, infinite pages, and category shelves.
 *
 * Extracted from FavoriteButton / StarRatingButton so both use the same
 * implementation and category shelves are also kept in sync.
 */

import { useQueryClient } from "@tanstack/react-query";
import type { Recipe } from "@/api/model";
import type { RecipeCategory } from "@/api/recipes/useRecipeCategories";

export function useUpdateRecipeInCaches() {
  const queryClient = useQueryClient();

  return (recipeId: number, next: Partial<Recipe>) => {
    // 1. Single-recipe detail cache
    queryClient.setQueriesData<Recipe>(
      { queryKey: ["/api/v1/recipes/", recipeId] as unknown as readonly unknown[], exact: false },
      (old) => (old ? { ...old, ...next } : old)
    );

    queryClient.getQueryCache().findAll().forEach((query) => {
      const data = query.state.data as unknown;
      if (!data) return;

      // 2. Infinite query (homepage feed)
      if (
        typeof data === "object" &&
        data !== null &&
        "pages" in data &&
        Array.isArray((data as { pages: unknown }).pages)
      ) {
        const infinite = data as { pages: Recipe[][]; pageParams: unknown[] };
        let mutated = false;
        const newPages = infinite.pages.map((page) =>
          page.map((r) => {
            if (r.id === recipeId) { mutated = true; return { ...r, ...next }; }
            return r;
          })
        );
        if (mutated) queryClient.setQueryData(query.queryKey, { ...infinite, pages: newPages });
        return;
      }

      // 3. Category shelves: [{ meal_type, label, recipes: Recipe[] }]
      if (
        Array.isArray(data) &&
        data.length > 0 &&
        typeof data[0] === "object" &&
        data[0] !== null &&
        "meal_type" in (data[0] as object)
      ) {
        let mutated = false;
        const newShelves = (data as RecipeCategory[]).map((shelf) => {
          const newRecipes = shelf.recipes.map((r) => {
            if (r.id === recipeId) { mutated = true; return { ...r, ...next }; }
            return r;
          });
          return mutated ? { ...shelf, recipes: newRecipes } : shelf;
        });
        if (mutated) queryClient.setQueryData(query.queryKey, newShelves);
        return;
      }

      // 4. Flat list cache
      if (Array.isArray(data)) {
        let mutated = false;
        const newList = (data as Recipe[]).map((r) => {
          if (r && typeof r === "object" && "id" in r && r.id === recipeId) {
            mutated = true; return { ...r, ...next };
          }
          return r;
        });
        if (mutated) queryClient.setQueryData(query.queryKey, newList);
        return;
      }

      // 5. Single recipe object
      if (
        typeof data === "object" &&
        data !== null &&
        "id" in data &&
        (data as Recipe).id === recipeId
      ) {
        queryClient.setQueryData(query.queryKey, { ...(data as Recipe), ...next });
      }
    });
  };
}
