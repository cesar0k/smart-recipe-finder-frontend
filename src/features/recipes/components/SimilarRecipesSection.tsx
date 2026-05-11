import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { RecipeCard } from "./RecipeCard";
import { RecipeCardSkeleton } from "@/components/skeletons/RecipeCardSkeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useSimilarRecipes } from "../hooks/useSimilarRecipes";

interface SimilarRecipesSectionProps {
  recipeId: number;
}

export function SimilarRecipesSection({ recipeId }: SimilarRecipesSectionProps) {
  const { t } = useTranslation();
  const { similar, isLoading, isError } = useSimilarRecipes(recipeId);

  // Hide the section entirely when there are simply no similar recipes,
  // but surface a muted message on error so users know something is off.
  if (!isError && !isLoading && similar.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-gray-100">
      <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
        {t("similar_recipes_title")}
      </h2>
      <p className="text-gray-500 mb-6">{t("similar_recipes_desc")}</p>

      {isError ? (
        <p className="text-sm text-gray-400 py-6 text-center">
          {t("similar_recipes_error")}
        </p>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <RecipeCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <Carousel
          opts={{ align: "start", containScroll: "trimSnaps" }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {similar.map((recipe) => (
              <CarouselItem
                key={recipe.id}
                className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
              >
                <Link to={`/recipe/${recipe.id}`} className="block h-full">
                  <RecipeCard
                    title={recipe.title || t("untitled_recipe")}
                    time={recipe.cooking_time_in_minutes || 0}
                    difficulty={recipe.difficulty}
                    image={recipe.image_urls?.[0] || ""}
                    thumbnail={recipe.thumbnail_urls?.[0]}
                    ownerUsername={recipe.owner_username}
                  />
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className="-left-4 shadow-md bg-white border-gray-200 hover:bg-gray-50" />
          <CarouselNext className="-right-4 shadow-md bg-white border-gray-200 hover:bg-gray-50" />
        </Carousel>
      )}
    </section>
  );
}
