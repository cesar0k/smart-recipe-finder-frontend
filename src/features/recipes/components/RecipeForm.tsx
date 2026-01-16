import { useFieldArray, useForm, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, Image as ImageIcon, X, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OptimizedImage } from "@/components/ui/optimized-image";

import {
  recipeFormSchema,
  type RecipeFormValues,
  DIFFICULTY_OPTIONS,
} from "../types/schema";
import { useRecipeImageManager } from "../hooks/useRecipeImageManager";
import { useTranslation } from "react-i18next";

interface RecipeFormProps {
  defaultValues?: Partial<RecipeFormValues>;
  onSubmit: (data: RecipeFormValues) => void;
  isSubmitting?: boolean;
}

export function RecipeForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: RecipeFormProps) {
  const { t } = useTranslation();

  const initialValues: DefaultValues<RecipeFormValues> = {
    title: "",
    cooking_time_in_minutes: 30,
    difficulty: "Medium",
    cuisine: "",
    instructions: "",
    ingredients: [{ value: "" }],
    imageFiles: [],
    image_urls: [],
    ...defaultValues,
  } as DefaultValues<RecipeFormValues>;

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema) as any,
    defaultValues: initialValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const {
    imageFiles,
    existingUrls,
    newPreviews,
    handleFileChange,
    removeNewFile,
    removeExistingUrl,
    setAsCoverExisting,
    setNewFileAsCover,
  } = useRecipeImageManager(form);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-0">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">
                {t("form_title_label")}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t("form_title_placeholder")}
                  {...field}
                  className="rounded-full px-4 border-gray-200 bg-gray-50/50 focus:bg-white transition-all"
                />
              </FormControl>
              <FormMessage className="ml-4" />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <FormLabel className="text-gray-700">
            {t("form_photos_label")}
          </FormLabel>

          <div className="grid grid-cols-3 gap-4 mb-2">
            {/* Old photos */}
            {existingUrls.map((url, index) => {
              const isCover = index === 0;
              return (
                <div
                  key={url}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 group"
                >
                  <OptimizedImage
                    src={url}
                    alt={`Existing ${index}`}
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />

                  <button
                    type="button"
                    onClick={() => setAsCoverExisting(url)}
                    className={`absolute top-1 left-1 p-1.5 rounded-full shadow-sm transition-all z-20 
                      ${
                        isCover
                          ? "bg-yellow-400 text-white opacity-100"
                          : "bg-white text-gray-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-yellow-400"
                      }`}
                    title={
                      isCover
                        ? t("form_cover_image_label")
                        : t("form_set_as_cover_label")
                    }
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${isCover ? "fill-current" : ""}`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeExistingUrl(url)}
                    className="absolute top-1 right-1 bg-white text-black rounded-full p-1.5 shadow-md hover:bg-red-50 hover:text-red-500 transition-colors z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={t("form_remove_existing_image_label")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {/* New photos */}
            {newPreviews.map((url, index) => {
              // If no old images, first one is the cover
              const isCover = existingUrls.length === 0 && index === 0;

              return (
                <div
                  key={index}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group"
                >
                  <OptimizedImage src={url} alt="New Preview" />

                  {/* "Make cover" (star) button. Only if there are no old images */}
                  {existingUrls.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setNewFileAsCover(index)}
                      className={`absolute top-1 left-1 p-1.5 rounded-full shadow-sm transition-all z-20 
                        ${
                          isCover
                            ? "bg-yellow-400 text-white opacity-100"
                            : "bg-white text-gray-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-yellow-400"
                        }`}
                      title={
                        isCover
                          ? t("form_cover_image_label")
                          : t("form_set_as_cover_label")
                      }
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${isCover ? "fill-current" : ""}`}
                      />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => removeNewFile(index)}
                    className="absolute top-1 right-1 bg-white text-black rounded-full p-1.5 shadow-md hover:bg-red-50 hover:text-red-500 transition-colors z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={t("form_remove_new_file_label")}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {/* Upload image button */}
            {existingUrls.length + (imageFiles?.length || 0) < 5 && (
              <div className="aspect-square">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-black/20 hover:bg-gray-50 transition-all gap-2 text-gray-400 hover:text-gray-600"
                >
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-xs font-medium">
                    {t("form_add_photo")}
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="cooking_time_in_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">
                  {t("form_time_label")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    className="rounded-full px-4 border-gray-200 bg-gray-50/50 focus:bg-white"
                  />
                </FormControl>
                <FormMessage className="ml-4" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">
                  {t("form_difficulty_label")}
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full rounded-full px-4 border-gray-200 bg-gray-50/50 focus:bg-white">
                      <SelectValue placeholder={t("form_select_placeholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-2xl">
                    {DIFFICULTY_OPTIONS.map((l) => (
                      <SelectItem key={l} value={l} className="rounded-xl">
                        {t(`difficulty.${l}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="ml-4" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cuisine"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">
                  {t("form_cuisine_label")}{" "}
                  <span className="text-gray-400 font-normal">
                    {t("form_optional_label")}
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("form_cuisine_placeholder")}
                    {...field}
                    value={field.value || ""}
                    className="rounded-full px-4 border-gray-200 bg-gray-50/50 focus:bg-white"
                  />
                </FormControl>
                <FormMessage className="ml-4" />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <FormLabel className="text-gray-700">
            {t("form_ingredients_label")}
          </FormLabel>
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <FormField
                control={form.control}
                name={`ingredients.${index}.value`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder={t("form_ingredient_placeholder")}
                        {...field}
                        className="rounded-full px-4 border-gray-200 bg-gray-50/50 focus:bg-white"
                      />
                    </FormControl>
                    <FormMessage className="ml-4" />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                className="rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1 rounded-full border-dashed border-gray-300 text-gray-600 hover:text-black hover:border-gray-400"
            onClick={() => append({ value: "" })}
          >
            {t("form_add_ingredient")}
          </Button>
        </div>

        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">
                {t("form_instructions_label")}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("form_instructions_placeholder")}
                  className="min-h-[150px] rounded-[1.5rem] p-4 px-5 border-gray-200 bg-gray-50/50 focus:bg-white resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage className="ml-4" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full rounded-full h-12 text-base font-semibold bg-black hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all hover:scale-[1.01]"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("form_saving_btn") : t("form_save_btn")}
        </Button>
      </form>
    </Form>
  );
}
