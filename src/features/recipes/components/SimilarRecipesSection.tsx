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
    <section className="w-full">
      {isError ? (
        <p className="text-sm text-gray-400 py-6 text-center">
          {t("similar_recipes_error")}
        </p>
      ) : isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
                className="pl-4 basis-full sm:basis-1/2 lg:basis-1/4"
              >
                <Link to={`/recipe/${recipe.id}`} className="block h-full">
                  <RecipeCard
                    title={recipe.title || t("untitled_recipe")}
                    time={recipe.cooking_time_in_minutes || 0}
                    difficulty={recipe.difficulty}
                    image={recipe.image_urls?.[0] || ""}
                    thumbnail={recipe.thumbnail_urls?.[0]}
                    ownerUsername={recipe.owner_username}
                    averageRating={recipe.average_rating}
                    favoritesCount={recipe.favorites_count}
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
