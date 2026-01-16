import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RecipeForm } from "./RecipeForm";
import { useRecipeMutations } from "../hooks/useRecipeMutations";
import { type RecipeFormValues } from "../types/schema";
import { type Recipe } from "@/api/model";
import { getRecipeFormDefaultValues } from "../lib/utils";
import { useTranslation } from "react-i18next";

interface EditRecipeSheetProps {
  recipe: Recipe;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditRecipeSheet({
  recipe,
  open,
  onOpenChange,
  onSuccess,
}: EditRecipeSheetProps) {
  const { t } = useTranslation();
  const { updateRecipe, isSubmitting } = useRecipeMutations(() => {
    onOpenChange(false);
    onSuccess();
  });

  const onSubmit = async (data: RecipeFormValues) => {
    await updateRecipe(recipe.id, data);
  };

  const defaultValues = getRecipeFormDefaultValues(recipe);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md w-full p-4">
        <SheetHeader className="text-left px-0 py-2">
          <SheetTitle>{t("form_edit_title")}</SheetTitle>
        </SheetHeader>

        <RecipeForm
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      </SheetContent>
    </Sheet>
  );
}
