import { lazy, Suspense, useEffect, useRef } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { ProtectedRoute } from "./components/ProtectedRoute";
import {
  IndicatorSuspenseFallback,
  RouteTransitionIndicator,
} from "./components/RouteTransitionIndicator";

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
          window.scrollTo(0, saved);
          // If the page isn't tall enough yet, retry (content still loading)
          if (window.scrollY < saved * 0.9 && attempts < 20) {
            attempts++;
            restoreTimer.current = setTimeout(tryRestore, 100);
          }
        };
        requestAnimationFrame(tryRestore);
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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Toaster />
    </>
  );
}

export default App;
