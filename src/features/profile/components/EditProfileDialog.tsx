import { useState, useRef, useCallback } from "react";
import { Camera, Upload, User } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AvatarCropDialog } from "@/components/AvatarCropDialog";
import { useUpdateCurrentUser, useUploadAvatar } from "@/api/users/users";
import { useAuth } from "@/lib/auth/auth-context";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
  const { t } = useTranslation();
  const { user, refetchUser } = useAuth();

  const [username, setUsername] = useState(user?.username ?? "");
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: updateProfile, isPending: isSaving } = useUpdateCurrentUser();
  const { mutateAsync: uploadAvatar, isPending: isUploading } = useUploadAvatar();

  const isPending = isSaving || isUploading;

  // Reset form when dialog opens
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setUsername(user?.username ?? "");
      setDisplayName(user?.display_name ?? "");
    }
    onOpenChange(next);
  };

  const readFileForCrop = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setIsCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFileForCrop(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const { getRootProps, isDragActive } = useDropzone({
    onDrop: (files) => { if (files[0]) readFileForCrop(files[0]); },
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [], "image/heic": [], "image/heif": [] },
    noClick: true,
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleCroppedAvatar = useCallback(async (blob: Blob) => {
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
  }, [uploadAvatar, t, refetchUser]);

  const handleSave = async () => {
    try {
      await updateProfile({
        data: {
          username: username !== user?.username ? username : undefined,
          display_name: displayName !== (user?.display_name ?? "")
            ? displayName || undefined
            : undefined,
        },
      });
      toast.success(t("profile_saved"));
      await refetchUser();
      onOpenChange(false);
    } catch {
      toast.error(t("profile_error"));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>{t("edit_profile_title")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            {/* Avatar */}
            <div className="flex justify-center">
              <div
                {...getRootProps()}
                className="relative group cursor-pointer"
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-9 h-9 text-gray-400" />
                  </div>
                )}
                <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-opacity ${
                  isDragActive ? "opacity-100 bg-black/50" : "opacity-0 group-hover:opacity-100 bg-black/40"
                }`}>
                  {isDragActive
                    ? <Upload className="w-5 h-5 text-white" />
                    : <Camera className="w-5 h-5 text-white" />}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Display Name */}
            <div className="space-y-1.5">
              <Label className="text-sm">{t("profile_display_name_label")}</Label>
              <Input
                placeholder={t("profile_display_name_placeholder")}
                autoCapitalize="none"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="rounded-full h-10 px-4"
              />
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <Label className="text-sm">{t("profile_username_label")}</Label>
              <Input
                placeholder={t("profile_username_placeholder")}
                autoCapitalize="none"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-full h-10 px-4"
              />
            </div>

            {/* Save */}
            <Button
              className="w-full rounded-full h-10 bg-black hover:bg-gray-800"
              onClick={handleSave}
              disabled={isPending}
            >
              {isSaving ? t("form_saving_btn") : t("profile_save_btn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AvatarCropDialog
        open={isCropOpen}
        imageSrc={cropImageSrc}
        onOpenChange={(v) => { if (!v) { setIsCropOpen(false); setCropImageSrc(null); } }}
        onCrop={handleCroppedAvatar}
        isSaving={isUploading}
      />
    </>
  );
}
