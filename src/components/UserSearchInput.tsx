import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChefHat } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useTranslation } from "react-i18next";
import { useSearchUsers } from "@/api/users/users";
import type { PublicUserResponse } from "@/api/model";

export function UserSearchInput() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={containerRef} className="relative">
      {/* Width animates on focus/blur; initial={false} avoids a stuttery mount-time anim. */}
      <motion.div
        initial={false}
        animate={{ width: isFocused ? 224 : 160 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative"
      >
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <Input
          placeholder={t("user_search_placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (hasContent) setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          className="w-full h-8 pl-8 pr-3 text-xs rounded-full border-gray-200 bg-gray-50/50 focus:bg-white transition-colors"
        />
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="user-search-dropdown"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full mt-2 right-0 w-64 bg-white rounded-2xl border border-gray-200 shadow-lg z-30 overflow-hidden origin-top-right"
          >
            {!isFetching && (!results || results.length === 0) && (
              <div className="px-4 py-3 text-xs text-gray-400 text-center">
                {t("user_search_empty")}
              </div>
            )}

            {results?.map((user) => (
              <motion.button
                key={user.id}
                layout
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
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
