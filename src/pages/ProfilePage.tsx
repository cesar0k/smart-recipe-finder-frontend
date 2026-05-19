import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/Header";
import { EmailVerificationBanner } from "@/features/profile/components/EmailVerificationBanner";

import {
  useUpdateCurrentUser,
  useChangePassword,
  useGetEmailPreferences,
  useUpdateEmailPreference,
  getGetEmailPreferencesQueryKey,
} from "@/api/users/users";
import { useAuth } from "@/lib/auth/auth-context";
import { useDismissSplash } from "@/hooks/useDismissSplash";

const PREF_DEBOUNCE_MS = 400;

/**
 * Returns a toggle function that:
 * 1. Updates the TanStack Query cache optimistically on every click.
 * 2. Debounces the actual network request — only the last click within
 *    PREF_DEBOUNCE_MS fires a request, collapsing rapid taps into one call.
 */
function useDebouncedPrefToggle(
  updateEmailPref: (args: { data: { type: string; enabled: boolean } }) => void,
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: readonly unknown[],
) {
  // One timer per notification type
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  return useCallback(
    (type: string, currentEnabled: boolean) => {
      const newEnabled = !currentEnabled;

      // Immediate optimistic update so the toggle snaps right away
      queryClient.setQueryData(
        queryKey,
        (old: { type: string; enabled: boolean }[] | undefined) =>
          old?.map((p) => (p.type === type ? { ...p, enabled: newEnabled } : p)),
      );

      // Clear any pending timer for this type (debounce)
      const existing = timers.current.get(type);
      if (existing) clearTimeout(existing);

      // Schedule the real request
      const id = setTimeout(() => {
        timers.current.delete(type);
        updateEmailPref(
          { data: { type, enabled: newEnabled } },
        );
      }, PREF_DEBOUNCE_MS);

      timers.current.set(type, id);
    },
    [updateEmailPref, queryClient, queryKey],
  );
}

/** Map backend error keys to i18n keys */
const BACKEND_ERROR_MAP: Record<string, string> = {
  password_incorrect: "profile_error_password_incorrect",
  password_not_set: "profile_error_password_not_set",
  password_change_not_available: "profile_password_google",
};

