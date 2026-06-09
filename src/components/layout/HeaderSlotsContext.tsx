import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** The header's two configurable slots, plus whether the header shows at all. */
export interface HeaderSlots {
  visible: boolean;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
}

interface HeaderSlotsSetters {
  /** Publish slots (called by pages via useHeaderSlots). */
  setSlots: (slots: { left?: ReactNode; right?: ReactNode }) => void;
  /** Reset to the default hidden/empty state (called on page unmount). */
  reset: () => void;
}

const HIDDEN: HeaderSlots = {
  visible: false,
  leftContent: undefined,
  rightContent: undefined,
};

/*
 * TWO separate contexts on purpose:
 *   - ValueContext changes every time the slots change (the static <Header>
 *     reads it and must re-render to show new content).
 *   - SetterContext holds only stable callbacks and NEVER changes, so pages
 *     that publish slots (useHeaderSlots) do NOT re-render when the slot values
 *     change. Merging them caused an infinite loop: publishing new slots
 *     re-rendered every context consumer (incl. the publishing page), which
 *     produced a fresh slot closure, which re-ran the publish effect, … .
 */
const HeaderSlotsValueContext = createContext<HeaderSlots | null>(null);
const HeaderSlotsSetterContext = createContext<HeaderSlotsSetters | null>(null);

/**
 * Holds the slots for the single static <Header> that the layout renders above
 * the animated page subtree. Pages publish their per-route left/right content
 * here via useHeaderSlots so the header can live OUTSIDE the page-transition
 * motion wrapper (and therefore stay still while the page slides in).
 */
export function HeaderSlotsProvider({ children }: { children: ReactNode }) {
  const [slots, setSlotsState] = useState<HeaderSlots>(HIDDEN);

  // Setters are created once and never change identity.
  const setters = useMemo<HeaderSlotsSetters>(
    () => ({
      setSlots: (next) =>
        setSlotsState({
          visible: true,
          leftContent: next.left,
          rightContent: next.right,
        }),
      reset: () => setSlotsState(HIDDEN),
    }),
    []
  );

  return (
    <HeaderSlotsSetterContext.Provider value={setters}>
      <HeaderSlotsValueContext.Provider value={slots}>
        {children}
      </HeaderSlotsValueContext.Provider>
    </HeaderSlotsSetterContext.Provider>
  );
}

/** Read-only access for the static <Header> that lives in the layout. */
export function useHeaderSlotsValue(): HeaderSlots {
  const ctx = useContext(HeaderSlotsValueContext);
  if (!ctx) {
    throw new Error("useHeaderSlotsValue must be used within HeaderSlotsProvider");
  }
  return ctx;
}

/** Internal: stable setters used by the useHeaderSlots hook to publish/reset. */
export function useHeaderSlotsSetter(): HeaderSlotsSetters {
  const ctx = useContext(HeaderSlotsSetterContext);
  if (!ctx) {
    throw new Error("useHeaderSlots must be used within HeaderSlotsProvider");
  }
  return ctx;
}
