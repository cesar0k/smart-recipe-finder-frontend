import { motion } from "framer-motion";
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
import type { Recipe } from "@/api/model";

interface FavoriteButtonProps {
  recipeId: number;
  isFavorited: boolean;
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
  compact = false,
  className,
}: FavoriteButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { mutate: favorite, isPending: favoring } = useFavoriteRecipe();
  const { mutate: unfavorite, isPending: unfavoring } = useUnfavoriteRecipe();
  const isPending = favoring || unfavoring;

  // Walks every recipe-bearing React Query cache (infinite, flat, single
  // detail) and patches the recipe inline. Keeps optimistic state in sync
  // across HomePage / shelves / MyFavorites / RecipePage simultaneously.
  const updateRecipeInCaches = (next: Partial<Recipe>) => {
    queryClient.setQueriesData<Recipe>(
      { queryKey: ["/api/v1/recipes/", recipeId] as unknown as readonly unknown[], exact: false },
      (old) => (old ? { ...old, ...next } : old)
    );
    queryClient
      .getQueryCache()
      .findAll()
      .forEach((query) => {
        const data = query.state.data as unknown;
        if (!data) return;
        // Infinite query: { pages: Recipe[][], pageParams: [] }
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
              if (r.id === recipeId) {
                mutated = true;
                return { ...r, ...next };
              }
              return r;
            })
          );
          if (mutated) {
            queryClient.setQueryData(query.queryKey, {
              ...infinite,
              pages: newPages,
            });
          }
          return;
        }
        // Flat list cache.
        if (Array.isArray(data)) {
          let mutated = false;
          const newList = (data as Recipe[]).map((r) => {
            if (r && typeof r === "object" && "id" in r && r.id === recipeId) {
              mutated = true;
              return { ...r, ...next };
            }
            return r;
          });
          if (mutated) {
            queryClient.setQueryData(query.queryKey, newList);
          }
          return;
        }
        // Single-recipe cache (detail page).
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
    updateRecipeInCaches({ is_favorited: !isFavorited });
    updateFavoritesCheckCaches(!isFavorited);

    const onError = () => {
      updateRecipeInCaches(previous);
      updateFavoritesCheckCaches(isFavorited);
      toast.error(t("favorite_toast_error"));
    };

    if (isFavorited) {
      unfavorite(
        { recipeId },
        {
          onSuccess: (recipe) => {
            updateRecipeInCaches({
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
            updateRecipeInCaches({
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

  // AnimatedWidth interpolates the wrapper width when the label changes;
  // colour + Heart scale are driven by framer-motion on the button itself.
  const ROSE_500 = "#f43f5e";
  const ROSE_500_BORDER = "#f43f5e";
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
          // Match buttonVariants size=default minus its color transitions:
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
        <span className="whitespace-nowrap">{label}</span>
      </motion.button>
    </AnimatedWidth>
  );
}
