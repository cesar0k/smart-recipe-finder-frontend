import { Clock, Heart, Pencil, Star, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { getDifficultyKey } from "@/lib/utils";

interface RecipeCardProps {
  title: string;
  image: string;
  /** Smaller thumbnail for faster loading in card grids */
  thumbnail?: string;
  time: number;
  difficulty?: string | null;
  status?: string;
  hasPendingDraft?: boolean;
  ownerUsername?: string | null;
  /** Moderator's reason — shown inline on rejected cards */
  rejectionReason?: string | null;
  averageRating?: number;
  favoritesCount?: number;
  /** Called when "Fix" button is pressed on rejected recipes (owner-only) */
  onResubmit?: () => void;
  /** Called when generic "Edit" button is pressed (e.g. by moderators on any status) */
  onEdit?: () => void;
  /** Called when "Delete" button is pressed */
  onDelete?: () => void;
  /**
   * Optional overlay slot in the image's top-right corner. Used by HomePage
   * to render a heart-toggle without coupling RecipeCard to favorites logic.
   */
  imageOverlay?: React.ReactNode;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500 text-white",
  rejected: "bg-red-500 text-white",
};

export function RecipeCard({
  title,
  image,
  thumbnail,
  time,
  difficulty,
  status,
  hasPendingDraft,
  ownerUsername,
  rejectionReason,
  averageRating = 0,
  favoritesCount = 0,
  onResubmit,
  onEdit,
  onDelete,
  imageOverlay,
}: RecipeCardProps) {
  const { t } = useTranslation();

  const isRejectedWithReason = status === "rejected" && !!rejectionReason;

  // Corner status badge: hidden for rejected-with-reason (the overlay replaces it)
  const statusKey = isRejectedWithReason
    ? null
    : status === "pending"
      ? "recipe_status_pending"
      : status === "rejected"
        ? "recipe_status_rejected"
        : null;

  const showActions = !!onResubmit || !!onEdit || !!onDelete;

  return (
    <Card className="group flex flex-col gap-0 rounded-[24px] border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 p-0">
      {/* clip-path keeps the rounded corners during the inner img's
          group-hover scale transform — overflow-hidden alone leaks them in Chrome. */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 [clip-path:inset(0_round_24px_24px_0_0)]">
        <OptimizedImage
          src={thumbnail || image}
          alt={title}
          className="absolute inset-0 w-full h-full !object-cover !object-center transition-transform duration-500 group-hover:scale-105"
        />
        {statusKey && (
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold z-10 ${STATUS_STYLES[status!] ?? ""}`}
          >
            {t(statusKey)}
          </span>
        )}
        {hasPendingDraft && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500 text-white z-10">
            {t("recipe_pending_draft")}
          </span>
        )}
        {imageOverlay && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
            {imageOverlay}
          </div>
        )}
        {isRejectedWithReason && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-4 text-center text-white">
            <span className="text-sm font-bold uppercase tracking-wide mb-1.5">
              {t("recipe_status_rejected")}
            </span>
            <p className="text-xs leading-snug [overflow-wrap:anywhere]">
              <span className="font-semibold">
                {t("recipe_rejected_reason_label")}
              </span>{" "}
              <span className="line-clamp-3 inline">{rejectionReason}</span>
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          {/* Title + badges */}
          <div className="flex-1 min-w-0 space-y-2">
            <h3 className="font-bold text-lg text-gray-900 leading-tight line-clamp-1 [overflow-wrap:anywhere]">
              {title}
            </h3>

            {/* Stats row — always visible */}
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" />
                {averageRating > 0 ? averageRating.toFixed(1) : "—"}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-current shrink-0" />
                {favoritesCount}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                {time} {t("min")}
              </div>
              <div className="flex items-center text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide">
                {difficulty
                  ? t(getDifficultyKey(difficulty))
                  : t("unknown_difficulty")}
              </div>
              {ownerUsername && (
                <span className="text-xs text-gray-400 truncate">
                  {ownerUsername}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {showActions && (
            <div className="flex items-center gap-1 shrink-0 pt-0.5">
              {onResubmit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onResubmit();
                  }}
                  title={t("my_recipes_fix_and_resubmit")}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit();
                  }}
                  title={t("edit_recipe")}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                  }}
                  title={t("delete_recipe")}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

      </div>
    </Card>
  );
}
