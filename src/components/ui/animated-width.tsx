import { useEffect, useLayoutEffect, useRef } from "react";
import { animate, motion, useMotionValue } from "framer-motion";

interface AnimatedWidthProps {
  /** When false, collapses to width: 0 + opacity: 0 + inert. Stays mounted. */
  open?: boolean;
  duration?: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * Wrapper that animates its own width to match the child's intrinsic
 * width. Used for buttons whose label changes (FavoriteButton, Sort)
 * and for toggled slide-in/out (Sort in search view).
 */
export function AnimatedWidth({
  open = true,
  duration = 0.25,
  className,
  children,
}: AnimatedWidthProps) {
  const childRef = useRef<HTMLDivElement>(null);
  const targetWidthRef = useRef(0);
  const width = useMotionValue(0);
  const opacity = useMotionValue(open ? 1 : 0);

  useEffect(() => {
    if (open) {
      animate(width, targetWidthRef.current, { duration, ease: "easeOut" });
      animate(opacity, 1, { duration, ease: "easeOut" });
    } else {
      animate(width, 0, { duration, ease: "easeOut" });
      animate(opacity, 0, { duration, ease: "easeOut" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, duration]);

  useLayoutEffect(() => {
    const node = childRef.current;
    if (!node) return;

    const apply = (w: number) => {
      targetWidthRef.current = w;
      if (open) {
        animate(width, w, { duration, ease: "easeOut" });
      }
    };

    apply(node.getBoundingClientRect().width);

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) apply(entry.contentRect.width);
    });
    ro.observe(node);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, duration]);

  return (
    <motion.div
      style={{ width, opacity }}
      {...(open ? {} : { "aria-hidden": "true" as const, inert: true })}
      className={
        className
          ? `overflow-hidden shrink-0 ${className}`
          : "overflow-hidden shrink-0"
      }
    >
      <div ref={childRef} className="inline-flex">
        {children}
      </div>
    </motion.div>
  );
}
