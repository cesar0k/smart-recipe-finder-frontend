import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteRecipe } from "@/api/recipes/recipes";
import { useTranslation } from "react-i18next";

/**
 * Delete the current recipe and return the user to wherever they came from.
 *
 * Previously this did `window.location.href = "/"` to "clear stale caches",
 * which had two problems:
 *   1. Always dumped the user on the home page, even if they reached
 *      /recipe/:id from /moderation, /favorites, a user profile etc.
 *   2. Triggered a full page reload, throwing away all in-memory React state
 *      (auth context, scroll position, open WS, route progress…) for what
 *      was really just a cache invalidation.
 *
 * The new flow is SPA-native: drop the React Query cache for everything
 * recipe-shaped, then `navigate(-1)` so the user lands back on the page
 * that linked them here. `location.key === "default"` means we entered the
 * SPA cold on /recipe/:id (deep link, refresh, external referer) — there is
 * no history entry to go back to, so fall back to /.
 */
export function useDeleteRecipeLogic() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useDeleteRecipe();

  const deleteRecipe = async (id: number) => {
    try {
      await mutateAsync({ recipeId: id });

      toast.success(t("toast_deleted"));

      // Navigate FIRST so the recipe page unmounts before the invalidation
      // refetches `/api/v1/recipes/:id` (which now returns 404) — otherwise
      // the user sees a brief "not found" flash before the route change.
      // Smart back: if we have history inside the SPA, go back to it; else
      // home. Mirrors the universal BackButton heuristic.
      if (location.key !== "default") {
        navigate(-1);
      } else {
        navigate("/", { replace: true });
      }

      // Then wipe every cached query that could mention this recipe so the
      // referrer page (recipe list / moderation queue / favorites …) refetches
      // without the deleted row. invalidateQueries() with no filter matches
      // all queries — cheap and complete.
      queryClient.invalidateQueries();
    } catch (error) {
      console.error(error);
      toast.error(t("toast_error_delete"));
    }
  };

  return {
    deleteRecipe,
    isDeleting: isPending,
  };
}
