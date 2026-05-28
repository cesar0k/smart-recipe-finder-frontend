import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { ChefHat } from "lucide-react";
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
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
export function RecipesPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const {
    recipes,
    isLoading,
    isFetching,
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
    hasNextPage,
  } = useHomeRecipes();
  // Show the category name in the H1 / document title when a category is
  // selected (e.g. /recipes?meal_type=breakfast&category_label=Завтрак);
  // otherwise fall back to the generic "All recipes" copy. We read the URL
  // directly instead of using `heading` from useHomeRecipes — that helper is
  // tuned for the home feed and returns hero_title on a bare list view.
  const categoryLabel = searchParams.get("category_label");
  const pageTitle = categoryLabel || t("all_recipes");
  useDocumentTitle(pageTitle);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans pb-16 md:pb-0">
      <Header />

      {/* Mobile: no bottom padding on main — the symmetric breathing
          room under the last row already comes from the infinite-scroll
          sentinel's py-8 + the root's pb-16 (which clears the BottomNav).
          Adding pb on top of that produced an asymmetric gap between the
          sentinel and the BottomNav. Desktop keeps pb-12 so content does
          not abut the footer. */}
      <main className="flex-1 container mx-auto px-4 pt-8 md:pt-12 md:pb-12">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            {pageTitle}
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
              isLoading={isFetching}
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

        {/* Empty database — no filters and no recipes at all */}
        {isEmpty && !hasActiveFilters && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <ChefHat className="w-12 h-12 text-gray-300" />
            <p className="text-lg font-semibold text-gray-700">{t("no_recipes_yet_title")}</p>
            <p className="text-sm text-gray-400 max-w-sm">{t("no_recipes_yet_desc")}</p>
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

            {/* Infinite scroll sentinel. The spinner is rendered
                unconditionally (not gated on `isFetchingNextPage`) so it
                appears the instant the sentinel mounts, instead of after
                the IntersectionObserver fires its first entry and the
                first fetchNextPage round-trip starts. Without this the
                user saw an empty 32px gap for ~100ms before the spinner
                showed up. */}
            {hasNextPage && (
              <div ref={sentinelRef} className="flex justify-center items-center py-8">
                <Spinner size="md" />
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
