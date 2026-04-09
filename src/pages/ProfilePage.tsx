import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/Header";
import { BackButton } from "@/components/BackButton";

import { useUpdateCurrentUser, useChangePassword } from "@/api/auth/auth";
import { useAuth } from "@/lib/auth/auth-context";

/** Map backend error keys to i18n keys */
const BACKEND_ERROR_MAP: Record<string, string> = {
  password_incorrect: "profile_error_password_incorrect",
  password_not_set: "profile_error_password_not_set",
  password_change_not_available: "profile_password_google",
};

export function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const { mutateAsync: updateProfile, isPending: isSaving } =
    useUpdateCurrentUser();
  const { mutateAsync: changePassword, isPending: isChanging } =
    useChangePassword();

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        data: {
          username: username !== user?.username ? username : undefined,
          email: email !== user?.email ? email : undefined,
        },
      });
      toast.success(t("profile_saved"));
      queryClient.invalidateQueries({ queryKey: ["/api/v1/auth/me"] });
    } catch {
      toast.error(t("profile_error"));
    }
  };

  const validatePassword = (): string[] => {
    const errors: string[] = [];
    if (!oldPassword) {
      errors.push(t("profile_error_old_required"));
    }
    if (newPassword.length < 8) {
      errors.push(t("profile_error_new_min"));
    }
    if (newPassword.length > 128) {
      errors.push(t("profile_error_new_max"));
    }
    if (confirmPassword !== newPassword) {
      errors.push(t("profile_error_confirm_mismatch"));
    }
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
    <div className="min-h-screen bg-white font-sans">
      <Header leftContent={<BackButton />} />

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-md flex flex-col items-center">
        <div className="w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {t("profile_title")}
          </h1>

          {/* Profile info */}
          <h2 className="text-lg font-semibold text-gray-900 mb-3 text-center">
            {t("profile_personal_info")}
          </h2>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm">
                {t("profile_username_label")}
              </Label>
              <Input
                id="username"
                placeholder={t("profile_username_placeholder")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-full h-9 px-4 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">
                {t("profile_email_label")}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t("profile_email_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-full h-9 px-4 text-sm"
              />
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full rounded-full h-9 bg-black hover:bg-gray-800 text-sm"
            >
              {isSaving ? t("profile_saving_btn") : t("profile_save_btn")}
            </Button>
          </div>

          <Separator className="my-6" />

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

              {/* Validation errors */}
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
                {isChanging
                  ? t("profile_changing_btn")
                  : t("profile_change_btn")}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
