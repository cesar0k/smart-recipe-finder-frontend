import {
  Dialog,
  DialogScrollContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecipeForm } from "./RecipeForm";
import { useRecipeMutations } from "../hooks/useRecipeMutations";
import { type RecipeFormValues } from "../types/schema";
import { type Recipe } from "@/api/model";
import { getRecipeFormDefaultValues } from "../lib/utils";
import { useTranslation } from "react-i18next";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useHistoryBack } from "@/hooks/useHistoryBack";

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
  const handleOpenChange = useHistoryBack(open, onOpenChange);

  const { updateRecipe, isSubmitting } = useRecipeMutations(() => {
    handleOpenChange(false);
    onSuccess();
  });

  const onSubmit = async (data: RecipeFormValues) => {
    await updateRecipe(recipe.id, data);
  };

  const defaultValues = getRecipeFormDefaultValues(recipe);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogScrollContent>
        <DialogHeader className="text-left px-0 py-2">
          <DialogTitle>{t("form_edit_title")}</DialogTitle>
        </DialogHeader>
        <VisuallyHidden>
          <p>{t("form_edit_title")}</p>
        </VisuallyHidden>

        <RecipeForm
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogScrollContent>
    </Dialog>
  );
}
