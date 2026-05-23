import { z } from "zod";
import type { TFunction } from "i18next";

export const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"] as const;

export type RecipeDifficulty = (typeof DIFFICULTY_OPTIONS)[number];

export const createRecipeFormSchema = (t: TFunction) => {
  const imageFileSchema = z.custom<File>((v) => v instanceof File, {
    message: t("validation_must_be_file"),
  });

  return z.object({
    // min/max mirror backend RecipeBase (min_length=3, max_length=255)
    title: z
      .string()
      .min(3, t("validation_title_min"))
      .max(255, t("validation_title_max")),
    // Mirror backend limit (RecipeBase.description max_length=2000) so the
    // user sees the error in the field, not as a toast after submit.
    description: z
      .string()
      .max(2000, t("validation_description_max"))
      .optional(),
    // Backend stores as PG INTEGER (max 2_147_483_647). 1440 = 24h, plenty
    // for any real recipe and protects against int32 overflow that surfaces
    // as a 422 "exceeded maximum size".
    cooking_time_in_minutes: z.coerce
      .number()
      .int(t("validation_time_int"))
      .min(1, t("validation_time_min"))
      .max(1440, t("validation_time_max")),
    difficulty: z.enum(DIFFICULTY_OPTIONS),
    cuisine: z
      .string()
      .max(50, t("validation_cuisine_max"))
      .optional(),
    instructions: z
      .string()
      .min(10, t("validation_instructions_min"))
      .max(50000, t("validation_instructions_max")),
    ingredients: z
      .array(
        z.object({
          // Backend allows up to 255 chars per ingredient string.
          value: z
            .string()
            .min(1, t("validation_ingredient_empty"))
            .max(255, t("validation_ingredient_max")),
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
