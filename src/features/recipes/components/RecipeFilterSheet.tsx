import { useState, useEffect } from "react";
import { SlidersHorizontal, X as XIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogScrollContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IngredientTagInput } from "./IngredientTagInput";
import { useTranslation } from "react-i18next";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useGetCuisines } from "@/api/recipes/recipes";
import { getDifficultyKey } from "@/lib/utils";

const MAX_TIME_SLIDER = 180;
const DIFFICULTIES = ["easy", "medium", "hard"] as const;

interface FilterState {
  include: string[];
  exclude: string[];
  minTime: number | undefined;
  maxTime: number | undefined;
  difficulty: string[];
  cuisine: string[];
  hasComments: boolean;
}

interface RecipeFilterSheetProps {
  /** Current applied values (from URL) — used to init draft on open */
  include: string[];
  exclude: string[];
  minTime: number | undefined;
  maxTime: number | undefined;
  selectedDifficulty: string[];
  selectedCuisine: string[];
  hasComments?: boolean;
  /** Called once with all filter values when the dialog closes */
  onApply: (filters: FilterState) => void;
}

function countFilters(f: FilterState): number {
  return (
    f.include.length +
    f.exclude.length +
    (f.minTime !== undefined ? 1 : 0) +
    (f.maxTime !== undefined ? 1 : 0) +
    f.difficulty.length +
    f.cuisine.length +
    (f.hasComments ? 1 : 0)
  );
}

