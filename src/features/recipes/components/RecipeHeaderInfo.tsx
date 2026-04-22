import { AlertTriangle, ChefHat, Clock, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { type Recipe } from "@/api/model/recipe";
import { useTranslation } from "react-i18next";
import { getDifficultyKey } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";

interface RecipeHeaderInfoProps {
  recipe: Recipe;
  /** Whether the viewer is allowed to see moderation metadata (status, reject reason) */
  canViewStatus?: boolean;
}

export function RecipeHeaderInfo({
  recipe,
  canViewStatus = false,
}: RecipeHeaderInfoProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const isOwnRecipe = user && recipe.owner_id === user.id;
  const showRejectionBanner =
    canViewStatus &&
    recipe.status === "rejected" &&
    !!recipe.rejection_reason;

  return (
    <div className="space-y-4">
      {showRejectionBanner && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-700">
              {t("recipe_rejected_banner_title")}
            </p>
            <p className="text-sm text-red-700 [overflow-wrap:anywhere]">
              <span className="font-semibold">
                {t("recipe_rejected_reason_label")}
              </span>{" "}
              {recipe.rejection_reason}
            </p>
          </div>
        </div>
      )}

      {recipe.cuisine && (
        <Badge
          variant="secondary"
          className="bg-gray-100 text-gray-600 hover:bg-gray-100 rounded-full px-3 py-1 text-sm"
        >
          {recipe.cuisine}
        </Badge>
      )}

      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.1] break-words">
        {recipe.title}
      </h1>

      {/* Author */}
      {recipe.owner_username && (
        <div className="flex items-center gap-2 text-gray-500">
          <User className="w-4 h-4 text-gray-400" />
          {recipe.owner_id ? (
            <Link
              to={`/user/${recipe.owner_id}`}
              className="text-sm font-medium text-gray-700 hover:underline"
            >
              {recipe.owner_username}
            </Link>
          ) : (
            <span className="text-sm font-medium text-gray-700">
              {recipe.owner_username}
            </span>
          )}
          {isOwnRecipe && (
            <span className="text-xs text-gray-400">
              {t("recipe_author_you")}
            </span>
          )}
        </div>
      )}

      {/* Description */}
      {recipe.description && (
        <p className="text-base text-gray-500 leading-relaxed">
          {recipe.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-gray-500 pt-2">
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full">
          <Clock className="w-5 h-5 text-gray-400" />
          <span className="font-medium text-gray-900">
            {recipe.cooking_time_in_minutes} {t("min")}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full">
          <ChefHat className="w-5 h-5 text-gray-400" />
          <span className="font-medium text-gray-900">
            {recipe.difficulty
              ? t(getDifficultyKey(recipe.difficulty))
              : t("unknown_difficulty")}
          </span>
        </div>
      </div>
    </div>
  );
}
