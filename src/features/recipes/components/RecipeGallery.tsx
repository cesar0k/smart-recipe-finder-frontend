import { useState } from "react";
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

interface RecipeGalleryProps {
  images: string[];
  title: string;
}

export function RecipeGallery({ images, title }: RecipeGalleryProps) {
  const [api, setApi] = useState<CarouselApi>();
  const { current, count } = useCarouselCounter(api);
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-gray-100 shadow-sm bg-gray-50 flex flex-col items-center justify-center text-gray-400">
        <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
        <span className="text-sm font-medium opacity-40">No photos yet</span>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <>
        <div 
          className="aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-gray-100 shadow-sm bg-gray-50 cursor-pointer group relative"
          onClick={() => openLightbox(0)}
        >
          <OptimizedImage 
            src={images[0] || ""} 
            alt={title} 
            className="w-full h-full"
            imgClassName="absolute inset-0 w-full h-full !object-cover !object-center transition-transform duration-500 group-hover:scale-105"
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
      <div className="group relative rounded-[2rem] overflow-hidden shadow-sm border border-gray-100">
        <Carousel setApi={setApi} className="w-full" opts={{ loop: true }}>
          <CarouselContent>
            {images.map((url, index) => (
              <CarouselItem key={index}>
                <div 
                  className="aspect-[4/3] w-full bg-gray-50 cursor-zoom-in relative overflow-hidden"
                  onClick={() => openLightbox(index)}
                >
                  <OptimizedImage
                    src={url}
                    alt={`${title} - photo ${index + 1}`}
                    className="w-full h-full"
                    imgClassName="absolute inset-0 w-full h-full !object-cover !object-center"
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