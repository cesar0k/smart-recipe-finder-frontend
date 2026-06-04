import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, Clock, Star, Heart } from "lucide-react";

export function RecipeCardSkeleton() {
  return (
    <Card className="flex flex-col gap-0 rounded-[24px] border border-gray-100 bg-white shadow-sm p-0">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-[24px] bg-gray-100">
        <Skeleton className="h-full w-full rounded-none" />
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="w-10 h-10 text-gray-200" />
        </div>
      </div>

      <div className="flex flex-col p-4 space-y-2">
        {/* Title (matches RecipeCard's h3 text-lg) */}
        <Skeleton className="h-[1.405rem] w-3/4 rounded-full" />

        {/* Stats row — rating + favorites, mirrors RecipeCard's stats line.
            `h-4` (16px) matches the real row's text-xs line-height so the
            card doesn't shift height by a couple px when the skeleton swaps
            for the real card (measured: skeleton 14px vs card 16px). */}
        <div className="flex items-center gap-3 text-xs h-4">
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-gray-200 fill-current shrink-0" />
            <Skeleton className="h-3 w-5 rounded-full" />
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-gray-200 fill-current shrink-0" />
            <Skeleton className="h-3 w-4 rounded-full" />
          </span>
        </div>

        {/* Chips row — time + difficulty. `h-6` (24px) matches the real
            chips (text-xs + py-1) so the row heights line up exactly. */}
        <div className="flex items-center gap-2">
          <div className="flex items-center h-6 text-gray-500 bg-gray-100 px-2.5 rounded-lg text-xs font-semibold tracking-wide">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-200" />
            <Skeleton className="h-3 w-10 rounded-full" />
          </div>
          <div className="flex items-center h-6 text-gray-500 bg-gray-100 px-2.5 rounded-lg text-xs font-semibold tracking-wide">
            <Skeleton className="h-3 w-14 rounded-full" />
          </div>
        </div>
      </div>
    </Card>
  );
}
