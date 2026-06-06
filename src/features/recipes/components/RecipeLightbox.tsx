import { useState, useEffect, useCallback } from "react";
import { Download, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useCarouselCounter } from "../hooks/useCarouselCounter";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useTranslation } from "react-i18next";

interface RecipeLightboxProps {
  images: string[];
  thumbnails?: string[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecipeLightbox({
  images,
  thumbnails,
  initialIndex,
  open,
  onOpenChange,
}: RecipeLightboxProps) {
  const [api, setApi] = useState<CarouselApi>();
  const { current, count } = useCarouselCounter(api);
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    // `current` is 1-based (from useCarouselCounter).
    const url = images[current - 1];
    if (!url || downloading) return;
    setDownloading(true);
    try {
      // The image lives on the S3/MinIO origin, so a plain
      // `<a download>` would be ignored cross-origin and just open the
      // image in a new tab. Fetch the bytes and download a blob instead —
      // the same GET the <img> already performs, so CORS is satisfied.
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      // Derive a sensible filename from the URL path, fall back to a default.
      const pathname = new URL(url, window.location.href).pathname;
      const name = pathname.split("/").pop() || "recipe-image";

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Fallback: open in a new tab so the user can save manually.
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  }, [images, current, downloading]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!api) return;
      if (event.key === "ArrowLeft") api.scrollPrev();
      else if (event.key === "ArrowRight") api.scrollNext();
      else if (event.key === "Escape") onOpenChange(false);
    },
    [api, onOpenChange]
  );

  useEffect(() => {
    if (open) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[100vw] !w-screen !h-[100dvh] !rounded-none !border-none !p-0 bg-black/95 block z-[100] focus:outline-none [&>button]:hidden">
        <VisuallyHidden>
          <DialogTitle>{t("image_gallery_title")}</DialogTitle>
        </VisuallyHidden>

        <div className="contents">
          {/* Top-right controls: download + close */}
          <div className="absolute top-4 right-4 z-[120] flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="text-white/70 hover:text-white p-2 bg-black/20 rounded-full hover:bg-white/10 transition-colors cursor-pointer disabled:cursor-default disabled:opacity-60"
              aria-label={t("download_image_label")}
              title={t("download_image_label")}
            >
              {downloading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <Download className="w-8 h-8" />
              )}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-white/70 hover:text-white p-2 bg-black/20 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label={t("close_image_label")}
            >
              <X className="w-8 h-8" />
            </button>
          </div>

          <Carousel
            setApi={setApi}
            className="w-full h-full"
            opts={{ loop: true, startIndex: initialIndex }}
          >
            {/*
              Force BOTH axes hidden + contain overscroll. The default carousel
              content is `overflow-x-hidden overflow-y-visible`, but per CSS spec
              a non-visible value on one axis coerces the paired `visible` axis
              to `auto`, turning the Embla container into a scroll port. On iOS
              that scroll port let the image be panned horizontally even when it
              fit the screen (the reported "horizontal scroll in the lightbox"
              bug). A fullscreen black lightbox has no hover-shadow bleed to
              preserve, so we clip both axes and stop overscroll chaining.
              `touch-pan-y` lets vertical native gestures through while leaving
              horizontal swipes to Embla's own pointer-based handling.
            */}
            <CarouselContent
              className="h-full -ml-0"
              outerClassName="overflow-hidden overscroll-contain touch-pan-y"
            >
              {images.map((url, index) => (
                <CarouselItem
                  key={index}
                  className="h-screen w-full p-0 pl-0 flex items-center justify-center"
                >
                  <div
                    className="w-full h-full flex items-center justify-center cursor-default"
                    onClick={handleBackdropClick}
                  >
                    <OptimizedImage
                      src={url}
                      thumbnailSrc={thumbnails?.[index]}
                      lightbox
                      alt={t("fullscreen_image_alt", { index: index + 1 })}
                      className="flex items-center justify-center w-full h-full bg-transparent pointer-events-none"
                      imgClassName="max-w-full max-h-screen w-auto h-auto object-contain shadow-2xl pointer-events-auto cursor-grab active:cursor-grabbing"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            <CarouselPrevious className="left-4 bg-white/10 hover:bg-white/20 border-none text-white h-12 w-12 hidden sm:flex z-[120]" />
            <CarouselNext className="right-4 bg-white/10 hover:bg-white/20 border-none text-white h-12 w-12 hidden sm:flex z-[120]" />
          </Carousel>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/90 text-sm font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-md pointer-events-none z-[110]">
            {current} / {count}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
