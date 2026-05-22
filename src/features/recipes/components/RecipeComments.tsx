import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, MessageSquare, Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useListRecipeComments,
  useCreateRecipeComment,
  useDeleteRecipeComment,
  useReportRecipeComment,
} from "@/api/comments/comments";
import type { CommentResponse } from "@/api/model";

// ── Comment Form ──────────────────────────────────────────────────────────────

interface CommentFormProps {
  recipeId: number;
  parentCommentId?: number;
  // Called on successful POST. Receives the freshly-created comment so the
  // parent can splice it into the rendered list without round-tripping a
  // refetch. When undefined (e.g. the form is used purely to close itself
  // on submit), the parent has its own way of reacting to success.
  onCreated?: (newComment: CommentResponse) => void;
  onClose?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

function CommentForm({
  recipeId,
  parentCommentId,
  onCreated,
  onClose,
  placeholder,
  autoFocus = false,
}: CommentFormProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState("");
  const { mutate: createComment, isPending } = useCreateRecipeComment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isPending) return;

    createComment(
      {
        recipeId,
        data: { content: content.trim(), parent_comment_id: parentCommentId ?? null },
      },
      {
        onSuccess: (newComment) => {
          setContent("");
          toast.success(t("comment_toast_posted"));
          onCreated?.(newComment);
          onClose?.();
        },
        onError: () => toast.error(t("comment_toast_error")),
      }
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="shrink-0 w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-sm text-gray-600">
            {t("comment_login_required")}
          </p>
        </div>
        <Link to="/login" className="sm:shrink-0">
          <Button
            type="button"
            size="sm"
            className="rounded-full bg-black hover:bg-gray-800 w-full sm:w-auto"
          >
            {t("login_btn")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder ?? t("comment_placeholder")}
        autoFocus={autoFocus}
        rows={parentCommentId ? 2 : 3}
        maxLength={2000}
        className="resize-none rounded-2xl border-gray-300 bg-white text-sm"
      />
      <div className="flex justify-end gap-2">
        {onClose && parentCommentId !== undefined && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full text-gray-500"
            onClick={onClose}
          >
            {t("close_btn")}
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || isPending}
          className="rounded-full"
        >
          {t("comment_submit")}
        </Button>
      </div>
    </form>
  );
}

// ── Single Comment Item ───────────────────────────────────────────────────────

interface CommentItemProps {
  comment: CommentResponse;
  recipeId: number;
  recipeOwnerId?: number;
  depth?: number;
  // Called after a successful soft-delete on the server, so the parent can
  // mark the comment as deleted in local state (no refetch). Receives the
  // deleted comment's id — works for both top-level comments and replies.
  onDeleted: (commentId: number) => void;
  onReplyCreated: (parentId: number, newReply: CommentResponse) => void;
}

