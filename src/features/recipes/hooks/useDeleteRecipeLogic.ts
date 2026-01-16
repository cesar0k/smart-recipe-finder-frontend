import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDeleteRecipe } from "@/api/recipes/recipes";
import { useTranslation } from "react-i18next";

export function useDeleteRecipeLogic() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { mutateAsync, isPending } = useDeleteRecipe();

  const deleteRecipe = async (id: number) => {
    try {
      await mutateAsync({ recipeId: id });

      toast.success(t("toast_deleted"));

      navigate("/");
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
