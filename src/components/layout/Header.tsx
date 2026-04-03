import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, LogOut, Shield, ShieldCheck, LogIn } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";
import type { ReactNode } from "react";

interface HeaderProps {
  leftContent?: ReactNode;
  rightContent?: ReactNode;
}

export function Header({ leftContent, rightContent }: HeaderProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-md z-20">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {leftContent ?? (
          <Link
            to="/"
            className="font-bold text-xl tracking-tighter text-gray-900 cursor-pointer"
          >
            {t("app_name")}
          </Link>
        )}
        <div className="flex items-center gap-3">
          {rightContent}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="w-5 h-5 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-2xl">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                {hasRole("moderator", "admin") && (
                  <DropdownMenuItem
                    className="rounded-full"
                    onClick={() => navigate("/moderation")}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {t("moderation_link")}
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
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full gap-2 text-gray-600 hover:text-black"
              onClick={() => navigate("/login")}
            >
              <LogIn className="w-4 h-4" />
              {t("login_btn")}
            </Button>
          )}

          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
