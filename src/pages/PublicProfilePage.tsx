import { useCallback, useRef, useState } from "react";
import { EditProfileDialog } from "@/features/profile/components/EditProfileDialog";
import { Link, useParams } from "react-router-dom";
import {
  User,
  CalendarDays,
  ChefHat,
  Pencil,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { RecipeCard } from "@/features/recipes/components/RecipeCard";
import { FavoriteButton } from "@/features/recipes/components/FavoriteButton";
import { RecipeCardSkeleton } from "@/components/skeletons/RecipeCardSkeleton";
import { ProfileHeaderSkeleton } from "@/components/skeletons/ProfileHeaderSkeleton";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { CreateRecipeSheet } from "@/features/recipes/components/CreateRecipeSheet";
import { EditRecipeSheet } from "@/features/recipes/components/EditRecipeSheet";
import { RecipeLightbox } from "@/features/recipes/components/RecipeLightbox";
import { DeleteRecipeDialog } from "@/features/recipes/components/DeleteRecipeDialog";

import { useGetUserProfile } from "@/api/users/users";
import {
  readMyRecipes,
  readUserRecipes,
  getReadMyRecipesQueryKey,
  getReadUserRecipesQueryKey,
  useDeleteRecipe,
} from "@/api/recipes/recipes";
import { useAuth } from "@/lib/auth/auth-context";
import type { Recipe } from "@/api/model";
import { FollowButton } from "@/features/users/components/FollowButton";
import { useDismissSplash } from "@/hooks/useDismissSplash";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const PAGE_SIZE = 12;

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
  useDismissSplash();
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

  useDocumentTitle(profile?.username ? t("page_title_user", { username: profile.username }) : null);

  // Own profile uses /my/ (sees pending/rejected/drafts), others use /user/:id (approved only).
  const {
    data: infiniteData,
    isLoading: recipesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: isOwnProfile
      ? (getReadMyRecipesQueryKey() as unknown as readonly unknown[])
      : (getReadUserRecipesQueryKey(uid) as unknown as readonly unknown[]),
    queryFn: ({ pageParam = 0 }) =>
      isOwnProfile
        ? readMyRecipes({ skip: pageParam, limit: PAGE_SIZE })
        : readUserRecipes(uid, { skip: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return lastPageParam + PAGE_SIZE;
    },
    enabled: uid > 0,
  });

  const recipes: Recipe[] = infiniteData ? infiniteData.pages.flat() : [];
  const isLoading = profileLoading || recipesLoading;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { rootMargin: "200px" },
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  // Edit/delete state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<Recipe | null>(null);
  const [avatarLightboxOpen, setAvatarLightboxOpen] = useState(false);
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

  const handleDelete = async (recipeId: number) => {
    try {
      await deleteRecipe({ recipeId });
      toast.success(t("toast_deleted"));
      setDeletingRecipe(null);
      // Deferred so the AlertDialog can finish its exit animation.
      setTimeout(invalidateRecipesCache, 200);
    } catch {
      toast.error(t("toast_error_delete"));
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
    <div className="min-h-screen bg-white font-sans pb-16 md:pb-0">
      <Header
        rightContent={isOwnProfile ? <CreateRecipeSheet /> : undefined}
      />

      <main className="container mx-auto px-4 pt-6 pb-24 md:pb-7">
        {isLoading && (
          <>
            <ProfileHeaderSkeleton />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <RecipeCardSkeleton key={i} />
              ))}
            </div>
          </>
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
              {/* Avatar — clickable to open in a lightbox */}
              {profile.avatar_url ? (
                <button
                  type="button"
                  onClick={() => setAvatarLightboxOpen(true)}
                  className="cursor-zoom-in rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300"
                  aria-label={profile.username}
                >
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                </button>
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
                    <>
                      <span className="text-xs text-gray-400">
                        {t("recipe_author_you")}
                      </span>
                      <button
                        onClick={() => setEditProfileOpen(true)}
                        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        {t("edit_profile_btn")}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap justify-center">
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
                <Link
                  to={`/user/${uid}/followers`}
                  className="flex items-center gap-1.5 hover:text-gray-700 transition-colors"
                >
                  <Users className="w-4 h-4 text-gray-400" />
                  {t("followers_count", { count: profile.followers_count ?? 0 })}
                </Link>
              </div>

              {/* Follow button */}
              {!isOwnProfile && (
                <div className="pt-1">
                  <FollowButton
                    userId={uid}
                    isFollowing={profile.is_following ?? false}
                  />
                </div>
              )}
            </div>

            {/* Recipes */}
            {recipes.length > 0 ? (
              <>
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
                        ownerUsername={recipe.owner_username}
                        averageRating={recipe.average_rating}
                        favoritesCount={recipe.favorites_count}
                        status={canViewStatus ? recipe.status : undefined}
                        hasPendingDraft={
                          canViewStatus ? recipe.has_pending_draft : undefined
                        }
                        rejectionReason={
                          canViewStatus ? recipe.rejection_reason : undefined
                        }
                        imageOverlay={
                          recipe.status === "approved" ? (
                            <FavoriteButton
                              recipeId={recipe.id}
                              isFavorited={recipe.is_favorited ?? false}
                              compact
                            />
                          ) : undefined
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

                {hasNextPage && (
                  <div
                    ref={sentinelRef}
                    className="flex justify-center items-center py-8"
                  >
                    {isFetchingNextPage && <Spinner size="md" />}
                  </div>
                )}
              </>
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

      <DeleteRecipeDialog
        recipe={deletingRecipe}
        onOpenChange={(open) => {
          if (!open) setDeletingRecipe(null);
        }}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      <EditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
      />

      {/* Avatar lightbox — reuses RecipeLightbox for a single image */}
      {profile?.avatar_url && (
        <RecipeLightbox
          images={[profile.avatar_url]}
          initialIndex={0}
          open={avatarLightboxOpen}
          onOpenChange={setAvatarLightboxOpen}
        />
      )}
    </div>
  );
}
