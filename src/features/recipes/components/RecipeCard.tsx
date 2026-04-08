import { Clock, Pencil, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { getDifficultyKey } from "@/lib/utils";

interface RecipeCardProps {
  title: string;
  image: string;
  time: number;
  difficulty?: string | null;
  status?: string;
  hasPendingDraft?: boolean;
  /** Called when "Fix" button is pressed on rejected recipes */
  onResubmit?: () => void;
  /** Called when "Delete" button is pressed on rejected recipes */
  onDelete?: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500 text-white",
  rejected: "bg-red-500 text-white",
};

export function RecipeCard({
  title,
  image,
  time,
  difficulty,
  status,
  hasPendingDraft,
  onResubmit,
  onDelete,
}: RecipeCardProps) {
  const { t } = useTranslation();

  const statusKey =
    status === "pending"
      ? "recipe_status_pending"
      : status === "rejected"
        ? "recipe_status_rejected"
        : null;

  const showActions = status === "rejected" && (onResubmit || onDelete);

  return (
    <Card className="group flex flex-col gap-0 rounded-[24px] border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 p-0">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-[24px] bg-gray-100">
        <OptimizedImage
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full !object-cover !object-center transition-transform duration-500 group-hover:scale-105"
        />
        {statusKey && (
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold ${STATUS_STYLES[status!] ?? ""}`}
          >
            {t(statusKey)}
          </span>
        )}
        {hasPendingDraft && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500 text-white">
            {t("recipe_pending_draft")}
          </span>
        )}
      </div>

      <div className="flex flex-col p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          {/* Title + badges */}
          <div className="flex-1 min-w-0 space-y-2">
            <h3 className="font-bold text-lg text-gray-900 leading-tight line-clamp-1 [overflow-wrap:anywhere]">
              {title}
            </h3>

            <div className="flex items-center gap-2">
              <div className="flex items-center text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                {time} {t("min")}
              </div>
              <div className="flex items-center text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide">
                {difficulty
                  ? t(getDifficultyKey(difficulty))
                  : t("unknown_difficulty")}
              </div>
            </div>
          </div>

          {/* Action buttons for rejected recipes */}
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
