import { useEffect, useMemo } from "react";
import { type UseFormReturn } from "react-hook-form";
import { type RecipeFormValues } from "../types/schema";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function useRecipeImageManager(form: UseFormReturn<RecipeFormValues>) {
  const { getValues, setValue, watch } = form;
  const { t } = useTranslation();

  const imageFiles = watch("imageFiles");
  const existingUrls = watch("image_urls") || [];
  const newCoverIndex = watch("newCoverIndex");
  const coverExistingUrl = watch("coverExistingUrl");

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
        toast.error(t("toast_error_too_many_images"));
      }

      const newFiles = [...currentFiles, ...Array.from(files)].slice(
        0,
        5 - existingUrls.length
      );
      setValue("imageFiles", newFiles, { shouldValidate: true });
    }
  };

  const removeNewFile = (index: number) => {
    const currentFiles = getValues("imageFiles") || [];
    const newFiles = currentFiles.filter((_, i) => i !== index);
    setValue("imageFiles", newFiles, { shouldValidate: true });

    const currentCover = getValues("newCoverIndex");
    if (currentCover != null) {
      if (index === currentCover) {
        setValue("newCoverIndex", null);
      } else if (index < currentCover) {
        setValue("newCoverIndex", currentCover - 1);
      }
    }
  };

  const removeExistingUrl = (urlToRemove: string) => {
    const currentUrls = getValues("image_urls") || [];
    const updatedUrls = currentUrls.filter((url) => url !== urlToRemove);
    setValue("image_urls", updatedUrls, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (coverExistingUrl === urlToRemove) {
      setValue("coverExistingUrl", null);
    }
  };

  const setAsCoverExisting = (url: string) => {
    setValue("coverExistingUrl", url, { shouldDirty: true });
    setValue("newCoverIndex", null);
  };

  const setNewFileAsCover = (index: number) => {
    setValue("newCoverIndex", index);
    setValue("coverExistingUrl", null);
  };

  const handleDropFiles = (acceptedFiles: File[]) => {
    const currentFiles = getValues("imageFiles") || [];
    const remaining = 5 - existingUrls.length - currentFiles.length;
    if (remaining <= 0) {
      toast.error(t("toast_error_too_many_images"));
      return;
    }
    const newFiles = [...currentFiles, ...acceptedFiles.slice(0, remaining)];
    setValue("imageFiles", newFiles, { shouldValidate: true });
  };

  const isExistingCover = (url: string, index: number) => {
    if (newCoverIndex != null) return false;
    if (coverExistingUrl != null) return url === coverExistingUrl;
    return index === 0;
  };

  const isNewFileCover = (index: number) => {
    if (newCoverIndex != null) return newCoverIndex === index;
    if (existingUrls.length === 0 && coverExistingUrl == null) return index === 0;
    return false;
  };

  return {
    imageFiles,
    existingUrls,
    newPreviews,
    newCoverIndex,
    coverExistingUrl,
    handleFileChange,
    handleDropFiles,
    removeNewFile,
    removeExistingUrl,
    setAsCoverExisting,
    setNewFileAsCover,
    isExistingCover,
    isNewFileCover,
  };
}
