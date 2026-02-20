import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogScrollContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IngredientTagInput } from "./IngredientTagInput";
import { useTranslation } from "react-i18next";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useHistoryBack } from "@/hooks/useHistoryBack";
import { XIcon } from "lucide-react";

interface RecipeFilterSheetProps {
  include: string[];
  exclude: string[];
  onIncludeChange: (val: string[]) => void;
  onExcludeChange: (val: string[]) => void;
  onReset: () => void;
}

export function RecipeFilterSheet({
  include,
  exclude,
  onIncludeChange,
  onExcludeChange,
  onReset,
}: RecipeFilterSheetProps) {
  const { t } = useTranslation();
  const totalFilters = include.length + exclude.length;
  const [open, setOpen] = useState(false);
  const handleOpenChange = useHistoryBack(open, setOpen);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-full relative bg-white border-gray-200 hover:bg-gray-100 h-11 w-11"
        >
          <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          {totalFilters > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-black text-white text-[10px] flex items-center justify-center rounded-full border border-white">
              {totalFilters}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogScrollContent showCloseButton={false}>
        <DialogHeader className="px-0 py-0">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>{t("filter_title")}</DialogTitle>
            <div className="flex items-center gap-1">
              {totalFilters > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  className="text-xs text-gray-500 hover:text-gray-900 rounded-full h-7 px-3"
                >
                  {t("filter_reset")}
                </Button>
              )}
              <DialogClose className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors">
                <XIcon className="size-4" />
                <span className="sr-only">{t("close_btn")}</span>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>
        <VisuallyHidden>
          <p>{t("filter_title")}</p>
        </VisuallyHidden>

        <div className="space-y-2 pb-5">
          {/* Include Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              {t("filter_include_title")}
            </h3>
            <p className="text-xs text-gray-500">
              {t("filter_include_desc")}
            </p>
            <IngredientTagInput
              value={include}
              onChange={onIncludeChange}
              placeholder={t("filter_include_placeholder")}
              variant="default"
            />
          </div>

          <div className="h-px bg-gray-100" />

          {/* Exclude Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              {t("filter_exclude_title")}
            </h3>
            <p className="text-xs text-gray-500">
              {t("filter_exclude_desc")}
            </p>
            <IngredientTagInput
              value={exclude}
              onChange={onExcludeChange}
              placeholder={t("filter_exclude_placeholder")}
              variant="destructive"
            />
          </div>
        </div>
      </DialogScrollContent>
    </Dialog>
  );
}
