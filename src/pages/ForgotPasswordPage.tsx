import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ChefHat, MailCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForgotPassword } from "@/api/auth/auth";
import { useDismissSplash } from "@/hooks/useDismissSplash";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { CaptchaWidget, type CaptchaWidgetHandle } from "@/components/CaptchaWidget";

export function ForgotPasswordPage() {
  useDismissSplash();
  const { t } = useTranslation();
  useDocumentTitle(t("page_title_forgot_password"));
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const captchaRef = useRef<CaptchaWidgetHandle>(null);

  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const submitWithToken = (token: string) => {
    forgotPassword(
      {
        data: {
          email,
          captcha_token: token || undefined,
        },
      },
      {
        onSuccess: () => setSent(true),
        onError: (err) => {
          if (axios.isAxiosError(err)) {
            const detail = err.response?.data?.detail;
            if (detail === "google_auth_user") {
              setError(t("forgot_password_google_user"));
              return;
            }
          }
          // For any other error still show "sent" to prevent enumeration
          setSent(true);
        },
        // Single-use Turnstile token: reset the widget after every attempt so
        // a retry gets a fresh token instead of replaying the spent one.
        onSettled: () => captchaRef.current?.reset(),
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    captchaRef.current?.execute();
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <MailCheck className="w-14 h-14 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">{t("forgot_password_sent_title")}</h2>
          <p className="text-gray-500">{t("forgot_password_sent_desc")}</p>
          <Link to="/login">
            <Button variant="outline" className="rounded-full mt-2">
              {t("back_to_login")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
    <CaptchaWidget
      ref={captchaRef}
      onVerify={submitWithToken}
      onError={() => setError(t("captcha_error"))}
      action="forgot_password"
    />
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
                {t("forgot_password_title")}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {t("forgot_password_subtitle")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm text-gray-700">
                  {t("profile_email_label")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoCapitalize="none"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-full px-4 border-gray-300 bg-white h-12"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 text-center px-4">{error}</p>
              )}

              <Button
                type="submit"
                disabled={isPending || !email.trim()}
                className="w-full rounded-full h-12 text-base font-semibold bg-black hover:bg-gray-800"
              >
                {t("forgot_password_btn")}
              </Button>
              <p className="text-center text-[11px] text-gray-400">
                {t("captcha_notice")}
              </p>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="font-medium text-black hover:underline">
            {t("back_to_login")}
          </Link>
        </p>
      </div>
    </div>
    </>
  );
}
