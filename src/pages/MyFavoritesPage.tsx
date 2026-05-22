import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";

import { Header } from "@/components/layout/Header";
import { RecipeCard } from "@/features/recipes/components/RecipeCard";
import { RecipeCardSkeleton } from "@/components/skeletons/RecipeCardSkeleton";
import { Spinner } from "@/components/ui/spinner";
import { Footer } from "@/components/layout/Footer";
import { FavoriteButton } from "@/features/recipes/components/FavoriteButton";
import { useMyFavorites } from "@/features/recipes/hooks/useMyFavorites";
import { useDismissSplash } from "@/hooks/useDismissSplash";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function MyFavoritesPage() {
  useDismissSplash();
  const { t } = useTranslation();
  useDocumentTitle(t("page_title_favorites"));
  const {
    recipes,
    isLoading,
    isError,
    error,
    isEmpty,
    sentinelRef,
    isFetchingNextPage,
    hasNextPage,
  } = useMyFavorites();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Header />

      <main className="flex-1 container mx-auto px-4 pt-8 pb-24 md:py-12">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-6">
          {t("favorites_title")}
        </h1>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center text-red-500 py-10">
            {axios.isAxiosError(error) && !error.response
              ? t("connection_error")
              : t("search_error")}
          </div>
        )}

        {isEmpty && (
          <p className="text-gray-500 text-center py-10">
            {t("favorites_empty")}
          </p>
        )}

        {recipes.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  to={`/recipe/${recipe.id}`}
                  className="block"
                >
                  <RecipeCard
                    title={recipe.title || t("untitled_recipe")}
                    time={recipe.cooking_time_in_minutes || 0}
                    difficulty={recipe.difficulty}
                    image={recipe.image_urls?.[0] || ""}
                    thumbnail={recipe.thumbnail_urls?.[0]}
                    ownerUsername={recipe.owner_username}
                    imageOverlay={
                      <FavoriteButton
                        recipeId={recipe.id}
                        isFavorited={recipe.is_favorited ?? true}
                        compact
                      />
                    }
                  />
                </Link>
              ))}
            </div>

            {hasNextPage && (
              <div
                ref={sentinelRef}
                className="flex justify-center items-center py-8"
              >
                {isFetchingNextPage && <Spinner size="md" />}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
