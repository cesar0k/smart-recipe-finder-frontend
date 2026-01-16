import { type Recipe } from "@/api/model";
import {
  type RecipeFormValues,
  DIFFICULTY_OPTIONS,
  type RecipeDifficulty,
} from "../types/schema";

export function getRecipeFormDefaultValues(
  recipe: Recipe
): Partial<RecipeFormValues> {
  return {
    title: recipe.title || "",
    cooking_time_in_minutes: recipe.cooking_time_in_minutes || 0,
    difficulty: DIFFICULTY_OPTIONS.includes(
      recipe.difficulty as RecipeDifficulty
    )
      ? (recipe.difficulty as RecipeDifficulty)
      : "Medium",
    cuisine: recipe.cuisine || "",
    instructions: recipe.instructions || "",

    // Map: ["salt", "sugar"] -> [{value: "salt"}, {value: "sugar"}]
    ingredients: recipe.ingredients?.map((ing) =>
      typeof ing === "string" ? { value: ing } : { value: ing.name }
    ) || [{ value: "" }],

    image_urls: recipe.image_urls || [],
    imageFiles: [],
  };
}
