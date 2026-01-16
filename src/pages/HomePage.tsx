import { Link } from "react-router-dom";
import { Search, X, ArrowRight } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RecipeCard } from "@/features/recipes/components/RecipeCard";
import { useHomeRecipes } from "../features/recipes/hooks/useHomeRecipes";
import { CreateRecipeSheet } from "@/features/recipes/components/CreateRecipeSheet";
import { RecipeFilterSheet } from "@/features/recipes/components/RecipeFilterSheet";
import { RecipeCardSkeleton } from "@/components/skeletons/RecipeCardSkeleton";
import { Footer } from "@/components/layout/Footer";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useTranslation } from "react-i18next";

export function HomePage() {
  const { t } = useTranslation();
  const {
    recipes,
    isLoading,
    isError,
    isEmpty,
    searchTerm,
    setSearchTerm,
    submittedSearch,
    handleSearch,
    handleClear,
    isSearchView,
    hasActiveFilters,
    heading,
    onKeyDown,
    includeIngredients,
    excludeIngredients,
    setIncludeIngredients,
    setExcludeIngredients,
  } = useHomeRecipes();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* HEADER */}
      <header className="border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/"
            onClick={handleClear}
            className="font-bold text-xl tracking-tighter text-gray-900 cursor-pointer"
          >
            {t("app_name")}
          </Link>
          <div className="flex items-center gap-3">
            <CreateRecipeSheet />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        {/* SEARCH BLOCK */}
        <div className="max-w-4xl mx-auto text-center mb-10 space-y-6">
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight w-full truncate">
            {heading}
          </h1>

          <div className="flex items-center gap-3 w-full max-w-xl mx-auto">
            <div className="relative flex items-center flex-1">
              <Search className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none" />

              <Input
                placeholder={t("hero_search_placeholder")}
                className="pl-12 pr-24 h-14 text-lg rounded-full border-gray-200 shadow-sm focus:border-gray-400 focus:ring-0 transition-all hover:border-gray-300 hover:shadow-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={onKeyDown}
              />

              <div className="absolute right-2 flex items-center gap-1">
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    className="h-10 w-10 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}

                <Button
                  size="icon"
                  onClick={handleSearch}
                  className="h-10 w-10 rounded-full bg-black text-white hover:bg-gray-800 shadow-md"
                >
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Filter button */}
            <RecipeFilterSheet
              include={includeIngredients}
              exclude={excludeIngredients}
              onIncludeChange={setIncludeIngredients}
              onExcludeChange={setExcludeIngredients}
            />
          </div>
        </div>

        {/* STATES */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Generate an array of 6 empty recipe cards*/}
            {Array.from({ length: 6 }).map((_, index) => (
              <RecipeCardSkeleton key={index} />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center text-red-500 py-10">
            {t("search_error")}
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

        {/* GRID */}
        {!isLoading && !isError && recipes && recipes.length > 0 && (
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
                />
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
