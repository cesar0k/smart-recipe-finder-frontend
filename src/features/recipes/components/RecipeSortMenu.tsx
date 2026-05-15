import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownUp, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type RecipeSort = "newest" | "popular" | "top_rated" | "most_favorited";

interface RecipeSortMenuProps {
  value: RecipeSort;
  onChange: (next: RecipeSort) => void;
  /** When true, hide the option label and only show the icon (mobile-tight). */
  compact?: boolean;
}

const OPTIONS: { value: RecipeSort; labelKey: string }[] = [
  { value: "newest", labelKey: "sort_newest" },
  { value: "popular", labelKey: "sort_popular" },
  { value: "top_rated", labelKey: "sort_top_rated" },
  { value: "most_favorited", labelKey: "sort_most_favorited" },
];

export function RecipeSortMenu({
  value,
  onChange,
  compact = false,
}: RecipeSortMenuProps) {
  const { t } = useTranslation();
  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0]!;
  const labelText = t(current.labelKey);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("sort_label")}
          title={t("sort_label")}
          className={cn(
            buttonVariants({ variant: "outline", size: compact ? "icon" : "default" }),
            "rounded-full gap-2"
          )}
        >
          <ArrowDownUp className="w-4 h-4 shrink-0" />
          {!compact && (
            <span className="relative inline-flex items-center text-sm font-medium leading-none h-[1em]">
              {/* Invisible sizer keeps the local width tied to the current label. */}
              <span className="invisible whitespace-nowrap" aria-hidden="true">
                {labelText}
              </span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={value}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute inset-0 inline-flex items-center whitespace-nowrap"
                >
                  {labelText}
                </motion.span>
              </AnimatePresence>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-2xl">
        {OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            className="rounded-full"
            onClick={() => onChange(opt.value)}
          >
            <span className="flex-1">{t(opt.labelKey)}</span>
            {opt.value === value && (
              <Check className="w-4 h-4 text-gray-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
