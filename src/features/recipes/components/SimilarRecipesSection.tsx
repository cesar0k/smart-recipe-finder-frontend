import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { RecipeCard } from "./RecipeCard";
import { Spinner } from "@/components/ui/spinner";
import { useSimilarRecipes } from "../hooks/useSimilarRecipes";

interface SimilarRecipesSectionProps {
  recipeId: number;
}

export function SimilarRecipesSection({ recipeId }: SimilarRecipesSectionProps) {
  const { t } = useTranslation();
  const { similar, isLoading, isError } = useSimilarRecipes(recipeId);

  if (isLoading) {
    return (
      <section className="mt-16 pt-12 border-t border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t("similar_recipes_title")}
        </h2>
        <div className="flex justify-center py-8">
          <Spinner size="md" className="text-gray-300" />
        </div>
      </section>
    );
  }

  if (isError || similar.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {t("similar_recipes_title")}
      </h2>
      <p className="text-gray-500 mb-6">{t("similar_recipes_desc")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {similar.map((recipe) => (
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
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
