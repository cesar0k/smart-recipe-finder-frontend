import { useState, useRef, useEffect, useMemo, useCallback, useImperativeHandle, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChefHat, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useTranslation } from "react-i18next";
import { useSearchUsers } from "@/api/users/users";
import type { PublicUserResponse } from "@/api/model";

export interface UserSearchInputHandle {
  focus: () => void;
  clear: () => void;
}

export const UserSearchInput = forwardRef<UserSearchInputHandle, { autoFocus?: boolean; fullWidth?: boolean }>(
function UserSearchInput({ autoFocus = false, fullWidth = false }, ref) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => { setQuery(""); setDebouncedQuery(""); setIsOpen(false); },
  }));

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Open dropdown only when we have something to show
  // (don't open on debouncedQuery change — wait for data)
  useEffect(() => {
    if (debouncedQuery.length === 0) {
      // Syncing dropdown visibility with the debounced query is the actual
      // purpose of this effect — setState here is intentional.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(false);
    }
  }, [debouncedQuery]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const { data: results, isFetching } = useSearchUsers(
    { q: debouncedQuery, limit: 5 },
    {
      query: {
        enabled: debouncedQuery.length > 0,
        placeholderData: (prev: PublicUserResponse[] | undefined) => prev,
      },
    }
  );

  // Open dropdown once data is ready (not while first fetch in progress)
  const hasContent =
    debouncedQuery.length > 0 && (!isFetching || (results && results.length > 0));

  useEffect(() => {
    if (hasContent) {
      // Same as above — opening the dropdown when data arrives IS the effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(true);
    }
  }, [hasContent]);

  const handleSelect = useCallback(
    (userId: number) => {
      setIsOpen(false);
      setQuery("");
      navigate(`/user/${userId}`);
    },
    [navigate]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  // Compact sizing kicks in below 900px (not just true mobile <768): in the
  // 768–900px range the desktop header is crowded, and a wide search box would
  // collide with the notifications / language / avatar cluster. There we keep
  // the box narrow (placeholder may sit closer to the edges but won't push the
  // header into overflow). Recomputed on resize so rotating / resizing updates
  // it. Lazy initial value so SSR / first paint is correct.
  const [compact, setCompact] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 900,
  );
  useEffect(() => {
    const onResize = () => setCompact(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Resting width must fit the placeholder so it never truncates with an ugly
  // "…". We measure the actual placeholder text (language-proof: RU "Поиск
  // людей..." is wider than EN "Find user...") with a canvas and add room for
  // the search icon (left) + clear-button gutter (right) ≈ 60px. Clamped so a
  // very long translation can't blow out the header. In compact mode we cap it
  // tighter. Pure computation (no side effects) → useMemo, not an effect.
  const placeholder = t("user_search_placeholder");
  const collapsedW = useMemo(() => {
    const fallback = compact ? 160 : 200;
    if (typeof document === "undefined") return fallback;
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return fallback;
    // Match the rendered input font. The base Input is `text-base md:text-sm`,
    // so the box is 16px on mobile and 14px on desktop (our `text-xs` is
    // overridden by `md:text-sm` at the md breakpoint). Measure with the larger
    // of the two for the active mode so the box never under-sizes.
    ctx.font = `${compact ? 16 : 14}px ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif`;
    // +72 = left icon gutter (~32) + right clear-button gutter (~28) + ~12 slack.
    const needed = Math.ceil(ctx.measureText(placeholder).width) + 72;
    const min = compact ? 150 : 190;
    const max = compact ? 210 : 280;
    return Math.min(max, Math.max(min, needed));
  }, [placeholder, compact]);
  // Focused state gives a bit more room to type; never narrower than rest.
  const expandedW = Math.max(
    collapsedW + (compact ? 28 : 44),
    compact ? 168 : 224,
  );

  return (
    <div ref={containerRef} className={fullWidth ? "relative w-full" : "relative"}>
      {/* Width animates on focus/blur; initial={false} avoids a stuttery mount-time anim. */}
      <motion.div
        initial={false}
        animate={fullWidth ? { width: "100%" } : { width: isFocused ? expandedW : collapsedW }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative"
      >
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <Input
          ref={inputRef}
          placeholder={t("user_search_placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (hasContent) setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          className="w-full h-8 pl-8 pr-7 text-xs rounded-full border-gray-200 bg-white transition-colors hover:border-gray-300 hover:bg-gray-50 focus:bg-white"
        />
        {query.length > 0 && (
          <button
            type="button"
            onMouseDown={(e) => {
              // Prevent the input from losing focus before our handler runs
              e.preventDefault();
            }}
            onClick={() => {
              setQuery("");
              setDebouncedQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            aria-label={t("close_btn")}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="user-search-dropdown"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute top-full mt-2 right-0 bg-white rounded-2xl border border-gray-200 shadow-lg z-30 overflow-hidden origin-top-right ${fullWidth ? "left-0 w-full" : "w-64"}`}
          >
            {!isFetching && (!results || results.length === 0) && (
              <div className="px-4 py-3 text-xs text-gray-400 text-center">
                {t("user_search_empty")}
              </div>
            )}

            {results?.map((user) => (
              <button
                key={user.id}
                type="button"
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                onClick={() => handleSelect(user.id)}
              >
                <UserAvatar
                  src={user.avatar_url}
                  username={user.username}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.username}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <ChefHat className="w-3 h-3" />
                    {t("user_recipe_count", { count: user.recipe_count })}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
UserSearchInput.displayName = "UserSearchInput";
