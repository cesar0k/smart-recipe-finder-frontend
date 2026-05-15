import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, X, Search, Trash2, ExternalLink, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import { BackButton } from "@/components/BackButton";
import { Spinner } from "@/components/ui/spinner";

import {
  useListPendingRecipes,
  useModerateRecipe,
  getListPendingRecipesQueryKey,
  useListPendingDrafts,
  useModerateDraft,
  getListPendingDraftsQueryKey,
  useListModerationHistory,
  getListModerationHistoryQueryKey,
  useDeleteModerationLog,
  useDeleteAllModerationHistory,
  useListReportedComments,
  useDismissCommentReports,
  getListReportedCommentsQueryKey,
  useGetPendingCount,
} from "@/api/moderation/moderation";
import { useDeleteRecipeComment } from "@/api/comments/comments";
import type { Recipe, RecipeDraftResponse, ModerationLogResponse, ReportedCommentResponse } from "@/api/model";
import { useTranslation } from "react-i18next";
import { useDismissSplash } from "@/hooks/useDismissSplash";

type Tab = "recipes" | "drafts" | "comments" | "history";

export function ModerationPage() {
  useDismissSplash();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab | null) ?? "recipes";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Rejection dialog state
  const [rejectTarget, setRejectTarget] = useState<{
    type: "recipe" | "draft";
    id: number;
    title: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // History search state
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState<string | undefined>(
    undefined
  );

  const { data: pendingRecipes, isLoading: recipesLoading } =
    useListPendingRecipes();
  const { data: pendingDrafts, isLoading: draftsLoading } =
    useListPendingDrafts();
  const { data: historyLogs, isLoading: historyLoading } =
    useListModerationHistory(
      {
        skip: 0,
        limit: 50,
        search: appliedSearch ?? null,
      },
      { query: { enabled: activeTab === "history" } }
    );

  const { data: pendingCount } = useGetPendingCount();
  const { data: reportedComments, isLoading: commentsLoading } =
    useListReportedComments(undefined, { query: { enabled: activeTab === "comments" } });

  const { mutateAsync: moderateRecipe, isPending: isModeratingRecipe } =
    useModerateRecipe();
  const { mutateAsync: moderateDraft, isPending: isModeratingDraft } =
    useModerateDraft();
  const { mutateAsync: deleteLog } = useDeleteModerationLog();
  const { mutateAsync: deleteAllHistory } = useDeleteAllModerationHistory();
  const { mutateAsync: dismissReports } = useDismissCommentReports();
  const { mutateAsync: deleteComment } = useDeleteRecipeComment();

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

    const queryKey =
      rejectTarget.type === "recipe"
        ? getListPendingRecipesQueryKey()
        : getListPendingDraftsQueryKey();

    try {
      if (rejectTarget.type === "recipe") {
        await moderateRecipe({
          recipeId: rejectTarget.id,
          data: { action: "reject", rejection_reason: rejectionReason },
        });
      } else {
        await moderateDraft({
          draftId: rejectTarget.id,
          data: { action: "reject", rejection_reason: rejectionReason },
        });
      }
      toast.success(t("moderation_rejected"));
      setRejectTarget(null);
      setRejectionReason("");
      // Deferred so the AlertDialog can finish its exit animation.
      setTimeout(() => queryClient.invalidateQueries({ queryKey }), 200);
    } catch {
      toast.error(t("moderation_error"));
      setRejectTarget(null);
      setRejectionReason("");
    }
  };

  const handleSearch = () => {
    const trimmed = searchInput.trim();
    setAppliedSearch(trimmed || undefined);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setAppliedSearch(undefined);
  };

  const handleDeleteLog = async (id: number) => {
    try {
      await deleteLog({ logId: id });
      queryClient.invalidateQueries({
        queryKey: getListModerationHistoryQueryKey(),
      });
    } catch {
      toast.error(t("moderation_error"));
    }
  };

  const handleDeleteAllHistory = async () => {
    try {
      await deleteAllHistory();
      queryClient.invalidateQueries({
        queryKey: getListModerationHistoryQueryKey(),
      });
    } catch {
      toast.error(t("moderation_error"));
    }
  };

  const handleDismissReports = async (commentId: number) => {
    try {
      await dismissReports({ commentId });
      toast.success(t("moderation_comment_dismissed"));
      queryClient.invalidateQueries({ queryKey: getListReportedCommentsQueryKey() });
    } catch {
      toast.error(t("moderation_error"));
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteComment({ commentId });
      toast.success(t("moderation_comment_deleted"));
      queryClient.invalidateQueries({ queryKey: getListReportedCommentsQueryKey() });
    } catch {
      toast.error(t("moderation_error"));
    }
  };

  const isModerating = isModeratingRecipe || isModeratingDraft;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingRecipeCount = pendingRecipes?.length ?? 0;
  const pendingDraftCount = pendingDrafts?.length ?? 0;
  // Use pending-count for the badge (available before entering the tab),
  // fall back to loaded data length once the tab is visited.
  const reportedCommentCount =
    pendingCount?.comment_reports ?? reportedComments?.length ?? 0;

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header leftContent={<BackButton />} />

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t("moderation_title")}
        </h1>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
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
            {pendingRecipeCount > 0 && (
              <span
                className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === "recipes"
                    ? "bg-white text-black"
                    : "bg-red-500 text-white"
                }`}
              >
                {pendingRecipeCount}
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
            {pendingDraftCount > 0 && (
              <span
                className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === "drafts"
                    ? "bg-white text-black"
                    : "bg-red-500 text-white"
                }`}
              >
                {pendingDraftCount}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`inline-flex items-center h-9 px-4 text-sm font-medium rounded-full border transition-colors ${
              activeTab === "comments"
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("comments")}
          >
            {t("moderation_tab_comments")}
            {reportedCommentCount > 0 && (
              <span
                className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === "comments"
                    ? "bg-white text-black"
                    : "bg-red-500 text-white"
                }`}
              >
                {reportedCommentCount}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`inline-flex items-center h-9 px-4 text-sm font-medium rounded-full border transition-colors ${
              activeTab === "history"
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("history")}
          >
            {t("moderation_tab_history")}
          </button>
        </div>

        <Separator className="mb-6" />

        {/* Comments tab */}
        {activeTab === "comments" && (
          <>
            {commentsLoading && (
              <div className="flex justify-center py-10">
                <Spinner size="lg" className="text-gray-300" />
              </div>
            )}
            {!commentsLoading && (!reportedComments || reportedComments.length === 0) && (
              <p className="text-gray-500 text-center py-10">
                {t("moderation_no_reported_comments")}
              </p>
            )}
            {reportedComments?.map((item: ReportedCommentResponse) => (
              <div
                key={item.comment_id}
                className="border border-orange-200 rounded-2xl p-6 mb-4 space-y-4 bg-orange-50/30"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">
                      {t("moderation_reported_comment_title")}
                    </span>
                    <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">
                      {t("moderation_comment_reports_count", { count: item.report_count })}
                    </span>
                  </div>
                  <Link
                    to={`/recipe/${item.recipe_id}#comment-${item.comment_id}`}
                    target="_blank"
                    className="text-xs text-gray-500 hover:text-black flex items-center gap-1 shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {item.recipe_title.length > 30
                      ? item.recipe_title.slice(0, 30) + "…"
                      : item.recipe_title}
                  </Link>
                </div>

                {/* Comment thread context */}
                <div className="space-y-2">
                  {/* Parent comment if this is a reply */}
                  {item.parent_comment_id && (
                    <div className="flex gap-3 opacity-70">
                      <MessageCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <div className="text-sm text-gray-600">
                        <Link
                          to={`/user/${item.author_id}`}
                          className="font-medium hover:underline mr-1"
                        >
                          {item.parent_author_username ?? t("deleted_user")}
                        </Link>
                        <span className="italic text-gray-400">
                          {item.parent_content || t("comment_deleted")}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* The reported comment */}
                  <div className="flex gap-3">
                    <MessageCircle className="w-4 h-4 text-orange-500 shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/user/${item.author_id}`}
                        className="text-sm font-semibold text-gray-800 hover:underline"
                      >
                        {item.author_username ?? t("deleted_user")}
                      </Link>
                      <p className="text-sm text-gray-700 mt-0.5 bg-white border border-orange-200 rounded-xl px-4 py-3">
                        {item.content}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reports */}
                <div className="border-t border-orange-100 pt-3 space-y-1.5">
                  <p className="text-xs font-medium text-gray-500 tracking-wide">
                    {t("moderation_report_reasons")}
                  </p>
                  {item.reports.map((rep, idx) => (
                    <div key={idx} className="flex items-baseline gap-2 text-xs">
                      <Link
                        to={`/user/${rep.reporter_id}`}
                        className="font-medium text-gray-600 hover:underline shrink-0"
                      >
                        {rep.reporter_username ?? t("deleted_user")}
                      </Link>
                      <span className="text-gray-500">{rep.reason}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-full gap-2"
                    onClick={() => handleDeleteComment(item.comment_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("comment_delete")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full gap-2 border-gray-200"
                    onClick={() => handleDismissReports(item.comment_id)}
                  >
                    <Check className="w-4 h-4" />
                    {t("moderation_dismiss_reports")}
                  </Button>
                </div>
              </div>
            ))}
          </>
        )}

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
                className="border border-gray-200 rounded-2xl p-6 mb-4 space-y-3 bg-gray-50/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      to={`/recipe/${recipe.id}`}
                      className="font-semibold text-lg text-gray-900 truncate block hover:underline"
                    >
                      {recipe.title}
                      <ExternalLink className="w-3.5 h-3.5 inline ml-1.5 text-gray-400" />
                    </Link>
                    {recipe.owner_username && (
                      <p className="text-sm text-gray-500">
                        {t("moderation_author_label")}:{" "}
                        <Link
                          to={`/user/${recipe.owner_id}`}
                          className="text-gray-700 font-medium hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {recipe.owner_username}
                        </Link>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-green-600 border-green-200 hover:bg-green-50 gap-1"
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
                className="border border-gray-200 rounded-2xl p-6 mb-4 space-y-3 bg-gray-50/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      to={`/recipe/${draft.recipe_id}`}
                      className="font-semibold text-lg text-gray-900 truncate block hover:underline"
                    >
                      {draft.title}
                      <ExternalLink className="w-3.5 h-3.5 inline ml-1.5 text-gray-400" />
                    </Link>
                    <p className="text-sm text-gray-500">
                      {t("moderation_edit_for_recipe")} #{draft.recipe_id}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-green-600 border-green-200 hover:bg-green-50 gap-1"
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

        {/* History tab */}
        {activeTab === "history" && (
          <>
            {/* Search */}
            <div className="flex items-center gap-2 mb-6">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  placeholder={t("moderation_history_search_placeholder")}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9 rounded-full h-9 text-sm"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full h-9"
                onClick={handleSearch}
              >
                {t("moderation_history_search_btn")}
              </Button>
              {appliedSearch !== undefined && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full h-9 text-gray-500"
                  onClick={handleClearSearch}
                >
                  {t("moderation_history_clear_btn")}
                </Button>
              )}
              {historyLogs && historyLogs.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full h-9 text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto"
                  onClick={handleDeleteAllHistory}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  {t("moderation_history_clear_all")}
                </Button>
              )}
            </div>

            {historyLoading && (
              <div className="flex justify-center py-10">
                <Spinner size="lg" className="text-gray-300" />
              </div>
            )}

            {!historyLoading &&
              (!historyLogs || historyLogs.length === 0) && (
                <p className="text-gray-500 text-center py-10">
                  {t("moderation_history_empty")}
                </p>
              )}

            {historyLogs && historyLogs.length > 0 && (
              <div className="space-y-3">
                {historyLogs.map((log: ModerationLogResponse) => (
                  <div
                    key={log.id}
                    className="border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-50/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            log.action === "approve"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-red-100 text-red-700 border-red-200"
                          }`}
                        >
                          {log.action === "approve"
                            ? t("moderation_history_action_approve")
                            : t("moderation_history_action_reject")}
                        </Badge>
                        {log.recipe_title ? (
                          <Link
                            to={`/recipe/${log.recipe_id}`}
                            className="text-sm text-gray-700 font-medium hover:underline truncate"
                          >
                            {log.recipe_title}
                          </Link>
                        ) : log.recipe_id != null ? (
                          <Link
                            to={`/recipe/${log.recipe_id}`}
                            className="text-xs text-gray-500 hover:underline"
                          >
                            {t("moderation_history_recipe")} #{log.recipe_id}
                          </Link>
                        ) : null}
                      </div>
                      {log.reason && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          <span className="font-medium">
                            {t("moderation_history_reason")}:
                          </span>{" "}
                          {log.reason}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {log.moderator_username || `#${log.moderator_id}`}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(log.created_at)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full text-gray-300 hover:text-red-500"
                        onClick={() => handleDeleteLog(log.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
