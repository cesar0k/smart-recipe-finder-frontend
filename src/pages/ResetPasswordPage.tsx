import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ChefHat } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useResetPassword } from "@/api/auth/auth";
import { useDismissSplash } from "@/hooks/useDismissSplash";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function ResetPasswordPage() {
  useDismissSplash();
  const { t } = useTranslation();
  useDocumentTitle(t("page_title_reset_password"));
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate: resetPassword, isPending } = useResetPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError(t("profile_error_new_min"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("profile_error_confirm_mismatch"));
      return;
    }
    if (!token) {
      setError(t("reset_password_invalid_token"));
      return;
    }

    resetPassword(
      { data: { token, new_password: newPassword } },
      {
        onSuccess: () => {
          toast.success(t("reset_password_success"));
          navigate("/login", { replace: true });
        },
        onError: (err) => {
          if (axios.isAxiosError(err)) {
            const detail = err.response?.data?.detail;
            if (detail === "reset_token_expired") {
              setError(t("reset_password_expired"));
            } else {
              setError(t("reset_password_invalid_token"));
            }
          } else {
            setError(t("reset_password_invalid_token"));
          }
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Logo header */}
          <div className="flex items-center justify-center py-4 border-b border-gray-300">
            <Link to="/" className="group flex items-center gap-0 hover:gap-2 transition-all duration-300">
              <div className="w-0 group-hover:w-8 h-8 overflow-hidden transition-all duration-300 opacity-0 group-hover:opacity-100">
                <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center">
                  <ChefHat className="w-4 h-4 text-white" />
                </div>
              </div>
              <span className="text-lg font-bold tracking-tighter text-gray-900">
                {t("app_name")}
              </span>
            </Link>
          </div>

          {/* Form body */}
          <div className="px-8 pb-8 pt-6 space-y-6">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {t("reset_password_title")}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {t("reset_password_subtitle")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-sm text-gray-700">
                  {t("profile_new_password")}
                </Label>
                <PasswordInput
                  id="new-password"
                  placeholder={t("profile_new_password_placeholder")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="rounded-full px-4 border-gray-300 bg-white h-12"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-sm text-gray-700">
                  {t("profile_confirm_password")}
                </Label>
                <PasswordInput
                  id="confirm-password"
                  placeholder={t("profile_confirm_password_placeholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="rounded-full px-4 border-gray-300 bg-white h-12"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 text-center px-4">{error}</p>
              )}

              <Button
                type="submit"
                disabled={isPending || !newPassword || !confirmPassword}
                className="w-full rounded-full h-12 text-base font-semibold bg-black hover:bg-gray-800"
              >
                {isPending ? t("reset_password_saving") : t("reset_password_btn")}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
