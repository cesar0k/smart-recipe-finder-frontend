import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

/**
 * Imperative handle exposed by CaptchaWidget. Parent calls execute() to request
 * a fresh single-use Turnstile token; the widget then resolves it silently in
 * the background (the common case) or pops a visible challenge if Cloudflare
 * decides the visitor needs to prove they're human.
 */
export interface CaptchaWidgetHandle {
  execute: () => void;
  reset: () => void;
}

interface CaptchaWidgetProps {
  /** Called with a one-shot Turnstile token. */
  onVerify: (token: string) => void;
  /** Called if the widget errors out (network failure, blocked, etc.). */
  onError?: () => void;
  /** Called when the user cancels a visible challenge. */
  onCancel?: () => void;
  /** Optional cdata hint forwarded to Cloudflare (e.g. "login", "register"). */
  action?: string;
}

/**
 * Cloudflare Turnstile, invisible-first.
 *
 * Mounted once and kept alive — there's no per-submit mount/unmount that would
 * cause the "modal flashes then disappears" effect we hit when the widget was
 * inside a Dialog. Most users get a silent token (no UI at all), so this
 * component renders nothing visible. If Cloudflare wants a visible challenge
 * we surface a backdrop + cancel button around the widget via
 * `before-interactive-callback`.
 *
 * If no site key is configured (e.g. local dev), execute() resolves with an
 * empty token immediately, letting callers skip captcha entirely.
 */
export const CaptchaWidget = forwardRef<CaptchaWidgetHandle, CaptchaWidgetProps>(
  function CaptchaWidget({ onVerify, onError, onCancel, action }, ref) {
    const { t, i18n } = useTranslation();
    const widgetRef = useRef<TurnstileInstance | null>(null);
    const siteKey = import.meta.env.VITE_CAPTCHA_SITE_KEY || "";
    const [interactive, setInteractive] = useState(false);

    useImperativeHandle(ref, () => ({
      execute: () => {
        if (!siteKey) {
          // No captcha configured — let caller proceed with an empty token.
          onVerify("");
          return;
        }
        widgetRef.current?.execute();
      },
      reset: () => {
        widgetRef.current?.reset();
        setInteractive(false);
      },
    }));

    if (!siteKey) return null;

    // The widget itself is always mounted. `appearance: "interaction-only"`
    // means Turnstile hides its own UI until Cloudflare actually needs to
    // challenge the user. We add a backdrop + cancel button around it only
    // when that happens (signalled by onBeforeInteractive).
    return (
      <div
        className={
          interactive
            ? "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            : "fixed -left-[10000px] top-0"
        }
        aria-hidden={!interactive}
      >
        <div
          className={
            interactive
              ? "bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4"
              : ""
          }
        >
          {interactive && (
            <div className="space-y-1 text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {t("captcha_title")}
              </h2>
              <p className="text-sm text-gray-500">{t("captcha_desc")}</p>
            </div>
          )}

          <div
            className={
              interactive ? "flex justify-center min-h-[70px]" : ""
            }
          >
            <Turnstile
              ref={widgetRef}
              siteKey={siteKey}
              options={{
                theme: "light",
                language: i18n.language === "ru" ? "ru" : "en",
                appearance: "interaction-only",
                execution: "execute",
                action,
              }}
              onBeforeInteractive={() => setInteractive(true)}
              onSuccess={(token) => {
                setInteractive(false);
                onVerify(token);
              }}
              onError={() => {
                setInteractive(false);
                onError?.();
              }}
              onExpire={() => widgetRef.current?.reset()}
            />
          </div>

          {interactive && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                className="rounded-full"
                onClick={() => {
                  widgetRef.current?.reset();
                  setInteractive(false);
                  onCancel?.();
                }}
              >
                {t("cancel_btn")}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  },
);
