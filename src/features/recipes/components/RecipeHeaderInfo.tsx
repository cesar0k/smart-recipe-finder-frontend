import { ChefHat, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type Recipe } from "@/api/model/recipe";
import { useTranslation } from "react-i18next";

export function RecipeHeaderInfo({ recipe }: { recipe: Recipe }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
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
            {t(`difficulty.${recipe.difficulty}` as any)}
          </span>
        </div>
      </div>
    </div>
  );
}
