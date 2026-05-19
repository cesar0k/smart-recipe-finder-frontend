import { Link, useLocation } from "react-router-dom";
import { Home, Heart, Bell, User, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/auth-context";
import { useGetUnreadCount } from "@/api/notifications/notifications";
import { useState, useEffect } from "react";

// Pages where bottom nav should not appear
const HIDDEN_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

export function BottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Detect when any Radix modal is open to disable nav interaction
  const [modalOpen, setModalOpen] = useState(false);
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setModalOpen(document.body.hasAttribute("data-scroll-locked"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-scroll-locked"] });
    return () => observer.disconnect();
  }, []);

  // Must be called unconditionally before any early returns (Rules of Hooks)
  const { data: unreadData } = useGetUnreadCount({
    query: { enabled: isAuthenticated },
  });
  const unreadCount = unreadData?.count ?? 0;

  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null;

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  if (!isAuthenticated) {
    return (
      <nav data-bottom-nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-gray-300 ${modalOpen ? "pointer-events-none" : ""}`}>
        <div className="flex items-center justify-around h-16 px-2">
          <NavItem to="/" icon={<Home className="w-5 h-5" />} label={t("nav_home")} active={isActive("/")} />
          <NavItem to="/login" icon={<LogIn className="w-5 h-5" />} label={t("login_btn")} active={isActive("/login")} />
        </div>
      </nav>
    );
  }

  return (
    <nav data-bottom-nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-gray-300 ${modalOpen ? "pointer-events-none" : ""}`}>
      <div className="flex items-center justify-around h-16 px-2">
        <NavItem to="/" icon={<Home className="w-5 h-5" />} label={t("nav_home")} active={isActive("/")} />
        <NavItem
          to="/favorites"
          icon={<Heart className="w-5 h-5" />}
          label={t("my_favorites_link")}
          active={isActive("/favorites")}
        />
        <NavItem
          to="/notifications"
          icon={
            <div className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
          }
          label={t("nav_notifications")}
          active={isActive("/notifications")}
        />
        <NavItem
          to={`/user/${user?.id}`}
          icon={<User className="w-5 h-5" />}
          label={t("profile_my_link")}
          active={pathname === `/user/${user?.id}`}
        />
      </div>
    </nav>
  );
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function NavItem({ to, icon, label, active }: NavItemProps) {
  return (
    <Link
      to={to}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 rounded-xl transition-colors ${
        active ? "text-gray-900" : "text-gray-400"
      }`}
    >
      <span className={`transition-transform ${active ? "scale-110" : ""}`}>
        {icon}
      </span>
      <span className="text-[9px] font-medium leading-tight truncate w-full text-center px-0.5">
        {label}
      </span>
    </Link>
  );
}
