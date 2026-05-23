import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

const SHOW_THRESHOLD = 300; // px scrolled before button appears
const RETURN_TIMEOUT = 3000; // ms to keep "return" mode active

export function ScrollToTop() {
  const [scrollY, setScrollY] = useState(0);
  const [savedY, setSavedY] = useState<number | null>(null);
  // showReturn = true means we just scrolled to top and offer to go back
  const [showReturn, setShowReturn] = useState(false);
  const returnTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // True while the programmatic "scroll to top" animation is still running.
  // We ignore scrollY changes during this window to avoid resetting showReturn early.
  const isScrollingToTopRef = useRef(false);

  // We need showReturn inside the scroll handler — keep a ref synced with it
  // so the handler doesn't get re-attached on every showReturn change.
  const showReturnRef = useRef(showReturn);
  useEffect(() => {
    showReturnRef.current = showReturn;
  }, [showReturn]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrollY(y);

      // If user manually scrolled back down while in return-mode (and we're
      // not programmatically scrolling) — leave return-mode. Doing this in
      // the same event handler that updates scrollY avoids a cascading
      // setState inside a downstream useEffect.
      if (showReturnRef.current && y > SHOW_THRESHOLD && !isScrollingToTopRef.current) {
        setShowReturn(false);
        setSavedY(null);
        clearTimeout(returnTimerRef.current);
      }
      // Once we've actually reached the top, clear the "scrolling" guard
      if (isScrollingToTopRef.current && y === 0) {
        isScrollingToTopRef.current = false;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(returnTimerRef.current), []);

  const handleClick = () => {
    if (showReturn && savedY !== null) {
      // Return to previous position
      window.scrollTo({ top: savedY, behavior: "smooth" });
      setShowReturn(false);
      setSavedY(null);
      clearTimeout(returnTimerRef.current);
    } else {
      // Scroll to top — guard against intermediate scrollY values triggering reset
      isScrollingToTopRef.current = true;
      setSavedY(scrollY);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setShowReturn(true);
      clearTimeout(returnTimerRef.current);
      returnTimerRef.current = setTimeout(() => {
        setShowReturn(false);
        setSavedY(null);
      }, RETURN_TIMEOUT);
    }
  };

  const visible = scrollY > SHOW_THRESHOLD || showReturn;

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="scroll-to-top"
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.75 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={handleClick}
          aria-label={showReturn ? "Вернуться назад" : "Наверх"}
          title={showReturn ? "Вернуться назад" : "Наверх"}
          className="fixed bottom-20 right-4 md:bottom-6 z-[35] w-11 h-11 rounded-full bg-black text-white shadow-lg flex items-center justify-center hover:bg-gray-800 active:scale-95 transition-colors"
        >
          <motion.div
            animate={{ rotate: showReturn ? 180 : 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <ArrowUp className="w-5 h-5" />
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
