import { useCallback } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

/**
 * Returns an `execute` function that fetches a fresh reCAPTCHA v3 token.
 * Returns an empty string when reCAPTCHA is not configured (no site key),
 * so forms degrade gracefully — the backend skips verification when its
 * own secret key is also absent.
 */
export function useRecaptcha(action: string) {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const execute = useCallback(async (): Promise<string> => {
    if (!executeRecaptcha) return "";
    try {
      // 3s timeout — if reCAPTCHA hangs, degrade gracefully rather than blocking the form
      const result = await Promise.race([
        executeRecaptcha(action),
        new Promise<string>((resolve) => setTimeout(() => resolve(""), 3000)),
      ]);
      return result;
    } catch {
      return "";
    }
  }, [executeRecaptcha, action]);

  return execute;
}
