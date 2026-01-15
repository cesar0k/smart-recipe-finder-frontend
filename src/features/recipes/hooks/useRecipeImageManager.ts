import { useEffect, useMemo } from "react";
import { type UseFormReturn } from "react-hook-form";
import { type RecipeFormValues } from "../types/schema";
import { toast } from "sonner";

export function useRecipeImageManager(form: UseFormReturn<RecipeFormValues>) {
  const { getValues, setValue, watch } = form;

  const imageFiles = watch("imageFiles");
  const existingUrls = watch("image_urls") || [];

  const newPreviews = useMemo(() => {
    if (!imageFiles) {
      return [];
    }
    return imageFiles.map((file) => URL.createObjectURL(file));
  }, [imageFiles]);

  useEffect(() => {
    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newPreviews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const currentFiles = getValues("imageFiles") || [];
      const totalCount =
        existingUrls.length + currentFiles.length + files.length;

      if (totalCount > 5) {
        toast("Too much images (maximum 5 allowed)")
      }

      const newFiles = [...currentFiles, ...Array.from(files)].slice(
        0,
        5 - existingUrls.length,
      );
      setValue("imageFiles", newFiles, { shouldValidate: true });
    }
  };

  const removeNewFile = (index: number) => {
    const currentFiles = getValues("imageFiles") || [];
    const newFiles = currentFiles.filter((_, i) => i !== index);
    setValue("imageFiles", newFiles, { shouldValidate: true });
  };

  const removeExistingUrl = (urlToRemove: string) => {
    const currentUrls = getValues("image_urls") || [];
    const updatedUrls = currentUrls.filter((url) => url !== urlToRemove);
    setValue("image_urls", updatedUrls, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  // Cover logic for an old images
  const setAsCoverExisting = (urlToPromote: string) => {
    const currentUrls = getValues("image_urls") || [];
    const otherUrls = currentUrls.filter((url) => url !== urlToPromote);
    const newOrder = [urlToPromote, ...otherUrls];
    setValue("image_urls", newOrder, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const setNewFileAsCover = (indexToPromote: number) => {
    const currentFiles = getValues("imageFiles") || [];
    const fileToPromote = currentFiles[indexToPromote];

    if (!fileToPromote) return;

    const otherFiles = currentFiles.filter((_, i) => i !== indexToPromote);

    const newOrder = [fileToPromote, ...otherFiles];

    setValue("imageFiles", newOrder, { shouldValidate: true });
  };

  return {
    imageFiles,
    existingUrls,
    newPreviews,
    handleFileChange,
    removeNewFile,
    removeExistingUrl,
    setAsCoverExisting,
    setNewFileAsCover,
  };
}
