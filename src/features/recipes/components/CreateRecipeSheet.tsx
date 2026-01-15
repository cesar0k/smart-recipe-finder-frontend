import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { RecipeForm } from "./RecipeForm";
import { useRecipeMutations } from "../hooks/useRecipeMutations";
import { type RecipeFormValues } from "../types/schema";

export function CreateRecipeSheet() {
  const [open, setOpen] = useState(false);

  const { createRecipe, isSubmitting } = useRecipeMutations(() =>
    setOpen(false)
  );

  const onSubmit = async (data: RecipeFormValues) => {
    await createRecipe(data);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="rounded-full font-bold bg-black text-white hover:bg-gray-800 transition-all">
          Create Recipe
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md w-full p-4">
        <SheetHeader className="text-left px-0 py-2">
          <SheetTitle>Create New Recipe</SheetTitle>
        </SheetHeader>

        <RecipeForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </SheetContent>
    </Sheet>
  );
}
