import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { 
  useCreateRecipe, 
  useUpdateRecipe,
  useUploadRecipeImages,
  getReadRecipesQueryKey
} from "@/api/recipes/recipes";
import { type RecipeFormValues } from "../types/schema";

interface FastAPIError {
  detail: string | { loc: (string | number)[]; msg: string; type: string }[];
}

export function useRecipeMutations(onSuccess?: () => void) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutateAsync: createMutate, isPending: isCreating } = useCreateRecipe();
  const { mutateAsync: updateMutate, isPending: isUpdating } = useUpdateRecipe();
  const { mutateAsync: uploadImagesMutate, isPending: isUploading } = useUploadRecipeImages();

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
            toast.error("Validation failed");
          }
        } else if (typeof data.detail === 'string') {
          toast.error(data.detail);
        } else {
          toast.error("Validation failed");
        }
        return;
      }
      
      if (data?.detail && typeof data.detail === 'string') {
        toast.error(data.detail);
        return;
      }
    }

    toast.error(defaultMessage);
  };

  const createRecipe = async (data: RecipeFormValues) => {
    try {
      const newRecipe = await createMutate({
        data: {
          title: data.title,
          cooking_time_in_minutes: data.cooking_time_in_minutes,
          difficulty: data.difficulty,
          cuisine: data.cuisine,
          instructions: data.instructions,
          ingredients: data.ingredients.map(i => i.value),
        }
      });

      if (data.imageFiles && data.imageFiles.length > 0 && newRecipe.id) {
        await uploadImagesMutate({
          recipeId: newRecipe.id,
          data: { files: data.imageFiles }
        });
      }
      
      toast.success("Recipe created!");
      onSuccess?.();
      queryClient.invalidateQueries({ queryKey: getReadRecipesQueryKey() });

      if (newRecipe?.id) navigate(`/recipe/${newRecipe.id}`);
      
    } catch (error) {
      handleError(error, "Failed to create recipe");
    }
  };

  const updateRecipe = async (id: number, data: RecipeFormValues) => {
    try {
      await updateMutate({
        recipeId: id,
        data: {
          title: data.title,
          cooking_time_in_minutes: data.cooking_time_in_minutes,
          difficulty: data.difficulty,
          cuisine: data.cuisine,
          instructions: data.instructions,
          ingredients: data.ingredients.map(i => i.value),
          image_urls: data.image_urls 
        }
      });

      if (data.imageFiles && data.imageFiles.length > 0) {
        await uploadImagesMutate({
          recipeId: id,
          data: { files: data.imageFiles }
        });
      }

      toast.success("Recipe updated!");
      onSuccess?.();
      
      queryClient.invalidateQueries({ queryKey: getReadRecipesQueryKey() });
      queryClient.invalidateQueries({ queryKey: ['recipes', id] });
      
    } catch (error) {
      handleError(error, "Failed to update recipe");
    }
  };

  return {
    createRecipe,
    updateRecipe,
    isSubmitting: isCreating || isUpdating || isUploading
  };
}