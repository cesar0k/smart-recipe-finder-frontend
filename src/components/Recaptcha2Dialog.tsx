import { useEffect, useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Recaptcha2DialogProps {
  /** Whether the dialog is open. The parent controls this. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Called with the v2 token once the user has passed the challenge.
   * The caller is responsible for closing the dialog (via onOpenChange) and
   * retrying the original action.
   */
  onVerify: (token: string) => void;
}

/**
 * Visible reCAPTCHA v2 checkbox shown as a Safari fallback when v3 fails.
 *
 * v3 (invisible scoring) is the default for all users. If `useRecaptcha`
 * times out or returns an empty token — which happens on Safari/macOS when
 * Google's Private Access Token endpoint returns 401 — we surface this
 * dialog so the user can prove they're human manually.
 */
export function Recaptcha2Dialog({ open, onOpenChange, onVerify }: Recaptcha2DialogProps) {
  const { t, i18n } = useTranslation();
  const captchaRef = useRef<ReCAPTCHA>(null);
  const [verifying, setVerifying] = useState(false);

  const siteKey = import.meta.env.VITE_RECAPTCHA_V2_SITE_KEY || "";

  // Reset the captcha widget when the dialog closes so that re-opening shows
  // a fresh challenge rather than a stale ticked checkbox.
  useEffect(() => {
    if (!open) {
      captchaRef.current?.reset();
      setVerifying(false);
    }
  }, [open]);

  if (!siteKey) {
    // No v2 site key configured — render nothing. The caller should treat
    // this case as a hard failure (the user can't recover via v2).
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("recaptcha_v2_title")}</DialogTitle>
          <DialogDescription>{t("recaptcha_v2_desc")}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-2">
          <ReCAPTCHA
            ref={captchaRef}
            sitekey={siteKey}
            hl={i18n.language === "ru" ? "ru" : "en"}
            onChange={(token) => {
              if (!token) return;
              setVerifying(true);
              onVerify(token);
            }}
            onExpired={() => captchaRef.current?.reset()}
            onErrored={() => captchaRef.current?.reset()}
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
            disabled={verifying}
          >
            {t("cancel_btn")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
