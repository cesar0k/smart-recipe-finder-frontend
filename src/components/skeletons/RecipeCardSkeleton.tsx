import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RecipeCardSkeleton() {
  return (
    <Card className="flex flex-col gap-0 rounded-[24px] border border-gray-100 bg-white shadow-sm p-0 h-full">
      
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-[24px] bg-gray-100">
        <Skeleton className="h-full w-full" />
      </div>

      {/* Content */}
      <div className="flex flex-col p-4 space-y-2">
        {/* Title */}
        <Skeleton className="h-[22.5px] w-3/4 rounded-md" />

        {/* Badges */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-lg" />
          <Skeleton className="h-6 w-24 rounded-lg" />
        </div>
      </div>
    </Card>
  );
}