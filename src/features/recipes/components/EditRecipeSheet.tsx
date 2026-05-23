import { useState } from "react";
import {
  Dialog,
  DialogScrollContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecipeForm, type RecipeFormServerErrors } from "./RecipeForm";
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
  // When the backend returns 422 we re-open the sheet with the user's last
  // submitted values and surface inline field errors. These get cleared on
  // success and when the user closes the sheet manually.
  const [lastValues, setLastValues] = useState<Partial<RecipeFormValues> | undefined>(undefined);
  const [serverErrors, setServerErrors] = useState<RecipeFormServerErrors | undefined>(undefined);
  const handleOpenChange = useHistoryBack(open, (next) => {
    onOpenChange(next);
    if (!next) setServerErrors(undefined);
  });

  const { updateRecipe } = useRecipeMutations({
    onSuccess: () => {
      handleOpenChange(false);
      setLastValues(undefined);
      setServerErrors(undefined);
      // Defer invalidations / refetches until after Radix's exit animation
      // so the sheet doesn't briefly re-flash on slow devices.
      setTimeout(onSuccess, 200);
    },
    onFieldErrors: (errors, data) => {
      setLastValues(data);
      setServerErrors(errors);
      onOpenChange(true);
    },
  });

  const { mutateAsync: resubmit } = useResubmitRecipe();

  const onSubmit = (data: RecipeFormValues) => {
    // Clear stale server errors so they don't briefly persist between submits.
    setServerErrors(undefined);

    if (resubmitMode) {
      // Close immediately, run resubmit in background with loading toast
      handleOpenChange(false);
      const toastId = toast.loading(t("toast_saving"));
      void (async () => {
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
          toast.success(t("toast_resubmitted"), { id: toastId });
          setTimeout(onSuccess, 200);
        } catch {
          toast.dismiss(toastId);
          toast.error(t("moderation_error"));
        }
      })();
    } else {
      updateRecipe(recipe.id, data);
    }
  };

  // When the modal is re-opened with 422 errors, lastValues is set — use it
  // instead of the recipe's original values to preserve the user's edits.
  const defaultValues = lastValues ?? getRecipeFormDefaultValues(recipe);

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
          serverErrors={serverErrors}
          onSubmit={onSubmit}
          isOpen={open}
        />
      </DialogScrollContent>
    </Dialog>
  );
}
