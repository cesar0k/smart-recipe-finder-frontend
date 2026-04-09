import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Header } from "@/components/layout/Header";
import { BackButton } from "@/components/BackButton";
import { RecipeCard } from "@/features/recipes/components/RecipeCard";
import { Spinner } from "@/components/ui/spinner";

import { useReadUserRecipes } from "@/api/recipes/recipes";

export function UserRecipesPage() {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const uid = parseInt(userId || "0", 10);

  const { data: recipes, isLoading } = useReadUserRecipes(
    uid,
    undefined,
    { query: { enabled: uid > 0 } }
  );

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header leftContent={<BackButton />} />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t("user_recipes_title", {
            name: recipes?.[0]?.owner_username || `#${uid}`,
          })}
        </h1>

        {isLoading && (
          <div className="flex justify-center py-10">
            <Spinner size="lg" className="text-gray-300" />
          </div>
        )}

        {!isLoading && (!recipes || recipes.length === 0) && (
          <p className="text-gray-500 text-center py-10">
            {t("user_recipes_empty")}
          </p>
        )}

        {recipes && recipes.length > 0 && (
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
                  status={recipe.status}
                  ownerUsername={recipe.owner_username}
                />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