function CommentItem({
  comment,
  recipeId,
  recipeOwnerId,
  depth = 0,
  onDeleted,
  onReplyCreated,
}: CommentItemProps) {
  const { t, i18n } = useTranslation();
  const { user, hasRole } = useAuth();
  const [replyOpen, setReplyOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [alreadyReported, setAlreadyReported] = useState(false);

  const { mutate: deleteComment, isPending: deleting } = useDeleteRecipeComment();
  const { mutate: reportComment, isPending: reporting } = useReportRecipeComment();

  const isOwn = !!user && user.id === comment.user_id;
  const isMod = hasRole("moderator", "admin");
  const canDelete = isOwn || isMod;
  const canReport = !!user && !isOwn && !alreadyReported;

  const timeAgo = (() => {
    const raw = comment.created_at;
    if (!raw) return "";
    const utcStr = /[Zz]$|[+-]\d{2}:\d{2}$/.test(raw) ? raw : raw + "Z";
    const ts = new Date(utcStr).getTime();
    if (!isFinite(ts)) return "";
    const diffMs = Date.now() - ts;
    const diffSec = Math.floor(diffMs / 1000);
    const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: "auto" });
    if (diffSec < 60) return rtf.format(-diffSec, "second");
    if (diffSec < 3600) return rtf.format(-Math.floor(diffSec / 60), "minute");
    if (diffSec < 86400) return rtf.format(-Math.floor(diffSec / 3600), "hour");
    if (diffSec < 2592000) return rtf.format(-Math.floor(diffSec / 86400), "day");
    if (diffSec < 31536000) return rtf.format(-Math.floor(diffSec / 2592000), "month");
    return rtf.format(-Math.floor(diffSec / 31536000), "year");
  })();

  const handleDelete = () => {
    deleteComment(
      { commentId: comment.id },
      {
        onSuccess: () => {
          toast.success(t("comment_toast_deleted"));
          onDeleted(comment.id);
        },
        onError: () => toast.error(t("comment_toast_error")),
      }
    );
  };

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    reportComment(
      { commentId: comment.id, data: { reason: reportReason.trim() } },
      {
        onSuccess: () => {
          toast.success(t("comment_toast_reported"));
          setReportOpen(false);
          setReportReason("");
          setAlreadyReported(true);
        },
        onError: (err: unknown) => {
          const msg =
            typeof err === "object" &&
            err !== null &&
            "response" in err &&
            typeof (err as { response?: { data?: { detail?: string } } }).response?.data?.detail === "string"
              ? (err as { response: { data: { detail: string } } }).response.data.detail
              : null;
          if (msg === "already_reported") {
            toast.info(t("comment_already_reported"));
            setAlreadyReported(true);
          } else {
            toast.error(t("comment_toast_error"));
          }
          setReportOpen(false);
        },
      }
    );
  };

  return (
    <div
      id={`comment-${comment.id}`}
      className={depth > 0 ? "pl-10" : ""}
    >
      <div className="flex gap-3 py-3">
        <UserAvatar
          src={comment.author_avatar_url ?? undefined}
          username={comment.author_username ?? undefined}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              to={`/user/${comment.user_id}`}
              className="text-sm font-semibold text-gray-900 hover:underline"
            >
              {comment.author_username ?? `User #${comment.user_id}`}
            </Link>
            {/* Role badge */}
            {comment.author_role === "admin" && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                {t("role_admin")}
              </span>
            )}
            {comment.author_role === "moderator" && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {t("role_moderator")}
              </span>
            )}
            {/* Recipe author badge */}
            {recipeOwnerId && comment.user_id === recipeOwnerId && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-900 text-white">
                {t("comment_recipe_author")}
              </span>
            )}
            <span className="text-xs text-gray-400">{timeAgo}</span>
          </div>

          {comment.is_deleted ? (
            <p className="text-sm text-gray-400 italic mt-1">{t("comment_deleted")}</p>
          ) : (
            <p className="text-sm text-gray-700 mt-1 leading-relaxed whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          )}

          {/* Actions */}
          {!comment.is_deleted && (
            <div className="flex items-center gap-3 mt-1.5">
              {depth === 0 && (
                <button
                  type="button"
                  onClick={() => setReplyOpen((v) => !v)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <Reply className="w-3.5 h-3.5" />
                  {t("comment_reply")}
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t("comment_delete")}
                </button>
              )}
              {canReport && (
                <button
                  type="button"
                  onClick={() => setReportOpen((v) => !v)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" />
                  {t("comment_report")}
                </button>
              )}
            </div>
          )}

          {/* Inline reply form — grid-rows trick animates height without jumping */}
          <motion.div
            initial={false}
            animate={{
              gridTemplateRows: replyOpen ? "1fr" : "0fr",
              opacity: replyOpen ? 1 : 0,
              marginTop: replyOpen ? 12 : 0,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="grid"
          >
            <div className="overflow-hidden">
              <CommentForm
                recipeId={recipeId}
                parentCommentId={comment.id}
                placeholder={t("comment_reply_placeholder")}
                autoFocus={replyOpen}
                onCreated={(newReply) => onReplyCreated(comment.id, newReply)}
                onClose={() => setReplyOpen(false)}
              />
            </div>
          </motion.div>

          {/* Inline report form */}
          <AnimatePresence initial={false}>
            {reportOpen && (
              <motion.form
                key="report-form"
                onSubmit={handleReport}
                initial={{ gridTemplateRows: "0fr", opacity: 0 }}
                animate={{ gridTemplateRows: "1fr", opacity: 1 }}
                exit={{ gridTemplateRows: "0fr", opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mt-3 grid"
              >
                <div className="overflow-hidden flex flex-col gap-2">
                <Textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder={t("comment_report_placeholder")}
                  rows={2}
                  maxLength={500}
                  autoFocus
                  className="resize-none rounded-2xl border-gray-300 bg-white text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setReportOpen(false)}
                  >
                    {t("close_btn")}
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!reportReason.trim() || reporting}
                    variant="outline"
                    className="rounded-full border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    {t("comment_report_submit")}
                  </Button>
                </div>
              </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-1">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              recipeId={recipeId}
              recipeOwnerId={recipeOwnerId}
              depth={1}
              onDeleted={onDeleted}
              onReplyCreated={onReplyCreated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Comments Section ─────────────────────────────────────────────────────

interface RecipeCommentsProps {
  recipeId: number;
  recipeOwnerId?: number;
}

export function RecipeComments({ recipeId, recipeOwnerId }: RecipeCommentsProps) {
  const { t } = useTranslation();
  const LIMIT = 20;

  const [pages, setPages] = useState<number[]>([0]); // list of skip offsets to fetch
  const [allComments, setAllComments] = useState<CommentResponse[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch current last page
  const currentSkip = pages[pages.length - 1] ?? 0;
  const { data: pageData, isLoading } = useListRecipeComments(recipeId, {
    skip: currentSkip,
    limit: LIMIT,
  });

  // Accumulate pages
  useEffect(() => {
    if (!pageData) return;
    if (currentSkip === 0) {
      setAllComments(pageData);
    } else {
      setAllComments((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newOnes = pageData.filter((c) => !existingIds.has(c.id));
        return [...prev, ...newOnes];
      });
    }
    setHasMore(pageData.length === LIMIT);
    setIsFetchingMore(false);
  }, [pageData, currentSkip]);

  const loadMore = useCallback(() => {
    if (!hasMore || isFetchingMore || isLoading) return;
    setIsFetchingMore(true);
    setPages((prev) => [...prev, (prev[prev.length - 1] ?? 0) + LIMIT]);
  }, [hasMore, isFetchingMore, isLoading]);

  // IntersectionObserver on sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // Splice a freshly-posted top-level comment into the head of the list so
  // it appears instantly without a refetch round-trip. The server response
  // contains the full CommentResponse (author info, timestamps, etc.) so
  // nothing else needs to be loaded.
  const handleCommentCreated = (newComment: CommentResponse) => {
    setAllComments((prev) => [newComment, ...prev]);
  };

  // Same idea for replies: append to the parent's replies array. Backend
  // only supports one level of nesting, so we match by parent id at the
  // top level only.
  const handleReplyCreated = (parentId: number, newReply: CommentResponse) => {
    setAllComments((prev) =>
      prev.map((c) =>
        c.id === parentId
          ? { ...c, replies: [...(c.replies ?? []), newReply] }
          : c
      )
    );
  };

  // Backend soft-deletes (sets is_deleted=true, clears content) — replies are
  // preserved. Mirror that locally so the UI updates instantly without the
  // "comments disappear then come back" flicker the old refetch path had
  // (refetch could return cached data with no new reference, so the useEffect
  // that fills allComments wouldn't fire and the list stayed empty).
  const handleCommentDeleted = (commentId: number) => {
    setAllComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return { ...c, is_deleted: true, content: "" };
        }
        if (c.replies && c.replies.some((r) => r.id === commentId)) {
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === commentId ? { ...r, is_deleted: true, content: "" } : r
            ),
          };
        }
        return c;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* New comment form */}
      <CommentForm recipeId={recipeId} onCreated={handleCommentCreated} />

      {/* Comment list */}
      {isLoading && allComments.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-24" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : allComments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">{t("comments_empty")}</p>
      ) : (
        <div className="divide-y divide-gray-200">
          {allComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              recipeId={recipeId}
              recipeOwnerId={recipeOwnerId}
              onDeleted={handleCommentDeleted}
              onReplyCreated={handleReplyCreated}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading spinner for subsequent pages */}
      {isFetchingMore && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
