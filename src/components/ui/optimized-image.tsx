import { useState } from "react";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  useObjectContain?: boolean;
}

export function OptimizedImage({ 
  src, 
  alt, 
  className,
  imgClassName, 
  useObjectContain = false, 
  ...props 
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const wrapperClass = cn(
    "relative overflow-hidden",
    className ? className : "w-full h-full bg-gray-100"
  );

  return (
    <div className={wrapperClass}>
      
      {!isLoaded && !hasError && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
      )}

      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={cn(
          "transition-opacity duration-500",
          !imgClassName && "w-full h-full",
          !imgClassName && (useObjectContain ? "object-contain" : "object-cover"),
          
          isLoaded ? "opacity-100" : "opacity-0",
          hasError && "hidden",
          imgClassName
        )}
        {...props}
      />

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
          <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
          <span className="text-[10px] font-medium uppercase tracking-wider opacity-50">No Image</span>
        </div>
      )}
    </div>
  );
}