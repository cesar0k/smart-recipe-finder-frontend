import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MoreVertical, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { EditRecipeSheet } from "@/features/recipes/components/EditRecipeSheet";
import { Header } from "@/components/layout/Header";
import { BackButton } from "@/components/BackButton";
import { RecipePageSkeleton } from "@/components/skeletons/RecipePageSkeleton";

import { useRecipeDetails } from "../features/recipes/hooks/useRecipeDetails";
import { useDeleteRecipeLogic } from "../features/recipes/hooks/useDeleteRecipeLogic";
import { RecipeHeaderInfo } from "@/features/recipes/components/RecipeHeaderInfo";
import { RecipeGallery } from "@/features/recipes/components/RecipeGallery";
import { SimilarRecipesSection } from "@/features/recipes/components/SimilarRecipesSection";
import { useSimilarRecipes } from "@/features/recipes/hooks/useSimilarRecipes";
import { RecipeComments } from "@/features/recipes/components/RecipeComments";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/auth-context";
import { useDismissSplash } from "@/hooks/useDismissSplash";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

// ── Bottom tabs: Similar | Comments ──────────────────────────────────────────

export type RecipeTab = "similar" | "comments";

function RecipeBottomTabs({
  recipeId,
  recipeOwnerId,
  commentsCount,
  activeTab,
  onTabChange,
  commentsEverShown,
  onShowComments,
}: {
  recipeId: number;
  recipeOwnerId?: number;
  commentsCount: number;
  activeTab: RecipeTab;
  onTabChange: (tab: RecipeTab) => void;
  commentsEverShown: boolean;
  onShowComments: () => void;
}) {
  const { t } = useTranslation();
  const { similar, isLoading: isSimilarLoading, isError: isSimilarError } = useSimilarRecipes(recipeId);
  // Hide the "Similar" tab when there genuinely are no similar recipes
  // (request succeeded with an empty list). Keep it while loading or on error
  // so the user still sees a status message in that case.
  const hasSimilar = isSimilarLoading || isSimilarError || similar.length > 0;

  // If the active tab is "similar" but there are none — force-switch to comments.
  useEffect(() => {
    if (!hasSimilar && activeTab === "similar") {
      onTabChange("comments");
      onShowComments();
    }
  }, [hasSimilar, activeTab, onTabChange, onShowComments]);

  const tab = activeTab;

  const [panelMinHeight, setPanelMinHeight] = useState<number | undefined>(undefined);

  const handleTabClick = (next: RecipeTab) => {
    if (next === tab) return;
    if (next === "comments") onShowComments();

    // Only lock panel height when switching TO comments (prevents collapse during load).
    // When switching back to similar, just let it shrink naturally.
    if (next === "comments") {
      const panelEl = document.getElementById("tab-panel-container");
      if (panelEl) setPanelMinHeight(panelEl.offsetHeight);
    }

    const savedScroll = window.scrollY;
    onTabChange(next);

    if (next === "comments") {
      // Preserve scroll position when switching to comments
      requestAnimationFrame(() =>
        requestAnimationFrame(() => window.scrollTo(0, savedScroll))
      );
    }
    // When switching back to similar — don't force scroll,
    // let the browser auto-correct if scrollY exceeds new page height.

    setTimeout(() => setPanelMinHeight(undefined), 600);
  };

  const tabs = [
    ...(hasSimilar
      ? [{ id: "similar" as const, label: t("similar_recipes_title") }]
      : []),
    {
      id: "comments" as const,
      label: commentsCount > 0
        ? `${t("comments_title")} (${commentsCount})`
        : t("comments_title"),
    },
  ];

  return (
    <div id="recipe-tabs" className="mt-8">
      {/* Tab bar */}
      <div className="container mx-auto px-4">
        <div className="flex justify-center">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id)}
              className={[
                "relative px-8 py-3 text-sm font-medium transition-colors",
                tab === item.id ? "text-gray-900" : "text-gray-400 hover:text-gray-700",
              ].join(" ")}
            >
              {item.label}
              {tab === item.id && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full"
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab panels — min-height locked during tab switch to prevent scroll jump */}
      <div
        id="tab-panel-container"
        className="container mx-auto px-4 py-8"
        style={{
          overflowAnchor: "none",
          minHeight: panelMinHeight,
          transition: undefined,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {tab === "similar" ? (
            <motion.div
              key="similar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0 } }}
              transition={{ duration: 0.15 }}
            >
              <SimilarRecipesSection recipeId={recipeId} />
            </motion.div>
          ) : (
            <motion.div
              key="comments"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0 } }}
              transition={{ duration: 0.15 }}
              className="max-w-3xl mx-auto"
            >
              {commentsEverShown && <RecipeComments recipeId={recipeId} recipeOwnerId={recipeOwnerId} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function RecipePage() {
  useDismissSplash();
  const { recipe, isLoading, isError, isValidId, refetch } = useRecipeDetails();
  const { deleteRecipe, isDeleting } = useDeleteRecipeLogic();
  const { t } = useTranslation();
  useDocumentTitle(recipe?.title || null);
  const { user, hasRole } = useAuth();
  const { hash } = useLocation();
  const isCommentsHash = hash === "#comments" || hash.startsWith("#comment-");
  const [activeTab, setActiveTab] = useState<RecipeTab>(
    isCommentsHash ? "comments" : "similar"
  );
  const [commentsEverShown, setCommentsEverShown] = useState(isCommentsHash);
  const showComments = () => setCommentsEverShown(true);

  // When navigated from a notification — switch tab, scroll, highlight the comment.
  // Runs on every hash change so it works even when already on the recipe page.
  useEffect(() => {
    if (!isCommentsHash || isLoading || !recipe) return;

    // Always switch to comments tab
    setActiveTab("comments");
    setCommentsEverShown(true);

    const tabsEl = document.getElementById("recipe-tabs");
    if (hash.startsWith("#comment-")) {
      const commentId = hash.slice("#comment-".length);
      // Give comments time to render, then scroll + highlight
      const timer = setTimeout(() => {
        const commentEl = document.getElementById(`comment-${commentId}`);
        if (commentEl) {
          commentEl.scrollIntoView({ behavior: "smooth", block: "center" });
          // Add highlight class, then fade it out via transition
          commentEl.classList.add("comment-highlight");
          setTimeout(() => commentEl.classList.remove("comment-highlight"), 2000);
        } else {
          tabsEl?.scrollIntoView({ behavior: "smooth" });
        }
      }, 450);
      return () => clearTimeout(timer);
    } else {
      tabsEl?.scrollIntoView({ behavior: "smooth" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, isLoading, recipe]);

  const canModify =
    !!user &&
    (user.id === recipe?.owner_id || hasRole("moderator", "admin"));

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white font-sans pb-16 md:pb-0">
        <Header leftContent={<BackButton />} />
        <main className="container mx-auto px-4 py-8 md:py-12">
          <RecipePageSkeleton />
        </main>
      </div>
    );
  }

  if (isError || !isValidId || !recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {t("recipe_not_found_title")}
        </h2>
        <p className="text-gray-500">{t("recipe_not_found_desc")}</p>
        <Link to="/">
          <Button variant="outline">{t("back_to_home")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans pb-16 md:pb-0">
      <Header
        leftContent={<BackButton />}
        rightContent={
          canModify ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-2xl">
                <DropdownMenuItem
                  className="rounded-full"
                  onClick={() => setIsEditOpen(true)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  {t("edit_recipe")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-full"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("delete_recipe")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : undefined
        }
      />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-10 lg:gap-16">
          {/* Left side */}
          <div className="space-y-8">
            {/* Image */}
            <RecipeGallery
              images={recipe.image_urls || []}
              thumbnails={recipe.thumbnail_urls || []}
              title={recipe.title || ""}
            />

            {/* Mobile version of title */}
            <div className="lg:hidden">
              <RecipeHeaderInfo
                recipe={recipe}
                canViewStatus={canModify}
                onScrollToComments={() => {
                  showComments();
                  setActiveTab("comments");
                  document.getElementById("recipe-tabs")?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            </div>

            {/* Ingredients */}
            <div className="bg-gray-50 rounded-[2rem] p-8 space-y-5">
              <h3 className="font-bold text-xl text-gray-900 flex items-center gap-3">
                {t("ingredients")}
              </h3>
              <ul className="space-y-3">
                {recipe.ingredients?.map((ingredient, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-gray-700"
                  >
                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                    <span className="leading-relaxed text-lg font-medium break-words min-w-0">
                      {typeof ingredient === "string"
                        ? ingredient
                        : ingredient.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right side */}
          <div className="space-y-8">
            <div className="hidden lg:block">
              <RecipeHeaderInfo
                recipe={recipe}
                canViewStatus={canModify}
                onScrollToComments={() => {
                  showComments();
                  setActiveTab("comments");
                  document.getElementById("recipe-tabs")?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            </div>

            {/* Separator removed — was barely visible on white */}

            {/* Instructions */}
            <div className="space-y-6">
              <h3 className="font-bold text-2xl text-gray-900">
                {t("instructions")}
              </h3>
              <div className="prose prose-gray max-w-none text-gray-600 space-y-6 text-lg leading-relaxed break-words">
                {(recipe.instructions || "").split("\n").map((step, index) => (
                  <p key={index}>{step}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {recipe.status === "approved" && (
          <RecipeBottomTabs
            recipeId={recipe.id}
            recipeOwnerId={recipe.owner_id ?? undefined}
            commentsCount={recipe.comments_count ?? 0}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            commentsEverShown={commentsEverShown}
            onShowComments={showComments}
          />
        )}
      </main>

      {/* Edit sheet */}
      {recipe && (
        <EditRecipeSheet
          recipe={recipe}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSuccess={refetch}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_dialog_title")}</AlertDialogTitle>
            <AlertDialogDescription className="[word-break:break-word]">
              {t("delete_dialog_desc", { title: recipe.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              {t("cancel_btn")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRecipe(recipe.id)}
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
