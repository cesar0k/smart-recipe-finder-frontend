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
 * Reuses the same visual pattern used on ProfilePage / PublicProfilePage.
 */
export function UserAvatar({
  src,
  username,
  size = "md",
  className,
}: UserAvatarProps) {
  const base = cn("rounded-full shrink-0", CONTAINER_SIZE[size], className);

  if (src) {
    return (
      <img
        src={src}
        alt={username ?? ""}
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
