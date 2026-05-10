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
 * Unified user avatar with fallback to a generic user icon.
 *
 * If the image fails to load (e.g. a legacy Google CDN URL stored on a
 * user before the backfill ran, or any third-party source blocked by
 * client-side filters) we silently fall back to the icon variant.
 * `referrerPolicy="no-referrer"` reduces the chance Google's CDN refuses
 * the request because of the origin Referer header.
 */
export function UserAvatar({
  src,
  username,
  size = "md",
  className,
}: UserAvatarProps) {
  const base = cn("rounded-full shrink-0", CONTAINER_SIZE[size], className);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (src && failedSrc !== src) {
    return (
      <img
        src={src}
        alt={username ?? ""}
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(src)}
        className={cn(base, "object-cover border border-gray-100")}
      />
    );
  }

  return (
    <div className={cn(base, "bg-gray-100 flex items-center justify-center")}>
      <User className={cn(ICON_SIZE[size], "text-gray-400")} />
    </div>
  );
}
