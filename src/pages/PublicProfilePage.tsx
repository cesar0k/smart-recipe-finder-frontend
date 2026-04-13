import { Link, useParams } from "react-router-dom";
import { User, CalendarDays, ChefHat, Shield, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Header } from "@/components/layout/Header";
import { BackButton } from "@/components/BackButton";
import { RecipeCard } from "@/features/recipes/components/RecipeCard";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";

import { useGetUserProfile } from "@/api/users/users";
import { useReadUserRecipes } from "@/api/recipes/recipes";

const ROLE_BADGE: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
  admin: {
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
    label: "Admin",
    cls: "bg-red-100 text-red-700 border-red-200",
  },
  moderator: {
    icon: <Shield className="w-3.5 h-3.5" />,
    label: "Moderator",
    cls: "bg-blue-100 text-blue-700 border-blue-200",
  },
};

export function PublicProfilePage() {
  const { t, i18n } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const uid = parseInt(userId || "0", 10);

  const { data: profile, isLoading: profileLoading } = useGetUserProfile(uid, {
    query: { enabled: uid > 0 },
  });
  const { data: recipes, isLoading: recipesLoading } = useReadUserRecipes(
    uid,
    undefined,
    { query: { enabled: uid > 0 } }
  );

  const isLoading = profileLoading || recipesLoading;

  const formatJoinDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      month: "long",
      year: "numeric",
    });
  };

  const roleBadge = profile?.role ? ROLE_BADGE[profile.role] : null;

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header leftContent={<BackButton />} />

      <main className="container mx-auto px-4 py-8 md:py-12">
        {isLoading && (
          <div className="flex justify-center py-10">
            <Spinner size="lg" className="text-gray-300" />
          </div>
        )}

        {!isLoading && !profile && (
          <div className="text-center py-10">
            <p className="text-gray-500">{t("user_not_found")}</p>
          </div>
        )}

        {profile && (
          <>
            {/* Profile header */}
            <div className="flex flex-col items-center text-center mb-10 space-y-3">
              {/* Avatar */}
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-9 h-9 text-gray-400" />
                </div>
              )}

              {/* Name + role */}
              <div className="space-y-1">
                {profile.display_name && (
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.display_name}
                  </h1>
                )}
                <p className={`text-gray-500 ${profile.display_name ? "text-sm" : "text-2xl font-bold text-gray-900"}`}>
                  {profile.display_name ? `@${profile.username}` : profile.username}
                </p>
                {roleBadge && (
                  <Badge
                    variant="outline"
                    className={`text-xs gap-1 ${roleBadge.cls}`}
                  >
                    {roleBadge.icon}
                    {roleBadge.label}
                  </Badge>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  {t("user_joined", { date: formatJoinDate(profile.created_at) })}
                </div>
                <div className="flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-gray-400" />
                  {t("user_recipe_count", { count: profile.recipe_count })}
                </div>
              </div>
            </div>

            {/* Recipes */}
            {recipes && recipes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe) => (
                  <Link
                    key={recipe.id}
                    to={`/recipe/${recipe.id}`}
                    className="block"
                  >
                    <RecipeCard
                      title={recipe.title || t("untitled_recipe")}
                      time={recipe.cooking_time_in_minutes || 0}
                      difficulty={recipe.difficulty}
                      image={recipe.image_urls?.[0] || ""}
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-10">
                {t("user_no_recipes")}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
