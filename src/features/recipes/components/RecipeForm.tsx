import { useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  useFieldArray,
  useForm,
  type DefaultValues,
  type FieldPath,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, Image as ImageIcon, X, Star } from "lucide-react";
import { useDropzone } from "react-dropzone";

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
import { RecipeLightbox } from "./RecipeLightbox";

import {
  createRecipeFormSchema,
  type RecipeFormValues,
  DIFFICULTY_OPTIONS,
} from "../types/schema";
import { useRecipeImageManager } from "../hooks/useRecipeImageManager";
import { useTranslation } from "react-i18next";

/** Field-level server errors keyed by RHF path (e.g. "title", "ingredients.0.value"). */
export type RecipeFormServerErrors = Partial<
  Record<FieldPath<RecipeFormValues>, string>
>;

interface RecipeFormProps {
  defaultValues?: Partial<RecipeFormValues>;
  onSubmit: (data: RecipeFormValues) => void;
  isSubmitting?: boolean;
  /**
   * Field-level errors returned by the backend after submit (e.g. 422 from
   * FastAPI). Applied via form.setError so they surface under the right field
   * instead of as a generic toast. New refs reset previous errors.
   */
  serverErrors?: RecipeFormServerErrors;
}

export function RecipeForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  serverErrors,
}: RecipeFormProps) {
  const { t } = useTranslation();

  const initialValues: DefaultValues<RecipeFormValues> = {
    title: "",
    description: "",
    cooking_time_in_minutes: 30,
    difficulty: "Medium",
    cuisine: "",
    instructions: "",
    ingredients: [{ value: "" }],
    imageFiles: [],
    image_urls: [],
    newCoverIndex: null,
    coverExistingUrl: null,
    ...defaultValues,
  } as DefaultValues<RecipeFormValues>;

  const recipeFormSchema = createRecipeFormSchema(t);

  const form = useForm<RecipeFormValues>({
    // zodResolver type mismatch due to z.coerce.number() in Zod v4
    resolver: zodResolver(recipeFormSchema) as Resolver<RecipeFormValues>,
    defaultValues: initialValues,
    // Validate only when the user presses Save the first time. This avoids
    // two bad UX moments: (1) a "field cannot be empty" message flashing
    // under an ingredient row for the duration of its exit animation when
    // the user removes it, and (2) the title's required-error popping up
    // during the sheet's exit animation when the user opens and closes the
    // sheet without filling anything in. Once a failed submit has surfaced
    // errors, `reValidateMode: "onChange"` clears them in real time as the
    // user fixes the offending fields, so they get immediate feedback when
    // it's actually relevant.
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  // Apply server-side validation errors (FastAPI 422) under the matching
  // fields. A new `serverErrors` object means a fresh submit attempt — clear
  // any previous server errors first so stale ones don't linger.
  useEffect(() => {
    if (!serverErrors) return;
    for (const [field, message] of Object.entries(serverErrors)) {
      if (!message) continue;
      form.setError(field as FieldPath<RecipeFormValues>, {
        type: "server",
        message,
      });
    }
  }, [serverErrors, form]);


  const {
    imageFiles,
    existingUrls,
    newPreviews,
    handleFileChange,
    handleDropFiles,
    removeNewFile,
    removeExistingUrl,
    setAsCoverExisting,
    setNewFileAsCover,
    isExistingCover,
    isNewFileCover,
  } = useRecipeImageManager(form);

  const totalImages = existingUrls.length + (imageFiles?.length || 0);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDropFiles,
    accept: { "image/*": [] },
    noClick: true,
    disabled: totalImages >= 5,
  });

  // Lightbox for previewing photos already added to the form.
  // All images are merged into one array, with `existingUrls` first then `newPreviews`.
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxImages = [...existingUrls, ...newPreviews.map((p) => p.url)];

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5 pt-0"
      >
        {/* Everything above the ingredient list, wrapped in one
            `layout="position"` node. When a row is removed while the modal
            is scrolled to the bottom, the ingredient section collapses and
            this whole upper block has to move up; position-mode animates
            that Y move smoothly WITHOUT counter-scaling its children (so
            the Photos grid and the Radix difficulty Select inside don't get
            distorted — full `layout` would do that). It keeps its own
            space-y-5 so the inner field spacing is unchanged. */}
        <motion.div
          layout="position"
          transition={{ layout: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } }}
          className="space-y-5"
        >
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
                  className="rounded-full px-4 border-gray-300 bg-white transition-all"
                />
              </FormControl>
              <FormMessage className="ml-4" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">
                {t("form_description_label")}{" "}
                <span className="text-gray-400 font-normal">
                  {t("form_optional_label")}
                </span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("form_description_placeholder")}
                  className="min-h-[80px] rounded-[1.5rem] p-4 px-5 border-gray-300 bg-white resize-none"
                  maxLength={2000}
                  {...field}
                  value={field.value || ""}
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

          <div
            {...getRootProps()}
            className={`grid grid-cols-3 gap-4 mb-2 rounded-2xl p-1 -m-1 transition-all ${
              isDragActive ? "ring-2 ring-black/20 bg-gray-50/80" : ""
            }`}
          >
            {/* Hidden dropzone input (react-dropzone requires it) */}
            <input {...getInputProps()} />

            {/* LayoutGroup coordinates layout animations ACROSS the two
                separate AnimatePresence contexts below (photos + the
                upload tile). Without it, removing a photo (in the photos'
                presence) didn't trigger the tile's `layout` animation —
                the tile teleported to its new cell because its layout
                snapshot lives in a different presence context. With the
                shared group, the tile glides into the freed cell, matching
                the smooth slide it already had on photo ADD. */}
            <LayoutGroup>
            {/* Default AnimatePresence (NOT popLayout). popLayout detaches
                the exiting photo to position:absolute, which left it
                hovering over the section below as it scaled out (the
                "overlap" + apparent slide-down). In the default mode the
                exiting photo stays in its own grid cell and simply scales
                down in place — the mirror image of the scale-up entrance —
                so it can't overflow into the next section. The `layout`
                on each cell still glides the survivors into their new
                grid positions once it unmounts. */}
            <AnimatePresence initial={false}>
            {/* Old photos */}
            {existingUrls.map((url, index) => {
              const isCover = isExistingCover(url, index);
              return (
                <motion.div
                  key={url}
                  // `layout="position"` (not full layout): the photo cells
                  // are fixed aspect-square, so we only want them to glide
                  // to new grid positions — never have their size animated.
                  // Full `layout` competed with the scale-out `exit` and
                  // sometimes won, dragging the removed photo toward its
                  // would-be new slot (the "slides down" glitch) instead of
                  // letting it scale away in place.
                  layout="position"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{
                    opacity: { duration: 0.14, ease: "easeOut" },
                    scale: { duration: 0.18, ease: "easeOut" },
                    layout: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
                  }}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 group"
                >
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    className="absolute inset-0 w-full h-full cursor-zoom-in"
                    aria-label={t("existing_image_alt", { index: index + 1 })}
                  >
                    <OptimizedImage
                      src={url}
                      alt={t("existing_image_alt", { index: index + 1 })}
                      className="w-full h-full object-cover"
                    />
                  </button>

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />

                  <button
                    type="button"
                    onClick={() => setAsCoverExisting(url)}
                    className={`absolute top-1 left-1 h-7 w-7 flex items-center justify-center rounded-full shadow-sm transition-all z-[1]
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
                    <motion.span
                      // Pulse the star when this photo becomes the cover.
                      // `animate` keyframes run whenever isCover flips to
                      // true; staying false holds it at rest scale.
                      animate={isCover ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="flex"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${isCover ? "fill-current" : ""}`}
                      />
                    </motion.span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeExistingUrl(url)}
                    className="absolute top-1 right-1 bg-white text-black rounded-full p-1.5 shadow-md hover:bg-red-50 hover:text-red-500 transition-colors z-[1] opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={t("form_remove_existing_image_label")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}

            {/* New photos */}
            {newPreviews.map(({ url, key }, index) => {
              const isCover = isNewFileCover(index);

              return (
                <motion.div
                  key={key}
                  layout="position"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{
                    opacity: { duration: 0.14, ease: "easeOut" },
                    scale: { duration: 0.18, ease: "easeOut" },
                    layout: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
                  }}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 group"
                >
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(existingUrls.length + index)}
                    className="absolute inset-0 w-full h-full cursor-zoom-in"
                    aria-label={t("new_preview_alt")}
                  >
                    <OptimizedImage src={url} alt={t("new_preview_alt")} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewFileAsCover(index)}
                    className={`absolute top-1 left-1 h-7 w-7 flex items-center justify-center rounded-full shadow-sm transition-all z-[1]
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
                    <motion.span
                      // Pulse the star when this photo becomes the cover.
                      // `animate` keyframes run whenever isCover flips to
                      // true; staying false holds it at rest scale.
                      animate={isCover ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="flex"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${isCover ? "fill-current" : ""}`}
                      />
                    </motion.span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeNewFile(index)}
                    className="absolute top-1 right-1 bg-white text-black rounded-full p-1.5 shadow-md hover:bg-red-50 hover:text-red-500 transition-colors z-[1] opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={t("form_remove_new_file_label")}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}

            {/* Upload tile lives in the SAME AnimatePresence as the photos
                (not a separate one). Keeping it in the same presence +
                LayoutGroup is what lets it animate to its new cell when the
                LAST photo is removed — with a separate presence the photo
                grid emptied out and framer had no surviving layout sibling
                in that presence to trigger the tile's reflow, so the tile
                teleported. `layout="position"` glides it between cells on
                add/remove; it never itself exits except when the 5th photo
                is added (handled by the `totalImages < 5` guard). */}
            {totalImages < 5 && (
              <motion.div
                key="upload-tile"
                layout="position"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                // On exit (5th photo added) detach the tile from the grid
                // flow immediately via position:absolute so the new photo
                // claims its cell at once instead of appearing one cell over
                // and sliding in. This gives the "photo takes the tile's
                // place" effect that popLayout used to provide — but without
                // a separate AnimatePresence, so removing the LAST photo
                // still animates the tile's reflow through the shared
                // LayoutGroup. `position: "absolute"` is applied as a
                // discrete (non-interpolated) style the moment exit begins.
                exit={{ opacity: 0, position: "absolute" }}
                transition={{
                  opacity: { duration: 0.12, ease: "easeOut" },
                  scale: { duration: 0.2, ease: "easeOut" },
                  layout: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
                }}
                className="aspect-square"
              >
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
                  className={`flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-2xl cursor-pointer transition-all gap-2 ${
                    isDragActive
                      ? "border-black/30 bg-gray-100 text-gray-700"
                      : "border-gray-200 text-gray-400 hover:border-black/20 hover:bg-gray-50 hover:text-gray-600"
                  }`}
                >
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-xs font-medium text-center leading-tight px-1">
                    {isDragActive ? t("form_drop_photo") : t("form_add_photo")}
                  </span>
                </label>
              </motion.div>
            )}
            </AnimatePresence>
            </LayoutGroup>
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
                    className="rounded-full px-4 border-gray-300 bg-white"
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
                    <SelectTrigger className="w-full rounded-full px-4 border-gray-300 bg-white">
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
                    className="rounded-full px-4 border-gray-300 bg-white"
                  />
                </FormControl>
                <FormMessage className="ml-4" />
              </FormItem>
            )}
          />
        </div>
        </motion.div>

        {/* Ingredients section uses `layout="position"`, NOT full `layout`.
            Full layout counter-scales the section's children when its
            height changes — that's what made the "Ingredients" heading
            jitter a couple of px on every add/remove (the exact bug we
            fixed in the filter modal). position-mode animates only the
            section's own Y as it's pushed by siblings and leaves its height
            change instant + un-counter-scaled, so the heading stays still.
            The row list inside owns the height animation via the rows'
            own `layout` + popLayout. */}
        <motion.div
          layout="position"
          transition={{ layout: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } }}
          className="space-y-2"
        >
          <FormLabel className="text-gray-700">
            {t("form_ingredients_label")}
          </FormLabel>
          {/* Exactly the pattern that works flawlessly for the filter
              modal's ingredient tags: a `relative` container + popLayout +
              `layout` on each row. No manual height tween. On remove,
              popLayout detaches the exiting row (position: absolute, so it
              no longer takes space) and fades it; every remaining row plus
              the "Add" button (all `layout`) glides into the freed space on
              ONE shared curve. `relative` anchors the absolute exit inside
              this list so it can't drift toward the dialog. */}
          <div className="relative space-y-2">
            <AnimatePresence initial={false} mode="popLayout">
              {fields.map((field, index) => (
                <motion.div
                  key={field.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{
                    // Enter opacity is gentle (0.18). Exit opacity is FAST
                    // (0.1) so the popLayout'd row — which stays at its old
                    // absolute Y while fading — becomes invisible before the
                    // row gliding up beneath it (via `layout`, 0.32) reaches
                    // its spot. Without the fast fade the two full-width rows
                    // visibly overlap mid-animation.
                    opacity: { duration: 0.1, ease: "easeOut" },
                    y: { duration: 0.18, ease: "easeOut" },
                    layout: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
                  }}
                  className="flex gap-2"
                >
                  <FormField
                    control={form.control}
                    name={`ingredients.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder={t("form_ingredient_placeholder")}
                            {...field}
                            className="rounded-full px-4 border-gray-300 bg-white"
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
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {/* `layout` so the Add button glides up/down on the same curve as
              the rows when one is added/removed (otherwise it snaps to its
              new Y the frame a row unmounts). */}
          <motion.div
            layout
            transition={{ layout: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } }}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1 rounded-full border-dashed border-gray-300 text-gray-600 hover:text-black hover:border-gray-400"
              onClick={() => append({ value: "" })}
            >
              {t("form_add_ingredient")}
            </Button>
          </motion.div>
        </motion.div>

        {/* `layout` so the whole Instructions block glides up/down on the
            same curve as the ingredient rows when one is added/removed —
            instead of snapping to its new Y the instant a row unmounts
            (which also caused the exiting row to visually overlap it when
            the modal was scrolled to the bottom). */}
        <motion.div layout transition={{ layout: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } }}>
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
                    className="min-h-[150px] rounded-[1.5rem] p-4 px-5 border-gray-300 bg-white resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="ml-4" />
              </FormItem>
            )}
          />
        </motion.div>

        <div className="sticky bottom-0 pt-4" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
          <Button
            type="submit"
            className="w-full rounded-full h-12 text-base font-semibold bg-black hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all hover:scale-[1.01]"
            disabled={isSubmitting}
          >
            {t("form_save_btn")}
          </Button>
        </div>
      </form>

      {lightboxIndex !== null && lightboxImages.length > 0 && (
        <RecipeLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          open={lightboxIndex !== null}
          onOpenChange={(open) => {
            if (!open) setLightboxIndex(null);
          }}
        />
      )}
    </Form>
  );
}
