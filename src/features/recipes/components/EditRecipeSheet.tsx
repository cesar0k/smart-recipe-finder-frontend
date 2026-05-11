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
import { useResubmitRecipe } from "@/api/recipes/recipes";
import { toast } from "sonner";

interface EditRecipeSheetProps {
  recipe: Recipe;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** When true, uses the resubmit endpoint instead of regular update */
  resubmitMode?: boolean;
}

export function EditRecipeSheet({
  recipe,
  open,
  onOpenChange,
  onSuccess,
  resubmitMode = false,
}: EditRecipeSheetProps) {
  const { t } = useTranslation();
  const handleOpenChange = useHistoryBack(open, onOpenChange);

  const { updateRecipe, isSubmitting: isUpdating } = useRecipeMutations(() => {
    handleOpenChange(false);
    // Defer invalidations / refetches until after Radix's exit animation
    // so the sheet doesn't briefly re-flash on slow devices.
    setTimeout(onSuccess, 200);
  });

  const { mutateAsync: resubmit, isPending: isResubmitting } =
    useResubmitRecipe();

  const isSubmitting = isUpdating || isResubmitting;

  const onSubmit = async (data: RecipeFormValues) => {
    if (resubmitMode) {
      try {
        await resubmit({
          recipeId: recipe.id,
          data: {
            title: data.title,
            instructions: data.instructions,
            cooking_time_in_minutes: data.cooking_time_in_minutes,
            difficulty: data.difficulty,
            cuisine: data.cuisine || undefined,
            ingredients: data.ingredients.map((i) => i.value),
          },
        });
        toast.success(t("toast_resubmitted"));
        handleOpenChange(false);
        // See note in updateRecipe's onSuccess above.
        setTimeout(onSuccess, 200);
      } catch {
        toast.error(t("moderation_error"));
      }
    } else {
      await updateRecipe(recipe.id, data);
    }
  };

  const defaultValues = getRecipeFormDefaultValues(recipe);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogScrollContent>
        <DialogHeader className="text-left px-0 py-2">
          <DialogTitle>
            {resubmitMode ? t("my_recipes_fix_and_resubmit") : t("form_edit_title")}
          </DialogTitle>
        </DialogHeader>
        <VisuallyHidden>
          <p>{resubmitMode ? t("my_recipes_fix_and_resubmit") : t("form_edit_title")}</p>
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
