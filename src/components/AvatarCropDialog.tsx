import { useRef, useCallback, useEffect, useState } from "react";
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
// Matches the dialog exit animation duration in dialog.tsx (duration-200).
const EXIT_ANIMATION_MS = 200;

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

  // Keep the Cropper mounted through the dialog's exit animation: parent
  // typically nulls imageSrc on close, which would otherwise unmount it
  // instantly. We delay the local null by EXIT_ANIMATION_MS.
  const [renderedSrc, setRenderedSrc] = useState<string | null>(imageSrc);
  useEffect(() => {
    if (imageSrc) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRenderedSrc(imageSrc);
      return;
    }
    const timer = setTimeout(() => setRenderedSrc(null), EXIT_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [imageSrc]);

  // Zoom range: minRatio..maxRatio mapped to slider 0..100.
  const zoomRangeRef = useRef({ min: 1, max: 3 });
  const [sliderValue, setSliderValue] = useState(0);

  const sliderToRatio = (val: number) => {
    const { min, max } = zoomRangeRef.current;
    return min + (val / 100) * (max - min);
  };

  const ratioToSlider = (ratio: number) => {
    const { min, max } = zoomRangeRef.current;
    if (max <= min) return 0;
    return Math.round(((ratio - min) / (max - min)) * 100);
  };

  // Pick fit-cover as min zoom (image's shorter side exactly covers the crop
  // box) and 4× of that as max — standard "zoom out until photo just reaches
  // the frame" UX. viewMode=1 below also enforces the lower bound.
  const handleReady = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    const imageData = cropper.getImageData();
    const cropBoxData = cropper.getCropBoxData();

    const cropBoxSize = Math.min(cropBoxData.width, cropBoxData.height);
    // Use rendered dims (account for EXIF orientation): re-derive the ratio
    // that makes shortEdge == cropBoxSize from the current rendering.
    const shortEdge = Math.min(imageData.width, imageData.height);
    const currentRatio = imageData.width / imageData.naturalWidth;
    const fitCoverRatio = (currentRatio * cropBoxSize) / shortEdge;

    zoomRangeRef.current = {
      min: fitCoverRatio,
      max: fitCoverRatio * 4,
    };
    cropper.zoomTo(fitCoverRatio);
    setSliderValue(0);
  };

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

        {/* Cropper — edge to edge. Uses renderedSrc so it survives the
            dialog exit animation. */}
        <div className="w-full bg-gray-900">
          {renderedSrc && (
            <Cropper
              ref={cropperRef}
              src={renderedSrc}
              style={{ height: 350, width: "100%" }}
              aspectRatio={1}
              // viewMode=1: image cannot be smaller than the crop box;
              // handleReady seeds zoom at fit-cover.
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
