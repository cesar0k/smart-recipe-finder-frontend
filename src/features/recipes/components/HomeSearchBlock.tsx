import { useState, useEffect, memo } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AnimatedWidth } from "@/components/ui/animated-width";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RecipeFilterSheet } from "./RecipeFilterSheet";
import { RecipeSortMenu, type RecipeSort } from "./RecipeSortMenu";
import { useTranslation } from "react-i18next";

interface HomeSearchBlockProps {
  /** The committed search query (from URL) */
  submittedSearch: string;
  heading: string;
  isSearchView: boolean;
  sort: RecipeSort;
  setSort: (v: RecipeSort) => void;
  includeIngredients: string[];
  excludeIngredients: string[];
  minTime: number | undefined;
  maxTime: number | undefined;
  selectedDifficulty: string[];
  selectedCuisine: string[];
  hasComments: boolean;
  applyAllFilters: (filters: {
    include: string[];
    exclude: string[];
    minTime: number | undefined;
    maxTime: number | undefined;
    difficulty: string[];
    cuisine: string[];
    hasComments?: boolean;
  }) => void;
  onSearch: (term: string) => void;
  onClear: () => void;
}

export const HomeSearchBlock = memo(function HomeSearchBlock({
  submittedSearch,
  heading,
  isSearchView,
  sort,
  setSort,
  includeIngredients,
  excludeIngredients,
  minTime,
  maxTime,
  selectedDifficulty,
  selectedCuisine,
  hasComments,
  applyAllFilters,
  onSearch,
  onClear,
}: HomeSearchBlockProps) {
  const { t } = useTranslation();

  // searchTerm lives here — changes don't re-render the parent HomePage
  const [searchTerm, setSearchTerm] = useState(submittedSearch);

  // Keep local state in sync when URL query changes (e.g. browser back)
  useEffect(() => {
    setSearchTerm(submittedSearch);
  }, [submittedSearch]);

  const handleSearch = () => {
    onSearch(searchTerm.trim());
  };

  const handleClear = () => {
    setSearchTerm("");
    onClear();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="max-w-4xl mx-auto text-center mb-12 space-y-6">
      <h1 className="text-2xl md:text-5xl font-extrabold text-gray-900 tracking-tight w-full md:line-clamp-1 break-words">
        {heading}
      </h1>

      <div className="flex flex-col gap-2 w-full max-w-xl mx-auto">
        {/* Search input row */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center flex-1 min-w-0">
            <Search className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none" />

            <Input
              placeholder={t("hero_search_placeholder")}
              className="pl-12 pr-24 h-14 text-base md:text-lg rounded-full border-gray-200 shadow-sm focus:border-gray-400 focus:ring-0 transition-all hover:border-gray-300 hover:shadow-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={onKeyDown}
            />

            <div className="absolute right-2 flex items-center gap-1">
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="h-10 w-10 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
              <Button
                size="icon"
                onClick={handleSearch}
                className="h-10 w-10 rounded-full bg-black text-white hover:bg-gray-800 shadow-md"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Filter + Sort — inline on desktop */}
          <div className="hidden md:flex items-center gap-3">
            <RecipeFilterSheet
              include={includeIngredients}
              exclude={excludeIngredients}
              minTime={minTime}
              maxTime={maxTime}
              selectedDifficulty={selectedDifficulty}
              selectedCuisine={selectedCuisine}
              hasComments={hasComments}
              onApply={applyAllFilters}
            />
            <AnimatedWidth open={isSearchView}>
              <RecipeSortMenu value={sort} onChange={setSort} />
            </AnimatedWidth>
          </div>
        </div>

        {/* Filter + Sort on mobile — below search input */}
        {/* PADDING NOTE: change pr-[6px] here to adjust filter button alignment */}
        <div className="flex md:hidden items-center gap-2 justify-end pr-[6px]">
          <AnimatePresence>
            {isSearchView && (
              <motion.div
                key="mobile-sort"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <RecipeSortMenu value={sort} onChange={setSort} compact className="h-11 w-11" />
              </motion.div>
            )}
          </AnimatePresence>
          <RecipeFilterSheet
            include={includeIngredients}
            exclude={excludeIngredients}
            minTime={minTime}
            maxTime={maxTime}
            selectedDifficulty={selectedDifficulty}
            selectedCuisine={selectedCuisine}
            hasComments={hasComments}
            onApply={applyAllFilters}
          />
        </div>
      </div>
    </div>
  );
});
