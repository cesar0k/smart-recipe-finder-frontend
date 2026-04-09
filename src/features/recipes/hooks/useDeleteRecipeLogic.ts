import { toast } from "sonner";
import { useDeleteRecipe } from "@/api/recipes/recipes";
import { useTranslation } from "react-i18next";

export function useDeleteRecipeLogic() {
  const { t } = useTranslation();

  const { mutateAsync, isPending } = useDeleteRecipe();

  const deleteRecipe = async (id: number) => {
    try {
      await mutateAsync({ recipeId: id });

      toast.success(t("toast_deleted"));

      // Full page reload to clear stale caches
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      toast.error(t("toast_error_delete"));
    }
  };

  return {
    deleteRecipe,
    isDeleting: isPending,
  };
}
