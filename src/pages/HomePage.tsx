import { useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChefHat } from "lucide-react";
import axios from "axios";

import { dismissSplash } from "@/lib/splash";
import { Button } from "@/components/ui/button";
import { RecipeCard } from "@/features/recipes/components/RecipeCard";
import { FavoriteButton } from "@/features/recipes/components/FavoriteButton";
import { useHomeRecipes } from "../features/recipes/hooks/useHomeRecipes";
import { CreateRecipeSheet } from "@/features/recipes/components/CreateRecipeSheet";
import { HomeSearchBlock } from "@/features/recipes/components/HomeSearchBlock";
import { RecipeCardSkeleton } from "@/components/skeletons/RecipeCardSkeleton";
import { CategoryShelves, CategoryShelfSkeleton } from "@/features/recipes/components/CategoryShelf";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/auth-context";

export function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const {
    recipes,
    isLoading,
    isError,
    error,
    isEmpty,
    submittedSearch,
    handleSearch,
    handleClear,
    isSearchView,
    hasActiveFilters,
    heading,
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

  // Stable callbacks to avoid unnecessary re-renders of HomeSearchBlock
  const stableHandleSearch = useCallback(handleSearch, [handleSearch]);
  const stableHandleClear = useCallback(handleClear, [handleClear]);

  // Tear down the splash once the first batch of recipes is rendered.
  useEffect(() => {
    if (!isLoading) dismissSplash();
  }, [isLoading]);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans pb-16 md:pb-0">
      <Header
        leftContent={
          <Link
            to="/"
            onClick={handleClear}
            className="group flex items-center gap-2 cursor-pointer shrink-0"
          >
            <div className="w-9 h-9 md:w-7 md:h-7 transition-transform duration-300 group-hover:scale-110">
              <div className="w-9 h-9 md:w-7 md:h-7 bg-black rounded-xl md:rounded-lg flex items-center justify-center">
                <ChefHat className="w-5 h-5 md:w-3.5 md:h-3.5 text-white" />
              </div>
            </div>
            <span className="hidden md:inline font-bold text-xl tracking-tighter text-gray-900">
              {t("app_name")}
            </span>
          </Link>
        }
        rightContent={isAuthenticated ? <CreateRecipeSheet /> : undefined}
      />

      
      <main className="flex-1 container mx-auto px-4 pt-8 md:pt-12 pb-5">
        
        <HomeSearchBlock
          submittedSearch={submittedSearch}
          heading={heading}
          isSearchView={isSearchView}
          sort={sort}
          setSort={setSort}
          includeIngredients={includeIngredients}
          excludeIngredients={excludeIngredients}
          minTime={minTime}
          maxTime={maxTime}
          selectedDifficulty={selectedDifficulty}
          selectedCuisine={selectedCuisine}
          hasComments={hasComments}
          applyAllFilters={applyAllFilters}
          onSearch={stableHandleSearch}
          onClear={stableHandleClear}
        />

        
        {!isSearchView && !hasActiveFilters && <CategoryShelves />}

        
        {isLoading && (
          <>
            
            {!isSearchView && !hasActiveFilters && (
              <>
                <div className="mb-12">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <CategoryShelfSkeleton key={i} isFirst={i === 0} />
                  ))}
                </div>

                {/* "All recipes" divider placeholder */}
                <div className="flex items-center gap-4 mb-5 border-gray-100">
                  <div className="flex-1 h-px bg-gray-200" />
                  <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <RecipeCardSkeleton key={index} />
              ))}
            </div>
          </>
        )}

        {isError && (
          <div className="text-center text-red-500 py-10">
            {axios.isAxiosError(error) && !error.response
              ? t("connection_error")
              : t("search_error")}
          </div>
        )}

        {isEmpty && (isSearchView || hasActiveFilters) && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <p className="text-lg text-gray-600">
              {isSearchView
                ? t("no_recipes_found", { search: submittedSearch })
                : t("no_recipes_filters")}
            </p>
            <Button
              variant="outline"
              onClick={handleClear}
              className="rounded-full"
            >
              {t("show_all")}
            </Button>
          </div>
        )}

        {/* Default feed — 6 preview cards + link to /recipes */}
        {!isSearchView && !hasActiveFilters && !isLoading && !isError && recipes && recipes.length > 0 && (
          <>
            <Link to="/recipes" className="flex items-center gap-4 mb-5 group">
              <div className="flex-1 h-px bg-gray-200 group-hover:bg-gray-400 transition-colors" />
              <span className="text-2xl font-extrabold text-gray-900 tracking-tight whitespace-nowrap">
                {t("all_recipes")}
              </span>
              <div className="flex-1 h-px bg-gray-200 group-hover:bg-gray-400 transition-colors" />
            </Link>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.slice(0, 6).map((recipe) => (
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

            <div className="flex justify-center mt-5">
              <Link to="/recipes">
                <Button variant="outline" className="rounded-full gap-2 px-6">
                  {t("all_recipes_btn")}
                </Button>
              </Link>
            </div>
          </>
        )}

        {/* Search / filter results — full infinite scroll grid */}
        {(isSearchView || hasActiveFilters) && !isLoading && !isError && recipes && recipes.length > 0 && (
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
            {hasNextPage && (
              <div ref={sentinelRef} className="flex justify-center py-8">
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
