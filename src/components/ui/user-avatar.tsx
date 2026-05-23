import { useState } from "react";
import { User } from "lucide-react";

import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  username?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const CONTAINER_SIZE = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-20 h-20",
} as const;

const ICON_SIZE = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-9 h-9",
} as const;

/**
 * Unified user avatar with:
 *   - fallback to a generic user icon on load failure / when src is empty
 *   - shimmer skeleton while the image is loading (replaces the raw browser
 *     "broken image" placeholder)
 */
export function UserAvatar({
  src,
  username,
  size = "md",
  className,
}: UserAvatarProps) {
  const base = cn("rounded-full shrink-0", CONTAINER_SIZE[size], className);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Reset loaded state when src changes so the skeleton shows for the new
  // image. Done during render via a tracked previous-src — keeps ESLint's
  // set-state-in-effect rule happy and avoids an extra paint of stale state.
  const [prevSrc, setPrevSrc] = useState(src);
  if (prevSrc !== src) {
    setPrevSrc(src);
    setLoaded(false);
  }

  if (src && failedSrc !== src) {
    return (
      <div className={cn(base, "relative overflow-hidden")}>
        {!loaded && (
          // Shimmer skeleton overlay — visible until the <img> reports load.
          // Uses the global [data-slot="skeleton"] animation defined in index.css.
          <div
            data-slot="skeleton"
            className={cn("absolute inset-0 rounded-full")}
          />
        )}
        <img
          src={src}
          alt={username ?? ""}
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setFailedSrc(src)}
          className={cn(
            "w-full h-full object-cover rounded-full border border-gray-100 transition-opacity duration-150",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
    );
  }

  return (
    <div className={cn(base, "bg-gray-100 flex items-center justify-center")}>
      <User className={cn(ICON_SIZE[size], "text-gray-400")} />
    </div>
  );
}
