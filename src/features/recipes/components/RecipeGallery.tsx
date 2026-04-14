import { useState, useCallback, useEffect, useRef } from "react";
import { ImageIcon } from "lucide-react";
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
import { RecipeLightbox } from "./RecipeLightbox";
import { useTranslation } from "react-i18next";

const FALLBACK_RATIO = 4 / 3;
// iOS-like spring curve: gentle start, smooth deceleration
const TRANSITION = "aspect-ratio 0.4s cubic-bezier(0.2, 0, 0, 1)";

interface RecipeGalleryProps {
  images: string[];
  thumbnails?: string[];
  title: string;
}

export function RecipeGallery({ images, thumbnails, title }: RecipeGalleryProps) {
  const [api, setApi] = useState<CarouselApi>();
  const { current, count } = useCarouselCounter(api);
  const { t } = useTranslation();

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Stores the natural aspect ratio for each image by index.
  // null = not yet loaded.
  const ratiosRef = useRef<(number | null)[]>([]);

  // The aspect ratio currently applied to the container.
  const [activeRatio, setActiveRatio] = useState(FALLBACK_RATIO);

  // Ensure the array is always the right length
  useEffect(() => {
    const len = images?.length ?? 0;
    if (ratiosRef.current.length !== len) {
      ratiosRef.current = new Array(len).fill(null);
    }
  }, [images?.length]);

  const handleImageLoad = useCallback(
    (index: number) => (img: HTMLImageElement) => {
      if (img.naturalWidth && img.naturalHeight) {
        const ratio = img.naturalWidth / img.naturalHeight;
        ratiosRef.current[index] = ratio;

        // If this is the currently visible slide (or the first load),
        // update the container immediately.
        if (index === 0 && activeRatio === FALLBACK_RATIO) {
          setActiveRatio(ratio);
        }
      }
    },
    [activeRatio],
  );

  // Listen for carousel slide changes and animate to the new slide's ratio.
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      const idx = api.selectedScrollSnap();
      const ratio = ratiosRef.current[idx];
      if (ratio) {
        setActiveRatio(ratio);
      }
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-gray-100 shadow-sm bg-gray-50 flex flex-col items-center justify-center text-gray-400">
        <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
        <span className="text-sm font-medium opacity-40">
          {t("no_photos_yet")}
        </span>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    aspectRatio: `${activeRatio}`,
    transition: TRANSITION,
    willChange: "aspect-ratio",
    contain: "layout style",
  };

  // Single image
  if (images.length === 1) {
    return (
      <>
        <div
          className="w-full overflow-hidden rounded-[2rem] border border-gray-100 shadow-sm bg-gray-50 cursor-pointer group relative"
          style={containerStyle}
          onClick={() => openLightbox(0)}
        >
          <OptimizedImage
            src={images[0] || ""}
            thumbnailSrc={thumbnails?.[0]}
            alt={title}
            className="w-full h-full"
            imgClassName="absolute inset-0 w-full h-full !object-cover !object-center transition-transform duration-500 group-hover:scale-105"
            onImageLoad={handleImageLoad(0)}
          />
        </div>

        <RecipeLightbox
          images={images}
          initialIndex={0}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      </>
    );
  }

  // Carousel
  return (
    <>
      <div
        className="group relative rounded-[2rem] overflow-hidden shadow-sm border border-gray-100"
        style={containerStyle}
      >
        <Carousel setApi={setApi} className="w-full h-full" opts={{ loop: true }}>
          <CarouselContent className="h-full">
            {images.map((url, index) => (
              <CarouselItem key={index} className="h-full">
                <div
                  className="w-full h-full bg-gray-50 cursor-zoom-in relative overflow-hidden"
                  onClick={() => openLightbox(index)}
                >
                  <OptimizedImage
                    src={url}
                    thumbnailSrc={thumbnails?.[index]}
                    alt={t("recipe_photo_alt", {
                      title,
                      index: index + 1,
                    })}
                    className="w-full h-full"
                    imgClassName="absolute inset-0 w-full h-full !object-cover !object-center"
                    onImageLoad={handleImageLoad(index)}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border-transparent shadow-md h-10 w-10" />
            <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border-transparent shadow-md h-10 w-10" />
          </div>
        </Carousel>

        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full pointer-events-none z-10 transition-opacity duration-300">
          {current} / {count}
        </div>
      </div>

      <RecipeLightbox
        images={images}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </>
  );
}
