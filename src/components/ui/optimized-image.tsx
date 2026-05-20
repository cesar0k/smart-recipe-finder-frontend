import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ImageIcon, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { imageCache } from "@/lib/image-cache";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  useObjectContain?: boolean;
  /** Low-res thumbnail shown instantly while the full image loads in the background */
  thumbnailSrc?: string;
  /**
   * Lightbox mode — skip the grey Skeleton (which looks bad on a dark backdrop).
   * Falls back to a blurred thumbnail (if available) or a centred spinner.
   */
  lightbox?: boolean;
  /** Called with the HTMLImageElement once the image has loaded successfully */
  onImageLoad?: (img: HTMLImageElement) => void;
}

export function OptimizedImage({
  src,
  alt,
  className,
  imgClassName,
  useObjectContain = false,
  thumbnailSrc,
  lightbox = false,
  onImageLoad,
  ...props
}: OptimizedImageProps) {
  const { t } = useTranslation();
  const imgRef = useRef<HTMLImageElement>(null);

  // If src is empty/falsy, skip loading entirely and show fallback
  const isEmpty = !src || !src.trim();
  const cached = !isEmpty && imageCache.has(src);

  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(isEmpty);

  // Progressive loading: thumbnail loaded first, then full replaces it
  const hasThumb = !!thumbnailSrc && thumbnailSrc !== src;
  const thumbCached = hasThumb && imageCache.has(thumbnailSrc);
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [fullLoaded, setFullLoaded] = useState(false);

  // Preload full image in background when we have a thumbnail
  useEffect(() => {
    if (!hasThumb || isEmpty || cached) return;

    const img = new Image();
    img.src = src;

    if (img.complete && img.naturalWidth > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFullLoaded(true);
      imageCache.add(src);
      return;
    }

    img.onload = () => {
      setFullLoaded(true);
      imageCache.add(src);
    };

    return () => {
      img.onload = null;
    };
  }, [src, hasThumb, isEmpty, cached]);

  // When the real <img> element mounts or src changes, check if the
  // browser already has the pixels (works in all browsers, including Safari).
  const imgCallbackRef = useCallback(
    (node: HTMLImageElement | null) => {
      (imgRef as React.MutableRefObject<HTMLImageElement | null>).current = node;
      if (node && node.complete && node.naturalWidth > 0) {
        setIsLoaded(true);
        imageCache.add(src);
        onImageLoad?.(node);
      }
    },
    [src, onImageLoad]
  );

  // Safety net: re-check after paint in case `complete` flipped late
  // (Safari disk-cache edge case).
  useEffect(() => {
    if (isLoaded) return;
    const el = imgRef.current;
    if (!el) return;

    // Check right away (microtask after commit)
    if (el.complete && el.naturalWidth > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoaded(true);
      imageCache.add(src);
      onImageLoad?.(el);
      return;
    }

    // And once more after a frame, covers Safari's deferred decode
    const id = requestAnimationFrame(() => {
      if (el.complete && el.naturalWidth > 0) {
        setIsLoaded(true);
        imageCache.add(src);
        onImageLoad?.(el);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [src, isLoaded, onImageLoad]);

  const handleLoad = () => {
    setIsLoaded(true);
    imageCache.add(src);
    if (imgRef.current) onImageLoad?.(imgRef.current);
  };

  const wrapperClass = cn(
    "relative overflow-hidden",
    className ? className : "w-full h-full bg-gray-100"
  );

  const baseImgClass = cn(
    !imgClassName && "w-full h-full",
    !imgClassName && (useObjectContain ? "object-contain" : "object-cover"),
    imgClassName
  );

  // Progressive mode: show thumbnail first, then crossfade to full
  if (hasThumb && !cached) {
    const showFull = fullLoaded || isLoaded;

    return (
      <div className={wrapperClass}>
        {/* Placeholder while neither thumb nor full is ready.
            Lightbox uses a spinner on its dark backdrop instead of a grey skeleton. */}
        {!thumbLoaded && !showFull && !hasError && (
          lightbox ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
            </div>
          ) : (
            <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
          )
        )}

        {/* Thumbnail layer — visible until full loads. In lightbox mode we
            blur it so the low-res image doesn't look pixelated full-screen. */}
        <img
          src={thumbnailSrc}
          alt={alt}
          loading={thumbCached ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => {
            setThumbLoaded(true);
            imageCache.add(thumbnailSrc);
          }}
          onError={() => setHasError(true)}
          className={cn(
            "absolute inset-0 transition-opacity duration-300",
            baseImgClass,
            lightbox && !showFull && "blur-xl scale-110",
            thumbLoaded && !showFull ? "opacity-100" : !showFull ? "opacity-0" : "opacity-0",
            hasError && "hidden",
          )}
          {...props}
        />

        {/* Full image layer — fades in on top of thumbnail */}
        <img
          ref={imgCallbackRef}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={() => setHasError(true)}
          className={cn(
            "absolute inset-0 transition-opacity duration-[400ms]",
            baseImgClass,
            showFull ? "opacity-100" : "opacity-0",
            hasError && "hidden",
          )}
          {...props}
        />

        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
            <ImageIcon className="w-10 h-10 mb-2 text-gray-300" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">{t("no_image")}</span>
          </div>
        )}
      </div>
    );
  }

  // Standard mode: single image with skeleton
  return (
    <div className={wrapperClass}>

      {!isLoaded && !hasError && (
        lightbox ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
          </div>
        ) : (
          <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
        )
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
          "transition-opacity",
          cached ? "duration-150" : "duration-[400ms]",
          baseImgClass,
          isLoaded ? "opacity-100" : "opacity-0",
          hasError && "hidden",
        )}
        {...props}
      />

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
          <ImageIcon className="w-10 h-10 mb-2 text-gray-300" />
          <span className="text-xs font-medium uppercase tracking-wider text-gray-400">{t("no_image")}</span>
        </div>
      )}
    </div>
  );
}
