import { useState, useRef, useCallback } from "react";
import { User, Camera } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/Header";
import { BackButton } from "@/components/BackButton";
import { AvatarCropDialog } from "@/components/AvatarCropDialog";

import {
  useUpdateCurrentUser,
  useChangePassword,
  useUploadAvatar,
} from "@/api/users/users";
import { useAuth } from "@/lib/auth/auth-context";

/** Map backend error keys to i18n keys */
const BACKEND_ERROR_MAP: Record<string, string> = {
  password_incorrect: "profile_error_password_incorrect",
  password_not_set: "profile_error_password_not_set",
  password_change_not_available: "profile_password_google",
};

export function ProfilePage() {
  const { t } = useTranslation();
  const { user, refetchUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(user?.username ?? "");
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const { mutateAsync: updateProfile, isPending: isSaving } =
    useUpdateCurrentUser();
  const { mutateAsync: changePassword, isPending: isChanging } =
    useChangePassword();
  const { mutateAsync: uploadAvatar, isPending: isUploading } =
    useUploadAvatar();

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        data: {
          username: username !== user?.username ? username : undefined,
          display_name: displayName !== (user?.display_name ?? "") ? displayName || undefined : undefined,
          email: email !== user?.email ? email : undefined,
        },
      });
      toast.success(t("profile_saved"));
      await refetchUser();
    } catch {
      toast.error(t("profile_error"));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read file as data URL for the cropper
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setIsCropOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCroppedAvatar = useCallback(
    async (blob: Blob) => {
      try {
        const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
        await uploadAvatar({ data: { file } });
        toast.success(t("profile_avatar_uploaded"));
        await refetchUser();
      } catch {
        toast.error(t("profile_avatar_error"));
      } finally {
        setIsCropOpen(false);
        setCropImageSrc(null);
      }
    },
    [uploadAvatar, t, refetchUser]
  );

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
    <div className="min-h-screen bg-white font-sans">
      <Header leftContent={<BackButton />} />

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-md flex flex-col items-center">
        <div className="w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {t("profile_title")}
          </h1>

          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <button
              type="button"
              className="relative group"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-9 h-9 text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              aria-label={t("profile_avatar_upload")}
              onChange={handleFileSelect}
            />
          </div>

          {/* Profile info */}
          <h2 className="text-lg font-semibold text-gray-900 mb-3 text-center">
            {t("profile_personal_info")}
          </h2>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="display-name" className="text-sm">
                {t("profile_display_name_label")}
              </Label>
              <Input
                id="display-name"
                placeholder={t("profile_display_name_placeholder")}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="rounded-full h-9 px-4 text-sm"
              />
            </div>
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
        </div>
      </main>

      {/* Avatar crop dialog */}
      <AvatarCropDialog
        imageSrc={cropImageSrc}
        open={isCropOpen}
        onOpenChange={(open) => {
          setIsCropOpen(open);
          if (!open) setCropImageSrc(null);
        }}
        onCrop={handleCroppedAvatar}
        isSaving={isUploading}
      />
    </div>
  );
}
