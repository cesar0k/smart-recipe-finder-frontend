import { type Recipe } from "@/api/model";
import {
  type RecipeFormValues,
  DIFFICULTY_OPTIONS,
} from "../types/schema";

export function getRecipeFormDefaultValues(
  recipe: Recipe
): Partial<RecipeFormValues> {
  
  const incomingDifficulty = String(recipe.difficulty || "").trim();
  
  const matchedDifficulty = DIFFICULTY_OPTIONS.find(
    (opt) => opt.toLowerCase() === incomingDifficulty.toLowerCase()
  );

  return {
    title: recipe.title || "",
    cooking_time_in_minutes: recipe.cooking_time_in_minutes || 0,
    
    difficulty: matchedDifficulty || "Medium",
    
    cuisine: recipe.cuisine || "",
    instructions: recipe.instructions || "",

    ingredients: recipe.ingredients?.map((ing) =>
      typeof ing === "string" ? { value: ing } : { value: ing.name }
    ) || [{ value: "" }],

    image_urls: recipe.image_urls || [],
    imageFiles: [],
  };
}