import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChefHat,
  Heart,
  LogIn,
  LogOut,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  User,
  X,
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
import { UserSearchInput, type UserSearchInputHandle } from "@/components/UserSearchInput";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

interface HeaderProps {
  leftContent?: ReactNode;
  rightContent?: ReactNode;
}

export function Header({ leftContent, rightContent }: HeaderProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchRef = useRef<UserSearchInputHandle>(null);

  // Focus input when search opens (without remounting)
  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileSearchRef.current?.focus(), 50);
    } else {
      mobileSearchRef.current?.clear();
    }
  }, [mobileSearchOpen]);

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
    <header className="border-b border-gray-300 sticky top-0 bg-white/80 backdrop-blur-md z-30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-2">
        {/* On desktop: always show logo. On mobile: logo OR search (animated swap) */}
        <div className="hidden md:block shrink-0">
          {leftContent ?? (
            <Link to="/" className="group flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 transition-transform duration-300 group-hover:scale-110">
                <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
                  <ChefHat className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <span className="font-bold text-xl tracking-tighter text-gray-900">{t("app_name")}</span>
            </Link>
          )}
        </div>

        {/*
          MOBILE LAYOUT:
          - Two absolute-positioned layers stacked via `inset-0` on mobile only
          - Layer 1 (default): logo left + buttons right — fades out when search opens
          - Layer 2 (search): full-width search input — fades in when search opens
          - Using absolute positioning avoids the flex-width glitch entirely
        */}

        {/* MOBILE Layer 1: normal header content */}
        <div
          className={`md:hidden absolute inset-x-4 flex items-center justify-between transition-opacity duration-200 ${
            mobileSearchOpen ? "opacity-0 pointer-events-none" : "opacity-100 delay-[0ms]"
          }`}
        >
          {/* Logo */}
          <div className="shrink-0">
            {leftContent ?? (
              <Link to="/" className="group flex items-center cursor-pointer">
                <div className="w-9 h-9 transition-transform duration-300 group-hover:scale-110">
                  <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
                    <ChefHat className="w-5 h-5 text-white" />
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Right buttons */}
          <div className="flex items-center gap-2">
            {rightContent}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-gray-500"
              onClick={() => setMobileSearchOpen(true)}
              aria-label={t("user_search_placeholder")}
            >
              <Search className="w-4 h-4" />
            </Button>
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full p-0 overflow-hidden">
                    <UserAvatar src={user?.avatar_url} username={user?.username} size="sm" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-2xl">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.username}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="rounded-full" onClick={() => navigate("/profile")}>
                    <Settings className="w-4 h-4 mr-2" />{t("profile_settings_link")}
                  </DropdownMenuItem>
                  {hasRole("moderator", "admin") && (
                    <DropdownMenuItem className="rounded-full" onClick={() => navigate("/moderation")}>
                      <Shield className="w-4 h-4 mr-2" />{t("moderation_link")}
                      {totalPending > 0 && (
                        <span className="ml-auto bg-red-100 text-red-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                          {totalPending}
                        </span>
                      )}
                    </DropdownMenuItem>
                  )}
                  {hasRole("admin") && (
                    <DropdownMenuItem className="rounded-full" onClick={() => navigate("/admin")}>
                      <ShieldCheck className="w-4 h-4 mr-2" />{t("admin_link")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="rounded-full text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />{t("logout_btn")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!isAuthenticated && (
              <Button variant="ghost" size="sm" className="rounded-full gap-2 text-gray-600 hover:text-black" onClick={() => navigate("/login")}>
                <LogIn className="w-4 h-4" />{t("login_btn")}
              </Button>
            )}
          </div>
        </div>

        {/* MOBILE Layer 2: search input — slides in from right */}
        <div
          className={`md:hidden absolute inset-x-4 flex items-center gap-2 transition-opacity duration-200 ${
            mobileSearchOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none delay-[0ms]"
          }`}
        >
          <div className="flex-1 min-w-0">
            <UserSearchInput ref={mobileSearchRef} fullWidth />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full shrink-0 text-gray-500"
            onClick={() => setMobileSearchOpen(false)}
            aria-label="Закрыть поиск"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* DESKTOP right section — hidden on mobile (mobile has its own Layer 1 above) */}
        <div className="hidden md:flex items-center gap-3">
          {rightContent}
          <UserSearchInput />
          {isAuthenticated ? (
            <>
              <NotificationPanel />
              <LanguageSwitcher />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full p-0 overflow-hidden">
                    <UserAvatar src={user?.avatar_url} username={user?.username} size="sm" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-2xl">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.username}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="rounded-full" onClick={() => navigate(`/user/${user?.id}`)}>
                    <User className="w-4 h-4 mr-2" />{t("profile_my_link")}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-full" onClick={() => navigate("/favorites")}>
                    <Heart className="w-4 h-4 mr-2" />{t("my_favorites_link")}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-full" onClick={() => navigate("/profile")}>
                    <Settings className="w-4 h-4 mr-2" />{t("profile_settings_link")}
                  </DropdownMenuItem>
                  {hasRole("moderator", "admin") && (
                    <DropdownMenuItem className="rounded-full" onClick={() => navigate("/moderation")}>
                      <Shield className="w-4 h-4 mr-2" />{t("moderation_link")}
                      {totalPending > 0 && (
                        <span className="ml-auto bg-red-100 text-red-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                          {totalPending}
                        </span>
                      )}
                    </DropdownMenuItem>
                  )}
                  {hasRole("admin") && (
                    <DropdownMenuItem className="rounded-full" onClick={() => navigate("/admin")}>
                      <ShieldCheck className="w-4 h-4 mr-2" />{t("admin_link")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="rounded-full text-red-600 focus:text-red-600 focus:bg-red-50" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />{t("logout_btn")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <LanguageSwitcher />
              <Button variant="ghost" size="sm" className="rounded-full gap-2 text-gray-600 hover:text-black" onClick={() => navigate("/login")}>
                <LogIn className="w-4 h-4" />{t("login_btn")}
              </Button>
            </>
          )}
        </div>
      </div>

    </header>
  );
}
