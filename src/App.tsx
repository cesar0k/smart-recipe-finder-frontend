import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { Spinner } from "./components/ui/spinner";

const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage }))
);
const RecipePage = lazy(() =>
  import("./pages/RecipePage").then((m) => ({ default: m.RecipePage }))
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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Toaster />
    </>
  );
}

export default App;
