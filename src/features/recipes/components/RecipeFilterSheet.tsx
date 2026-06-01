import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X as XIcon, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useHistoryBack } from "@/hooks/useHistoryBack";

const MAX_TIME_SLIDER = 180;
const DIFFICULTIES = ["easy", "medium", "hard"] as const;

// Shared layout-animation curve for sibling sections inside the filter
// modal. Slow + ease-out-expo so reflow reads as a glide rather than a
// snap; matches the per-badge `layout` transition we already use for
// cuisine chips and ingredient tags.
const SECTION_LAYOUT_TRANSITION = {
  layout: { duration: 0.36, ease: [0.32, 0.72, 0, 1] as const },
} as const;

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
  /** When true, the trigger button shows a spinner instead of the active-count badge */
  isLoading?: boolean;
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
  isLoading = false,
  onApply,
}: RecipeFilterSheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  // Local pending flag — turns true the instant the modal closes with changes,
  // turns false when the parent's isLoading goes back to false. This way the
  // spinner is visible during the 300ms close-delay too, and never blinks for
  // sub-frame fetches.
  const [localPending, setLocalPending] = useState(false);
  // Hold the latest draft in a ref so handleOpenChange (declared before
  // draft for hook-ordering reasons) can read it without breaking the
  // "no access before declaration" rule. The ref is kept in sync via the
  // assignment a few lines below the draft state.
  const draftRef = useRef<FilterState | null>(null);
  const handleOpenChange = useHistoryBack(open, (nextOpen) => {
    setOpen(nextOpen);
    const current = draftRef.current;
    if (!nextOpen && open && current && filtersDiffer(current, {
      include, exclude, minTime, maxTime,
      difficulty: selectedDifficulty, cuisine: selectedCuisine, hasComments,
    })) {
      const snapshot = current;
      setLocalPending(true);
      setTimeout(() => onApply(snapshot), 300);
    }
  });
  const [cuisineSearch, setCuisineSearch] = useState("");

  // Clear pending once the parent reports a fetch cycle has happened.
  // Tracks whether isLoading has gone true since we started pending.
  // If isLoading goes true then back to false → fetch done → clear pending.
  // If isLoading never goes true within 1500ms (cache hit / no fetch) → clear anyway.
  const sawLoadingRef = useRef(false);
  useEffect(() => {
    if (!localPending) {
      sawLoadingRef.current = false;
      return;
    }
    if (isLoading) {
      sawLoadingRef.current = true;
      return;
    }
    // isLoading is false — either we saw it go true (fetch finished),
    // or it never went true (fast cache hit).
    const delay = sawLoadingRef.current ? 0 : 1500;
    const timer = setTimeout(() => setLocalPending(false), delay);
    return () => clearTimeout(timer);
  }, [localPending, isLoading]);

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
  // Mirror draft into a ref so handleOpenChange (declared above) can read it.
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  // Sync draft from props on the transition from closed → open. Done during
  // render with a tracked prevOpen so the dropdown opens with the latest
  // applied filters (and no cascading-render warning from setState-in-effect).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open && !prevOpen) {
    setPrevOpen(true);
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
  } else if (!open && prevOpen) {
    setPrevOpen(false);
  }


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
          {localPending || isLoading ? (
            // Spinner badge in the same spot as the count — same dimensions to avoid layout shift
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-black text-white flex items-center justify-center rounded-full border border-white">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
            </span>
          ) : (
            activeCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-black text-white text-[10px] flex items-center justify-center rounded-full border border-white">
                {activeCount}
              </span>
            )
          )}
        </Button>
      </DialogTrigger>

      {/* Suppress Radix's default "focus the first tabbable element on
          open" behaviour — otherwise the min-time number input grabs focus
          (and its focus ring) the instant the modal appears, which looks
          like an accidental selection. Filters have no single primary
          field, so opening with nothing focused is the right default. */}
      <DialogScrollContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="px-0 py-0">
          {/* `min-h-7` reserves the height of the Reset button (h-7 = 28px)
              even when the button is absent, so the rest of the modal
              doesn't shift up/down as it mounts and unmounts with the
              filter count. */}
          <div className="flex items-center justify-between gap-2 min-h-7">
            <DialogTitle>{t("filter_title")}</DialogTitle>
            {/* Reset button is conditionally rendered (not opacity-toggled)
                so it leaves the DOM the moment all filters are cleared.
                Previously the button stayed mounted with
                `opacity-0 pointer-events-none` — a long-standing footgun
                where intermediate paints during a layout shift could leave
                it stuck at partial opacity (visible, not clickable). */}
            <AnimatePresence initial={false}>
              {countFilters(draft) > 0 && (
                <motion.div
                  key="reset"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="text-xs text-gray-500 hover:text-gray-900 rounded-full h-7 px-3 mr-8"
                  >
                    {t("filter_reset")}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogHeader>
        <VisuallyHidden>
          <p>{t("filter_title")}</p>
        </VisuallyHidden>

        {/* Note: do NOT wrap this in `<motion.div layout>` to animate the
            modal's overall height. DialogContent is positioned with
            `translate(-50%, -50%)` to stay centred, and framer's layout
            animation measures the wrapper's bounding rect every frame and
            sets a transform that fights with that centring transform —
            producing a visible jump of the whole modal on every height
            change. Per-tag scale-in animations + DialogContent's natural
            `h-auto` are enough; the modal grows smoothly as long as we
            don't impose a layout animation on top of the centring. */}
        {/* Every section below is a motion.div with `layout`. When any one
            of them changes size (e.g. cuisine grows by a row), the sections
            BELOW it slide down smoothly instead of jumping. DialogContent
            itself still snaps to its new h-auto in one frame — there's no
            good way to animate that without breaking its translate-based
            centering — so the modal's outer shell may visibly bump by a
            few pixels, but the content inside reads as continuous. */}
        <div className="space-y-5 pb-5">
          {/* Cooking time range */}
          <motion.div
            layout
            transition={SECTION_LAYOUT_TRANSITION}
            className="space-y-3"
          >
            <h3 className="text-sm font-medium text-gray-900">
              {t("filter_cooking_time")}
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  type="number"
                  min={0}
                  max={MAX_TIME_SLIDER}
                  step={5}
                  placeholder="0"
                  value={sliderMin === 0 ? "" : sliderMin}
                  onChange={(e) => {
                    const val = e.target.value === "" ? 0 : Math.min(Number(e.target.value), sliderMax);
                    setDraft((d) => ({ ...d, minTime: val === 0 ? undefined : val }));
                  }}
                  className="text-center rounded-full px-4"
                />
                <p className="text-xs text-gray-400 text-center mt-1">{t("min_time_label")}</p>
              </div>
              <span className="text-gray-400 shrink-0 mb-5">—</span>
              <div className="flex-1">
                <Input
                  type="number"
                  min={0}
                  max={MAX_TIME_SLIDER}
                  step={5}
                  placeholder={`${MAX_TIME_SLIDER}+`}
                  value={sliderMax === MAX_TIME_SLIDER ? "" : sliderMax}
                  onChange={(e) => {
                    const val = e.target.value === "" ? MAX_TIME_SLIDER : Math.max(Number(e.target.value), sliderMin);
                    setDraft((d) => ({ ...d, maxTime: val === MAX_TIME_SLIDER ? undefined : val }));
                  }}
                  className="text-center rounded-full px-4"
                />
                <p className="text-xs text-gray-400 text-center mt-1">{t("max_time_label")}</p>
              </div>
            </div>
          </motion.div>

          <div className="h-px bg-gray-200" />

          {/* Difficulty */}
          <motion.div
            layout
            transition={SECTION_LAYOUT_TRANSITION}
            className="space-y-3"
          >
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
          </motion.div>

          <div className="h-px bg-gray-200" />

          {/* Cuisine. `layout="position"` (NOT full `layout`): this section
              changes its OWN height when a cuisine row wraps, and full
              layout would counter-scale its children (the h3 heading, the
              rows) on every height change — that's the sub-pixel jitter /
              ghosting. position-only animates just the section's Y as it's
              pushed around by siblings, and leaves size changes instant,
              so the heading stays crisp. The rows inside handle their own
              height animation via their own `layout`. */}
          <motion.div
            layout="position"
            transition={SECTION_LAYOUT_TRANSITION}
            className="space-y-3"
          >
            {/* Plain h3 (no `motion.layout`) — see the include section
                below for why we accept counter-scale on these short
                headings rather than the 1 px jitter motion.layout
                introduced. */}
            <h3 className="text-sm font-medium text-gray-900">
              {t("filter_cuisine")}
            </h3>

            {/* Selected cuisine badges live in a `motion.div layout` so the
                row animates its OWN height when collapsing to zero (the
                last badge is removed) or growing to a new row. Without
                this, the row used to snap from 28 px to 0 in one frame.
                AnimatePresence + `initial={false}` keeps the first mount
                silent so opening the modal doesn't cascade-fade in already-
                applied badges. */}
            <motion.div
              layout
              transition={SECTION_LAYOUT_TRANSITION}
              // `relative` anchors the popLayout exit: when a tag is
              // removed, framer detaches it (position: absolute) for the
              // duration of its fade-out. Without an explicit positioned
              // ancestor it gets pinned to whichever ancestor *is*
              // positioned (Dialog overlay), producing a ghost in a
              // surprising spot — the "Швейцарская" tag that briefly
              // appears below the search input on the screenshot.
              className="relative flex flex-wrap gap-1.5"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {draft.cuisine.map((c) => (
                  <motion.div
                    key={c}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{
                      // Opacity / y animate fast (matches every other
                      // entrance animation in this modal).
                      duration: 0.18,
                      ease: "easeOut",
                      // The layout shift after a badge is removed feels
                      // snappy/hard at the same 180 ms — siblings span more
                      // distance than the fading badge, so they cover more
                      // pixels in the same time. Slow the layout reflow
                      // separately so it reads as a glide.
                      layout: { duration: 0.36, ease: [0.32, 0.72, 0, 1] },
                    }}
                  >
                    <Badge
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
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* The search input gets its own `layout` so it slides into
                its new Y cleanly instead of getting framer's default
                counter-scale "ghost" treatment that other static children
                of a layout-animated parent suffer from. */}
            <motion.div layout transition={SECTION_LAYOUT_TRANSITION}>
              <Input
                placeholder={t("filter_search_cuisine")}
                value={cuisineSearch}
                onChange={(e) => setCuisineSearch(e.target.value)}
                className="rounded-full h-9 px-4 text-sm"
              />
            </motion.div>
            {/* Available cuisines: same layout-row pattern as the
                selected list above. Stays mounted (even when filtered to
                zero) so a cuisine removed from the selected list above
                can animate back IN here, and vice versa. `relative` is
                here for the same reason as on the selected-list row —
                see comment above. */}
            <motion.div
              layout
              transition={SECTION_LAYOUT_TRANSITION}
              className="relative flex flex-wrap gap-1.5"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {filteredCuisines.map((c) => (
                  <motion.button
                    key={c}
                    layout
                    type="button"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{
                      duration: 0.18,
                      ease: "easeOut",
                      layout: { duration: 0.36, ease: [0.32, 0.72, 0, 1] },
                    }}
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
                  </motion.button>
                ))}
              </AnimatePresence>
            </motion.div>
            {filteredCuisines.length === 0 && cuisineSearch && (
              <p className="text-xs text-gray-400">{t("filter_no_cuisines")}</p>
            )}
          </motion.div>

          <div className="h-px bg-gray-200" />

          {/* Include ingredients. `layout="position"` so the section only
              animates its Y as it gets pushed by siblings — it does NOT
              counter-scale its children when IngredientTagInput grows a
              new tag row. That counter-scale was the source of the jitter
              on the heading + description above the input. Plain HTML
              heading/description; the tag list animates its own height. */}
          <motion.div
            layout="position"
            transition={SECTION_LAYOUT_TRANSITION}
            className="space-y-3"
          >
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
          </motion.div>

          <div className="h-px bg-gray-200" />

          {/* Exclude ingredients — same position-only rationale as Include. */}
          <motion.div
            layout="position"
            transition={SECTION_LAYOUT_TRANSITION}
            className="space-y-3"
          >
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
          </motion.div>

          <div className="h-px bg-gray-200" />

          {/* Has comments filter. The motion.div is a wrapper so the
              <label> stays a literal <label> for static a11y lints — they
              don't follow the JSX-as-component indirection and would
              otherwise flag the checkbox as unlabelled. */}
          <motion.div layout transition={SECTION_LAYOUT_TRANSITION}>
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
          </motion.div>
        </div>
      </DialogScrollContent>
    </Dialog>
  );
}
