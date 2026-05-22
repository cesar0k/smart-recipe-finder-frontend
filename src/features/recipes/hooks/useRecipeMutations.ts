import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  useCreateRecipe,
  useUpdateRecipe,
  useUploadRecipeImages,
  getReadRecipesQueryKey,
  getReadRecipeByIdQueryKey,
} from "@/api/recipes/recipes";
import { type RecipeFormValues } from "../types/schema";
import { useTranslation } from "react-i18next";

interface FastAPIError {
  detail: string | { loc: (string | number)[]; msg: string; type: string }[];
}

export function useRecipeMutations(onSuccess?: () => void) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { mutateAsync: createMutate, isPending: isCreating } =
    useCreateRecipe();
  const { mutateAsync: updateMutate, isPending: isUpdating } =
    useUpdateRecipe();
  const { mutateAsync: uploadImagesMutate, isPending: isUploading } =
    useUploadRecipeImages();

  const handleError = (error: unknown, defaultMessage: string) => {
    console.error(error);

    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const data = error.response?.data as FastAPIError;

      if (status === 422 && data) {
        if (Array.isArray(data.detail)) {
          const firstError = data.detail[0];
          if (firstError) {
            const fieldName = firstError.loc[firstError.loc.length - 1];
            toast.error(`${fieldName}: ${firstError.msg}`);
          } else {
            toast.error(t("toast_error_validation_failed"));
          }
        } else if (typeof data.detail === "string") {
          toast.error(data.detail);
        } else {
          toast.error(t("toast_error_validation_failed"));
        }
        return;
      }

      if (data?.detail && typeof data.detail === "string") {
        toast.error(data.detail);
        return;
      }
    }

    toast.error(defaultMessage);
  };

  /**
   * Create a recipe in the background.
   * The caller should call onSuccess() (i.e. close the modal) IMMEDIATELY
   * after invoking this — the actual network work happens in the background
   * with a loading toast, and the user can keep using the app.
   */
  const createRecipe = (data: RecipeFormValues) => {
    onSuccess?.();

    const toastId = toast.loading(t("toast_creating"));

    void (async () => {
      try {
        const newRecipe = await createMutate({
          data: {
            title: data.title,
            description: data.description || undefined,
            cooking_time_in_minutes: data.cooking_time_in_minutes,
            difficulty: data.difficulty,
            cuisine: data.cuisine,
            instructions: data.instructions,
            ingredients: data.ingredients.map((i) => i.value),
          },
        });

        if (data.imageFiles && data.imageFiles.length > 0 && newRecipe.id) {
          await uploadImagesMutate({
            recipeId: newRecipe.id,
            data: { files: data.imageFiles },
          });
        }

        const invalidate = () =>
          queryClient.invalidateQueries({ queryKey: getReadRecipesQueryKey() });

        if (newRecipe.status === "pending") {
          toast.success(t("toast_created_pending"), { id: toastId });
          setTimeout(invalidate, 200);
        } else {
          toast.success(t("toast_created"), { id: toastId });
          setTimeout(invalidate, 200);
          if (newRecipe?.id) navigate(`/recipe/${newRecipe.id}`);
        }
      } catch (error) {
        toast.dismiss(toastId);
        handleError(error, t("toast_error_create"));
      }
    })();
  };

  const updateRecipe = (id: number, data: RecipeFormValues) => {
    onSuccess?.();

    const toastId = toast.loading(t("toast_saving"));

    void (async () => {
      try {
        let orderedExistingUrls = data.image_urls || [];
        if (data.coverExistingUrl && orderedExistingUrls.length > 0) {
          const coverUrl = data.coverExistingUrl;
          orderedExistingUrls = [
            coverUrl,
            ...orderedExistingUrls.filter((u) => u !== coverUrl),
          ];
        }

        const updateResult = await updateMutate({
          recipeId: id,
          data: {
            title: data.title,
            description: data.description || undefined,
            cooking_time_in_minutes: data.cooking_time_in_minutes,
            difficulty: data.difficulty,
            cuisine: data.cuisine,
            instructions: data.instructions,
            ingredients: data.ingredients.map((i) => i.value),
            image_urls: orderedExistingUrls,
          },
        });

        // If result is a draft (regular user), show moderation toast and exit early
        if ("recipe_id" in updateResult) {
          toast.success(t("toast_updated_pending"), { id: toastId });
          return;
        }

        if (data.imageFiles && data.imageFiles.length > 0) {
          const uploadedRecipe = await uploadImagesMutate({
            recipeId: id,
            data: { files: data.imageFiles },
          });

          if (data.newCoverIndex != null && uploadedRecipe.image_urls) {
            const existingCount = orderedExistingUrls.length;
            const newImageIndex = existingCount + data.newCoverIndex;
            const allUrls = uploadedRecipe.image_urls;

            if (newImageIndex < allUrls.length) {
              const coverUrl = allUrls[newImageIndex];
              if (coverUrl) {
                const reordered = [
                  coverUrl,
                  ...allUrls.filter((_, i) => i !== newImageIndex),
                ];
                await updateMutate({
                  recipeId: id,
                  data: { image_urls: reordered },
                });
              }
            }
          }
        }

        toast.success(t("toast_updated"), { id: toastId });
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: getReadRecipesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getReadRecipeByIdQueryKey(id) });
        }, 200);
      } catch (error) {
        toast.dismiss(toastId);
        handleError(error, t("toast_error_update"));
      }
    })();
  };

  return {
    createRecipe,
    updateRecipe,
    // Still expose isSubmitting for any UI that wants to disable a button
    // immediately on click, though the modal closes right away now.
    isSubmitting: isCreating || isUpdating || isUploading,
  };
}
