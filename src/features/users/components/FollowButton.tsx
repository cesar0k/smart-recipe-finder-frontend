import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import { useFollowUser, useUnfollowUser } from "@/api/follows/follows";
import { getGetUserProfileQueryKey } from "@/api/users/users";
import type { PublicUserResponse } from "@/api/model";

interface FollowButtonProps {
  userId: number;
  isFollowing: boolean;
  className?: string;
}

export function FollowButton({ userId, isFollowing, className }: FollowButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const { mutate: follow, isPending: following } = useFollowUser();
  const { mutate: unfollow, isPending: unfollowing } = useUnfollowUser();
  const isPending = following || unfollowing;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (user?.id === userId) return null;

  const updateProfileCache = (patch: Partial<PublicUserResponse>) => {
    queryClient.setQueryData(
      getGetUserProfileQueryKey(userId),
      (old: PublicUserResponse | undefined) => (old ? { ...old, ...patch } : old),
    );
  };

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info(t("login_to_follow"));
      navigate("/login");
      return;
    }
    if (isPending) return;

    const cached = queryClient.getQueryData<PublicUserResponse>(
      getGetUserProfileQueryKey(userId),
    );
    const currentCount = cached?.followers_count ?? 0;

    // Optimistic update fires immediately on every click
    updateProfileCache({
      is_following: !isFollowing,
      followers_count: currentCount + (isFollowing ? -1 : 1),
    });

    // Debounce the actual network request — only the last click within 400ms fires
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;

      // Read the final optimistic state from cache to decide what to send
      const final = queryClient.getQueryData<PublicUserResponse>(
        getGetUserProfileQueryKey(userId),
      );
      const finalFollowing = final?.is_following ?? !isFollowing;
      const rollback = () => {
        updateProfileCache({ is_following: isFollowing, followers_count: currentCount });
        toast.error(t("follow_error"));
      };

      if (finalFollowing) {
        follow({ userId }, {
          onSuccess: (profile) => {
            updateProfileCache({ is_following: true, followers_count: profile.followers_count });
            toast.success(t("followed_toast"));
          },
          onError: rollback,
        });
      } else {
        unfollow({ userId }, {
          onSuccess: (profile) => {
            updateProfileCache({ is_following: false, followers_count: profile.followers_count });
            toast.success(t("unfollowed_toast"));
          },
          onError: rollback,
        });
      }
    }, 400);
  };

  const label = t("follow_btn");

  return (
    <motion.button
        type="button"
        onClick={onClick}
        disabled={isPending}
        aria-pressed={isFollowing}
        aria-label={isFollowing ? t("unfollow_btn") : label}
        initial={false}
        animate={{
          backgroundColor: isFollowing ? "rgb(17, 24, 39)" : "rgba(255,255,255,0)",
          borderColor: isFollowing ? "rgb(17, 24, 39)" : "rgb(229,231,235)",
          color: isFollowing ? "#ffffff" : "rgb(17,24,39)",
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium h-9 rounded-full border outline-none disabled:opacity-100 disabled:pointer-events-none focus-visible:ring-ring/50 focus-visible:ring-[3px] [&_svg]:pointer-events-none [&_svg]:shrink-0 shadow-xs",
          isFollowing ? "px-3" : "px-4 gap-2",
          isFollowing ? "hover:!bg-gray-800 hover:!border-gray-800" : "hover:bg-accent",
          className,
        )}
      >
        <motion.span
          className="inline-flex shrink-0"
          animate={{ scale: isFollowing ? 1.1 : 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {isFollowing
            ? <UserCheck className="w-4 h-4" />
            : <UserPlus className="w-4 h-4" />}
        </motion.span>

        {/* Text only shown when not following.
            max-width animates the physical space; opacity cross-fades the text.
            AnimatedWidth is not used for the outer wrapper here — this span
            IS the width driver, so no double-animation conflict. */}
        <AnimatePresence initial={false}>
          {!isFollowing && (
            <motion.span
              key="text"
              initial={{ maxWidth: 0, opacity: 0 }}
              animate={{ maxWidth: 120, opacity: 1 }}
              exit={{ maxWidth: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden whitespace-nowrap"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
    </motion.button>
  );
}
