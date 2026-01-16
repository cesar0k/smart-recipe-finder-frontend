import { z } from "zod";

export const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"] as const;

export type RecipeDifficulty = (typeof DIFFICULTY_OPTIONS)[number];

const imageFileSchema = z.custom<File>((v) => v instanceof File, {
  message: "Must be a file",
});

export const recipeFormSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(255, "Title is too long (max 255 characters)"),
  description: z.string().optional(),
  cooking_time_in_minutes: z.coerce
    .number()
    .min(1, "Cooking time must be at least 1 minute"),
  difficulty: z.enum(DIFFICULTY_OPTIONS),
  cuisine: z.string().optional(),
  instructions: z
    .string()
    .min(10, "Instructions must be at least 10 characters")
    .max(50000, "Instructions is too long (max 50000 characters)"),
  ingredients: z
    .array(
      z.object({
        value: z.string().min(1, "Ingredient cannot be empty"),
      })
    )
    .min(1, "Add at least one ingredient")
    .max(100, "Too many ingredients added (max 100)"),

  image_urls: z.array(z.string()).optional(),

  imageFiles: z.array(imageFileSchema).max(5, "Max 5 files allowed").optional(),
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;
