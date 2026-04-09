import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

/**
 * Universal "Back" button. Goes to previous page if available, otherwise to home.
 */
export function BackButton() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const hasPreviousPage = location.key !== "default";

  return (
    <Button
      variant="ghost"
      className="gap-2 text-gray-600 hover:text-black pl-0 hover:bg-transparent"
      onClick={() => {
        if (hasPreviousPage) {
          navigate(-1);
        } else {
          navigate("/");
        }
      }}
    >
      <ArrowLeft className="w-5 h-5" />
      <span className="text-base">{t("back_btn")}</span>
    </Button>
  );
}