const sameArr = (a: string[], b: string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

function filtersDiffer(a: FilterState, b: FilterState): boolean {
  return (
    !sameArr(a.include, b.include) ||
    !sameArr(a.exclude, b.exclude) ||
    a.minTime !== b.minTime ||
    a.maxTime !== b.maxTime ||
    !sameArr(a.difficulty, b.difficulty) ||
    !sameArr(a.cuisine, b.cuisine) ||
    a.hasComments !== b.hasComments
  );
}

export function RecipeFilterSheet({
  include,
  exclude,
  minTime,
  maxTime,
  selectedDifficulty,
  selectedCuisine,
  hasComments = false,
  onApply,
}: RecipeFilterSheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [cuisineSearch, setCuisineSearch] = useState("");

  // --- Local draft state (only applied on close) ---
  const [draft, setDraft] = useState<FilterState>({
    include,
    exclude,
    minTime,
    maxTime,
    difficulty: selectedDifficulty,
    cuisine: selectedCuisine,
    hasComments,
  });

  // Sync draft from props when dialog opens
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft({
        include,
        exclude,
        minTime,
        maxTime,
        difficulty: selectedDifficulty,
        cuisine: selectedCuisine,
        hasComments,
      });
      setCuisineSearch("");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply draft to parent AFTER Radix's exit animation finishes, and
  // skip the call entirely when nothing changed — otherwise
  // `setSearchParams` triggers a parent re-render mid-animation and the
  // dialog briefly re-flashes even though the URL stayed the same.
  // 300 ms covers Radix's 200 ms baseline plus headroom for throttled
  // CPUs.
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen && open && filtersDiffer(draft, {
      include, exclude, minTime, maxTime,
      difficulty: selectedDifficulty, cuisine: selectedCuisine, hasComments,
    })) {
      const snapshot = draft;
      setTimeout(() => onApply(snapshot), 300);
    }
  };

  const handleReset = () => {
    const empty: FilterState = {
      include: [],
      exclude: [],
      minTime: undefined,
      maxTime: undefined,
      difficulty: [],
      cuisine: [],
      hasComments: false,
    };
    setDraft(empty);
  };

  // Badge count: from draft while open, from props while closed
  const activeCount = open
    ? countFilters(draft)
    : countFilters({
        include,
        exclude,
        minTime,
        maxTime,
        difficulty: selectedDifficulty,
        cuisine: selectedCuisine,
        hasComments,
      });

  const { data: allCuisines = [] } = useGetCuisines({
    query: { staleTime: 5 * 60 * 1000 },
  });

  const filteredCuisines = cuisineSearch
    ? allCuisines.filter(
        (c) =>
          c.toLowerCase().includes(cuisineSearch.toLowerCase()) &&
          !draft.cuisine.includes(c),
      )
    : allCuisines.filter((c) => !draft.cuisine.includes(c));

  const sliderMin = draft.minTime ?? 0;
  const sliderMax = draft.maxTime ?? MAX_TIME_SLIDER;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-full relative bg-white border-gray-200 hover:bg-gray-100 h-11 w-11"
        >
          <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-black text-white text-[10px] flex items-center justify-center rounded-full border border-white">
              {activeCount}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogScrollContent showCloseButton={false}>
        <DialogHeader className="px-0 py-0">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>{t("filter_title")}</DialogTitle>
            <div className="flex items-center gap-1">
              {countFilters(draft) > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-xs text-gray-500 hover:text-gray-900 rounded-full h-7 px-3"
                >
                  {t("filter_reset")}
                </Button>
              )}
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
              >
                <XIcon className="size-4" />
                <span className="sr-only">{t("close_btn")}</span>
              </button>
            </div>
          </div>
        </DialogHeader>
        <VisuallyHidden>
          <p>{t("filter_title")}</p>
        </VisuallyHidden>

        <div className="space-y-5 pb-5">
          {/* Cooking time range */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              {t("filter_cooking_time")}
            </h3>
            <Slider
              value={[sliderMin, sliderMax]}
              min={0}
              max={MAX_TIME_SLIDER}
              step={5}
              onValueChange={([min, max]) => {
                setDraft((d) => ({
                  ...d,
                  minTime: min === 0 ? undefined : min,
                  maxTime: max === MAX_TIME_SLIDER ? undefined : max,
                }));
              }}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{sliderMin} {t("min")}</span>
              <span>
                {sliderMax === MAX_TIME_SLIDER
                  ? `${MAX_TIME_SLIDER}+ ${t("min")}`
                  : `${sliderMax} ${t("min")}`}
              </span>
            </div>
          </div>

          <div className="h-px bg-gray-200" />

          {/* Difficulty */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              {t("filter_difficulty")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => {
                const isSelected = draft.difficulty.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        difficulty: isSelected
                          ? prev.difficulty.filter((x) => x !== d)
                          : [...prev.difficulty, d],
                      }))
                    }
                    // transition-[width] (auto ↔ auto) is animated because
                    // `interpolate-size: allow-keywords` is set globally in
                    // index.css. The chip grows / shrinks smoothly when the
                    // Check icon is added or removed.
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-[width,background-color,color] duration-200 ease-out ${
                      isSelected
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {/* Checkmark gets a fixed width with overflow-hidden so
                        its appearance + the trailing gap fold smoothly into
                        the chip width animation. */}
                    <span
                      className={`inline-flex items-center overflow-hidden transition-[width,margin] duration-200 ease-out ${
                        isSelected ? "w-3.5 mr-1.5" : "w-0 mr-0"
                      }`}
                      aria-hidden="true"
                    >
                      <Check className="w-3.5 h-3.5 shrink-0" />
                    </span>
                    {t(getDifficultyKey(d))}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-gray-200" />

          {/* Cuisine */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              {t("filter_cuisine")}
            </h3>

            {draft.cuisine.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {draft.cuisine.map((c) => (
                  <Badge
                    key={c}
                    variant="secondary"
                    className="gap-1 cursor-pointer hover:bg-gray-200 pr-1.5"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        cuisine: prev.cuisine.filter((x) => x !== c),
                      }))
                    }
                  >
                    {c}
                    <XIcon className="w-3 h-3" />
                  </Badge>
                ))}
              </div>
            )}

            <Input
              placeholder={t("filter_search_cuisine")}
              value={cuisineSearch}
              onChange={(e) => setCuisineSearch(e.target.value)}
              className="rounded-full h-9 px-4 text-sm"
            />
            {filteredCuisines.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {filteredCuisines.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setDraft((prev) => ({
                        ...prev,
                        cuisine: [...prev.cuisine, c],
                      }));
                      setCuisineSearch("");
                    }}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            {filteredCuisines.length === 0 && cuisineSearch && (
              <p className="text-xs text-gray-400">{t("filter_no_cuisines")}</p>
            )}
          </div>

          <div className="h-px bg-gray-200" />

          {/* Include ingredients */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              {t("filter_include_title")}
            </h3>
            <p className="text-xs text-gray-500">
              {t("filter_include_desc")}
            </p>
            <IngredientTagInput
              value={draft.include}
              onChange={(val) => setDraft((d) => ({ ...d, include: val }))}
              placeholder={t("filter_include_placeholder")}
              variant="default"
            />
          </div>

          <div className="h-px bg-gray-200" />

          {/* Exclude ingredients */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              {t("filter_exclude_title")}
            </h3>
            <p className="text-xs text-gray-500">
              {t("filter_exclude_desc")}
            </p>
            <IngredientTagInput
              value={draft.exclude}
              onChange={(val) => setDraft((d) => ({ ...d, exclude: val }))}
              placeholder={t("filter_exclude_placeholder")}
              variant="destructive"
            />
          </div>

          <div className="h-px bg-gray-200" />

          {/* Has comments filter */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={draft.hasComments}
              onChange={(e) =>
                setDraft((d) => ({ ...d, hasComments: e.target.checked }))
              }
              className="w-4 h-4 rounded accent-gray-900 cursor-pointer"
            />
            <span className="text-sm text-gray-700">{t("filter_has_comments")}</span>
          </label>
        </div>
      </DialogScrollContent>
    </Dialog>
  );
}
