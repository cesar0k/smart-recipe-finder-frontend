import { Skeleton } from "@/components/ui/skeleton";

/** Matches the layout of PublicProfilePage's profile header (avatar + name + stats). */
export function ProfileHeaderSkeleton() {
  return (
    <div className="flex flex-col items-center text-center mb-6 space-y-2">
      <Skeleton className="w-20 h-20 rounded-full" />
      <div className="space-y-2 flex flex-col items-center">
        <Skeleton className="h-7 w-40 rounded-full" />
        <Skeleton className="h-4 w-24 rounded-full" />
      </div>
      <div className="flex items-center gap-4 pt-1">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-4 w-24 rounded-full" />
      </div>
    </div>
  );
}
