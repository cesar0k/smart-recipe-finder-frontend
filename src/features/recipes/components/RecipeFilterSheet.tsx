import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { IngredientTagInput } from "./IngredientTagInput";

interface RecipeFilterSheetProps {
  include: string[];
  exclude: string[];
  onIncludeChange: (val: string[]) => void;
  onExcludeChange: (val: string[]) => void;
}

export function RecipeFilterSheet({
  include,
  exclude,
  onIncludeChange,
  onExcludeChange,
}: RecipeFilterSheetProps) {
  const totalFilters = include.length + exclude.length;

  return (
    <Sheet>
      <SheetTrigger asChild>
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
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-sm p-4">
        <SheetHeader className="text-left px-0 py-2">
          <SheetTitle>Filter Recipes</SheetTitle>
        </SheetHeader>

        <div className="space-y-2">
          {/* Include Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              Include Ingredients
            </h3>
            <p className="text-xs text-gray-500">Recipes MUST contain these:</p>
            <IngredientTagInput
              value={include}
              onChange={onIncludeChange}
              placeholder="e.g. Chicken, Rice"
              variant="default"
            />
          </div>

          <div className="h-px bg-gray-100" />

          {/* Exclude Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              Exclude Ingredients
            </h3>
            <p className="text-xs text-gray-500">
              Recipes MUST NOT contain these:
            </p>
            <IngredientTagInput
              value={exclude}
              onChange={onExcludeChange}
              placeholder="e.g. Onions, Garlic"
              variant="destructive"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
