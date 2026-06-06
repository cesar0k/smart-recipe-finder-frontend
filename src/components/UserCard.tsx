import { Link } from "react-router-dom";
import { User, Shield, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { FollowButton } from "@/features/users/components/FollowButton";
import type { PublicUserResponse } from "@/api/model";

interface UserCardProps {
  user: PublicUserResponse;
}

const ROLE_BADGE: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
  admin: {
    icon: <ShieldCheck className="w-3 h-3" />,
    label: "Admin",
    cls: "bg-red-100 text-red-700 border-red-200",
  },
  moderator: {
    icon: <Shield className="w-3 h-3" />,
    label: "Mod",
    cls: "bg-blue-100 text-blue-700 border-blue-200",
  },
};

export function UserCard({ user }: UserCardProps) {
  const { t } = useTranslation();
  const roleBadge = ROLE_BADGE[user.role ?? ""];

  return (
    <div className="flex items-center gap-3 py-3">
      <Link to={`/user/${user.id}`} className="shrink-0">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.username}
            className="w-10 h-10 rounded-full object-cover border border-gray-100"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </Link>

      <Link to={`/user/${user.id}`} className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-gray-900 truncate">
            {user.display_name || user.username}
          </span>
          {user.display_name && (
            <span className="text-xs text-gray-400 truncate">@{user.username}</span>
          )}
          {roleBadge && (
            <Badge variant="outline" className={`text-xs gap-1 px-1.5 py-0 ${roleBadge.cls}`}>
              {roleBadge.icon}
              {roleBadge.label}
            </Badge>
          )}
        </div>
        {typeof user.followers_count === "number" && user.followers_count > 0 && (
          <p className="text-xs text-gray-400 mt-0.5">
            {t("followers_count", { count: user.followers_count })}
          </p>
        )}
      </Link>

      <FollowButton
        userId={user.id}
        isFollowing={user.is_following ?? false}
        className="shrink-0"
      />
    </div>
  );
}
