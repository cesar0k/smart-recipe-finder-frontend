import { Clock } from "lucide-react";

import { Card } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface RecipeCardProps {
  title: string;
  image: string;
  time: number;
  difficulty: string;
}

export function RecipeCard({
  title,
  image,
  time,
  difficulty,
}: RecipeCardProps) {
  return (
    <Card className="group flex flex-col gap-0 rounded-[24px] border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 p-0">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-[24px] bg-gray-100">
        <OptimizedImage
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full !object-cover !object-center transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-col p-4 space-y-2">
        {/* Title */}
        <h3 className="font-bold text-lg text-gray-900 leading-tight">
          {title}
        </h3>

        {/* Badges */}
        <div className="flex items-center gap-2">
          {/* Cooking time */}
          <div className="flex items-center text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg text-xs font-semibold capitalize tracking-wide">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            {time} min
          </div>

          {/* Difficulty */}
          <div className="flex items-center text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg text-xs font-semibold capitalize tracking-wide">
            {difficulty}
          </div>
        </div>
      </div>
    </Card>
  );
}
