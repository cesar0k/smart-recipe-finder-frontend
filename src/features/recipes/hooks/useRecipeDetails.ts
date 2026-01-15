import { useParams } from 'react-router-dom';
import { useReadRecipeById } from '@/api/recipes/recipes';

export function useRecipeDetails() {
  const { id } = useParams();
  const recipeId = Number(id);
  const isValidId = !isNaN(recipeId) && recipeId > 0;

  const { 
    data: recipe, 
    isLoading, 
    isError,
    error,
    refetch
  } = useReadRecipeById(recipeId, {
    query: {
      enabled: isValidId,
      retry: 1,
    }
  });

  return {
    recipe,
    isLoading,
    isError,
    refetch,
    error,
    isValidId
  };
}