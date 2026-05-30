import { useEffect, useRef, useState } from "react";
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
  className?: string;
}

const OPTIONS: { value: RecipeSort; labelKey: string }[] = [
  { value: "newest", labelKey: "sort_newest" },
  { value: "popular", labelKey: "sort_popular" },
  { value: "top_rated", labelKey: "sort_top_rated" },
  { value: "most_favorited", labelKey: "sort_most_favorited" },
];

// Hold the displayed label one full close cycle (Radix exit ≈ 150 ms +
// the AnimatePresence label swap ≈ 200 ms) after `value` actually changes.
// Reason: when the user picks a new option, value flips immediately, but
// the dropdown panel is still mid-exit. Changing the trigger label
// synchronously shrinks the button's intrinsic width (because the
// invisible sizer below tracks the live label), AnimatedWidth animates
// the wrapper to the new width, Radix's Floating UI re-anchors the still-
// mounted panel to the moving trigger, and the panel visibly slides
// across the screen on its way out. Delaying the label swap until after
// the panel has unmounted keeps the trigger geometry stable while the
// dropdown is closing, so there is nothing for Radix to chase.
const LABEL_LATCH_MS = 220;

export function RecipeSortMenu({
  value,
  onChange,
  compact = false,
  className,
}: RecipeSortMenuProps) {
  const { t } = useTranslation();
  const [displayedValue, setDisplayedValue] = useState<RecipeSort>(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value === displayedValue) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDisplayedValue(value);
      timerRef.current = null;
    }, LABEL_LATCH_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, displayedValue]);

  // Active item in the OPEN dropdown should reflect the LIVE value (so the
  // checkmark moves the instant the user picks), but the trigger label and
  // its width should follow `displayedValue` to keep the close animation
  // glitch-free — see LABEL_LATCH_MS above.
  const current = OPTIONS.find((o) => o.value === displayedValue) ?? OPTIONS[0]!;
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
            "rounded-full gap-2",
            className
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
                  key={displayedValue}
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
