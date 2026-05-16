import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { memo, useMemo } from "react";
import { RecipeCard } from "./RecipeCard";
import { FavoriteButton } from "./FavoriteButton";
import { RecipeCardSkeleton } from "@/components/skeletons/RecipeCardSkeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useRecipeCategories } from "@/api/recipes/useRecipeCategories";
import { useCheckFavorites } from "@/api/favorites/favorites";
import { useAuth } from "@/lib/auth/auth-context";
import { useTranslation } from "react-i18next";

const LIMIT_PER = 8; // fetch more so the carousel feels full

export function CategoryShelves() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { data: categories, isLoading, isError } = useRecipeCategories(LIMIT_PER);

  // Build a stable sorted comma-string of all visible recipe IDs.
  // Sorting ensures the string is identical even if category order changes.
  const idsParam = useMemo(() => {
    if (!categories) return "";
    const seen = new Set<number>();
    for (const cat of categories) {
      for (const r of cat.recipes) seen.add(r.id);
    }
    return Array.from(seen).sort((a, b) => a - b).join(",");
  }, [categories]);

  const { data: checkResp } = useCheckFavorites(
    { ids: idsParam },
    {
      query: {
        enabled: isAuthenticated && idsParam.length > 0,
        staleTime: 30_000,
      },
    }
  );
  // Depend only on the array reference, not the whole response object
  const favoritedSet = useMemo(
    () => new Set(checkResp?.favorited_ids ?? []),
    [checkResp?.favorited_ids]
  );

  if (isError) {
    return (
      <p className="text-sm text-gray-400 py-6 text-center mb-12">
        {t("category_shelves_error")}
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="mb-12">
        {Array.from({ length: 3 }).map((_, i) => (
          <CategoryShelfSkeleton key={i} isFirst={i === 0} />
        ))}
      </div>
    );
  }

  if (!categories || categories.length === 0) return null;

  return (
    <div className="mb-12">
      {categories.map((cat, idx) => (
        <section
          key={cat.meal_type}
          className={idx !== 0 ? "mt-12 border-gray-100" : ""}
        >
          {/* ── Shelf header ─────────────────────────────── */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {cat.label}
            </h2>
            <ShowAllLink mealType={cat.meal_type} label={cat.label} />
          </div>

          {/* ── Embla carousel ───────────────────────────── */}
          <Carousel
            opts={{ align: "start", containScroll: "trimSnaps" }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {cat.recipes.map((recipe) => (
                <CarouselItem
                  key={recipe.id}
                  className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <Link to={`/recipe/${recipe.id}`} className="block h-full">
                    <RecipeCard
                      title={recipe.title ?? t("untitled_recipe")}
                      time={recipe.cooking_time_in_minutes ?? 0}
                      difficulty={recipe.difficulty}
                      image={recipe.image_urls?.[0] ?? ""}
                      thumbnail={recipe.thumbnail_urls?.[0]}
                      ownerUsername={recipe.owner_username}
                      averageRating={recipe.average_rating}
                      favoritesCount={recipe.favorites_count}
                      imageOverlay={
                        <FavoriteButton
                          recipeId={recipe.id}
                          isFavorited={favoritedSet.has(recipe.id)}
                          compact
                        />
                      }
                    />
                  </Link>
                </CarouselItem>
              ))}

              {/* "Show all" card at the end of the carousel */}
              <CarouselItem className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <ShowAllCard mealType={cat.meal_type} label={cat.label} />
              </CarouselItem>
            </CarouselContent>

            {/* Navigation arrows — positioned relative to the carousel container */}
            <CarouselPrevious className="-left-4 shadow-md bg-white border-gray-200 hover:bg-gray-50" />
            <CarouselNext className="-right-4 shadow-md bg-white border-gray-200 hover:bg-gray-50" />
          </Carousel>
        </section>
      ))}
    </div>
  );
}

// ── "Show all" link in the header ─────────────────────────────────────────────
const ShowAllLink = memo(function ShowAllLink({ mealType, label }: { mealType: string; label: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const href = `/?meal_type=${encodeURIComponent(mealType)}&category_label=${encodeURIComponent(label)}`;

  return (
    <button
      onClick={() => navigate(href)}
      className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group"
    >
      {t("show_all")}
      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
});

// ── "Show all" card at end of carousel ───────────────────────────────────────
const ShowAllCard = memo(function ShowAllCard({ mealType, label }: { mealType: string; label: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const href = `/?meal_type=${encodeURIComponent(mealType)}&category_label=${encodeURIComponent(label)}`;

  return (
    <button
      onClick={() => navigate(href)}
      className="flex flex-col items-center justify-center w-full h-full min-h-[200px] rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-700 transition-all gap-2 group"
    >
      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
      <span className="text-sm font-medium">{t("show_all")}</span>
    </button>
  );
});

// ── Skeleton ──────────────────────────────────────────────────────────────────
// Mirrors the real shelf: no top border, mt-12 only for idx !== 0, h2 + "Show all"
// header, and a horizontal row of cards with the same basis breakpoints as the
// Embla carousel (basis-full sm:1/2 lg:1/3 xl:1/4).
export function CategoryShelfSkeleton({ isFirst = false }: { isFirst?: boolean }) {
  return (
    <section className={isFirst ? "" : "mt-12 border-gray-100"}>
      {/* Header: title placeholder + "Show all" placeholder, mb-5 like the real one */}
      <div className="flex items-center justify-between mb-5">
        <div className="h-8 w-40 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-5 w-20 bg-gray-100 rounded-md animate-pulse" />
      </div>

      {/* Carousel placeholder: overflow-hidden row with the same basis breakpoints */}
      <div className="overflow-hidden">
        <div className="flex -ml-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="pl-4 shrink-0 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
            >
              <RecipeCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
