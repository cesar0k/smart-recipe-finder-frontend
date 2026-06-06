import { Skeleton } from "@/components/ui/skeleton";

interface ProfileHeaderSkeletonProps {
  /** Own profile shows no Follow button, so its placeholder is omitted. */
  isOwnProfile?: boolean;
}

/**
 * Mirrors the layout of PublicProfilePage's profile header so the transition
 * from skeleton to real content does not visibly shift. Keep in sync with the
 * `{profile && ...}` header block in PublicProfilePage:
 *   avatar (w-20 h-20) → name block (name + @username) → 3-item stats row
 *   (joined / recipes / followers) → Follow button (other users only).
 */
export function ProfileHeaderSkeleton({ isOwnProfile = false }: ProfileHeaderSkeletonProps) {
  return (
    <div className="flex flex-col items-center text-center mb-6 space-y-2">
      {/* Avatar */}
      <Skeleton className="w-20 h-20 rounded-full" />

      {/* Name + @username */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-40 rounded-full" />
        <Skeleton className="h-4 w-24 rounded-full mx-auto" />
      </div>

      {/* Stats row: joined date · recipe count · followers (3 items, like real) */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-4 w-24 rounded-full" />
      </div>

      {/* Follow button — only present on other users' profiles */}
      {!isOwnProfile && (
        <div className="pt-1">
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      )}
    </div>
  );
}
