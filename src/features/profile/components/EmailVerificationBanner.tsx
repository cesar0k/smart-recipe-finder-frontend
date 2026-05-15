import { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useSendVerificationEmail } from "@/api/auth/auth";

interface EmailVerificationBannerProps {
  /** Called after successful re-send so parent can refresh user data if needed */
  onSent?: () => void;
}

export function EmailVerificationBanner({ onSent }: EmailVerificationBannerProps) {
  const { t } = useTranslation();
  const [sentThisSession, setSentThisSession] = useState(false);
  const { mutate: sendVerification, isPending } = useSendVerificationEmail();

  const handleSend = () => {
    sendVerification(undefined, {
      onSuccess: () => {
        setSentThisSession(true);
        toast.success(t("verification_email_sent"));
        onSent?.();
      },
      onError: () => {
        toast.error(t("verification_email_rate_limited"));
      },
    });
  };

  if (sentThisSession) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex items-center gap-3">
        <CheckCircle2 className="w-4 h-4 text-gray-500 shrink-0" />
        <p className="text-sm text-gray-600">{t("verification_email_sent")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex items-start gap-3">
      <Mail className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700">{t("email_not_verified_banner")}</p>
        <p className="text-xs text-gray-400 mt-0.5">{t("email_not_verified_desc")}</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="rounded-full shrink-0 text-xs h-7"
        onClick={handleSend}
        disabled={isPending}
      >
        {isPending ? t("sending") : t("send_verification_email_btn")}
      </Button>
    </div>
  );
}
