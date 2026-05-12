import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useDismissSplash } from "@/hooks/useDismissSplash";

export function NotFoundPage() {
  useDismissSplash();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-6 px-4">
      <div className="text-center space-y-3">
        <h1 className="text-6xl font-extrabold text-gray-900">404</h1>
        <h2 className="text-2xl font-bold text-gray-900">
          {t("not_found_title")}
        </h2>
        <p className="text-gray-500">{t("not_found_desc")}</p>
      </div>
      <Link to="/">
        <Button className="rounded-full">
          {t("back_to_home")}
        </Button>
      </Link>
    </div>
  );
}
