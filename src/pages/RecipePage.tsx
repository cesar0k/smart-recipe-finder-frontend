import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MoreVertical, Trash2, Pencil } from "lucide-react";
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

import { useRecipeDetails } from "../features/recipes/hooks/useRecipeDetails";
import { useDeleteRecipeLogic } from "../features/recipes/hooks/useDeleteRecipeLogic";
import { RecipeHeaderInfo } from "@/features/recipes/components/RecipeHeaderInfo";
import { RecipeGallery } from "@/features/recipes/components/RecipeGallery";

export function RecipePage() {
  const navigate = useNavigate();
  const { recipe, isLoading, isError, isValidId, refetch } = useRecipeDetails();
  const { deleteRecipe, isDeleting } = useDeleteRecipeLogic();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gray-200" />
          <div className="text-gray-400 font-medium">
            Cooking up the details...
          </div>
        </div>
      </div>
    );
  }

  if (isError || !isValidId || !recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Recipe not found</h2>
        <p className="text-gray-500">
          The recipe you are looking for doesn't exist or has been removed.
        </p>
        <Link to="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left header side - return button */}
          <Link to="/">
            <Button
              variant="ghost"
              className="gap-2 text-gray-600 hover:text-black pl-0 hover:bg-transparent"
              onClick={() => {
                if (window.history.state && window.history.state.idx > 0) {
                  navigate(-1);
                } else {
                  navigate("/");
                }
              }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-base">Back to recipes</span>
            </Button>
          </Link>

          {/* Right header side - action menu */}
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
                Edit Recipe
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-full"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Recipe
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Left side */}
          <div className="space-y-8">
            {/* Image */}
            <div className="aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-gray-100 shadow-sm bg-gray-50 relative group">
              <RecipeGallery
                images={recipe.image_urls || []}
                title={recipe.title || ""}
              />
            </div>

            {/* Mobile version of f title */}
            <div className="lg:hidden">
              <RecipeHeaderInfo recipe={recipe} />
            </div>

            {/* Ingredients */}
            <div className="bg-gray-50 rounded-[2rem] p-8 space-y-5">
              <h3 className="font-bold text-xl text-gray-900 flex items-center gap-3">
                Ingredients
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
            {/* 
              Desktop title
              hidden — hidden by default (on mobiles)
              lg:block — show only on desktop
            */}
            <div className="hidden lg:block">
              <RecipeHeaderInfo recipe={recipe} />
            </div>

            <Separator className="bg-gray-100 hidden lg:block" />

            {/* Instructions */}
            <div className="space-y-6">
              <h3 className="font-bold text-2xl text-gray-900">Instructions</h3>
              <div className="prose prose-gray max-w-none text-gray-600 space-y-6 text-lg leading-relaxed break-words">
                {(recipe.instructions || "").split("\n").map((step, index) => (
                  <p key={index}>{step}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
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
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="[word-break:break-word]">
              This action cannot be undone. This will permanently delete the
              recipe
              <span className="font-bold text-gray-900">
                {" "}
                "{recipe.title}"{" "}
              </span>
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRecipe(recipe.id)}
              className="bg-red-600 hover:bg-red-700 text-white border-none rounded-full"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
