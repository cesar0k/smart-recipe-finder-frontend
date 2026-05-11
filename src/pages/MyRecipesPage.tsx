import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { BackButton } from "@/components/BackButton";
import { RecipeCard } from "@/features/recipes/components/RecipeCard";
import { RecipeCardSkeleton } from "@/components/skeletons/RecipeCardSkeleton";
import { Spinner } from "@/components/ui/spinner";
import { CreateRecipeSheet } from "@/features/recipes/components/CreateRecipeSheet";
import { EditRecipeSheet } from "@/features/recipes/components/EditRecipeSheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  readMyRecipes,
  getReadMyRecipesQueryKey,
  useDeleteRecipe,
} from "@/api/recipes/recipes";
import type { Recipe } from "@/api/model";

const PAGE_SIZE = 12;

export function MyRecipesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data: infiniteData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: getReadMyRecipesQueryKey() as unknown as readonly unknown[],
    queryFn: ({ pageParam = 0 }) =>
      readMyRecipes({ skip: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return lastPageParam + PAGE_SIZE;
    },
  });

  const recipes: Recipe[] = infiniteData ? infiniteData.pages.flat() : [];

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { rootMargin: "200px" },
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<Recipe | null>(null);
  const { mutateAsync: deleteRecipe, isPending: isDeleting } = useDeleteRecipe();

  const handleDelete = async () => {
    if (!deletingRecipe) return;
    try {
      await deleteRecipe({ recipeId: deletingRecipe.id });
      toast.success(t("toast_deleted"));
      setDeletingRecipe(null);
      // Defer the refetch until after the AlertDialog's exit animation
      // so it doesn't briefly re-flash on slow devices.
      setTimeout(
        () => queryClient.invalidateQueries({ queryKey: getReadMyRecipesQueryKey() }),
        200,
      );
    } catch {
      toast.error(t("toast_error_delete"));
      setDeletingRecipe(null);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header
        leftContent={<BackButton />}
        rightContent={<CreateRecipeSheet />}
      />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t("my_recipes_title")}
        </h1>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && recipes.length === 0 && (
          <p className="text-gray-500 text-center py-10">
            {t("my_recipes_empty")}
          </p>
        )}

        {recipes.length > 0 && (
          <>
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
                    thumbnail={recipe.thumbnail_urls?.[0]}
                    status={recipe.status}
                    hasPendingDraft={recipe.has_pending_draft}
                    rejectionReason={recipe.rejection_reason}
                    onResubmit={
                      recipe.status === "rejected"
                        ? () => setEditingRecipe(recipe)
                        : undefined
                    }
                    onDelete={
                      recipe.status === "rejected"
                        ? () => setDeletingRecipe(recipe)
                        : undefined
                    }
                  />
                </Link>
              ))}
            </div>

            {hasNextPage && (
              <div
                ref={sentinelRef}
                className="flex justify-center items-center py-8"
              >
                {isFetchingNextPage && <Spinner size="md" />}
              </div>
            )}
          </>
        )}
      </main>

      {/* Edit+Resubmit sheet */}
      {editingRecipe && (
        <EditRecipeSheet
          recipe={editingRecipe}
          open={!!editingRecipe}
          onOpenChange={(open) => {
            if (!open) setEditingRecipe(null);
          }}
          onSuccess={() => {
            setEditingRecipe(null);
            queryClient.invalidateQueries({
              queryKey: getReadMyRecipesQueryKey(),
            });
          }}
          resubmitMode
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deletingRecipe}
        onOpenChange={(open) => {
          if (!open) setDeletingRecipe(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_dialog_title")}</AlertDialogTitle>
            <AlertDialogDescription className="[word-break:break-word]">
              {t("delete_dialog_desc", { title: deletingRecipe?.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              {t("cancel_btn")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white border-none rounded-full"
              disabled={isDeleting}
            >
              {isDeleting ? t("deleting") : t("delete_btn")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
