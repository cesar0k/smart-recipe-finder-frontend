import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import { Header } from "@/components/layout/Header";
import { Spinner } from "@/components/ui/spinner";

import {
  useListPendingRecipes,
  useModerateRecipe,
  getListPendingRecipesQueryKey,
  useListPendingDrafts,
  useModerateDraft,
  getListPendingDraftsQueryKey,
} from "@/api/moderation/moderation";
import type { Recipe, RecipeDraftResponse } from "@/api/model";
import { useTranslation } from "react-i18next";

type Tab = "recipes" | "drafts";

export function ModerationPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("recipes");

  // Rejection dialog state
  const [rejectTarget, setRejectTarget] = useState<{
    type: "recipe" | "draft";
    id: number;
    title: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: pendingRecipes, isLoading: recipesLoading } =
    useListPendingRecipes();
  const { data: pendingDrafts, isLoading: draftsLoading } =
    useListPendingDrafts();

  const { mutateAsync: moderateRecipe, isPending: isModeratingRecipe } =
    useModerateRecipe();
  const { mutateAsync: moderateDraft, isPending: isModeratingDraft } =
    useModerateDraft();

  const handleApproveRecipe = async (id: number) => {
    try {
      await moderateRecipe({ recipeId: id, data: { action: "approve" } });
      toast.success(t("moderation_approved"));
      queryClient.invalidateQueries({
        queryKey: getListPendingRecipesQueryKey(),
      });
    } catch {
      toast.error(t("moderation_error"));
    }
  };

  const handleApproveDraft = async (id: number) => {
    try {
      await moderateDraft({ draftId: id, data: { action: "approve" } });
      toast.success(t("moderation_approved"));
      queryClient.invalidateQueries({
        queryKey: getListPendingDraftsQueryKey(),
      });
    } catch {
      toast.error(t("moderation_error"));
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget || !rejectionReason.trim()) return;

    try {
      if (rejectTarget.type === "recipe") {
        await moderateRecipe({
          recipeId: rejectTarget.id,
          data: { action: "reject", rejection_reason: rejectionReason },
        });
        queryClient.invalidateQueries({
          queryKey: getListPendingRecipesQueryKey(),
        });
      } else {
        await moderateDraft({
          draftId: rejectTarget.id,
          data: { action: "reject", rejection_reason: rejectionReason },
        });
        queryClient.invalidateQueries({
          queryKey: getListPendingDraftsQueryKey(),
        });
      }
      toast.success(t("moderation_rejected"));
    } catch {
      toast.error(t("moderation_error"));
    } finally {
      setRejectTarget(null);
      setRejectionReason("");
    }
  };

  const isModerating = isModeratingRecipe || isModeratingDraft;

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header
        leftContent={
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-600 hover:text-black"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-base">{t("back_btn")}</span>
          </Link>
        }
      />

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t("moderation_title")}
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            className={`inline-flex items-center h-9 px-4 text-sm font-medium rounded-full border transition-colors ${
              activeTab === "recipes"
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("recipes")}
          >
            {t("moderation_tab_recipes")}
            {pendingRecipes && pendingRecipes.length > 0 && (
              <span className="ml-2 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                {pendingRecipes.length}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`inline-flex items-center h-9 px-4 text-sm font-medium rounded-full border transition-colors ${
              activeTab === "drafts"
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("drafts")}
          >
            {t("moderation_tab_drafts")}
            {pendingDrafts && pendingDrafts.length > 0 && (
              <span className="ml-2 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                {pendingDrafts.length}
              </span>
            )}
          </button>
        </div>

        <Separator className="mb-6" />

        {/* Recipes tab */}
        {activeTab === "recipes" && (
          <>
            {recipesLoading && (
              <div className="flex justify-center py-10">
                <Spinner size="lg" className="text-gray-300" />
              </div>
            )}

            {!recipesLoading && (!pendingRecipes || pendingRecipes.length === 0) && (
              <p className="text-gray-500 text-center py-10">
                {t("moderation_no_pending_recipes")}
              </p>
            )}

            {pendingRecipes?.map((recipe: Recipe) => (
              <div
                key={recipe.id}
                className="border border-gray-100 rounded-2xl p-6 mb-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg text-gray-900 truncate">
                      {recipe.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      ID: {recipe.id} · Owner: {recipe.owner_id ?? "—"}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="rounded-full bg-green-600 hover:bg-green-700 gap-1"
                      onClick={() => handleApproveRecipe(recipe.id)}
                      disabled={isModerating}
                    >
                      <Check className="w-4 h-4" />
                      {t("moderation_approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-red-600 border-red-200 hover:bg-red-50 gap-1"
                      onClick={() =>
                        setRejectTarget({
                          type: "recipe",
                          id: recipe.id,
                          title: recipe.title || "",
                        })
                      }
                      disabled={isModerating}
                    >
                      <X className="w-4 h-4" />
                      {t("moderation_reject")}
                    </Button>
                  </div>
                </div>

                {recipe.ingredients && recipe.ingredients.length > 0 && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{t("ingredients")}:</span>{" "}
                    {recipe.ingredients.map((i) => i.name).join(", ")}
                  </p>
                )}

                {recipe.instructions && (
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {recipe.instructions}
                  </p>
                )}
              </div>
            ))}
          </>
        )}

        {/* Drafts tab */}
        {activeTab === "drafts" && (
          <>
            {draftsLoading && (
              <div className="flex justify-center py-10">
                <Spinner size="lg" className="text-gray-300" />
              </div>
            )}

            {!draftsLoading && (!pendingDrafts || pendingDrafts.length === 0) && (
              <p className="text-gray-500 text-center py-10">
                {t("moderation_no_pending_drafts")}
              </p>
            )}

            {pendingDrafts?.map((draft: RecipeDraftResponse) => (
              <div
                key={draft.id}
                className="border border-gray-100 rounded-2xl p-6 mb-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg text-gray-900 truncate">
                      {draft.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {t("moderation_draft_label")} #{draft.id} ·{" "}
                      {t("moderation_recipe_label")} #{draft.recipe_id} ·{" "}
                      {t("moderation_author_label")} #{draft.author_id}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="rounded-full bg-green-600 hover:bg-green-700 gap-1"
                      onClick={() => handleApproveDraft(draft.id)}
                      disabled={isModerating}
                    >
                      <Check className="w-4 h-4" />
                      {t("moderation_approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-red-600 border-red-200 hover:bg-red-50 gap-1"
                      onClick={() =>
                        setRejectTarget({
                          type: "draft",
                          id: draft.id,
                          title: draft.title,
                        })
                      }
                      disabled={isModerating}
                    >
                      <X className="w-4 h-4" />
                      {t("moderation_reject")}
                    </Button>
                  </div>
                </div>

                {draft.ingredients && draft.ingredients.length > 0 && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{t("ingredients")}:</span>{" "}
                    {draft.ingredients.map((i) => i.name).join(", ")}
                  </p>
                )}

                {draft.instructions && (
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {draft.instructions}
                  </p>
                )}
              </div>
            ))}
          </>
        )}
      </main>

      {/* Rejection dialog */}
      <AlertDialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectionReason("");
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("moderation_reject_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("moderation_reject_desc", { title: rejectTarget?.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder={t("moderation_reject_reason_placeholder")}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px] rounded-2xl"
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              {t("cancel_btn")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              className="bg-red-600 hover:bg-red-700 text-white border-none rounded-full"
              disabled={!rejectionReason.trim() || isModerating}
            >
              {t("moderation_reject_confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
