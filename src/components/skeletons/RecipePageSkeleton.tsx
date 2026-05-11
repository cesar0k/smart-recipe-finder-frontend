import { Skeleton } from "@/components/ui/skeleton";

/** Matches the layout of RecipePage (gallery + header + ingredients + instructions). */
export function RecipePageSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
      {/* Left: gallery + ingredients */}
      <div className="space-y-8">
        <Skeleton className="aspect-[4/3] w-full rounded-[2rem]" />

        {/* Mobile header placeholder */}
        <div className="lg:hidden space-y-4">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-12 w-3/4 rounded-full" />
          <Skeleton className="h-4 w-2/3 rounded-full" />
        </div>

        <div className="bg-gray-50 rounded-[2rem] p-8 space-y-4">
          <Skeleton className="h-7 w-40 rounded-full" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-200 shrink-0" />
              <Skeleton className="h-5 w-2/3 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Right: header (desktop) + instructions */}
      <div className="space-y-8">
        <div className="hidden lg:block space-y-4">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-12 w-3/4 rounded-full" />
          <Skeleton className="h-4 w-2/3 rounded-full" />
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        </div>

        <div className="hidden lg:block h-px bg-gray-100" />

        <div className="space-y-6">
          <Skeleton className="h-8 w-40 rounded-full" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
