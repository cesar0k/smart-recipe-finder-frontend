import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDeleteRecipe } from "@/api/recipes/recipes";

export function useDeleteRecipeLogic() {
  const navigate = useNavigate();

  const { mutateAsync, isPending } = useDeleteRecipe();

  const deleteRecipe = async (id: number) => {
    try {
      await mutateAsync({ recipeId: id });

      toast.success("Recipe deleted successfully");

      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete recipe");
    }
  };

  return {
    deleteRecipe,
    isDeleting: isPending,
  };
}
