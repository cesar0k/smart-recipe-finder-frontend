import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  User,
  CalendarDays,
  ChefHat,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { BackButton } from "@/components/BackButton";
import { RecipeCard } from "@/features/recipes/components/RecipeCard";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { CreateRecipeSheet } from "@/features/recipes/components/CreateRecipeSheet";
import { EditRecipeSheet } from "@/features/recipes/components/EditRecipeSheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useGetUserProfile } from "@/api/users/users";
import {
  useReadUserRecipes,
  useReadMyRecipes,
  getReadMyRecipesQueryKey,
  getReadUserRecipesQueryKey,
  useDeleteRecipe,
} from "@/api/recipes/recipes";
import { useAuth } from "@/lib/auth/auth-context";
import type { Recipe } from "@/api/model";

const ROLE_BADGE: Record<
  string,
  { icon: React.ReactNode; label: string; cls: string }
> = {
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
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const uid = parseInt(userId || "0", 10);

  const isOwnProfile = !!user && user.id === uid;
  const canModerate = hasRole("moderator", "admin");
  const canViewStatus = isOwnProfile || canModerate;
  // Moderators/admins can edit & delete recipes they don't own
  const canManageOthers = !isOwnProfile && canModerate;

  const { data: profile, isLoading: profileLoading } = useGetUserProfile(uid, {
    query: { enabled: uid > 0 },
  });

  // For own profile — use /my/ endpoint (shows pending, rejected, drafts)
  // For others — use /user/:id endpoint (shows only approved)
  const { data: myRecipes, isLoading: myRecipesLoading } = useReadMyRecipes(
    undefined,
    { query: { enabled: isOwnProfile } },
  );
  const { data: userRecipes, isLoading: userRecipesLoading } =
    useReadUserRecipes(uid, undefined, {
      query: { enabled: uid > 0 && !isOwnProfile },
    });

  const recipes = isOwnProfile ? myRecipes : userRecipes;
  const recipesLoading = isOwnProfile ? myRecipesLoading : userRecipesLoading;
  const isLoading = profileLoading || recipesLoading;

  // Edit/delete state
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<Recipe | null>(null);
  const { mutateAsync: deleteRecipe, isPending: isDeleting } =
    useDeleteRecipe();

  const invalidateRecipesCache = () => {
    if (isOwnProfile) {
      queryClient.invalidateQueries({ queryKey: getReadMyRecipesQueryKey() });
    } else {
      queryClient.invalidateQueries({
        queryKey: getReadUserRecipesQueryKey(uid),
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingRecipe) return;
    try {
      await deleteRecipe({ recipeId: deletingRecipe.id });
      toast.success(t("toast_deleted"));
      invalidateRecipesCache();
    } catch {
      toast.error(t("toast_error_delete"));
    } finally {
      setDeletingRecipe(null);
    }
  };

  const formatJoinDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      month: "long",
      year: "numeric",
    });
  };

  const roleBadge = profile?.role ? ROLE_BADGE[profile.role] : null;

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header
        leftContent={<BackButton />}
        rightContent={isOwnProfile ? <CreateRecipeSheet /> : undefined}
      />

      <main className="container mx-auto px-4 py-6 md:py-7">
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
            <div className="flex flex-col items-center text-center mb-6 space-y-2">
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
              <div className="space-y-2">
                {profile.display_name && (
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.display_name}
                  </h1>
                )}
                <p
                  className={`text-gray-500 ${profile.display_name ? "text-sm" : "text-2xl font-bold text-gray-900"}`}
                >
                  {profile.display_name
                    ? `@${profile.username}`
                    : profile.username}
                </p>
                <div className="flex items-center justify-center gap-2">
                  {roleBadge && (
                    <Badge
                      variant="outline"
                      className={`text-xs gap-1 ${roleBadge.cls}`}
                    >
                      {roleBadge.icon}
                      {roleBadge.label}
                    </Badge>
                  )}
                  {isOwnProfile && (
                    <span className="text-xs text-gray-400">
                      {t("recipe_author_you")}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  {t("user_joined", {
                    date: formatJoinDate(profile.created_at),
                  })}
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
                      thumbnail={recipe.thumbnail_urls?.[0]}
                      status={canViewStatus ? recipe.status : undefined}
                      hasPendingDraft={
                        canViewStatus ? recipe.has_pending_draft : undefined
                      }
                      rejectionReason={
                        canViewStatus ? recipe.rejection_reason : undefined
                      }
                      onResubmit={
                        isOwnProfile && recipe.status === "rejected"
                          ? () => setEditingRecipe(recipe)
                          : undefined
                      }
                      onEdit={
                        canManageOthers
                          ? () => setEditingRecipe(recipe)
                          : undefined
                      }
                      onDelete={
                        (isOwnProfile && recipe.status === "rejected") ||
                        canManageOthers
                          ? () => setDeletingRecipe(recipe)
                          : undefined
                      }
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-10">
                {isOwnProfile
                  ? t("my_recipes_empty")
                  : t("user_no_recipes")}
              </p>
            )}
          </>
        )}
      </main>

      {/* Edit sheet — resubmit for owner, regular edit for moderators */}
      {editingRecipe && (
        <EditRecipeSheet
          recipe={editingRecipe}
          open={!!editingRecipe}
          onOpenChange={(open) => {
            if (!open) setEditingRecipe(null);
          }}
          onSuccess={() => {
            setEditingRecipe(null);
            invalidateRecipesCache();
          }}
          resubmitMode={isOwnProfile}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deletingRecipe}
        onOpenChange={(open) => {
          if (!open) setDeletingRecipe(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_dialog_title")}</AlertDialogTitle>
            <AlertDialogDescription className="[word-break:break-word]">
              {t("delete_dialog_desc", { title: deletingRecipe?.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              {t("cancel_btn")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white border-none rounded-full"
              disabled={isDeleting}
            >
              {isDeleting ? t("deleting") : t("delete_btn")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
