import { useMemo } from "react";
import { type UseFormReturn } from "react-hook-form";
import { type RecipeFormValues } from "../types/schema";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

// One object-URL per File, keyed by the File object itself. A module-level
// WeakMap (not a component ref) means: reading it during render is fine
// (it isn't React state), the SAME File always maps to the SAME URL across
// re-renders — so removing one photo never re-mints URLs for the survivors,
// which is what caused their <img> to reload and flash white — and entries
// are garbage-collected automatically once a File is no longer referenced,
// so there's nothing to revoke manually.
const fileUrlCache = new WeakMap<File, string>();

function urlForFile(file: File): string {
  let url = fileUrlCache.get(file);
  if (!url) {
    url = URL.createObjectURL(file);
    fileUrlCache.set(file, url);
  }
  return url;
}

export function useRecipeImageManager(form: UseFormReturn<RecipeFormValues>) {
  const { getValues, setValue, watch } = form;
  const { t } = useTranslation();

  const imageFiles = watch("imageFiles");
  const existingUrls = watch("image_urls") || [];
  const newCoverIndex = watch("newCoverIndex");
  const coverExistingUrl = watch("coverExistingUrl");

  // Each preview carries a stable `key` derived from the File's identity
  // (name + size + lastModified), not its array index — AnimatePresence /
  // framer `layout` need a key that survives reordering so a removed photo
  // animates out and its neighbours animate into place. The url comes from
  // the per-File cache above, so survivors keep a byte-stable src.
  const newPreviews = useMemo(() => {
    if (!imageFiles) return [];
    return imageFiles.map((file) => ({
      url: urlForFile(file),
      key: `${file.name}-${file.size}-${file.lastModified}`,
    }));
  }, [imageFiles]);

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
