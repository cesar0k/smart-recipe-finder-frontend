import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { imageCache } from "@/lib/image-cache";

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
  const { t } = useTranslation();
  const imgRef = useRef<HTMLImageElement>(null);
  const cached = imageCache.has(src);

  const [isLoaded, setIsLoaded] = useState(cached);
  const [hasError, setHasError] = useState(false);

  // When the real <img> element mounts or src changes, check if the
  // browser already has the pixels (works in all browsers, including Safari).
  const imgCallbackRef = useCallback(
    (node: HTMLImageElement | null) => {
      (imgRef as React.MutableRefObject<HTMLImageElement | null>).current = node;
      if (node && node.complete && node.naturalWidth > 0) {
        setIsLoaded(true);
        imageCache.add(src);
      }
    },
    [src]
  );

  // Safety net: re-check after paint in case `complete` flipped late
  // (Safari disk-cache edge case).
  useEffect(() => {
    if (isLoaded) return;
    const el = imgRef.current;
    if (!el) return;

    // Check right away (microtask after commit)
    if (el.complete && el.naturalWidth > 0) {
      setIsLoaded(true);
      imageCache.add(src);
      return;
    }

    // And once more after a frame, covers Safari's deferred decode
    const id = requestAnimationFrame(() => {
      if (el.complete && el.naturalWidth > 0) {
        setIsLoaded(true);
        imageCache.add(src);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [src, isLoaded]);

  const handleLoad = () => {
    setIsLoaded(true);
    imageCache.add(src);
  };

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
        ref={imgCallbackRef}
        src={src}
        alt={alt}
        // Skip lazy loading for images we know are cached —
        // Safari may never fire onLoad for lazy+cached images.
        loading={cached ? "eager" : "lazy"}
        decoding="async"
        onLoad={handleLoad}
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
          <span className="text-[10px] font-medium uppercase tracking-wider opacity-50">{t("no_image")}</span>
        </div>
      )}
    </div>
  );
}