export function ProfilePage() {
  useDismissSplash();
  const { t, i18n } = useTranslation();
  const { user, refetchUser } = useAuth();

  const [email, setEmail] = useState(user?.email ?? "");
  // Prefer saved user preference; fall back to detected browser language
  const detectedLang = i18n.language?.startsWith("ru") ? "ru" : "en";
  const [language, setLanguage] = useState<"ru" | "en">(
    (user?.language as "ru" | "en") || detectedLang
  );
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const { mutateAsync: updateProfile, isPending: isSaving } =
    useUpdateCurrentUser();
  const { mutateAsync: changePassword, isPending: isChanging } =
    useChangePassword();
  const queryClient = useQueryClient();
  const { data: emailPrefs } = useGetEmailPreferences();
  const { mutate: updateEmailPref } = useUpdateEmailPreference();
  const togglePref = useDebouncedPrefToggle(
    updateEmailPref,
    queryClient,
    getGetEmailPreferencesQueryKey(),
  );

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        data: {
          email: email !== user?.email ? email : undefined,
          language: language !== user?.language ? language : undefined,
        },
      });
      toast.success(t("profile_saved"));
      await refetchUser();
    } catch {
      toast.error(t("profile_error"));
    }
  };

  const validatePassword = (): string[] => {
    const errors: string[] = [];
    if (!oldPassword) errors.push(t("profile_error_old_required"));
    if (newPassword.length < 8) errors.push(t("profile_error_new_min"));
    if (newPassword.length > 128) errors.push(t("profile_error_new_max"));
    if (confirmPassword !== newPassword) errors.push(t("profile_error_confirm_mismatch"));
    return errors;
  };

  const handleChangePassword = async () => {
    const errors = validatePassword();
    setPasswordErrors(errors);
    if (errors.length > 0) return;

    try {
      await changePassword({
        data: { old_password: oldPassword, new_password: newPassword },
      });
      toast.success(t("profile_password_changed"));
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordErrors([]);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        const detail = err.response.data?.detail;
        if (typeof detail === "string") {
          const i18nKey = BACKEND_ERROR_MAP[detail];
          setPasswordErrors([i18nKey ? t(i18nKey) : t("profile_password_error")]);
        } else {
          setPasswordErrors([t("profile_password_error")]);
        }
      } else {
        toast.error(t("profile_password_error"));
      }
    }
  };

  const isGoogleUser = user?.auth_provider === "google";

  return (
    <div className="min-h-screen bg-white font-sans pb-16 md:pb-0">
      <Header />

      <main className="container mx-auto px-4 pt-6 pb-24 md:pb-10 max-w-md flex flex-col items-center">
        <div className="w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {t("profile_title")}
          </h1>

          {/* Email verification banner — only for local-auth users with unverified email */}
          {user && !user.email_verified && user.auth_provider !== "google" && !user.pending_email && (
            <div className="mb-6">
              <EmailVerificationBanner onSent={() => refetchUser()} />
            </div>
          )}

          {/* Pending email change notice */}
          {user?.pending_email && (
            <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 flex items-start gap-3">
              <Mail className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">
                {t("pending_email_notice", { email: user.pending_email })}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">
                {t("profile_email_label")}
              </Label>
              <Input
                id="email"
                type="email"
                autoCapitalize="none"
                placeholder={t("profile_email_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-full h-9 px-4 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t("profile_language_label")}</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as "ru" | "en")}>
                <SelectTrigger className="w-full rounded-full h-9 text-sm border-gray-300 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="ru" className="rounded-xl">Русский</SelectItem>
                  <SelectItem value="en" className="rounded-xl">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full rounded-full h-9 bg-black hover:bg-gray-800 text-sm"
            >
              {isSaving ? t("profile_saving_btn") : t("profile_save_btn")}
            </Button>
          </div>

          {/* Interface language — mobile only (desktop has switcher in header) */}
          <div className="md:hidden mt-4">
            <Separator className="mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-3 text-center">
              {t("profile_interface_language")}
            </h2>
            <div className="flex gap-2">
              {(["ru", "en"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => i18n.changeLanguage(lang)}
                  className={`flex-1 h-9 rounded-full border text-sm font-medium transition-colors ${
                    i18n.language?.startsWith(lang)
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {lang === "ru" ? "Русский" : "English"}
                </button>
              ))}
            </div>
          </div>

          <Separator className="mt-6 mb-3" />

          {/* Change password */}
          <h2 className="text-lg font-semibold text-gray-900 mb-3 text-center">
            {t("profile_change_password")}
          </h2>

          {isGoogleUser ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              {t("profile_password_google")}
            </p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="old-password" className="text-sm">
                  {t("profile_old_password")}
                </Label>
                <PasswordInput
                  id="old-password"
                  placeholder={t("profile_old_password_placeholder")}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="rounded-full h-9 px-4 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-sm">
                  {t("profile_new_password")}
                </Label>
                <PasswordInput
                  id="new-password"
                  placeholder={t("profile_new_password_placeholder")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-full h-9 px-4 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-sm">
                  {t("profile_confirm_password")}
                </Label>
                <PasswordInput
                  id="confirm-password"
                  placeholder={t("profile_confirm_password_placeholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-full h-9 px-4 text-sm"
                />
              </div>

              {passwordErrors.length > 0 && (
                <div className="space-y-1">
                  {passwordErrors.map((err, i) => (
                    <p key={i} className="text-sm text-red-500">
                      {err}
                    </p>
                  ))}
                </div>
              )}

              <Button
                onClick={handleChangePassword}
                disabled={isChanging}
                className="w-full rounded-full h-9 bg-black hover:bg-gray-800 text-sm"
              >
                {isChanging ? t("profile_changing_btn") : t("profile_change_btn")}
              </Button>
            </div>
          )}

          <Separator className="mt-6 mb-3" />

          {/* Email notification preferences */}
          <h2 className="text-lg font-semibold text-gray-900 mb-3 text-center flex items-center justify-center gap-2">
            {t("email_prefs_title")}
          </h2>
          <p className="text-xs text-gray-400 text-center mb-4">{t("email_prefs_desc")}</p>
          {emailPrefs && emailPrefs.length > 0 ? (
            <div className="space-y-2">
              {emailPrefs.map((pref) => {
                const labelKey = `email_pref_${pref.type}` as const;
                return (
                  <div
                    key={pref.type}
                    className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                  >
                    <span className="text-sm text-gray-700">{t(labelKey)}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={pref.enabled}
                      onClick={() => togglePref(pref.type, pref.enabled)}
                      className={[
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                        pref.enabled ? "bg-gray-900" : "bg-gray-300",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200",
                          pref.enabled ? "translate-x-4" : "translate-x-0",
                        ].join(" ")}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">{t("loading")}</p>
          )}
        </div>
      </main>

    </div>
  );
}
