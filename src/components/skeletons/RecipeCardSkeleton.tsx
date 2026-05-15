import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, Clock } from "lucide-react";

export function RecipeCardSkeleton() {
  return (
    <Card className="flex flex-col gap-0 rounded-[24px] border border-gray-200 bg-white shadow-sm p-0">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-[24px] bg-gray-100">
        <Skeleton className="h-full w-full rounded-none" />
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="w-10 h-10 text-gray-200" />
        </div>
      </div>

      <div className="flex flex-col p-4 space-y-2">
        <Skeleton className="h-[1.405rem] w-3/4 rounded-full" />

        <div className="flex items-center gap-2">
          <div className="flex items-center text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-200" />
            <Skeleton className="h-3 w-10 rounded-full" />
          </div>
          <div className="flex items-center text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide">
            <Skeleton className="h-3 w-14 rounded-full" />
          </div>
        </div>
      </div>
    </Card>
  );
}
