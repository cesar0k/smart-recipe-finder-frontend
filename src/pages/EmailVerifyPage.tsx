import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useVerifyEmail } from "@/api/auth/auth";
import { useDismissSplash } from "@/hooks/useDismissSplash";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function EmailVerifyPage() {
  useDismissSplash();
  const { t } = useTranslation();
  useDocumentTitle(t("page_title_verify_email"));
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const { mutate: verifyEmail } = useVerifyEmail();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    verifyEmail(
      { data: { token } },
      {
        onSuccess: () => {
          setStatus("success");
          toast.success(t("email_verified_success"));
          setTimeout(() => navigate("/profile", { replace: true }), 2000);
        },
        onError: () => {
          setStatus("error");
        },
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        {status === "pending" && (
          <>
            <div className="w-12 h-12 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto" />
            <p className="text-gray-600">{t("email_verifying")}</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">{t("email_verified_success")}</h2>
            <p className="text-gray-500">{t("email_verify_redirect")}</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-14 h-14 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">{t("email_verify_link_invalid")}</h2>
            <p className="text-gray-500">{t("email_verify_link_hint")}</p>
            <Link to="/profile">
              <Button variant="outline" className="rounded-full mt-2">
                {t("back_to_profile")}
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
