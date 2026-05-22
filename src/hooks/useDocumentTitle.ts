import { useEffect } from "react";

const APP_NAME = "Smart Recipe Finder";

/**
 * Sets document.title to "Title — Smart Recipe Finder".
 * Pass `null`/`undefined` to fall back to just the app name (useful while
 * data is loading and the real title is not yet known).
 */
export function useDocumentTitle(title: string | null | undefined) {
  useEffect(() => {
    document.title = title ? `${title} — ${APP_NAME}` : APP_NAME;
  }, [title]);
}
