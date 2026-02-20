import { z } from "zod";
import type { TFunction } from "i18next";

export const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"] as const;

export type RecipeDifficulty = (typeof DIFFICULTY_OPTIONS)[number];

export const createRecipeFormSchema = (t: TFunction) => {
  const imageFileSchema = z.custom<File>((v) => v instanceof File, {
    message: t("validation_must_be_file"),
  });

  return z.object({
    title: z
      .string()
      .min(2, t("validation_title_min"))
      .max(255, t("validation_title_max")),
    description: z.string().optional(),
    cooking_time_in_minutes: z.coerce
      .number()
      .min(1, t("validation_time_min")),
    difficulty: z.enum(DIFFICULTY_OPTIONS),
    cuisine: z.string().optional(),
    instructions: z
      .string()
      .min(10, t("validation_instructions_min"))
      .max(50000, t("validation_instructions_max")),
    ingredients: z
      .array(
        z.object({
          value: z.string().min(1, t("validation_ingredient_empty")),
        })
      )
      .min(1, t("validation_ingredients_min"))
      .max(100, t("validation_ingredients_max")),
    image_urls: z.array(z.string()).optional(),
    imageFiles: z
      .array(imageFileSchema)
      .max(5, t("validation_max_files"))
      .optional(),
    newCoverIndex: z.number().nullable().optional(),
    coverExistingUrl: z.string().nullable().optional(),
  });
};

export type RecipeFormValues = z.infer<ReturnType<typeof createRecipeFormSchema>>;
