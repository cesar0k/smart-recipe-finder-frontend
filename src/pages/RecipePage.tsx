import { useState } from "react";
import { Link } from "react-router-dom";
import { MoreVertical, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { EditRecipeSheet } from "@/features/recipes/components/EditRecipeSheet";
import { Header } from "@/components/layout/Header";
import { BackButton } from "@/components/BackButton";
import { RecipePageSkeleton } from "@/components/skeletons/RecipePageSkeleton";

import { useRecipeDetails } from "../features/recipes/hooks/useRecipeDetails";
import { useDeleteRecipeLogic } from "../features/recipes/hooks/useDeleteRecipeLogic";
import { RecipeHeaderInfo } from "@/features/recipes/components/RecipeHeaderInfo";
import { RecipeGallery } from "@/features/recipes/components/RecipeGallery";
import { SimilarRecipesSection } from "@/features/recipes/components/SimilarRecipesSection";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/auth-context";
import { useDismissSplash } from "@/hooks/useDismissSplash";

export function RecipePage() {
  useDismissSplash();
  const { recipe, isLoading, isError, isValidId, refetch } = useRecipeDetails();
  const { deleteRecipe, isDeleting } = useDeleteRecipeLogic();
  const { t } = useTranslation();
  const { user, hasRole } = useAuth();

  const canModify =
    !!user &&
    (user.id === recipe?.owner_id || hasRole("moderator", "admin"));

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <Header leftContent={<BackButton />} />
        <main className="container mx-auto px-4 py-8 md:py-12">
          <RecipePageSkeleton />
        </main>
      </div>
    );
  }

  if (isError || !isValidId || !recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {t("recipe_not_found_title")}
        </h2>
        <p className="text-gray-500">{t("recipe_not_found_desc")}</p>
        <Link to="/">
          <Button variant="outline">{t("back_to_home")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header
        leftContent={<BackButton />}
        rightContent={
          canModify ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-2xl">
                <DropdownMenuItem
                  className="rounded-full"
                  onClick={() => setIsEditOpen(true)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  {t("edit_recipe")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-full"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("delete_recipe")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : undefined
        }
      />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Left side */}
          <div className="space-y-8">
            {/* Image */}
            <RecipeGallery
              images={recipe.image_urls || []}
              thumbnails={recipe.thumbnail_urls || []}
              title={recipe.title || ""}
            />

            {/* Mobile version of title */}
            <div className="lg:hidden">
              <RecipeHeaderInfo recipe={recipe} canViewStatus={canModify} />
            </div>

            {/* Ingredients */}
            <div className="bg-gray-50 rounded-[2rem] p-8 space-y-5">
              <h3 className="font-bold text-xl text-gray-900 flex items-center gap-3">
                {t("ingredients")}
              </h3>
              <ul className="space-y-3">
                {recipe.ingredients?.map((ingredient, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-gray-700"
                  >
                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                    <span className="leading-relaxed text-lg font-medium break-words min-w-0">
                      {typeof ingredient === "string"
                        ? ingredient
                        : ingredient.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right side */}
          <div className="space-y-8">
            <div className="hidden lg:block">
              <RecipeHeaderInfo recipe={recipe} canViewStatus={canModify} />
            </div>

            <Separator className="bg-gray-100 hidden lg:block" />

            {/* Instructions */}
            <div className="space-y-6">
              <h3 className="font-bold text-2xl text-gray-900">
                {t("instructions")}
              </h3>
              <div className="prose prose-gray max-w-none text-gray-600 space-y-6 text-lg leading-relaxed break-words">
                {(recipe.instructions || "").split("\n").map((step, index) => (
                  <p key={index}>{step}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        <SimilarRecipesSection recipeId={recipe.id} />
      </main>

      {/* Edit sheet */}
      {recipe && (
        <EditRecipeSheet
          recipe={recipe}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSuccess={refetch}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_dialog_title")}</AlertDialogTitle>
            <AlertDialogDescription className="[word-break:break-word]">
              {t("delete_dialog_desc", { title: recipe.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              {t("cancel_btn")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRecipe(recipe.id)}
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
