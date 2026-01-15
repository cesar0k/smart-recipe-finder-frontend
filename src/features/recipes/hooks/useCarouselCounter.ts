import { useState, useEffect } from "react";
import type { CarouselApi } from "@/components/ui/carousel";

export function useCarouselCounter(api: CarouselApi | undefined) {
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    const handleSelect = () => {
      if (api) {
        setCurrent(api.selectedScrollSnap() + 1);
      }
    };

    api.on("select", handleSelect);

    return () => {
      if (api) {
        api.off("select", handleSelect);
      }
    };
  }, [api]);

  return { current, count };
}
