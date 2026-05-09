/**
 * Hook for fetching recipe categories (homepage shelves).
 * Written manually — not auto-generated — because the endpoint returns
 * a custom shape that Orval doesn't know about yet.
 */

import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { customInstance } from "../axios";
import type { Recipe } from "../model";

export interface RecipeCategory {
  meal_type: string;
  label: string;
  recipes: Recipe[];
}

export const getRecipeCategoriesQueryKey = (limitPer = 6) =>
  ["/api/v1/recipes/categories", { limitPer }] as const;

export const readRecipeCategories = (
  limitPer = 6,
  signal?: AbortSignal
): Promise<RecipeCategory[]> =>
  customInstance<RecipeCategory[]>(
    { url: "/api/v1/recipes/categories", method: "GET", params: { limit_per: limitPer }, signal },
  );

export function useRecipeCategories(
  limitPer = 6,
  options?: Partial<UseQueryOptions<RecipeCategory[]>>
) {
  return useQuery<RecipeCategory[]>({
    queryKey: getRecipeCategoriesQueryKey(limitPer),
    queryFn: ({ signal }) => readRecipeCategories(limitPer, signal),
    staleTime: 5 * 60 * 1000, // 5 min — categories change rarely
    ...options,
  });
}
