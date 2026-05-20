import { lazy, Suspense, useEffect, useRef } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { ProtectedRoute } from "./components/ProtectedRoute";
import {
  IndicatorSuspenseFallback,
  RouteTransitionIndicator,
} from "./components/RouteTransitionIndicator";
import { BottomNav } from "./components/layout/BottomNav";
import { ScrollToTop } from "./components/ui/scroll-to-top";
import { AndroidScrollLock } from "./components/ui/android-scroll-lock";

const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage }))
);
const RecipePage = lazy(() =>
  import("./pages/RecipePage").then((m) => ({ default: m.RecipePage }))
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import("./pages/RegisterPage").then((m) => ({ default: m.RegisterPage }))
);
const ModerationPage = lazy(() =>
  import("./pages/ModerationPage").then((m) => ({ default: m.ModerationPage }))
);
const AdminPage = lazy(() =>
  import("./pages/AdminPage").then((m) => ({ default: m.AdminPage }))
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage }))
);
const PublicProfilePage = lazy(() =>
  import("./pages/PublicProfilePage").then((m) => ({ default: m.PublicProfilePage }))
);
const MyFavoritesPage = lazy(() =>
  import("./pages/MyFavoritesPage").then((m) => ({ default: m.MyFavoritesPage }))
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage }))
);
const EmailVerifyPage = lazy(() =>
  import("./pages/EmailVerifyPage").then((m) => ({ default: m.EmailVerifyPage }))
);
const ForgotPasswordPage = lazy(() =>
  import("./pages/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import("./pages/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage }))
);
const FollowersPage = lazy(() =>
  import("./pages/FollowersPage").then((m) => ({ default: m.FollowersPage }))
);
const FollowingPage = lazy(() =>
  import("./pages/FollowingPage").then((m) => ({ default: m.FollowingPage }))
);
const NotificationsPage = lazy(() =>
  import("./pages/NotificationsPage").then((m) => ({ default: m.NotificationsPage }))
);
const RecipesPage = lazy(() =>
  import("./pages/RecipesPage").then((m) => ({ default: m.RecipesPage }))
);

const HOME_SCROLL_KEY = "home_scroll_y";

/**
 * Scroll behaviour:
 * - On "/" without meal_type: continuously saves scroll to sessionStorage
 * - Navigating TO a non-home page  → scroll to top
 * - Navigating BACK to "/"         → restore saved scroll after content loads
 * - Adding meal_type to "/" URL    → scroll to top (new category view)
 */
function ScrollManager() {
  const { pathname, search } = useLocation();
  const prevPathname = useRef<string>(pathname);
  const prevSearch = useRef<string>(search);
  const restoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Continuously track scroll position while on the home feed
  useEffect(() => {
    const isHomeFeed =
      pathname === "/" && !new URLSearchParams(search).has("meal_type");

    if (!isHomeFeed) return;

    const onScroll = () => {
      sessionStorage.setItem(HOME_SCROLL_KEY, String(window.scrollY));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname, search]);

  // Handle navigation transitions
  useEffect(() => {
    const prev = prevPathname.current;
    const prevS = prevSearch.current;

    const enteringHomeFeed =
      pathname === "/" &&
      !new URLSearchParams(search).has("meal_type") &&
      (prev !== "/" || new URLSearchParams(prevS).has("meal_type"));

    const mealTypeAdded =
      pathname === "/" &&
      new URLSearchParams(search).has("meal_type") &&
      !new URLSearchParams(prevS).has("meal_type");

    if (enteringHomeFeed && prev !== "/") {
      // Coming back from another page — restore saved position.
      // Poll until the page has enough content to actually scroll.
      const saved = Number(sessionStorage.getItem(HOME_SCROLL_KEY) ?? 0);
      if (saved > 0) {
        let attempts = 0;
        const tryRestore = () => {
          const pageIsReady = document.body.scrollHeight > saved * 1.1;
          window.scrollTo({ top: saved, behavior: pageIsReady ? "smooth" : "instant" });
          if (window.scrollY < saved * 0.9 && attempts < 8) {
            attempts++;
            restoreTimer.current = setTimeout(tryRestore, 200);
          }
        };
        restoreTimer.current = setTimeout(() => requestAnimationFrame(tryRestore), 50);
      }
    } else if (mealTypeAdded || (pathname !== "/" && prev !== pathname)) {
      // New category view or any non-home navigation → top
      if (restoreTimer.current) clearTimeout(restoreTimer.current);
      window.scrollTo(0, 0);
    }

    prevPathname.current = pathname;
    prevSearch.current = search;

    return () => {
      if (restoreTimer.current) clearTimeout(restoreTimer.current);
    };
  }, [pathname, search]);

  return null;
}

function App() {
  return (
    <>
      <ScrollManager />
      <RouteTransitionIndicator />
      <Suspense fallback={<IndicatorSuspenseFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recipe/:id" element={<RecipePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/moderation"
            element={
              <ProtectedRoute requiredRoles={["moderator", "admin"]}>
                <ModerationPage />
              </ProtectedRoute>
            }
          />
          <Route path="/user/:userId" element={<PublicProfilePage />} />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <MyFavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRoles={["admin"]}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="/verify-email" element={<EmailVerifyPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/user/:userId/followers" element={<FollowersPage />} />
          <Route path="/user/:userId/following" element={<FollowingPage />} />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <BottomNav />
      <ScrollToTop />
      <AndroidScrollLock />
      <Toaster />
    </>
  );
}

export default App;
