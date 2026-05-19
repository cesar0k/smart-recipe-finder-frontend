import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Check, Trash2, X, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import {
  useGetUnreadCount,
  getGetUnreadCountQueryKey,
  getListNotificationsQueryKey,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
  listNotifications,
} from "@/api/notifications/notifications";
import type { NotificationResponse } from "@/api/model";
import { useAuth } from "@/lib/auth/auth-context";
import { useDismissSplash } from "@/hooks/useDismissSplash";
import { useRelativeTime } from "@/hooks/useRelativeTime";

const PAGE_SIZE = 20;

function useNotificationLink() {
  const { user } = useAuth();
  const profilePath = user ? `/user/${user.id}` : "/";
  return (n: NotificationResponse): string | null => {
    switch (n.type) {
      case "new_pending_recipe": return "/moderation";
      case "recipe_approved":
      case "draft_approved":
      case "draft_rejected":
        return n.recipe_id ? `/recipe/${n.recipe_id}` : null;
      case "recipe_rejected":
        return n.recipe_id ? `/recipe/${n.recipe_id}` : profilePath;
      case "recipe_deleted": return profilePath;
      case "new_comment":
      case "comment_reply":
        if (n.recipe_id && n.comment_id) return `/recipe/${n.recipe_id}#comment-${n.comment_id}`;
        return n.recipe_id ? `/recipe/${n.recipe_id}#comments` : null;
      case "comment_reported": return "/moderation";
      case "user_followed": return n.from_user_id ? `/user/${n.from_user_id}` : profilePath;
      case "followed_user_published":
        return n.recipe_id ? `/recipe/${n.recipe_id}` : null;
      default: return null;
    }
  };
}

function useNotificationText() {
  const { t } = useTranslation();
  return (n: NotificationResponse) => {
    const recipeName = n.title || "";
    switch (n.type) {
      case "new_comment": return { heading: t("notif_type_new_comment"), body: t("notif_body_new_comment", { title: recipeName }) };
      case "comment_reply": return { heading: t("notif_type_comment_reply"), body: t("notif_body_comment_reply", { title: recipeName }) };
      case "comment_reported": return { heading: t("notif_type_comment_reported"), body: t("notif_body_comment_reported", { title: recipeName }) };
      case "new_pending_recipe": return { heading: t("notif_type_new_pending"), body: t("notif_body_new_pending", { title: recipeName }) };
      case "recipe_approved": return { heading: t("notif_type_recipe_approved"), body: t("notif_body_recipe_approved", { title: recipeName }) };
      case "recipe_rejected": return { heading: t("notif_type_recipe_rejected"), body: n.message ? t("notif_body_recipe_rejected_reason", { title: recipeName, reason: n.message }) : t("notif_body_recipe_rejected", { title: recipeName }) };
      case "draft_approved": return { heading: t("notif_type_draft_approved"), body: t("notif_body_draft_approved", { title: recipeName }) };
      case "draft_rejected": return { heading: t("notif_type_draft_rejected"), body: n.message ? t("notif_body_draft_rejected_reason", { title: recipeName, reason: n.message }) : t("notif_body_draft_rejected", { title: recipeName }) };
      case "recipe_deleted": return { heading: t("notif_type_recipe_deleted"), body: t("notif_body_recipe_deleted", { title: recipeName }) };
      case "user_followed": return { heading: t("notif_type_user_followed"), body: t("notif_body_user_followed", { username: n.message }) };
      case "followed_user_published": return { heading: t("notif_type_followed_user_published"), body: t("notif_body_followed_user_published", { author: n.message, title: recipeName }) };
      default: return { heading: n.type, body: n.message };
    }
  };
}

export function NotificationsPage() {
  useDismissSplash();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const getNotifText = useNotificationText();
  const getNotificationLink = useNotificationLink();
  const formatRelativeTime = useRelativeTime();

  const { data: unreadData } = useGetUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: getListNotificationsQueryKey({ limit: PAGE_SIZE }),
    queryFn: ({ pageParam = 0 }) =>
      listNotifications({ skip: pageParam as number, limit: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _all, lastPageParam) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return (lastPageParam as number) + PAGE_SIZE;
    },
  });

  const notifications: NotificationResponse[] = infiniteData?.pages.flat() ?? [];

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
        },
        { threshold: 0.1 },
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const { mutateAsync: markRead } = useMarkNotificationRead();
  const { mutateAsync: markAllRead } = useMarkAllNotificationsRead();
  const { mutateAsync: deleteOne } = useDeleteNotification();
  const { mutateAsync: deleteAll } = useDeleteAllNotifications();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetUnreadCountQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
  };

  const handleClick = async (n: NotificationResponse) => {
    if (!n.is_read) {
      await markRead({ notificationId: n.id });
      invalidateAll();
    }
    const link = getNotificationLink(n);
    if (link) navigate(link);
  };

  const handleMarkRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await markRead({ notificationId: id });
    invalidateAll();
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteOne({ notificationId: id });
    invalidateAll();
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    invalidateAll();
  };

  const handleDeleteAll = async () => {
    await deleteAll();
    invalidateAll();
  };

  return (
    <div className="min-h-screen bg-white font-sans pb-16 md:pb-0">
      <Header />
      <main className="container mx-auto px-4 pt-8 pb-24 md:pb-8 max-w-2xl">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6 gap-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight shrink-0">
            {t("nav_notifications")}
            {unreadCount > 0 && (
              <span className="ml-2 text-base font-normal text-blue-500">
                {unreadCount}
              </span>
            )}
          </h1>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 rounded-full text-gray-500 hover:text-gray-900 shrink-0"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline">{t("notifications_mark_all_read")}</span>
            </Button>
          )}
        </div>

        {/* List */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-sm">{t("notifications_empty")}</p>
          </div>
        )}

        {notifications.length > 0 && (
          <div className="divide-y divide-gray-200 rounded-2xl border border-gray-200 overflow-hidden">
            {notifications.map((n) => {
              const { heading, body } = getNotifText(n);
              const link = getNotificationLink(n);
              return (
                <div
                  key={n.id}
                  {...(link ? { role: "button", tabIndex: 0 } : {})}
                  className={`px-4 py-4 flex items-center gap-3 transition-colors ${
                    !n.is_read ? "bg-blue-50/50" : "bg-white"
                  } ${link ? "cursor-pointer hover:bg-gray-50" : ""}`}
                  onClick={() => handleClick(n)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleClick(n); }}
                >
                  <div className="w-2 shrink-0 flex justify-center">
                    {!n.is_read ? (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    ) : (
                      <div className="w-2 h-2" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{heading}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{body}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {!n.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-gray-400 hover:text-green-600"
                        onClick={(e) => handleMarkRead(n.id, e)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-gray-300 hover:text-red-500"
                      onClick={(e) => handleDelete(n.id, e)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            <div ref={sentinelCallbackRef} className="h-1" />
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* Clear all — inline on desktop */}
        {notifications.length > 0 && (
          <div className="hidden md:flex justify-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-red-600 gap-1.5 rounded-full"
              onClick={handleDeleteAll}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t("notifications_clear_all")}
            </Button>
          </div>
        )}
      </main>

      {/* Clear all — fixed above bottom nav on mobile */}
      {notifications.length > 0 && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 flex justify-center pb-2 bg-gradient-to-t from-white to-transparent pt-4 pointer-events-none">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-red-600 gap-1.5 rounded-full bg-white shadow-sm border border-gray-200 pointer-events-auto"
            onClick={handleDeleteAll}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t("notifications_clear_all")}
          </Button>
        </div>
      )}
    </div>
  );
}
