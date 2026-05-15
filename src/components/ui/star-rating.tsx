import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Star rating display (readonly) or interactive picker.
 *
 * readonly + size="sm" → compact display on RecipeCard (filled/empty stars based on avg)
 * interactive           → hover preview + click to rate on RecipePage
 */
export function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const starSize = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  const gap = size === "sm" ? "gap-0.5" : "gap-1";

  const displayValue = !readonly && hovered > 0 ? hovered : value;

  return (
    <div
      className={cn("flex items-center", gap, className)}
      onMouseLeave={() => !readonly && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(displayValue);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            className={cn(
              "transition-transform duration-100",
              !readonly && "cursor-pointer hover:scale-110 focus:outline-none",
              readonly && "cursor-default pointer-events-none"
            )}
            aria-label={readonly ? undefined : `Rate ${star} stars`}
          >
            <Star
              className={cn(
                starSize,
                "transition-colors duration-150",
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-none text-gray-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
