import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { Spinner } from "./components/ui/spinner";
import { ProtectedRoute } from "./components/ProtectedRoute";

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
const MyRecipesPage = lazy(() =>
  import("./pages/MyRecipesPage").then((m) => ({ default: m.MyRecipesPage }))
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage }))
);
const UserRecipesPage = lazy(() =>
  import("./pages/UserRecipesPage").then((m) => ({ default: m.UserRecipesPage }))
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage }))
);

function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Spinner size="lg" className="text-gray-300" />
    </div>
  );
}

function App() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recipe/:id" element={<RecipePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/my-recipes"
            element={
              <ProtectedRoute>
                <MyRecipesPage />
              </ProtectedRoute>
            }
          />
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
          <Route
            path="/user-recipes/:userId"
            element={
              <ProtectedRoute requiredRoles={["moderator", "admin"]}>
                <UserRecipesPage />
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
