import { useCallback, useRef } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

const HAS_SITE_KEY = !!import.meta.env.VITE_RECAPTCHA_SITE_KEY;
// Per-attempt timeout. Safari sometimes hangs inside grecaptcha.execute()
// when its Private Access Token endpoint returns 401 and the JS fails to
// fall back — when that happens, no amount of waiting helps, so we retry.
const EXECUTE_TIMEOUT_MS = 8_000;
// How long to wait for `executeRecaptcha` to become defined (script load).
const READY_TIMEOUT_MS = 10_000;
// Total number of execute() attempts (1 initial + N retries).
const MAX_ATTEMPTS = 3;

/**
 * Returns an `execute` function that fetches a fresh reCAPTCHA v3 token.
 *
 * Behaviour:
 *   - If no site key is configured → returns "" immediately (dev / preview).
 *   - Otherwise: waits for the reCAPTCHA script to finish loading (up to
 *     READY_TIMEOUT_MS), then calls executeRecaptcha with a per-attempt
 *     timeout and retries on failure (up to MAX_ATTEMPTS times).
 *   - Throws on terminal failure so the caller can show a "please retry"
 *     message.
 *
 * Why this matters: Safari (desktop + iOS) sometimes hangs inside
 * grecaptcha.execute() because Google's Private Access Token endpoint
 * returns 401 and the script doesn't always fall back gracefully. A timeout
 * + retry recovers cleanly in most cases.
 */
export function useRecaptcha(action: string) {
  const { executeRecaptcha } = useGoogleReCaptcha();
  // Keep a live ref so the polling loop sees the latest value across re-renders.
  const executeRef = useRef(executeRecaptcha);
  executeRef.current = executeRecaptcha;

  const execute = useCallback(async (): Promise<string> => {
    if (!HAS_SITE_KEY) return "";

    // Wait for `executeRecaptcha` to be defined (script loaded).
    if (!executeRef.current) {
      const deadline = Date.now() + READY_TIMEOUT_MS;
      while (!executeRef.current && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 100));
      }
      if (!executeRef.current) {
        throw new Error("reCAPTCHA script failed to load");
      }
    }

    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const result = await Promise.race([
          executeRef.current(action),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("reCAPTCHA execute timed out")),
              EXECUTE_TIMEOUT_MS,
            ),
          ),
        ]);
        if (result) return result;
        lastError = new Error("reCAPTCHA returned empty token");
      } catch (err) {
        lastError = err;
      }
      // Brief pause before retrying so Google's internal state can reset.
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    throw lastError ?? new Error("reCAPTCHA failed");
  }, [action]);

  return execute;
}
