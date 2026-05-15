import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { AnimatedWidth } from "@/components/ui/animated-width";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import {
  useFavoriteRecipe,
  useUnfavoriteRecipe,
} from "@/api/favorites/favorites";
import { useUpdateRecipeInCaches } from "@/features/recipes/hooks/useUpdateRecipeInCaches";

interface FavoriteButtonProps {
  recipeId: number;
  isFavorited: boolean;
  /** Show count inside the button (recipe detail page only). */
  favoritesCount?: number;
  /** When true, render as a small overlay icon (used on RecipeCard). */
  compact?: boolean;
  className?: string;
}

/**
 * Heart toggle with optimistic update + rollback. Anonymous users see the
 * icon but a tap takes them to /login. Lives inside an interactive element
 * (the parent <Link> on cards), so we always swallow the click event.
 */
export function FavoriteButton({
  recipeId,
  isFavorited,
  favoritesCount,
  compact = false,
  className,
}: FavoriteButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const updateRecipeInCaches = useUpdateRecipeInCaches();

  const { mutate: favorite, isPending: favoring } = useFavoriteRecipe();
  const { mutate: unfavorite, isPending: unfavoring } = useUnfavoriteRecipe();
  const isPending = favoring || unfavoring;

  /** Keeps the /favorites/check overlay cache (used by shelves) in sync. */
  const updateFavoritesCheckCaches = (favorited: boolean) => {
    queryClient
      .getQueryCache()
      .findAll()
      .forEach((query) => {
        const data = query.state.data as unknown;
        if (
          !data ||
          typeof data !== "object" ||
          data === null ||
          !("favorited_ids" in data) ||
          !Array.isArray((data as { favorited_ids: unknown }).favorited_ids)
        ) {
          return;
        }
        const current = (data as { favorited_ids: number[] }).favorited_ids;
        const present = current.includes(recipeId);
        if (favorited === present) return;
        const nextIds = favorited
          ? [...current, recipeId]
          : current.filter((id) => id !== recipeId);
        queryClient.setQueryData(query.queryKey, { favorited_ids: nextIds });
      });
  };

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info(t("login_to_favorite"));
      navigate("/login");
      return;
    }
    if (isPending) return;

    const previous = { is_favorited: isFavorited };
    // Optimistic: flip immediately.
    updateRecipeInCaches(recipeId, { is_favorited: !isFavorited });
    updateFavoritesCheckCaches(!isFavorited);

    const onError = () => {
      updateRecipeInCaches(recipeId, previous);
      updateFavoritesCheckCaches(isFavorited);
      toast.error(t("favorite_toast_error"));
    };

    if (isFavorited) {
      unfavorite(
        { recipeId },
        {
          onSuccess: (recipe) => {
            updateRecipeInCaches(recipeId, {
              is_favorited: false,
              favorites_count: recipe.favorites_count,
            });
            updateFavoritesCheckCaches(false);
            toast.success(t("favorite_toast_removed"));
          },
          onError,
        }
      );
    } else {
      favorite(
        { recipeId },
        {
          onSuccess: (recipe) => {
            updateRecipeInCaches(recipeId, {
              is_favorited: true,
              favorites_count: recipe.favorites_count,
            });
            updateFavoritesCheckCaches(true);
            toast.success(t("favorite_toast_added"));
          },
          onError,
        }
      );
    }
  };

  const label = isFavorited ? t("favorite_btn_remove") : t("favorite_btn");

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={onClick}
        disabled={isPending}
        title={label}
        aria-label={label}
        aria-pressed={isFavorited}
        aria-busy={isPending ? "true" : undefined}
        className={cn(
          "h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white text-gray-500 disabled:opacity-100",
          isFavorited && "text-rose-500 hover:text-rose-600",
          className
        )}
      >
        <Heart
          className={cn(
            "w-5 h-5 transition-transform duration-200",
            isFavorited && "fill-current scale-110"
          )}
        />
      </Button>
    );
  }

  const ROSE_500 = "#f43f5e";
  const ROSE_500_BORDER = "#f43f5e";
  const showCount = typeof favoritesCount === "number" && favoritesCount > 0;
  // When showing a count, the display text is just the number; otherwise the label.
  const displayText = showCount ? String(favoritesCount) : label;

  return (
    <AnimatedWidth className="rounded-full">
      <motion.button
        type="button"
        onClick={onClick}
        disabled={isPending}
        aria-pressed={isFavorited}
        aria-busy={isPending ? "true" : undefined}
        aria-label={label}
        initial={false}
        animate={{
          backgroundColor: isFavorited ? ROSE_500 : "rgba(255, 255, 255, 0)",
          borderColor: isFavorited ? ROSE_500_BORDER : "rgb(229, 231, 235)",
          color: isFavorited ? "#ffffff" : "rgb(17, 24, 39)",
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium h-9 px-4 py-2 rounded-full border gap-2 outline-none disabled:opacity-100 disabled:pointer-events-none focus-visible:ring-ring/50 focus-visible:ring-[3px] [&_svg]:pointer-events-none [&_svg]:shrink-0 shadow-xs",
          isFavorited && "hover:bg-rose-600",
          !isFavorited && "hover:bg-accent",
          className
        )}
      >
        <motion.span
          className="inline-flex shrink-0"
          animate={{ scale: isFavorited ? 1.1 : 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Heart
            className="w-4 h-4"
            fill={isFavorited ? "currentColor" : "none"}
          />
        </motion.span>
        {/* Animate text cross-fade so it doesn't flash when width changes */}
        <span className="relative inline-flex items-center h-[1em]">
          {/* invisible sizer keeps AnimatedWidth tracking the widest text */}
          <span className="invisible whitespace-nowrap" aria-hidden="true">
            {displayText}
          </span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={displayText}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-0 inline-flex items-center whitespace-nowrap"
            >
              {displayText}
            </motion.span>
          </AnimatePresence>
        </span>
      </motion.button>
    </AnimatedWidth>
  );
}
