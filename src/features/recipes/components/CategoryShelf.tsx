import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { RecipeCard } from "./RecipeCard";
import { RecipeCardSkeleton } from "@/components/skeletons/RecipeCardSkeleton";
import { useRecipeCategories } from "@/api/recipes/useRecipeCategories";
import { useTranslation } from "react-i18next";

const LIMIT_PER = 6;

export function CategoryShelves() {
  const { t } = useTranslation();
  const { data: categories, isLoading, isError } = useRecipeCategories(LIMIT_PER);

  if (isError) return null; // silently hide — main feed still works

  if (isLoading) {
    return (
      <div className="space-y-10 mb-12">
        {Array.from({ length: 3 }).map((_, i) => (
          <CategoryShelfSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!categories || categories.length === 0) return null;

  return (
    <div className="space-y-10 mb-12">
      {categories.map((cat) => (
        <section key={cat.meal_type}>
          {/* Shelf header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              {cat.label}
            </h2>
            <Link
              to={`/?meal_type=${cat.meal_type}`}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              {t("show_all")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Recipe cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cat.recipes.map((recipe) => (
              <Link key={recipe.id} to={`/recipe/${recipe.id}`} className="block">
                <RecipeCard
                  title={recipe.title ?? t("untitled_recipe")}
                  time={recipe.cooking_time_in_minutes ?? 0}
                  difficulty={recipe.difficulty}
                  image={recipe.image_urls?.[0] ?? ""}
                  thumbnail={recipe.thumbnail_urls?.[0]}
                  ownerUsername={recipe.owner_username}
                />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function CategoryShelfSkeleton() {
  return (
    <section>
      <div className="h-7 w-32 bg-gray-100 rounded mb-4 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <RecipeCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
