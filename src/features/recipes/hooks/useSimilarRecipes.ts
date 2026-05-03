import { AxiosError } from "axios";
import { useReadSimilarRecipes } from "@/api/recipes/recipes";

export function useSimilarRecipes(recipeId: number | undefined) {
  const isValidId = typeof recipeId === "number" && recipeId > 0;

  const query = useReadSimilarRecipes(
    recipeId ?? 0,
    undefined,
    {
      query: {
        enabled: isValidId,
        staleTime: 5 * 60 * 1000,
        retry: (count, err) => {
          const status = (err as AxiosError)?.response?.status;
          if (status === 503) return count < 1;
          return count < 2;
        },
      },
    },
  );

  return {
    similar: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
