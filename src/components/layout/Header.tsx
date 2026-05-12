import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChefHat,
  Heart,
  LogIn,
  LogOut,
  Settings,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";
import { NotificationPanel } from "@/components/NotificationPanel";
import { useGetPendingCount } from "@/api/moderation/moderation";
import { useNotificationWS } from "@/hooks/useNotificationWS";
import { UserSearchInput } from "@/components/UserSearchInput";
import type { ReactNode } from "react";

interface HeaderProps {
  leftContent?: ReactNode;
  rightContent?: ReactNode;
}

export function Header({ leftContent, rightContent }: HeaderProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  // WebSocket for real-time notifications
  useNotificationWS();

  const { data: pendingCount } = useGetPendingCount({
    query: {
      enabled: hasRole("moderator", "admin"),
      refetchInterval: 30_000,
    },
  });

  const totalPending =
    (pendingCount?.recipes ?? 0) + (pendingCount?.drafts ?? 0);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <header className="border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-md z-20">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {leftContent ?? (
          <Link
            to="/"
            className="group flex items-center gap-0 hover:gap-2 transition-all duration-300 cursor-pointer"
          >
            <div className="w-0 group-hover:w-7 h-7 overflow-hidden transition-all duration-300 opacity-0 group-hover:opacity-100">
              <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
                <ChefHat className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <span className="font-bold text-xl tracking-tighter text-gray-900">
              {t("app_name")}
            </span>
          </Link>
        )}
        <div className="flex items-center gap-3">
          {rightContent}

          <UserSearchInput />

          {isAuthenticated ? (
            <>
              <NotificationPanel />
              <LanguageSwitcher />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full p-0 overflow-hidden"
                  >
                    <UserAvatar
                      src={user?.avatar_url}
                      username={user?.username}
                      size="sm"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-2xl">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="rounded-full"
                    onClick={() => navigate(`/user/${user?.id}`)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    {t("profile_my_link")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-full"
                    onClick={() => navigate("/favorites")}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    {t("my_favorites_link")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-full"
                    onClick={() => navigate("/profile")}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {t("profile_settings_link")}
                  </DropdownMenuItem>
                  {hasRole("moderator", "admin") && (
                    <DropdownMenuItem
                      className="rounded-full"
                      onClick={() => navigate("/moderation")}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {t("moderation_link")}
                      {totalPending > 0 && (
                        <span className="ml-auto bg-red-100 text-red-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                          {totalPending}
                        </span>
                      )}
                    </DropdownMenuItem>
                  )}
                  {hasRole("admin") && (
                    <DropdownMenuItem
                      className="rounded-full"
                      onClick={() => navigate("/admin")}
                    >
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      {t("admin_link")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="rounded-full text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("logout_btn")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <LanguageSwitcher />
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full gap-2 text-gray-600 hover:text-black"
                onClick={() => navigate("/login")}
              >
                <LogIn className="w-4 h-4" />
                {t("login_btn")}
              </Button>
            </>
          )}

        </div>
      </div>
    </header>
  );
}
