import { Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { RecipeCard } from "@/features/recipes/components/RecipeCard";
import { FavoriteButton } from "@/features/recipes/components/FavoriteButton";
import { useHomeRecipes } from "@/features/recipes/hooks/useHomeRecipes";
import { RecipeFilterSheet } from "@/features/recipes/components/RecipeFilterSheet";
import { RecipeSortMenu } from "@/features/recipes/components/RecipeSortMenu";
import { RecipeCardSkeleton } from "@/components/skeletons/RecipeCardSkeleton";
import { AnimatedWidth } from "@/components/ui/animated-width";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "react-i18next";
export function RecipesPage() {
  const { t } = useTranslation();
  const {
    recipes,
    isLoading,
    isError,
    error,
    isEmpty,
    handleClear,
    hasActiveFilters,
    includeIngredients,
    excludeIngredients,
    minTime,
    maxTime,
    selectedDifficulty,
    selectedCuisine,
    hasComments,
    applyAllFilters,
    sort,
    setSort,
    sentinelRef,
    isFetchingNextPage,
    hasNextPage,
  } = useHomeRecipes();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans pb-16 md:pb-0">
      <Header />

      <main className="flex-1 container mx-auto px-4 pt-8 md:pt-12 pb-8 md:pb-12">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            {t("all_recipes")}
          </h1>

          {/* Filter + Sort */}
          <div className="flex items-center gap-2 shrink-0">
            <RecipeFilterSheet
              include={includeIngredients}
              exclude={excludeIngredients}
              minTime={minTime}
              maxTime={maxTime}
              selectedDifficulty={selectedDifficulty}
              selectedCuisine={selectedCuisine}
              hasComments={hasComments}
              onApply={applyAllFilters}
            />
            <AnimatedWidth open>
              <RecipeSortMenu value={sort} onChange={setSort} />
            </AnimatedWidth>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="text-center text-red-500 py-10">
            {axios.isAxiosError(error) && !error.response
              ? t("connection_error")
              : t("search_error")}
          </div>
        )}

        {/* Empty with active filters */}
        {isEmpty && hasActiveFilters && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <p className="text-lg text-gray-600">{t("no_recipes_filters")}</p>
            <Button variant="outline" onClick={handleClear} className="rounded-full">
              {t("show_all")}
            </Button>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !isError && recipes && recipes.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <Link key={recipe.id} to={`/recipe/${recipe.id}`} className="block">
                  <RecipeCard
                    title={recipe.title || t("untitled_recipe")}
                    time={recipe.cooking_time_in_minutes || 0}
                    difficulty={recipe.difficulty}
                    image={recipe.image_urls?.[0] || ""}
                    thumbnail={recipe.thumbnail_urls?.[0]}
                    ownerUsername={recipe.owner_username}
                    averageRating={recipe.average_rating}
                    favoritesCount={recipe.favorites_count}
                    imageOverlay={
                      <FavoriteButton
                        recipeId={recipe.id}
                        isFavorited={recipe.is_favorited ?? false}
                        compact
                      />
                    }
                  />
                </Link>
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            {hasNextPage && (
              <div ref={sentinelRef} className="flex justify-center items-center py-8 pb-24 md:pb-8">
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
