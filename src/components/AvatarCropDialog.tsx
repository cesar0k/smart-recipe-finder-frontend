import { useRef, useCallback } from "react";
import Cropper from "react-cropper";
import type { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AvatarCropDialogProps {
  imageSrc: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCrop: (croppedBlob: Blob) => void;
  isSaving?: boolean;
}

export function AvatarCropDialog({
  imageSrc,
  open,
  onOpenChange,
  onCrop,
  isSaving,
}: AvatarCropDialogProps) {
  const { t } = useTranslation();
  const cropperRef = useRef<ReactCropperElement>(null);

  const handleSave = useCallback(() => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    cropper
      .getCroppedCanvas({
        width: 512,
        height: 512,
        imageSmoothingQuality: "high",
      })
      .toBlob(
        (blob) => {
          if (blob) onCrop(blob);
        },
        "image/jpeg",
        0.9
      );
  }, [onCrop]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden gap-0">
        {/* Header — symmetric padding */}
        <DialogHeader className="px-5 pt-4 pb-3">
          <DialogTitle>{t("profile_avatar_crop_title")}</DialogTitle>
        </DialogHeader>

        {/* Cropper — edge to edge, no white borders */}
        <div className="w-full bg-gray-900">
          {imageSrc && (
            <Cropper
              ref={cropperRef}
              src={imageSrc}
              style={{ height: 350, width: "100%" }}
              aspectRatio={1}
              viewMode={1}
              dragMode="move"
              cropBoxMovable={false}
              cropBoxResizable={false}
              toggleDragModeOnDblclick={false}
              center
              highlight={false}
              background={false}
              guides={false}
            />
          )}
        </div>

        {/* Footer — same padding as header */}
        <DialogFooter className="px-5 pt-3 pb-4 gap-2">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t("cancel_btn")}
          </Button>
          <Button
            className="rounded-full bg-black hover:bg-gray-800"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? t("profile_saving_btn") : t("profile_save_btn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
