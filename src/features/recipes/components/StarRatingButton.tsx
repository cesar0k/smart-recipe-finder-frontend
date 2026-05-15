import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { StarRating } from "@/components/ui/star-rating";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import {
  useUpsertRecipeRating,
  useDeleteRecipeRating,
} from "@/api/ratings/ratings";
import { useUpdateRecipeInCaches } from "@/features/recipes/hooks/useUpdateRecipeInCaches";

interface StarRatingButtonProps {
  recipeId: number;
  userRating: number | null | undefined;
  averageRating: number;
  ratingsCount: number;
  className?: string;
}

/**
 * Interactive star rating button for the recipe detail page.
 *
 * Mirrors FavoriteButton: optimistic updates across all caches, auth guard,
 * framer-motion animations for the counter appearing/disappearing.
 */
export function StarRatingButton({
  recipeId,
  userRating,
  averageRating,
  ratingsCount,
  className,
}: StarRatingButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const updateRecipeInCaches = useUpdateRecipeInCaches();

  const { mutate: upsertRating, isPending: upserting } = useUpsertRecipeRating();
  const { mutate: deleteRating, isPending: deleting } = useDeleteRecipeRating();
  const isPending = upserting || deleting;

  const handleRate = (newRating: number) => {
    if (!isAuthenticated) {
      toast.info(t("rating_login_required"));
      navigate("/login");
      return;
    }
    if (isPending) return;

    const prev = { user_rating: userRating, average_rating: averageRating, ratings_count: ratingsCount };

    // Optimistic update — also update average so the counter is visible immediately.
    // If the user is changing their vote: keep same count, recalculate avg.
    // If it's a new vote: count+1, recalculate avg.
    const isRerating = !!userRating;
    const newCount = isRerating ? ratingsCount : ratingsCount + 1;
    const newAvg = isRerating
      ? (averageRating * ratingsCount - userRating + newRating) / ratingsCount
      : (averageRating * ratingsCount + newRating) / newCount;
    updateRecipeInCaches(recipeId, {
      user_rating: newRating,
      average_rating: Math.round(newAvg * 10) / 10,
      ratings_count: newCount,
    });

    upsertRating(
      { recipeId, data: { rating: newRating } },
      {
        onSuccess: (recipe) => {
          updateRecipeInCaches(recipeId, {
            user_rating: newRating,
            average_rating: recipe.average_rating,
            ratings_count: recipe.ratings_count,
            engagement_score: recipe.engagement_score,
          });
          toast.success(t("rating_toast_saved"));
        },
        onError: () => {
          updateRecipeInCaches(recipeId, prev);
          toast.error(t("rating_toast_error"));
        },
      }
    );
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || isPending || !userRating) return;

    const prev = { user_rating: userRating, average_rating: averageRating, ratings_count: ratingsCount };
    const newCount = Math.max(0, ratingsCount - 1);
    const newAvg = newCount > 0
      ? (averageRating * ratingsCount - userRating) / newCount
      : 0;
    updateRecipeInCaches(recipeId, {
      user_rating: null,
      average_rating: Math.round(newAvg * 10) / 10,
      ratings_count: newCount,
    });

    deleteRating(
      { recipeId },
      {
        onSuccess: (recipe) => {
          updateRecipeInCaches(recipeId, {
            user_rating: null,
            average_rating: recipe.average_rating,
            ratings_count: recipe.ratings_count,
            engagement_score: recipe.engagement_score,
          });
          toast.success(t("rating_toast_removed"));
        },
        onError: () => {
          updateRecipeInCaches(recipeId, prev);
          toast.error(t("rating_toast_error"));
        },
      }
    );
  };

  const hasRated = !!userRating;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 h-9",
        "transition-colors duration-200",
        hasRated ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-white",
        className
      )}
    >
      {/* Interactive stars */}
      <StarRating
        value={userRating ?? 0}
        onChange={handleRate}
        readonly={isPending}
        size="md"
      />

      {/* Right side: avg (count) + optional × — in one stable flex group */}
      <AnimatePresence initial={false}>
        {ratingsCount > 0 && (
          <motion.span
            key="count"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap shrink-0"
          >
            {averageRating.toFixed(1)}{" "}
            <span className="text-gray-400">({ratingsCount})</span>
            {hasRated && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isPending}
                aria-label={t("rating_remove")}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 leading-none"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
