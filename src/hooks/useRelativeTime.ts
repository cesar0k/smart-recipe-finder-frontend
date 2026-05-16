import { useTranslation } from "react-i18next";

/**
 * Returns a formatter function that converts an ISO date string
 * to a localized relative time string (e.g. "2 minutes ago").
 */
export function useRelativeTime() {
  const { i18n } = useTranslation();

  return (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: "auto" });

    if (diffSec < 60) return rtf.format(-diffSec, "second");
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return rtf.format(-diffMin, "minute");
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return rtf.format(-diffHours, "hour");
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return rtf.format(-diffDays, "day");
    const diffMonths = Math.floor(diffDays / 30);
    return rtf.format(-diffMonths, "month");
  };
}
