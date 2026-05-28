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
        // Mirror the real carousel layout so cards don't visibly resize /
        // re-flow when the skeleton swaps to the real list:
        //   - same -mx-6 px-6 overflow-x-clip wrapper
        //   - same -ml-8 + pl-8 spacing (32px gutter between cards)
        //   - same basis breakpoints (full → 1/2 → 1/4)
        // basis-* relies on a flex parent; we use plain flex here instead of
        // Embla so the skeleton stays static.
        <div className="-mx-6 px-6 overflow-x-clip">
          <div className="flex -ml-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="pl-8 shrink-0 basis-full sm:basis-1/2 lg:basis-1/4"
              >
                <RecipeCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Same shadow-bleed wrapper setup as CategoryShelf — see that file
        // for the rationale (outer overflow-x-clip + 24px padding gutter +
        // 32px slide gap so edge-card hover effects bleed visibly while
        // off-screen neighbors remain clipped).
        <div className="-mx-6 px-6 overflow-x-clip">
        <Carousel
          opts={{ align: "start", containScroll: "trimSnaps" }}
          className="w-full"
        >
          <CarouselContent
            className="-ml-8"
            outerClassName="carousel-shadow-bleed -my-6 py-6"
          >
            {similar.map((recipe) => (
              <CarouselItem
                key={recipe.id}
                className="pl-8 basis-full sm:basis-1/2 lg:basis-1/4"
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
        </div>
      )}
    </section>
  );
}
