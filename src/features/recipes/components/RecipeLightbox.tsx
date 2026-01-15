import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface RecipeLightboxProps {
  images: string[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecipeLightbox({ images, initialIndex, open, onOpenChange }: RecipeLightboxProps) {
  const [api, setApi] = useState<CarouselApi>();
  const { current, count } = useCarouselCounter(api);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!api) return;
    if (event.key === "ArrowLeft") api.scrollPrev();
    else if (event.key === "ArrowRight") api.scrollNext();
    else if (event.key === "Escape") onOpenChange(false);
  }, [api, onOpenChange]);

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
      <DialogContent className="!max-w-[100vw] !w-screen !h-screen !rounded-none !border-none !p-0 bg-black/95 block z-[100] focus:outline-none [&>button]:hidden">
        
        <VisuallyHidden>
          <DialogTitle>Image Gallery</DialogTitle>
        </VisuallyHidden>

        <div className="contents">
          
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white z-[120] p-2 bg-black/20 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-8 h-8" />
          </button>

          <Carousel 
            setApi={setApi} 
            className="w-full h-full" 
            opts={{ loop: true, startIndex: initialIndex }}
          >
            <CarouselContent className="h-full -ml-0">
              {images.map((url, index) => (
                <CarouselItem key={index} className="h-screen w-full p-0 pl-0 flex items-center justify-center">
                  
                  <div 
                    className="w-full h-full flex items-center justify-center cursor-default"
                    onClick={handleBackdropClick}
                  >
                    <OptimizedImage
                      src={url}
                      alt={`Fullscreen image ${index + 1}`}
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