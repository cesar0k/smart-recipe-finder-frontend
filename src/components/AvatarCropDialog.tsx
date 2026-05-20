import { useRef, useCallback, useState } from "react";
import Cropper from "react-cropper";
import type { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { useTranslation } from "react-i18next";
import { ZoomIn, ZoomOut } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const MIN_ZOOM = 0;
const MAX_ZOOM = 100;

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

  // Zoom range: minRatio..maxRatio mapped to slider 0..100
  const zoomRangeRef = useRef({ min: 1, max: 3 });
  const [sliderValue, setSliderValue] = useState(0);

  // Convert slider 0..100 to actual zoom ratio
  const sliderToRatio = (val: number) => {
    const { min, max } = zoomRangeRef.current;
    return min + (val / 100) * (max - min);
  };

  // Convert actual zoom ratio to slider 0..100
  const ratioToSlider = (ratio: number) => {
    const { min, max } = zoomRangeRef.current;
    if (max <= min) return 0;
    return Math.round(((ratio - min) / (max - min)) * 100);
  };

  // Called once when cropper is ready — capture the initial (fit-to-view) zoom
  const handleReady = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    const imageData = cropper.getImageData();
    const canvasData = cropper.getCanvasData();
    const fitRatio = canvasData.width / imageData.naturalWidth;

    zoomRangeRef.current = { min: fitRatio, max: fitRatio * 3 };
    setSliderValue(0);
  };

  // Sync slider when user scrolls the mouse wheel
  const handleZoom = useCallback(
    (e: Cropper.ZoomEvent<HTMLImageElement>) => {
      const newRatio = e.detail.ratio;
      const { min, max } = zoomRangeRef.current;

      // Clamp zoom within range
      if (newRatio < min || newRatio > max) {
        e.preventDefault();
        return;
      }

      setSliderValue(ratioToSlider(newRatio));
    },
    [],
  );

  // Slider change → zoom cropper
  const handleSliderChange = (value: number[]) => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    const val = value[0] ?? 0;
    setSliderValue(val);
    cropper.zoomTo(sliderToRatio(val));
  };

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
        0.9,
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
              ready={handleReady}
              zoom={handleZoom}
            />
          )}
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 px-5 pt-3">
          <ZoomOut className="w-4 h-4 text-gray-400 shrink-0" />
          <Slider
            value={[sliderValue]}
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={1}
            onValueChange={handleSliderChange}
            className="flex-1"
          />
          <ZoomIn className="w-4 h-4 text-gray-400 shrink-0" />
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
            {t("profile_save_btn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
