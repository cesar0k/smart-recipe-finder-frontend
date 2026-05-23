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
import { type RecipeFormServerErrors } from "../components/RecipeForm";
import { useTranslation } from "react-i18next";
import { type FieldPath } from "react-hook-form";

interface FastAPIError {
  detail: string | { loc: (string | number)[]; msg: string; type: string }[];
}

/**
 * Map a FastAPI 422 `loc` array to the corresponding RHF field path.
 * Examples:
 *   ["body", "title"]                 → "title"
 *   ["body", "ingredients", 0]        → "ingredients.0.value"
 *   ["body", "ingredients", 2, "..."] → "ingredients.2.value"
 *
 * Returns null if the path can't be mapped to a form field (e.g. the error
 * concerns a server-only field). Caller falls back to a toast.
 */
function locToFieldPath(
  loc: (string | number)[]
): FieldPath<RecipeFormValues> | null {
  // Skip the leading "body" segment if present.
  const segments = loc[0] === "body" ? loc.slice(1) : loc.slice();
  if (segments.length === 0) return null;

  const head = segments[0];
  if (head === "ingredients") {
    const idx = segments[1];
    if (typeof idx === "number") {
      return `ingredients.${idx}.value` as FieldPath<RecipeFormValues>;
    }
    return "ingredients" as FieldPath<RecipeFormValues>;
  }

  if (typeof head === "string") {
    return head as FieldPath<RecipeFormValues>;
  }
  return null;
}

/**
 * Parse a FastAPI 422 response into a map of field path → message that
 * RecipeForm can apply via form.setError. Returns null if the error wasn't a
 * structured 422 (caller should fall back to a toast).
 */
function parseFieldErrors(
  error: unknown
): RecipeFormServerErrors | null {
  if (!(error instanceof AxiosError)) return null;
  if (error.response?.status !== 422) return null;
  const data = error.response.data as FastAPIError | undefined;
  if (!data || !Array.isArray(data.detail)) return null;

  const result: RecipeFormServerErrors = {};
  for (const entry of data.detail) {
    const path = locToFieldPath(entry.loc);
    if (!path) continue;
    // Keep the first error per field; later ones are usually duplicates.
    if (!result[path]) result[path] = entry.msg;
  }
  return Object.keys(result).length > 0 ? result : null;
}

interface RecipeMutationsOptions {
  /** Called after a successful create/update so the caller can close the modal. */
  onSuccess?: () => void;
  /**
   * Called when the backend returns 422 with structured field errors. The
   * caller is expected to re-open the modal with these errors applied and
   * the user's data restored.
   */
  onFieldErrors?: (errors: RecipeFormServerErrors, data: RecipeFormValues) => void;
}

export function useRecipeMutations(
  optionsOrOnSuccess?: RecipeMutationsOptions | (() => void)
) {
  const options: RecipeMutationsOptions =
    typeof optionsOrOnSuccess === "function"
      ? { onSuccess: optionsOrOnSuccess }
      : optionsOrOnSuccess ?? {};
  const { onSuccess, onFieldErrors } = options;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();


  const { mutateAsync: createMutate, isPending: isCreating } =
    useCreateRecipe();
  const { mutateAsync: updateMutate, isPending: isUpdating } =
    useUpdateRecipe();
  const { mutateAsync: uploadImagesMutate, isPending: isUploading } =
    useUploadRecipeImages();

  /**
   * Returns true if the error was a structured 422 and was surfaced via
   * `onFieldErrors` — the caller should NOT additionally show a toast in that
   * case (the user will see inline messages in the re-opened form).
   */
  const handleError = (
    error: unknown,
    defaultMessage: string,
    submittedData?: RecipeFormValues
  ): boolean => {
    console.error(error);

    if (submittedData && onFieldErrors) {
      const fieldErrors = parseFieldErrors(error);
      if (fieldErrors) {
        onFieldErrors(fieldErrors, submittedData);
        return true;
      }
    }

    if (error instanceof AxiosError) {
      const data = error.response?.data as FastAPIError | undefined;
      if (data?.detail && typeof data.detail === "string") {
        toast.error(data.detail);
        return false;
      }
      if (error.response?.status === 422) {
        toast.error(t("toast_error_validation_failed"));
        return false;
      }
    }

    toast.error(defaultMessage);
    return false;
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
        handleError(error, t("toast_error_create"), data);
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
        handleError(error, t("toast_error_update"), data);
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
